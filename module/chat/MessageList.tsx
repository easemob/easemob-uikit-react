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
import { TextMessage } from '../textMessage';
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
// 消息渲染器的参数类型
export interface MessageRenderContext {
  message: ChatSDK.MessageBody | NoticeMessageBody;
  style: React.CSSProperties;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  isThread?: boolean;
  messageProps?: BaseMessageProps;
  onOpenThreadPanel?: (threadId: string) => void;
  onRtcInviteMessageClick?: (message: ChatSDK.MessageBody) => void;
  scrollToBottom?: () => void;
}

// 消息类型
export type MessageType =
  | 'txt'
  | 'img'
  | 'audio'
  | 'video'
  | 'file'
  | 'loc'
  | 'combine'
  | 'custom'
  | 'notice'
  | 'recall';

// 自定义渲染器类型
export type MessageRenderer = (context: MessageRenderContext) => ReactNode;

export interface MsgListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  isThread?: boolean;
  /** @deprecated 使用 customRenderers 替代，支持按类型自定义 */
  renderMessage?: (message: ChatSDK.MessageBody | NoticeMessageBody) => ReactNode;
  /** 按消息类型自定义渲染器，只需要传入想自定义的类型即可，其他类型会使用默认渲染 */
  customRenderers?: Partial<Record<MessageType, MessageRenderer>>;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  conversation?: CurrentConversation;
  messageProps?: BaseMessageProps;
  onOpenThreadPanel?: (threadId: string) => void;
  onRtcInviteMessageClick?: (message: ChatSDK.MessageBody) => void;
}

const MessageScrollList = ScrollList<ChatSDK.MessageBody | NoticeMessageBody>();

