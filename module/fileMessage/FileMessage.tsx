import React from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import { ConfigContext } from '../../src/config/index';
import Icon, { IconProps } from '../../src/icon';
import './style/style.scss';
import type { FileMessageType } from '../types/messageType';
import Avatar from '../../src/avatar';
import download from '../utils/download';
import rootStore from '../store/index';
export interface FileMessageProps extends BaseMessageProps {
  fileMessage: FileMessageType; // 从SDK收到的文件消息
  iconType?: IconProps['type'];
  prefix?: string;
  className?: string;
  type?: 'primary' | 'secondly';
}

const FileMessage = (props: FileMessageProps) => {
  const {
    iconType = 'DOC',
    fileMessage,
    shape,
    prefix: customizePrefixCls,
    style,
    type = 'primary',
    className,
    ...baseMsgProps
  } = props;

  const { filename, file_length } = fileMessage;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-file', customizePrefixCls);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: !!type,
    },
    className,
  );

  const handleClick = () => {
    fetch(fileMessage.url)
      .then(res => {
        return res.blob();
      })
      .then(blob => {
        download(blob, filename);
      })
      .catch(err => {
        return false;
      });
  };
  let { bySelf } = fileMessage;
  if (typeof bySelf == 'undefined') {
    bySelf = fileMessage.from === rootStore.client.context.userId;
  }
  return (
    <BaseMessage
      bubbleType={bySelf ? 'primary' : 'secondly'}
      style={style}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      {...baseMsgProps}
    >
      <div className={classString}>
        <div className={`${prefixCls}-info`}>
          <span onClick={handleClick}>{filename}</span>
          <span>{(file_length / 1024).toFixed(2)}kb</span>
        </div>
        <div className={`${prefixCls}-icon`}>
          <Icon type={iconType} height="32px" width="32px" color="#ACB4B9"></Icon>
        </div>
      </div>
    </BaseMessage>
  );
};

export { FileMessage };
