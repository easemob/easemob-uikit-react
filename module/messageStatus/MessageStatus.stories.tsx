import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import MessageStatus from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/MessageStatus',
  component: MessageStatus,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof MessageStatus>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof MessageStatus> = args => <MessageStatus {...args} />;

export const sending = Template.bind({});
export const sent = Template.bind({});
export const received = Template.bind({});
export const read = Template.bind({});
export const failed = Template.bind({});

// More on args: https://storybook.js.org/docs/react/writing-stories/args
sending.args = {
  status: 'sending',
};
sent.args = {
  status: 'sent',
};
received.args = {
  status: 'received',
};
read.args = {
  status: 'read',
};
failed.args = {
  status: 'failed',
};
