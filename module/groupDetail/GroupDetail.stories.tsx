import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import { GroupDetail } from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/GroupDetail',
  component: GroupDetail,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    prefix: {
      control: 'text',
      description: 'css class name prefix',
      default: 'cui',
    },
    className: {
      control: 'text',
      description: 'css class name',
    },
    style: {
      control: 'object',
      description: 'css style',
    },
    conversation: {
      control: 'object',
      description: 'conversation object',
    },
    onUserIdCopied: {
      type: 'function',
      description: 'callback of copying user id',
    },
    onLeaveGroup: {
      type: 'function',
      description: 'callback of leaving group',
    },
    onDestroyGroup: {
      type: 'function',
      description: 'callback of destroying group',
    },
  },
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

const DarkTemplate: ComponentStory<typeof GroupDetail> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
    theme={{
      mode: 'dark',
    }}
  >
    <GroupDetail {...args} />
  </Provider>
);

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  conversation: {
    conversationId: '236518002196485',
    chatType: 'groupChat',
  },
};

Dark.args = {
  conversation: {
    conversationId: '236518002196485',
    chatType: 'groupChat',
  },
};
