import { observable, action, makeObservable, runInAction, computed } from 'mobx';
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

function makeKey(chatType: string, conversationId: string): string {
  return `${chatType}_${conversationId}`;
}

class ConversationStore {
  rootStore;
  currentCvs: CurrentConversation;
  /** Normalized map: source of truth */
  byId: ById;
  /** Ordered keys into byId, sorted by pinned + lastMessage time */
  orderedIds: string[];
  searchList: Conversation[];
  hasConversationNext: boolean;

  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.currentCvs = {
      conversationId: '',
      chatType: '' as ChatType,
    };

    this.byId = {};
    this.orderedIds = [];
    this.searchList = [];
    this.hasConversationNext = true;
    makeObservable(this, {
      currentCvs: observable,
      byId: observable,
      orderedIds: observable,
      searchList: observable,
      hasConversationNext: observable,
      conversationList: computed,
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

  /** Computed getter: backward-compatible array derived from byId + orderedIds */
  get conversationList(): Conversation[] {
    return this.orderedIds.map(id => this.byId[id]).filter(Boolean);
  }

  private resortIds() {
    this.orderedIds = [...this.orderedIds].sort((a, b) => sortByPinned(this.byId[a], this.byId[b]));
  }

  setCurrentCvs = (currentCvs: CurrentConversation) => {
    this.currentCvs = currentCvs;
    this.rootStore.messageStore.setCurrentCVS(currentCvs);

    const key = makeKey(currentCvs.chatType, currentCvs.conversationId);
    const cvs = this.byId[key];
    if (cvs && cvs.unreadCount > 0) {
      cvs.unreadCount = 0;
      this.rootStore.messageStore.sendChannelAck(currentCvs);
    }
  };

  setConversation(conversations: Conversation[]) {
    if (!Array.isArray(conversations)) {
      return console.error('Invalid parameter: conversations');
    }

    conversations.forEach(cvs => {
      const key = makeKey(cvs.chatType, cvs.conversationId);
      if (!this.byId[key]) {
        this.byId[key] = cvs;
        this.orderedIds.push(key);
      }
    });
    this.resortIds();
  }

  addConversation(conversation: Conversation) {
    if (typeof conversation !== 'object') {
      return console.error('Invalid parameter: conversation');
    }
    const key = makeKey(conversation.chatType, conversation.conversationId);
    if (this.byId[key]) return;
    this.byId[key] = conversation;
    this.orderedIds.push(key);
    this.resortIds();
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
    const key = makeKey(conversation.chatType, conversation.conversationId);
    delete this.byId[key];
    this.orderedIds = this.orderedIds.filter(id => id !== key);
    this.searchList = this.searchList?.filter(
      cvs =>
        !(
          cvs.chatType == conversation.chatType && cvs.conversationId == conversation.conversationId
        ),
    );
    this.setCurrentCvs({} as CurrentConversation);
  }

  modifyConversation(conversation: Conversation) {
    const key = makeKey(conversation.chatType, conversation.conversationId);
    if (this.byId[key]) {
      this.byId[key] = conversation;
      this.resortIds();
    }
  }

  topConversation(conversation: Conversation) {
    const key = makeKey(conversation.chatType, conversation.conversationId);
    if (this.byId[key]) {
      this.byId[key] = conversation;
    }
    this.resortIds();
  }

  getConversation(chatType: ChatType, cvsId: string) {
    return this.byId[makeKey(chatType, cvsId)];
  }

  setAtType(chatType: ChatType, cvsId: string, atType: AT_TYPE) {
    const cvs = this.byId[makeKey(chatType, cvsId)];
    if (cvs && cvs.atType !== atType) {
      cvs.atType = atType;
    }
  }

  setHasConversationNext(hasNext: boolean) {
    this.hasConversationNext = hasNext;
  }

  updateConversationName(chatType: ChatType, cvsId: string) {
    this.rootStore.client.groupManager
      .getGroupInfo({ groupId: cvsId })
      .then((res: ChatSDK.GroupDetail) => {
        const key = makeKey(chatType, cvsId);
        const cvs = this.byId[key];
        if (cvs) {
          runInAction(() => {
            cvs.name = res?.name;
            // trigger reactivity by replacing ref
            this.byId[key] = { ...cvs };
          });
        }
        eventHandler.dispatchSuccess('getGroupInfo');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('getGroupInfo', error);
      });
  }

  sortConversationList(sort: (cvsList: Conversation[]) => Conversation[]) {
    const sorted = sort(this.conversationList);
    this.orderedIds = sorted.map(cvs => makeKey(cvs.chatType, cvs.conversationId));
  }

  pinConversation(chatType: ChatType, cvsId: string, isPinned: boolean) {
    this.rootStore.client.chatManager
      .setConversationPinned({
        conversationType: chatType,
        conversationId: cvsId,
        pinned: isPinned,
      })
      .then(() => {
        runInAction(() => {
          const key = makeKey(chatType, cvsId);
          const cvs = this.byId[key];
          if (cvs) {
            cvs.isPinned = isPinned;
            this.resortIds();
          }
        });
        eventHandler.dispatchSuccess('pinConversation');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('pinConversation', error);
      });
  }

  getServerPinnedConversations() {
    try {
      const conversations = this.rootStore.client.chatManager.getConversationList({
        isPinned: true,
      }) as readonly ChatSDK.ConversationItem[];
      const pinnedConversations = conversations.filter(item => item.isPinned);

      pinnedConversations.forEach(item => {
        const key = makeKey(item.conversationType, item.conversationId);
        if (!this.byId[key]) {
          const newCvs = {
            ...item,
            chatType: item.conversationType,
            unreadCount: item.unreadCount || 0,
            isPinned: true,
          } as unknown as Conversation;
          this.byId[key] = newCvs;
          this.orderedIds.push(key);
        } else {
          this.byId[key].isPinned = true;
        }
      });

      runInAction(() => {
        this.resortIds();
      });

      eventHandler.dispatchSuccess('getServerPinnedConversations');
    } catch (error) {
      eventHandler.dispatchError('getServerPinnedConversations', error);
    }
  }

  setSilentModeForConversationSync(cvs: CurrentConversation, result: boolean) {
    const key = makeKey(cvs.chatType, cvs.conversationId);
    const item = this.byId[key];
    if (item) {
      item.silent = result;
    }
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
    const cvsList = cvs.map(item => ({
      conversationId: item.conversationId,
      conversationType: item.chatType,
    }));
    this.rootStore.client.pushManager
      .getConversationSilentModes({
        conversationList: cvsList,
      })
      .then((res: ChatSDK.BatchConversationSilentModeResponse) => {
        res.conversations.forEach(setting => {
          const key = makeKey(setting.conversationType, setting.conversationId);
          const item = this.byId[key];
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
      const isOnline =
        Object.prototype.toString.call(item.statusList) === '[object Object]' &&
        Object.values(item.statusList).indexOf(1) > -1;
      // Check all conversations matching this publisher
      this.orderedIds.forEach(key => {
        const cvs = this.byId[key];
        if (cvs && cvs.conversationId === item.publisher) {
          cvs.isOnline = isOnline;
        }
      });
    });
  }

  clear() {
    this.currentCvs = {
      conversationId: '',
      chatType: '' as ChatType,
    };

    this.byId = {};
    this.orderedIds = [];
    this.searchList = [];
    this.hasConversationNext = true;
  }
}

export default ConversationStore;
