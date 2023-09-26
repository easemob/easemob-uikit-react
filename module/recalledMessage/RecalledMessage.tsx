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
  onlyContent?: boolean;
}

const RecalledMessage = (props: RecalledMessageProps) => {
  const { message, prefixCls: customizePrefixCls, className, onlyContent } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-recall', customizePrefixCls);
  const classSting = classNames(prefixCls, className);
  // @ts-ignore
  if (!message?.chatType) {
    return null;
  }
  const { t } = useTranslation();
  // @ts-ignore
  // if (message.bySelf) {
  //   // @ts-ignore
  //   message.msg = t('you') + t('unsentAMessage');
  // } else {
  //   // @ts-ignore
  //   message.msg = message.from + t('unsentAMessage');
  // }
  // @ts-ignore
  // message.msg = t('unsupportedMessageType');
  const msg = { ...message, msg: t('unsupportedMessageType') };
  return (
    <TextMessage
      onlyContent={onlyContent}
      customAction={{ visible: false }}
      reaction={false}
      className={classSting}
      bubbleClass={classSting}
      textMessage={msg as unknown as TextMessageProps['textMessage']}
    />
  );
};

export { RecalledMessage };
