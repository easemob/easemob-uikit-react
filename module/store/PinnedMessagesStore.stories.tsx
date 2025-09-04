import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import PinnedMessagesStore from './PinnedMessagesStore'; // 假设这是一个导出的类或对象
import Provider from '../store/Provider';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    messages: 'Pinned messages map',
    visible: 'Visibility of pinned messages list',
    unshiftPinnedMessage: 'Add a pinned message to the start of the list',
    pushPinnedMessage: 'Add a pinned message to the end of the list',
    clearPinnedMessages: 'Clear all pinned messages for a conversation',
    deletePinnedMessage: 'Delete a specific pinned message',
    setPinnedMessageCursor: 'Set the cursor for pinned messages',
    updatePinnedMessage: 'Update a pinned message',
    modifyPinnedMessage: 'Modify a pinned message',
    changeVisible: 'Change the visibility of pinned messages list',
    pushPinNoticeMessage: 'Push a notice message for pin/unpin actions',
    clear: 'Clear all pinned messages data',
    PinnedMessagesStore:
      'PinnedMessagesStore is a data store that manages pinned messages and their visibility.',
  },
  zh: {
    messages: '置顶消息映射',
    visible: '置顶消息列表的可见性',
    unshiftPinnedMessage: '将置顶消息添加到列表开头',
    pushPinnedMessage: '将置顶消息添加到列表末尾',
    clearPinnedMessages: '清除会话的所有置顶消息',
    deletePinnedMessage: '删除特定的置顶消息',
    setPinnedMessageCursor: '设置置顶消息的游标',
    updatePinnedMessage: '更新置顶消息',
    modifyPinnedMessage: '修改置顶消息',
    changeVisible: '更改置顶消息列表的可见性',
    pushPinNoticeMessage: '推送置顶/取消置顶操作的通知消息',
    clear: '清除所有置顶消息数据',
    PinnedMessagesStore: 'PinnedMessagesStore 是一个管理置顶消息及其可见性的数据仓库。',
  },
};

// 假设我们有一个简单的组件来展示PinnedMessagesStore的内容
const PinnedMessagesStoreComponent = () => {
  return (
    <div>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <div>{description[lang].PinnedMessagesStore}</div>
      </Provider>
    </div>
  );
};

export default {
  title: 'Store/PinnedMessagesStore',
  component: PinnedMessagesStoreComponent,
  argTypes: {
    messages: {
      control: 'object',
      description: description[lang].messages,
      table: {
        type: {
          summary: 'object',
          detail: `{
    groupChat: Record<string, PinnedMessageInfo>;
    chatRoom: Record<string, PinnedMessageInfo>;
    singleChat: Record<string, PinnedMessageInfo>;
}`,
        },
        defaultValue: { summary: '{}' },
      },
    },
    visible: {
      control: 'boolean',
      description: description[lang].visible,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    unshiftPinnedMessage: {
      description: description[lang].unshiftPinnedMessage,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, message: PinnedMessage) => void',
        },
      },
      control: 'function',
    },
    pushPinnedMessage: {
      description: description[lang].pushPinnedMessage,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, message: PinnedMessage) => void',
        },
      },
      control: 'function',
    },
    clearPinnedMessages: {
      description: description[lang].clearPinnedMessages,
      table: {
        type: {
          summary: 'function',
          detail: '(conversationType: ChatType, conversationId: string) => void',
        },
      },
      control: 'function',
    },
    deletePinnedMessage: {
      description: description[lang].deletePinnedMessage,
      table: {
        type: {
          summary: 'function',
          detail: '(conversationType: ChatType, conversationId: string, messageId: string) => void',
        },
      },
      control: 'function',
    },
    setPinnedMessageCursor: {
      description: description[lang].setPinnedMessageCursor,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, cursor: string | null) => void',
        },
      },
      control: 'function',
    },
    updatePinnedMessage: {
      description: description[lang].updatePinnedMessage,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, messageId: string, pinnedTime: number, operatorId?: string) => void',
        },
      },
      control: 'function',
    },
    modifyPinnedMessage: {
      description: description[lang].modifyPinnedMessage,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, message: ChatSDK.ModifiedEventMessage) => void',
        },
      },
      control: 'function',
    },
    changeVisible: {
      description: description[lang].changeVisible,
      table: {
        type: { summary: 'function', detail: '(visible: boolean) => void' },
      },
      control: 'function',
    },
    pushPinNoticeMessage: {
      description: description[lang].pushPinNoticeMessage,
      table: {
        type: {
          summary: 'function',
          detail:
            '(conversationType: ChatType, conversationId: string, message: ChatSDK.ModifiedEventMessage) => void',
        },
      },
      control: 'function',
    },
  },
};

const Template: StoryFn<typeof PinnedMessagesStoreComponent> = args => (
  <PinnedMessagesStoreComponent />
);

export const Default = {
  render: Template,
  args: {},
};
