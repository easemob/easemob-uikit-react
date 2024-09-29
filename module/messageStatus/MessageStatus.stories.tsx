import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import MessageStatus from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/MessageStatus',
  component: MessageStatus,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof MessageStatus>;

export const sending = {
  args: {
    status: 'sending',
  },
};

export const sent = {
  args: {
    status: 'sent',
  },
};

export const received = {
  args: {
    status: 'received',
  },
};

export const read = {
  args: {
    status: 'read',
  },
};

export const failed = {
  args: {
    status: 'failed',
  },
};
