import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import CombinedMessage, { CombinedMessageProps } from './index';
import type { ChatSDK } from '../SDK';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    combinedMessage: 'Combined message received from SDK',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    type: 'Bubble type',
    bubbleClass: 'Bubble class name',
    onShowDetail: 'Show detail callback function, parameter is message object',
    showSummary: 'Whether to show summary',
    onlyContent: 'Only show content, not bubble',
  },
  zh: {
    combinedMessage: '从SDK收到的合并消息',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    type: '气泡类型',
    bubbleClass: '气泡类名',
    onShowDetail: '展示详情的回调函数, 参数为消息对象',
    showSummary: '是否显示摘要',
    onlyContent: '只显示内容, 不显示气泡',
  },
};

export default {
  title: 'Module/CombinedMessage',
  component: CombinedMessage,
  argTypes: {
    prefix: {
      control: 'text',
      type: 'string',
      description: description[lang].prefix,
    },
    className: {
      control: 'text',
      type: 'string',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    combinedMessage: {
      control: 'object',
      description: description[lang].combinedMessage,
    },
    type: {
      control: 'select',
      options: ['primary', 'secondly'],
      description: description[lang].type,
    },
    bubbleClass: {
      control: 'text',
      description: description[lang].bubbleClass,
    },
    onShowDetail: {
      action: 'showDetail',
      description: description[lang].onShowDetail,
    },
    showSummary: {
      control: 'boolean',
      description: description[lang].showSummary,
    },
    onlyContent: {
      control: 'boolean',
      description: description[lang].onlyContent,
    },
  },
} as Meta<typeof CombinedMessage>;

const combinedMessage = {
  msgLocalId: 'combine-local-1',
  msgServerId: '1190206342359419660',
  type: 'combine',
  conversationId: 'zd2',
  conversationType: 'singleChat',
  to: 'zd2',
  from: 'zd4',
  sender: { userId: 'zd4' },
  timestamp: 1694681306249,
  direct: 'SEND',
  status: 'sent',
  body: {
    compatibleText: 'the combine message',
    title: 'Chat History',
    summary: 'zd4: /Audio message/\nzd2: Start a audio call\nzd2: asd\n',
    url: 'https://example.com/combined-message.json',
    secret: 'example-secret',
    messages: [
      {
        msgLocalId: 'combine-voice-local-1',
        msgServerId: '1185022473184217860',
        type: 'voice',
        conversationId: 'zd2',
        conversationType: 'singleChat',
        from: 'zd4',
        to: 'zd2',
        sender: { userId: 'zd4' },
        timestamp: 1693474345180,
        direct: 'RECEIVE',
        status: 'sent',
        body: {
          url: 'https://example.com/audio-message.wav',
          filename: 'audio-message.wav',
          filetype: 'audio',
          duration: 2,
          fileLength: 65580,
        },
      },
      {
        msgLocalId: 'combine-text-local-1',
        msgServerId: '1189366073632230160',
        type: 'text',
        conversationId: 'zd4',
        conversationType: 'singleChat',
        to: 'zd4',
        from: 'zd2',
        sender: { userId: 'zd2' },
        timestamp: 1694485668475,
        direct: 'SEND',
        status: 'sent',
        body: {
          content: 'Start a audio call',
        },
      },
      {
        msgLocalId: 'combine-text-local-2',
        msgServerId: '1189528432543795984',
        type: 'text',
        conversationId: 'zd4',
        conversationType: 'singleChat',
        to: 'zd4',
        from: 'zd2',
        sender: { userId: 'zd2' },
        timestamp: 1694523470608,
        direct: 'SEND',
        status: 'sent',
        body: {
          content: 'asd',
        },
        ext: {
          em_at_list: [],
          msgQuote: {
            msgID: '1187658028808145668',
            msgPreview: 'Start a video call',
            msgSender: 'zd4',
            msgType: 'text',
          },
        },
      },
    ],
  },
  bySelf: true,
} as unknown as ChatSDK.Message;

const Template: StoryFn<CombinedMessageProps> = args => <CombinedMessage {...args} />;

export const Primary = {
  render: Template,
  args: {
    bubbleType: 'primary',
    combinedMessage,
  },
};

export const Secondly = {
  render: Template,
  args: {
    bubbleType: 'secondly',
    direction: 'ltr',
    combinedMessage: {
      ...combinedMessage,
      direct: 'RECEIVE',
      bySelf: false,
    },
  },
};
