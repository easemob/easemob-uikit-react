import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import rootStore from '../store';
import TextMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/TextMessage',
  component: TextMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof TextMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof TextMessage> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <TextMessage {...args} />
  </Provider>
);

export const Primary = {
  render: Template,

  args: {
    textMessage: {
      type: 'txt',
      msg: 'hello',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
      modifiedInfo: {
        operatorId: '',
        operationCount: 0,
        operationTime: 0,
      },
    },
  },
};

export const TextMessageWithReply = {
  render: Template,

  args: {
    textMessage: {
      id: '1189528432543795984',
      type: 'txt',
      chatType: 'singleChat',
      msg: 'asd',
      to: 'zd4',
      from: 'zd2',
      ext: {
        em_at_list: [],
        msgQuote: {
          msgID: '1187658028808145668',
          msgPreview: 'Start a video call',
          msgSender: 'zd4',
          msgType: 'txt',
        },
      },
      time: 1694523470608,
      onlineState: 3,
      status: 'sent',
      modifiedInfo: {
        operatorId: '',
        operationCount: 0,
        operationTime: 0,
      },
      bySelf: false,
    },
  },
};
