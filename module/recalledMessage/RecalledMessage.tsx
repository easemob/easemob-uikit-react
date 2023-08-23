import React from 'react';
import { AgoraChat } from 'agora-chat';
import TextMessage, { TextMessageProps } from '../textMessage';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { useTranslation } from 'react-i18next';
import './style/style.scss';

export interface RecalledMessageProps extends TextMessageProps {
  prefixCls?: string;
  className?: string;
  message: AgoraChat.MessageBody;
}

const RecalledMessage = (props: RecalledMessageProps) => {
  const { message, prefixCls: customizePrefixCls, className } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-recall', customizePrefixCls);
  const classSting = classNames(prefixCls, className);
  // @ts-ignore
  if (!message?.chatType) {
    return null;
  }
  const { t } = useTranslation();
  // @ts-ignore
  if (message.bySelf) {
    // @ts-ignore
    message.msg = t('module.you') + t('module.unsentAMessage');
  } else {
    // @ts-ignore
    message.msg = message.from + t('module.unsentAMessage');
  }
  return (
    <TextMessage
      customAction={{ visible: false }}
      reaction={false}
      bubbleClass={classSting}
      textMessage={message as unknown as TextMessageProps['textMessage']}
    />
  );
};

export { RecalledMessage };
