import React, { ReactNode, useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import Emoji from './emoji';
import Recorder from './recorder';
import Textarea from './textarea';
import './style/style.scss';
import { emoji } from './emoji/emojiConfig';
import MoreAction, { MoreActionProps } from './moreAction';
import rootStore from '../store/index';
import SelectedControls from './selectedControls';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import { AgoraChat } from 'agora-chat';
import { CurrentConversation } from '../store/ConversationStore';
export type Actions = {
  name: string;
  visible: boolean;
  icon?: ReactNode;
}[];

export interface MessageEditorProps {
  prefix?: string;
  actions?: Actions;
  customActions?: MoreActionProps['customActions'];
  enabledTyping?: boolean; // 是否启用正在输入
  onSend?: (message: any) => void; // 消息发送的回调
  className?: string; // wrap 的 class
  showSendButton?: boolean; // 是否展示发送按钮
  sendButtonIcon?: ReactNode; // 发送按钮的 icon
  row?: number; //input 行数
  placeHolder?: string; // input placeHolder
  disabled?: boolean; // 是否禁用
  isChatThread?: boolean; // 是否是子区聊天
  enabledMention?: boolean; // 是否开启@功能
  onSendMessage?: (message: AgoraChat.MessageBody) => void;
  conversation?: CurrentConversation;
  // 加一个发送消息前的回调，这个回调返回promise，如果返回的promise resolve了，就发送消息，如果reject了，就不发送消息
  onBeforeSendMessage?: (message: AgoraChat.MessageBody) => Promise<CurrentConversation | void>;
}

function converToMessage(e: string) {
  var t = (function () {
    var t: Array<ReactNode> = [],
      r = document.createElement('div');
    r.innerHTML = e.replace(/\\/g, '###h###');
    for (
      var n = r.querySelectorAll('img'), a = r.querySelectorAll('div'), i = n.length, o = a.length;
      i--;

    ) {
      var s = document.createTextNode(n[i].getAttribute('data-key') as string);
      n[i].parentNode?.insertBefore(s, n[i]);
      n[i].parentNode?.removeChild(n[i]);
    }
    for (; o--; ) t.push(a[o].innerHTML), a[o].parentNode?.removeChild(a[o]);
    var c = (t = t.reverse()).length ? '\n' + t.join('\n') : t.join('\n');
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

const MessageEditor = (props: MessageEditorProps) => {
  const [isShowTextarea, setTextareaShow] = useState(true);
  const [isShowRecorder, setShowRecorder] = useState(true);
  const [isShowSelect, setIsShowSelect] = useState(false);
  const [editorNode, setEditorNode] = useState<null | React.ReactFragment>(null);
  const textareaRef = useRef(null);

  const insertCustomHtml = (t: string, e: keyof typeof emoji.map) => {
    if (!textareaRef.current) return;
    // @ts-ignore
    var i = textareaRef.current.divRef.current as any;
    const offset = i.innerText.length;
    if ('getSelection' in window) {
      var s = window.getSelection();
      if (s && 1 === s.rangeCount) {
        i.focus();
        var n = s.getRangeAt(0),
          a = new Image();
        (a.src = t),
          a.setAttribute('data-key', e),
          a.setAttribute('width', '16px'),
          a.setAttribute('height', '16px'),
          (a.draggable = !1),
          (a.className = 'message-text-emoji'),
          a.setAttribute('title', e.replace('[', '').replace(']', '')),
          a.setAttribute('style', 'vertical-align: middle');
        n.deleteContents(), n.insertNode(a), n.collapse(false), s.removeAllRanges(), s.addRange(n);
      }
    } else if ('selection' in document) {
      i.focus(),
        // @ts-ignore
        (n = document.selection.createRange()).pasteHTML(
          '<img class="emoj-insert" draggable="false" data-key="' +
            e +
            '" title="' +
            e.replace('[', '').replace(']', '') +
            '" src="' +
            t +
            '">',
        ),
        i.focus();
    }
    const str = converToMessage(i.innerHTML).trim();
    // @ts-ignore
    textareaRef.current.setTextareaValue(str);
  };

  const handleClickEmojiIcon = () => {
    if (!textareaRef.current) return;
    // @ts-ignore
    var el = textareaRef.current.divRef.current as any;
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };
  const handleSelectEmoji = (emojiString: keyof typeof emoji.map) => {
    if (!emojiString) return;

    // @ts-ignore
    textareaRef.current.setTextareaValue(value => value + emojiString);

    const src = new URL(`/module/assets/reactions/${emoji.map[emojiString]}`, import.meta.url).href;
    insertCustomHtml(src, emojiString);

    // setInputHaveValue(false);
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
      rootStore.messageStore.selectedMessage[currentCvs.chatType]?.[currentCvs.conversationId]
        ?.selectable
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
    rootStore.messageStore.selectedMessage[currentCvs.chatType]?.[currentCvs.conversationId]
      ?.selectable,
  ]);
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-editor', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-disabled`]: disabled,
    },
    className,
  );

  const handleSendCombineMessage = (message: any) => {
    onSendMessage && onSendMessage(message);
  };
  return (
    <div className={classString}>
      {isShowRecorder && (
        <Recorder
          isChatThread={isChatThread}
          onBeforeSendMessage={onBeforeSendMessage}
          conversation={conversation}
          onShow={() => setTextareaShow(false)}
          onHide={() => setTextareaShow(true)}
          onSend={() => setTextareaShow(true)}
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
                  hasSendButton
                  placeholder={placeHolder}
                  onSendMessage={onSendMessage}
                  conversation={conversation}
                  enabledMention={props.enabledMention}
                  onBeforeSendMessage={onBeforeSendMessage}
                ></Textarea>
              );
            } else if (item.name === 'EMOJI' && item.visible) {
              return (
                <Emoji
                  key={item.name}
                  onSelected={handleSelectEmoji}
                  onClick={handleClickEmojiIcon}
                ></Emoji>
              );
            } else if (item.name === 'MORE' && item.visible) {
              return (
                <MoreAction
                  key={item.name}
                  isChatThread={isChatThread}
                  onBeforeSendMessage={onBeforeSendMessage}
                  customActions={customActions}
                ></MoreAction>
              );
            } else {
              return (
                <span key={item.name} className="icon-container">
                  {item.icon}
                </span>
              );
            }
          })}
        </>
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
};
MessageEditor.defaultActions = defaultActions;
export default observer(MessageEditor);
