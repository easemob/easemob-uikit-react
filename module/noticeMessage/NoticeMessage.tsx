import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { getConversationTime, getMsgSenderNickname, BaseMessageType } from '../utils';
import './style/style.scss';
import type { RecallMessage } from '../store/MessageStore';
import rootStore from '../store/index';
import { useTranslation } from 'react-i18next';
export interface NoticeMessageProps {
  prefix?: string;
  className?: string;
  noticeMessage:
    | {
        message: string;
        time: number;
      }
    | RecallMessage;
  style?: React.CSSProperties;
}

const NoticeMessage = (props: NoticeMessageProps) => {
  const { t } = useTranslation();
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-notice', customizePrefixCls);
  const { noticeMessage } = props;
  let { message, time } = noticeMessage;
  const classString = classNames(prefixCls, className);

  if ((noticeMessage as RecallMessage).type == 'recall') {
    const myUserId = rootStore.client.user;
    if (myUserId == (noticeMessage as RecallMessage).from) {
      message = t('module.you') + ' ' + t('module.unsentAMessage');
    } else {
      message =
        getMsgSenderNickname(noticeMessage as BaseMessageType) + ' ' + t('module.unsentAMessage');
    }
  }
  return (
    <div className={classString}>
      <span>{message}</span>
      <span>{getConversationTime(time)}</span>
    </div>
  );
};

export { NoticeMessage };
