import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import NoticeMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/NoticeMessage',
  component: NoticeMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof NoticeMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof NoticeMessage> = args => <NoticeMessage {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  noticeMessage: {
    message: 'You recalled a message',
    time: Date.now(),
  },
};
