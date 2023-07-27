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
import Icon from '../../../component/icon';
import { RootContext } from '../../store/rootContext';
import SuggestList from '../suggestList';
import { getRangeRect, showAt, getAtUser, replaceAtUser } from '../suggestList/utils';
import './style/style.scss';

export interface TextareaProps {
  prefix?: string;
  className?: string;
  placeholder?: string;
  hasSendButton?: boolean;
  sendButtonActiveColor?: string;
  enabledMenton?: boolean;
}

let Textarea = forwardRef<any, TextareaProps>((props, ref) => {
  const {
    placeholder = 'Say something',
    hasSendButton,
    sendButtonActiveColor = '#009EFF',
    enabledMenton = true,
  } = props;
  const [isEmpty, setIsEmpty] = useState(false);
  const [textValue, setTextValue] = useState('');
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('textarea', customizePrefixCls);
  const { client, messageStore, conversationStore } = useContext(RootContext).rootStore;
  const { currentCVS } = messageStore;
  const divRef = useRef<HTMLDivElement>(null);
  const [queryString, setQueryString] = useState('');
  const [showAtDialog, setShowDialog] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

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
  const handlePickUser = useCallback((user: any) => {
    replaceAtUser(user);
    setShowDialog(false);
    const str = convertToMessage(divRef?.current?.innerHTML || '').trim();
    setTextValue(str);
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
      [`${prefixCls}-empty`]: isEmpty,
      [`${prefixCls}-hasBtn`]: !!hasSendButton,
    },
    className,
  );

  const handleInputChange: React.FormEventHandler<HTMLDivElement> = e => {
    const value = (e.target as HTMLDivElement).innerHTML;
    if (value.length) {
      setIsEmpty(false);
    } else {
      setIsEmpty(true);
    }
    const str = convertToMessage(value).trim();
    setTextValue(str);
  };

  const sendMessage = () => {
    if (!textValue) {
      console.warn('No text message');
      return;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }
    const message = AC.message.create({
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      type: 'txt',
      msg: textValue,
    });
    messageStore.sendMessage(message);
    divRef.current!.innerHTML = '';
    setTextValue('');
    setIsEmpty(true);
  };

  // Send Button
  const btnNode = hasSendButton ? (
    <div className={`${prefixCls}-sendBtn`}>
      <Icon
        type="AIR_PLANE"
        width={20}
        height={20}
        color={isEmpty ? '#464E53' : sendButtonActiveColor}
        onClick={sendMessage}
      ></Icon>
    </div>
  ) : null;

  // 键盘回车事件
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const setTextareaValue = (value: string) => {
    setTextValue(value);
    if (value.length > 0) {
      setIsEmpty(false);
    } else {
      setIsEmpty(true);
    }
  };

  useImperativeHandle(ref, () => ({
    setTextareaValue,
    divRef,
  }));

  useEffect(() => {
    setIsEmpty(true);
  }, []);

  return (
    <div className={classString}>
      <div
        data-before={placeholder}
        ref={divRef}
        className={`${prefixCls}-input`}
        contentEditable="true"
        onInput={handleInputChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
      ></div>
      {/* Mention suggest list */}
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
