// import client from './agoraChatConfig';
import type { ChatSDK } from '../SDK';
import { observable, action, computed, makeObservable, autorun, runInAction } from 'mobx';
import { CurrentConversation, Conversation } from './ConversationStore';
import type { ReactionData } from '../reaction/ReactionMessage';
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getMessages,
  getMessageIndex,
  getMessageChatType,
  getMessageId,
  getCustomEvent,
  getReactionByEmoji,
  getTextContent,
} from '../utils';
import { RootStore } from './index';
import type { TextMessageType } from '../types/messageType';
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
let debounceTimer: any = null;
export interface Message {
  singleChat: { [key: string]: (ChatSDK.Message | NoticeMessageBody)[] };
  groupChat: { [key: string]: (ChatSDK.Message | NoticeMessageBody)[] };
  chatRoom: { [key: string]: (ChatSDK.Message | NoticeMessageBody)[] };
  byId: Map<string, ChatSDK.Message | NoticeMessageBody>;
  broadcast: ChatSDK.Message[];
}

export interface SelectedMessage {
  singleChat: {
    [key: string]: {
      selectable: boolean;
      selectedMessage: (ChatSDK.Message | NoticeMessageBody)[];
    };
  };
  groupChat: {
    [key: string]: {
      selectable: boolean;
      selectedMessage: (ChatSDK.Message | NoticeMessageBody)[];
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
  repliedMessage: ChatSDK.Message | null;
  typing: Typing;
  holding: boolean;
  unreadMessageCount: number;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    this.message = {
      singleChat: {},
      groupChat: {},
      chatRoom: {},
      byId: new Map(),
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
      addMessage: action,
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
      setKeyValue: action,
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

  setKeyValue(key: string, value: ChatSDK.Message | NoticeMessageBody) {
    const MAX_LENGTH = this.rootStore.initConfig.maxMessages || 200;
    if (this.message.byId.size >= MAX_LENGTH) {
      // 删除最早添加的键值
      const firstKey = this.message.byId.keys().next().value || '';
      this.message.byId.delete(firstKey);
    }
    this.message.byId.set(key, value);
  }

  setCurrentCVS(currentCVS: CurrentConversation) {
    this.currentCVS = currentCVS;
  }

  addMessage(message: ChatSDK.Message, chatType: 'singleChat' | 'groupChat', to: string) {
    this.message.byId.set(message.msgLocalId || message.msgServerId, message);
    if (!this.message[chatType][to]) {
      this.message[chatType][to] = [message];
    } else {
      this.message[chatType][to].push(message);
    }
  }

  // internal use
  updateMessage(params: {
    messageId: string;
    chatType: 'singleChat' | 'groupChat';
    to: string;
    msg: string;
  }) {
    const { messageId, chatType, to, msg } = params;
    const message = this.message.byId.get(messageId) as ChatSDK.Message | undefined;
    if (message) {
      this.message.byId.set(messageId, message);
    }

    const msgList = this.message[chatType][to] || [];
    console.log('msgList', msgList);
    const index = msgList.findIndex(item => getMessageId(item) === messageId);
    if (index !== -1) {
      // 🔧 使用 runInAction 和对象替换确保 MobX 能够跟踪变化
      (msgList[index] as ChatSDK.Message).ext = {
        ...((msgList[index] as ChatSDK.Message).ext || {}),
        rtcIsEnd: true,
      };
      runInAction(() => {
        msgList[index] = {
          ...msgList[index],
          body: {
            ...((msgList[index] as ChatSDK.Message).body || {}),
            content: msg,
          },
        } as ChatSDK.Message;
      });
    }
  }

  sendMessage(message: ChatSDK.Message) {
    if (!message) {
      throw new Error('no message');
    }
    if ('msgLocalId' in message && 'conversationId' in message && 'conversationType' in message) {
      return this.sendSdk5Message(message);
    }
    throw new Error('MessageStore.sendMessage only accepts SDK5 Message objects');
  }

  private getSdkConversationType(message: BaseMessageType): ChatSDK.ChatConversationType {
    return (getMessageChatType(message) || 'singleChat') as ChatSDK.ChatConversationType;
  }

  private sendSdk5Message(message: ChatSDK.Message) {
    const { conversationId, conversationType, msgLocalId } = message;
    message.status = message.status === 'failed' ? message.status : 'sending';
    message.direct = 'SEND';

    if (this.repliedMessage != null) {
      const ext = message.ext || {};
      ext.msgQuote = {
        msgID: getMessageId(this.repliedMessage),
        msgPreview: getTextContent(this.repliedMessage) || `[${this.repliedMessage.type}]`,
        msgSender:
          getMsgSenderNickname(this.repliedMessage as BaseMessageType) ||
          this.rootStore.client.getCurrentUserId() ||
          '',
        msgType: this.repliedMessage.type,
      };
      message.ext = ext;
    }

    const myInfo =
      this.rootStore.addressStore.appUsersInfo[this.rootStore.client.getCurrentUserId() || ''] ||
      {};
    if (conversationType === 'chatRoom') {
      message.ext = {
        ...message.ext,
        chatroom_uikit_userInfo: {
          userId: myInfo?.userId,
          nickname: myInfo?.nickname,
          avatarURL: myInfo?.avatarurl,
          gender: Number(myInfo?.gender),
          identify: myInfo?.ext?.identify,
        },
      };
    } else {
      message.ext = {
        ...message.ext,
        ease_chat_uikit_user_info: {
          nickname: myInfo?.nickname,
          avatarURL: myInfo?.avatarurl,
        },
      };
    }

    this.setKeyValue(msgLocalId, message);
    if (conversationType !== 'chatRoom') {
      const list = this.message[conversationType][conversationId] || [];
      if (message.status !== 'failed') {
        list.push(message);
      }
      this.message[conversationType][conversationId] = list;
    }
    if (this.repliedMessage != null) {
      this.setRepliedMessage(null);
    }

    return this.rootStore.client.chatManager
      .sendMessage(message)
      .then(sentMessage => {
        runInAction(() => {
          const serverId = sentMessage.msgServerId;
          sentMessage.status = 'sent';
          this.setKeyValue(sentMessage.msgLocalId, sentMessage);
          if (serverId) {
            this.setKeyValue(serverId, sentMessage);
          }

          const list = this.message[conversationType][conversationId] || [];
          const index = list.findIndex(item => {
            const current = item as ChatSDK.Message;
            return current.msgLocalId === msgLocalId || current.msgServerId === serverId;
          });
          if (index > -1) {
            list.splice(index, 1, sentMessage);
          } else if (conversationType === 'chatRoom') {
            list.push(sentMessage);
          }
          this.message[conversationType][conversationId] = list;

          let cvs = this.rootStore.conversationStore.getConversation(
            conversationType,
            conversationId,
          ) as unknown as Conversation | undefined;
          if (!cvs) {
            cvs = {
              chatType: conversationType,
              conversationId,
              unreadCount: 0,
              lastMessage: sentMessage as never,
            };
            this.rootStore.conversationStore.addConversation(cvs);
          } else {
            cvs.lastMessage = sentMessage as never;
            this.rootStore.conversationStore.topConversation({ ...cvs });
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          message.status = 'failed' as any;
          const list = this.message[conversationType][conversationId] || [];
          const index = list.findIndex(item => {
            return (item as ChatSDK.Message).msgLocalId === msgLocalId;
          });
          if (index > -1) {
            list.splice(index, 1, message);
          }
        });
      });
  }

  receiveMessage(message: BaseMessageType) {
    const curCvs = this.rootStore.conversationStore.currentCvs;
    const conversationId = getCvsIdFromMessage(message);
    const conversationType = this.getSdkConversationType(message);
    const currentUserId = getCurrentUserId(this.rootStore.client);
    const messageId = getMessageId(message);
    // rtc invite message
    if (
      (message.type === 'txt' || message.type === 'text') &&
      message.ext?.msgType === 'rtcCallWithAgora'
    ) {
      message.ext.rtcIsEnd = false;
    }
    if (
      curCvs &&
      curCvs.chatType === conversationType &&
      curCvs.conversationId === conversationId &&
      conversationType != 'chatRoom'
    ) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        this.sendChannelAck(curCvs);
      }, 1000);
    }
    const isChatbot = message.from?.includes?.('chatbot_');
    if (isChatbot) {
      (message as any).printed = false;
    }
    if (messageId) {
      this.setKeyValue(messageId, message as ChatSDK.Message);
    }
    // SDK5: direction is determined by message.direct (SEND/RECEIVE)
    // Components use isMessageFromCurrentUser() helper instead of bySelf

    if ((message as any).broadcast) {
      this.message.broadcast.push(message as ChatSDK.Message);
      return;
    }
    if (!this.message[conversationType][conversationId]) {
      this.message[conversationType][conversationId] = [message as ChatSDK.Message];
    } else {
      const MAX_LENGTH = this.rootStore.initConfig.maxMessages || 200;
      if (this.message[conversationType][conversationId].length > MAX_LENGTH) {
        this.message[conversationType][conversationId].splice(
          0,
          this.message[conversationType][conversationId].length - MAX_LENGTH,
        );
        // this.message[conversationType][conversationId].shift();
        resetCache(conversationType, conversationId);
      }
      this.message[conversationType][conversationId].push(message as ChatSDK.Message);
    }
    // 是当前会话的消息，并且是holding状态， unreadMessageCount +1；
    // 如果是聊天室人员加入的提示消息，根据 initConfig的配置决定是否计入未读数
    const isNotCountMemberJoinToUnread =
      message.type === 'custom' &&
      getCustomEvent(message) === 'CHATROOMUIKITUSERJOIN' &&
      !(this.rootStore.initConfig.countMemberJoinToUnread !== false);
    if (
      this.holding &&
      this.currentCVS.conversationId == conversationId &&
      !isNotCountMemberJoinToUnread
    ) {
      this.unreadMessageCount += 1;
    }

    this.rootStore.userInfoSyncService.syncOnMessageReceived(message, conversationType);
    this.rootStore.conversationSyncService.syncOnMessageReceived(
      message,
      conversationId,
      conversationType,
      currentUserId,
    );
  }

  modifyMessage(id: string, message: ChatSDK.Message | NoticeMessageBody) {
    this.setKeyValue(id, message);
  }

  sendChannelAck(cvs: CurrentConversation) {
    return this.rootStore.client.chatManager.markConversationRead({
      conversationId: cvs.conversationId,
      conversationType: cvs.chatType as ChatSDK.ChatConversationType,
    });
  }

  updateMessageStatus(msgId: string, status: string) {
    setTimeout(() => {
      runInAction(() => {
        const msg = this.message.byId.get(msgId);
        if (!msg) {
          return;
        }
        const conversationId = getCvsIdFromMessage(msg as BaseMessageType);
        const conversationType = getMessageChatType(msg as BaseMessageType);
        if (!conversationType) return;
        (msg as ChatSDK.Message).status = status as any;
        const list = this.message[conversationType][conversationId];
        if (!list) return;
        const i = list.findIndex(item => getMessageId(item) === msgId);
        if (i === -1) return;
        list.splice(i, 1, msg);
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
    this.rootStore.client.chatManager.removeHistoryMessages({
      conversationId: cvs.conversationId,
      conversationType: cvs.chatType as ChatSDK.ChatConversationType,
      beforeTimestamp: Date.now(),
    });
    this.message[cvs.chatType][cvs.conversationId] = [];
  }

  setRepliedMessage(message: ChatSDK.Message | null) {
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
        return !msgIds.includes(getMessageId(msg));
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
    return this.rootStore.client.chatManager
      .removeHistoryMessages({
        conversationId: cvs.conversationId,
        conversationType: cvs.chatType as ChatSDK.ChatConversationType,
        messageIds: msgIds,
      })
      .then(() => {
        // console.log('删服务器');
        _deleteMessage(msgIds);
        const conversation: Conversation = this.rootStore.conversationStore.getConversation(
          cvs.chatType as any,
          cvs.conversationId,
        ) as unknown as Conversation;
        conversation.lastMessage = {} as any;
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
      cvs.chatType as any,
      cvs.conversationId,
    ) as unknown as Conversation;

    if (!conversation && cvs.chatType == 'groupChat') {
      conversation = this.rootStore.conversationStore.getConversation(
        'chatRoom' as any,
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
      conversation.lastMessage = messages[msgIndex] as any;
      if (conversation.unreadCount > 0) {
        conversation.unreadCount -= 1;
      }
      // remove pinned message when recall message
      this.rootStore.pinnedMessagesStore.deletePinnedMessage(
        conversation.chatType,
        conversation.conversationId,
        messageId,
      );
      this.rootStore.conversationStore.modifyConversation(conversation);
      return;
    }

    // mySelf recall the message
    return this.rootStore.client.chatManager
      .recallMessage({
        conversationType: cvs.chatType,
        conversationId: cvs.conversationId,
        messageId,
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
          conversation.lastMessage = messages[msgIndex] as any;
          this.rootStore.conversationStore.modifyConversation(conversation);
          // remove pinned message when recall message
          this.rootStore.pinnedMessagesStore.deletePinnedMessage(
            conversation.chatType,
            conversation.conversationId,
            messageId,
          );
          eventHandler.dispatchSuccess('recallMessage');
        }
      })
      .catch(err => {
        eventHandler.dispatchError('recallMessage', err);
      });
  }

  addReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    if (!cvs || !messageId || !emoji) return;
    return this.rootStore.client.chatManager
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
              reaction.userList.unshift(getCurrentUserId(this.rootStore.client));
            } else {
              const newAction = {
                count: 1,
                isAddedBySelf: true,
                reaction: emoji,
                userList: [getCurrentUserId(this.rootStore.client)],
              };
              if (Array.isArray((message as BaseMessageType).reactions)) {
                (messages[messageIndex] as any).reactions.push(newAction);
              } else {
                (messages[messageIndex] as any).reactions = [newAction];
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
      .catch((err: unknown) => {
        eventHandler.dispatchError('addReaction', err);
      });
  }

  deleteReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    if (!cvs || !messageId || !emoji) {
      throw new Error('deleteReaction params error');
    }
    return this.rootStore.client.chatManager
      .removeReaction({
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
                (message as any).reactions?.indexOf(reaction),
                1,
              );
            }
            const index = reaction.userList?.indexOf(getCurrentUserId(this.rootStore.client));
            if (index > -1) {
              reaction.userList.splice(index, 1);
            }
          }
        }
        eventHandler.dispatchSuccess('deleteReaction');
      })
      .catch((err: unknown) => {
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
              op =>
                op.operator === getCurrentUserId(this.rootStore.client) &&
                op.reactionType === 'create',
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
              if (op.operator === getCurrentUserId(this.rootStore.client)) {
                if (op.reactionType === 'create') {
                  reaction.isAddedBySelf = true;
                } else {
                  reaction.isAddedBySelf = false;
                }
              }
            });
            (message as BaseMessageType).reactions = [...(message as any).reactions];
          } else {
            item.isAddedBySelf = !!item?.op?.find(
              op =>
                op.operator === getCurrentUserId(this.rootStore.client) &&
                op.reactionType === 'create',
            );
            (message as any).reactions.push(item);
          }
        });
      }
    }
  }

  getReactionUserList(cvs: CurrentConversation, messageId: string, reaction: string) {
    if (!cvs || !messageId) return;
    return this.rootStore.client.chatManager
      .getReactionDetail({
        messageId,
        reaction,
        pageSize: 100,
      })
      .then(data => {
        const reactionData = data;
        const messages = getMessages(cvs);
        const messageIndex = getMessageIndex(messages, messageId);
        if (!reactionData) return;
        if (messageIndex > -1) {
          const message = messages[messageIndex];
          (message as any).reactions.userList = reactionData.reactionUsers?.map(
            (user: any) => user.userId,
          );
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
        const currentMsg = messages[messageIndex] as ChatSDK.Message;
        if (currentMsg.type !== 'text') {
          rej(false);
          return console.warn('message type is not text');
        }
        this.rootStore.client.chatManager
          .translateMessage({
            message: currentMsg,
            targetLanguages: [language],
          })
          .then(data => {
            (currentMsg.body as any).translations = data.translations;
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

  modifyLocalMessage(messageId: string, msg: ChatSDK.Message, isReceivedModify?: boolean) {
    const conversationType = this.getSdkConversationType(msg as BaseMessageType);
    if (conversationType !== 'chatRoom') {
      let cvsId = '';
      if (isReceivedModify) {
        cvsId = conversationType === 'groupChat' ? msg.to : msg.from || '';
      } else {
        cvsId = msg.conversationId || msg.to;
      }
      this.rootStore.pinnedMessagesStore.modifyPinnedMessage(conversationType, cvsId, msg);
      const msgIndex = (this.message[conversationType][cvsId] || []).findIndex(
        msgItem => getMessageId(msgItem) === messageId,
      );
      if (msgIndex > -1) {
        const msgItem = this.message[conversationType][cvsId][msgIndex] as ChatSDK.Message;
        if (msg.type === 'text' && msgItem.type === 'text') {
          msgItem.body = msg.body;
          (msgItem as any).modifiedInfo = (msg as any).modifiedInfo;
          // delete translations when message was edited
          if (msgItem.body && 'translations' in msgItem.body) {
            (msgItem.body as any).translations = undefined;
          }
        }
        if (msg.type === 'custom' && msgItem.type === 'custom') {
          msgItem.body = msg.body;
          (msgItem as any).modifiedInfo = (msg as any).modifiedInfo;
          msgItem.ext = msg.ext;
        }
      }
    }
  }

  modifyServerMessage(messageId: string, msg: ChatSDK.Message) {
    if (!messageId || !msg) {
      throw new Error('modifyServerMessage params error');
    }
    const { client } = this.rootStore;
    return client.chatManager
      .modifyMessage({
        conversationId: msg.conversationId,
        conversationType: msg.conversationType,
        messageId,
        message: {
          type: msg.type,
          body: msg.body,
          ext: msg.ext,
        },
      })
      .then(message => {
        this.modifyLocalMessage(messageId, message as never);
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
      selectedMessage: (ChatSDK.Message | NoticeMessageBody)[];
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
    const msg = this.rootStore.client.chatManager.createCmdMessage({
      conversationId: cvs.conversationId,
      conversationType: cvs.chatType as ChatSDK.ChatConversationType,
      action: 'TypingBegin',
    });
    this.rootStore.client.chatManager
      .sendMessage(msg)
      .then(() => {
        // console.log('send cmd success');
      })
      .catch((err: unknown) => {
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

    const message = this.message.byId.get(messageId) as ChatSDK.Message | undefined;
    if (!message) return;
    this.rootStore.client.chatManager.markMessageRead({
      messages: [{ message }],
    });
  }

  clear() {
    this.message = {
      singleChat: {},
      groupChat: {},
      byId: new Map(),
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
