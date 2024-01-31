import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import GroupDetail from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/GroupDetail',
  component: GroupDetail,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof GroupDetail>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

const Template: ComponentStory<typeof GroupDetail> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <GroupDetail {...args} />
  </Provider>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  conversation: {
    conversationId: '236518002196485',
    chatType: 'groupChat',
  },
};
