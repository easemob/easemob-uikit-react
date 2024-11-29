import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ConversationList } from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/ConversationList',
  component: ConversationList,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof ConversationList>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof ConversationList> = args => (
  <Provider initConfig={{ appKey: 'a#b' }}>
    {' '}
    <ConversationList {...args} />
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
    <ConversationList {...args} />
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
    <ConversationList {...args} />
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
