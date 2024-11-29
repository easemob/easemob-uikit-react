import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import FileMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/FileMessage',
  component: FileMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof FileMessage>;

export const Primary = {
  args: {
    fileMessage: {
      type: 'file',
      filename: 'test.txt',
      file_length: 1024,
      file: {
        url: 'http:example.com',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'http:example.com',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: true,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
  },
};

export const Secondly = {
  args: {
    type: 'secondly',
    direction: 'ltr',
    fileMessage: {
      type: 'file',
      filename: 'test.txt',
      file_length: 1024,
      file: {
        url: 'http:example.com',
        filename: 'test.txt',
        filetype: 'txt',
        data: {} as File,
      },
      url: 'http:example.com',
      id: '1234567890',
      to: 'userId',
      chatType: 'singleChat',
      bySelf: false,
      from: 'myUserId',
      time: Date.now(),
      status: 'sent',
    },
  },
};
