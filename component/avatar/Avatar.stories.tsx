import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import Avatar from './index';
import type { AvatarProps } from './Avatar';
export default {
  title: 'pure component/Avatar',
  component: Avatar,
  argTypes: {},
} as ComponentMeta<typeof Avatar>;

const Template: ComponentStory<typeof Avatar> = (args: AvatarProps) => <Avatar {...args} />;

export const SingleAvatar = Template.bind({});
SingleAvatar.args = {
  children: 'U',
  size: 'large',
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
};

const GroupTemplate: ComponentStory<typeof Avatar.Group> = (args: AvatarProps) => (
  <Avatar.Group shape="square" {...args}>
    <Avatar>U1</Avatar>
    <Avatar>U2</Avatar>
  </Avatar.Group>
);

export const GroupAvatar = GroupTemplate.bind({});
GroupAvatar.args = {
  size: 'default',
  shape: 'square',
  className: '',
  style: '',
};
