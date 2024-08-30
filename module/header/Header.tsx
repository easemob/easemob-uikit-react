import React, { FC, ReactNode, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Tooltip, TooltipProps } from '../../component/tooltip/Tooltip';
import { RootContext } from '../store/rootContext';
export interface HeaderProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  content?: ReactNode;
  avatar?: ReactNode; // 头像
  presence?: {
    visible: boolean;
    text?: string;
    icon?: HTMLImageElement | string;
  }; // 是否显示在线状态
  subtitle?: ReactNode; // 副标题
  icon?: ReactNode; // 右侧更多按钮 icon
  back?: boolean; // 是否显示左侧返回按钮
  avatarSrc?: string;
  avatarShape?: 'circle' | 'square';
  close?: boolean; // 是否显示右侧关闭按钮
  suffixIcon?: ReactNode; // 右侧自定义 icon
  renderContent?: () => React.ReactElement; // 自定义渲染中间内容部分；
  onClickEllipsis?: () => void; // 右侧更多按钮的点击事件
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
    tooltipProps?: TooltipProps;
  };
  onClickAvatar?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onClickClose?: () => void;
  onClickBack?: () => void;
}

const Header: FC<HeaderProps> = props => {
  const {
    icon,
    avatar,
    avatarSrc = '',
    content = <div>Header</div>,
    prefix: customizePrefixCls,
    back = false,
    onClickBack,
    renderContent,
    onClickEllipsis,
    moreAction,
    onClickAvatar,
    close,
    onClickClose,
    suffixIcon,
    style = {},
    className,
    subtitle,
    presence,
  } = props;
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  let avatarShape = props.avatarShape || 'circle';
  if (theme?.avatarShape) {
    avatarShape = theme?.avatarShape;
  }
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('header', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

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
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              key={index}
              onClick={() => {
                setMenuOpen(false);
                item.onClick?.();
              }}
            >
              {item.icon}
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
            <Button
              type="text"
              onClick={() => {
                onClickBack?.();
              }}
            >
              <Icon
                type="ARROW_LEFT"
                // color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                width={24}
                height={24}
              ></Icon>
            </Button>
          ) : null}
          {avatar ? (
            avatar
          ) : (
            <Avatar
              shape={avatarShape}
              src={avatarSrc}
              onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                onClickAvatar?.(e);
              }}
              size={40}
              style={{ marginRight: 12 }}
              presence={presence}
            >
              {content}
            </Avatar>
          )}
          <div className={`${prefixCls}-content-box`}>
            <span className={`${prefixCls}-content-text`}>{content ? content : null}</span>
            {subtitle && <span className={`${prefixCls}-content-sub`}>{subtitle}</span>}
          </div>
        </div>

        <div className={`${prefixCls}-iconBox`}>
          {suffixIcon}
          {moreAction?.visible &&
            (moreAction.actions.length > 0 ? (
              <Tooltip
                title={menuNode}
                trigger="click"
                placement="bottom"
                open={menuOpen}
                onOpenChange={c => {
                  setMenuOpen(c);
                }}
                {...moreAction?.tooltipProps}
              >
                {
                  <Button
                    type="text"
                    shape="circle"
                    onClick={() => {
                      onClickEllipsis?.();
                    }}
                  >
                    {moreAction.icon ? (
                      moreAction.icon
                    ) : (
                      <Icon
                        type="ELLIPSIS"
                        color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                        width={24}
                        height={24}
                      ></Icon>
                    )}
                  </Button>
                }
              </Tooltip>
            ) : (
              <Button
                type="text"
                shape="circle"
                onClick={() => {
                  onClickEllipsis?.();
                }}
              >
                <Icon
                  type="ELLIPSIS"
                  color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                  width={24}
                  height={24}
                ></Icon>
              </Button>
            ))}
          {close && (
            <Button type="text" shape="circle" onClick={clickClose}>
              <Icon
                type="CLOSE"
                color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                width={24}
                height={24}
              ></Icon>
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
