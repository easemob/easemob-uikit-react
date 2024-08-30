import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { chatSDK, ChatSDK } from '../../SDK';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
import { convertToMessage } from './util';
import { renderHtml, formatHtmlString } from '../../utils';
import Icon from '../../../component/icon';
import { RootContext } from '../../store/rootContext';
import SuggestList from '../suggestList';
import { AT_ALL } from '../suggestList/SuggestList';
import { getRangeRect, showAt, getAtUser, replaceAtUser } from '../suggestList/utils';
import './style/style.scss';
import { MemberItem } from '../../store/AddressStore';
import { CurrentConversation } from '../../store/ConversationStore';
import { useTranslation } from 'react-i18next';
export interface TextareaProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  hasSendButton?: boolean;
  sendButtonActiveColor?: string;
  enableEnterSend?: boolean;
  enabledMention?: boolean;
  enabledTyping?: boolean;
  isChatThread?: boolean;
  onSendMessage?: (message: ChatSDK.TextMsgBody) => void;
  conversation?: CurrentConversation;
  onBeforeSendMessage?: (message: ChatSDK.MessageBody) => Promise<CurrentConversation | void>;
  onChange?: (value: string) => void;
}

export interface ForwardRefProps {
  setTextareaValue: (value: string) => void;
  divRef: React.RefObject<HTMLDivElement>;
}

