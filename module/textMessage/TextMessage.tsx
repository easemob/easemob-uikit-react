import React, { ReactNode } from 'react';
import classNames from 'classnames';
import Avatar from '../../src/avatar';
import MessageStatus, { MessageStatusProps } from '../messageStatus/MessageStatus';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import { emoji } from '../messageEditor/emoji/emojiConfig';
import { getConversationTime } from '../utils';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import rootStore from '../store/index';
import type { TextMessageType } from '../types/messageType';

export interface TextMessageProps extends BaseMessageProps {
  textMessage: TextMessageType;
  // color?: string; // 字体颜色
  // backgroundColor?: string; // 气泡背景颜色
  prefix?: string;
  nickName?: string; // 昵称
  className?: string;
  children?: string;
  style?: React.CSSProperties;
}

const renderTxt = (txt: string | undefined | null) => {
  if (txt === undefined || txt === null) {
    return [];
  }
  let rnTxt: React.ReactNode[] = [];
  let match;
  const regex = /(\[.*?\])/g;
  let start = 0;
  let index = 0;
  while ((match = regex.exec(txt))) {
    index = match.index;
    if (index > start) {
      rnTxt.push(txt.substring(start, index));
    }
    if (match[1] in emoji.map) {
      const v = emoji.map[match[1] as keyof typeof emoji.map];
      rnTxt.push(
        <img
          key={Math.floor(Math.random() * 100000 + 1) + new Date().getTime().toString()}
          alt={v}
          src={new URL(`/module/assets/reactions/${v}`, import.meta.url).href}
          width={20}
          height={20}
          style={{
            verticalAlign: 'middle',
          }}
        />,
      );
    } else {
      rnTxt.push(match[1]);
    }
    start = index + match[1].length;
  }
  rnTxt.push(txt.substring(start, txt.length));

  return rnTxt;
};

export const TextMessage = (props: TextMessageProps) => {
  const { prefix: customizePrefixCls, textMessage, className, style, nickName, ...others } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-text', customizePrefixCls);
  let { bySelf, time, from, msg } = textMessage;

  const classString = classNames(prefixCls, className);

  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  return (
    <BaseMessage
      direction={bySelf ? 'rtl' : 'ltr'}
      style={style}
      time={time}
      nickName={nickName || from}
      bubbleType={bySelf ? 'primary' : 'secondly'}
      {...others}
    >
      <span className={classString}>{renderTxt(msg)}</span>
    </BaseMessage>
  );
};
