import React, { ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../config/index';
export interface TabsProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  defaultActiveKey?: string;
  centered?: boolean;
  onChange?: (key: string) => void;
  onTabClick?: (key: string, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
  tabs: {
    label: ReactNode;
    key: string;
    content: ReactNode;
    disabled?: boolean;
  }[];
}

function Tabs(props: TabsProps) {
  const { tabs, defaultActiveKey, prefix, onTabClick, onChange } = props;
  if (!tabs || tabs.length === 0) {
    return null;
  }
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('tabs', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-centered`]: props.centered,
    },
    props.className,
  );

  const [activeTabKey, setActiveTabKey] = useState(defaultActiveKey || tabs[0]?.key);

  const handleTabClick = (key: string, e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    setActiveTabKey(key);
  };

  useEffect(() => {
    onChange?.(activeTabKey);
  }, [activeTabKey]);

  const activeTabIndex = props.tabs.findIndex(tab => tab.key === activeTabKey);
  const activeTab = props.tabs[activeTabIndex];
  console.log('activeTab', activeTab, activeTabIndex, activeTabKey);

  return (
    <div className={classString}>
      <ul className={`${prefixCls}-header`}>
        {props.tabs.map((tab, index) => (
          <li
            key={index}
            className={
              (tab.key === activeTabKey ? `${prefixCls}-header-li-active` : '') +
              (tab.disabled ? `${prefixCls}-header-li-disabled` : '')
            }
            onClick={e => {
              onTabClick?.(tab.key, e);
              if (tab.disabled) return;
              handleTabClick(tab.key, e);
            }}
          >
            {tab.label}
          </li>
        ))}
      </ul>

      <div className={`${prefixCls}-content`}>{activeTab.content}</div>
    </div>
  );
}

export { Tabs };
