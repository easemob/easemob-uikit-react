import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { NoticeMessageBody } from './NoticeMessage';
import NoticeMessage from './index';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    prefix: 'prefix',
    className: 'className',
    noticeMessage: 'noticeMessage',
    style: 'style',
  },
  zh: {
    prefix: '前缀',
    className: '类名',
    noticeMessage: '消息体',
    style: '样式',
  },
};

export default {
  title: 'Module/NoticeMessage',
  component: NoticeMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    noticeMessage: {
      control: 'object',
      description: description[lang].noticeMessage,
      table: {
        type: { summary: 'NoticeMessageBody' },
        details: {
          summary: 'new NoticeMessageBody({ time: Date.now(), noticeType: "recall" })',
        },
      },
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
  },
} as Meta<typeof NoticeMessage>;

export const Primary = {
  args: {
    noticeMessage: new NoticeMessageBody({
      time: Date.now(),
      noticeType: 'recall',
    }),
  },
};
