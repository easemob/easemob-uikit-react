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
import { ChatSDK } from '../SDK';
import { cloneElement } from '../../component/_utils/reactNode';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
import RecalledMessage from '../recalledMessage';
import CombinedMessage from '../combinedMessage';
import { renderUserProfileProps } from '../baseMessage';
import { CurrentConversation } from '../store/ConversationStore';
import NoticeMessage from '../noticeMessage';
import { BaseMessageProps } from '../baseMessage';
import { useTranslation } from 'react-i18next';
import Icon from '../../component/icon';
import UserCardMessage from '../userCardMessage';
import { CustomMessageType } from 'module/types/messageType';
import { NoticeMessageBody } from '../noticeMessage/NoticeMessage';
export interface MsgListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  isThread?: boolean;
  renderMessage?: (message: ChatSDK.MessageBody | NoticeMessageBody) => ReactNode;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  conversation?: CurrentConversation;
  messageProps?: BaseMessageProps;
  onOpenThreadPanel?: (threadId: string) => void;
}

const MessageScrollList = ScrollList<ChatSDK.MessageBody | NoticeMessageBody>();

let MessageList: FC<MsgListProps> = props => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore } = rootStore;

  const {
    prefix: customizePrefixCls,
    className,
    renderMessage,
    renderUserProfile,
    conversation,
    isThread,
    messageProps,
    style = {},
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('messageList', customizePrefixCls);
  const classString = classNames(prefixCls, className);
  const context = useContext(RootContext);
  const { initConfig } = context;
  const { useUserInfo } = initConfig;
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const memoProps = React.useMemo(() => {
    return {
      messageProps,
    };
  }, []);

  const currentCVS = conversation ? conversation : messageStore.currentCVS || {};

  const { loadMore, isLoading } = useHistoryMessages(currentCVS);

  const messageData = messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId] || [];
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
          audioMessage={messageData[data.index] as ChatSDK.AudioMsgBody}
          style={data.style}
          renderUserProfile={renderUserProfile}
          thread={isThread}
          {...messageProps}
        ></AudioMessage>
      );
    } else if (messageData[data.index].type == 'img') {
      return (
        <ImageMessage
          key={messageData[data.index].id}
          //@ts-ignore
          imageMessage={messageData[data.index]}
          style={data.style}
          renderUserProfile={renderUserProfile}
          thread={isThread}
          imgProps={{
            onLoad: () => {
              if (messageStore.unreadMessageCount <= 0) {
                // 加载更多消息时保持当前位置，不要加载到图片又回到底部
                //@ts-ignore
                if (
                  //@ts-ignore
                  listRef.current.scrollHeight - listRef.current.scrollTop - 10 <
                  //@ts-ignore
                  msgContainerRef.current?.clientHeight
                ) {
                  scrollToBottom();
                }
              }
            },
          }}
          {...messageProps}
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
          thread={isThread}
          {...messageProps}
        ></FileMessage>
      );
    } else if (
      messageData[data.index].type == 'notice' ||
      messageData[data.index].type == 'recall'
    ) {
      return (
        <NoticeMessage noticeMessage={messageData[data.index] as NoticeMessageBody}></NoticeMessage>
      );
    } else if (messageData[data.index].type == 'txt') {
      return (
        <TextMessage
          key={messageData[data.index].id}
          // style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          textMessage={messageData[data.index]}
          renderUserProfile={renderUserProfile}
          thread={isThread}
          onOpenThreadPanel={props.onOpenThreadPanel || (() => {})}
          {...memoProps.messageProps}
        >
          {/* {(messageData[data.index] as ChatSDK.TextMsgBody).msg} */}
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
          thread={isThread}
          {...messageProps}
        ></CombinedMessage>
      );
    } else if (messageData[data.index].type == 'video') {
      return (
        <VideoMessage
          key={messageData[data.index].id}
          //@ts-ignore
          videoMessage={messageData[data.index]}
          style={data.style}
          renderUserProfile={renderUserProfile}
          thread={isThread}
          videoProps={{
            onLoadedMetadata: () => {
              if (messageStore.unreadMessageCount <= 0) {
                //@ts-ignore
                if (
                  //@ts-ignore
                  listRef.current.scrollHeight - listRef.current.scrollTop - 10 <
                  //@ts-ignore
                  msgContainerRef.current?.clientHeight
                ) {
                  scrollToBottom();
                }
              }
            },
          }}
          {...messageProps}
        ></VideoMessage>
      );
    } else if (messageData[data.index].type == 'loc') {
      return (
        <RecalledMessage
          key={messageData[data.index].id}
          style={data.style}
          //@ts-ignore
          status={messageData[data.index].status}
          //@ts-ignore
          message={messageData[data.index]}
        >
          {(messageData[data.index] as ChatSDK.TextMsgBody).msg}
        </RecalledMessage>
      );
    } else if (
      messageData[data.index].type == 'custom' &&
      (messageData[data.index] as CustomMessageType).customEvent == 'userCard'
    ) {
      return (
        <UserCardMessage
          renderUserProfile={renderUserProfile}
          style={data.style}
          key={messageData[data.index].id}
          thread={isThread}
          customMessage={messageData[data.index] as any}
          {...messageProps}
        ></UserCardMessage>
      );
    }
  };
  const lastMessage = messageData[messageData.length - 1];
  const lastMsgId = lastMessage?.id || '';
  // 每次发消息滚动到最新的一条
  const listRef = React.useRef<List>(null);
  useEffect(() => {
    // lastMessage?.type === 'notice' ||
    if (lastMessage?.type === 'recall') {
      return;
    }
    const from = (lastMessage as ChatSDK.MessageBody)?.from;
    if (lastMessage?.type != 'notice') {
      if (messageStore.holding && from != '' && from != rootStore.client.user) {
        return;
      }
    }

    setTimeout(() => {
      (listRef?.current as any)?.scrollTo('bottom');
    }, 10);
  }, [lastMsgId, (lastMessage as any)?.reactions]);

  useEffect(() => {
    if (!isThread) {
      (listRef?.current as any)?.scrollTo('bottom');
      if (currentCVS && currentCVS.chatType === 'groupChat') {
        if (!currentCVS.conversationId) return;
        const { getGroupMemberList } = useGroupMembers(
          currentCVS.conversationId,
          useUserInfo ?? true,
        );
        const { getGroupAdmins } = useGroupAdmins(currentCVS.conversationId);
        getGroupAdmins();
        getGroupMemberList?.();
      }
    }
  }, [currentCVS]);

  // const showUnreadCount = messageStore.unreadMessageCount[currentCVS.chatType]?.[
  //   currentCVS.conversationId
  // ]?.unreadCount;
  const handleScroll = (event: Event) => {
    const scrollHeight = (event.target as HTMLElement)?.scrollHeight;
    //滚动高度
    const scrollTop = (event.target as HTMLElement).scrollTop;
    //列表内容实际高度
    const offsetHeight = (event.target as HTMLElement).offsetHeight;
    // 滚动到顶加载更多
    const offsetBottom = scrollHeight - (scrollTop + offsetHeight);
    // scroll to bottom load data
    if (offsetBottom > 10) {
      !messageStore.holding && messageStore.setHoldingStatus(true);
    } else {
      messageStore.holding && messageStore.setHoldingStatus(false);
      messageStore.setUnreadMessageCount(0);
    }
  };

  const scrollToBottom = () => {
    (listRef?.current as any)?.scrollTo('bottom');
  };
  return (
    <div className={classString} style={{ ...style }} ref={msgContainerRef} id="listContainer">
      <MessageScrollList
        ref={listRef}
        hasMore={true}
        data={messageData}
        loading={isLoading}
        loadMoreItems={loadMore}
        onScroll={handleScroll}
        renderItem={(itemData, index) => {
          return (
            <div key={itemData.id} className={`${classString}-msgItem`}>
              {renderMsg({ index, style: {} })}
            </div>
          );
        }}
      ></MessageScrollList>
      {/** 未读数大于0，并且当前的会话有未读消息时展示 */}
      {messageStore.unreadMessageCount > 0 && (
        <div className={`cui-unread-message-count`} onClick={scrollToBottom}>
          <Icon type="ARROW_DOWN_THICK" width={20} height={20}></Icon>
          {messageStore.unreadMessageCount > 99 ? '99+' : messageStore.unreadMessageCount}{' '}
          {t('newMessage')}
        </div>
      )}
    </div>
  );
};

MessageList = observer(MessageList);
export { MessageList };
