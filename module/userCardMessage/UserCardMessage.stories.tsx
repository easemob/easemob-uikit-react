import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
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
} as ComponentMeta<typeof UserCardMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof UserCardMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <UserCardMessage {...args} />
  </Provider>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
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
      nickname: '赵云',
      avatar: 'https://accktvpic.oss-cn-beijing.aliyuncs.com/pic/sample_avatar/sample_avatar_1.png',
    },
  },
};
