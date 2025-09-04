import React, { forwardRef, useContext } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { RootContext } from '../../module/store/rootContext';
import Ripple from '../ripple/Ripple';

const buttonShapes = tuple('circle', 'round', 'default');
export type ButtonShape = (typeof buttonShapes)[number];

const buttonSizes = tuple('small', 'medium', 'large');
export type ButtonSize = (typeof buttonSizes)[number];

const buttonTypes = tuple('primary', 'default', 'ghost', 'text');
export type ButtonType = (typeof buttonTypes)[number];

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
  ripple?: boolean;
  rippleColor?: string;
  ref?: React.Ref<HTMLButtonElement>;
}
// 支持ref属性

export const ButtonInner = (
  {
    className,
    type = 'default',
    size = 'medium',
    shape,
    disabled = false,
    icon,
    children = 'button',
    style = {},
    onClick,
    ripple,
    rippleColor,
  }: ButtonProps,
  ref: any,
) => {
  const { theme } = useContext(RootContext);
  const themeMode = theme?.mode;
  const themeRipple = theme?.ripple;
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

  // 默认使用 themeRipple 参数， 当传入 ripple 参数时，使用传入的参数
  const rippleProp = ripple === undefined ? themeRipple : ripple;

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      disabled={disabled}
      style={{ ...style }}
      ref={ref}
    >
      {rippleProp && <Ripple color={rippleColor} />}
      {children}
    </button>
  );
};

export const Button = forwardRef(ButtonInner);
