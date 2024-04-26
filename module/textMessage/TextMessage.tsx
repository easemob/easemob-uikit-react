import React, { ReactNode, useContext, useEffect, useRef, useState, memo } from 'react';
import classNames from 'classnames';
import Avatar from '../../component/avatar';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { emoji } from '../messageInput/emoji/emojiConfig';
import { getConversationTime } from '../utils';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import rootStore from '../store/index';
import type { TextMessageType } from '../types/messageType';
import { getLinkPreview, getPreviewFromContent } from 'link-preview-js';
import { UrlMessage } from './UrlMessage';
import reactStringReplace from 'react-string-replace';
import { chatSDK, ChatSDK } from '../SDK';
import Modal from '../../component/modal';
import { getCvsIdFromMessage, renderHtml, formatHtmlString } from '../utils';
import { convertToMessage } from '../messageInput/textarea/util';
import Icon from '../../component/icon';
import { useTranslation } from 'react-i18next';
import Textarea from '../messageInput/textarea';
import { ForwardRefProps } from '../messageInput/textarea/Textarea';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface TextMessageProps extends BaseMessageProps {
  textMessage: TextMessageType;
  // color?: string; // 字体颜色
  // backgroundColor?: string; // 气泡背景颜色
  type?: 'primary' | 'secondly';
  prefix?: string;
  nickName?: string; // 昵称
  className?: string;
  bubbleClass?: string;
  children?: string;
  style?: React.CSSProperties;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onCreateThread?: () => void;
  onTranslateTextMessage?: (textMessage: ChatSDK.TextMsgBody) => boolean;
  targetLanguage?: string;
  showTranslation?: boolean; // 是否展示翻译后的消息
  onlyContent?: boolean;
  onOpenThreadPanel?: (threadId: string) => void;
  showEditedTag?: boolean;
}

