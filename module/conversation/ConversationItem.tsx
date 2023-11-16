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
import { observer } from 'mobx-react-lite';
import { AT_TYPE } from '../store/ConversationStore';
import { eventHandler } from '../../eventHandler';
import {
  getGroupMemberIndexByUserId,
  getGroupItemFromGroupsById,
  getGroupMemberNickName,
  getMsgSenderNickname,
} from '../utils/index';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
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

let ConversationItem: FC<ConversationItemProps> = props => {
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
        {
          content: 'PIN',
        },
        {
          content: 'SILENT',
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
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';

  const cvsStore = rootStore.conversationStore;

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-selected`]: !!isActive,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
      [`${prefixCls}-sticky`]: data.isPinned,
    },
    className,
  );

  const AtTag = (props: { type?: AT_TYPE }) => {
    let { type = 'NONE' } = props;
    if (type === 'NONE') return <></>;
    return (
      <div className={`${prefixCls}-at-tag`}>{type === 'ALL' ? t('atAllTag') : t('atTag')}</div>
    );
  };

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    rootStore?.conversationStore.setAtType(data.chatType, data.conversationId, 'NONE');
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
        chatType: data.chatType as 'singleChat' | 'groupChat',
        deleteRoam: true,
      })
      .then(() => {
        eventHandler.dispatchSuccess('deleteConversation');
      })
      .catch(err => {
        eventHandler.dispatchError('deleteConversation', err);
      });
  };

  const pinCvs = () => {
    rootStore?.conversationStore.pinConversation(
      data.chatType,
      data.conversationId,
      !data.isPinned,
    );
  };

  const setSilent = () => {
    if (data.silent) {
      rootStore?.conversationStore.clearRemindTypeForConversation({
        chatType: data.chatType,
        conversationId: data.conversationId,
      });
    } else {
      rootStore?.conversationStore.setSilentModeForConversation({
        chatType: data.chatType,
        conversationId: data.conversationId,
      });
    }
  };

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  let menuNode: ReactNode | undefined;

  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction.actions.map((item, index) => {
          if (item.content === 'DELETE') {
            return (
              <li
                key={index}
                onClick={deleteCvs}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                <Icon type="DELETE"></Icon>
                {t('deleteCvs')}
              </li>
            );
          } else if (item.content === 'PIN') {
            return (
              <li key={index} onClick={pinCvs} className={themeMode == 'dark' ? 'cui-li-dark' : ''}>
                <Icon type={data.isPinned ? 'ARROW_LINE' : 'LINE_ARROW'}></Icon>
                {data.isPinned ? t('unSticky') : t('sticky')}
              </li>
            );
          } else if (item.content === 'SILENT') {
            return (
              <li
                key={index}
                onClick={setSilent}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                <Icon type={data.silent ? 'BELL_SLASH' : 'BELL'}></Icon>
                {data.silent ? t('unmuteNotification') : t('muteNotification')}
              </li>
            );
          }
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
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
      if (data.lastMessage?.msg == 'the combine message') {
        lastMsg = `/${t('chatHistory')}/`;
      } else {
        lastMsg = renderTxt(data.lastMessage?.msg, false);
      }
      break;
    case 'img':
      lastMsg = `/${t('image')}/`;
      break;
    case 'audio':
      lastMsg = `/${t('audio')}/`;
      break;
    case 'file':
      lastMsg = `/${t('file')}/`;
      break;
    case 'video':
      lastMsg = `/${t('video')}/`;
      break;
    case 'custom':
      lastMsg = `/${t('custom')}/`;
      break;
    // @ts-ignore
    case 'combine':
      lastMsg = `/${t('chatHistory')}/`;
      break;
    // @ts-ignore
    case 'recall':
      lastMsg = t('unsentAMessage') as string;
      break;
    default:
      console.warn('unexpected message type:', data.lastMessage?.type);
      break;
  }
  if (data.chatType == 'groupChat') {
    let msgFrom = data.lastMessage.from || '';
    let from = msgFrom && msgFrom !== rootStore.client.context.userId ? `${msgFrom}: ` : '';
    const groupItem = getGroupItemFromGroupsById(data.conversationId);
    if (groupItem) {
      const memberIdx = getGroupMemberIndexByUserId(groupItem, msgFrom) ?? -1;
      if (memberIdx > -1) {
        let memberItem = groupItem?.members?.[memberIdx]!;
        from = `${getGroupMemberNickName(memberItem)}: `;
      }
    }
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
        <span className={`${prefixCls}-nickname`}>
          {data.name || data.conversationId}
          {data.silent && (
            <Icon type="BELL_SLASH" className={`${prefixCls}-nickname-silent`}></Icon>
          )}
        </span>
        <span className={`${prefixCls}-message`}>
          {<AtTag type={data?.atType} />}
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
            <Badge
              dot={data.silent}
              count={data.unreadCount || 0}
              color={badgeColor || 'var(--cui-primary-color)'}
            ></Badge>
          </div>
        )}
      </div>
    </div>
  );
};

ConversationItem = observer(ConversationItem);
export { ConversationItem };
