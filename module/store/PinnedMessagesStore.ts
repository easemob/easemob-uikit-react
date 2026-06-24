import { observable, action, makeObservable } from 'mobx';
import type { ChatSDK } from '../SDK';
import { ChatType } from 'module/types/messageType';
import { getStore } from './index';
import { NoticeMessageBody } from '../noticeMessage/NoticeMessage';
import { getCurrentUserId, getMessageId } from '../utils';

export type PinnedMessage = ChatSDK.PinnedMessageSummary;

export interface PinnedMessageInfo {
  list: PinnedMessage[];
  cursor: string | null;
}

export interface PinnedMessageMap {
  groupChat: Record<string, PinnedMessageInfo>;
  chatRoom: Record<string, PinnedMessageInfo>;
  singleChat: Record<string, PinnedMessageInfo>;
}

class PinnedMessagesStore {
  messages: PinnedMessageMap;
  visible: boolean;

  constructor() {
    this.messages = {
      groupChat: {},
      chatRoom: {},
      singleChat: {},
    };
    this.visible = false;
    makeObservable(this, {
      messages: observable,
      visible: observable,
      unshiftPinnedMessage: action,
      deletePinnedMessage: action,
      pushPinnedMessage: action,
      clearPinnedMessages: action,
      changeVisible: action,
      pushPinNoticeMessage: action,
      modifyPinnedMessage: action,
      clear: action,
    });
  }

  unshiftPinnedMessage(conversationType: ChatType, conversationId: string, message: PinnedMessage) {
    const pinnedMessages = this.messages[conversationType][conversationId] || {
      list: [],
      cursor: '',
    };
    pinnedMessages.list.unshift(message);
    this.messages[conversationType][conversationId] = {
      list: [...pinnedMessages.list],
      cursor: pinnedMessages.cursor,
    };
  }
  pushPinnedMessage(conversationType: ChatType, conversationId: string, message: PinnedMessage) {
    const pinnedMessages = this.messages[conversationType][conversationId] || {
      list: [],
      cursor: '',
    };
    pinnedMessages.list.push(message);
    this.messages[conversationType][conversationId] = {
      list: [...pinnedMessages.list],
      cursor: pinnedMessages.cursor,
    };
  }
  clearPinnedMessages(conversationType: ChatType, conversationId: string) {
    this.messages[conversationType][conversationId] = {
      list: [],
      cursor: '',
    };
  }
  deletePinnedMessage(conversationType: ChatType, conversationId: string, messageId: string) {
    const pinnedMessages = this.messages[conversationType][conversationId] || {
      list: [],
      cursor: '',
    };
    if (conversationType === 'chatRoom') {
      // Only one message is allowed to be pinned in the chat room
      this.messages[conversationType][conversationId] = {
        list: [],
        cursor: '',
      };
      return;
    }
    const idx = pinnedMessages.list.findIndex(msg => getMessageId(msg.message) === messageId);
    if (idx > -1) {
      pinnedMessages.list.splice(idx, 1);
      this.messages[conversationType][conversationId] = {
        list: [...pinnedMessages.list],
        cursor: pinnedMessages.cursor,
      };
    }
  }
  setPinnedMessageCursor(
    conversationType: ChatType,
    conversationId: string,
    cursor: string | null,
  ) {
    const pinnedMessages = this.messages[conversationType][conversationId] || {
      list: [],
      cursor: '',
    };
    this.messages[conversationType][conversationId] = {
      list: [...pinnedMessages.list],
      cursor,
    };
  }
  updatePinnedMessage(
    conversationType: ChatType,
    conversationId: string,
    messageId: string,
    pinnedTime: number,
    operatorId?: string,
  ) {
    const { messageStore, client } = getStore();
    const message = messageStore.message[conversationType][conversationId]?.find(msg => {
      return getMessageId(msg) === messageId;
    });
    const list = this.messages[conversationType][conversationId]?.list || [];
    if (message && list.length > 0) {
      // if has pinned the message, delete it first
      this.deletePinnedMessage(conversationType, conversationId, messageId);
      // unshift the pinned message to the top
      this.unshiftPinnedMessage(conversationType, conversationId, {
        message: message as ChatSDK.Message,
        messageId,
        conversationId,
        conversationType,
        operatorId: operatorId || getCurrentUserId(client),
        pinnedAt: pinnedTime,
      });
    } else {
      this.clearPinnedMessages(conversationType, conversationId);
    }
  }
  modifyPinnedMessage(
    conversationType: ChatType,
    conversationId: string,
    message: ChatSDK.Message,
  ) {
    const pinnedMessages = this.messages[conversationType][conversationId] || {
      list: [],
      cursor: '',
    };
    const idx = pinnedMessages.list.findIndex(
      msg => getMessageId(msg.message) === getMessageId(message),
    );
    const list = pinnedMessages.list;
    if (idx > -1 && list.length > 0) {
      list[idx] = {
        ...list[idx],
        message: {
          ...list[idx].message,
          ...message,
        },
      };
    }
  }
  changeVisible(visible: boolean) {
    this.visible = visible;
  }
  pushPinNoticeMessage(params: {
    conversationType: ChatType;
    conversationId: string;
    noticeType: 'pin' | 'unpin';
    operatorId: string;
    time: number;
  }) {
    const { messageStore } = getStore();
    const { conversationType, conversationId, noticeType, operatorId, time } = params;
    const noticeMessage = new NoticeMessageBody({
      time,
      noticeType: noticeType,
      ext: {
        operatorId,
        conversationId,
        conversationType,
      },
    });
    messageStore.message[conversationType][conversationId] = [
      ...(messageStore.message[conversationType][conversationId] || []),
      noticeMessage,
    ];
  }
  clear() {
    this.messages = {
      groupChat: {},
      chatRoom: {},
      singleChat: {},
    };
    this.visible = false;
  }
}

export default PinnedMessagesStore;
