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
  itemCount?: number;
  itemHeight?: number;
  onclickTitle?: (data: any) => void;
  hasMenu?: boolean; // 是否显示分类的menu
}

const ContactGroup: FC<ContactGroupProps> = props => {
  const {
    prefix: customizePrefixCls,
    children,
    title,
    itemCount,
    onclickTitle,
    hasMenu = true,
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

  const childrenClass = classNames(`${prefixCls}-children`, {
    [`${prefixCls}-children-show`]: childrenVisible,
    [`${prefixCls}-children-hide`]: !childrenVisible,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  return (
    <div className={groupClass}>
      {hasMenu && (
        <div className={`${prefixCls}-title`} onClick={() => handleClickTitle(title)}>
          <div> {title}</div>
          <div>
            <span>{itemCount}</span>
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
