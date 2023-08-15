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
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import List from '../../component/list';
import ScrollList from '../../component/scrollList';
import { useGroupMembers, useGroupAdmins } from '../hooks/useAddress';
import TextMessage from '../textMessage';
import AudioMessage from '../audioMessage';
import FileMessage from '../fileMessage';
import ImageMessage, { ImagePreview } from '../imageMessage';
import VideoMessage from '../videoMessage';
import { RootContext } from '../store/rootContext';
import AC, { AgoraChat } from 'agora-chat';
import { cloneElement } from '../../component/_utils/reactNode';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
import type { RecallMessage } from '../store/MessageStore';
import { RecalledMessage } from '../recalledMessage';
import CombinedMessage from '../combinedMessage';
import { renderUserProfileProps } from '../baseMessage';
export interface MsgListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  renderMessage?: (message: AgoraChat.MessageBody | RecallMessage) => ReactNode;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactElement;
}

const MessageScrollList = ScrollList<AgoraChat.MessageBody | RecallMessage>();

let MessageList: FC<MsgListProps> = props => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore } = rootStore;

  const { prefix: customizePrefixCls, className, renderMessage, renderUserProfile } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('messageList', customizePrefixCls);
  const classString = classNames(prefixCls, className);

  const msgContainerRef = useRef<HTMLDivElement>(null);

  const currentCVS = messageStore.currentCVS || {};

  const { loadMore, isLoading } = useHistoryMessages(currentCVS);

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
          key={messageData[data.index].id}
          //@ts-ignore
          audioMessage={messageData[data.index] as AgoraChat.AudioMsgBody}
          style={data.style}
          renderUserProfile={renderUserProfile}
        ></AudioMessage>
      );
    } else if (messageData[data.index].type == 'img') {
      return (
        <ImageMessage
          key={messageData[data.index].id}
          onClickImage={url => {
            setImageInfo({
              visible: true,
              url: url,
            });
          }}
          //@ts-ignore
          imageMessage={messageData[data.index]}
          style={data.style}
          renderUserProfile={renderUserProfile}
        ></ImageMessage>
      );
    } else if (messageData[data.index].type == 'file') {
      return (
        <FileMessage
          key={messageData[data.index].id}
          //@ts-ignore
          fileMessage={messageData[data.index]}
          style={data.style}
          renderUserProfile={renderUserProfile}
        ></FileMessage>
      );
    } else if (messageData[data.index].type == 'recall') {
      return (
        <RecalledMessage
          key={messageData[data.index].id}
          style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          message={messageData[data.index]}
        >
          {(messageData[data.index] as AgoraChat.TextMsgBody).msg}
        </RecalledMessage>
      );
    } else if (messageData[data.index].type == 'txt') {
      return (
        <TextMessage
          key={messageData[data.index].id}
          style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          textMessage={messageData[data.index]}
          renderUserProfile={renderUserProfile}
        >
          {(messageData[data.index] as AgoraChat.TextMsgBody).msg}
        </TextMessage>
      );
    } else if (messageData[data.index].type == 'combine') {
      return (
        <CombinedMessage
          key={messageData[data.index].id}
          style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          combinedMessage={messageData[data.index]}
          renderUserProfile={renderUserProfile}
        ></CombinedMessage>
      );
    }
  };

  let lastMsgId = messageData[messageData.length - 1]?.id || '';
  // 每次发消息滚动到最新的一条
  const listRef = React.useRef<List>(null);
  useEffect(() => {
    setTimeout(() => {
      (listRef?.current as any)?.scrollTo('bottom');
    }, 10);
  }, [lastMsgId]);

  useEffect(() => {
    (listRef?.current as any)?.scrollTo('bottom');
    if (currentCVS && currentCVS.chatType === 'groupChat') {
      const { getGroupMemberList } = useGroupMembers(currentCVS.conversationId);
      const { getGroupAdmins } = useGroupAdmins(currentCVS.conversationId);
      getGroupAdmins();
      getGroupMemberList();
    }
  }, [currentCVS]);

  return (
    <div className={classString} ref={msgContainerRef} id="listContainer">
      <MessageScrollList
        ref={listRef}
        hasMore={true}
        data={messageData}
        loading={isLoading}
        loadMoreItems={loadMore}
        renderItem={(itemData, index) => {
          return (
            <div key={itemData.id} className={`${classString}-msgItem`}>
              {renderMsg({ index, style: {} })}
            </div>
          );
        }}
      ></MessageScrollList>
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

MessageList = observer(MessageList);
export { MessageList };
