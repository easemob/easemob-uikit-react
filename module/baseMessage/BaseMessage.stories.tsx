import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import BaseMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/BaseMessage',
  component: BaseMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as Meta<typeof BaseMessage>;

export const Primary = {
  args: {
    bubbleType: 'primary',
  },
};
