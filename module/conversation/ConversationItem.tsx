import React, { FC, useState, ReactNode, useContext, MouseEventHandler } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Badge from '../../component/badge';
import { getConversationTime } from '../utils/index';
import type { ConversationData } from './ConversationList';
import { RenderFunction, Tooltip } from '../../component/tooltip/Tooltip';
import { RootContext } from '../store/rootContext';
import { useTranslation } from 'react-i18next';
import { renderTxt } from '../textMessage/TextMessage';
export interface ConversationItemProps {
  className?: string;
  prefix?: string;
  nickname?: string;
  avatarShape?: 'circle' | 'square';
  avatarSize?: number;
  avatar?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  badgeColor?: string; // 未读数气泡颜色
  isActive?: boolean; // 是否被选中
  data: ConversationData[0];
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      content: ReactNode;
      onClick?: () => void;
    }>;
  };
}

const ConversationItem: FC<ConversationItemProps> = props => {
  let {
    prefix: customizePrefixCls,
    className,
    nickname,
    avatarShape = 'circle',
    avatarSize = 50,
    avatar,
    onClick,
    isActive = false,
    data,
    badgeColor,
    moreAction = {
      visible: true,
      actions: [
        {
          content: 'DELETE',
        },
      ],
    },
    ...others
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('conversationItem', customizePrefixCls);
  const [showMore, setShowMore] = useState(false);
  const [active, setActive] = useState(isActive);

  const rootStore = useContext(RootContext).rootStore;
  const cvsStore = rootStore.conversationStore;

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-selected`]: !!isActive,
    },
    className,
  );

  const AtTag = () => {
    return <div className={`${prefixCls}-at-tag`}>{t('module.atTag')}</div>;
  };

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    rootStore?.conversationStore.setIsAted(data.chatType, data.conversationId, false);
    onClick && onClick(e);
  };

  const handleMouseOver = () => {
    moreAction.visible && setShowMore(true);
  };
  const handleMouseLeave = () => {
    setShowMore(false);
  };

  const deleteCvs: MouseEventHandler<HTMLLIElement> = e => {
    e.stopPropagation();

    cvsStore.deleteConversation(data);

    rootStore.client
      .deleteConversation({
        channel: data.conversationId,
        chatType: data.chatType,
        deleteRoam: true,
      })
      .then(() => {
        console.log('delete success');
      })
      .catch(err => {
        console.log('delete fail', err);
      });
  };
  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction.actions.map((item, index) => {
          if (item.content === 'DELETE') {
            return (
              <li key={index} onClick={deleteCvs}>
                {t('module.deleteCvs')}
              </li>
            );
          }
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

  let lastMsg: ReactNode[] | ReactNode = '';
  switch (data.lastMessage?.type) {
    case 'txt':
      lastMsg = renderTxt(data.lastMessage?.msg, '');
      break;
    case 'img':
      lastMsg = `/${t('module.image')}/`;
      break;
    case 'audio':
      lastMsg = `/${t('module.audio')}/`;
      break;
    case 'file':
      lastMsg = `/${t('module.file')}/`;
      break;
    case 'video':
      lastMsg = `/${t('module.video')}/`;
      break;
    case 'custom':
      lastMsg = `/${t('module.custom')}/`;
      break;
    default:
      console.warn('unexpected message type:', data.lastMessage?.type);
      break;
  }
  if (data.chatType == 'groupChat') {
    let msgFrom = data.lastMessage.from;
    const from = msgFrom && msgFrom !== rootStore.client.context.userId ? `${msgFrom}:` : '';
    lastMsg = [from, ...Array.from(lastMsg)];
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
          {data.name || data.conversationId}
        </Avatar>
      )}

      <div className={`${prefixCls}-content`}>
        <span className={`${prefixCls}-nickname`}>{data.name || data.conversationId}</span>
        <span className={`${prefixCls}-message`}>
          {data?.isAted ? <AtTag /> : ''}
          {lastMsg}
        </span>
      </div>
      <div className={`${prefixCls}-info`}>
        <span className={`${prefixCls}-time`}>{getConversationTime(data.lastMessage.time)}</span>
        {showMore ? (
          <Tooltip title={menuNode} trigger="click" placement="bottom" arrow>
            {moreAction.icon || <Icon type="ELLIPSIS" color="#33B1FF" height={20}></Icon>}
          </Tooltip>
        ) : (
          <div
            style={{
              height: '20px',
              position: 'relative',
            }}
          >
            <Badge count={data.unreadCount || 0} color={badgeColor || '#009EFF'}></Badge>
          </div>
        )}
      </div>
    </div>
  );
};
export { ConversationItem };
