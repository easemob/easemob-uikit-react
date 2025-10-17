import React, {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useContext,
  useImperativeHandle,
} from 'react';
import classNames from 'classnames';
import Emoji from './emoji';
import Recorder from './recorder';
import type { RecorderRef } from './recorder/Recorder';
import Textarea from './textarea';
import './style/style.scss';
import { emoji } from './emoji/emojiConfig';
import MoreAction, { MoreActionProps } from './moreAction';
import rootStore from '../store/index';
import SelectedControls from './selectedControls';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import { ChatSDK } from '../SDK';
import { CurrentConversation } from '../store/ConversationStore';
import { GiftKeyboard, GiftKeyboardProps } from './gift/GiftKeyboard';
import { RootContext } from '../store/rootContext';
import Icon from '../../component/icon';
import { useTranslation } from 'react-i18next';
export type Actions = {
  name: string;
  visible: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}[];

export interface MessageInputProps {
  prefix?: string;
  actions?: Actions;
  customActions?: MoreActionProps['customActions'];
  enabledTyping?: boolean; // 是否启用正在输入
  onSend?: (message: any) => void; // 消息发送的回调
  className?: string; // wrap 的 class
  style?: React.CSSProperties; // wrap 的 style
  showSendButton?: boolean; // 是否展示发送按钮
  sendButtonIcon?: ReactNode; // 发送按钮的 icon
  row?: number; //input 行数
  placeHolder?: string; // input placeHolder
  disabled?: boolean; // 是否禁用
  isChatThread?: boolean; // 是否是子区聊天
  enabledMention?: boolean; // 是否开启@功能
  onSendMessage?: (message: ChatSDK.MessageBody) => void;
  conversation?: CurrentConversation;
  // 加一个发送消息前的回调，这个回调返回promise，如果返回的promise resolve了，就发送消息，如果reject了，就不发送消息
  onBeforeSendMessage?: (message: ChatSDK.MessageBody) => Promise<CurrentConversation | void>;
  giftKeyboardProps?: GiftKeyboardProps;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  // 通话中禁用录音
  disableRecorder?: boolean;
  disableRecorderTitle?: string; // 已国际化后的提示文案
}

