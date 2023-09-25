import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
import { ChatType } from '../types/messageType';
import { AgoraChat } from 'agora-chat';

export type AT_TYPE = 'NONE' | 'ALL' | 'ME';
export interface Conversation {
  chatType: ChatType;
  conversationId: string;
  lastMessage: AgoraChat.MessageBody;
  unreadCount: number;
  name?: string;
  atType?: AT_TYPE;
  isOnline?: boolean;
  avatarUrl?: string;
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
  hasConversationNext: boolean;
  byId: ById;
  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.currentCvs = {
      conversationId: '',
      chatType: '' as ChatType,
    };

    this.conversationList = [];
    this.searchList = [];
    this.hasConversationNext = true;
    this.byId = {};
    makeObservable(this, {
      currentCvs: observable,
      conversationList: observable,
      searchList: observable,
      hasConversationNext: observable,
      byId: observable,
      setCurrentCvs: action,
      setConversation: action,
      setSearchList: action,
      deleteConversation: action,
      getConversation: action,
      addConversation: action,
      modifyConversation: action,
      topConversation: action,
      setAtType: action,
      updateConversationName: action,
      clear: action,
    });
  }

  setCurrentCvs = (currentCvs: CurrentConversation) => {
    this.currentCvs = currentCvs;
    this.rootStore.messageStore.setCurrentCVS(currentCvs);

    this.conversationList.forEach((cvs, index) => {
      if (cvs.chatType == currentCvs.chatType && cvs.conversationId == currentCvs.conversationId) {
        if (this.conversationList[index].unreadCount > 0) {
          this.conversationList[index].unreadCount = 0;
          this.rootStore.messageStore.sendChannelAck(currentCvs);
        }
      }
      this.conversationList = [...this.conversationList];
    });
  };

  setConversation(conversations: Conversation[]) {
    if (!Array.isArray(conversations)) {
      return console.error('Invalid parameter: conversations');
    }

    let currentCvsId = this.conversationList.map(item => item.conversationId);
    let filteredGroups = conversations.filter(
      ({ conversationId }) => !currentCvsId.find(id => id === conversationId),
    );

    filteredGroups.forEach(cvs => {
      this.byId[`${cvs.chatType}_${cvs.conversationId}`] = cvs;
    });

    this.conversationList = [...this.conversationList, ...filteredGroups];
  }

  addConversation(conversation: Conversation) {
    if (typeof conversation !== 'object') {
      return console.error('Invalid parameter: conversation');
    }
    let exist = this.conversationList.find(item => {
      return item.conversationId === conversation.conversationId;
    });
    if (exist) return;
    this.conversationList = [conversation, ...this.conversationList];
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
  }

  topConversation(conversation: Conversation) {
    let findCvs: Conversation = {} as Conversation;
    const filteredList = this.conversationList?.filter(cvs => {
      if (
        cvs.chatType == conversation.chatType &&
        cvs.conversationId == conversation.conversationId
      ) {
        findCvs = cvs;
        return false;
      }
      return true;
      // return (
      //   cvs.chatType !== conversation.chatType || cvs.conversationId !== conversation.conversationId
      // );
    });
    if (JSON.stringify(findCvs) === '{}') {
      console.warn('not find conversation');
      return;
    }
    this.conversationList = [findCvs, ...filteredList];
  }

  getConversation(chatType: ChatType, cvsId: string) {
    let cvs;
    this.conversationList?.forEach(item => {
      if (item.chatType == chatType && item.conversationId == cvsId) {
        cvs = item;
      }
    });

    return cvs;
  }

  setAtType(chatType: ChatType, cvsId: string, atType: AT_TYPE) {
    let idx = this.conversationList.findIndex(item => {
      return item.chatType === chatType && item.conversationId === cvsId;
    });
    if (idx > -1) {
      this.conversationList[idx].atType = atType;
    }
  }

  setHasConversationNext(hasNext: boolean) {
    this.hasConversationNext = hasNext;
  }

  updateConversationName(chatType: ChatType, cvsId: string) {
    this.rootStore.client.getGroupInfo({ groupId: cvsId }).then(res => {
      this.conversationList?.forEach(cvs => {
        if (cvs.conversationId === cvsId) {
          cvs.name = res?.data?.[0]?.name;
        }
      });
      this.conversationList = [...this.conversationList];
    });
  }

  clear() {
    this.currentCvs = {
      conversationId: '',
      chatType: '' as ChatType,
    };

    this.conversationList = [];
    this.searchList = [];
    this.hasConversationNext = true;
    this.byId = {};
  }
}

export default ConversationStore;
