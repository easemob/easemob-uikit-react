import React, { FC, useState, ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Badge from '../../component/badge';
import { string } from 'prop-types';

export interface ContactItemProps {
  contactId: string;
  className?: string;
  prefix?: string;
  avatarShape?: 'circle' | 'square';
  avatarSize?: number;
  focus?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, contactId: string) => void;
  children?: ReactNode;
  style?: React.CSSProperties;
  isActive?: boolean;
}

const ContactItem: FC<ContactItemProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    avatarShape = 'circle',
    avatarSize = 50,
    onClick,
    isActive = false,
    contactId,
    children,
    ...others
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactItem', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-selected`]: !!isActive,
    },
    className,
  );

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    console.log(e);
    onClick && onClick(e, contactId);
  };
  return (
    <div className={classString} onClick={handleClick} style={others.style}>
      <Avatar size={avatarSize} shape={avatarShape}></Avatar>
      <span className={`${prefixCls}-nickname`}>{children || ''}</span>
    </div>
  );
};

export { ContactItem };
