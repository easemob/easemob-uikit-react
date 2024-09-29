import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Avatar from './index';
import type { AvatarProps } from './Avatar';
export default {
  title: 'pure component/Avatar',
  component: Avatar,
  argTypes: {},
} as Meta<typeof Avatar>;

export const SingleAvatar = {
  args: {
    children: 'U',
    size: 'large', // 'small' | 'default' | number;
    shape: 'square',
    src: null,
    icon: '',
    style: {},
    prefixCls: '',
    className: '',
    alt: 'my avatar',
    draggable: true,
    crossOrigin: '',
    srcSet: '',
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      console.log(e);
    },
    onError: () => {},
  },
};

const GroupTemplate: StoryFn<typeof Avatar.Group> = (args: AvatarProps) => (
  <Avatar.Group shape="square" {...args}>
    <Avatar>U1</Avatar>
    <Avatar>U2</Avatar>
  </Avatar.Group>
);

export const GroupAvatar = {
  render: GroupTemplate,

  args: {
    size: 'default',
    shape: 'square',
    className: '',
    style: '',
  },
};
