import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import MessageStatus from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    style: 'css style',
    prefixCls: 'prefixCls',
    className: 'className',
    status: 'status',
    type: 'type',
  },
  zh: {
    style: '样式',
    prefixCls: '前缀',
    className: '类名',
    status: '状态',
    type: '类型',
  },
};

export default {
  title: 'Module/MessageStatus',
  component: MessageStatus,
  argTypes: {
    prefixCls: {
      control: 'text',
      description: description[lang].prefixCls,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    status: {
      control: 'select',
      options: ['received', 'read', 'unread', 'sent', 'failed', 'sending', 'default'],
      description: description[lang].status,
    },
    type: {
      control: 'select',
      options: ['icon', 'text'],
      description: description[lang].type,
    },
  },
} as Meta<typeof MessageStatus>;

export const sending = {
  args: {
    status: 'sending',
  },
};

export const sent = {
  args: {
    status: 'sent',
  },
};

export const received = {
  args: {
    status: 'received',
  },
};

export const read = {
  args: {
    status: 'read',
  },
};

export const failed = {
  args: {
    status: 'failed',
  },
};
