import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Chat from './index';
import rootStore from '../store';
import Provider from '../store/Provider';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/Chat',
  component: Chat,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    bubbleType: '',
  },
} as ComponentMeta<typeof Chat>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const Template: ComponentStory<typeof Chat> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
    >
      <Chat {...args} />
    </Provider>
  </div>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
