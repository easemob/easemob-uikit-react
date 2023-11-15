import React, { useState, useContext } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './style/style.scss';
import classNames from 'classnames';
import Icon from '../icon';
import { ConfigContext } from '../config/index';
import { RootContext } from '../../module/store/rootContext';
export interface CollapseProps {
  title?: React.ReactNode | (() => React.ReactNode);
  content?: React.ReactNode | (() => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  bordered?: boolean;
  onChange?: (isOpen: boolean) => void;
  expandIcon?: React.ReactNode;
  expandIconPosition?: 'start' | 'end';
  collapsible?: 'header' | 'icon' | 'disabled';
}

const Collapse = (props: CollapseProps) => {
  const {
    prefix,
    className,
    direction = 'right',
    style,
    expandIcon,
    expandIconPosition = direction == 'left' || direction == 'right' ? 'start' : 'end',
    bordered = false,
    onChange,
    collapsible = 'header',
  } = props;
  const { theme } = useContext(RootContext);
  const themeMode = theme?.mode;
  const [isOpen, setIsOpen] = useState(false);
  const { title, content } = props;
  const handleToggle = (placement: 'header' | 'icon') => {
    if (collapsible === 'disabled') return;
    if (placement === 'header' && collapsible === 'icon') return;
    onChange?.(!isOpen);
    setIsOpen(!isOpen);
  };
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('collapse', prefix);
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-${direction}`]: !!direction,
      [`${prefixCls}-bordered`]: bordered,
      [`${prefixCls}-expandIcon-${expandIconPosition}`]: !!expandIconPosition,
    },
    className,
  );

  return (
    <div className={classes} style={{ ...style }}>
      <div
        className={`${prefixCls}-header  ${isOpen ? 'open' : ''}`}
        onClick={() => {
          handleToggle('header');
        }}
      >
        <div>{typeof title == 'function' ? title() : title}</div>
        {expandIcon ? (
          expandIcon
        ) : (
          <Icon
            onClick={() => {
              handleToggle('icon');
            }}
            width={24}
            height={24}
            color={themeMode == 'dark' ? '#E3E6E8' : '#464E53'}
            className={`${prefixCls}-icon ${isOpen ? 'open' : ''}`}
            type={'VERTICAL_ARROW'}
          ></Icon>
        )}
      </div>
      {isOpen && (
        <div className={`${prefixCls}-content`}>
          {typeof content == 'function' ? content() : content}
        </div>
      )}
    </div>
  );
};

export default Collapse;
