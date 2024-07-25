import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Chat, { ChatProps } from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { HeaderProps } from '../header';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/Chat',
  component: Chat,
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
    rtcConfig: {
      control: 'object',
      description: 'Audio and video call related configurations',
    },
    onOpenThread: {
      type: 'function',
      description: 'callback of opening thread',
    },
    onVideoCall: {
      type: 'function',
      description: 'callback of starting a video call',
    },
    onAudioCall: {
      type: 'function',
      description: 'callback of starting an audio call',
    },
    renderHeader: {
      type: 'function',
      // action: 'renderHeader',
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
    renderRepliedMessage: {
      type: 'function',
      description: 'render replied message',
    },
    renderEmpty: {
      type: 'function',
      description: 'render empty',
    },
  },
} as ComponentMeta<React.FC<ChatProps>>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const DefaultTemplate: ComponentStory<React.FC<ChatProps>> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <Chat {...args} />
    </Provider>
  </div>
);

const DarkTemplate: ComponentStory<React.FC<ChatProps>> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <Chat {...args} />
    </Provider>
  </div>
);

const SquareTemplate: ComponentStory<React.FC<ChatProps>> = args => (
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
      <Chat {...args} />
    </Provider>
  </div>
);

export const Default = DefaultTemplate.bind({});
export const Dark = DarkTemplate.bind({});
export const Square = SquareTemplate.bind({});
