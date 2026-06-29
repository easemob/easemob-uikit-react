import React, { ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import Icon from '../../component/icon';
import './style/style.scss';
import type { ChatSDK } from '../SDK';
import { useTranslation } from 'react-i18next';
import { renderTxt } from '../textMessage/TextMessage';
import {
  getAttachmentUrl,
  getCurrentUserId,
  getCustomEvent,
  getCustomParams,
  getCvsIdFromMessage,
  getMessageId,
  getMsgSenderNickname,
} from '../utils';
import download from '../utils/download';
import { ImagePreview } from '../imageMessage';
import CombinedMessage, { CombinedMessageProps } from '../combinedMessage';
import AudioMessage, { AudioMessageProps } from '../audioMessage';
import RecalledMessage from '../recalledMessage';
import { RootContext } from '../store/rootContext';
import { BaseMessageType } from '../baseMessage/BaseMessage';
const msgType = [
  'text',
  'txt',
  'file',
  'image',
  'img',
  'voice',
  'audio',
  'custom',
  'video',
  'combine',
  'recall',
];
type QuoteMessageType =
  | 'text'
  | 'txt'
  | 'file'
  | 'image'
  | 'img'
  | 'voice'
  | 'audio'
  | 'custom'
  | 'video'
  | 'combine'
  | 'loc'
  | 'recall';
type FileMessageBodyLike = { url?: string; filename?: string };
type ImageMessageBodyLike = { thumbnailUrl?: string };
type VideoMessageBodyLike = { url?: string };

// 自定义消息引用渲染器的上下文
export interface CustomMessageQuoteContext {
  message: ChatSDK.Message;
  msgQuote?: {
    msgID: string;
    msgPreview: string;
    msgSender: string;
    msgType: QuoteMessageType;
  };
  prefixCls: string;
}

// 自定义消息引用渲染器类型
export type CustomMessageQuoteRenderer = (context: CustomMessageQuoteContext) => ReactNode;

export interface RepliedMsgProps {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  shape?: 'round' | 'square'; // 气泡形状
  direction?: 'ltr' | 'rtl';
  message: BaseMessageType;
  /**
   * 自定义消息被引用时的渲染器
   * 用于渲染用户自定义的 custom 消息在被引用时的展示内容
   *
   * @example
   * ```tsx
   * renderCustomMessageQuote={(context) => {
   *   const { message, prefixCls } = context;
   *   if (message.customEvent === 'myCustomType') {
   *     return (
   *       <div className={`${prefixCls}-content-text`}>
   *         <Icon type="CUSTOM_ICON" />
   *         <span>我的自定义消息: {message.customExts?.title}</span>
   *       </div>
   *     );
   *   }
   *   return null; // 返回 null 使用默认渲染
   * }}
   * ```
   */
  renderCustomMessageQuote?: CustomMessageQuoteRenderer;
}

const RepliedMsg = (props: RepliedMsgProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    shape = 'square',
    direction = 'ltr',
    message,
    style = {},
    renderCustomMessageQuote,
  } = props;
  if (!message) {
    return null;
  }
  const { t } = useTranslation();
  const prefixCls = getPrefixCls('reply-message', customizePrefixCls);
  const [hoverStatus, setHoverStatus] = useState(false);
  const context = React.useContext(RootContext);
  const { rootStore, theme } = context;
  let bubbleShape = shape;
  if (theme?.bubbleShape && !shape) {
    bubbleShape = theme?.bubbleShape;
  }
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${bubbleShape}`]: !!bubbleShape,
      [`${prefixCls}-left`]: direction == 'ltr',
      [`${prefixCls}-right`]: direction == 'rtl',
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [msgQuote, setMsgQuote] = useState<
    | {
        msgID: string;
        msgPreview: string; //原消息的描述，用于显示在消息列表气泡中，超过字符限制将被截取,
        msgSender: string; //原消息的发送者，建议使用备注名或昵称,
        msgType: QuoteMessageType; //原消息类型,
      }
    | undefined
  >();
  const [repliedMsg, setRepliedMsg] = useState<ChatSDK.Message | undefined>();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>();
  // 找到被引用的消息
  const cvsId = getCvsIdFromMessage(message);
  // @ts-ignore
  const chatType = message.conversationType || (message as any).chatType;
  const messages = (rootStore.messageStore.message as any)[chatType]?.[cvsId] || [];

  useEffect(() => {
    const messageType = (message as any).type || '';
    if (msgType.includes(messageType)) {
      let msgQuote = message.ext?.msgQuote;
      if (typeof msgQuote === 'string') {
        msgQuote = JSON.parse(msgQuote);
      }
      if (!msgQuote) return;
      setMsgQuote(msgQuote);

      // const messages = rootStore.messageStore.currentCvsMsgs;
      const findMsgs = messages.filter((msg: ChatSDK.Message) => {
        return getMessageId(msg) === msgQuote.msgID;
      }) as ChatSDK.Message[];

      if (findMsgs.length > 0) {
        setRepliedMsg(findMsgs[0]);
      } else {
        setRepliedMsg(undefined);
      }
      if (findMsgs[0]) {
        setAnchorElement(document.getElementById(getMessageId(findMsgs[0])));
      }
    }
  }, [messages.length]);

  const [imgPreviewVisible, setImgVisible] = useState(false);
  // download file
  const handleClick = (fileMessage: any) => {
    const body = fileMessage.body as FileMessageBodyLike;
    fetch(body.url || '')
      .then(res => {
        return res.blob();
      })
      .then(blob => {
        download(blob, body.filename || '');
      })
      .catch(err => {
        return false;
      });
  };

  // 渲染引用消息的内容
  const renderMsgContent = () => {
    let content: ReactNode;
    if (!repliedMsg) {
      return (content = (
        <div className={`${prefixCls}-content-text-not`}>{t('messageNotFound')}</div>
      ));
    }
    // @ts-ignore
    if (repliedMsg.type === 'recall') {
      const msg = t('messageNotFound');
      // @ts-ignore
      // if (repliedMsg.bySelf) {
      //   msg = t('you') + t('unsentAMessage');
      // } else {
      //   // @ts-ignore
      //   msg = repliedMsg.from + t('unsentAMessage');
      // }
      return (content = <div className={`${prefixCls}-content-text-not`}>{msg}</div>);
    }
    switch (msgQuote?.msgType) {
      case 'text':
      case 'txt':
        content = (
          <div className={`${prefixCls}-content-text`}>
            {renderTxt(msgQuote.msgPreview, false, () => {})}
          </div>
        );
        break;
      case 'file':
        content = (
          <div
            className={`${prefixCls}-content-text`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              handleClick(repliedMsg);
            }}
          >
            <Icon type="DOC" color="#75828A" width={20} height={20}></Icon>
            <span>Attachment:</span> {(repliedMsg.body as FileMessageBodyLike).filename}
          </div>
        );
        break;
      case 'voice':
      case 'audio':
        // content = (
        //   <div className={`${prefixCls}-content-text`}>
        //     <Icon type="WAVE3" color="#75828A" width={20} height={20}></Icon>
        //     <span>Audio:</span>
        //     {(repliedMsg as ChatSDK.AudioMsgBody).length}"
        //   </div>
        // );
        (() => {
          const bySelf = getCurrentUserId(rootStore.client) == message.from;
          const msg = { ...repliedMsg, bySelf: bySelf };
          content = (
            <AudioMessage
              type={'secondly'}
              className="cui-message-base-reply"
              // style={{ flexDirection: 'row' }}
              onlyContent={true}
              audioMessage={msg as AudioMessageProps['audioMessage']}
            ></AudioMessage>
          );
        })();

        break;
      case 'image':
      case 'img':
        content = (
          <div className={`${prefixCls}-content-text`}>
            <div className={`${prefixCls}-summary-desc-img`}>
              <img
                onClick={() => {
                  setImgVisible(true);
                }}
                height={75}
                src={
                  (repliedMsg.body as ImageMessageBodyLike).thumbnailUrl ||
                  getAttachmentUrl(repliedMsg)
                }
                crossOrigin="anonymous"
              ></img>
            </div>
            <ImagePreview
              visible={imgPreviewVisible}
              previewImageUrl={getAttachmentUrl(repliedMsg)}
              onCancel={() => {
                setImgVisible(false);
              }}
            ></ImagePreview>
          </div>
        );
        break;
      case 'video':
        content = (
          <div className={`${prefixCls}-content-text`}>
            <div className={`${prefixCls}-summary-desc-img`}>
              <video
                onClick={() => {
                  setImgVisible(true);
                }}
                height={75}
                src={
                  (repliedMsg.body as VideoMessageBodyLike).url ||
                  (repliedMsg as any).file?.url ||
                  ''
                }
              ></video>
            </div>
          </div>
        );
        break;

      case 'combine':
        // content = (
        //   <div className={`${prefixCls}-content-text`}>
        //     <Icon type="TIME" color="#75828A" width={20} height={20}></Icon>
        //     <span>{t('chatHistory')}</span>
        //   </div>
        // );
        content = (
          <CombinedMessage
            combinedMessage={repliedMsg as CombinedMessageProps['combinedMessage']}
            onlyContent={true}
            showSummary={false}
            type="secondly"
          ></CombinedMessage>
        );
        break;
      case 'loc':
        content = (
          //@ts-ignore
          <RecalledMessage
            //@ts-ignore
            message={repliedMsg}
            onlyContent={true}
          ></RecalledMessage>
        );
        break;
      case 'custom':
        // 优先使用用户自定义的渲染器
        if (renderCustomMessageQuote) {
          const customContent = renderCustomMessageQuote({
            message: repliedMsg,
            msgQuote,
            prefixCls,
          });
          if (customContent) {
            content = customContent;
            break;
          }
        }

        // 内置的 userCard 类型处理
        if (getCustomEvent(repliedMsg) === 'userCard') {
          content = (
            <div className={`${prefixCls}-content-text`}>
              <Icon type="PERSON_SINGLE_FILL" color="#75828A" width={20} height={20}></Icon>
              <span>Contact:</span>{' '}
              {(getCustomParams(repliedMsg) as Record<string, string>)?.nickname}
            </div>
          );
        } else {
          // 未知的 custom 类型，显示默认提示
          content = (
            <div className={`${prefixCls}-content-text`}>
              <Icon type="BUBBLE_FILL" color="#75828A" width={20} height={20}></Icon>
              <span>{t('customMessage')}</span>
            </div>
          );
        }
        break;
      default:
        content = (
          //@ts-ignore
          <RecalledMessage
            //@ts-ignore
            message={repliedMsg}
            onlyContent={true}
          ></RecalledMessage>
        );
        break;
    }
    return content;
  };

  const scrollToMsg = () => {
    anchorElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    anchorElement?.classList.add('reply-message-twinkle');

    setTimeout(() => {
      anchorElement?.classList.remove('reply-message-twinkle');
    }, 1500);
  };
  const myUserId = getCurrentUserId(rootStore.client);
  const from =
    message.from === myUserId ? t('you') : getMsgSenderNickname(message as BaseMessageType);

  const to =
    (msgQuote?.msgSender === myUserId ||
      msgQuote?.msgSender == rootStore.addressStore.appUsersInfo[myUserId]?.nickname) &&
    message.from == myUserId
      ? t('yourself')
      : msgQuote?.msgSender === myUserId ||
        msgQuote?.msgSender == rootStore.addressStore.appUsersInfo[myUserId]?.nickname
      ? t('you')
      : rootStore.addressStore.appUsersInfo?.[msgQuote?.msgSender as string]?.nickname ||
        msgQuote?.msgSender;

  return (
    <div
      className={classString}
      style={{ ...style }}
      onMouseOver={() => setHoverStatus(true)}
      onMouseLeave={() => {
        setHoverStatus(false);
      }}
    >
      <div className={`${prefixCls}-nick`}>
        <Icon type="ARROW_TURN_LEFT" width={20} height={20} color="#5270AD"></Icon>
        <span>{from}</span>
        {t('repliedTo')}
        <span>{to}</span>
      </div>
      <div className={`${prefixCls}-box`}>
        <div
          className={`${prefixCls}-content`}
          style={{
            width:
              repliedMsg?.type == 'voice'
                ? `calc(${(repliedMsg.body as ChatSDK.VoiceMessageBody).duration || 0}% + 48px)`
                : 'auto',
          }}
          onClick={scrollToMsg}
        >
          {renderMsgContent()}
        </div>
        {hoverStatus && (
          <div title={t('Click to view the original message') as string}>
            <Icon
              className={`${prefixCls}-arrow`}
              type="ARROW_UP_THICK"
              height={18}
              width={18}
              onClick={scrollToMsg}
            ></Icon>
          </div>
        )}
      </div>
    </div>
  );
};

export { RepliedMsg };
