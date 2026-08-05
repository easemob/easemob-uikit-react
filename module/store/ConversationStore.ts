import { observable, action, makeObservable, runInAction, computed } from 'mobx';
import { ChatType } from '../types/messageType';
import type { ChatSDK } from '../SDK';
import {
  getConversationChatType,
  getConversationId,
  getConversationUnreadCount,
  isConversationPinned,
  sortByPinned,
} from '../utils';
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
      syncUnreadFromSdkItems: action,
      syncFromSdkConversationListUpdate: action,
      clearUnreadForConversation: action,
      clearAllUnreadCounts: action,
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

  private syncSdkCurrentConversation(currentCvs: CurrentConversation) {
    const chatManager = this.rootStore.client?.chatManager;
    if (!chatManager) return;

    const canSetCurrent =
      Boolean(currentCvs?.conversationId) &&
      (currentCvs.chatType === 'singleChat' || currentCvs.chatType === 'groupChat');

    try {
      if (canSetCurrent) {
        // Tell SDK which conversation is open so online messages do not increment unread.
        chatManager.setCurrentConversation({
          conversationId: currentCvs.conversationId,
          conversationType: currentCvs.chatType,
        });
      } else if (typeof chatManager.resetCurrentConversation === 'function') {
        chatManager.resetCurrentConversation();
      }
    } catch (error) {
      console.warn('[UIKit] syncSdkCurrentConversation failed', error);
    }
  }

  setCurrentCvs = (currentCvs: CurrentConversation) => {
    this.currentCvs = currentCvs;
    this.rootStore.messageStore.setCurrentCVS(currentCvs);
    this.syncSdkCurrentConversation(currentCvs);

    const key = makeKey(currentCvs.chatType, currentCvs.conversationId);
    const cvs = this.byId[key];
    if (cvs && cvs.unreadCount > 0) {
      const previousUnread = cvs.unreadCount;
      // Optimistic UI clear; restore if SDK/server clear fails (otherwise re-login brings unread back)
      this.byId[key] = { ...cvs, unreadCount: 0 };
      this.rootStore.messageStore.sendChannelAck(currentCvs).then((success: boolean) => {
        if (!success) {
          runInAction(() => {
            const latest = this.byId[key];
            if (latest && latest.unreadCount === 0) {
              this.byId[key] = { ...latest, unreadCount: previousUnread };
            }
          });
        }
      });
    }
    // Message-level read receipts: single chat only (not via conversation unread clear)
    if (currentCvs.chatType === 'singleChat') {
      this.rootStore.messageStore
        .sendReadReceiptsForConversation(currentCvs)
        .catch((error: unknown) => {
          console.error('[UIKit] sendReadReceiptsForConversation failed', error);
        });
    }
  };

  /**
   * Resolve display name from SDK conversation update.
   * SDK may set conversationName === conversationId as a placeholder; keep local/group name then.
   */
  private resolveSyncedConversationName(
    chatType: ChatType,
    conversationId: string,
    conversationName?: string,
    existingName?: string,
  ) {
    const sdkName = conversationName || '';
    const isPlaceholder = !sdkName || sdkName === conversationId;
    if (!isPlaceholder) return sdkName;

    if (existingName && existingName !== conversationId) {
      return existingName;
    }

    if (chatType === 'groupChat') {
      const group = this.rootStore.addressStore?.groups?.find(
        (item: { groupId?: string }) => item.groupId === conversationId,
      );
      const groupName = group?.groupName || group?.name;
      if (groupName) return groupName;
    }

    return existingName || sdkName || '';
  }

  /** Sync unreadCount (and optional fields) from SDK conversation list updates. */
  syncUnreadFromSdkItems(
    items: ReadonlyArray<{
      conversationId: string;
      conversationType: ChatType | string;
      unreadCount: number;
      isPinned?: boolean;
      conversationName?: string;
      conversationAvatar?: string;
      lastMessage?: any;
    }>,
  ) {
    const current = this.currentCvs;
    items.forEach(item => {
      const chatType = item.conversationType as ChatType;
      if (!chatType || !item.conversationId) return;
      const key = makeKey(chatType, item.conversationId);
      const isCurrentConversation =
        current.chatType === chatType && current.conversationId === item.conversationId;
      // SDK may briefly report unread=1 for the open conversation before clearConversationUnread
      // finishes. Keep local unread at 0 so the conversation list does not flash a badge.
      const unreadCount = isCurrentConversation ? 0 : item.unreadCount ?? 0;
      const existing = this.byId[key];
      const name = this.resolveSyncedConversationName(
        chatType,
        item.conversationId,
        item.conversationName,
        existing?.name,
      );
      if (!existing) {
        this.addConversation({
          chatType,
          conversationId: item.conversationId,
          unreadCount,
          lastMessage: item.lastMessage || ({} as any),
          isPinned: item.isPinned,
          name,
          avatarUrl: item.conversationAvatar,
        });
        return;
      }
      this.byId[key] = {
        ...existing,
        unreadCount,
        isPinned: item.isPinned ?? existing.isPinned,
        name,
        avatarUrl: item.conversationAvatar || existing.avatarUrl,
        lastMessage: item.lastMessage || existing.lastMessage,
      };
    });
    this.resortIds();
  }

  /**
   * Apply SDK `onConversationListUpdate`:
   * - remove conversations from `patch.removed`
   * - on `patch.reset`, treat `items` as the authoritative snapshot and drop local extras
   * - upsert unread/name/avatar/lastMessage from `items`
   */
  syncFromSdkConversationListUpdate(payload: {
    items?: ReadonlyArray<{
      conversationId: string;
      conversationType: ChatType | string;
      unreadCount: number;
      isPinned?: boolean;
      conversationName?: string;
      conversationAvatar?: string;
      lastMessage?: any;
    }>;
    patch?: {
      reset?: boolean;
      removed?: ReadonlyArray<{
        conversationId: string;
        conversationType: ChatType | string;
      }>;
    };
  }) {
    const removed = payload.patch?.removed || [];
    removed.forEach(item => {
      if (!item?.conversationId || !item?.conversationType) return;
      this.deleteConversation({
        chatType: item.conversationType as ChatType,
        conversationId: item.conversationId,
      });
    });

    if (payload.patch?.reset && Array.isArray(payload.items)) {
      const keep = new Set(
        payload.items
          .filter(item => item?.conversationId && item?.conversationType)
          .map(item => makeKey(String(item.conversationType), item.conversationId)),
      );
      [...this.orderedIds].forEach(key => {
        if (keep.has(key)) return;
        const cvs = this.byId[key];
        if (!cvs) return;
        this.deleteConversation({
          chatType: cvs.chatType,
          conversationId: cvs.conversationId,
        });
      });
    }

    if (payload.items) {
      this.syncUnreadFromSdkItems(payload.items);
    }
  }

  clearUnreadForConversation(chatType: ChatType, conversationId: string) {
    const key = makeKey(chatType, conversationId);
    const cvs = this.byId[key];
    if (cvs && cvs.unreadCount !== 0) {
      this.byId[key] = { ...cvs, unreadCount: 0 };
    }
  }

  clearAllUnreadCounts() {
    this.orderedIds.forEach(key => {
      const cvs = this.byId[key];
      if (cvs && cvs.unreadCount !== 0) {
        this.byId[key] = { ...cvs, unreadCount: 0 };
      }
    });
  }

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
    if (
      this.currentCvs.chatType === conversation.chatType &&
      this.currentCvs.conversationId === conversation.conversationId
    ) {
      this.setCurrentCvs({} as CurrentConversation);
    }
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
    const key = makeKey(chatType, cvsId);
    const cvs = this.byId[key];
    if (cvs && cvs.atType !== atType) {
      this.byId[key] = { ...cvs, atType };
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
            this.byId[key] = { ...cvs, isPinned };
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
      const pinnedConversations = conversations.filter(item => isConversationPinned(item));

      pinnedConversations.forEach(item => {
        const conversationType = getConversationChatType(item);
        const conversationId = getConversationId(item);
        if (!conversationType || !conversationId) return;
        const key = makeKey(conversationType, conversationId);
        if (!this.byId[key]) {
          const newCvs = {
            ...item,
            chatType: conversationType,
            conversationId,
            unreadCount: getConversationUnreadCount(item),
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
      this.byId[key] = { ...item, silent: result };
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
            const silent = setting.rule.remindType === 'NONE' || setting.rule.remindType === 'AT';
            this.byId[key] = { ...item, silent };
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
    this.syncSdkCurrentConversation(this.currentCvs);

    this.byId = {};
    this.orderedIds = [];
    this.searchList = [];
    this.hasConversationNext = true;
  }
}

export default ConversationStore;
