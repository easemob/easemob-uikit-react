import React, { ReactNode, useState, useRef } from 'react';
import classNames from 'classnames';
import Emoji from './emoji';
import Recorder from './recorder';
import Textarea from './textarea';
import './style/style.scss';
import { emoji } from './emoji/emojiConfig';
import MoreAction from './moreAction';
export interface MessageEditorProps {
  actions?: {
    name: string;
    visible: boolean;
    icon: ReactNode;
    onClick: (name: string) => void;
  }[];
  onSend?: (message: any) => void; // 消息发送的回调
  className?: string; // wrap 的 class
  showSendButton?: boolean; // 是否展示发送按钮
  sendButtonIcon?: ReactNode; // 发送按钮的 icon
  row?: number; //input 行数
  placeHolder?: string; // input placeHolder
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

const MessageEditor = (props: MessageEditorProps) => {
  const [isShowTextarea, setTextareaShow] = useState(true);

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
          n.deleteContents(),
          n.insertNode(a),
          n.collapse(false),
          s.removeAllRanges(),
          s.addRange(n);
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
    textareaRef.current.setTextValue(str);
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
    textareaRef.current.setTextValue(value => value + emojiString);

    const src = new URL(`/module/assets/reactions/${emoji.map[emojiString]}`, import.meta.url).href;
    insertCustomHtml(src, emojiString);

    // setInputHaveValue(false);
  };

  return (
    <div className="editor-container">
      <Recorder
        onShow={() => setTextareaShow(false)}
        onHide={() => setTextareaShow(true)}
        onSend={() => setTextareaShow(true)}
      ></Recorder>
      {isShowTextarea ? (
        <>
          <Textarea ref={textareaRef} hasSendButton placeholder="Say something"></Textarea>{' '}
          <Emoji onSelected={handleSelectEmoji} onClick={handleClickEmojiIcon}></Emoji>
          <MoreAction></MoreAction>
        </>
      ) : null}
    </div>
  );
};

export { MessageEditor };
