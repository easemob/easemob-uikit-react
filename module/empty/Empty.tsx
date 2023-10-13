import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
export interface EmptyProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  text?: ReactNode;
  icon?: ReactNode;
}

const Empty: FC<EmptyProps> = props => {
  const { icon, text = 'No Data', prefix: customizePrefixCls, style = {}, className } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('empty', customizePrefixCls);

  const classString = classNames(prefixCls, className);

  return (
    <div className={classString} style={{ ...style }}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

export { Empty };
