import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import VideoMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    videoMessage: 'Video Message',
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    bubbleClass: 'bubble class',
    type: 'type',
    videoProps: 'video props',
  },
  zh: {
    videoMessage: '视频消息',
    prefix: 'css 类名前缀',
    className: 'css 类名',
    style: 'css 样式',
    bubbleClass: 'bubble 类名',
    type: '类型',
    videoProps: 'video 标签属性',
  },
};
export default {
  title: 'Module/VideoMessage',
  component: VideoMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    videoMessage: {
      description: description[lang].videoMessage,
      control: {
        type: 'object',
      },
    },
    prefix: {
      description: description[lang].prefix,
      control: {
        type: 'text',
      },
    },
    className: {
      description: description[lang].className,
      control: {
        type: 'text',
      },
    },
    style: {
      description: description[lang].style,
      control: {
        type: 'object',
      },
    },
    bubbleClass: {
      description: description[lang].bubbleClass,
      control: {
        type: 'text',
      },
    },
    type: {
      description: description[lang].type,
      control: {
        type: 'select',
        options: ['primary', 'secondly'],
      },
    },
    videoProps: {
      description: description[lang].videoProps,
      control: {
        type: 'object',
      },
    },
  },
} as Meta<typeof VideoMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof VideoMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <VideoMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    videoMessage: {
      bySelf: true,
      status: 'read',
      id: '1239518913788642904',
      type: 'video',
      chatType: 'singleChat',
      from: 'zd2',
      to: 'ljn',
      url: 'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      thumb:
        'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc&vframe=true',
      thumb_secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      filename: '9f6982b61c1d8c56a8e7497a4d6c5857.mov',
      length: 0,
      file: {} as FileObj,
      file_length: 4364210,
      filetype: '',
      accessToken:
        'YWMtIf-vkMAHEe6c2MuyWS0mOFzzvlQ7sUrSpVuQGlyIzFRFkCIQGcwR7bF7ZX4Zh6nOAwMAAAGNXlZjFTeeSAAhJwEadorA32-JBb5SxWmTBXO1T2_O0loXuNs0cysMhw',
      ext: {
        ease_chat_uikit_user_info: {
          nickname: '我的名字zd2',
          avatarURL: '',
        },
      },
      time: 1706162786531,
    },
  },
};

export const Secondly = {
  render: Template,

  args: {
    type: 'secondly',
    direction: 'ltr',
    videoMessage: {
      bySelf: false,
      status: 'received',
      id: '1239518913788642904',
      type: 'video',
      chatType: 'singleChat',
      from: 'zd2',
      to: 'ljn',
      url: 'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      thumb:
        'https://a4-v2.easemob.com/easemob/easeim/chatfiles/dfab9460-bb47-11ee-9588-db947bb82d2a?em-redirect=true&share-secret=36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc&vframe=true',
      thumb_secret: '36wwoLtHEe6TWaXj8svlq2yZParnRbw-Oa-8DkviwYjuC1Uc',
      filename: '9f6982b61c1d8c56a8e7497a4d6c5857.mov',
      length: 0,
      file: {} as FileObj,
      file_length: 4364210,
      filetype: '',
      accessToken:
        'YWMtIf-vkMAHEe6c2MuyWS0mOFzzvlQ7sUrSpVuQGlyIzFRFkCIQGcwR7bF7ZX4Zh6nOAwMAAAGNXlZjFTeeSAAhJwEadorA32-JBb5SxWmTBXO1T2_O0loXuNs0cysMhw',
      ext: {
        ease_chat_uikit_user_info: {
          nickname: '我的名字zd2',
          avatarURL: '',
        },
      },
      time: 1706162786531,
    },
  },
};
