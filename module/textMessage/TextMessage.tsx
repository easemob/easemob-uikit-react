import React, { ReactNode, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import Avatar from '../../component/avatar';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { emoji } from '../messageEditor/emoji/emojiConfig';
import { getConversationTime } from '../utils';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import rootStore from '../store/index';
import type { TextMessageType } from '../types/messageType';
import { getLinkPreview, getPreviewFromContent } from 'link-preview-js';
import { UrlMessage } from './UrlMessage';
import reactStringReplace from 'react-string-replace';
export interface TextMessageProps extends BaseMessageProps {
  textMessage: TextMessageType;
  // color?: string; // 字体颜色
  // backgroundColor?: string; // 气泡背景颜色
  type?: 'primary' | 'secondly';
  prefix?: string;
  nickName?: string; // 昵称
  className?: string;
  children?: string;
  style?: React.CSSProperties;
}

const renderTxt = (txt: string | undefined | null, detectedUrl: string | undefined) => {
  const urlRegex = /(https?:\/\/\S+)/gi;
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
  // if (detectedUrl) {
  rnTxt.forEach((text, index) => {
    if (urlRegex.test(text!.toString())) {
      let replacedText = reactStringReplace(text?.toString() || '', urlRegex, (match, i) => (
        <a key={match + i} target="_blank" href={match} className="message-text-url-link">
          {match}
        </a>
      ));
      rnTxt[index] = replacedText;
    }
  });
  // }

  return rnTxt;
};

const REGEX_VALID_URL = new RegExp(
  '^' +
    // protocol identifier
    '(?:(?:https?|ftp)://)' +
    // user:pass authentication
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // private & local networks
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broacast addresses
    // (first & last IP address of each class)
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // host name
    '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
    // domain name
    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
    // TLD identifier
    '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
    // TLD may end with dot
    '\\.?' +
    ')' +
    // port number
    '(?::\\d{2,5})?' +
    // resource path
    '(?:[/?#]\\S*)?' +
    '$',
  'i',
);

export const TextMessage = (props: TextMessageProps) => {
  let {
    prefix: customizePrefixCls,
    textMessage,
    className,
    style,
    nickName,
    type,
    ...others
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-text', customizePrefixCls);
  const [urlData, setUrlData] = useState<any>(null);
  const [isFetching, setFetching] = useState(false);
  let { bySelf, time, from, msg } = textMessage;

  const classString = classNames(prefixCls, className);

  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }
  console.log('渲染文本组件');
  const urlPreview = useRef<any>(null);

  const detectedUrl = msg
    ?.replace(/\n/g, ' ')
    .split(' ')
    .find(function (token) {
      return REGEX_VALID_URL.test(token);
    });
  if (detectedUrl) {
    console.log(detectedUrl);
  }
  useEffect(() => {
    if (detectedUrl) {
      setFetching(true);
      getLinkPreview(msg)
        .then(data => {
          urlPreview.current = data;
          setFetching(false);
          return setUrlData(data);
        })
        .catch(e => {
          setFetching(false);
          console.log(e);
        });
    }
  }, [detectedUrl]);
  let urlTxtClass = '';
  if (urlData?.images?.length > 0) {
    urlTxtClass = 'message-text-hasImage';
  }
  return (
    <BaseMessage
      direction={bySelf ? 'rtl' : 'ltr'}
      style={style}
      time={time}
      nickName={nickName || from}
      bubbleType={type}
      className={urlTxtClass}
      {...others}
    >
      <span className={classString}>{renderTxt(msg, detectedUrl)}</span>
      {!!(urlData?.title || urlData?.description) && (
        <UrlMessage {...urlData} isLoading={isFetching}></UrlMessage>
      )}
    </BaseMessage>
  );
};
