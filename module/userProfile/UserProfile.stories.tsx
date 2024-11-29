import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import UserProfile from './index';
import { rootStore } from 'chatuim2';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/UserProfile',
  component: UserProfile,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} as Meta<typeof UserProfile>;

const DarkTemplate: StoryFn<typeof UserProfile> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <UserProfile {...args} />
    </div>
  </Provider>
);

export const Default = {
  args: {
    userId: 'henry',
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
    userId: 'tom',
  },
};
