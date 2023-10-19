import React, { FC, ReactNode, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Tooltip } from '../../component/tooltip/Tooltip';
export interface HeaderProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  content?: ReactNode;
  avatar?: ReactNode; // 头像
  subtitle?: ReactNode; // 副标题
  icon?: ReactNode; // 右侧更多按钮 icon
  back?: boolean; // 是否显示左侧返回按钮
  avatarSrc?: string;
  close?: boolean; // 是否显示右侧关闭按钮
  suffixIcon?: ReactNode; // 右侧自定义 icon
  renderContent?: () => React.ReactElement; // 自定义渲染中间内容部分；
  onIconClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void; // 右侧更多按钮的点击事件
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      visible?: boolean;
      icon?: ReactNode;
      content: ReactNode;
      onClick?: () => void;
    }>;
  };
  onAvatarClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onClickClose?: () => void;
}

const Header: FC<HeaderProps> = props => {
  const {
    icon,
    avatar,
    avatarSrc = '',
    content = <div>Header</div>,
    prefix: customizePrefixCls,
    back = false,
    renderContent,
    onIconClick,
    moreAction,
    onAvatarClick,
    close,
    onClickClose,
    suffixIcon,
    style = {},
    className,
    subtitle,
  } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('header', customizePrefixCls);
  const classString = classNames(prefixCls, className);

  const clickClose = () => {
    onClickClose?.();
  };

  const [menuOpen, setMenuOpen] = useState(false);

  let menuNode;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={`${prefixCls}-more`}>
        {moreAction.actions.map((item, index) => {
          if (item.visible == false) return null;
          return (
            <li
              key={index}
              onClick={() => {
                setMenuOpen(false);
                item.onClick?.();
              }}
            >
              {item.content}
            </li>
          );
        })}
      </ul>
    );
  }

  let contentNode: ReactNode;
  if (typeof renderContent == 'function') {
    contentNode = renderContent();
  } else {
    contentNode = (
      <>
        <div className={`${prefixCls}-content`}>
          {back ? (
            <Button type="text">
              <Icon type="ARROW_LEFT" width={24} height={24}></Icon>
            </Button>
          ) : null}
          {avatar ? (
            avatar
          ) : (
            <Avatar
              src={avatarSrc}
              onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                onAvatarClick?.(e);
              }}
            >
              {content}
            </Avatar>
          )}
          <div className={`${prefixCls}-content-box`}>
            <span className={`${prefixCls}-content-text`}>{content ? content : null}</span>
            {subtitle && <span className={`${prefixCls}-content-sub`}>{subtitle}</span>}
          </div>
        </div>

        <div
          onClick={e => {
            onIconClick?.(e);
          }}
          className={`${prefixCls}-iconBox`}
        >
          {suffixIcon}
          {moreAction?.visible && (
            <Tooltip
              title={menuNode}
              trigger="click"
              placement="bottom"
              open={menuOpen}
              onOpenChange={c => {
                setMenuOpen(c);
              }}
            >
              {
                <Button type="text" shape="circle">
                  <Icon type="ELLIPSIS"></Icon>
                </Button>
              }
            </Tooltip>
          )}
          {close && (
            <Button type="text" shape="circle" onClick={clickClose}>
              <Icon type="CLOSE"></Icon>
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className={classString} style={{ ...style }}>
      {contentNode}
    </div>
  );
};

export { Header };
