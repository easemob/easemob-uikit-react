import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import { ContactList } from './index';
import rootStore from '../store';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Container/ContactList',
  component: ContactList,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ContactList>;

rootStore.addressStore.setContacts([
  {
    initial: 'A',
    name: '艾神zd2',
    nickname: '艾神zd2',
    remark: null,
    userId: 'zd2',
  },
  {
    initial: 'B',
    name: 'Bob',
    nickname: 'Bob',
    remark: null,
    userId: 'bob',
  },
]);
rootStore.addressStore.setGroups([
  {
    groupid: '252198136119298',
    groupname: 'Ally、Alan、Henry',
    avatarUrl: '',
    name: '艾神zd2、阿兰zd1、lxm',
    initial: 'A',
  },
]);
rootStore.addressStore.setAppUserInfo({
  zd2: {
    userId: 'zd2',
    nickname: 'Ally',
    avatarurl: '',
  },
  bob: {
    userId: 'bob',
    nickname: 'Bob',
  },
});

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ContactList> = args => (
  <Provider initConfig={{ appKey: 'a#b' }}>
    {' '}
    <ContactList {...args} />
  </Provider>
);

const DarkTemplate: ComponentStory<typeof ContactList> = args => (
  <Provider
    initConfig={{ appKey: 'a#b' }}
    theme={{
      mode: 'dark',
    }}
  >
    {' '}
    <ContactList {...args} />
  </Provider>
);

const SquareTemplate: ComponentStory<typeof ContactList> = args => (
  <Provider
    initConfig={{ appKey: 'a#b' }}
    theme={{
      mode: 'dark',
      avatarShape: 'square',
      bubbleShape: 'square',
      componentsShape: 'square',
    }}
  >
    {' '}
    <ContactList {...args} />
  </Provider>
);

export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
export const Square = SquareTemplate.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
