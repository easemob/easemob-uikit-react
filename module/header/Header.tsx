import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import Icon from '../../src/icon';
import Avatar from '../../src/avatar';
import Button from '../../src/button';
import { Tooltip } from '../../src/tooltip/Tooltip';
export interface HeaderProps {
  className?: string;
  prefix?: string;
  content?: ReactNode;
  avatar?: ReactNode; // 头像
  icon?: ReactNode; // 右侧更多按钮 icon
  back?: boolean; // 是否显示左侧返回按钮
  renderContent?: () => React.ReactElement; // 自定义渲染中间内容部分；
  onIconClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void; // 右侧更多按钮的点击事件
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      content: ReactNode;
      onClick?: () => void;
    }>;
  };
  onAvatarClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Header: FC<HeaderProps> = props => {
  const {
    icon,
    avatar,
    content = <div>Header</div>,
    prefix: customizePrefixCls,
    back = false,
    renderContent,
    onIconClick,
    moreAction,
    onAvatarClick,
  } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('header', customizePrefixCls);
  const classString = classNames(prefixCls);

  let menuNode;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={`${prefixCls}-more`}>
        {moreAction.actions.map((item, index) => {
          return (
            <li
              key={index}
              onClick={() => {
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
              onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                onAvatarClick?.(e);
              }}
            >
              {content}
            </Avatar>
          )}
          <span className={`${prefixCls}-content-text`}>{content ? content : null}</span>
        </div>

        <div
          onClick={e => {
            onIconClick?.(e);
          }}
        >
          <Tooltip title={menuNode} trigger="click" placement="bottom">
            {
              <Button type="text" shape="circle">
                <Icon type="ELLIPSIS"></Icon>
              </Button>
            }
          </Tooltip>
        </div>
      </>
    );
  }

  return <div className={classString}>{contentNode}</div>;
};

export { Header };
