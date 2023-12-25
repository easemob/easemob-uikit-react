import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import MessageInput from './index';
import Provider from '../store/Provider';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/MessageInput',
  component: MessageInput,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof MessageInput>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof MessageInput> = args => (
  <Provider initConfig={{ appKey: 'z#b' }}>
    <MessageInput {...args} conversation={{ chatType: 'singleChat', conversationId: 'zd2' }} />
  </Provider>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
