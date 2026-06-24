import { makeAutoObservable, observable, action, makeObservable, runInAction } from 'mobx';
import { ChatType } from '../types/messageType';
import type { ChatSDK } from '../SDK';
import { sortByPinned } from '../utils';
import { eventHandler } from '../../eventHandler';
export type AT_TYPE = 'NONE' | 'ALL' | 'ME';
export interface Conversation {
  chatType: ChatType;
  conversationId: string;
  lastMessage: ChatSDK.Message | Record<string, unknown>;
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
      setHasConversationNext: action,
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

    const currentCvsId = this.conversationList.map(item => item.conversationId);
    const filteredGroups = conversations.filter(
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
    const exist = this.conversationList.find(item => {
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
    const idx = this.conversationList.findIndex(item => {
      return item.chatType === chatType && item.conversationId === cvsId;
    });
    if (idx > -1 && this.conversationList[idx].atType !== atType) {
      this.conversationList[idx].atType = atType;
    }
  }

  setHasConversationNext(hasNext: boolean) {
    this.hasConversationNext = hasNext;
  }

  updateConversationName(chatType: ChatType, cvsId: string) {
    this.rootStore.client.groupManager
      .getGroupInfo({ groupId: cvsId })
      .then((res: ChatSDK.GroupDetail) => {
        this.conversationList?.forEach(cvs => {
          if (cvs.conversationId === cvsId) {
            cvs.name = res?.name;
          }
        });

        runInAction(() => {
          this.conversationList = [...this.conversationList];
        });
        eventHandler.dispatchSuccess('getGroupInfo');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('getGroupInfo', error);
      });
  }

  sortConversationList(sort: (cvsList: Conversation[]) => Conversation[]) {
    this.conversationList = sort(this.conversationList);
  }

  pinConversation(chatType: ChatType, cvsId: string, isPinned: boolean) {
    this.rootStore.client.chatManager
      .setConversationPinned({
        conversationType: chatType,
        conversationId: cvsId,
        pinned: isPinned,
      })
      .then(() => {
        this.conversationList?.forEach(cvs => {
          if (cvs.conversationId === cvsId) {
            cvs.isPinned = isPinned;
          }
        });

        runInAction(() => {
          this.conversationList = [...this.conversationList.sort(sortByPinned)];
        });

        eventHandler.dispatchSuccess('pinConversation');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('pinConversation', error);
      });
  }

  getServerPinnedConversations() {
    this.rootStore.client.chatManager
      .refreshSessionList({ includeEmpty: true })
      .then((conversations: readonly ChatSDK.ConversationItem[]) => {
        const pinnedConversations = conversations.filter(item => item.isPinned);

        const mergedList = [...this.conversationList];
        pinnedConversations.forEach(item => {
          const idx = this.conversationList.findIndex(
            cvs => cvs.conversationId === item.conversationId,
          );
          if (idx === -1) {
            const newCvs = {
              ...item,
              chatType: item.conversationType,
              unreadCount: item.unreadCount || 0,
            };
            // @ts-ignore
            delete newCvs.conversationType;
            mergedList.push(newCvs as unknown as Conversation);
          } else {
            this.conversationList[idx].isPinned = true;
          }
        });

        runInAction(() => {
          this.conversationList = [...mergedList.sort(sortByPinned)];
        });

        eventHandler.dispatchSuccess('getServerPinnedConversations');
      })
      .catch((error: unknown) => {
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
    this.rootStore.client.pushManager
      .setConversationSilentMode({
        conversationId: cvs.conversationId,
        conversationType: cvs.chatType,
        rule: {
          mode: 'REMIND_TYPE',
          remindType: cvs.chatType == 'groupChat' ? 'AT' : 'NONE',
        },
      })
      .then((res: any) => {
        this.setSilentModeForConversationSync(cvs, true);
        this.rootStore.addressStore.setSilentModeForConversationSync(cvs, true);
        eventHandler.dispatchSuccess('setSilentModeForConversation');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('setSilentModeForConversation', error);
      });
  }

  clearRemindTypeForConversation(cvs: CurrentConversation) {
    this.rootStore.client.pushManager
      .clearConversationRemindType({
        conversationId: cvs.conversationId,
        conversationType: cvs.chatType,
      })
      .then((res: any) => {
        this.setSilentModeForConversationSync(cvs, false);
        this.rootStore.addressStore.setSilentModeForConversationSync(cvs, false);
        eventHandler.dispatchSuccess('clearRemindTypeForConversation');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('clearRemindTypeForConversation', error);
      });
  }

  getSilentModeForConversations(cvs: CurrentConversation[]) {
    if (!cvs || cvs.length == 0) {
      return;
    }
    const cvsList = cvs.map(item => {
      return {
        conversationId: item.conversationId,
        conversationType: item.chatType,
      };
    });
    this.rootStore.client.pushManager
      .getConversationSilentModes({
        conversationList: cvsList,
      })
      .then((res: ChatSDK.BatchConversationSilentModeResponse) => {
        res.conversations.forEach(setting => {
          const item = this.conversationList.find(
            cvs =>
              cvs.conversationId === setting.conversationId &&
              cvs.chatType === setting.conversationType,
          );
          if (item) {
            item.silent = setting.rule.remindType === 'NONE' || setting.rule.remindType === 'AT';
          }
        });
        eventHandler.dispatchSuccess('getSilentModeForConversations');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('getSilentModeForConversations', error);
      });
  }

  setOnlineStatus(result: readonly ChatSDK.PresenceInfo[]) {
    result.forEach(item => {
      if (
        Object.prototype.toString.call(item.statusList) === '[object Object]' &&
        Object.values(item.statusList).indexOf(1) > -1
      ) {
        this.conversationList?.forEach(cvsItem => {
          if (cvsItem.conversationId === item.publisher) {
            cvsItem.isOnline = true;
          }
        });
      } else {
        this.conversationList?.forEach(cvsItem => {
          if (cvsItem.conversationId === item.publisher) {
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
