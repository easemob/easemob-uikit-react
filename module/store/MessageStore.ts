// import client from './agoraChatConfig';
import { chatSDK, ChatSDK } from '../SDK';
import { observable, action, computed, makeObservable, autorun, runInAction } from 'mobx';
import { CurrentConversation, Conversation } from './ConversationStore';
import type { ReactionData } from '../reaction/ReactionMessage';
import { getCvsIdFromMessage, getMessages, getMessageIndex, getReactionByEmoji } from '../utils';
import { RootStore } from './index';
import { AT_ALL } from '../messageInput/suggestList/SuggestList';
import { TextMessageType } from 'chatuim2/types/module/types/messageType';
import { eventHandler } from '../../eventHandler';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { NoticeMessageBody } from '../noticeMessage/NoticeMessage';
import {
  getGroupMemberIndexByUserId,
  getGroupItemFromGroupsById,
  getGroupMemberNickName,
  getMsgSenderNickname,
} from '../utils/index';

import { resetCache } from '../hooks/useHistoryMsg';

export interface Message {
  singleChat: { [key: string]: (ChatSDK.MessageBody | NoticeMessageBody)[] };
  groupChat: { [key: string]: (ChatSDK.MessageBody | NoticeMessageBody)[] };
  chatRoom: { [key: string]: (ChatSDK.MessageBody | NoticeMessageBody)[] };
  byId: { [key: string]: ChatSDK.MessageBody | NoticeMessageBody };
  broadcast: ChatSDK.MessageBody[];
}

export interface SelectedMessage {
  singleChat: {
    [key: string]: {
      selectable: boolean;
      selectedMessage: (ChatSDK.MessageBody | NoticeMessageBody)[];
    };
  };
  groupChat: {
    [key: string]: {
      selectable: boolean;
      selectedMessage: (ChatSDK.MessageBody | NoticeMessageBody)[];
    };
  };
}

export interface Typing {
  [key: string]: boolean;
}
class MessageStore {
  rootStore;
  message: Message;
  selectedMessage: SelectedMessage;
  currentCVS: CurrentConversation;
  repliedMessage: ChatSDK.MessageBody | null;
  typing: Typing;
  holding: boolean;
  unreadMessageCount: number;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    this.message = {
      singleChat: {},
      groupChat: {},
      chatRoom: {},
      byId: {},
      broadcast: [],
    };

    this.selectedMessage = {
      singleChat: {},
      groupChat: {},
      // chatRoom: {},
    };
    this.currentCVS = {} as CurrentConversation;
    this.repliedMessage = null;
    this.typing = {};
    this.holding = false;
    this.unreadMessageCount = 0;
    makeObservable(this, {
      currentCVS: observable,
      message: observable,
      selectedMessage: observable,
      repliedMessage: observable,
      typing: observable,
      unreadMessageCount: observable,
      setCurrentCVS: action,
      currentCvsMsgs: computed,
      sendMessage: action,
      receiveMessage: action,
      modifyMessage: action,
      sendChannelAck: action,
      updateMessageStatus: action,
      clearMessage: action,
      setRepliedMessage: action,
      addReaction: action,
      updateReactions: action,
      recallMessage: action,
      modifyLocalMessage: action,
      modifyServerMessage: action,
      translateMessage: action,
      setSelectedMessage: action,
      setTyping: action,
      sendTypingCmd: action,
      clear: action,
      deleteMessage: action,
      setHoldingStatus: action,
      setUnreadMessageCount: action,
      shiftBroadcastMessage: action,
    });

