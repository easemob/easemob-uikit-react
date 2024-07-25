import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import Header from './index';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/Header',
  component: Header,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof Header>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Header> = args => <Header {...args} />;

const DarkTemplate: ComponentStory<typeof Header> = args => (
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

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  content: 'Header',
  subtitle: 'Subtitle',
};
