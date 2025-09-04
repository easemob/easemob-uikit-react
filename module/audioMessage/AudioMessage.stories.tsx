import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import AudioMessage from './index';

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
