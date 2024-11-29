import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Button from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'pure component/Button',
  component: Button,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'ghost', 'text', 'default'],
    },
  },
} as Meta<typeof Button>;

export const Default = {
  args: {
    type: 'primary',
  },
};
