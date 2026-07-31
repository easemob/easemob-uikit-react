import ConversationSyncService from '../ConversationSyncService';

describe('ConversationSyncService contracts', () => {
  const createService = (overrides?: {
    currentCvs?: { chatType: string; conversationId: string };
    existingConversation?: Record<string, any> | undefined;
    groups?: Array<{ groupId: string; groupName?: string; name?: string }>;
  }) => {
    const addConversation = vi.fn();
    const topConversation = vi.fn();
    const setAtType = vi.fn();
    const existingConversation = overrides?.existingConversation;

    const rootStore = {
      conversationStore: {
        addConversation,
        topConversation,
        setAtType,
        getConversation: vi.fn(() => existingConversation),
      },
      messageStore: {
        currentCVS: overrides?.currentCvs || {
          chatType: '',
          conversationId: '',
        },
      },
      addressStore: {
        groups: overrides?.groups || [],
      },
    } as any;

    return {
      service: new ConversationSyncService(rootStore),
      addConversation,
      topConversation,
      setAtType,
      rootStore,
    };
  };

  it('creates a new conversation with derived group name and unread count for non-current conversations', () => {
    const { service, addConversation } = createService({
      groups: [{ groupId: 'group-1', groupName: 'Project Group' }],
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'group-1',
      'groupChat',
      'alice',
    );

    expect(addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        chatType: 'groupChat',
        conversationId: 'group-1',
        unreadCount: 1,
        name: 'Project Group',
      }),
    );
  });

  it('creates a new conversation with zero unread count for the current conversation', () => {
    const { service, addConversation } = createService({
      currentCvs: {
        chatType: 'singleChat',
        conversationId: 'bob',
      },
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'bob',
      'singleChat',
      'alice',
    );

    expect(addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        unreadCount: 0,
      }),
    );
  });

  it('increments unread count only when the incoming message is newer and the conversation is not current', () => {
    const conversation = {
      chatType: 'singleChat',
      conversationId: 'bob',
      unreadCount: 2,
      lastMessage: {
        timestamp: 100,
      },
    };
    const { service, topConversation } = createService({
      existingConversation: conversation,
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'bob',
      'singleChat',
      'alice',
    );

    expect(topConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        unreadCount: 3,
        lastMessage: expect.objectContaining({
          timestamp: 200,
        }),
      }),
    );
  });

  it('does not increment unread count for the current conversation', () => {
    const conversation = {
      chatType: 'singleChat',
      conversationId: 'bob',
      unreadCount: 2,
      lastMessage: {
        timestamp: 100,
      },
    };
    const { service, topConversation } = createService({
      currentCvs: {
        chatType: 'singleChat',
        conversationId: 'bob',
      },
      existingConversation: conversation,
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'bob',
      'singleChat',
      'alice',
    );

    expect(topConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        unreadCount: 2,
      }),
    );
  });

  it('prefers conversationStore.currentCvs over messageStore.currentCVS', () => {
    const conversation = {
      chatType: 'singleChat',
      conversationId: 'bob',
      unreadCount: 2,
      lastMessage: {
        timestamp: 100,
      },
    };
    const topConversation = vi.fn();
    const rootStore = {
      conversationStore: {
        addConversation: vi.fn(),
        topConversation,
        setAtType: vi.fn(),
        getConversation: vi.fn(() => conversation),
        currentCvs: {
          chatType: 'singleChat',
          conversationId: 'bob',
        },
      },
      messageStore: {
        currentCVS: {
          chatType: 'singleChat',
          conversationId: 'other',
        },
      },
      addressStore: {
        groups: [],
      },
    } as any;
    const service = new ConversationSyncService(rootStore);

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'bob',
      'singleChat',
      'alice',
    );

    expect(topConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        unreadCount: 2,
      }),
    );
  });

  it('sets mention state for matching text mentions from other users', () => {
    const conversation = {
      chatType: 'groupChat',
      conversationId: 'group-1',
      unreadCount: 0,
      lastMessage: {
        timestamp: 100,
      },
    };
    const { service, setAtType } = createService({
      existingConversation: conversation,
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
        from: 'bob',
        ext: {
          em_at_list: ['alice'],
        },
      } as any,
      'group-1',
      'groupChat',
      'alice',
    );

    expect(setAtType).toHaveBeenCalledWith('groupChat', 'group-1', 'ME');
  });

  it('skips mention state for current conversation, command messages, chatrooms, and thread messages', () => {
    const conversation = {
      chatType: 'groupChat',
      conversationId: 'group-1',
      unreadCount: 0,
      lastMessage: {
        timestamp: 100,
      },
    };
    const { service, setAtType, topConversation, addConversation } = createService({
      currentCvs: {
        chatType: 'groupChat',
        conversationId: 'group-1',
      },
      existingConversation: conversation,
    });

    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
        from: 'bob',
        ext: {
          em_at_list: ['alice'],
        },
      } as any,
      'group-1',
      'groupChat',
      'alice',
    );
    service.syncOnMessageReceived(
      {
        type: 'cmd',
        timestamp: 200,
      } as any,
      'group-1',
      'groupChat',
      'alice',
    );
    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
        chatThread: { parentId: 'group-1' },
      } as any,
      'group-1',
      'groupChat',
      'alice',
    );
    service.syncOnMessageReceived(
      {
        type: 'text',
        timestamp: 200,
      } as any,
      'room-1',
      'chatRoom',
      'alice',
    );

    expect(setAtType).not.toHaveBeenCalled();
    expect(addConversation).not.toHaveBeenCalled();
    expect(topConversation).toHaveBeenCalledTimes(1);
  });
});