    autorun(() => {
      // console.log('message', this.message.singleChat.zd3);
    });
  }

  get currentCvsMsgs() {
    const { conversationId, chatType } = this.currentCVS;
    if (!conversationId || !chatType) {
      console.warn('No specified conversation.');
      return [];
    }
    return this.message[chatType][conversationId] || [];
  }

  setCurrentCVS(currentCVS: CurrentConversation) {
    this.currentCVS = currentCVS;
  }

  sendMessage(
    message:
      | ChatSDK.MessageBody
      | ChatSDK.ReadMsgBody
      | ChatSDK.DeliveryMsgBody
      | ChatSDK.ChannelMsgBody,
  ) {
    if (!message) {
      throw new Error('no message');
    }
    // @ts-ignore
    const { to, chatType } = message;
    // @ts-ignore
    message.bySelf = true;
    // @ts-ignore
    message.mid = '';
    message.from = this.rootStore.client?.context?.userId;
    // @ts-ignore
    if (this.message.byId[message.id]?.status !== 'failed') {
      // @ts-ignore
      message.status = 'sending';
    }
    // 添加引用消息
    if (
      this.repliedMessage != null &&
      message.type != 'read' &&
      message.type != 'delivery' &&
      message.type != 'channel'
    ) {
      const ext = message.ext || {};
      let msgPreview = '';
      switch (this.repliedMessage.type) {
        case 'txt':
          msgPreview = this.repliedMessage.msg;
          break;
        case 'img':
          msgPreview = '[Image]';
          break;
        case 'audio':
          msgPreview = '[Voice]';
          break;
        case 'video':
          msgPreview = '[Video]';
          break;
        case 'file':
          msgPreview = '[File]';
          break;
        case 'custom':
          msgPreview = '[Custom]';
          break;
        default:
          msgPreview = '[unknown]';
          break;
      }
      ext.msgQuote = {
        // @ts-ignore
        msgID: this.repliedMessage.mid || this.repliedMessage.id,
        msgPreview: msgPreview,
        msgSender:
          getMsgSenderNickname(this.repliedMessage as BaseMessageType) ||
          this.rootStore?.client?.user,
        msgType: this.repliedMessage.type,
      };
      message.ext = ext;
    }
    if (message.isChatThread) {
      const { currentThread } = this.rootStore.threadStore;
      // @ts-ignore
      message.chatThread = {
        parentId: currentThread.info?.parentId || currentThread.originalMessage.to,
      };
    }
    const myInfo = this.rootStore.addressStore.appUsersInfo[this.rootStore.client.user] || {};
    //聊天室消息，在消息的ext里添加自己的信息
    if (chatType === 'chatRoom') {
      (message as TextMessageType).ext = {
        ...(message as TextMessageType).ext,
        chatroom_uikit_userInfo: {
          userId: myInfo?.userId,
          nickname: myInfo?.nickname,
          avatarURL: myInfo?.avatarurl,
          gender: Number(myInfo?.gender),
          identify: myInfo?.ext?.identify,
        },
      };
    } else {
      if (chatType == 'groupChat') {
        const groupItem = getGroupItemFromGroupsById(to);
        if (groupItem) {
          const memberIdx =
            getGroupMemberIndexByUserId(groupItem, this.rootStore.client.user) ?? -1;
          if (memberIdx > -1) {
            const memberItem = groupItem?.members?.[memberIdx] || { userId: '', role: 'member' };
            myInfo.nickname = getGroupMemberNickName(memberItem);
          }
        }
      }
      (message as TextMessageType).ext = {
        ...(message as TextMessageType).ext,
        ease_chat_uikit_user_info: {
          nickname: myInfo?.nickname,
          avatarURL: myInfo?.avatarurl,
        },
      };
    }

    // @ts-ignore
    if (message.type != 'read' && message.type != 'delivery' && message.type != 'channel') {
      if (!this.message.byId[message.id]) {
        this.message.byId[message.id] = message;
      }
    }
    if (chatType !== 'chatRoom') {
      // @ts-ignore
      if (!this.message[chatType][to]) {
        // @ts-ignore
        this.message[chatType][to] = [this.message.byId[message.id]];
      } else {
        // 处理重发的消息，重发的消息不push
        // @ts-ignore
        if (this.message.byId[message.id].status !== 'failed') {
          // @ts-ignore
          this.message[chatType][to].push(this.message.byId[message.id]);
        }
      }
    }
    if (this.repliedMessage != null) {
      this.setRepliedMessage(null);
    }
    return this.rootStore.client
      .send(message as unknown as ChatSDK.MessageBody)
      .then((data: { serverMsgId: string }) => {
        if (chatType == 'chatRoom') {
          // @ts-ignore
          if (!this.message[chatType][to]) {
            runInAction(() => {
              // @ts-ignore
              this.message[chatType][to] = [this.message.byId[message.id]];
            });
          } else {
            // 处理重发的消息，重发的消息不push
            // @ts-ignore
            if (this.message.byId[message.id].status !== 'failed') {
              runInAction(() => {
                // @ts-ignore
                this.message[chatType][to].push(this.message.byId[message.id]);
              });
            }
          }
        }
        // message.status = 'sent';
        const msg = this.message.byId[message.id] || {};
        // @ts-ignore
        msg.status = 'sent';
        // @ts-ignore
        msg.mid = data.serverMsgId;
        // this.message.byId[data.serverMsgId] = { ...msg };

        if (message.type == 'combine') {
          let level = 0;
          //@ts-ignore
          message.messageList.forEach(item => {
            if (item.combineLevel > level) {
              level = item.combineLevel;
            }
          });
          //@ts-ignore
          msg.combineLevel = level + 1;
        }
        if ((message as ChatSDK.ImgMsgBody).url) {
          (msg as ChatSDK.ImgMsgBody).url = (message as ChatSDK.ImgMsgBody).url;
          if (msg && (msg as ChatSDK.ImgMsgBody).file) {
            // @ts-ignore
            msg.file.url = (message as ChatSDK.ImgMsgBody).url || '';
          }
        }

        runInAction(() => {
          this.message.byId[data.serverMsgId] = this.message.byId[message.id];
          // @ts-ignore
          this.message.byId[message.id].status = 'sent';
          // @ts-ignore
          this.message.byId[message.id].mid = data.serverMsgId;
          // @ts-ignore
          // const i = this.message[chatType][to].indexOf(this.message.byId[message.id]);
          // console.log('i--->', i, message);
          // @ts-ignore
          const i = this.message[chatType][to]?.findIndex(item => {
            if (item.id === data.serverMsgId || message.id === item.id) {
              return true;
            }
          });
          // @ts-ignore
          this.message[chatType][to].splice(i, 1, msg);
          // this.message[chatType][to][i] = msg;
        });
        // 更新会话last message
        let cvs: Conversation = this.rootStore.conversationStore.getConversation(
          // @ts-ignore
          message.chatType,
          to,
        ) as unknown as Conversation;
        // 没有会话时创建会话, thread 不创建会话
        if (message.isChatThread) {
          return;
        }
        if (!cvs) {
          cvs = {
            // @ts-ignore
            chatType: message.chatType,
            conversationId: message.to,
            lastMessage: message as unknown as Conversation['lastMessage'],
            unreadCount: 0,
          };
          this.rootStore.conversationStore.addConversation(cvs);
          return;
        }
        cvs.lastMessage = message as unknown as Conversation['lastMessage'];
        this.rootStore.conversationStore.modifyConversation({ ...cvs });
        eventHandler.dispatchSuccess('sendMessage');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        this.updateMessageStatus(message.id, 'failed');
        eventHandler.dispatchError('sendMessage', error);
        // throw error;
      });
  }

  receiveMessage(message: BaseMessageType) {
    const curCvs = this.rootStore.conversationStore.currentCvs;
    //@ts-ignore
    if (
      curCvs &&
      curCvs.chatType === message.chatType &&
      curCvs.conversationId === message.from &&
      message.chatType != 'chatRoom'
    ) {
      this.sendChannelAck(curCvs);
    }
    const isChatbot = message.from?.includes?.('chatbot_');
    if (isChatbot) {
      //@ts-ignore
      message.printed = false;
    }
    this.message.byId[message.id] = message;
    if (message.from !== this.rootStore.client.user) {
      // @ts-ignore
      message.bySelf = false;
    } else {
      // @ts-ignore
      message.bySelf = true;
    }
    const conversationId = getCvsIdFromMessage(message);
    // @ts-ignore
    if (message.broadcast) {
      this.message.broadcast.push(message);
      return;
    }
    // @ts-ignore
    if (!this.message[message.chatType][conversationId]) {
      // @ts-ignore
      this.message[message.chatType][conversationId] = [message];
    } else {
      const MAX_LENGTH = this.rootStore.initConfig.maxMessages || 200;
      if (this.message[message.chatType][conversationId].length > MAX_LENGTH) {
        this.message[message.chatType][conversationId].splice(
          0,
          this.message[message.chatType][conversationId].length - MAX_LENGTH,
        );
        // this.message[message.chatType][conversationId].shift();
        resetCache(message.chatType, conversationId);
      }
      this.message[message.chatType][conversationId].push(message);
    }
    // 是当前会话的消息，并且是holding状态， unreadMessageCount +1
    if (this.holding && this.currentCVS.conversationId == conversationId) {
      this.unreadMessageCount += 1;
    }

    // @ts-ignore
    if (message.isChatThread || message.chatThread) {
      return;
    }

    if (message.type === 'cmd') {
      return;
    }
    // @ts-ignore
    if (message.chatType == 'chatRoom') {
      // @ts-ignore
      const ext = message.ext || {};
      const senderInfo =
        typeof ext.chatroom_uikit_userInfo == 'string'
          ? JSON.parse(ext.chatroom_uikit_userInfo)
          : ext.chatroom_uikit_userInfo || {};
      const appUsersInfo = this.rootStore.addressStore.appUsersInfo;
      this.rootStore.addressStore.setAppUserInfo({
        ...appUsersInfo,
        [senderInfo.userId]: {
          nickname: senderInfo.nickname,
          userId: senderInfo.userId,
          avatarurl: senderInfo.avatarURL,
          gender: senderInfo.gender,
        },
      });
      return;
    }

    if (message.ext && message.ext.ease_chat_uikit_user_info) {
      const appUsersInfo = this.rootStore.addressStore.appUsersInfo;
      message.from &&
        appUsersInfo[message.from] == undefined &&
        this.rootStore.addressStore.setAppUserInfo({
          ...appUsersInfo,
          [message.from]: {
            nickname: message.ext.ease_chat_uikit_user_info.nickname,
            userId: message.from,
            avatarurl: message.ext.ease_chat_uikit_user_info.avatarURL,
          },
        });
    }

    const isCurrentCvs =
      // @ts-ignore
      this.currentCVS.chatType == message.chatType &&
      this.currentCVS.conversationId == conversationId;
    let cvs: Conversation = this.rootStore.conversationStore.getConversation(
      // @ts-ignore
      message.chatType,
      conversationId,
    ) as unknown as Conversation;

    // 没有会话时创建会话
    if (!cvs) {
      let name = '';
      const groupData = this.rootStore.addressStore.groups;
      groupData.forEach(group => {
        if (conversationId == group.groupid) {
          name = group.groupname;
        }
      });
      cvs = {
        // @ts-ignore
        chatType: message.chatType,
        conversationId: conversationId,
        lastMessage: message,
        unreadCount: isCurrentCvs ? 0 : 1,
        name: name,
      };
      this.rootStore.conversationStore.addConversation(cvs);
      return;
    }

    // 更新最后一条消息，置顶
    const lastTime = cvs.lastMessage.time;
    // @ts-ignore
    if (lastTime < message.time && !isCurrentCvs) {
      cvs.unreadCount = cvs.unreadCount + 1;
    }
    cvs.lastMessage = message;
    this.rootStore.conversationStore.topConversation({ ...cvs });
    // show at tag
    if (!isCurrentCvs && message.type === 'txt') {
      const mentionList = message?.ext?.em_at_list;
      if (mentionList && message.from !== this.rootStore.client.user) {
        if (mentionList === AT_ALL || mentionList.includes(this.rootStore.client.user)) {
          this.rootStore.conversationStore.setAtType(
            cvs.chatType,
            cvs.conversationId,
            mentionList === AT_ALL ? 'ALL' : 'ME',
          );
        }
      }
    }
  }

  modifyMessage(id: string, message: ChatSDK.MessageBody | NoticeMessageBody) {
    this.message.byId[id] = message;
  }

  sendChannelAck(cvs: CurrentConversation) {
    const channelMsg = chatSDK.message.create({
      type: 'channel',
      chatType: cvs.chatType,
      to: cvs.conversationId,
    });
    return this.rootStore.client.send(channelMsg);
  }

  updateMessageStatus(msgId: string, status: string) {
    setTimeout(() => {
      runInAction(() => {
        const msg = this.message.byId[msgId];
        if (!msg) {
          // ack message
          return; // console.error('not found message:', msgId);
        }
        const conversationId = getCvsIdFromMessage(msg as BaseMessageType);
        // @ts-ignore
        this.message.byId[msgId].status = status;
        // @ts-ignore
        const i = this.message[msg.chatType][conversationId]?.indexOf(this.message.byId[msg.id]); // 聊天室没发送成功的消息不会存，会找不到这个会话或消息
        if (typeof i === 'undefined' || i == -1) return;
        // @ts-ignore
        this.message[msg.chatType][conversationId].splice(i, 1, msg);
        // this.message[chatType][to][i] = msg;
      });
    }, 10);
  }

  addHistoryMsgs(cvs: CurrentConversation, msgs: any) {
    if (!cvs || !msgs.length) return;
    if (!this.message[cvs.chatType]?.[cvs.conversationId]) {
      this.message[cvs.chatType][cvs.conversationId] = msgs;
    } else {
      this.message[cvs.chatType][cvs.conversationId] = msgs.concat(
        this.message[cvs.chatType]?.[cvs.conversationId] || [],
      );
    }
  }

  clearMessage(cvs: CurrentConversation) {
    if (!cvs) return;
    this.rootStore.client.removeHistoryMessages({
      targetId: cvs.conversationId,
      chatType: cvs.chatType as 'singleChat' | 'groupChat',
      beforeTimeStamp: Date.now(),
    });
    this.message[cvs.chatType][cvs.conversationId] = [];
  }

  setRepliedMessage(message: ChatSDK.MessageBody | null) {
    if (typeof message === 'undefined') return;
    this.repliedMessage = message;
  }

  deleteMessage(cvs: CurrentConversation, messageId: string | string[]) {
    if (!cvs || !messageId) {
      throw new Error('deleteMessage params error');
    }

    let msgIds: string[] = [];
    if (Array.isArray(messageId)) {
      msgIds = messageId;
    } else {
      msgIds = [messageId];
    }

    const localMsgIds: string[] = [];
    msgIds = msgIds.filter(id => {
      if (id.length < 13) {
        localMsgIds.push(id);
      }
      return id.length > 13;
    });

    const _deleteMessage = (msgIds: string[]) => {
      const messages = this.message[cvs.chatType][cvs.conversationId];
      const filterMsgs = messages.filter(msg => {
        // @ts-ignore
        return !msgIds.includes(msg.id) && !msgIds.includes(msg.mid);
        // return msg.id != messageId && msg.mid != messageId;
      });
      runInAction(() => {
        this.message[cvs.chatType][cvs.conversationId] = filterMsgs;
      });
    };
    // delete local message
    if (localMsgIds.length > 0) {
      // console.log('删本地');
      return _deleteMessage(localMsgIds);
    }
    // delete server message
    return this.rootStore.client
      .removeHistoryMessages({
        targetId: cvs.conversationId,
        chatType: cvs.chatType as 'singleChat' | 'groupChat',
        messageIds: msgIds,
      })
      .then(() => {
        // console.log('删服务器');
        _deleteMessage(msgIds);
        const conversation: Conversation = this.rootStore.conversationStore.getConversation(
          // @ts-ignore
          cvs.chatType,
          cvs.conversationId,
        ) as unknown as Conversation;
        // @ts-ignore
        conversation.lastMessage = {};
        this.rootStore.conversationStore.modifyConversation(conversation);
        eventHandler.dispatchSuccess('removeHistoryMessages');
      })
      .catch(error => {
        eventHandler.dispatchError('removeHistoryMessages', error);
      });
  }

  recallMessage(
    cvs: CurrentConversation,
    messageId: string,
    isChatThread: boolean = false,
    recallMySelfMsg: boolean = false,
  ) {
    if (!cvs || !messageId) {
      throw new Error('recallMessage params error');
    }
    let conversation: Conversation = this.rootStore.conversationStore.getConversation(
      // @ts-ignore
      cvs.chatType,
      cvs.conversationId,
    ) as unknown as Conversation;

    if (!conversation && cvs.chatType == 'groupChat') {
      conversation = this.rootStore.conversationStore.getConversation(
        // @ts-ignore
        'chatRoom',
        cvs.conversationId,
      ) as unknown as Conversation;
    }

    // the others recall the message
    const messages = getMessages(conversation);
    if (!messages) return;
    const msgIndex = getMessageIndex(messages, messageId);
    if (!recallMySelfMsg) {
      if (msgIndex > -1) {
        const time = Date.now();
        const noticeMessage = new NoticeMessageBody({
          time,
          type: 'recall',
          noticeType: 'recall',
          ext: { ...messages[msgIndex] },
        });
        messages[msgIndex] = noticeMessage;
      }
      if (!conversation) return;
      //@ts-ignore
      conversation.lastMessage = messages[msgIndex];
      if (conversation.unreadCount > 0) {
        conversation.unreadCount -= 1;
      }
      // remove pinned message when recall message
      if (conversation.chatType !== 'singleChat') {
        this.rootStore.pinnedMessagesStore.deletePinnedMessage(
          conversation.chatType,
          conversation.conversationId,
          messageId,
        );
      }
      this.rootStore.conversationStore.modifyConversation(conversation);
      return;
    }

    // mySelf recall the message
    return this.rootStore.client
      .recallMessage({
        chatType: cvs.chatType,
        to: cvs.conversationId,
        mid: messageId,
        isChatThread,
      })
      .then(() => {
        const messages = getMessages(cvs);
        const msgIndex = getMessageIndex(messages, messageId);
        if (msgIndex > -1) {
          const time = Date.now();
          const noticeMessage = new NoticeMessageBody({
            time,
            type: 'recall',
            noticeType: 'recall',
            ext: { ...messages[msgIndex] },
          });
          messages[msgIndex] = noticeMessage;
          if (!conversation) return;
          // @ts-ignore
          conversation.lastMessage = messages[msgIndex];
          this.rootStore.conversationStore.modifyConversation(conversation);
          // remove pinned message when recall message
          if (conversation.chatType !== 'singleChat') {
            this.rootStore.pinnedMessagesStore.deletePinnedMessage(
              conversation.chatType,
              conversation.conversationId,
              messageId,
            );
          }
          eventHandler.dispatchSuccess('recallMessage');
        }
      })
      .catch(err => {
        eventHandler.dispatchError('recallMessage', err);
      });
  }

  addReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    if (!cvs || !messageId || !emoji) return;
    return this.rootStore.client
      .addReaction({
        messageId,
        reaction: emoji,
      })
      .then(() => {
        const messages = getMessages(cvs);
        const messageIndex = getMessageIndex(messages, messageId);
        if (messageIndex > -1) {
          runInAction(() => {
            const message = messages[messageIndex];
            const reaction = getReactionByEmoji(message, emoji);
            if (reaction) {
              reaction.count += 1;
              reaction.isAddedBySelf = true;
              reaction.userList.unshift(this.rootStore.client.user);
            } else {
              const newAction = {
                count: 1,
                isAddedBySelf: true,
                reaction: emoji,
                userList: [this.rootStore.client.user],
              };
              if (Array.isArray((message as BaseMessageType).reactions)) {
                // @ts-ignore
                messages[messageIndex].reactions.push(newAction);
              } else {
                // @ts-ignore
                messages[messageIndex].reactions = [newAction];
              }
            }
          });
        }
        // const filterMsgs = messages.filter(msg => {
        //   // @ts-ignore
        //   return msg.id != messageId && msg.mid != messageId;
        // });
        // this.message[cvs.chatType][cvs.conversationId] = filterMsgs;
        eventHandler.dispatchSuccess('addReaction');
      })
      .catch((err: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('addReaction', err);
      });
  }

  deleteReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    if (!cvs || !messageId || !emoji) {
      throw new Error('deleteReaction params error');
    }
    return this.rootStore.client
      .deleteReaction({
        messageId,
        reaction: encodeURIComponent(emoji),
      })
      .then(() => {
        const messages = getMessages(cvs);
        const messageIndex = getMessageIndex(messages, messageId);
        if (messageIndex > -1) {
          const message = messages[messageIndex];
          const reaction = getReactionByEmoji(message, emoji);
          if (reaction) {
            reaction.count -= 1;
            if (reaction.count <= 0) {
              (message as BaseMessageType).reactions?.splice(
                // @ts-ignore
                message.reactions?.indexOf(reaction),
                1,
              );
            }
            const index = reaction.userList?.indexOf(this.rootStore.client.user);
            if (index > -1) {
              reaction.userList.splice(index, 1);
            }
          }
        }
        eventHandler.dispatchSuccess('deleteReaction');
      })
      .catch((err: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('deleteReaction', err);
      });
  }

  updateReactions(cvs: CurrentConversation, messageId: string, reactions: ReactionData[]) {
    if (!cvs || !messageId) return;
    const messages = getMessages(cvs);
    const messageIndex = getMessageIndex(messages, messageId);
    const filterActs = reactions.filter(item => {
      return item.op?.length && item.op?.length > 0;
    });
    if (messageIndex > -1) {
      const message = messages[messageIndex];
      // has reaction list
      if (
        !(message as BaseMessageType).reactions ||
        (message as BaseMessageType).reactions?.length === 0
      ) {
        reactions.forEach((item: ReactionData) => {
          if (item.op) {
            item.isAddedBySelf = !!item?.op?.find(
              op => op.operator === this.rootStore.client.user && op.reactionType === 'create',
            );
          }
        });
        (message as BaseMessageType).reactions = reactions;
      } else {
        filterActs.forEach(item => {
          const reaction = getReactionByEmoji(message, item.reaction);
          if (reaction) {
            reaction.count = item.count;
            reaction.userList = item.userList;
            reaction.op = item.op;
            item?.op?.forEach(op => {
              if (op.operator === this.rootStore.client.user) {
                if (op.reactionType === 'create') {
                  reaction.isAddedBySelf = true;
                } else {
                  reaction.isAddedBySelf = false;
                }
              }
            });
            // @ts-ignore
            (message as BaseMessageType).reactions = [...message.reactions];
          } else {
            item.isAddedBySelf = !!item?.op?.find(
              op => op.operator === this.rootStore.client.user && op.reactionType === 'create',
            );
            // @ts-ignore
            message.reactions.push(item);
          }
        });
      }
    }
  }

  getReactionUserList(cvs: CurrentConversation, messageId: string, reaction: string) {
    if (!cvs || !messageId) return;
    return this.rootStore.client
      .getReactionDetail({
        messageId,
        reaction,
        pageSize: 100,
      })
      .then((data: ChatSDK.AsyncResult<ChatSDK.GetReactionDetailResult>) => {
        const reactionData = data.data;
        const messages = getMessages(cvs);
        const messageIndex = getMessageIndex(messages, messageId);
        if (!reactionData) return;
        if (messageIndex > -1) {
          const message = messages[messageIndex];
          // @ts-ignore
          message.reactions.userList = reactionData.userList;
        }
        eventHandler.dispatchSuccess('getReactionDetail');
      })
      .catch(error => {
        eventHandler.dispatchError('getReactionDetail', error);
      });
  }

  translateMessage(cvs: CurrentConversation, messageId: string, language: string) {
    if (!cvs || !messageId) {
      throw new Error('translateMessage params error');
    }
    const messages = getMessages(cvs);
    const messageIndex = getMessageIndex(messages, messageId);
    return new Promise((res, rej) => {
      if (messageIndex > -1) {
        const currentMsg = messages[messageIndex];
        if (currentMsg.type !== 'txt') {
          rej(false);
          return console.warn('message type is not txt');
        }
        this.rootStore.client
          .translateMessage({
            text: currentMsg.msg,
            languages: [language],
          })
          .then(data => {
            if (data.type == 0) {
              // @ts-ignore
              const translations = data.data[0]?.translations;
              // @ts-ignore
              currentMsg.translations = translations;
            }
            res(true);
            eventHandler.dispatchSuccess('translateMessage');
          })
          .catch(error => {
            rej(false);
            eventHandler.dispatchError('translateMessage', error);
          });
      }
    });
  }

  modifyLocalMessage(
    messageId: string,
    msg: ChatSDK.ModifiedEventMessage,
    isReceivedModify?: boolean,
  ) {
    if (msg.chatType !== 'chatRoom') {
      let cvsId = '';
      if (isReceivedModify) {
        cvsId = msg.chatType === 'groupChat' ? msg.to : msg.from || '';
      } else {
        cvsId = msg.to;
      }
      if (msg.chatType !== 'singleChat') {
        this.rootStore.pinnedMessagesStore.modifyPinnedMessage(msg.chatType, cvsId, msg);
      }
      const msgIndex = this.message[msg.chatType][cvsId].findIndex(
        //@ts-ignore
        msgItem => msgItem.id === messageId || msgItem.mid === messageId,
      );
      if (msgIndex > -1) {
        const msgItem = this.message[msg.chatType][cvsId][msgIndex];
        if (msg.type === 'txt' && msgItem.type === 'txt') {
          msgItem.msg = msg.msg;
          msgItem.modifiedInfo = msg.modifiedInfo;
          // delete translations when message was edited
          msgItem.translations = undefined;
        }
        if (msg.type === 'custom' && msgItem.type === 'custom') {
          msgItem.customEvent = msg.customEvent;
          msgItem.modifiedInfo = msg.modifiedInfo;
          msgItem.customExts = msg.customExts;
          msgItem.ext = msg.ext;
        }
      }
    }
  }

  modifyServerMessage(messageId: string, msg: ChatSDK.ModifiedMsg) {
    if (!messageId || !msg) {
      throw new Error('modifyServerMessage params error');
    }
    const { client } = this.rootStore;
    return client
      .modifyMessage({
        messageId,
        modifiedMessage: msg,
      })
      .then(res => {
        this.modifyLocalMessage(messageId, res.message);
        eventHandler.dispatchSuccess('modifyMessage');
      })
      .catch(err => {
        eventHandler.dispatchError('modifyMessage', err);
      });
  }

  setSelectedMessage(
    cvs: CurrentConversation,
    selectedData: {
      selectable: boolean;
      selectedMessage: (ChatSDK.MessageBody | NoticeMessageBody)[];
    },
  ) {
    this.selectedMessage[cvs.chatType as 'singleChat' | 'groupChat'][cvs.conversationId] =
      selectedData;
  }

  setTyping(cvs: CurrentConversation, typing: boolean) {
    if (cvs.chatType !== 'singleChat') return console.warn('typing is only for singleChat');

    this.typing[cvs.conversationId] = typing;
  }

  sendTypingCmd(cvs: CurrentConversation) {
    const option = {
      chatType: cvs.chatType,
      to: cvs.conversationId,
      type: 'cmd' as const,
      isChatThread: false,
      action: 'TypingBegin',
    };
    const msg = chatSDK.message.create(option);
    this.rootStore.client
      .send(msg)
      .then(() => {
        // console.log('send cmd success');
      })
      .catch((err: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('sendMessage', err);
      });
  }

  setHoldingStatus(status: boolean) {
    this.holding = status;
  }

  setUnreadMessageCount(count: number) {
    this.unreadMessageCount = count;
  }

  shiftBroadcastMessage() {
    this.message.broadcast.shift();
  }

  sendReadAck(messageId: string, to: string) {
    if (!messageId || !to) {
      return console.error(`Invalid parameter, messageId: ${messageId}, to: ${to}`);
    }

    const readMsg = chatSDK.message.create({
      type: 'read',
      chatType: 'singleChat',
      to: to,
      id: messageId,
    });
    this.rootStore.client.send(readMsg);
  }

  clear() {
    this.message = {
      singleChat: {},
      groupChat: {},
      byId: {},
      chatRoom: {},
      broadcast: [],
    };

    this.selectedMessage = {
      singleChat: {},
      groupChat: {},
    };
    this.currentCVS = {} as CurrentConversation;
    this.repliedMessage = null;
    this.typing = {};
  }
}

export default MessageStore;
