import React, { ReactNode, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import sent from '../assets/sent@3x.png';
import failed from '../assets/failed@3x.png';
import read from '../assets/read@3x.png';
import received from '../assets/received@3x.png';
import sending from '../assets/sending@3x.png';
import './style/style.scss';
import Icon from '../../component/icon';
import { RootContext } from '../store/rootContext';

export interface MessageStatusProps {
  status: 'received' | 'read' | 'unread' | 'sent' | 'failed' | 'sending' | 'default';
  type?: 'icon' | 'text';
  prefixCls?: string;
  className?: string;
}

const MessageStatus = (props: MessageStatusProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode || 'light';
  let statusNode: ReactNode;
  const { status = 'default', type = 'icon', prefixCls: customizePrefixCls, className } = props;
  const prefixCls = getPrefixCls('message-status', customizePrefixCls);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-icon`]: type == 'icon',
      [`${prefixCls}-text`]: type == 'text',
    },
    className,
  );

  switch (status) {
    case 'sending':
      statusNode =
        type == 'icon' ? <img alt="sending" src={sending as unknown as string}></img> : '发送中';
      break;
    case 'sent':
      statusNode = type == 'icon' ? <Icon type="CHECK" width={20} height={20}></Icon> : '已发送';
      break;
    case 'received':
      statusNode = type == 'icon' ? <Icon type="CHECK2" width={20} height={20}></Icon> : '已送达';
      break;
    case 'read':
      statusNode =
        type == 'icon' ? (
          <Icon
            type="CHECK2"
            width={20}
            height={20}
            color={themeMode == 'light' ? '#00CC77' : '#00FF95'}
          ></Icon>
        ) : (
          '已读'
        );
      break;
    case 'unread':
      statusNode = type == 'icon' ? <span></span> : '未读';
      break;
    case 'failed':
      statusNode =
        type == 'icon' ? (
          <Icon type="CANDLE_IN_CIRCLE" width={20} height={20} color="#FF002B"></Icon>
        ) : (
          '发送失败'
        );
      break;
    default:
      statusNode = null;
      break;
  }
  return <span className={classString}>{statusNode}</span>;
};

export { MessageStatus };
