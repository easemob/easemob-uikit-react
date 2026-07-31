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

describe('ConversationStore.setCurrentCvs SDK sync', () => {
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
      },
    });
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
});
