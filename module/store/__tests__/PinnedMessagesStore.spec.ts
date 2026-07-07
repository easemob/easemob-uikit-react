const mockStore = {
  client: {
    getCurrentUserId: vi.fn(() => 'owner'),
  },
  messageStore: {
    message: {
      groupChat: {},
      chatRoom: {},
      singleChat: {},
    },
  },
} as any;

const getStoreMock = vi.fn(() => mockStore);

const resetMockStore = () => {
  mockStore.client.getCurrentUserId.mockReset();
  mockStore.client.getCurrentUserId.mockReturnValue('owner');
  mockStore.messageStore.message = {
    groupChat: {},
    chatRoom: {},
    singleChat: {},
  };
};

vi.mock('../index', () => ({
  getStore: getStoreMock,
}));

import PinnedMessagesStore from '../PinnedMessagesStore';
import { NoticeMessageBody } from '../../noticeMessage/NoticeMessage';

resetMockStore();

describe('PinnedMessagesStore contracts', () => {
  const createMessage = (
    id = 'msg-1',
    conversationId = 'group-1',
    conversationType = 'groupChat',
  ) =>
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
      ext: {
        source: 'test',
      },
    } as any);

  const createPinnedSummary = (message: any, operatorId = 'remote') =>
    ({
      message,
      messageId: message.msgServerId,
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      operatorId,
      pinnedAt: 50,
    } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockStore();
  });

  it('replaces an existing pinned summary with the latest stored message and current-user fallback operator', () => {
    const store = new PinnedMessagesStore();
    const message = createMessage();
    mockStore.messageStore.message.groupChat['group-1'] = [message];

    store.pushPinnedMessage('groupChat', 'group-1', createPinnedSummary(message, 'legacy-user'));

    store.updatePinnedMessage('groupChat', 'group-1', 'msg-1', 300);

    expect(store.messages.groupChat['group-1'].list).toHaveLength(1);
    expect(store.messages.groupChat['group-1'].list[0]).toMatchObject({
      messageId: 'msg-1',
      conversationId: 'group-1',
      conversationType: 'groupChat',
      operatorId: 'owner',
      pinnedAt: 300,
    });
    expect(store.messages.groupChat['group-1'].list[0].message).toMatchObject({
      msgServerId: 'msg-1',
      conversationId: 'group-1',
      conversationType: 'groupChat',
      body: {
        content: 'text:msg-1',
      },
    });
  });

  it('clears cached pinned messages when the source message can no longer be resolved', () => {
    const store = new PinnedMessagesStore();
    const message = createMessage();

    store.pushPinnedMessage('groupChat', 'group-1', createPinnedSummary(message));

    store.updatePinnedMessage('groupChat', 'group-1', 'missing-message', 300, 'remote-user');

    expect(store.messages.groupChat['group-1']).toEqual({
      list: [],
      cursor: '',
    });
  });

  it('clears the whole chatroom pin cache when any pinned message is removed', () => {
    const store = new PinnedMessagesStore();
    const message = createMessage('msg-room', 'room-1', 'chatRoom');

    store.pushPinnedMessage('chatRoom', 'room-1', createPinnedSummary(message));

    store.deletePinnedMessage('chatRoom', 'room-1', 'msg-room');

    expect(store.messages.chatRoom['room-1']).toEqual({
      list: [],
      cursor: '',
    });
  });

  it('merges updated message fields into the pinned summary without replacing unrelated data', () => {
    const store = new PinnedMessagesStore();
    const message = createMessage('msg-2', 'group-2');

    store.pushPinnedMessage('groupChat', 'group-2', createPinnedSummary(message));

    store.modifyPinnedMessage('groupChat', 'group-2', {
      msgServerId: 'msg-2',
      body: {
        content: 'updated-text',
      },
      ext: {
        source: 'updated',
      },
    } as any);

    expect(store.messages.groupChat['group-2'].list[0]).toMatchObject({
      messageId: 'msg-2',
      operatorId: 'remote',
    });
    expect(store.messages.groupChat['group-2'].list[0].message).toMatchObject({
      conversationId: 'group-2',
      body: {
        content: 'updated-text',
      },
      ext: {
        source: 'updated',
      },
    });
  });

  it('appends a notice message with pin metadata to the conversation message stream', () => {
    const store = new PinnedMessagesStore();
    const message = createMessage('msg-3', 'group-3');
    mockStore.messageStore.message.groupChat['group-3'] = [message];

    store.pushPinNoticeMessage({
      conversationType: 'groupChat',
      conversationId: 'group-3',
      noticeType: 'pin',
      operatorId: 'moderator',
      time: 500,
    });

    const stream = mockStore.messageStore.message.groupChat['group-3'];
    const noticeMessage = stream[1];

    expect(stream).toHaveLength(2);
    expect(noticeMessage).toBeInstanceOf(NoticeMessageBody);
    expect(noticeMessage).toMatchObject({
      noticeType: 'pin',
      time: 500,
      ext: {
        operatorId: 'moderator',
        conversationId: 'group-3',
        conversationType: 'groupChat',
      },
    });
  });
});
