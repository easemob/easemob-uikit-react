import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Provider from '../store/Provider';
import UserSelect from './index';
import rootStore from '../store';
import Button from '../../component/button';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Module/UserSelect',
  component: UserSelect,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof UserSelect>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof UserSelect> = args => (
  <UserSelect {...args} closable={true} enableMultipleSelection={true} />
);

const DarkTemplate: ComponentStory<typeof UserSelect> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <UserSelect {...args} closable={true} enableMultipleSelection={true} />
    </div>
  </Provider>
);
export const Default = Template.bind({});
export const Dark = DarkTemplate.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {
  enableMultipleSelection: true,
  closable: true,
  open: true,
  title: 'Select Users',
  users: [
    {
      userId: 'zd1',
      nickname: 'Zhao Yun',
    },
    {
      userId: 'zd2',
      nickname: 'Guan Yu',
    },
  ],
  checkedUsers: [
    {
      userId: 'zd1',
      nickname: 'Zhao Yun',
    },
  ],
  selectedPanelFooter: (
    <div>
      <Button type="primary" style={{ marginRight: '20px', width: '80px' }}>
        Confirm
      </Button>
      <Button style={{ width: '80px' }}>Cancel</Button>
    </div>
  ),
};

Dark.args = {
  enableMultipleSelection: true,
  closable: true,
  open: true,
  title: 'Select Users',
  users: [
    {
      userId: 'zd1',
      nickname: 'Zhao Yun',
    },
    {
      userId: 'zd2',
      nickname: 'Guan Yu',
    },
  ],
  checkedUsers: [
    {
      userId: 'zd1',
      nickname: 'Zhao Yun',
    },
  ],
  selectedPanelFooter: (
    <div>
      <Button type="primary" style={{ marginRight: '20px', width: '80px' }}>
        Confirm
      </Button>
      <Button style={{ width: '80px' }}>Cancel</Button>
    </div>
  ),
};
