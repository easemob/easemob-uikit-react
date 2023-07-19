import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import Icon from '../../component/icon';
import './style/style.scss';
import { AgoraChat } from 'agora-chat';
import rootStore from '../store/index';
import { useTranslation } from 'react-i18next';
import { renderTxt } from '../textMessage/TextMessage';
const msgType = ['txt', 'file', 'img', 'audio', 'custom', 'video'];
export interface RepliedMsgProps {
  prefixCls?: string;
  className?: string;
  shape?: 'ground' | 'square'; // 气泡形状
  direction?: 'ltr' | 'rtl';
  message: AgoraChat.MessageBody;
}

const RepliedMsg = (props: RepliedMsgProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    shape = 'square',
    direction = 'ltr',
    message,
  } = props;
  if (!message) {
    return null;
  }
  const { t } = useTranslation();
  const prefixCls = getPrefixCls('reply-message', customizePrefixCls);
  const [hoverStatus, setHoverStatus] = useState(false);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${shape}`]: !!shape,
      [`${prefixCls}-left`]: direction == 'ltr',
      [`${prefixCls}-right`]: direction == 'rtl',
    },
    className,
  );

  const [msgQuote, setMsgQuote] = useState<
    | {
        msgID: string;
        msgPreview: string; //原消息的描述，用于显示在消息列表气泡中，超过字符限制将被截取,
        msgSender: string; //原消息的发送者，建议使用备注名或昵称,
        msgType: AgoraChat.MessageBody['type']; //原消息类型,
      }
    | undefined
  >();
  const [repliedMsg, setRepliedMsg] = useState<AgoraChat.MessageBody | undefined>();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>();
  // 找到被引用的消息

  useEffect(() => {
    if (msgType.includes(message.type)) {
      // @ts-ignore
      let msgQuote = message.ext.msgQuote;
      if (typeof msgQuote === 'string') {
        msgQuote = JSON.parse(msgQuote);
      }
      setMsgQuote(msgQuote);
      const messages = rootStore.messageStore.currentCvsMsgs;

      const finsMsgs = messages.filter(msg => {
        // @ts-ignore
        return msg.mid === msgQuote.msgID || msg.id === msgQuote.msgID;
      });

      if (finsMsgs.length > 0) {
        setRepliedMsg(finsMsgs[0]);
      }
      if (finsMsgs[0]) {
        setAnchorElement(document.getElementById(finsMsgs[0].id));
      }

      console.log('我找到你了', msgQuote, repliedMsg);
    }
  }, []);

  //   if (!msgQuote) {
  //     return null;
  //   }

  // 渲染引用消息的内容
  let renderMsgContent = () => {
    let content: ReactNode;
    if (!repliedMsg) {
      return (content = (
        <div className={`${prefixCls}-content-text-not`}>{t('module.messageNotFound')}</div>
      ));
    }
    switch (msgQuote?.msgType) {
      case 'txt':
        content = (
          <div className={`${prefixCls}-content-text`}>{renderTxt(msgQuote.msgPreview, '')}</div>
        );
        break;
      case 'file':
        content = (
          <div className={`${prefixCls}-content-text`}>
            <Icon type="DOC" color="#75828A" width={16} height={16}></Icon>
            <span>Attachment:</span> {(repliedMsg as AgoraChat.FileMsgBody).filename}
          </div>
        );
        break;
      case 'audio':
        content = (
          <div className={`${prefixCls}-content-text`}>
            <Icon type="WAVE3" color="#75828A" width={16} height={16}></Icon>
            <span>Audio:</span>
            {(repliedMsg as AgoraChat.AudioMsgBody).length}"
          </div>
        );
        break;
      case 'img':
        content = (
          <div className={`${prefixCls}-content-text`}>
            <div className={`${prefixCls}-summary-desc-img`}>
              <img
                height={75}
                src={
                  (repliedMsg as AgoraChat.ImgMsgBody).thumb ||
                  (repliedMsg as AgoraChat.ImgMsgBody).url
                }
              ></img>
            </div>
          </div>
        );
        break;
      default:
        content = '';
        break;
    }
    return content;
  };

  const scrollToMsg = () => {
    anchorElement?.scrollIntoView({ behavior: 'smooth' });
    anchorElement?.classList.add('reply-message-twinkle');

    setTimeout(() => {
      anchorElement?.classList.remove('reply-message-twinkle');
    }, 1500);
  };
  const myUserId = rootStore.client.user;
  const from = message.from === myUserId ? t('module.you') : message.from;
  const to = msgQuote?.msgSender === myUserId ? t('module.you') : msgQuote?.msgSender;

  return (
    <div
      className={classString}
      onMouseOver={() => setHoverStatus(true)}
      onMouseLeave={() => {
        setHoverStatus(false);
      }}
    >
      <div className={`${prefixCls}-nick`}>
        <Icon type="ARROW_TURN_LEFT" width={16} height={16} color="#5270AD"></Icon>
        <span>{from}</span>
        {t('module.repliedTo')}
        <span>{to}</span>
      </div>
      <div className={`${prefixCls}-box`}>
        <div className={`${prefixCls}-content`}>{renderMsgContent()}</div>
        {hoverStatus && (
          <Icon
            className={`${prefixCls}-arrow`}
            type="ARROW_UP_THICK"
            color="#464E53"
            height={18}
            width={18}
            onClick={scrollToMsg}
          ></Icon>
        )}
      </div>
    </div>
  );
};

export { RepliedMsg };
