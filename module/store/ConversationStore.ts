import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
import { ChatType } from '../types/messageType';
import { ChatSDK } from '../SDK';
import { sortByPinned } from '../utils';
import { eventHandler } from '../../eventHandler';
export type AT_TYPE = 'NONE' | 'ALL' | 'ME';
export interface Conversation {
  chatType: ChatType;
  conversationId: string;
  lastMessage: Exclude<ChatSDK.MessageBody, ChatSDK.ReadMsgBody | ChatSDK.DeliveryMsgBody>;
  unreadCount: number;
  name?: string;
  atType?: AT_TYPE;
  isOnline?: boolean;
  avatarUrl?: string;
  isPinned?: boolean;
  silent?: boolean;
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
      pinConversation: action,
      getServerPinnedConversations: action,
      setSilentModeForConversation: action,
      setSilentModeForConversationSync: action,
      clearRemindTypeForConversation: action,
      getSilentModeForConversations: action,
      setOnlineStatus: action,
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
    this.conversationList = [conversation, ...this.conversationList].sort(sortByPinned);
    this.byId[`${conversation.chatType}_${conversation.conversationId}`] = conversation;
    this.getSilentModeForConversations([conversation]);
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
    // TODO: 改造，把调api移到这里面，增加是否删除历史消息的参数
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
    this.conversationList = [...this.conversationList].sort(sortByPinned);
  }

  topConversation(conversation: Conversation) {
    this.conversationList = [...this.conversationList.sort(sortByPinned)];

    // let findCvs: Conversation = {} as Conversation;
    // const filteredList = this.conversationList?.filter(cvs => {
    //   if (
    //     cvs.chatType == conversation.chatType &&
    //     cvs.conversationId == conversation.conversationId
    //   ) {
    //     findCvs = cvs;
    //     return false;
    //   }
    //   return true;
    //   // return (
    //   //   cvs.chatType !== conversation.chatType || cvs.conversationId !== conversation.conversationId
    //   // );
    // });
    // if (JSON.stringify(findCvs) === '{}') {
    //   console.warn('not find conversation');
    //   return;
    // }

    // this.conversationList = [findCvs, ...filteredList];
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
    this.rootStore.client
      .getGroupInfo({ groupId: cvsId })
      .then((res: ChatSDK.AsyncResult<ChatSDK.GroupDetailInfo[]>) => {
        this.conversationList?.forEach(cvs => {
          if (cvs.conversationId === cvsId) {
            cvs.name = res?.data?.[0]?.name;
          }
        });
        this.conversationList = [...this.conversationList];
        eventHandler.dispatchSuccess('getGroupInfo');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('getGroupInfo', error);
      });
  }

  sortConversationList() {
    this.conversationList = this.conversationList;
  }

  pinConversation(chatType: ChatType, cvsId: string, isPinned: boolean) {
    this.rootStore.client
      .pinConversation({ conversationType: chatType, conversationId: cvsId, isPinned })
      .then((res: ChatSDK.AsyncResult<ChatSDK.PinConversation>) => {
        this.conversationList?.forEach(cvs => {
          if (cvs.conversationId === cvsId) {
            cvs.isPinned = isPinned;
          }
        });
        this.conversationList = [...this.conversationList.sort(sortByPinned)];
        eventHandler.dispatchSuccess('pinConversation');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('pinConversation', error);
      });
  }

  getServerPinnedConversations() {
    this.rootStore.client
      .getServerPinnedConversations({ pageSize: 50 })
      .then((res: ChatSDK.AsyncResult<ChatSDK.ServerConversations>) => {
        const conversations = (res.data?.conversations || []) as unknown as Conversation[];

        const mergedList = [...this.conversationList];
        conversations.forEach(item => {
          const idx = this.conversationList.findIndex(
            cvs => cvs.conversationId === item.conversationId,
          );
          if (idx === -1) {
            mergedList.push(item);
          } else {
            this.conversationList[idx].isPinned = true;
          }
        });
        this.conversationList = [...mergedList.sort(sortByPinned)];

        eventHandler.dispatchSuccess('getServerPinnedConversations');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('getServerPinnedConversations', error);
      });
  }

  setSilentModeForConversationSync(cvs: CurrentConversation, result: boolean) {
    this.conversationList?.forEach(item => {
      if (item.conversationId === cvs.conversationId) {
        item.silent = result;
      }
    });
    this.conversationList = [...this.conversationList];
  }
  setSilentModeForConversation(cvs: CurrentConversation) {
    this.rootStore.client
      .setSilentModeForConversation({
        conversationId: cvs.conversationId,
        type: cvs.chatType,
        options: {
          paramType: 0,
          remindType: cvs.chatType == 'groupChat' ? 'AT' : 'NONE',
        },
      })
      .then((res: any) => {
        this.setSilentModeForConversationSync(cvs, true);
        this.rootStore.addressStore.setSilentModeForConversationSync(cvs, true);
        eventHandler.dispatchSuccess('setSilentModeForConversation');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('setSilentModeForConversation', error);
      });
  }

  clearRemindTypeForConversation(cvs: CurrentConversation) {
    this.rootStore.client
      .clearRemindTypeForConversation({
        conversationId: cvs.conversationId,
        type: cvs.chatType,
      })
      .then((res: any) => {
        this.setSilentModeForConversationSync(cvs, false);
        this.rootStore.addressStore.setSilentModeForConversationSync(cvs, false);
        eventHandler.dispatchSuccess('clearRemindTypeForConversation');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('clearRemindTypeForConversation', error);
      });
  }

  getSilentModeForConversations(cvs: CurrentConversation[]) {
    if (!cvs || cvs.length == 0) {
      return;
    }
    const cvsList = cvs.map(item => {
      return {
        id: item.conversationId,
        type: item.chatType,
      };
    });
    this.rootStore.client
      .getSilentModeForConversations({
        conversationList: cvsList,
      })
      .then((res: any) => {
        const userSetting = res.data.user;
        const groupSetting = res.data.group;
        this.conversationList?.forEach(item => {
          if (item.chatType === 'singleChat') {
            if (
              userSetting[item.conversationId] &&
              userSetting[item.conversationId]?.type == 'NONE'
            ) {
              item.silent = true;
            }
          } else if (
            item.chatType === 'groupChat' &&
            groupSetting[item.conversationId]?.type == 'AT'
          ) {
            if (groupSetting[item.conversationId]) {
              item.silent = true;
            }
          }
        });
        eventHandler.dispatchSuccess('getSilentModeForConversations');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('getSilentModeForConversations', error);
      });
  }

  setOnlineStatus(result: ChatSDK.SubscribePresence[]) {
    result.forEach(item => {
      if (
        Object.prototype.toString.call(item.status) === '[object Object]' &&
        Object.values(item.status).indexOf('1') > -1
      ) {
        this.conversationList?.forEach(cvsItem => {
          if (cvsItem.conversationId === item.uid) {
            cvsItem.isOnline = true;
          }
        });
      } else {
        this.conversationList?.forEach(cvsItem => {
          if (cvsItem.conversationId === item.uid) {
            cvsItem.isOnline = false;
          }
        });
      }
    });

    this.conversationList = [...this.conversationList];
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
