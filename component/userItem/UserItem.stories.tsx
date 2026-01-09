import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { UserItem, UserItemProps } from './UserItem';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    className: 'The className of the user item',
    prefix: 'The prefix of the user item',
    nickname: 'The nickname of the user item',
    avatarShape: 'The shape of the avatar',
    avatarSize: 'The size of the avatar',
    avatar: 'The avatar of the user item',
    onClick: 'The click event of the user item',
    style: 'The style of the user item',
    data: 'The data of the user item',
    selected: 'The selected of the user item',
    checkable: 'The checkable of the user item',
    closeable: 'The closeable of the user item',
    onCheckboxChange: 'The checkbox change event of the user item',
    checked: 'The checked of the user item',
    disabled: 'The disabled of the user item',
    onClose: 'The close event of the user item',
    ripple: 'The ripple of the user item',
    moreAction:
      'The more action of the user item, example: { visible: true, icon: <Icon type="ELLIPSIS" width={20} height={20} />, actions: [{ icon: <Icon type="DELETE" width={20} height={20} />, content: "delete", onClick: data => { console.log("delete", data); } }] }',
  },
  zh: {
    className: '用户项的类名',
    prefix: '用户项的前缀',
    nickname: '用户项的昵称',
    avatarShape: '头像的形状',
    avatarSize: '头像的大小',
    avatar: '用户项的头像',
    onClick: '用户项的点击事件',
    style: '用户项的样式',
    data: '用户项的数据',
    selected: '用户项的选中状态',
    checkable: '用户项的可选状态',
    closeable: '用户项的可关闭状态',
    onCheckboxChange: '用户项的复选框改变事件',
    checked: '用户项的选中状态',
    disabled: '用户项的禁用状态',
    onClose: '用户项的关闭事件',
    ripple: '用户项的涟漪效果',
    moreAction:
      '用户项的更多操作, 示例：{ visible: true, icon: <Icon type="ELLIPSIS" width={20} height={20} />, actions: [{ icon: <Icon type="DELETE" width={20} height={20} />, content: "删除", onClick: data => { console.log("delete", data); } }] }',
  },
};

export default {
  title: 'pure component/UserItem',
  component: UserItem,
  argTypes: {
    className: {
      control: 'text',
      description: description[lang].className,
    },
    prefix: {
      control: 'text',
      description: description[lang].prefix,
    },
    nickname: {
      control: 'text',
      description: description[lang].nickname,
    },
    avatarShape: {
      control: 'select',
      options: ['circle', 'square'],
      description: description[lang].avatarShape,
    },
    avatarSize: {
      control: 'number',
      description: description[lang].avatarSize,
    },
    avatar: {
      control: 'object',
      description: description[lang].avatar,
    },
    onClick: {
      description: description[lang].onClick,
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    data: {
      control: 'object',
      description: description[lang].data,
    },
    selected: {
      control: 'boolean',
      description: description[lang].selected,
    },
    checkable: {
      control: 'boolean',
      description: description[lang].checkable,
    },
    closeable: {
      control: 'boolean',
      description: description[lang].closeable,
    },
    onCheckboxChange: {
      description: description[lang].onCheckboxChange,
    },
    checked: {
      control: 'boolean',
      description: description[lang].checked,
    },
    disabled: {
      control: 'boolean',
      description: description[lang].disabled,
    },
    onClose: {
      description: description[lang].onClose,
    },
    ripple: {
      control: 'boolean',
      description: description[lang].ripple,
    },
    moreAction: {
      control: 'object',
      description: description[lang].moreAction,
    },
  },
} as Meta<UserItemProps>;

const Template: StoryFn<UserItemProps> = args => <UserItem {...args} />;

export const Default = Template.bind({});

Default.args = {
  data: {
    userId: '123',
    nickname: 'nickname',
    description: 'description',
    avatarUrl: 'https://avatars.githubusercontent.com/u/662712?v=4',
    isOnline: true,
  },
  selected: false,
  checkable: false,
  closeable: true,
  moreAction: {
    visible: true,
    icon: 'more',
    actions: [
      {
        icon: 'delete',
        content: 'delete',
        onClick: data => {
          console.log('delete', data);
        },
      },
    ],
  },
};
