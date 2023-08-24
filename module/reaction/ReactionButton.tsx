import React, { useState, useContext, useEffect } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import Button from '../../component/button';
import { emoji } from './emojiConfig';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Avatar from '../../component/avatar';
import Icon from '../../component/icon';
import { RootContext } from '../store/rootContext';

let timeoutId: string | number | NodeJS.Timeout | undefined;

export interface ReactionButtonProps {
  prefixCls?: string;
  className?: string;
  count: number;
  isAddedBySelf: boolean;
  reaction: string;
  userList: string[];
  onClick?: (emojiString: string) => void;
  onDelete?: (emojiString: string) => void;
  onShowUserList?: (emojiString: string) => void;
}

const emojiWidth = 18;

const ReactionButton = (props: ReactionButtonProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const {
    className,
    prefixCls: customizePrefixCls,
    reaction,
    count,
    isAddedBySelf,
    userList,
    onClick,
    onDelete,
    onShowUserList,
  } = props;
  const prefixCls = getPrefixCls('reaction-btn', customizePrefixCls);
  const rootStore = useContext(RootContext).rootStore;
  const myUserId = rootStore.client.user;
  const { appUsersInfo } = rootStore.addressStore;
  const path = emoji.map[reaction as keyof typeof emoji.map];

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-checked`]: isAddedBySelf,
    },
    className,
  );

  const handleMouseUp = () => {
    timeoutId = setTimeout(() => {
      setIsHovered(true);
    }, 1000);
  };
  const handleMouseDown = () => {
    clearTimeout(timeoutId);
  };

  const deleteReaction = () => {
    onDelete?.(reaction);
  };
  const renderUserList = () => {
    return (
      <ul className={`${prefixCls}-userList`}>
        {userList.map(userId => {
          return (
            <li key={userId}>
              <Avatar src={appUsersInfo[userId]?.avatarurl} size={24}>
                {appUsersInfo[userId]?.nickname || userId}
              </Avatar>
              <span className={`${prefixCls}-userList-name`}>
                {appUsersInfo[userId]?.nickname || userId}
              </span>
              {myUserId == userId && (
                <Icon
                  type="CROSS"
                  onClick={deleteReaction}
                  className={`${prefixCls}-userList-close`}
                />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const handleClick = () => {
    if (!isAddedBySelf) {
      onClick?.(reaction);
    } else {
      onDelete?.(reaction);
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  if (userList.length === 0) {
    return null;
  }
  return (
    <Tooltip
      title={renderUserList()}
      trigger={'hover'}
      arrowPointAtCenter={false}
      arrow={false}
      onOpenChange={status => {
        if (status) {
          onShowUserList?.(reaction);
          //   setOpen(true);
        } else {
          //   setOpen(false);
          setIsHovered(false);
        }
      }}
      open={isHovered}
    >
      <button
        className={classString}
        onMouseLeave={handleMouseDown}
        onMouseEnter={handleMouseUp}
        onClick={handleClick}
      >
        <img
          className={`${prefixCls}-img`}
          src={new URL(`/module/assets/reactions/${path}`, import.meta.url).href}
          width={emojiWidth}
          height={emojiWidth}
        />
        <span className={`${prefixCls}-count`}>{count}</span>
      </button>
    </Tooltip>
  );
};

export { ReactionButton };
