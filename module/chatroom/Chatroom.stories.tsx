import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Chatroom from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/Chatroom',
  component: Chatroom,
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
    chatroomId: {
      control: 'text',
      description: 'chatroom id',
    },
    reportType: {
      control: 'object',
      description: 'Customize report content, such as {"reportType": "report reason"}',
    },
    headerProps: {
      control: 'object',
      description: 'props for Header',
    },
    messageListProps: {
      control: 'object',
      description: 'props for MessageList',
    },
    messageInputProps: {
      control: 'object',
      description: 'props for MessageInput',
    },
    broadcastProps: {
      control: 'object',
      description: 'props for Broadcast',
    },
    renderHeader: {
      type: 'function',
      description: 'render header',
    },
    renderMessageList: {
      type: 'function',
      description: 'render message list',
    },
    renderMessageInput: {
      type: 'function',
      description: 'render message input',
    },
    renderBroadcast: {
      type: 'function',
      description: 'render broadcast',
    },
    renderEmpty: {
      type: 'function',
      description: 'render empty',
    },
  },
} as Meta<typeof Chatroom>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const DefaultTemplate: StoryFn<typeof Chatroom> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <Chatroom {...args} />
    </Provider>
  </div>
);

const DarkTemplate: StoryFn<typeof Chatroom> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <Chatroom {...args} />
    </Provider>
  </div>
);

const SquareTemplate: StoryFn<typeof Chatroom> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'light',
        avatarShape: 'square',
        bubbleShape: 'square',
        componentsShape: 'square',
      }}
    >
      <Chatroom {...args} />
    </Provider>
  </div>
);

export const Default = {
  render: DefaultTemplate,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
