import React, { FC, useState, ReactNode, useContext, MouseEventHandler, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../../module/store/rootContext';
import Checkbox from '../../component/checkbox';
import Ripple from '../../component/ripple/Ripple';
import { set } from 'mobx';
import { useIsMobile } from '../../module/hooks/useScreen';
export interface UserInfoData {
  userId: string;
  nickname?: string;
  description?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface UserItemProps {
  className?: string;
  prefix?: string;
  nickname?: string;
  avatarShape?: 'circle' | 'square';
  avatarSize?: number;
  avatar?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  data: UserInfoData;
  selected?: boolean;
  checkable?: boolean;
  closeable?: boolean;
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
  checked?: boolean;
  disabled?: boolean;
  onClose?: (data: UserInfoData) => void;
  ripple?: boolean;
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      icon?: ReactNode;
      content: ReactNode;
      onClick?: (data: UserInfoData) => void;
    }>;
  };
}

let UserItem: FC<UserItemProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    nickname,
    avatarShape = 'circle',
    avatarSize = 50,
    avatar,
    onClick,
    data,
    moreAction,
    selected,
    checkable,
    onCheckboxChange,
    checked,
    closeable,
    onClose,
    disabled,
    ripple,
    ...others
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { theme } = useContext(RootContext);
  const isMobile = useIsMobile();
  const themeMode = theme?.mode;
  const componentsShape = theme?.componentsShape || 'round';
  const themeRipple = theme?.ripple;
  const avatarShapeInUserItem = props.avatarShape || theme?.avatarShape || 'circle';
  const prefixCls = getPrefixCls('userItem', customizePrefixCls);
  const [showMore, setShowMore] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
      [`${prefixCls}-selected`]: selected,
      [`${prefixCls}-${componentsShape}`]: componentsShape,
    },
    className,
  );

  // 长按（移动端）
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    if (isMobile && longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onClick && onClick(e);
  };

  const handleMouseOver = () => {
    if (isMobile) return;
    moreAction?.visible && setShowMore(true);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    if (!isPopoverOpen) {
      setShowMore(false);
    }
  };

  const startLongPress = () => {
    if (!isMobile) return;
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (moreAction?.actions?.length && moreAction.actions?.length > 0) {
      longPressTimerRef.current = window.setTimeout(() => {
        setShowMore(true);
        setIsPopoverOpen(true);
        longPressTriggeredRef.current = true;
      }, 600);
    }
  };

  const cancelLongPress = () => {
    if (!isMobile) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);
  const moreClassString = classNames(morePrefixCls, {
    [`${morePrefixCls}-${themeMode}`]: !!themeMode,
  });
  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={moreClassString}>
        {moreAction.actions.map((item, index) => {
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(data);
                setIsPopoverOpen(false);
              }}
            >
              {item.icon ? item.icon : null}
              {typeof item.content == 'string' ? t(item.content) : item.content}
            </li>
          );
        })}
      </ul>
    );
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckboxChange?.(e.target.checked, data);
  };
  const rippleProp = ripple === undefined ? themeRipple : ripple;
  return (
    <div
      className={classString}
      onClick={handleClick}
      style={others.style}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={e => {
        if (isMobile) e.preventDefault();
      }}
    >
      {avatar ? (
        avatar
      ) : (
        <Avatar
          src={data.avatarUrl}
          isOnline={data.isOnline}
          size={avatarSize}
          shape={avatarShapeInUserItem}
        >
          {data.nickname || data.userId}
        </Avatar>
      )}

      <div className={`${prefixCls}-content`}>
        <span className={`${prefixCls}-nickname`}>{data.nickname || data.userId}</span>
        <span className={`${prefixCls}-message`}>{data.description}</span>
      </div>
      <div className={`${prefixCls}-info`}>
        {showMore && (
          <Tooltip
            title={menuNode}
            trigger="click"
            placement="bottomRight"
            open={isPopoverOpen}
            onOpenChange={open => {
              setIsPopoverOpen(open);
              setShowMore(open);
            }}
          >
            {moreAction?.icon || (
              <Icon
                type="ELLIPSIS"
                color={
                  themeMode === 'dark' ? 'var(--cui-primary-color6)' : 'var(--cui-primary-color5)'
                }
                height={20}
                style={{ cursor: 'pointer', zIndex: 10 }}
              ></Icon>
            )}
          </Tooltip>
        )}
      </div>
      {checkable && (
        <div
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <Checkbox
            disabled={disabled}
            checked={checked}
            onChange={handleCheckboxChange}
          ></Checkbox>
        </div>
      )}
      {closeable && (
        <div>
          <Icon
            width={24}
            height={24}
            type="CLOSE_CIRCLE"
            onClick={() => {
              onClose?.(data);
            }}
          ></Icon>
        </div>
      )}
      {rippleProp && <Ripple></Ripple>}
    </div>
  );
};

UserItem = observer(UserItem);
export { UserItem };
