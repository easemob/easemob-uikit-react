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
//计算好准确的高度和宽度
const textSize = (fontSize: number, text: string) => {
  const container = document.getElementById('listContainer');
  let span = document.createElement('span');
  let result: any = {};
  result.width = span.offsetWidth;
  result.height = span.offsetHeight;
  span.style.visibility = 'hidden';
  //@ts-ignore
  span.style.fontSize = fontSize;
  span.style.lineHeight = '24px'; //最好设置行高 方便项目中计算
  span.style.width = 'calc(100% - 48px - 32px - 20px - 32px)';
  span.style.wordBreak = 'break-all';
  span.style.fontFamily =
    '-apple-system, "PingFang SC", "Helvetica Neue", Helvetica,\n' + 'STHeiTi, sans-serif'; //字体 可以替换为项目中自己的字体
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

  let messageData = messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId] || [];

  // messageData = useMemo(() => {
  // 	return (
  // 		messageStore.message[currentCVS.chatType]?.[
  // 			currentCVS.conversationId
  // 		] || []
  // 	);
  // }, [
  // 	messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId],
  // ]);
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
  const listRef = React.useRef();
  useEffect(() => {
    // @ts-ignore
    listRef?.current?.scrollToItem(10000);
  }, [msgCount]);

  const getItemSize = (index: number) => {
    let size = 74;
    switch (messageData[index]?.type) {
      case 'txt':
        let r = textSize(16, (messageData[index] as AgoraChat.TextMsgBody).msg);
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

  return (
    <div className={classString} ref={msgContainerRef} id="listContainer">
      <List
        onItemRendered={index => {
          return index > 5;
        }}
        loadMoreItems={(a, b) => {
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

MessageList = memo(observer(MessageList));
export { MessageList };
