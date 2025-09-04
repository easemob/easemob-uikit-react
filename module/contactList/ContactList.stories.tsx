import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';
import { ContactList } from './index';
import rootStore from '../store';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    contactList:
      'ContactList component is a container component that encapsulates the contact list function. It is mainly used to display the contact list, group list, friend request list, and supports sorting by first letter and customizing which lists to display.',
    prefix: 'Prefix',
    style: 'Style',
    className: 'Class name',
    onSearch: 'Search callback',
    onItemClick: 'Click callback',
    menu: 'Menu',
    hasMenu: 'Whether to display the classification title',
    checkable: 'Whether to display checkbox',
    onCheckboxChange: 'Checkbox change callback',
    header: 'Header',
    checkedList: 'Checked list',
    defaultCheckedList: 'Default checked list',
    searchStyle: 'Search style',
    searchInputStyle: 'Search input style',
    searchPlaceholder: 'Search placeholder',
  },
  zh: {
    contactList:
      'ContactList 组件是一个容器组件，封装了联系人列表功能。主要用于显示联系人列表，群组列表，好友请求列表，支持按首字母排序， 和自定义显示哪些列表。',
    prefix: '组件类名前缀',
    style: '组件样式',
    className: '组件类名',
    onSearch: '搜索回调',
    onItemClick: '点击回调',
    menu: '菜单',
    hasMenu: '是否显示分类标题',
    checkable: '是否显示checkbox',
    onCheckboxChange: 'checkbox改变回调',
    header: 'Header',
    checkedList: '选中的列表',
    defaultCheckedList: '默认选中的列表',
    searchStyle: '搜索样式',
    searchInputStyle: '搜索输入框样式',
    searchPlaceholder: '搜索框占位符',
  },
};

export default {
  title: 'Container/ContactList',
  component: ContactList,
  parameters: {
    docs: {
      description: {
        component: description[lang].contactList,
      },
    },
  },
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      type: 'string',
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    className: {
      control: 'text',
      description: description[lang].className,
    },
    onSearch: {
      action: 'search',
      description: description[lang].onSearch,
    },
    onItemClick: {
      action: 'click',
      description: description[lang].onItemClick,
    },
    menu: {
      description: description[lang].menu,
    },
    hasMenu: {
      control: 'boolean',
      description: description[lang].hasMenu,
    },
    checkable: {
      control: 'boolean',
      description: description[lang].checkable,
    },
    onCheckboxChange: {
      action: 'checkboxChange',
      description: description[lang].onCheckboxChange,
    },
    header: {
      control: 'text',
      description: description[lang].header,
    },
    checkedList: {
      description: description[lang].checkedList,
    },
    defaultCheckedList: {
      description: description[lang].defaultCheckedList,
    },
    searchStyle: {
      control: 'object',
      description: description[lang].searchStyle,
    },
    searchInputStyle: {
      control: 'object',
      description: description[lang].searchInputStyle,
    },
    searchPlaceholder: {
      control: 'text',
      description: description[lang].searchPlaceholder,
    },
  },
} as Meta<typeof ContactList>;

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
const Template: StoryFn<typeof ContactList> = args => (
  <Provider initConfig={{ appKey: 'a#b' }}>
    {' '}
    <ContactList {...args} />
  </Provider>
);

const DarkTemplate: StoryFn<typeof ContactList> = args => (
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

const SquareTemplate: StoryFn<typeof ContactList> = args => (
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

export const Default = {
  render: Template,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
