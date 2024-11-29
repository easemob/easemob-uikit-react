import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import MessageInput from './index';
import Provider from '../store/Provider';
import { e } from 'vitest/dist/index-2f5b6168';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/MessageInput',
  component: MessageInput,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      control: 'text',
      description: 'css class name prefix',
      default: 'cui',
    },
    className: {
      control: 'text',
      description: 'css class name',
    },
    style: {
      control: 'object',
      description: 'css style',
    },
    enabledTyping: {
      control: 'boolean',
      description: 'Whether to enable typing',
      default: true,
    },
    conversation: {
      control: 'object',
      description: 'The current conversation',
    },
    showSendButton: {
      control: 'boolean',
      description: 'Whether to show the send button',
      default: true,
    },
    sendButtonIcon: {
      control: 'object',
      description: 'Send button icon',
    },
    row: {
      control: 'number',
      description: 'Number of rows',
      default: 1,
    },
    placeHolder: {
      control: 'text',
      description: 'Input box placeholder',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether to disable',
    },
    isChatThread: {
      control: 'boolean',
      description: 'Whether it is a chat thread',
    },
    enabledMention: {
      control: 'boolean',
      description: 'Whether to enable @mention',
    },
    actions: {
      control: 'object',
      description: 'Custom action buttons',
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
      description: 'Custom action buttons',
      defaultValue: [
        { content: 'FILE' },
        { content: 'IMAGE' },
        { content: 'VIDEO' },
        { content: 'CARD' },
      ],
    },
    onSendMessage: {
      action: 'onSendMessage',
      description: 'Send message callback',
    },
    onBeforeSendMessage: {
      action: 'onBeforeSendMessage',
      description: 'Before sending message callback',
    },
    giftKeyboardProps: {
      control: 'object',
      description: 'Gift keyboard props',
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
