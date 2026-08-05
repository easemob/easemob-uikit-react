vi.mock('../../utils', () => ({
  getConversationChatType: (item: { chatType?: string; conversationType?: string }) =>
    item.chatType || item.conversationType,
  getConversationId: (item: { conversationId?: string }) => item.conversationId,
  getConversationUnreadCount: (item: { unreadCount?: number }) => item.unreadCount || 0,
  isConversationPinned: () => false,
  sortByPinned: () => 0,
}));

vi.mock('../../eventHandler', () => ({
  eventHandler: {
    dispatchSuccess: vi.fn(),
    dispatchError: vi.fn(),
  },
}));

import ConversationStore from '../ConversationStore';

describe('ConversationStore.syncUnreadFromSdkItems', () => {
  const createStore = () => {
    const setCurrentConversation = vi.fn();
    const resetCurrentConversation = vi.fn();
    const store = new ConversationStore({
      messageStore: {
        setCurrentCVS: vi.fn(),
        sendChannelAck: vi.fn(() => Promise.resolve(true)),
        sendReadReceiptsForConversation: vi.fn(() => Promise.resolve()),
      },
      client: {
        chatManager: {
          setCurrentConversation,
          resetCurrentConversation,
        },
        pushManager: {
          getSilentModeForConversations: vi.fn(() => Promise.resolve([])),
        },
      },
    });
    store.getSilentModeForConversations = vi.fn();
    return { store, setCurrentConversation, resetCurrentConversation };
  };

  it('notifies SDK setCurrentConversation when opening a conversation', () => {
    const { store, setCurrentConversation, resetCurrentConversation } = createStore();
    store.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: 'alice',
    });

    expect(setCurrentConversation).toHaveBeenCalledWith({
      conversationId: 'alice',
      conversationType: 'singleChat',
    });
    expect(resetCurrentConversation).not.toHaveBeenCalled();
  });

  it('resets SDK current conversation when clearing currentCvs', () => {
    const { store, resetCurrentConversation } = createStore();
    store.setCurrentCvs({} as any);

    expect(resetCurrentConversation).toHaveBeenCalled();
  });

  it('keeps unreadCount at 0 for the current conversation when SDK reports unread', () => {
    const { store } = createStore();
    store.byId.singleChat_alice = {
      chatType: 'singleChat',
      conversationId: 'alice',
      unreadCount: 0,
      lastMessage: {},
    };
    store.orderedIds = ['singleChat_alice'];
    store.currentCvs = {
      chatType: 'singleChat',
      conversationId: 'alice',
    };

    store.syncUnreadFromSdkItems([
      {
        conversationId: 'alice',
        conversationType: 'singleChat',
        unreadCount: 1,
      },
    ]);

    expect(store.getConversation('singleChat', 'alice')?.unreadCount).toBe(0);
  });

  it('applies SDK unreadCount for non-current conversations', () => {
    const { store } = createStore();
    store.byId.singleChat_bob = {
      chatType: 'singleChat',
      conversationId: 'bob',
      unreadCount: 0,
      lastMessage: {},
    };
    store.orderedIds = ['singleChat_bob'];
    store.currentCvs = {
      chatType: 'singleChat',
      conversationId: 'alice',
    };

    store.syncUnreadFromSdkItems([
      {
        conversationId: 'bob',
        conversationType: 'singleChat',
        unreadCount: 3,
      },
    ]);

    expect(store.getConversation('singleChat', 'bob')?.unreadCount).toBe(3);
  });

  it('removes conversations listed in patch.removed', () => {
    const { store } = createStore();
    store.byId.groupChat_g1 = {
      chatType: 'groupChat',
      conversationId: 'g1',
      unreadCount: 2,
      lastMessage: {},
    };
    store.byId.singleChat_alice = {
      chatType: 'singleChat',
      conversationId: 'alice',
      unreadCount: 0,
      lastMessage: {},
    };
    store.orderedIds = ['groupChat_g1', 'singleChat_alice'];
    store.currentCvs = {
      chatType: 'singleChat',
      conversationId: 'alice',
    };

    store.syncFromSdkConversationListUpdate({
      items: [
        {
          conversationId: 'alice',
          conversationType: 'singleChat',
          unreadCount: 0,
        },
      ],
      patch: {
        removed: [{ conversationId: 'g1', conversationType: 'groupChat' }],
      },
    });

    expect(store.getConversation('groupChat', 'g1')).toBeUndefined();
    expect(store.getConversation('singleChat', 'alice')).toBeTruthy();
    expect(store.currentCvs.conversationId).toBe('alice');
  });

  it('on reset drops local conversations missing from items snapshot', () => {
    const { store } = createStore();
    store.byId.groupChat_g1 = {
      chatType: 'groupChat',
      conversationId: 'g1',
      unreadCount: 1,
      lastMessage: {},
    };
    store.byId.singleChat_alice = {
      chatType: 'singleChat',
      conversationId: 'alice',
      unreadCount: 0,
      lastMessage: {},
    };
    store.orderedIds = ['groupChat_g1', 'singleChat_alice'];

    store.syncFromSdkConversationListUpdate({
      items: [
        {
          conversationId: 'alice',
          conversationType: 'singleChat',
          unreadCount: 0,
        },
      ],
      patch: { reset: true },
    });

    expect(store.getConversation('groupChat', 'g1')).toBeUndefined();
    expect(store.conversationList.map(item => item.conversationId)).toEqual(['alice']);
  });

  it('deleteConversation only clears currentCvs when deleting the open conversation', () => {
    const { store } = createStore();
    store.byId.groupChat_g1 = {
      chatType: 'groupChat',
      conversationId: 'g1',
      unreadCount: 0,
      lastMessage: {},
    };
    store.orderedIds = ['groupChat_g1'];
    store.currentCvs = {
      chatType: 'singleChat',
      conversationId: 'alice',
    };

    store.deleteConversation({
      chatType: 'groupChat',
      conversationId: 'g1',
    });

    expect(store.getConversation('groupChat', 'g1')).toBeUndefined();
    expect(store.currentCvs).toEqual({
      chatType: 'singleChat',
      conversationId: 'alice',
    });
  });
});
