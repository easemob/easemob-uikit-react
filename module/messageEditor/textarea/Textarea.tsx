import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import AC, { AgoraChat } from 'agora-chat';
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

export interface TextareaProps {
  prefix?: string;
  className?: string;
  placeholder?: string;
  hasSendButton?: boolean;
  sendButtonActiveColor?: string;
  enableEnterSend?: boolean;
  enabledMenton?: boolean;
  enabledTyping?: boolean;
  isChatThread?: boolean;
  onSendMessage?: (message: AgoraChat.TextMessage) => void;
  conversation?: CurrentConversation;
  onBeforeSendMessage?: (message: AgoraChat.MessageBody) => Promise<CurrentConversation | void>;
}

export interface ForwardRefProps {
  setTextareaValue: (value: string) => void;
  divRef: React.RefObject<HTMLDivElement>;
}

let Textarea = forwardRef<ForwardRefProps, TextareaProps>((props, ref) => {
  const {
    placeholder = 'Say something',
    hasSendButton,
    sendButtonActiveColor = '#009EFF',
    enableEnterSend = true,
    enabledMenton = true,
    isChatThread = false,
    onSendMessage,
    conversation,
    onBeforeSendMessage,
    enabledTyping = true,
  } = props;
  const [textValue, setTextValue] = useState('');
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('textarea', customizePrefixCls);
  const { client, messageStore, conversationStore } = useContext(RootContext).rootStore;
  let { currentCVS } = messageStore;
  const divRef = useRef<HTMLDivElement>(null);
  const [queryString, setQueryString] = useState('');
  const [showAtDialog, setShowDialog] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // if (conversation && conversation.conversationId) {
  //   currentCVS = conversation;
  // }
  console.log('conversation -------1', conversation);
  useEffect(() => {
    console.log('conversation -------2', conversation);
    if (conversation) {
      currentCVS = conversation;
    }
  }, [conversation?.conversationId]);

  const canAtUser = enabledMenton && currentCVS.chatType === 'groupChat';

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
    },
    className,
  );

  const [isTyping, setIsTyping] = useState(false);
  const handleInputChange: React.FormEventHandler<HTMLDivElement> = e => {
    const value = (e.target as HTMLDivElement).innerHTML;
    const str = convertToMessage(value).trim();
    setTextValue(str);

    if (currentCVS.chatType == 'singleChat' && !isTyping && enabledTyping) {
      setIsTyping(true);
      messageStore.sendTypingCmd(currentCVS);
      setTimeout(() => {
        setIsTyping(false);
      }, 10000);
    }
  };

  const _sendMessage = (message: AgoraChat.MessageBody) => {
    messageStore.sendMessage(message).then(() => {
      onSendMessage && onSendMessage(message);
    });
    divRef.current!.innerHTML = '';

    setTextValue('');
  };

  const sendMessage = () => {
    if (!textValue) {
      console.warn('No text message');
      return;
    }
    console.log('sendMessage', currentCVS.conversationId);
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }
    let isAtAll = false;
    let atNodeList = divRef.current?.querySelectorAll('.at-button') || [];
    let atUserIds = Array.from(atNodeList).map(item => {
      if (item instanceof HTMLElement) {
        return item?.dataset.user;
      }
    });
    if (atUserIds.includes(AT_ALL)) isAtAll = true;

    const message = AC.message.create({
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      type: 'txt',
      msg: textValue,
      isChatThread,
      ext: {
        em_at_list: isAtAll ? AT_ALL : atUserIds,
      },
    });
    if (onBeforeSendMessage) {
      onBeforeSendMessage(message).then(cvs => {
        if (cvs) {
          message.to = cvs.conversationId;
          message.chatType = cvs.chatType;
        }

        console.log('发送的消息', message);
        _sendMessage(message);
      });
    } else {
      _sendMessage(message);
    }
  };

  // Send Button
  const btnNode = hasSendButton ? (
    <div className={`${prefixCls}-sendBtn`}>
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
    <div className={classString}>
      <div
        placeholder={placeholder}
        ref={divRef}
        className={`${prefixCls}-input`}
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

export { Textarea };
