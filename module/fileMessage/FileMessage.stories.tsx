import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import FileMessage from './index';
import Icon, { IconProps } from '../../src/icon';
import { FileObj } from '../types/messageType';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/FileMessage',
  component: FileMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof FileMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof FileMessage> = args => <FileMessage {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
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
};
