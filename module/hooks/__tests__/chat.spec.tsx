import React from 'react';
import { render } from '@testing-library/react';

const mockStore = {} as any;

const getStoreMock = vi.fn(() => mockStore);

const resetMockStore = () => {
  mockStore.messageStore = {
    message: {
      groupChat: {},
      chatRoom: {},
      singleChat: {},
    },
    receiveMessage: vi.fn(),
    updateMessageStatus: vi.fn(),
    setTyping: vi.fn(),
    recallMessage: vi.fn(),
    updateReactions: vi.fn(),
    modifyLocalMessage: vi.fn(),
  };
  mockStore.threadStore = {};
  mockStore.conversationStore = {
    setConversation: vi.fn(),
  };
  mockStore.addressStore = {
    setContacts: vi.fn(),
    setGroups: vi.fn(),
    setGroupMemberAttributes: vi.fn(),
    setGroupAdmins: vi.fn(),
    chatroom: [],
    contacts: [],
    groups: [],
  };
  mockStore.pinnedMessagesStore = {
    updatePinnedMessage: vi.fn(),
    pushPinNoticeMessage: vi.fn(),
    clearPinnedMessages: vi.fn(),
    pushPinnedMessage: vi.fn(),
    deletePinnedMessage: vi.fn(),
  };
  mockStore.setLoginState = vi.fn();
};

vi.mock('../../store', () => ({
  getStore: getStoreMock,
}));

vi.mock('../useAddress', () => ({
  useGroupMembersAttributes: vi.fn(() => ({
    getMemberAttributes: vi.fn(),
  })),
}));

import { useEventHandler } from '../chat';

resetMockStore();

describe('useEventHandler pinned-message contracts', () => {
  const createMessage = (id = 'msg-1', conversationId = 'room-1', conversationType = 'chatRoom') =>
    ({
      msgLocalId: `local-${id}`,
      msgServerId: id,
      conversationId,
      conversationType,
      from: 'alice',
      to: conversationId,
      timestamp: 100,
      type: 'text',
      body: {
        content: `text:${id}`,
      },
    } as any);

  const renderHookHarness = (clientOverrides?: Partial<any>) => {
    const handlers: Record<string, any> = {};
    const client = {
      addEventHandler: vi.fn((name: string, registeredHandlers: Record<string, any>) => {
        handlers[name] = registeredHandlers;
      }),
      removeEventHandler: vi.fn(),
      getCurrentUserId: vi.fn(() => 'alice'),
      ...clientOverrides,
    };

    const Harness = () => {
      useEventHandler({ initConfig: {} } as any, client);
      return null;
    };

    const view = render(<Harness />);

    return {
      ...view,
      client,
      handlers: handlers.UIKitMessage,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockStore();
  });

  it('skips remote-pin handling when the operator is the current user', () => {
    const { handlers, unmount } = renderHookHarness();

    handlers.onPinnedMessageChanged({
      messageId: 'msg-1',
      operation: 'pin',
      operatorId: 'alice',
      conversationType: 'singleChat',
      conversationId: 'bob',
      pinTime: 200,
    });

    expect(mockStore.pinnedMessagesStore.updatePinnedMessage).not.toHaveBeenCalled();
    expect(mockStore.pinnedMessagesStore.pushPinNoticeMessage).not.toHaveBeenCalled();

    unmount();
  });

  it('deletes pinned state and appends an unpin notice for remote unpin events', () => {
    const { handlers, unmount } = renderHookHarness();

    handlers.onPinnedMessageChanged({
      messageId: 'msg-2',
      operation: 'unpin',
      operatorId: 'moderator',
      conversationType: 'singleChat',
      conversationId: 'bob',
      timestamp: 220,
    });

    expect(mockStore.pinnedMessagesStore.deletePinnedMessage).toHaveBeenCalledWith(
      'singleChat',
      'bob',
      'msg-2',
    );
    expect(mockStore.pinnedMessagesStore.pushPinNoticeMessage).toHaveBeenCalledWith({
      conversationId: 'bob',
      conversationType: 'singleChat',
      operatorId: 'moderator',
      noticeType: 'unpin',
      time: 220,
    });

    unmount();
  });

  it('keeps the event conversation when applying a remote message edit', () => {
    const { handlers, unmount } = renderHookHarness();

    handlers.onMessageUpdated({
      messageId: 'msg-edited',
      conversationId: 'bob',
      conversationType: 'singleChat',
      message: {
        type: 'text',
        body: { content: 'updated content' },
        modifiedInfo: {
          operationCount: 1,
          operationTime: 200,
          operatorId: 'bob',
        },
      },
    });

    expect(mockStore.messageStore.modifyLocalMessage).toHaveBeenCalledWith(
      'msg-edited',
      expect.objectContaining({
        msgServerId: 'msg-edited',
        conversationId: 'bob',
        conversationType: 'singleChat',
        body: { content: 'updated content' },
      }),
      true,
    );

    unmount();
  });

  it('rebuilds chatroom pinned state from the message store for remote pin events', () => {
    const chatRoomMessage = createMessage('msg-room', 'room-1', 'chatRoom');
    mockStore.messageStore.message.chatRoom['room-1'] = [chatRoomMessage];

    const { handlers, unmount } = renderHookHarness();

    handlers.onPinnedMessageChanged({
      messageId: 'msg-room',
      operation: 'pin',
      operatorId: 'moderator',
      conversationType: 'chatRoom',
      conversationId: 'room-1',
      pinTime: 320,
    });

    expect(mockStore.pinnedMessagesStore.updatePinnedMessage).toHaveBeenCalledWith(
      'chatRoom',
      'room-1',
      'msg-room',
      320,
      'moderator',
    );
    expect(mockStore.pinnedMessagesStore.pushPinNoticeMessage).toHaveBeenCalledWith({
      conversationId: 'room-1',
      conversationType: 'chatRoom',
      operatorId: 'moderator',
      noticeType: 'pin',
      time: 320,
    });
    expect(mockStore.pinnedMessagesStore.clearPinnedMessages).toHaveBeenCalledWith(
      'chatRoom',
      'room-1',
    );
    expect(mockStore.pinnedMessagesStore.pushPinnedMessage).toHaveBeenCalledWith(
      'chatRoom',
      'room-1',
      expect.objectContaining({
        messageId: 'msg-room',
        conversationId: 'room-1',
        conversationType: 'chatRoom',
        operatorId: 'moderator',
        pinnedAt: 320,
        message: chatRoomMessage,
      }),
    );

    unmount();
  });
});
