import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Thread from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/Thread',
  component: Thread,
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
    messageListProps: {
      control: 'object',
      description: 'props for MessageList',
    },
    messageInputProps: {
      control: 'object',
      description: 'props for MessageInput',
    },
  },
} as Meta<typeof Thread>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Thread> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <Thread {...args} />
    </Provider>
  </div>
);
const DarkTemplate: StoryFn<typeof Thread> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <Thread {...args} />
    </Provider>
  </div>
);

const SquareTemplate: StoryFn<typeof Thread> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
        avatarShape: 'square',
        bubbleShape: 'square',
        componentsShape: 'square',
      }}
    >
      <Thread {...args} />
    </Provider>
  </div>
);

rootStore.threadStore.currentThread.originalMessage = {
  id: '1189201674950937348',
  type: 'txt',
  chatType: 'groupChat',
  msg: 'Start a audio call',
  to: '182614118957057',
  from: 'zd3',
  ext: {
    action: 'invite',
    type: 3,
    msgType: 'rtcCallWithAgora',
    callId: '429493790825',
    channelName: '49035279',
    callerDevId: 'webim_random_1694446193223',
    ts: 1694447390825,
  },
  time: 1694447391423,
  onlineState: 3,
};
export const Default = {
  render: Template,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
