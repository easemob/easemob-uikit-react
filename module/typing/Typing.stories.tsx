import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Typing from './index';
import rootStore from '../store';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Typing',
  component: Typing,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Typing>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Typing> = args => <Typing {...args} />;

rootStore.messageStore.setTyping(
  {
    chatType: 'singleChat',
    conversationId: 'zd2',
  },
  true,
);
export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  conversation: {
    chatType: 'singleChat',
    conversationId: 'zd2',
    name: 'Henry',
  },
};
