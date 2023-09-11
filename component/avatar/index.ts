import Button from './Avatar';
import { InternalAvatar } from './Avatar';
import type { AvatarProps } from './Avatar';
import type { ForwardRefExoticComponent, RefAttributes, ForwardRefRenderFunction } from 'react';
import Group from './Group';
import React from 'react';

type CompoundedComponent = ForwardRefExoticComponent<AvatarProps> & {
  Group: typeof Group;
};

const Avatar = InternalAvatar as any as CompoundedComponent;
Avatar.Group = Group;
export default Avatar as any;

export type { AvatarProps };
