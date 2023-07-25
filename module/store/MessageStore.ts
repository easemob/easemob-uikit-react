// import client from './agoraChatConfig';
import AC, { AgoraChat } from 'agora-chat';
import { makeAutoObservable, observable, action, computed, makeObservable, autorun } from 'mobx';
import { CurrentConversation } from './ConversationStore';
import type { ReactionData } from '../reaction/ReactionMessage';
import { getCvsIdFromMessage } from '../utils';

export interface Message {
  singleChat: { [key: string]: AgoraChat.MessageBody[] };
  groupChat: { [key: string]: AgoraChat.MessageBody[] };
  byId: { [key: string]: AgoraChat.MessageBody };
}
class MessageStore {
  rootStore;
  message: Message;
  currentCVS: CurrentConversation;
  repliedMessage: AgoraChat.MessageBody | null;
  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.message = {
      singleChat: {},
      groupChat: {},
      byId: {},
    };
    this.currentCVS = {} as CurrentConversation;
    this.repliedMessage = null;
    makeObservable(this, {
      currentCVS: observable,
      message: observable,
      repliedMessage: observable,
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
    });

    autorun(() => {
      console.log('message', this.message.singleChat.zd3);
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
    console.log('setCurrentCVS', currentCVS);
    this.currentCVS = currentCVS;
  }

  sendMessage(
    message:
      | AgoraChat.MessageBody
      | AgoraChat.ReadMsgBody
      | AgoraChat.DeliveryMsgBody
      | AgoraChat.ChannelMsgBody,
  ) {
    // @ts-ignore
    const { to, chatType } = message;
    // @ts-ignore
    message.bySelf = true;
    // @ts-ignore
    message.status = 'sending';
    // @ts-ignore
    message.mid = '';
    message.from = this.rootStore.client.context.userId;
    // 添加引用消息
    if (
      this.repliedMessage != null &&
      message.type != 'read' &&
      message.type != 'delivery' &&
      message.type != 'channel'
    ) {
      let ext = message.ext || {};
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
        msgSender: this.repliedMessage.from || this.rootStore.client.user,
        msgType: this.repliedMessage.type,
      };
      message.ext = ext;
      console.log('---', message, ext);
    }
    if (message.type != 'read' && message.type != 'delivery' && message.type != 'channel') {
      this.message.byId[message.id] = message;
    }

    // @ts-ignore
    if (!this.message[chatType][to]) {
      // @ts-ignore
      this.message[chatType][to] = [this.message.byId[message.id]];
    } else {
      // @ts-ignore
      this.message[chatType][to].push(this.message.byId[message.id]);
    }

    if (this.repliedMessage != null) {
      this.setRepliedMessage(null);
    }
    return this.rootStore.client
      .send(message)
      .then((data: { serverMsgId: string }) => {
        console.log('send success', data);
        // message.status = 'sent';
        const msg = this.message.byId[message.id];
        // @ts-ignore
        msg.status = 'sent';
        // @ts-ignore
        msg.mid = data.serverMsgId;
        // this.message.byId[data.serverMsgId] = { ...msg };

        this.message.byId[data.serverMsgId] = this.message.byId[message.id];
        // @ts-ignore
        this.message.byId[message.id].status = 'sent';
        // @ts-ignore
        this.message.byId[message.id].mid = data.serverMsgId;
        // @ts-ignore
        const i = this.message[chatType][to].indexOf(this.message.byId[message.id]);
        // @ts-ignore
        this.message[chatType][to].splice(i, 1, msg);
        // this.message[chatType][to][i] = msg;

        console.log('---->message', this.message);

        // 更新会话last message
        let cvs = this.rootStore.conversationStore.getConversation(
          // @ts-ignore
          message.chatType,
          to,
        );
        // 没有会话时创建会话
        if (!cvs) {
          cvs = {
            // @ts-ignore
            chatType: message.chatType,
            conversationId:
              // @ts-ignore
              message.chatType == 'groupChat' ? message.to : message.from,
            lastMessage: message,
            unreadCount: 0,
          };
          this.rootStore.conversationStore.addConversation(cvs);
          return;
        }
        cvs.lastMessage = message;
        this.rootStore.conversationStore.modifyConversation({ ...cvs });
      })
      .catch((error: ErrorEvent) => {
        console.warn('send fail', error);
        this.updateMessageStatus(message.id, 'failed');
      });
  }

