import React, { ReactNode, useContext, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import './style/style.scss';
import { cloneElement } from '../../component/_utils/reactNode';
import { getConversationTime } from '../utils';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import { RootContext } from '../store/rootContext';
import Icon from '../../component/icon';

import { RepliedMsg } from '../repliedMessage';
import { AgoraChat } from 'agora-chat';
import { useTranslation } from 'react-i18next';

export interface BaseMessageProps {
  // messageId: string; // 消息 id
  bubbleType?: 'primary' | 'secondly' | 'none'; // 气泡类型
  bubbleStyle?: React.CSSProperties;
  status?: MessageStatusProps['status'];
  avatar?: ReactNode;
  direction?: 'ltr' | 'rtl'; // 左侧布局/右侧布局
  prefix?: string;

  shape?: 'ground' | 'square'; // 气泡形状
  arrow?: boolean; // 气泡是否有箭头
  nickName?: string; // 昵称
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  time?: number;
  hasRepliedMsg?: boolean;
  repliedMessage?: AgoraChat.MessageBody;
  onReplyMessage?: () => void;
  onDeleteMessage?: () => void;
  id?: string;
}

const BaseMessage = (props: BaseMessageProps) => {
  const {
    // messageId,
    avatar,
    direction = 'ltr',
    status = 'default',
    prefix: customizePrefixCls,
    className,
    bubbleType = 'primary',
    style,
    bubbleStyle,
    time,
    nickName,
    shape = 'ground',
    arrow = false,
    hasRepliedMsg = false,
    onReplyMessage,
    repliedMessage,
    onDeleteMessage,
    id,
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-base', customizePrefixCls);
  let avatarToShow: ReactNode = avatar;
  const [hoverStatus, setHoverStatus] = useState(false);
  if (avatar) {
    avatarToShow = avatar;
  } else {
    avatarToShow = <Avatar>{nickName}</Avatar>;
  }
  const showRepliedMsg =
    typeof repliedMessage == 'object' && typeof repliedMessage.type == 'string';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-left`]: direction == 'ltr',
      [`${prefixCls}-right`]: direction == 'rtl',
      [`${prefixCls}-hasAvatar`]: !!avatar,
      [`${prefixCls}-${bubbleType}`]: !!bubbleType,
      [`${prefixCls}-${shape}`]: !!shape,
      [`${prefixCls}-arrow`]: !!arrow,
      [`${prefixCls}-reply`]: showRepliedMsg && shape === 'ground',
    },
    className,
  );

  const hasBubble = bubbleType !== 'none';

  const contentNode = hasBubble ? (
    <div className={`${prefixCls}-content`} style={bubbleStyle}>
      {props.children}
    </div>
  ) : (
    cloneElement(props.children, oriProps => ({
      style: {
        margin: '0 8px 0 12px',
        ...oriProps.style,
      },
    }))
  );
  const rootStore = useContext(RootContext).rootStore;

  // const recallMessage = () => {
  //   console.log('recallMessage', messageId);
  //   rootStore.messageStore.modifyMessage(messageId, {
  //     type: 'txt',
  //     msg: '已撤回',
  //     id: messageId,
  //     chatType: 'singleChat',
  //     to: 'zd2',
  //     time: Date.now(),
  //   });
  // };
  const moreAction = {
    visible: true,
    icon: null,
    actions: [
      {
        content: 'REPLY',
        onClick: () => {},
      },
      {
        content: 'DELETE',
        onClick: () => {},
      },
    ],
  };

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  const replyMessage = () => {
    onReplyMessage && onReplyMessage();
  };
  const deleteMessage = () => {
    onDeleteMessage && onDeleteMessage();
  };
  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction.actions.map((item, index) => {
          if (item.content === 'DELETE') {
            return (
              <li key={index} onClick={deleteMessage}>
                <Icon type="DELETE" width={16} height={16} color="#5270AD"></Icon>
                {t('module.delete')}
              </li>
            );
          } else if (item.content === 'REPLY') {
            return (
              <li key={index} onClick={replyMessage}>
                <Icon type="ARROW_TURN_LEFT" width={16} height={16} color="#5270AD"></Icon>
                {t('module.reply')}
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

  return (
    <div
      id={id}
      className={classString}
      style={{ ...style }}
      onMouseOver={() => setHoverStatus(true)}
      onMouseLeave={() => {
        console.log('leave');
        setHoverStatus(false);
      }}
    >
      {avatarToShow}
      <div className={`${prefixCls}-box`}>
        {showRepliedMsg ? (
          <RepliedMsg message={repliedMessage} shape={shape} direction={direction}></RepliedMsg>
        ) : (
          <div className={`${prefixCls}-info`}>
            <span className={`${prefixCls}-nickname`}>{nickName}</span>
            <span className={`${prefixCls}-time`}>{getConversationTime(time as number)}</span>
          </div>
        )}
        {/* <div className={`${prefixCls}-info`}>
          <span className={`${prefixCls}-nickname`}>{nickName}</span>
          <span className={`${prefixCls}-time`}>{getConversationTime(time as number)}</span>
        </div> */}

        <div className={`${prefixCls}-body`}>
          {contentNode}

          {hoverStatus ? (
            <Tooltip title={menuNode} trigger="click" placement="bottom">
              {moreAction.icon || <Icon type="ELLIPSIS" color="#33B1FF" height={20}></Icon>}
            </Tooltip>
          ) : (
            <MessageStatus status={status} type="icon"></MessageStatus>
          )}
        </div>
      </div>
    </div>
  );
};

export { BaseMessage };
