import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import sent from '../assets/sent@3x.png';
import failed from '../assets/failed@3x.png';
import read from '../assets/read@3x.png';
import received from '../assets/received@3x.png';
import sending from '../assets/sending@3x.png';
import './style/style.scss';
export interface MessageStatusProps {
  status: 'received' | 'read' | 'unread' | 'sent' | 'failed' | 'sending' | 'default';
  type?: 'icon' | 'text';
  prefixCls?: string;
  className?: string;
}

const MessageStatus = (props: MessageStatusProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);

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
      statusNode =
        type == 'icon' ? <img alt="sent" src={sent as unknown as string}></img> : '已发送';
      break;
    case 'received':
      statusNode =
        type == 'icon' ? (
          <img alt="received" src={received as unknown as string}></img>
        ) : (
          '发送成功'
        );
      break;
    case 'read':
      statusNode = type == 'icon' ? <img alt="read" src={read as unknown as string}></img> : '已读';
      break;
    case 'unread':
      statusNode = type == 'icon' ? <span></span> : '未读';
      break;
    case 'failed':
      statusNode =
        type == 'icon' ? <img alt="fail" src={failed as unknown as string}></img> : '发送失败';
      break;
    default:
      statusNode = null;
      break;
  }
  return <span className={classString}>{statusNode}</span>;
};

export { MessageStatus };