  receiveMessage(message: AgoraChat.MessageBody) {
    console.log('收到消息', message);
    this.message.byId[message.id] = message;
    // @ts-ignore
    message.bySelf = false;
    const conversationId = getCvsIdFromMessage(message);

    // @ts-ignore
    if (!this.message[message.chatType][conversationId]) {
      // @ts-ignore
      this.message[message.chatType][conversationId] = [message];
    } else {
      // @ts-ignore
      this.message[message.chatType][conversationId].push(message);
    }

    const isCurrentCvs =
      // @ts-ignore
      this.currentCVS.chatType == message.chatType &&
      this.currentCVS.conversationId == conversationId;
    console.log('isCurrentCvs', isCurrentCvs);
    let cvs = this.rootStore.conversationStore.getConversation(
      // @ts-ignore
      message.chatType,
      conversationId,
    );
    // 没有会话时创建会话
    if (!cvs) {
      cvs = {
        // @ts-ignore
        chatType: message.chatType,
        conversationId: conversationId,
        lastMessage: message,
        unreadCount: isCurrentCvs ? 0 : 1,
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
  }

  modifyMessage(id: string, message: AgoraChat.MessageBody) {
    this.message.byId[id] = message;
  }

  sendChannelAck(cvs: CurrentConversation) {
    const channelMsg = AC.message.create({
      type: 'channel',
      chatType: cvs.chatType,
      to: cvs.conversationId,
    });
    return this.rootStore.client.send(channelMsg);
    // .then((d) => {
    // 	console.log('发送 channel', d);
    // })
    // .catch((err) => {
    // 	console.log('channel 失败', err);
    // });
  }

  updateMessageStatus(msgId: string, status: string) {
    setTimeout(() => {
      let msg = this.message.byId[msgId];
      let conversationId = getCvsIdFromMessage(msg);
      if (!msg) {
        return console.error('not found message:', msgId);
      }

      // @ts-ignore
      this.message.byId[msgId].status = status;
      // @ts-ignore
      const i = this.message[msg.chatType][conversationId].indexOf(this.message.byId[msg.id]);
      // @ts-ignore
      this.message[msg.chatType][conversationId].splice(i, 1, msg);
      // this.message[chatType][to][i] = msg;

      console.log('---->message', this.message);
    }, 10);
  }

  addHistoryMsgs(cvs: CurrentConversation, msgs: any) {
    if (!cvs || !msgs.length) return;
    // console.log('-->addHistoryMsgs', cvs, msgs, this.message[cvs.chatType]);
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
    this.message[cvs.chatType][cvs.conversationId] = [];
  }

  setRepliedMessage(message: AgoraChat.MessageBody | null) {
    if (typeof message === 'undefined') return;
    this.repliedMessage = message;
  }

  deleteMessage(cvs: CurrentConversation, messageId: string) {
    if (!cvs) return;
    return this.rootStore.client
      .removeHistoryMessages({
        targetId: cvs.conversationId,
        chatType: cvs.chatType,
        messageIds: [messageId],
      })
      .then(() => {
        const messages = this.message[cvs.chatType][cvs.conversationId];
        const filterMsgs = messages.filter(msg => {
          // @ts-ignore
          return msg.id != messageId && msg.mid != messageId;
        });
        this.message[cvs.chatType][cvs.conversationId] = filterMsgs;
      });
  }

  addReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    console.log(cvs, messageId, emoji);
    if (!cvs || !messageId || !emoji) return;
    return this.rootStore.client
      .addReaction({
        messageId,
        reaction: emoji,
      })
      .then(() => {
        const messages = this.message[cvs.chatType][cvs.conversationId];
        messages.forEach(message => {
          // @ts-ignore
          if (message.id === messageId || message.mid === messageId) {
            let hasEmoji = false;
            message.reactions?.forEach((action: ReactionData) => {
              if (action.reaction === emoji) {
                hasEmoji = true;
                action.count += 1;
                action.isAddedBySelf = true;
                action.userList.push(this.rootStore.client.user);
              }
            });
            if (!hasEmoji) {
              const newAction = {
                count: 1,
                isAddedBySelf: true,
                reaction: emoji,
                userList: [this.rootStore.client.user],
              };
              if (Array.isArray(message.reactions)) {
                message.reactions.push(newAction);
              } else {
                message.reactions = [newAction];
              }
            }
          }
        });
        this.message[cvs.chatType][cvs.conversationId] = messages.concat([]);
        // const filterMsgs = messages.filter(msg => {
        //   // @ts-ignore
        //   return msg.id != messageId && msg.mid != messageId;
        // });
        // this.message[cvs.chatType][cvs.conversationId] = filterMsgs;
      })
      .catch((err: AgoraChat.ErrorEvent) => {
        console.error(err);
      });
  }

  deleteReaction(cvs: CurrentConversation, messageId: string, emoji: string) {
    console.log(cvs, messageId, emoji);
    if (!cvs || !messageId || !emoji) return;
    return this.rootStore.client
      .deleteReaction({
        messageId,
        reaction: emoji,
      })
      .then(() => {
        const messages = this.message[cvs.chatType][cvs.conversationId];
        messages.forEach(message => {
          // @ts-ignore
          if (message.id === messageId || message.mid === messageId) {
            message.reactions?.forEach((action: ReactionData, i) => {
              if (action.reaction === emoji) {
                action.count -= 1;
                if (action.count <= 0) {
                  message.reactions?.splice(i, 1);
                }
                const index = action.userList.indexOf(this.rootStore.client.user);
                if (index > -1) {
                  action.userList.splice(index, 1);
                }
              }
            });
          }

          this.message[cvs.chatType][cvs.conversationId] = messages.concat([]);
        });
      })
      .catch((err: AgoraChat.ErrorEvent) => {
        console.error(err);
      });
  }

  updateReactions(cvs: CurrentConversation, messageId: string, reactions: ReactionData[]) {
    console.log('updateReactions', cvs, messageId);
    if (!cvs || !messageId) return;
    const messages = this.message[cvs.chatType][cvs.conversationId];

    const filterActs = reactions.filter(item => {
      return item.op?.length && item.op?.length > 0;
    });

    messages.forEach(message => {
      // @ts-ignore
      if (message.id === messageId || message.mid === messageId) {
        // The message has not yet been added the reaction
        if (!message.reactions || message.reactions?.length === 0) {
          message.reactions = reactions;
          message.reactions.forEach(item => {
            if (item.op) {
              item.op.forEach(op => {
                if (op.operator === this.rootStore.client.user && op.reactionType === 'create') {
                  item.isAddedBySelf = true;
                }
              });
            }
          });
        } else {
          message.reactions.forEach(item => {
            filterActs.forEach(filItem => {
              if (item.reaction === filItem.reaction) {
                let newReaction = {
                  ...item,
                  ...filItem,
                };
                item = newReaction;
                filItem.op &&
                  filItem.op.forEach(op => {
                    if (op.operator === this.rootStore.client.user) {
                      if (op.reactionType === 'create') {
                      } else {
                        item.isAddedBySelf = false;
                      }
                    }
                  });
              }
            });
          });
        }

        console.log('找到了', message);
      }
    });
    this.message[cvs.chatType][cvs.conversationId] = messages.concat([]);
  }
}

export default MessageStore;
