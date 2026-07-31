import React, { useEffect, useRef, useState, useContext } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { VideoMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import Mask from '../../component/modal/Mast';
import Modal from '../../component/modal';
import rootStore from '../store/index';
import type { ChatSDK } from '../SDK';
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getMessageChatType,
  getMessageDisplayStatus,
  getMessageId,
  getMessageTime,
  getThreadId,
} from '../utils';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface VideoMessageProps extends BaseMessageProps {
  videoMessage: VideoMessageType | ChatSDK.Message; // 从SDK收到的视频消息
  prefix?: string;
  style?: React.CSSProperties;
  nickName?: string;
  bubbleClass?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  type?: 'primary' | 'secondly';
  className?: string;
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
}
const VideoMessage = (props: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    videoMessage,
    renderUserProfile,
    type,
    shape,
    nickName,
    thread,
    className,
    prefix,
    videoProps,
    bubbleClass,
    onClick,
    ...baseMsgProps
  } = props;

  const sdkMessage = videoMessage as ChatSDK.Message;
  const uiMessage = videoMessage as VideoMessageType & Record<string, any>;
  const body = sdkMessage.body as Record<string, any>;
  const conversationType = getMessageChatType(sdkMessage);
  if (!conversationType) return null;
  const conversationId = getCvsIdFromMessage(sdkMessage);
  const messageId = getMessageId(sdkMessage);
  const messageTime = getMessageTime(sdkMessage);
  const localFile = uiMessage.file as Record<string, any> | undefined;
  const videoUrl = body.url || uiMessage.url || localFile?.url || '';
  const thumbUrl = body.thumbnailUrl || uiMessage.thumb || '';
  let { bySelf, from, reactions } = uiMessage;
  const status = getMessageDisplayStatus(sdkMessage);
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId,
      conversationType,
    },
  });
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-video', prefix);
  const context = useContext(RootContext);
  const { theme } = context;
  let bubbleShape = shape;
  if (theme?.bubbleShape) {
    bubbleShape = theme?.bubbleShape;
  }
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${bubbleShape}`]: !!bubbleShape,
    },
    className,
  );

  if (typeof bySelf == 'undefined') {
    bySelf = from == getCurrentUserId(rootStore.client);
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(sdkMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
    );
  };

  const handlePinMessage = () => {
    pinMessage(messageId);
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: conversationType,
              conversationId: conversationId,
            },
            messageId,
            emojiString,
          );
        }

        if (item.isAddedBySelf) {
          const currentUserId = getCurrentUserId(rootStore.client);
          const index = item.userList.indexOf(currentUserId);
          if (index > -1) {
            const findItem = item.userList.splice(index, 1)[0];
            item.userList.unshift(findItem);
          } else {
            item.userList.unshift(currentUserId);
          }
        }
      }
    });
  };

  const handleRecallMessage = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      uiMessage.isChatThread,
      true,
    );
  };
  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(sdkMessage);
  };

  const select =
    rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(sdkMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        return getMessageId(item) !== messageId;
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
  };

  const _thread =
    conversationType == 'groupChat' && thread && !uiMessage.chatThread && !uiMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: sdkMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    const chatThreadId = getThreadId(uiMessage.chatThreadOverview);
    rootStore.threadStore.joinChatThread(chatThreadId);
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: sdkMessage,
      info: uiMessage.chatThreadOverview as any,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(chatThreadId);
  };

  const handlePlayVideo = () => {
    // 收到的单聊/群聊视频消息播放时发送已读回执（SDK 0.20+: sendMessageReadReceipts）
    if (
      (conversationType === 'singleChat' || conversationType === 'groupChat') &&
      sdkMessage.from != getCurrentUserId(rootStore.client) &&
      !uiMessage.isChatThread
    ) {
      rootStore.messageStore.sendReadAck(messageId);
    }
  };
  const handleClickVideo = (e: React.MouseEvent<HTMLVideoElement>) => {
    const preventDefault = onClick?.(sdkMessage);
    if (preventDefault === true) {
      e.preventDefault();
    }
  };
  return (
    <BaseMessage
      id={messageId}
      className={bubbleClass}
      message={sdkMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      // shape="round"
      bubbleStyle={{
        padding: 0,
        background: uiMessage.chatThreadOverview ? undefined : 'transparent',
      }}
      time={messageTime}
      nickName={nickName}
      onReplyMessage={handleReplyMsg}
      onDeleteMessage={handleDeleteMsg}
      onPinMessage={handlePinMessage}
      reactionData={reactions}
      onAddReactionEmoji={handleClickEmoji}
      onDeleteReactionEmoji={handleDeleteEmoji}
      onShowReactionUserList={handleShowReactionUserList}
      onRecallMessage={handleRecallMessage}
      onSelectMessage={handleSelectMessage}
      onResendMessage={handleResendMessage}
      renderUserProfile={renderUserProfile}
      select={select}
      onMessageCheckChange={handleMsgCheckChange}
      onCreateThread={handleCreateThread}
      thread={_thread}
      chatThreadOverview={uiMessage.chatThreadOverview as any}
      onClickThreadTitle={handleClickThreadTitle}
      status={status}
      // bubbleStyle={{ padding: '0' }}
      {...baseMsgProps}
    >
      <div className={classString}>
        <video
          id="videoEle"
          ref={videoRef}
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={handlePlayVideo}
          poster={thumbUrl}
          src={`${videoUrl}${
            videoUrl?.includes('?') ? '&origin-file=true' : '?em-redirect=true&origin-file=true'
          }`}
          onClick={handleClickVideo}
          {...videoProps}
        ></video>
      </div>
    </BaseMessage>
  );
};

const VideoMessageOut = observer(VideoMessage);
VideoMessageOut.displayName = 'VideoMessage';
export default VideoMessageOut;
