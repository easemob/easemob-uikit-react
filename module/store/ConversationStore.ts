import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
import { ChatType } from '../types/messageType';
import { AgoraChat } from 'agora-chat';

export interface Conversation {
  chatType: ChatType;
  conversationId: string;
  lastMessage: AgoraChat.MessageBody;
  unreadCount: number;
  name?: string;
  isAted?: boolean;
  isOnline?: boolean;
  avatarUrl?: string
}

export interface CurrentConversation {
  conversationId: string;
  chatType: ChatType;
  name?: string;
  unreadCount?: number;
}

export interface ById {
  [key: string]: Conversation;
}

class ConversationStore {
  rootStore;
  currentCvs: CurrentConversation;
  conversationList: Conversation[];
  searchList: Conversation[];
  byId: ById;
  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.currentCvs = {
      conversationId: '',
      chatType: '' as ChatType,
    };

    this.conversationList = [];
    this.searchList = [];
    this.byId = {};
    makeObservable(this, {
      currentCvs: observable,
      conversationList: observable,
      searchList: observable,
      byId: observable,
      setCurrentCvs: action,
      setConversation: action,
      setSearchList: action,
      deleteConversation: action,
      getConversation: action,
      addConversation: action,
      modifyConversation: action,
      topConversation: action,
      setIsAted: action,
    });
  }

  setCurrentCvs(currentCvs: CurrentConversation) {
    this.currentCvs = currentCvs;
    this.rootStore.messageStore.setCurrentCVS(currentCvs);
    console.log('设置当前会话', this.conversationList, currentCvs);

    this.conversationList.forEach((cvs, index) => {
      if (cvs.chatType == currentCvs.chatType && cvs.conversationId == currentCvs.conversationId) {
        console.log('找到会话 清空未读数');

        if (this.conversationList[index].unreadCount > 0) {
          this.conversationList[index].unreadCount = 0;
          this.rootStore.messageStore.sendChannelAck(currentCvs);
        }
      }
      this.conversationList = [...this.conversationList];
    });
  }

  setConversation(conversations: Conversation[]) {
    if (!Array.isArray(conversations)) {
      return console.error('Invalid parameter: conversations');
    }
    console.log('setConversation', conversations);

    this.conversationList = conversations;

    conversations.forEach(cvs => {
      this.byId[`${cvs.chatType}_${cvs.conversationId}`] = cvs;
    });
  }

  addConversation(conversation: Conversation) {
    if (typeof conversation != 'object') {
      return console.error('Invalid parameter: conversation');
    }
    let exist = false;
    this.conversationList.forEach(item => {
      if (item.conversationId == conversation.conversationId) {
        exist = true;
      }
    });
    if (exist) return;
    this.conversationList.unshift(conversation);
    this.byId[`${conversation.chatType}_${conversation.conversationId}`] = conversation;
  }

  setSearchList(conversations: Conversation[]) {
    if (!Array.isArray(conversations)) {
      return console.error('Invalid parameter: conversations');
    }
    this.searchList = conversations;
  }

  deleteConversation(conversation: CurrentConversation) {
    if (typeof conversation != 'object') {
      return console.error('Invalid parameter: conversation');
    }
    this.conversationList = this.conversationList?.filter(cvs => {
      if (
        cvs.chatType == conversation.chatType &&
        cvs.conversationId == conversation.conversationId
      ) {
        return false;
      }
      return true;
    });
    this.searchList = this.searchList?.filter(cvs => {
      if (
        cvs.chatType == conversation.chatType &&
        cvs.conversationId == conversation.conversationId
      ) {
        return false;
      }
      return true;
    });
    console.log('deleteConversation', this.searchList);
    this.setCurrentCvs({} as CurrentConversation);
  }

  modifyConversation(conversation: Conversation) {
    this.conversationList?.forEach((cvs, index) => {
      if (
        cvs.chatType == conversation.chatType &&
        cvs.conversationId == conversation.conversationId
      ) {
        // cvs = conversation;
        this.conversationList[index] = conversation;
      }
    });
    this.conversationList = [...this.conversationList];
    console.log('modifyConversation -->', this.conversationList, conversation);
  }

  topConversation(conversation: Conversation) {
    const newCvsList = this.conversationList?.filter((cvs, index) => {
      if (
        cvs.chatType == conversation.chatType &&
        cvs.conversationId == conversation.conversationId
      ) {
        return false;
      }
      return true;
    });
    newCvsList.unshift(conversation);
    this.conversationList = [...newCvsList];
  }

  getConversation(chatType: ChatType, cvsId: string) {
    let cvs;
    this.conversationList?.forEach(item => {
      if (item.chatType == chatType && item.conversationId == cvsId) {
        cvs = item;
      }
    });
    console.log('cvs --->', cvs);

    return cvs;
  }

  setIsAted(chatType: ChatType, cvsId: string, isAted: boolean) {
    console.log(chatType, cvsId, isAted, '12313s');
    let idx = this.conversationList.findIndex(item => {
      return item.chatType === chatType && item.conversationId === cvsId;
    });
    if (idx > -1) {
      this.conversationList[idx].isAted = isAted;

      console.log(this.conversationList[idx]);
    }
  }
}

export default ConversationStore;
