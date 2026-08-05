import React, { FC, useState, ReactNode, useContext, MouseEventHandler, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Badge from '../../component/badge';
import {
  getConversationId,
  getConversationLastMessage,
  getConversationLastMessageTime,
  getConversationName,
  getConversationUnreadCount,
  getConversationTime,
  getCurrentUserId,
  getMessagePreviewData,
  isConversationPinned,
  isConversationSilent,
} from '../utils/index';
import type { ConversationData } from './ConversationList';
import { Tooltip } from '../../component/tooltip/Tooltip';
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
} from '../utils/index';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import Ripple from '../../component/ripple/Ripple';
import { useIsMobile } from '../hooks/useScreen';
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
  renderMessageContent?: (msg: BaseMessageType) => ReactNode | undefined;
  ripple?: boolean;
  // 右侧更多按钮配置
  moreAction?: {
    visible?: boolean;
    icon?: ReactNode;
    actions: Array<{
      content: ReactNode;
      onClick?: (cvs: ConversationData[0]) => void | Promise<boolean>;
    }>;
  };
  formatDateTime?: (time: number) => string;
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
    formatDateTime,
    renderMessageContent,
    ripple,
    ...others
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('conversationItem', customizePrefixCls);
  const [showMore, setShowMore] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const isMobile = useIsMobile();
  const themeMode = theme?.mode || 'light';
  if (theme?.avatarShape) {
    avatarShape = theme?.avatarShape;
  }
  const themeRipple = theme?.ripple;
  const cvsStore = rootStore.conversationStore;
  const currentUserId = getCurrentUserId(rootStore.client);
  const lastMessage = getConversationLastMessage(data);
  const conversationId = getConversationId(data);
  const conversationName = getConversationName(data) || conversationId;
  const isPinned = isConversationPinned(data);
  const isSilent = isConversationSilent(data);
  const unreadCount = getConversationUnreadCount(data);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-selected`]: !!isActive,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
      [`${prefixCls}-sticky`]: isPinned,
    },
    className,
  );

  const AtTag = (props: { type?: AT_TYPE }) => {
    const { type = 'NONE' } = props;
    if (type === 'NONE') return <></>;
    return (
      <div className={`${prefixCls}-at-tag`}>{type === 'ALL' ? t('atAllTag') : t('atTag')}</div>
    );
  };

  // 长按交互（移动端）
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = e => {
    if (isMobile && longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    rootStore?.conversationStore.setAtType(data.chatType, conversationId, 'NONE');
    onClick && onClick(e);
  };

  const handleMouseOver = () => {
    if (isMobile) return;
    moreAction.visible && setShowMore(true);
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
    longPressTimerRef.current = window.setTimeout(() => {
      setShowMore(true);
      setIsPopoverOpen(true);
      longPressTriggeredRef.current = true;
    }, 600);
  };

  const cancelLongPress = () => {
    if (!isMobile) return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = e => {
    if (isMobile) {
      e.preventDefault();
    }
  };

  const deleteCvs: MouseEventHandler<HTMLLIElement> = async e => {
    e.stopPropagation();
    // 如果moreAction里传了onClick则用onClick，否则执行下面的逻辑
    const deleteAction = moreAction.actions.find(item => item.content === 'DELETE');
    if (deleteAction && deleteAction.onClick) {
      const value = await deleteAction.onClick(data);
      if (!value) {
        return;
      }
    }
    cvsStore.deleteConversation(data);

    rootStore.client.chatManager
      .deleteConversation({
        conversationId,
        conversationType: data.chatType,
        deleteRoamingMessages: true,
      })
      .then(() => {
        eventHandler.dispatchSuccess('deleteConversation');
      })
      .catch(err => {
        eventHandler.dispatchError('deleteConversation', err);
      });
    setIsPopoverOpen(false);
  };

  const pinCvs: MouseEventHandler<HTMLLIElement> = e => {
    e.stopPropagation();
    rootStore?.conversationStore.pinConversation(data.chatType, conversationId, !isPinned);
    setIsPopoverOpen(false);
  };

  const setSilent = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    e.stopPropagation();
    if (isSilent) {
      rootStore?.conversationStore.clearRemindTypeForConversation({
        chatType: data.chatType,
        conversationId,
      });
    } else {
      rootStore?.conversationStore.setSilentModeForConversation({
        chatType: data.chatType,
        conversationId,
      });
    }
    setIsPopoverOpen(false);
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
                <Icon type={isPinned ? 'ARROW_LINE' : 'LINE_ARROW'}></Icon>
                {isPinned ? t('unSticky') : t('sticky')}
              </li>
            );
          } else if (item.content === 'SILENT') {
            return (
              <li
                key={index}
                onClick={setSilent}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                <Icon type={isSilent ? 'BELL_SLASH' : 'BELL'}></Icon>
                {isSilent ? t('unmuteNotification') : t('muteNotification')}
              </li>
            );
          }
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              key={index}
              onClick={e => {
                e.stopPropagation();
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

  let lastMsg: ReactNode | ReactNode[] = '';

  const preview = getMessagePreviewData(lastMessage, t, {
    tokenStyle: 'bracket',
    combineLabelKey: 'chatHistory',
    mapUserCardToContact: true,
    mapCombinedTextSentinel: true,
  });

  if (preview.mode === 'renderText') {
    // 仅渲染文本，不解析链接点击
    lastMsg = renderTxt(preview.text, false, () => {});
  } else if (preview.mode === 'plainText') {
    lastMsg = preview.text;
  }

  lastMsg = renderMessageContent?.(lastMessage as BaseMessageType) ?? lastMsg;
  const hasMessagePreview = Array.isArray(lastMsg)
    ? lastMsg.some(node => node !== '' && node != null)
    : lastMsg !== '' && lastMsg != null;
  // 群聊无最后一条消息时不要拼 "发送者: "，否则空昵称会只剩一个冒号
  if (data.chatType == 'groupChat' && hasMessagePreview) {
    const formatSenderPrefix = (name?: string) => {
      const trimmed = (name || '').trim();
      return trimmed ? `${trimmed}: ` : '';
    };
    const msgFrom = (lastMessage as BaseMessageType)?.from || '';
    let from = msgFrom && msgFrom !== currentUserId ? formatSenderPrefix(msgFrom) : '';
    const groupItem = getGroupItemFromGroupsById(conversationId);
    if (groupItem) {
      const memberIdx = getGroupMemberIndexByUserId(groupItem, String(msgFrom)) ?? -1;
      // @ts-ignore
      const ease_chat_uikit_user_info = (lastMessage as BaseMessageType)?.ext
        ?.ease_chat_uikit_user_info;
      if (ease_chat_uikit_user_info && ease_chat_uikit_user_info.nickname) {
        from = formatSenderPrefix(ease_chat_uikit_user_info.nickname);
      } else if (memberIdx > -1) {
        const memberItem = groupItem?.members?.[memberIdx] || ({} as any);
        from = formatSenderPrefix(getGroupMemberNickName(memberItem));
      }
    }
    if (from) {
      if (Array.isArray(lastMsg)) {
        lastMsg = [from, ...Array.from(lastMsg)];
      } else {
        lastMsg = [from, lastMsg];
      }
    }
  }
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
      onContextMenu={handleContextMenu}
    >
      {avatar ? (
        avatar
      ) : (
        // 在会话列表不显示在线状态 isOnline={data.isOnline}
        <Avatar src={data.avatarUrl} size={avatarSize} shape={avatarShape}>
          {conversationName}
        </Avatar>
      )}

      <div className={`${prefixCls}-content`} onContextMenu={e => e.preventDefault()}>
        <span className={`${prefixCls}-nickname ${isSilent ? 'has-silent' : ''}`}>
          {conversationName}
          {isSilent && <Icon type="BELL_SLASH" className={`${prefixCls}-nickname-silent`}></Icon>}
        </span>
        <span
          className={`${prefixCls}-message`}
          // onSelectStart is not a valid React DOM prop on span. Use onMouseDown to prevent selection.
          onMouseDown={e => e.preventDefault()}
        >
          <AtTag type={data?.atType} />
          {lastMsg}
        </span>
      </div>
      <div className={`${prefixCls}-info`}>
        <span className={`${prefixCls}-time`}>
          {formatDateTime?.(getConversationLastMessageTime(data)) ||
            getConversationTime(getConversationLastMessageTime(data))}
        </span>
        {showMore ? (
          <Tooltip
            title={menuNode}
            trigger="click"
            placement="bottomRight"
            open={isPopoverOpen}
            onOpenChange={value => {
              setIsPopoverOpen(value);
              setShowMore(value);
            }}
          >
            {moreAction.icon || (
              <Icon
                type="ELLIPSIS"
                color={
                  themeMode === 'dark' ? 'var(--cui-primary-color6)' : 'var(--cui-primary-color5)'
                }
                height={20}
                width={20}
                style={{ cursor: 'pointer', zIndex: 10 }}
              ></Icon>
            )}
          </Tooltip>
        ) : (
          <div
            style={{
              height: '20px',
              position: 'relative',
            }}
          >
            <Badge
              dot={isSilent}
              count={unreadCount}
              color={
                badgeColor ??
                (themeMode === 'dark' ? 'var(--cui-primary-color6)' : 'var(--cui-primary-color5)')
              }
            ></Badge>
          </div>
        )}
      </div>
      {rippleProp && <Ripple></Ripple>}
    </div>
  );
};

ConversationItem = observer(ConversationItem);
export { ConversationItem };
