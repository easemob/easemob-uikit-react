import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { useIsMobile } from '../hooks/useScreen';
import Icon from '../../component/icon';
import Button from '../../component/button';
import './style/style.scss';
export interface EmptyProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  text?: ReactNode;
  icon?: ReactNode;
  onClickBack?: () => void;
  back?: boolean;
}

const Empty: FC<EmptyProps> = props => {
  const {
    icon,
    text = 'No Data',
    prefix: customizePrefixCls,
    style = {},
    className,
    onClickBack,
    back = true,
  } = props;
  const isMobile = useIsMobile();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('empty', customizePrefixCls);

  const classString = classNames(prefixCls, className);

  return (
    <div className={classString} style={{ ...style }}>
      {isMobile && back ? (
        <Button
          type="text"
          onClick={() => {
            onClickBack?.();
          }}
          style={{ position: 'absolute', left: 12, top: 20 }}
        >
          <Icon type="ARROW_LEFT" width={24} height={24}></Icon>
        </Button>
      ) : null}
      {icon}
      <span>{text}</span>
    </div>
  );
};

export { Empty };
