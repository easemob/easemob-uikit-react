import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { Typing } from './index';
import rootStore from '../store';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    onHide: 'Callback when hiding',
    onShow: 'Callback when showing',
    conversation: 'conversation',
  },
  zh: {
    prefix: '类名前缀',
    className: '类名',
    style: '样式',
    onHide: '隐藏回调',
    onShow: '显示回调',
    conversation: '会话',
  },
};

export default {
  title: 'Module/Typing',
  component: Typing,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      description: description[lang].prefix,
      control: {
        type: 'text',
      },
    },
    className: {
      description: description[lang].className,
      control: {
        type: 'text',
      },
    },
    style: {
      description: description[lang].style,
      control: {
        type: 'object',
      },
    },
    onHide: {
      description: description[lang].onHide,
    },
    onShow: {
      description: description[lang].onShow,
    },
    conversation: {
      description: description[lang].conversation,
      control: {
        type: 'object',
      },
      table: {
        type: { summary: 'CurrentConversation' },
      },
    },
  },
} as Meta<typeof Typing>;

rootStore.messageStore.setTyping(
  {
    chatType: 'singleChat',
    conversationId: 'zd2',
  },
  true,
);

export const Primary = {
  args: {
    conversation: {
      chatType: 'singleChat',
      conversationId: 'zd2',
      name: 'Henry',
    },
  },
};
