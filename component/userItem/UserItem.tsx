import React, { FC, useState, ReactNode, useContext, MouseEventHandler } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';

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
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      content: ReactNode;
      onClick?: (data: UserInfoData) => void;
    }>;
  };
}

let UserItem: FC<UserItemProps> = props => {
  let {
    prefix: customizePrefixCls,
    className,
    nickname,
    avatarShape = 'circle',
    avatarSize = 50,
    avatar,
    onClick,
    data,
    moreAction,
    ...others
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('userItem', customizePrefixCls);
  const [showMore, setShowMore] = useState(false);

  const classString = classNames(prefixCls, className);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    onClick && onClick(e);
  };

  const handleMouseOver = () => {
    moreAction?.visible && setShowMore(true);
  };
  const handleMouseLeave = () => {
    setShowMore(false);
  };

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction.actions.map((item, index) => {
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(data);
              }}
            >
              {item.content}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div
      className={classString}
      onClick={handleClick}
      style={others.style}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {avatar ? (
        avatar
      ) : (
        <Avatar src={data.avatarUrl} isOnline={data.isOnline} size={avatarSize} shape={avatarShape}>
          {data.nickname || data.userId}
        </Avatar>
      )}

      <div className={`${prefixCls}-content`}>
        <span className={`${prefixCls}-nickname`}>{data.nickname || data.userId}</span>
        <span className={`${prefixCls}-message`}>{data.description}</span>
      </div>
      <div className={`${prefixCls}-info`}>
        {showMore && (
          <Tooltip title={menuNode} trigger="click" placement="bottom" arrow>
            {moreAction?.icon || <Icon type="ELLIPSIS" color="#33B1FF" height={20}></Icon>}
          </Tooltip>
        )}
      </div>
    </div>
  );
};

UserItem = observer(UserItem);
export { UserItem };