function converToMessage(e: string) {
  const t = (function () {
    let t: Array<ReactNode> = [],
      r = document.createElement('div');
    r.innerHTML = e.replace(/\\/g, '###h###');
    const n = r.querySelectorAll('img');
    const a = r.querySelectorAll('div');
    let i = n.length;
    let o = a.length;
    for (; i--; ) {
      const s = document.createTextNode(n[i].getAttribute('data-key') as string);
      n[i].parentNode?.insertBefore(s, n[i]);
      n[i].parentNode?.removeChild(n[i]);
    }
    for (; o--; ) t.push(a[o].innerHTML), a[o].parentNode?.removeChild(a[o]);
    const c = (t = t.reverse()).length ? '\n' + t.join('\n') : t.join('\n');
    return (r.innerText + c)
      .replace(/###h###/g, '&#92;')
      .replace(/<br>/g, '\n')
      .replace(/&amp;/g, '&');
  })();
  new RegExp('(^[\\s\\n\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\n\\s\\t]+$)', 'g');
  return t.replace(/&nbsp;/g, ' ').trim();
}

const defaultActions: Actions = [
  {
    name: 'RECORDER',
    visible: true,
    icon: '',
  },
  {
    name: 'TEXTAREA',
    visible: true,
    icon: '',
  },
  {
    name: 'EMOJI',
    visible: true,
    icon: '',
  },
  {
    name: 'MORE',
    visible: true,
    icon: '',
  },
];

export interface MessageInputRef {
  stopRecording: () => void;
}

const MessageInput = React.forwardRef<MessageInputRef, MessageInputProps>((props, ref) => {
  const recorderRef = useRef<RecorderRef | null>(null);
  useImperativeHandle(ref, () => ({
    stopRecording: () => {
      recorderRef.current?.stopRecording();
    },
  }));
  const [isShowTextarea, setTextareaShow] = useState(true);
  const [isShowRecorder, setShowRecorder] = useState(true);
  const [isShowSelect, setIsShowSelect] = useState(false);
  const [editorNode, setEditorNode] = useState<null | React.ReactFragment>(null);
  const textareaRef = useRef(null);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const componentsShape = theme?.componentsShape || 'round';
  const { t } = useTranslation();
  const insertCustomHtml = (t: string, e: keyof typeof emoji.map) => {
    if (!textareaRef.current) return;
    // @ts-ignore
    const i = textareaRef.current.divRef.current as any;

    // 创建表情图片元素
    const createEmojiImage = () => {
      const img = new Image();
      img.src = t;
      img.setAttribute('data-key', e);
      img.setAttribute('width', '16px');
      img.setAttribute('height', '16px');
      img.draggable = false;
      img.className = 'message-text-emoji';
      img.setAttribute('title', e.replace('[', '').replace(']', ''));
      img.setAttribute('style', 'vertical-align: middle');
      return img;
    };

    let inserted = false;

    // 首先尝试使用 Selection API
    if ('getSelection' in window) {
      const s = window.getSelection();
      if (s && s.rangeCount > 0) {
        try {
          i.focus();
          const n = s.getRangeAt(0);
          const a = createEmojiImage();
          n.deleteContents();
          n.insertNode(a);
          n.collapse(false);
          s.removeAllRanges();
          s.addRange(n);
          inserted = true;
        } catch (error) {
          console.warn('Selection API failed, using fallback method:', error);
        }
      }
    }

    // 如果 Selection API 失败，使用备用方案
    if (!inserted) {
      try {
        i.focus();
        const a = createEmojiImage();
        // 如果没有选区，就插入到末尾
        i.appendChild(a);

        // 设置光标到表情后面
        if ('getSelection' in window) {
          const range = document.createRange();
          range.setStartAfter(a);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        inserted = true;
      } catch (error) {
        console.warn('Fallback method failed:', error);
      }
    }

    // 如果还是失败，使用最后的备用方案（直接操作 innerHTML）
    if (!inserted) {
      try {
        // @ts-ignore
        if ('selection' in document) {
          i.focus();
          // @ts-ignore
          const n = document.selection.createRange();
          n.pasteHTML(
            '<img class="emoj-insert" crossOrigin="anonymous" draggable="false" data-key="' +
              e +
              '" title="' +
              e.replace('[', '').replace(']', '') +
              '" src="' +
              t +
              '">',
          );
          i.focus();
        }
      } catch (error) {
        console.warn('IE fallback method failed:', error);
      }
    }

    // 更新文本值
    const str = converToMessage(i.innerHTML).trim();
    // @ts-ignore
    textareaRef.current.setTextareaValue(str);
  };

  const handleClickEmojiIcon = () => {
    if (!textareaRef.current) return;
    // @ts-ignore
    const el = textareaRef.current.divRef.current as any;

    // 首先确保元素获得焦点
    el.focus();

    try {
      // 尝试设置光标到末尾
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch (error) {
      // 如果设置光标失败，至少确保元素有焦点
      console.warn('Failed to set cursor position:', error);
      // 在移动端，有时候需要稍微延迟一下
      setTimeout(() => {
        el.focus();
      }, 10);
    }
  };
  const handleSelectEmoji = (emojiString: keyof typeof emoji.map) => {
    if (!emojiString) return;

    // 确保输入框获得焦点，特别是在移动端
    if (textareaRef.current) {
      // @ts-ignore
      const inputElement = textareaRef.current.divRef.current as HTMLElement;
      if (inputElement) {
        inputElement.focus();
        // 在移动端，可能需要稍微延迟一下以确保焦点生效
        setTimeout(() => {
          const src = new URL(`/module/assets/reactions/${emoji.map[emojiString]}`, import.meta.url)
            .href;
          insertCustomHtml(src, emojiString);
        }, 10);
      }
    }

    // 更新文本值
    // @ts-ignore
    textareaRef.current.setTextareaValue(value => {
      return value + emojiString;
    });

    setInputHaveValue(true);
  };
  const {
    actions = defaultActions,
    placeHolder,
    disabled,
    className,
    prefix,
    isChatThread,
    onSendMessage,
    conversation,
    onBeforeSendMessage,
    enabledTyping,
    customActions,
    style = {},
    giftKeyboardProps,
    onChange,
    onFocus,
    disableRecorder,
    disableRecorderTitle,
  } = props;

  useEffect(() => {
    const result = actions?.find(item => {
      return item.name === 'RECORDER';
    });
    if (result) {
      setShowRecorder(true);
    } else {
      setShowRecorder(false);
    }
  }, []);
  const currentCvs = conversation ? conversation : rootStore.conversationStore.currentCvs || {};
  useEffect(() => {
    if (!textareaRef.current) return;
    // @ts-ignore
    textareaRef.current.divRef.current.innerHTML = '';
    // @ts-ignore
    textareaRef.current.setTextareaValue('');
  }, [currentCvs.conversationId]);

  useEffect(() => {
    if (
      rootStore.messageStore.selectedMessage[currentCvs.chatType as 'singleChat' | 'groupChat']?.[
        currentCvs.conversationId
      ]?.selectable
    ) {
      setIsShowSelect(true);
      setTextareaShow(false);
      setShowRecorder(false);
    } else {
      setIsShowSelect(false);
      setTextareaShow(true);
      const result = actions?.find(item => {
        return item.name === 'RECORDER';
      });
      if (result) {
        setShowRecorder(true);
      }
    }
  }, [
    rootStore.messageStore.selectedMessage[currentCvs.chatType as 'singleChat' | 'groupChat']?.[
      currentCvs.conversationId
    ]?.selectable,
  ]);
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-editor', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-disabled`]: disabled,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const handleSendCombineMessage = (message: any) => {
    onSendMessage && onSendMessage(message);
  };

  const [inputHaveValue, setInputHaveValue] = useState(false);
  const showSendBtn =
    actions?.find(item => {
      return item.name === 'TEXTAREA';
    }) &&
    isShowTextarea &&
    inputHaveValue;

  return (
    <div className={classString} style={{ ...style }}>
      {isShowRecorder && !inputHaveValue && (
        <Recorder
          ref={recorderRef}
          isChatThread={isChatThread}
          onBeforeSendMessage={onBeforeSendMessage}
          conversation={conversation}
          onShow={() => setTextareaShow(false)}
          onHide={() => setTextareaShow(true)}
          onSend={() => setTextareaShow(true)}
          disabled={Boolean(disableRecorder)}
          disabledTitle={disableRecorderTitle}
        ></Recorder>
      )}

      {isShowTextarea && (
        <>
          {actions.map((item, index) => {
            if (item.name === 'RECORDER' && item.visible) {
              // setShowRecorder(true);
              return null;
            }
            if (item.name === 'TEXTAREA' && item.visible) {
              return (
                <Textarea
                  enabledTyping={enabledTyping}
                  isChatThread={isChatThread}
                  key={item.name}
                  ref={textareaRef}
                  hasSendButton={false}
                  placeholder={placeHolder}
                  onSendMessage={onSendMessage}
                  onChange={value => {
                    if (value.length > 0) {
                      setInputHaveValue(true);
                    } else {
                      setInputHaveValue(false);
                    }
                    onChange?.(value);
                  }}
                  onFocus={onFocus}
                  conversation={conversation}
                  enabledMention={props.enabledMention}
                  onBeforeSendMessage={onBeforeSendMessage}
                ></Textarea>
              );
            } else if (item.name === 'EMOJI' && item.visible) {
              return (
                <Emoji
                  key={item.name}
                  // @ts-ignore
                  onSelected={handleSelectEmoji}
                  onClick={handleClickEmojiIcon}
                  placement="topLeft"
                ></Emoji>
              );
            } else if (item.name === 'MORE' && item.visible) {
              return inputHaveValue ? null : (
                <MoreAction
                  key={item.name}
                  isChatThread={isChatThread}
                  onBeforeSendMessage={onBeforeSendMessage}
                  customActions={customActions}
                ></MoreAction>
              );
            } else if (item.name === 'GIFT' && item.visible) {
              return inputHaveValue ? null : (
                <GiftKeyboard key={item.name} conversation={conversation} {...giftKeyboardProps} />
              );
            } else if (item.visible) {
              return (
                <span
                  key={item.name}
                  className="icon-container"
                  onClick={() => {
                    item?.onClick?.();
                  }}
                >
                  {item.icon}
                </span>
              );
            }
          })}
        </>
      )}
      {showSendBtn && (
        <div
          className={classNames(`${prefixCls}-sendBtn`, {
            [`${prefixCls}-sendBtn-round`]: componentsShape == 'round',
          })}
          title={t('send') as string}
        >
          <Icon
            type="AIR_PLANE"
            width={24}
            height={24}
            color={'#F9FAFA'}
            onClick={() => {
              // @ts-ignore
              textareaRef.current?.sendMessage();
            }}
          ></Icon>
        </div>
      )}
      {isShowSelect && (
        <SelectedControls
          onSendMessage={handleSendCombineMessage}
          conversation={conversation}
          onHide={() => {
            setTextareaShow(true);
            setIsShowSelect(false);
          }}
        ></SelectedControls>
      )}
    </div>
  );
});
(MessageInput as any).defaultActions = defaultActions;
MessageInput.displayName = 'MessageInput';
export default observer(MessageInput);