const Textarea = forwardRef<ForwardRefProps, TextareaProps>((props, ref) => {
  const {
    placeholder,
    hasSendButton,
    sendButtonActiveColor = 'var(--cui-primary-color)',
    enableEnterSend = true,
    enabledMention = true,
    isChatThread = false,
    onSendMessage,
    conversation,
    onBeforeSendMessage,
    enabledTyping = true,
    style = {},
    onChange,
  } = props;
  const { t } = useTranslation();
  const [textValue, setTextValue] = useState('');
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('textarea', customizePrefixCls);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;

  const themeMode = theme?.mode || 'light';
  const componentsShape = theme?.componentsShape || 'round';
  const { client, messageStore, conversationStore, addressStore } = rootStore;
  const { currentCVS } = messageStore;
  const divRef = useRef<HTMLDivElement>(null);
  const [queryString, setQueryString] = useState('');
  const [showAtDialog, setShowDialog] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [usedCvs, setUsedCvs] = useState<CurrentConversation>(currentCVS);
  // if (conversation && conversation.conversationId) {
  //   currentCVS = conversation;
  // }
  useEffect(() => {
    if (currentCVS?.conversationId) {
      setUsedCvs(currentCVS);
    }
    if (conversation?.conversationId) {
      setUsedCvs(conversation);
    }
  }, [conversation?.conversationId, currentCVS]);

  const canAtUser = enabledMention && usedCvs.chatType === 'groupChat';

  const handleKeyUp = useCallback(() => {
    if (!canAtUser) return;
    if (showAt()) {
      const position = getRangeRect();
      setPosition(position);
      const user = getAtUser();
      setQueryString(user || '');
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [canAtUser]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (canAtUser && showAtDialog) {
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
      }
    } else {
      onKeyDown(e);
    }
  };
  const handlePickUser = useCallback((user: MemberItem) => {
    replaceAtUser(user);
    const str = convertToMessage(divRef?.current?.innerHTML || '').trim();
    setTextValue(str);
    setShowDialog(false);
  }, []);

  const handleHide = () => {
    setShowDialog(false);
  };

  const handleShow = () => {
    setShowDialog(true);
  };

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-hasBtn`]: !!hasSendButton,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [isTyping, setIsTyping] = useState(false);
  const handleInputChange: React.FormEventHandler<HTMLDivElement> = e => {
    const value = (e.target as HTMLDivElement).innerHTML;
    const str = convertToMessage(value, false).trim();
    setTextValue(str);
    onChange?.(str);
    if (usedCvs.chatType == 'singleChat' && !isTyping && enabledTyping) {
      setIsTyping(true);
      messageStore.sendTypingCmd(usedCvs);
      setTimeout(() => {
        setIsTyping(false);
      }, 5000);
    }
  };

  const _sendMessage = (message: ChatSDK.TextMsgBody) => {
    messageStore.sendMessage(message).then(() => {
      onSendMessage && onSendMessage(message);
    });
    divRef.current!.innerHTML = '';

    setTextValue('');
    onChange?.('');

    if (usedCvs.chatType == 'singleChat' && usedCvs.conversationId.includes('chatbot_')) {
      const visibleOut = rootStore.messageStore.typing[usedCvs.conversationId];
      if (visibleOut) {
        messageStore.setTyping(usedCvs, false);
        setTimeout(() => {
          messageStore.setTyping(usedCvs, true);
        }, 200);
      } else {
        messageStore.setTyping(usedCvs, true);
      }
    }
  };

  const sendMessage = () => {
    if (!textValue) {
      console.warn('No text message');
      return;
    }
    if (!usedCvs.conversationId) {
      console.warn('No specified conversation');
      return;
    }
    let isAtAll = false;
    const atNodeList = divRef.current?.querySelectorAll('.at-button') || [];
    const atUserIds = Array.from(atNodeList).map(item => {
      if (item instanceof HTMLElement) {
        return item?.dataset.user;
      }
    });
    if (atUserIds.includes(AT_ALL)) isAtAll = true;

    const message = chatSDK.message.create({
      to: usedCvs.conversationId,
      chatType: usedCvs.chatType,
      type: 'txt',
      msg: textValue,
      isChatThread,
      ext: {
        em_at_list: isAtAll ? AT_ALL : atUserIds,
      },
    }) as ChatSDK.TextMsgBody;
    if (onBeforeSendMessage) {
      onBeforeSendMessage(message).then(cvs => {
        if (cvs) {
          message.to = cvs.conversationId;
          message.chatType = cvs.chatType;
        }

        _sendMessage(message);
      });
    } else {
      _sendMessage(message);
    }
  };

  // Send Button
  const btnNode = hasSendButton ? (
    <div className={`${prefixCls}-sendBtn`} title={t('send') as string}>
      <Icon
        type="AIR_PLANE"
        width={20}
        height={20}
        color={!textValue?.length ? '#464E53' : sendButtonActiveColor}
        onClick={sendMessage}
      ></Icon>
    </div>
  ) : null;

  // 键盘回车事件
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter' && e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      if (enableEnterSend) {
        sendMessage();
      }
    }
  };

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.execCommand(
      'insertHTML',
      false,
      renderHtml(formatHtmlString(e?.clipboardData.getData('text'))),
    );
  }, []);

  const setTextareaValue = (value: string) => {
    setTextValue(value);
  };

  useImperativeHandle(ref, () => ({
    setTextareaValue,
    sendMessage,
    divRef,
  }));

  useEffect(() => {
    if (enableEnterSend) {
      const clickFun = (e: MouseEvent) => {
        if (!divRef?.current?.contains(e.target as Node)) {
          setShowDialog(false);
        }
      };
      if (enableEnterSend) {
        document.addEventListener('click', clickFun);
      }
      return () => {
        document.removeEventListener('click', clickFun);
      };
    }
  }, [enableEnterSend]);

  return (
    <div className={classString} style={{ ...style }}>
      <div
        placeholder={placeholder || (t('say something') as string)}
        ref={divRef}
        className={classNames(`${prefixCls}-input`, {
          [`${prefixCls}-input-square`]: componentsShape == 'square',
        })}
        contentEditable="true"
        onInput={handleInputChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
      ></div>
      {/* At suggest list */}
      {canAtUser && (
        <SuggestList
          visible={showAtDialog}
          position={position}
          queryString={queryString}
          onPickUser={handlePickUser}
          onHide={handleHide}
          onShow={handleShow}
        />
      )}
      {/* Send button node  */}
      {btnNode}
    </div>
  );
});
Textarea.displayName = 'Textarea';
export { Textarea };
