import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ConversationList } from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    conversationList:
      'ConversationList component is a container component that encapsulates the conversation list function. It is mainly used to display the conversation list, support search, sort, delete, pin, mute, and customize the conversation item. ',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    onSearch:
      'Callback for searching conversations, return false to prevent default search behavior',
    onItemClick: 'Callback for clicking each conversation',
    headerProps: 'props for Header',
    itemProps: 'props for ConversationItem',
    presence: 'Whether to show presence',
    showSearchList:
      'Whether to display the search list. When using renderHeader to customize the header, this parameter can be used to control whether to display the search list',
    renderHeader: 'Render header',
    renderSearch: 'Render search',
    renderItem: 'Render item',
    includeEmptyConversations: 'Whether to include empty conversations',
  },
  zh: {
    conversationList:
      'ConversationList 组件是一个容器组件，封装了会话列表功能。主要用于显示会话列表，支持搜索，排序，删除，置顶，免打扰，自定义会话项。',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    onSearch: '搜索会话时的change回调, 返回 false 阻止默认搜索行为',
    onItemClick: '点击每个会话的回调',
    headerProps: 'Header组件的属性',
    itemProps: 'ConversationItem 组件的属性',
    presence: '是否显示在线状态',
    showSearchList:
      '是否显示搜索列表，当使用renderHeader自定义Header时，可以用这个参数来控制是否显示搜索列表',
    renderHeader: '自定义渲染 header',
    renderSearch: '自定义渲染 search',
    renderItem: '自定义渲染 item',
    includeEmptyConversations: '是否包含空会话',
  },
};

export default {
  title: 'Container/ConversationList',
  component: ConversationList,
  parameters: {
    docs: {
      description: {
        component: description[lang].conversationList,
      },
    },
  },
  argTypes: {
    prefix: {
      control: {
        type: 'text',
      },
      description: description[lang].prefix,
    },
    className: {
      control: {
        type: 'text',
      },
      description: description[lang].className,
    },
    style: {
      control: {
        type: 'object',
      },
      description: description[lang].style,
    },
    onItemClick: {
      action: 'click',
      description: description[lang].onItemClick,
    },
    onSearch: {
      action: 'search',
      description: description[lang].onSearch,
    },
    headerProps: {
      control: {
        type: 'object',
      },
      description: description[lang].headerProps,
    },
    itemProps: {
      control: {
        type: 'object',
      },
      description: description[lang].itemProps,
    },
    presence: {
      control: {
        type: 'boolean',
      },
      description: description[lang].presence,
    },
    showSearchList: {
      control: {
        type: 'boolean',
      },
      description: description[lang].showSearchList,
    },
    renderHeader: {
      type: 'function',
      description: description[lang].renderHeader,
    },
    renderSearch: {
      type: 'function',
      description: description[lang].renderSearch,
    },
    renderItem: {
      type: 'function',
      description: description[lang].renderItem,
    },
    includeEmptyConversations: {
      control: {
        type: 'boolean',
      },
      description: description[lang].includeEmptyConversations,
    },
  },
} as Meta<typeof ConversationList>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof ConversationList> = args => (
  <Provider initConfig={{ appKey: 'a#b' }}>
    {' '}
    <ConversationList {...args} includeEmptyConversations={true} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof ConversationList> = args => (
  <Provider
    initConfig={{ appKey: 'a#b' }}
    theme={{
      mode: 'dark',
    }}
  >
    {' '}
    <ConversationList {...args} includeEmptyConversations={true} />
  </Provider>
);

const SquareTemplate: StoryFn<typeof ConversationList> = args => (
  <Provider
    initConfig={{ appKey: 'a#b' }}
    theme={{
      mode: 'light',
      avatarShape: 'square',
      bubbleShape: 'square',
      componentsShape: 'square',
    }}
  >
    {' '}
    <ConversationList {...args} includeEmptyConversations={true} />
  </Provider>
);

rootStore.conversationStore.setConversation([
  {
    chatType: 'singleChat',
    conversationId: 'user2',
    name: 'Henry',
    unreadCount: 3,
    lastMessage: {
      id: '1',
      type: 'txt',
      msg: 'hello',
      chatType: 'singleChat',
      from: 'user1',
      to: 'user2',
      time: Date.now(),
    },
  },
  {
    chatType: 'singleChat',
    conversationId: '1111',
    name: 'Tony',
    unreadCount: 0,
    lastMessage: {
      id: '1',
      type: 'txt',
      msg: 'hello',
      chatType: 'singleChat',
      from: 'user1',
      to: 'user2',
      time: Date.now(),
    },
  },
]);

export const Default = {
  render: Template,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
