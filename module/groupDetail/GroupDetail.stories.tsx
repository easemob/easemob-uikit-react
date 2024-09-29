import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
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
} as Meta<typeof GroupDetail>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

const Template: StoryFn<typeof GroupDetail> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
  >
    <GroupDetail {...args} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof GroupDetail> = args => (
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

export const Default = {
  render: Template,

  args: {
    conversation: {
      conversationId: '236518002196485',
      chatType: 'groupChat',
    },
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
    conversation: {
      conversationId: '236518002196485',
      chatType: 'groupChat',
    },
  },
};
