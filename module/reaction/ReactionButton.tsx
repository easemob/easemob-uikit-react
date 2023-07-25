import React, { useState, useContext, useEffect } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import Button from '../../component/button';
import { emoji } from '../messageEditor/emoji/emojiConfig';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Avatar from '../../component/avatar';
import Icon from '../../component/icon';
import { RootContext } from '../store/rootContext';

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
  const path = emoji.map[reaction as keyof typeof emoji.map];
  const [checked, setCheck] = useState(isAddedBySelf);
  const [open, setOpen] = useState(false);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-checked`]: isAddedBySelf,
    },
    className,
  );

  const handleMouseUp = () => {};
  const handleMouseDown = () => {};

  const deleteReaction = () => {
    console.log('删除', reaction);
    onDelete?.(reaction);
  };
  const renderUserList = () => {
    return (
      <ul className={`${prefixCls}-userList`}>
        {userList.map(userId => {
          return (
            <li key={userId}>
              <Avatar size={24}></Avatar>
              <span className={`${prefixCls}-userList-name`}>{userId}</span>
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
    }
  };

  return (
    <Tooltip
      title={renderUserList()}
      trigger={'hover'}
      arrowPointAtCenter={false}
      arrow={false}
      onOpenChange={status => {
        if (status) {
          onShowUserList?.(reaction);
          setOpen(true);
        } else {
          setOpen(false);
        }
      }}
      open={open}
    >
      <button
        className={classString}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        //   onMouseLeave={handleMouseUp}
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
