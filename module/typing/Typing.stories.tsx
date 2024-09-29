import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

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
} as Meta<typeof Typing>;

rootStore.messageStore.setTyping(
  {
    chatType: 'singleChat',
    conversationId: 'zd2',
  },
  true,
);

export const Primary = {
  args: {
    conversation: {
      chatType: 'singleChat',
      conversationId: 'zd2',
      name: 'Henry',
    },
  },
};
