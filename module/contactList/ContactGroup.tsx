import React, { FC, useState, ReactNode, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import { RootContext } from '../store/rootContext';
export interface ContactGroupProps {
  prefix?: string;
  children?: ReactNode;
  title?: string;
  unreadCount?: number;
  itemCount?: number;
  itemHeight?: number;
  onclickTitle?: (data: any) => void;
  hasMenu?: boolean; // 是否显示分类的menu
  highlightUnread?: boolean; // 是否高亮未读数
}

const ContactGroup: FC<ContactGroupProps> = props => {
  const {
    prefix: customizePrefixCls,
    children,
    title,
    itemCount,
    onclickTitle,
    hasMenu = true,
    itemHeight,
    unreadCount,
    highlightUnread = false,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactGroup', customizePrefixCls);
  const context = React.useContext(RootContext);
  const { rootStore, theme, features } = context;
  const themeMode = theme?.mode || 'light';
  const groupClass = classNames(prefixCls, {
    [`${prefixCls}-${themeMode}`]: !!themeMode,
  });

  const [childrenVisible, setChildrenVisible] = useState(!hasMenu);
  const [iconType, setIconType] = useState(0);
  const [height, setHeight] = useState<number | string>(hasMenu ? 0 : 'auto');
  const handleClickTitle = (title?: string) => {
    setChildrenVisible(childrenVisible => !childrenVisible);
    setIconType(type => (type == 0 ? 90 : 0));
    onclickTitle?.(title);
    setHeight(childrenVisible ? 0 : `${panelRef?.current?.scrollHeight}px`);
  };

  useEffect(() => {
    if (childrenVisible) {
      setHeight((itemHeight || 0) * (itemCount || 0) + 'px');
    }
  }, [itemCount, childrenVisible]);

  const childrenClass = classNames(`${prefixCls}-children`, {
    [`${prefixCls}-children-show`]: childrenVisible,
    [`${prefixCls}-children-hide`]: !childrenVisible,
  });

  const panelRef = useRef<HTMLDivElement>(null);

  const countClass = classNames(`${prefixCls}-title-count`, {
    [`${prefixCls}-title-count-unread`]: highlightUnread,
  });
  return (
    <div className={groupClass}>
      {hasMenu && (
        <div className={`${prefixCls}-title`} onClick={() => handleClickTitle(title)}>
          <div> {title}</div>
          <div>
            {unreadCount ?? 0 > 0 ? <span className={countClass}>{unreadCount}</span> : null}

            <div className={`${prefixCls}-icon`} style={{ transform: `rotate(${iconType}deg)` }}>
              <Icon type="ARROW_RIGHT"></Icon>
            </div>
          </div>
        </div>
      )}

      <div
        className={childrenClass}
        ref={panelRef}
        style={{
          height: height,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export { ContactGroup };
