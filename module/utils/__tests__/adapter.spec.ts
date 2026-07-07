import {
  getConversationChatType,
  getConversationId,
  getConversationLastMessageTime,
  getConversationName,
  getConversationUnreadCount,
  getMessageConversationId,
  getMessageId,
  getMessagePreviewData,
  getMessageTime,
  getThreadLastMessage,
  getThreadMessageCount,
  getThreadName,
  getThreadOwnerId,
  getThreadParentId,
  getThreadSummaryId,
  isConversationPinned,
  isMessageFromCurrentUser,
} from '../index';

describe('adapter helper contracts', () => {
  const t = (key: string) =>
    ({
      image: 'Image',
      audio: 'Audio',
      file: 'File',
      video: 'Video',
      custom: 'Custom',
      contact: 'Contact',
      chatHistory: 'Chat History',
      combine: 'Combined',
      unsentAMessage: 'Unsent a message',
    }[key] || key);

  describe('message helpers', () => {
    it('prefers sdk5 identifiers and timestamps before legacy fields', () => {
      const message = {
        msgLocalId: 'local-1',
        msgServerId: 'server-1',
        timestamp: 123,
        time: 456,
      };

      expect(getMessageId(message)).toBe('server-1');
      expect(getMessageTime(message)).toBe(123);
    });

    it('resolves conversation id from direct messages using current user context', () => {
      const sentMessage = {
        from: 'alice',
        to: 'bob',
        chatType: 'singleChat',
      };
      const receivedMessage = {
        from: 'bob',
        to: 'alice',
        chatType: 'singleChat',
      };

      expect(getMessageConversationId(sentMessage, 'alice')).toBe('bob');
      expect(getMessageConversationId(receivedMessage, 'alice')).toBe('bob');
    });

    it('keeps bySelf as the highest-priority self-message signal', () => {
      const message = {
        bySelf: false,
        direct: 'SEND',
        from: 'alice',
      };

      expect(isMessageFromCurrentUser(message, 'alice')).toBe(false);
    });

    it('derives preview text for text, custom contact, combine sentinel, and recall messages', () => {
      const textPreview = getMessagePreviewData(
        {
          type: 'text',
          body: { content: 'hello world' },
        },
        t,
      );
      const contactPreview = getMessagePreviewData(
        {
          type: 'custom',
          body: { event: 'userCard' },
        },
        t,
        {
          mapUserCardToContact: true,
        },
      );
      const combinedSentinelPreview = getMessagePreviewData(
        {
          type: 'text',
          body: { content: 'the combine message' },
        },
        t,
        {
          mapCombinedTextSentinel: true,
        },
      );
      const recallPreview = getMessagePreviewData(
        {
          type: 'recall',
        },
        t,
      );

      expect(textPreview).toEqual({
        mode: 'renderText',
        text: 'hello world',
      });
      expect(contactPreview).toEqual({
        mode: 'plainText',
        text: '[Contact]',
      });
      expect(combinedSentinelPreview).toEqual({
        mode: 'plainText',
        text: '/Chat History/',
      });
      expect(recallPreview).toEqual({
        mode: 'plainText',
        text: 'Unsent a message',
      });
    });
  });

  describe('conversation helpers', () => {
    it('normalizes ids, chat types, names, unread counts, and pinned state', () => {
      const conversation = {
        id: 'fallback-id',
        conversationId: 'conversation-1',
        conversationType: 'groupChat',
        conversationName: 'Fallback Name',
        unreadNum: 5,
        pinned: true,
        latestMessage: {
          timestamp: 789,
        },
      };

      expect(getConversationId(conversation)).toBe('conversation-1');
      expect(getConversationChatType(conversation)).toBe('groupChat');
      expect(getConversationName(conversation)).toBe('Fallback Name');
      expect(getConversationUnreadCount(conversation)).toBe(5);
      expect(isConversationPinned(conversation)).toBe(true);
      expect(getConversationLastMessageTime(conversation)).toBe(789);
    });
  });

  describe('thread helpers', () => {
    it('normalizes ids, parent ids, names, owners, counts, and last message', () => {
      const lastMessage = { body: { content: 'reply' } };
      const thread = {
        id: 'legacy-thread-id',
        chatThreadId: 'thread-1',
        parentId: 'group-1',
        name: 'Thread Name',
        owner: 'owner-1',
        replyCount: 7,
        lastMessage,
      };

      expect(getThreadSummaryId(thread)).toBe('legacy-thread-id');
      expect(getThreadParentId(thread)).toBe('group-1');
      expect(getThreadName(thread)).toBe('Thread Name');
      expect(getThreadOwnerId(thread)).toBe('owner-1');
      expect(getThreadMessageCount(thread)).toBe(7);
      expect(getThreadLastMessage(thread)).toBe(lastMessage);
    });
  });
});
