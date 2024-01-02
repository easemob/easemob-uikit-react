import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import { RepliedMsg } from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/RepliedMsg',
  component: RepliedMsg,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof RepliedMsg>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof RepliedMsg> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <RepliedMsg {...args} />
  </Provider>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  message: {
    id: '1189528432543795984',
    type: 'txt',
    chatType: 'singleChat',
    msg: 'asd',
    to: 'zd4',
    from: 'zd2',
    ext: {
      em_at_list: [],
      msgQuote: {
        msgID: '1187658028808145668',
        msgPreview: 'Start a video call',
        msgSender: 'zd4',
        msgType: 'txt',
      },
    },
    time: 1694523470608,
    onlineState: 3,
  },
};
