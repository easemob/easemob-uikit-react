import React, {
  FC,
  useEffect,
  useState,
  useRef,
  useContext,
  memo,
  useMemo,
  ReactNode,
} from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useSize } from 'ahooks';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import List from '../../src/list';

import TextMessage from '../textMessage';
import AudioMessage from '../audioMessage';
import FileMessage from '../fileMessage';
import ImageMessage, { ImagePreview } from '../imageMessage';
import VideoMessage from '../videoMessage';
import { RootContext } from '../store/rootContext';
import AC, { AgoraChat } from 'agora-chat';
import { cloneElement } from '../../src/_utils/reactNode';
import { areEqual } from 'react-window';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
//计算好准确的高度和宽度
const textSize = (fontSize: number, text: string, hasStatus: boolean) => {
  const container = document.getElementById('listContainer');
  let span = document.createElement('span');
  let result: any = {};
  result.width = span.offsetWidth;
  result.height = span.offsetHeight;
  span.style.visibility = 'hidden';
  //@ts-ignore
  span.style.fontSize = fontSize;
  span.style.lineHeight = '24px'; //最好设置行高 方便项目中计算
  span.style.width = hasStatus
    ? 'calc(100% - 48px - 32px - 20px - 32px - 26px - 15px)'
    : 'calc(100% - 48px - 32px - 20px - 32px - 6px - 15px)';
  span.style.wordBreak = 'break-all';
  span.style.fontFamily = 'Roboto'; //字体 可以替换为项目中自己的字体
  span.style.display = 'inline-block';
  container!.appendChild(span);
  if (typeof span.textContent !== 'undefined') {
    span.textContent = text;
  } else {
    span.innerText = text;
  }
  result.width = parseFloat(window.getComputedStyle(span).width) - result.width;
  result.height = parseFloat(window.getComputedStyle(span).height) - result.height;
  span.parentNode?.removeChild(span); //删除节点
  return result;
};

export interface MsgListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  renderMessage?: (message: AgoraChat.MessageBody) => JSX.Element;
}

let MessageList: FC<MsgListProps> = props => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore } = rootStore;

  const { prefix: customizePrefixCls, className, renderMessage } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('messageList', customizePrefixCls);
  const classString = classNames(prefixCls, className);

  const msgContainerRef = useRef<HTMLDivElement>(null);

  const size = useSize(msgContainerRef);

  const [msgListHeight, setMsgListHeight] = useState(msgContainerRef?.current?.clientHeight || 0);

  useEffect(() => {
    setMsgListHeight(msgContainerRef.current!.clientHeight);
  }, [size]);

  // const messageData = messageStore.currentCvsMsgs;
  const currentCVS = messageStore.currentCVS || {};
  console;
  const { historyMsgs, loadMore } = useHistoryMessages(currentCVS);
  const userId = rootStore.client.context.userId;
  useEffect(() => {
    console.log('渲染历史消息');
    let msg = historyMsgs[0] || {};
    const cvsId = msg.chatType == 'groupChat' ? msg.to : msg.from == userId ? msg.to : msg.from;

    const currentMsgs = messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId];
    if (
      !currentCVS.chatType ||
      (currentMsgs?.length >= 0 && (currentMsgs?.[0] as any)?.time <= msg.time) ||
      cvsId != currentCVS.conversationId
    ) {
      // length >= 0 没拉取过的是 undefined， length == 0 是清空过的， length > 0 是拉取过了
      console.log('不符合条件', currentCVS.chatType, currentCVS.conversationId, historyMsgs, cvsId);
      return;
    }

    console.log('添加历史消息', historyMsgs);
    rootStore.messageStore.addHistoryMsgs(rootStore.conversationStore.currentCvs, historyMsgs);

    setTimeout(() => {
      refreshVirtualTable();
    }, 10);
  }, [currentCVS.conversationId, historyMsgs]);

  let messageData = messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId] || [];

  const [imageInfo, setImageInfo] = useState<{
    visible: boolean;
    url: string;
  }>({ visible: false, url: '' });

  const renderMsg = (data: { index: number; style: React.CSSProperties }) => {
    if (renderMessage) {
      const element = renderMessage(messageData[data.index]);
      cloneElement(element, oriProps => ({
        style: {
          ...data.style,
          ...oriProps.style,
        },
      }));
      return element;
    }
    if (messageData[data.index].type == 'audio') {
      return (
        <AudioMessage
          //@ts-ignore
          audioMessage={messageData[data.index] as AgoraChat.AudioMsgBody}
          style={data.style}
        ></AudioMessage>
      );
    } else if (messageData[data.index].type == 'img') {
      return (
        <ImageMessage
          onClickImage={url => {
            setImageInfo({
              visible: true,
              url: url,
            });
          }}
          //@ts-ignore
          imageMessage={messageData[data.index]}
          style={data.style}
        ></ImageMessage>
      );
    } else if (messageData[data.index].type == 'file') {
      return (
        <FileMessage
          //@ts-ignore
          fileMessage={messageData[data.index]}
          style={data.style}
        ></FileMessage>
      );
    } else {
      return (
        <TextMessage
          style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          textMessage={messageData[data.index]}
        >
          {(messageData[data.index] as AgoraChat.TextMsgBody).msg}
        </TextMessage>
      );
    }
  };

  const msgCount = messageData.length;

  // 每次发消息滚动到最新的一条
  const listRef = React.useRef<List>(null);
  useEffect(() => {
    if (msgCount > 50) {
      return;
    }
    // @ts-ignore
    setTimeout(() => {
      (listRef?.current as any)?.scrollToItem(msgCount, 'end');
    }, 10);
  }, [msgCount]);

  const getItemSize = (index: number) => {
    let size = 74;
    switch (messageData[index]?.type) {
      case 'txt':
        const hasStatus = !!(messageData[index] as any)?.status;
        let r = textSize(16, (messageData[index] as AgoraChat.TextMsgBody).msg, hasStatus);
        size = 74 - 24 + r.height;
        break;
      case 'img':
        size = 107;
        break;
      case 'file':
        size = 90;
        break;
      case 'audio':
        size = 90;
        break;
    }
    return size;
  };

  useEffect(() => {
    currentCVS && refreshVirtualTable();
    (listRef?.current as any)?.scrollToItem(msgCount, 'end');
  }, [currentCVS]);

  const refreshVirtualTable = () => {
    if (listRef?.current) {
      (listRef.current as any)?.resetAfterIndex(0);
    }
  };

  return (
    <div className={classString} ref={msgContainerRef} id="listContainer">
      <List
        isItemLoaded={index => {
          return index > 5;
        }}
        loadMoreItems={(a, b) => {
          loadMore();

          console.log('加载更多', a, b);
        }}
        ref={listRef}
        height={msgListHeight}
        itemCount={msgCount}
        itemSize={getItemSize}
        itemData={messageData}
      >
        {data => renderMsg(data)}
      </List>
      <ImagePreview
        onCancel={() => {
          setImageInfo({ visible: false, url: '' });
        }}
        visible={imageInfo.visible}
        previewImageUrl={imageInfo.url}
      ></ImagePreview>
    </div>
  );
};

MessageList = memo(observer(MessageList), areEqual);
export { MessageList };
