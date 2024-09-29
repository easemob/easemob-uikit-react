import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import Header from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Header',
  component: Header,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof Header>;

const DarkTemplate: StoryFn<typeof Header> = args => (
  <Provider
    initConfig={{
      appKey: 'a#b',
    }}
    theme={{
      mode: 'dark',
    }}
  >
    <div style={{ background: '#464e53' }}>
      <Header {...args} />
    </div>
  </Provider>
);

export const Default = {
  args: {
    content: 'Header',
    subtitle: 'Subtitle',
  },
};

export const Dark = {
  render: DarkTemplate,
};
