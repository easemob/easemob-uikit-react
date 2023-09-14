import React from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';

const buttonShapes = tuple('circle', 'round', 'default');
export type ButtonShape = (typeof buttonShapes)[number];

const buttonSizes = tuple('small', 'medium', 'large');
export type ButtonSize = (typeof buttonSizes)[number];

const buttonTypes = tuple('primary', 'default', 'ghost', 'text');
export type ButtonType = (typeof buttonTypes)[number];

export interface ButtonProps {
  className?: string;
  children?: React.ReactNode;
  type?: ButtonType;
  shape?: ButtonShape;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export const Button = ({
  className,
  type = 'default',
  size = 'medium',
  shape = 'default',
  disabled = false,
  icon,
  children = 'button',
  onClick,
}: ButtonProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('button');
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: type,
      [`${prefixCls}-${size}`]: size,
      [`${prefixCls}-${shape}`]: shape,
    },
    className,
  );
  const kids = children || children === 0 ? ' ' : null;
  return (
    <button type="button" onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
};
