import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import ConversationStore from './ConversationStore'; // 假设这是一个导出的类或对象
import rootStore from '../store';
import Provider from '../store/Provider';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    currentCvs: 'Current conversation',
    conversationList: 'List of conversations',
    searchList: 'Search results for conversations',
    hasConversationNext: 'Indicates if there are more conversations to load',
    byId: 'Conversations indexed by ID',
    setCurrentCvs: 'Set the current conversation',
    setConversation: 'Set the list of conversations',
    addConversation: 'Add a new conversation',
    deleteConversation: 'Delete a conversation',
    modifyConversation: 'Modify an existing conversation',
    pinConversation: 'Pin a conversation',
    setSilentModeForConversation: 'Set silent mode for a conversation',
    clearRemindTypeForConversation: 'Clear remind type for a conversation',
    getSilentModeForConversations: 'Get silent mode for conversations',
    getServerPinnedConversations: 'Get server pinned conversations',
    setSearchList: 'Set the search results for conversations',
    ConversationStore:
      'ConversationStore is a data store that contains conversation lists, current conversations, search results, and methods to manage these data.',
  },
  zh: {
    currentCvs: '当前会话',
    conversationList: '会话列表',
    searchList: '会话搜索结果',
    hasConversationNext: '是否有更多会话可加载',
    byId: '按ID索引的会话',
    setCurrentCvs: '设置当前会话',
    setConversation: '设置会话列表',
    addConversation: '添加新会话',
    deleteConversation: '删除会话',
    modifyConversation: '修改现有会话',
    pinConversation: '置顶会话',
    setSilentModeForConversation: '为会话设置静音模式',
    clearRemindTypeForConversation: '清除会话提醒类型',
    getSilentModeForConversations: '获取会话的静音模式',
    getServerPinnedConversations: '获取服务器置顶会话',
    setSearchList: '设置会话搜索结果',
    ConversationStore:
      'ConversationStore 是一个数据仓库，包含会话列表、当前会话、搜索结果等数据和管理这些数据的方法。',
  },
};

// 假设我们有一个简单的组件来展示ConversationStore的内容
const ConversationStoreComponent = () => {
  return (
    <div>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <div>{description[lang].ConversationStore}</div>
      </Provider>
    </div>
  );
};

export default {
  title: 'Store/ConversationStore',
  component: ConversationStoreComponent,
  argTypes: {
    currentCvs: {
      control: 'object',
      description: description[lang].currentCvs,
      table: {
        type: {
          summary: 'object',
          detail: `{
    conversationId: string;
    chatType: ChatType;
    name?: string;
    unreadCount?: number;
}`,
        },
      },
    },
    conversationList: {
      control: 'array',
      description: description[lang].conversationList,
      table: {
        type: {
          summary: 'array',
          detail: `{
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    lastMessage: Exclude<ChatSDK.MessageBody, ChatSDK.ReadMsgBody | ChatSDK.DeliveryMsgBody>;
    unreadCount: number;
    name?: string;
    atType?: 'NONE' | 'ALL' | 'ME';
    isOnline?: boolean;
    avatarUrl?: string;
    isPinned?: boolean;
    silent?: boolean;
}[]`,
        },
      },
    },
    searchList: {
      control: 'array',
      description: description[lang].searchList,
      table: {
        type: {
          summary: 'array',
          detail: `{
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    lastMessage: Exclude<ChatSDK.MessageBody, ChatSDK.ReadMsgBody | ChatSDK.DeliveryMsgBody>;
    unreadCount: number;
    name?: string;
    atType?: 'NONE' | 'ALL' | 'ME';
    isOnline?: boolean;
    avatarUrl?: string;
    isPinned?: boolean;
    silent?: boolean;
}[]`,
        },
      },
    },

    byId: {
      control: 'object',
      description: description[lang].byId,
      table: {
        type: {
          summary: 'object',
          detail: `{
    [key: string]: Conversation;
}`,
        },
      },
    },
    setCurrentCvs: {
      description: description[lang].setCurrentCvs,
      table: {
        type: {
          summary: 'function',
          detail: `(currentCvs: {
  conversationId: string;
  chatType: ChatType;
  name?: string;
  unreadCount?: number;
}) => void`,
        },
      },
      control: 'function',
    },
    setConversation: {
      description: description[lang].setConversation,
      table: {
        type: { summary: 'function', detail: `(conversations: Conversation[]) => void` },
      },
      control: 'function',
    },
    setSearchList: {
      description: description[lang].setSearchList,
      table: {
        type: { summary: 'function', detail: `(searchList: Conversation[]) => void` },
      },
      control: 'function',
    },
    addConversation: {
      description: description[lang].addConversation,
      table: {
        type: { summary: 'function', detail: `(conversation: Conversation) => void` },
      },
      control: 'function',
    },
    deleteConversation: {
      description: description[lang].deleteConversation,
      table: {
        type: { summary: 'function', detail: `(conversation: CurrentConversation) => void` },
      },
      control: 'function',
    },
    modifyConversation: {
      description: description[lang].modifyConversation,
      table: {
        type: { summary: 'function', detail: `(conversation: Conversation) => void` },
      },
      control: 'function',
    },
    pinConversation: {
      description: description[lang].pinConversation,
      table: {
        type: {
          summary: 'function',
          detail: `(chatType: ChatType, cvsId: string, isPinned: boolean) => void`,
        },
      },
      control: 'function',
    },
    getServerPinnedConversations: {
      description: description[lang].getServerPinnedConversations,
      table: {
        type: { summary: 'function', detail: `() => Promise<Conversation[]>` },
      },
      control: 'function',
    },
    setSilentModeForConversation: {
      description: description[lang].setSilentModeForConversation,
      table: {
        type: { summary: 'function', detail: `(cvs: CurrentConversation) => void` },
      },
      control: 'function',
    },
    clearRemindTypeForConversation: {
      description: description[lang].clearRemindTypeForConversation,
      table: {
        type: { summary: 'function', detail: `(cvs: CurrentConversation) => void` },
      },
      control: 'function',
    },
    getSilentModeForConversations: {
      description: description[lang].getSilentModeForConversations,
      table: {
        type: { summary: 'function', detail: `(cvs: CurrentConversation[]) => void` },
      },
      control: 'function',
    },
  },
} as Meta<typeof ConversationStoreComponent>;

const Template: StoryFn<typeof ConversationStoreComponent> = args => <ConversationStoreComponent />;

export const Default = {
  render: Template,
  args: {
    // 根据实际的ConversationStore属性和方法设置默认参数
  },
};
