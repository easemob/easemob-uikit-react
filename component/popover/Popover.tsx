import React, { ReactElement } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface PopoverProps {
  children?: string;
  className?: string;
  style?: React.CSSProperties;
}
const Popover = ({ className = '', children = '', style = {} }: PopoverProps): ReactElement => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('popover');
  const classes = classNames(prefixCls, className);
  return (
    <div className={classes} style={{ ...style }}>
      <span>{children}</span>
    </div>
  );
};

export { Popover };
