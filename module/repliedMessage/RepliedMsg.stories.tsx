import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import { RepliedMsg, RepliedMsgProps } from './index';
import type { ChatSDK } from '../SDK';
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    message: 'message',
    prefixCls: 'prefixCls',
    className: 'className',
    style: 'style',
    shape: 'shape',
    direction: 'direction',
  },
  zh: {
    message: '消息',
    prefixCls: '类名前缀',
    className: '类名',
    style: '样式',
    shape: '气泡形状',
    direction: '方向',
  },
};
export default {
  title: 'Module/RepliedMsg',
  component: RepliedMsg,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
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
    shape: {
      control: 'select',
      options: ['round', 'square'],
      description: description[lang].shape,
    },
    direction: {
      control: 'select',
      options: ['ltr', 'rtl'],
      description: description[lang].direction,
    },
    message: {
      control: 'object',
      description: description[lang].message,
      table: {
        type: { summary: 'BaseMessageType' },
        details: {
          summary:
            'SDK5 Message: { msgServerId, type: "text", conversationType: "singleChat", body: { content: "asd" }, ext: { msgQuote } }',
        },
      },
    },
  },
} as Meta<typeof RepliedMsg>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<RepliedMsgProps> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <RepliedMsg {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    message: {
      msgLocalId: 'reply-story-local-1',
      msgServerId: '1189528432543795984',
      type: 'text',
      conversationType: 'singleChat',
      conversationId: 'zd4',
      body: { content: 'asd' },
      to: 'zd4',
      from: 'zd2',
      sender: { userId: 'zd2' },
      ext: {
        em_at_list: [],
        msgQuote: {
          msgID: '1187658028808145668',
          msgPreview: 'Start a video call',
          msgSender: 'zd4',
          msgType: 'txt',
        },
      },
      timestamp: 1694523470608,
      onlineState: 3,
      status: 'sent',
      direct: 'RECEIVE',
    } as ChatSDK.Message,
  },
};
