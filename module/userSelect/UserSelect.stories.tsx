import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import UserSelect, { UserSelectInfo } from './index';
import rootStore from '../store';
import Button from '../../component/button';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
const description = {
  en: {
    prefix: 'css class name prefix',
    className: 'css class name',
    style: 'css style',
    onUserSelect: 'Callback when selecting user',
    enableMultipleSelection: 'Whether to enable multiple selection',
    selectedPanelHeader: 'Selected panel header',
    selectedPanelFooter: 'Selected panel footer',
    users: 'User list',
    checkedUsers: 'Checked user list',
    disableUserIds: 'Disabled user ID list',
    disabled: 'Disabled',
    searchPlaceholder: 'Search placeholder',
    onConfirm: 'Confirm callback',
  },
  zh: {
    prefix: 'css 类名前缀',
    className: 'css 类名',
    style: 'css 样式',
    onUserSelect: '用户选择回调',
    enableMultipleSelection: '是否启用多选',
    selectedPanelHeader: '已选用户面板头部',
    selectedPanelFooter: '已选用户面板底部',
    users: '用户列表',
    checkedUsers: '已选用户列表',
    disableUserIds: '禁用用户ID列表',
    disabled: '是否禁用',
    searchPlaceholder: '搜索框占位符',
    onConfirm: '确认回调',
  },
};

export default {
  title: 'Module/UserSelect',
  component: UserSelect,
  argTypes: {
    prefix: {
      description: description[lang].prefix,
      control: {
        type: 'text',
      },
      type: 'string',
    },
    className: {
      description: description[lang].className,
      control: {
        type: 'text',
      },
      type: 'string',
    },
    style: {
      description: description[lang].style,
      control: {
        type: 'object',
      },
    },
    enableMultipleSelection: {
      description: description[lang].enableMultipleSelection,
      control: {
        type: 'boolean',
      },
      type: 'boolean',
    },
    selectedPanelHeader: {
      description: description[lang].selectedPanelHeader,
      control: {
        type: 'object',
      },
    },
    selectedPanelFooter: {
      description: description[lang].selectedPanelFooter,
      control: {
        type: 'object',
      },
    },
    users: {
      description: description[lang].users,
      control: {
        type: 'object',
      },
    },
    checkedUsers: {
      description: description[lang].checkedUsers,
      control: {
        type: 'object',
      },
    },
    disableUserIds: {
      description: description[lang].disableUserIds,
      control: {
        type: 'object',
      },
    },
    disabled: {
      description: description[lang].disabled,
      control: {
        type: 'boolean',
      },
      type: 'boolean',
    },
    searchPlaceholder: {
      description: description[lang].searchPlaceholder,
      control: {
        type: 'text',
      },
      type: 'string',
    },
    onConfirm: {
      description: description[lang].onConfirm,
    },
  },
} as Meta<typeof UserSelect>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof UserSelect> = args => (
  <UserSelect {...args} closable={true} enableMultipleSelection={true} />
);

const DarkTemplate: StoryFn<typeof UserSelect> = args => (
  <Provider initConfig={{ appKey: 'z#b' }} theme={{ mode: 'dark' }}>
    <div style={{ background: '#171a1c' }}>
      <UserSelect {...args} closable={true} enableMultipleSelection={true} />
    </div>
  </Provider>
);

export const Default = {
  render: Template,

  args: {
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
  },
};

export const Dark = {
  render: DarkTemplate,

  args: {
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
  },
};