let MessageList: FC<MsgListProps> = props => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore } = rootStore;

  const {
    prefix: customizePrefixCls,
    className,
    renderMessage,
    customRenderers,
    renderUserProfile,
    conversation,
    isThread,
    messageProps,
    style = {},
    onRtcInviteMessageClick,
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

  const currentCVS = React.useMemo(() => {
    return conversation ? conversation : messageStore.currentCVS || {};
  }, [conversation?.conversationId, messageStore.currentCVS.conversationId]);

  const { loadMore, isLoading } = useHistoryMessages(currentCVS);

  const messageData = messageStore.message[currentCVS.chatType]?.[currentCVS.conversationId] || [];

  const listRef = React.useRef<List>(null);

  const scrollToBottom = () => {
    (listRef?.current as any)?.scrollTo('bottom');
  };

  // 定义默认的消息渲染器
  const defaultRenderers = useMemo<Record<MessageType, MessageRenderer>>(() => {
    return {
      audio: ctx => (
        <AudioMessage
          key={ctx.message.id}
          //@ts-ignore
          audioMessage={ctx.message as ChatSDK.AudioMsgBody}
          style={ctx.style}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
          {...ctx.messageProps}
        />
      ),
      img: ctx => (
        <ImageMessage
          key={ctx.message.id}
          //@ts-ignore
          imageMessage={ctx.message}
          style={ctx.style}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
          imgProps={{
            onLoad: () => {
              if (messageStore.unreadMessageCount <= 0) {
                //@ts-ignore
                if (
                  //@ts-ignore
                  listRef.current.scrollHeight - listRef.current.scrollTop - 10 <
                  //@ts-ignore
                  msgContainerRef.current?.clientHeight
                ) {
                  ctx.scrollToBottom?.();
                }
              }
            },
          }}
          {...ctx.messageProps}
        />
      ),
      file: ctx => (
        <FileMessage
          key={ctx.message.id}
          //@ts-ignore
          fileMessage={ctx.message}
          style={ctx.style}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
          {...ctx.messageProps}
        />
      ),
      notice: ctx => <NoticeMessage noticeMessage={ctx.message as NoticeMessageBody} />,
      recall: ctx => <NoticeMessage noticeMessage={ctx.message as NoticeMessageBody} />,
      txt: ctx => {
        const message = ctx.message as ChatSDK.TextMsgBody;
        // 处理 RTC 邀请消息
        if (message?.chatType === 'groupChat') {
          const isRtcInviteMessage = message?.ext?.msgType === 'rtcCallWithAgora';
          if (isRtcInviteMessage) {
            let msg = '';
            if (
              // @ts-ignore
              message.ext.rtcIsEnd ||
              // @ts-ignore
              (!message.mid && message.ext.rtcIsEnd == undefined)
            ) {
              msg = '通话已结束';
            } else {
              // @ts-ignore
              msg = message.msg;
            }
            return (
              <NoticeMessage
                noticeMessage={
                  {
                    id: message.id,
                    type: 'notice',
                    message: msg,
                    time: message.time,
                    noticeType: 'notice',
                  } as NoticeMessageBody
                }
              />
            );
          }
        }
        return (
          <TextMessage
            key={message.id}
            //@ts-ignore
            status={message.status}
            //@ts-ignore
            textMessage={message}
            renderUserProfile={ctx.renderUserProfile}
            thread={ctx.isThread}
            onOpenThreadPanel={ctx.onOpenThreadPanel || (() => {})}
            {...memoProps.messageProps}
            onClick={(msg: ChatSDK.MessageBody) => {
              const isRtcInviteMessage = message?.ext?.msgType === 'rtcCallWithAgora';
              isRtcInviteMessage && ctx.onRtcInviteMessageClick?.(message);
              memoProps.messageProps?.onClick?.(msg);
              return true;
            }}
          />
        );
      },
      combine: ctx => (
        <CombinedMessage
          key={ctx.message.id}
          style={ctx.style}
          //@ts-ignore
          status={ctx.message.status}
          //@ts-ignore
          combinedMessage={ctx.message}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
          {...ctx.messageProps}
        />
      ),
      video: ctx => (
        <VideoMessage
          key={ctx.message.id}
          //@ts-ignore
          videoMessage={ctx.message}
          style={ctx.style}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
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
                  ctx.scrollToBottom?.();
                }
              }
            },
          }}
          {...ctx.messageProps}
        />
      ),
      loc: ctx => (
        <RecalledMessage
          key={ctx.message.id}
          style={ctx.style}
          //@ts-ignore
          status={ctx.message.status}
          //@ts-ignore
          message={ctx.message}
        >
          {(ctx.message as ChatSDK.TextMsgBody).msg}
        </RecalledMessage>
      ),
      custom: ctx => {
        const message = ctx.message as CustomMessageType;
        if (message.customEvent === 'userCard') {
          return (
            <UserCardMessage
              renderUserProfile={ctx.renderUserProfile}
              style={ctx.style}
              key={message.id}
              thread={ctx.isThread}
              customMessage={message as any}
              {...ctx.messageProps}
            />
          );
        }
        return null;
      },
    };
  }, [isThread, messageProps, renderUserProfile, onRtcInviteMessageClick]);

  // 合并默认渲染器和自定义渲染器
  const mergedRenderers = useMemo(() => {
    return { ...defaultRenderers, ...customRenderers };
  }, [defaultRenderers, customRenderers]);

  const renderMsg = (data: { index: number; style: React.CSSProperties }) => {
    const message = messageData[data.index];

    // 兼容旧的 renderMessage API
    if (renderMessage) {
      const element = renderMessage(message);
      cloneElement(element, oriProps => ({
        style: {
          ...data.style,
          ...oriProps.style,
        },
      }));
      return element;
    }

    // 创建渲染上下文
    const renderContext: MessageRenderContext = {
      message,
      style: data.style,
      renderUserProfile,
      isThread,
      messageProps,
      onOpenThreadPanel: props.onOpenThreadPanel,
      onRtcInviteMessageClick,
      scrollToBottom,
    };

    // 获取消息类型
    let messageType = message.type as MessageType;

    // 特殊处理：notice 和 recall 类型
    if (message.type === 'notice' || message.type === 'recall') {
      messageType = message.type;
    }

    // 特殊处理：custom 消息根据 customEvent 判断
    if (message.type === 'custom') {
      const customMessage = message as CustomMessageType;
      if (customMessage.customEvent === 'userCard') {
        messageType = 'custom';
      }
    }

    // 使用对应的渲染器
    const renderer = mergedRenderers[messageType];
    if (renderer) {
      return renderer(renderContext);
    }

    // 如果没有找到对应的渲染器，返回 null
    return null;
  };
  const lastMessage = messageData[messageData.length - 1];
  const lastMsgId = lastMessage?.id || '';
  // 每次发消息滚动到最新的一条
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
  }, [currentCVS?.conversationId]);

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
