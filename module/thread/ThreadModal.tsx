// 一个展示面板组件， 用于展示一个帖子的内容， 有heder和body两个部分, 可以控制显示的位置，anchorEl 为锚点元素， 用于控制显示的位置  anchorOrigin 为锚点元素的位置， transformOrigin 为展示面板的位置

import React, { useEffect, useState, useRef, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Header from '../header';
import Input from '../../component/input';
import { RootContext } from '../store/rootContext';
// export interface HeaderProps {
//   className?: string;
//   prefix?: string;
//   content?: ReactNode;
//   avatar?: ReactNode; // 头像
//   icon?: ReactNode; // 右侧更多按钮 icon
//   back?: boolean; // 是否显示左侧返回按钮
//   close?: boolean; // 是否显示右侧关闭按钮
//   renderContent?: () => React.ReactElement; // 自定义渲染中间内容部分；
//   onIconClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void; // 右侧更多按钮的点击事件
//   // 右侧更多按钮配置
// }

export interface ThreadModalProps {
  className?: string;
  prefix?: string;
  anchorEl?: HTMLElement | null;
  anchorOrigin?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'left';
  };
  transformOrigin?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'left';
  };
  style?: React.CSSProperties;
  open?: boolean;
  headerContent?: React.ReactNode;
  onClose?: () => void;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onExited?: () => void;
  children?: React.ReactNode; // 用来渲染面板内容
  //   disablePortal?: boolean;  // 是否禁用 portal
  //   disableScrollLock?: boolean;  // 是否禁用滚动锁定
  //   hideBackdrop?: boolean;  // 是否隐藏背景
  //   keepMounted?: boolean;     // 是否保持挂载
  //   maxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;  // 最大宽度
  //   PaperProps?: Partial<PaperProps>;  // Paper 组件的 props
  //   TransitionComponent?: React.ComponentType<TransitionProps>;  // 过渡组件
  //   transitionDuration?: TransitionProps['timeout'] | 'auto';  // 过渡时间
  //   TransitionProps?: TransitionProps;  // 过渡组件的 props
}
const ThreadModal = (props: ThreadModalProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { anchorEl, prefix, open, style, onSearch, onClear, headerContent, className } = props;
  const context = useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('thread-panel', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });
  // 用来更新组件的位置
  const popupRef = useRef(null);
  useEffect(() => {
    const calculatePosition = () => {
      if (!popupRef.current) return;
      const { clientWidth, clientHeight } = document.documentElement;
      const { width, height, top, left } = anchorEl!.getBoundingClientRect();
      // @ts-ignore
      const popupWidth = popupRef.current.offsetWidth;
      // @ts-ignore
      const popupHeight = popupRef.current.offsetHeight;

      let newTop = top + height;
      let newLeft = left;

      if (newTop + popupHeight > clientHeight) {
        newTop = top - popupHeight;
      }

      if (newLeft + popupWidth > clientWidth) {
        newLeft = left + width - popupWidth;
      }
      setPosition({
        top: newTop,
        left: newLeft,
      });
    };

    if (anchorEl) {
      calculatePosition();
    }

    // // 检查 anchorEl 是否存在
    // if (anchorEl) {
    //   // 获取页面上 anchorEl 元素的位置信息
    //   const anchorRect = anchorEl.getBoundingClientRect();

    //   // 根据 anchorEl 的位置信息计算组件的位置
    //   const top = anchorRect.bottom;
    //   const left = anchorRect.left;

    //   // 更新组件的位置
    //   // 这里假设你有一个函数叫 updatePosition，用来更新组件的位置
    //   setPosition({ top, left });
    // }
  }, [anchorEl, open]);

  const handleClose = () => {
    props.onClose?.();
  };

  const [search, setSearch] = useState(false);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e);
  };
  const renderHeaderContent = () => {
    return (
      <div className={`${prefixCls}-header`}>
        {search ? (
          <Input
            className={`${prefixCls}-header-title-input`}
            close
            onChange={handleSearch}
            onClear={() => {
              onClear?.();
              setSearch(false);
            }}
          ></Input>
        ) : (
          <div className={`${prefixCls}-header-title`}>{headerContent}</div>
        )}
      </div>
    );
  };

  const handleClickSearch = () => {
    setSearch(true);
  };
  return (
    <div
      ref={popupRef}
      className={classString}
      style={{
        ...style,
        top: position.top,
        left: position.left,
        display: open ? 'block' : 'none',
      }}
    >
      <Header
        avatar={true}
        close
        moreAction={{ visible: false, actions: [] }}
        onClickClose={handleClose}
        content={renderHeaderContent()}
        suffixIcon={
          <Button type="text" shape="circle" onClick={handleClickSearch}>
            <Icon type="SEARCH" width={24} height={24}></Icon>
          </Button>
        }
      ></Header>
      <div className={`${prefixCls}-content`}>{props.children}</div>
    </div>
  );
};

export default ThreadModal;
