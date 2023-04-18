import React, { FC, useState, ReactNode, useEffect } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import Icon from '../../src/icon';
import Avatar from '../../src/avatar';
import Badge from '../../src/badge';
import { string } from 'prop-types';
import { Sticky } from 'react-sticky';
export interface ContactGroupProps {
  prefix?: string;
  children?: ReactNode;
  title?: string;
  itemCount?: number;
  itemHeight?: number;
  open?: boolean;
  onclickTitle?: (data: any) => void;
}

const ContactGroup: FC<ContactGroupProps> = props => {
  const {
    prefix: customizePrefixCls,
    children,
    title,
    itemCount,
    itemHeight,
    open = false,
    onclickTitle,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactGroup', customizePrefixCls);

  const groupClass = classNames(prefixCls);

  const [childrenVisible, setChildrenVisible] = useState(false);
  const [iconType, setIconType] = useState(0);
  const handleClickTitle = (title?: string) => {
    setChildrenVisible(childrenVisible => !childrenVisible);
    setIconType(type => (type == 0 ? 90 : 0));
    onclickTitle?.(title);
  };

  const childrenClass = classNames(`${groupClass}-children`, {
    [`${groupClass}-children-show`]: childrenVisible,
    [`${groupClass}-children-hide`]: !childrenVisible,
  });

  const ITEM_HEIGHT = itemHeight || 64;

  let itemNum = 1;
  if (Array.isArray(children)) {
    itemNum = children.length;
  } else if (typeof children == 'undefined') {
    itemNum = 0;
  }

  return (
    <div className={groupClass}>
      <Sticky relative={childrenVisible}>
        {({ style }: { style: React.CSSProperties }) => (
          <div
            className={`${groupClass}-title`}
            onClick={() => handleClickTitle(title)}
            style={{ ...style, zIndex: 2 }}
          >
            <div> {title}</div>
            <div>
              <span>{itemCount}</span>
              <div className={`${groupClass}-icon`} style={{ transform: `rotate(${iconType}deg)` }}>
                <Icon type="ARROW_RIGHT"></Icon>
              </div>
            </div>
          </div>
        )}
      </Sticky>

      <div
        className={childrenClass}
        style={{
          height: childrenVisible ? ITEM_HEIGHT * itemNum : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export { ContactGroup };
