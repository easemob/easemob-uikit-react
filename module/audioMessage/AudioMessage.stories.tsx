import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import AudioMessage, { AudioMessageProps } from './index';

const audioMessage = {
  msgLocalId: 'audio-local-1',
  msgServerId: 'audio-server-1',
  type: 'voice',
  body: {
    url: 'https://example.com/audio.wav',
    filename: 'audio.wav',
    filetype: 'audio',
    duration: 3,
    fileLength: 1024,
  },
  conversationId: 'userId',
  conversationType: 'singleChat',
  timestamp: Date.now(),
  status: 'read',
  direct: 'SEND',
  from: 'myId',
  to: 'userId',
  sender: { userId: 'myId' },
  bySelf: true,
  file: {
    url: 'https://example.com/audio.wav',
    filename: 'audio.wav',
    filetype: 'audio',
    data: {} as File,
    length: 3,
    duration: 3,
  },
} as AudioMessageProps['audioMessage'];

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    audioMessage: 'Audio message received from SDK',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    bubbleClass: 'Bubble class name',
    type: 'Bubble type',
    onlyContent: 'Only show content, not bubble',
  },
  zh: {
    audioMessage: '从SDK收到的语音消息',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    bubbleClass: '气泡类名',
    type: '气泡类型',
    onlyContent: '只显示内容, 不显示气泡',
  },
};
export default {
  title: 'Module/AudioMessage',
  component: AudioMessage,
  argTypes: {
    audioMessage: {
      control: {
        type: 'object',
      },
      description: description[lang].audioMessage,
    },
    prefix: {
      control: {
        type: 'text',
      },
      description: description[lang].prefix,
    },
    style: {
      control: {
        type: 'object',
      },
      description: description[lang].style,
    },
    className: {
      control: {
        type: 'text',
      },
      description: description[lang].className,
    },
    bubbleClass: {
      control: {
        type: 'text',
      },
      description: description[lang].bubbleClass,
    },
    type: {
      control: 'select',
      options: ['primary', 'secondly'],
      description: description[lang].type,
    },
    onlyContent: {
      control: {
        type: 'boolean',
      },
      description: description[lang].onlyContent,
    },
  },
} as Meta<typeof AudioMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<AudioMessageProps> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <AudioMessage {...args} />
  </Provider>
);

const DarkTemplate: StoryFn<AudioMessageProps> = args => (
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
    audioMessage,
  },
};

export const Secondly = {
  render: Template,

  args: {
    type: 'secondly',
    direction: 'ltr',
    audioMessage: {
      ...audioMessage,
      direct: 'RECEIVE',
      bySelf: false,
    },
  },
};
