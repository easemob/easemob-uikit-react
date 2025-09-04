import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import UserCardMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    customMessage: 'Custom message',
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    onClick: 'Callback when clicking',
    bubbleClass: 'bubble class name',
    onUserIdCopied: 'Callback when copying user ID',
    type: 'type',
  },
  zh: {
    customMessage: '自定义消息',
    prefix: '类名前缀',
    className: '类名',
    style: '样式',
    onClick: '点击回调',
    bubbleClass: '气泡类名',
    onUserIdCopied: '用户ID复制回调',
    type: '类型',
  },
};
export default {
  title: 'Module/UserCardMessage',
  component: UserCardMessage,
  argTypes: {
    customMessage: {
      description: description[lang].customMessage,
      control: {
        type: 'object',
      },
      table: {
        type: { summary: 'CustomMessageType' },
      },
    },
    prefix: {
      description: description[lang].prefix,
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
    className: {
      description: description[lang].className,
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
    onClick: {
      description: description[lang].onClick,
    },
    bubbleClass: {
      description: description[lang].bubbleClass,
      control: {
        type: 'text',
      },
    },
    onUserIdCopied: {
      description: description[lang].onUserIdCopied,
    },
  },
} as Meta<typeof UserCardMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof UserCardMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <UserCardMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    customMessage: {
      type: 'custom',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
      customEvent: 'userCard',
      customExts: {
        uid: 'zd2',
        nickname: 'Tom',
        avatar:
          'https://accktvpic.oss-cn-beijing.aliyuncs.com/pic/sample_avatar/sample_avatar_1.png',
      },
    },
  },
};

export const Secondly = {
  render: Template,

  args: {
    type: 'secondly',
    direction: 'ltr',
    customMessage: {
      type: 'custom',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: false,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
      customEvent: 'userCard',
      customExts: {
        uid: 'zd2',
        nickname: 'Tom',
        avatar:
          'https://accktvpic.oss-cn-beijing.aliyuncs.com/pic/sample_avatar/sample_avatar_1.png',
      },
    },
  },
};
