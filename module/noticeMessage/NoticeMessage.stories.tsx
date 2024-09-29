import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { NoticeMessageBody } from './NoticeMessage';
import NoticeMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/NoticeMessage',
  component: NoticeMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof NoticeMessage>;

export const Primary = {
  args: {
    noticeMessage: new NoticeMessageBody({
      time: Date.now(),
      noticeType: 'recall',
    }),
  },
};
