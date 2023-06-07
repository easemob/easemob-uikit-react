import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import TextMessage from './index';
import Icon, { IconProps } from '../../component/icon';
import { FileObj } from '../types/messageType';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/TextMessage',
  component: TextMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof TextMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TextMessage> = args => <TextMessage {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
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
  },
};
