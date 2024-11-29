import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ConversationItem } from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/ConversationItem',
  component: ConversationItem,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof ConversationItem>;

export const Default = {
  args: {
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
  },
};