export const renderTxt = (txt: string | undefined | null, parseUrl: boolean = true) => {
  const urlRegex = /(https?:\/\/\S+)/gi;
  if (txt === undefined || txt === null) {
    return [];
  }
  let rnTxt: React.ReactNode[] = [];
  let match;

  const regex =
    /(U\+1F600|U\+1F604|U\+1F609|U\+1F62E|U\+1F92A|U\+1F60E|U\+1F971|U\+1F974|U\+263A|U\+1F641|U\+1F62D|U\+1F610|U\+1F607|U\+1F62C|U\+1F913|U\+1F633|U\+1F973|U\+1F620|U\+1F644|U\+1F910|U\+1F97A|U\+1F928|U\+1F62B|U\+1F637|U\+1F912|U\+1F631|U\+1F618|U\+1F60D|U\+1F922|U\+1F47F|U\+1F92C|U\+1F621|U\+1F44D|U\+1F44E|U\+1F44F|U\+1F64C|U\+1F91D|U\+1F64F|U\+2764|U\+1F494|U\+1F495|U\+1F4A9|U\+1F48B|U\+2600|U\+1F31C|U\+1F308|U\+2B50|U\+1F31F|U\+1F389|U\+1F490|U\+1F382|U\+1F381|😀|😄|😉|😮|🤪|😎|🥱|🥴|☺|🙁|😭|😐|😇|😬|🤓|😳|🥳|😠|🙄|🤐|🥺|🤨|😫|😷|🤒|😱|😘|😍|🤢|👿|🤬|😡|👍|👎|👏|🙌|🤝|🙏|❤️|💔|💕|💩|💋|☀️|🌜|🌈|⭐|🌟|🎉|💐|🎂|🎁)/g;
  let start = 0;
  let index = 0;
  while ((match = regex.exec(txt))) {
    index = match.index;
    if (index > start) {
      rnTxt.push(txt.substring(start, index));
    }
    if (match[1] in emoji.oldMap) {
      const v = emoji.oldMap[match[1] as keyof typeof emoji.oldMap];
      rnTxt.push(
        <img
          key={Math.floor(Math.random() * 100000 + 1) + new Date().getTime().toString()}
          alt={match[1]}
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
  if (parseUrl) {
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
  }

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

const TextMessage = (props: TextMessageProps) => {
  let {
    prefix: customizePrefixCls,
    textMessage,
    className,
    style,
    nickName,
    type,
    bubbleClass,
    renderUserProfile,
    thread,
    onTranslateTextMessage,
    targetLanguage,
    showTranslation = true,
    onlyContent = false,
    onOpenThreadPanel,
    showEditedTag = true,
    ...others
  } = props;
  if (!textMessage.chatType) return null;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-text', customizePrefixCls);
  const { t } = useTranslation();
  const [urlData, setUrlData] = useState<any>(null);
  const [isFetching, setFetching] = useState(false);
  let conversationId = getCvsIdFromMessage(textMessage);
  let { bySelf, time, from, msg, reactions } = textMessage;
  const classString = classNames(prefixCls, className);
  const textareaRef = useRef<ForwardRefProps>(null);
  const context = React.useContext(RootContext);
  const { initConfig } = context;
  const { translationTargetLanguage } = initConfig;
  const targetLng = targetLanguage || translationTargetLanguage || 'en';
  const [modifyMessageVisible, setModifyMessageVisible] = useState<boolean>(false);
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType: textMessage.chatType as any,
    },
  });
  let urlTxtClass = '';
  if (urlData?.images?.length > 0) {
    urlTxtClass = 'message-text-hasImage';
  }

  let bubbleClassName = '';
  if (bubbleClass) {
    bubbleClassName = bubbleClass + ' ' + urlTxtClass;
  }

  // --------------- translation -----------
  const [btnText, setBtnText] = useState('hide');
  const [transStatus, setTransStatus] = useState('translated');
  const transPrefix = getPrefixCls('message-text-translation', customizePrefixCls);
  const modifyPrefix = getPrefixCls('modify-textarea', customizePrefixCls);

  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context?.userId;
  }
  const translationClass = classNames(transPrefix, {
    [`${transPrefix}-left`]: !bySelf,
    [`${transPrefix}-right`]: bySelf,
    [`${transPrefix}-hide`]: btnText === 'show',
  });

  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }
  const urlPreview = useRef<any>(null);

  const detectedUrl = msg
    ?.replace(/\n/g, ' ')
    .split(' ')
    .find(function (token) {
      return REGEX_VALID_URL.test(token);
    });
  if (detectedUrl) {
    // console.log(detectedUrl);
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
          console.error(e);
        });
    }
  }, [detectedUrl]);

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(textMessage);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(textMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      textMessage.mid || textMessage.id,
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(textMessage.mid || textMessage.id);
  };

  let repliedMsg: undefined | ChatSDK.MessageBody;
  if (textMessage.ext?.msgQuote) {
    repliedMsg = textMessage;
  }

  const handleClickEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(textMessage);
    rootStore.messageStore.addReaction(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      textMessage.mid || textMessage.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(textMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      textMessage.mid || textMessage.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(textMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: textMessage.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            textMessage.mid || textMessage.id,
            emojiString,
          );
        }

        if (item.isAddedBySelf) {
          const index = item.userList.indexOf(rootStore.client.user);
          if (index > -1) {
            const findItem = item.userList.splice(index, 1)[0];
            item.userList.unshift(findItem);
          } else {
            item.userList.unshift(rootStore.client.user);
          }
        }
      }
    });
  };

  const handleRecallMessage = () => {
    let conversationId = getCvsIdFromMessage(textMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      textMessage.mid || textMessage.id,
      textMessage.isChatThread,
      true,
    );
  };

  const switchShowTranslation = () => {
    if (btnText == 'retry') {
      return handleTranslateMessage();
    }
    setBtnText(btnText === 'hide' ? 'show' : 'hide');
  };

  const handleTranslateMessage = () => {
    const result = onTranslateTextMessage?.(textMessage);
    if (result == false) {
      return;
    }
    setTransStatus('translating');
    let conversationId = getCvsIdFromMessage(textMessage);
    rootStore.messageStore
      .translateMessage(
        {
          chatType: textMessage.chatType,
          conversationId: conversationId,
        },
        // @ts-ignore
        textMessage.mid || textMessage.id,
        targetLng,
      )
      ?.then(() => {
        setTransStatus('translated');
      })
      .catch(() => {
        setTransStatus('translationFailed');
        setBtnText('retry');
      });
  };

  const handleSelectMessage = () => {
    let conversationId = getCvsIdFromMessage(textMessage);
    const selectable =
      rootStore.messageStore.selectedMessage[textMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(textMessage);
  };

  const select =
    rootStore.messageStore.selectedMessage[textMessage.chatType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[textMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(textMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == textMessage.id || item.mid == textMessage.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: textMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
  };

  const handleModifyMessage = () => {
    setModifyMessageVisible(true);
  };

  const cancelModifyMessage = () => {
    setModifyMessageVisible(false);
  };

  const confirmModifyMessage = () => {
    setModifyMessageVisible(false);
    const currentCVS = rootStore.conversationStore.currentCvs;
    let msg = convertToMessage(textareaRef?.current?.divRef?.current?.innerHTML || '').trim();
    const { isChatThread, to, chatThread } = textMessage as ChatSDK.TextMsgBody;
    const isThread = !!(isChatThread || chatThread);
    const message = chatSDK.message.create({
      to: isThread ? to : currentCVS.conversationId,
      chatType: currentCVS.chatType,
      type: 'txt',
      isChatThread: isThread,
      msg: msg,
    }) as ChatSDK.TextMsgBody;
    // @ts-ignore
    rootStore.messageStore.modifyServerMessage(textMessage?.mid || textMessage?.id, message);
  };

  useEffect(() => {
    if (modifyMessageVisible) {
      setTimeout(() => {
        if (textareaRef?.current?.divRef.current) {
          textareaRef.current.divRef.current.innerHTML = renderHtml(
            formatHtmlString(textMessage.msg),
          );
        }
      }, 200);
    }
  }, [modifyMessageVisible]);

  // open thread panel
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: textMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // @ts-ignore
  let _thread =
    // @ts-ignore
    textMessage.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !textMessage.chatThread &&
    !textMessage.isChatThread;
  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(textMessage.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: textMessage,
      info: textMessage.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(textMessage?.chatThreadOverview?.id || '');
    onOpenThreadPanel?.(textMessage.chatThreadOverview?.id || '');
  };

  return (
    <>
      {onlyContent ? (
        <div>
          <span className={classString}>{renderTxt(msg, true)}</span>
          {!!(urlData?.title || urlData?.description) && (
            <UrlMessage {...urlData} isLoading={isFetching}></UrlMessage>
          )}

          {showEditedTag && textMessage?.modifiedInfo ? (
            <div className={`${classString}-edit-tag`}>{t('edited')}</div>
          ) : (
            ''
          )}
          {
            // @ts-ignore
            (textMessage.translations || transStatus == 'translating') && showTranslation && (
              <div className={translationClass}>
                <div className={`${transPrefix}-line`}></div>
                <span className={`${transPrefix}-text`}>
                  {
                    // @ts-ignore
                    renderTxt(textMessage.translations?.[0]?.text, true)
                  }
                </span>
                <div className={`${transPrefix}-action`}>
                  <Icon type="TRANSLATION" width={16} height={16}></Icon>
                  <span>{t(`${transStatus}`)}</span>
                  <span onClick={switchShowTranslation}>{t(`${btnText}`)}</span>
                </div>
              </div>
            )
          }
        </div>
      ) : (
        <>
          <BaseMessage
            id={textMessage.id}
            direction={bySelf ? 'rtl' : 'ltr'}
            time={time}
            message={textMessage}
            nickName={nickName}
            bubbleType={type}
            className={bubbleClassName}
            onReplyMessage={handleReplyMsg}
            onDeleteMessage={handleDeleteMsg}
            onPinMessage={handlePinMessage}
            repliedMessage={repliedMsg}
            reactionData={reactions}
            onAddReactionEmoji={handleClickEmoji}
            onDeleteReactionEmoji={handleDeleteEmoji}
            onShowReactionUserList={handleShowReactionUserList}
            onRecallMessage={handleRecallMessage}
            onTranslateMessage={handleTranslateMessage}
            onModifyMessage={handleModifyMessage}
            onSelectMessage={handleSelectMessage}
            onResendMessage={handleResendMessage}
            select={select}
            onMessageCheckChange={handleMsgCheckChange}
            renderUserProfile={renderUserProfile}
            onCreateThread={handleCreateThread}
            thread={_thread}
            chatThreadOverview={textMessage.chatThreadOverview}
            onClickThreadTitle={handleClickThreadTitle}
            {...others}
          >
            <div>
              <span className={classString} style={{ ...style }}>
                {renderTxt(msg, true)}
              </span>
              {!!(urlData?.title || urlData?.description) && (
                <UrlMessage {...urlData} isLoading={isFetching}></UrlMessage>
              )}
              {showEditedTag && textMessage?.modifiedInfo ? (
                <div className={`${classString}-edit-tag`}>{t('edited')}</div>
              ) : (
                ''
              )}
              {
                // @ts-ignore
                (textMessage.translations || transStatus == 'translating') && showTranslation && (
                  <div className={translationClass}>
                    <div className={`${transPrefix}-line`}></div>
                    <span className={`${transPrefix}-text`}>
                      {
                        // @ts-ignore
                        renderTxt(textMessage.translations?.[0]?.text, true)
                      }
                    </span>
                    <div className={`${transPrefix}-action`}>
                      <Icon type="TRANSLATION" width={16} height={16}></Icon>
                      <span>{t(`${transStatus}`)}</span>
                      <span onClick={switchShowTranslation}>{t(`${btnText}`)}</span>
                    </div>
                  </div>
                )
              }
            </div>
          </BaseMessage>
          {
            <Modal
              title={t('modifyTitle')}
              okText={t('confirmBtn')}
              cancelText={t('cancelBtn')}
              wrapClassName="modify-message-modal"
              onCancel={cancelModifyMessage}
              onOk={confirmModifyMessage}
              open={modifyMessageVisible}
            >
              <Textarea
                className={modifyPrefix}
                ref={textareaRef}
                enableEnterSend={false}
                enabledMention={false}
              />
            </Modal>
          }
        </>
      )}
    </>
  );
};

export default memo(observer(TextMessage));
