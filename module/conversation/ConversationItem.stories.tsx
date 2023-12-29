import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { ConversationItem } from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/ConversationItem',
  component: ConversationItem,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ConversationItem>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ConversationItem> = args => <ConversationItem {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  data: {
    chatType: 'singleChat',
    conversationId: 'user2',
    name: 'Henry',
    unreadCount: 3,
    lastMessage: {
      id: '1',
      to: 'user2',
      type: 'txt',
      msg: 'hello',
      chatType: 'singleChat',
      from: 'user1',
      time: Date.now(),
    },
  },
};
