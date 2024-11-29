import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import AudioMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/AudioMessage',
  component: AudioMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleType: '',
  },
} as Meta<typeof AudioMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof AudioMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <AudioMessage {...args} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof AudioMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
    theme={{
      mode: 'dark',
    }}
  >
    <AudioMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    type: 'primary',
    audioMessage: {
      type: 'audio',
      filename: 'audio.wav',
      length: 3,
      file_length: 1024,
      chatType: 'singleChat',
      time: Date.now(),
      status: 'read',
      bySelf: true,
      file: {
        url: 'hppt://example',
        filename: 'string',
        filetype: 'audio',
        data: {} as unknown as File,
        length: 3,
        duration: 3,
      },
      id: '12345678901',
      to: 'userId',
      from: 'myId',
    },
  },
};

export const Secondly = {
  render: Template,

  args: {
    type: 'secondly',
    direction: 'ltr',
    audioMessage: {
      type: 'audio',
      filename: 'audio.wav',
      length: 3,
      file_length: 1024,
      chatType: 'singleChat',
      time: Date.now(),
      status: 'read',
      bySelf: false,
      file: {
        url: 'hppt://example',
        filename: 'string',
        filetype: 'audio',
        data: {} as unknown as File,
        length: 3,
        duration: 3,
      },
      id: '12345678901',
      to: 'userId',
      from: 'myId',
    },
  },
};
