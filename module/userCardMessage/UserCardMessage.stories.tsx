import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import UserCardMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/UserCardMessage',
  component: UserCardMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
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
