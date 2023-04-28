import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import AudioMessage from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/AudioMessage',
  component: AudioMessage,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleType: '',
  },
} as ComponentMeta<typeof AudioMessage>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof AudioMessage> = args => <AudioMessage {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  type: 'primary',
  audioMessage: {
    type: 'audio',
    filename: 'audio.wav',
    length: 3,
    file_length: 1024,
    chatType: 'singleChat',
    time: Date.now(),
    status: 'read',
    bySelf: true,
    file: {
      url: 'hppt://example',
      filename: 'string',
      filetype: 'audio',
      data: {} as Blob,
      length: 3,
      duration: 3,
    },
    id: '12345678901',
    to: 'userId',
    from: 'myId',
  },
};
