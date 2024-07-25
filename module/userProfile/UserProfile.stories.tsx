import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
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
} as ComponentMeta<typeof UserProfile>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof UserProfile> = args => <UserProfile {...args} />;

const DarkTemplate: ComponentStory<typeof UserProfile> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <UserProfile {...args} />
    </div>
  </Provider>
);

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  userId: 'henry',
};

Dark.args = {
  userId: 'tom',
};
