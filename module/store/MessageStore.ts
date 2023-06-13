// import client from './agoraChatConfig';
import AC, { AgoraChat } from 'agora-chat';
import { makeAutoObservable, observable, action, computed, makeObservable, autorun } from 'mobx';
import { CurrentConversation } from './ConversationStore';

export interface Message {
  singleChat: { [key: string]: AgoraChat.MessageBody[] };
  groupChat: { [key: string]: AgoraChat.MessageBody[] };
  byId: { [key: string]: AgoraChat.MessageBody };
}
class MessageStore {
  rootStore;
  message: Message;
  currentCVS: CurrentConversation;
  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.message = {
      singleChat: {},
      groupChat: {},
      byId: {},
    };
    this.currentCVS = {} as CurrentConversation;
    makeObservable(this, {
      currentCVS: observable,
      message: observable,
      setCurrentCVS: action,
      currentCvsMsgs: computed,
      sendMessage: action,
      receiveMessage: action,
      modifyMessage: action,
      sendChannelAck: action,
      updateMessageStatus: action,
      clearMessage: action,
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

  sendMessage(message: AgoraChat.MessageBody) {
    // @ts-ignore
    const { to, chatType } = message;
    // @ts-ignore
    message.bySelf = true;
    // @ts-ignore
    message.status = 'sending';
    // @ts-ignore
    message.mid = '';
    this.message.byId[message.id] = message;
    // @ts-ignore
    if (!this.message[chatType][to]) {
      // @ts-ignore
      this.message[chatType][to] = [this.message.byId[message.id]];
    } else {
      // @ts-ignore
      this.message[chatType][to].push(this.message.byId[message.id]);
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
      })
      .catch((error: ErrorEvent) => {
        console.warn('send fail', error);
        // message.status = 'fail';
        // this.message.byId[message.id].status = 'fail';

        this.updateMessageStatus(message.id, 'failed');
      });

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
  }

  receiveMessage(message: AgoraChat.MessageBody) {
    console.log('收到消息', message);
    this.message.byId[message.id] = message;
    // @ts-ignore
    message.bySelf = false;
    const conversationId =
      // @ts-ignore
      message.chatType == 'singleChat' ? message.from : message.to;
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
      let conversationId;
      if (!msg) {
        return console.error('not found message:', msgId);
      }
      // @ts-ignore
      if (msg.bySelf) {
        conversationId = msg.to;
      } else {
        conversationId =
          // @ts-ignore
          msg.chatType == 'singleChat' ? msg.from : msg.to;
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
}

export default MessageStore;
