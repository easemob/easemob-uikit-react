import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import MessageInput from './index';
import Provider from '../store/Provider';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    enabledTyping: 'Whether to enable typing',
    conversation: 'The current conversation',
    showSendButton: 'Whether to show the send button',
    sendButtonIcon: 'Send button icon',
    row: 'Number of rows',
    placeHolder: 'Input box placeholder',
    disabled: 'Whether to disable',
    isChatThread: 'Whether it is a chat thread',
    enabledMention: 'Whether to enable @mention',
    actions: 'Custom action buttons',
    customActions: 'Custom + button actions',
    onSendMessage: 'Send message callback',
    onBeforeSendMessage: 'Before sending message callback',
    giftKeyboardProps: 'Gift keyboard props',
  },
  zh: {
    prefix: '类名前缀',
    className: '类名',
    style: '样式',
    enabledTyping: '是否启用打字状态',
    conversation: '当前会话',
    showSendButton: '是否显示发送按钮',
    sendButtonIcon: '发送按钮图标',
    row: '行数',
    placeHolder: '输入框占位符',
    disabled: '是否禁用',
    isChatThread: '是否是聊天线程',
    enabledMention: '是否启用@提及',
    actions: '自定义动作按钮',
    customActions: '自定义+按钮里面的动作',
    onSendMessage: '发送消息回调',
    onBeforeSendMessage: '发送消息前回调',
    giftKeyboardProps: '礼物键盘属性',
  },
};
export default {
  title: 'Module/MessageInput',
  component: MessageInput,
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      default: 'cui',
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    enabledTyping: {
      control: 'boolean',
      description: description[lang].enabledTyping,
      default: true,
    },
    conversation: {
      control: 'object',
      description: description[lang].conversation,
    },
    showSendButton: {
      control: 'boolean',
      description: description[lang].showSendButton,
      default: true,
    },
    sendButtonIcon: {
      control: 'object',
      description: description[lang].sendButtonIcon,
    },
    row: {
      control: 'number',
      description: description[lang].row,
      default: 1,
    },
    placeHolder: {
      control: 'text',
      description: description[lang].placeHolder,
    },
    disabled: {
      control: 'boolean',
      description: description[lang].disabled,
    },
    isChatThread: {
      control: 'boolean',
      description: description[lang].isChatThread,
    },
    enabledMention: {
      control: 'boolean',
      description: description[lang].enabledMention,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    actions: {
      control: 'object',
      description: description[lang].actions,
      table: {
        type: { summary: 'Action[]' },
        defaultValue: {
          summary:
            '[{ name: "RECORDER", visible: true, icon: "" }, { name: "TEXTAREA", visible: true, icon: "" }, { name: "EMOJI", visible: true, icon: "" }, { name: "MORE", visible: true, icon: "" }]',
        },
      },
      defaultValue: [
        {
          name: 'RECORDER',
          visible: true,
          icon: '',
        },
        {
          name: 'TEXTAREA',
          visible: true,
          icon: '',
        },
        {
          name: 'EMOJI',
          visible: true,
          icon: '',
        },
        {
          name: 'MORE',
          visible: true,
          icon: '',
        },
      ],
    },
    customActions: {
      control: 'object',
      description: description[lang].customActions,
      table: {
        type: { summary: 'Action[]' },
        defaultValue: {
          summary:
            '[{ content: "FILE" }, { content: "IMAGE" }, { content: "VIDEO" }, { content: "CARD" }]',
        },
      },
      defaultValue: [
        { content: 'FILE' },
        { content: 'IMAGE' },
        { content: 'VIDEO' },
        { content: 'CARD' },
      ],
    },
    onSendMessage: {
      action: 'onSendMessage',
      description: description[lang].onSendMessage,
    },
    onBeforeSendMessage: {
      action: 'onBeforeSendMessage',
      description: description[lang].onBeforeSendMessage,
    },
    giftKeyboardProps: {
      control: 'object',
      description: description[lang].giftKeyboardProps,
    },
  },
} as Meta<typeof MessageInput>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof MessageInput> = args => (
  <Provider initConfig={{ appKey: 'z#b' }}>
    <MessageInput {...args} conversation={{ chatType: 'singleChat', conversationId: 'zd2' }} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof MessageInput> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <MessageInput {...args} conversation={{ chatType: 'singleChat', conversationId: 'zd2' }} />
    </div>
  </Provider>
);

const SquareTemplate: StoryFn<typeof MessageInput> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'light', componentsShape: 'square' }}>
    <div style={{ background: '#171a1c' }}>
      <MessageInput {...args} conversation={{ chatType: 'singleChat', conversationId: 'zd2' }} />
    </div>
  </Provider>
);

export const Default = {
  render: Template,
  args: {},
};

export const Dark = {
  render: DarkTemplate,
};

export const Square = {
  render: SquareTemplate,
};
