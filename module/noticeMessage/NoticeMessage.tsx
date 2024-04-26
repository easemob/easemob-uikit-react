import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import type { BaseMessageType } from '../baseMessage/BaseMessage';
import { getConversationTime, getMsgSenderNickname } from '../utils';
import './style/style.scss';
import rootStore from '../store/index';
import { useTranslation } from 'react-i18next';

export interface NoticeMessageBodyProps {
  message?: string;
  time: number;
  type?: 'notice' | 'recall';
  noticeType: 'recall' | 'pin' | 'unpin';
  ext?: Record<string, any>;
}

export class NoticeMessageBody {
  id: string;
  message?: string;
  time: number;
  type: 'notice' | 'recall';
  ext?: Record<string, any>;
  noticeType: 'recall' | 'pin' | 'unpin';
  constructor(props: NoticeMessageBodyProps) {
    const { message, time, noticeType, ext, type = 'notice' } = props;
    this.id = Date.now().toString();
    this.time = time;
    this.type = type;
    this.message = message;
    this.noticeType = noticeType;
    this.ext = ext || {};
  }
}

export interface NoticeMessageProps {
  prefix?: string;
  className?: string;
  noticeMessage: NoticeMessageBody;
  style?: React.CSSProperties;
}

const NoticeMessage = (props: NoticeMessageProps) => {
  const { t } = useTranslation();
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-notice', customizePrefixCls);
  const { noticeMessage, style = {} } = props;
  let { message, time } = noticeMessage;
  const classString = classNames(prefixCls, className);
  switch (noticeMessage.noticeType) {
    case 'recall':
      const myUserId = rootStore.client.user;
      if (myUserId == noticeMessage.ext?.from) {
        message = t('you') + ' ' + t('unsentAMessage');
      } else {
        message =
          getMsgSenderNickname(noticeMessage.ext as BaseMessageType) + ' ' + t('unsentAMessage');
      }
      break;
    case 'pin':
      message = `${getMsgSenderNickname({
        from: noticeMessage.ext?.operatorId,
        chatType: noticeMessage.ext?.conversationType,
        to: noticeMessage.ext?.conversationId,
      } as BaseMessageType)} ${t('pinned a message')}`;
      break;
    case 'unpin':
      message = `${getMsgSenderNickname({
        from: noticeMessage.ext?.operatorId,
        chatType: noticeMessage.ext?.conversationType,
        to: noticeMessage.ext?.conversationId,
      } as BaseMessageType)} ${t('removed a pin message')}`;
      break;
    default:
      break;
  }

  return (
    <div className={classString} style={{ ...style }}>
      <span>{message}</span>
      <span>{getConversationTime(time)}</span>
    </div>
  );
};

export { NoticeMessage };
