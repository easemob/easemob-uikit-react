import React, { useContext } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { RootContext } from '../../module/store/rootContext';

const buttonShapes = tuple('circle', 'round', 'default');
export type ButtonShape = typeof buttonShapes[number];

const buttonSizes = tuple('small', 'medium', 'large');
export type ButtonSize = typeof buttonSizes[number];

const buttonTypes = tuple('primary', 'default', 'ghost', 'text');
export type ButtonType = typeof buttonTypes[number];

export interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
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
  shape,
  disabled = false,
  icon,
  children = 'button',
  style = {},
  onClick,
}: ButtonProps) => {
  const { theme } = useContext(RootContext);
  const themeMode = theme?.mode;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('button');
  const shapeType = shape || theme?.componentsShape || 'default';
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: type,
      [`${prefixCls}-${size}`]: size,
      [`${prefixCls}-${shapeType}`]: shapeType,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const kids = children || children === 0 ? ' ' : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      disabled={disabled}
      style={{ ...style }}
    >
      {children}
    </button>
  );
};
