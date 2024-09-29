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
// @ts-ignore
import { ChatSDK } from '../SDK';
import { getCvsIdFromMessage } from '../utils';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface VideoMessageProps extends BaseMessageProps {
  videoMessage: ChatSDK.VideoMsgBody & VideoMessageType; // 从SDK收到的视频消息
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
    ...baseMsgProps
  } = props;

  let { bySelf, from, reactions, status } = videoMessage;
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(videoMessage),
      conversationType: videoMessage.chatType,
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
    bySelf = from == rootStore.client.context.userId;
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(videoMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(videoMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(videoMessage.mid || videoMessage.id);
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(videoMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(videoMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(videoMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: videoMessage.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            videoMessage.mid || videoMessage.id,
            emojiString,
          );
        }

        if (item.isAddedBySelf) {
          const index = item.userList.indexOf(rootStore.client.user);
          if (index > -1) {
            const findItem = item.userList.splice(index, 1)[0];
            item.userList.unshift(findItem);
          } else {
            item.userList.unshift(rootStore.client.user);
          }
        }
      }
    });
  };

  const handleRecallMessage = () => {
    const conversationId = getCvsIdFromMessage(videoMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
      videoMessage.isChatThread,
      true,
    );
  };
  const conversationId = getCvsIdFromMessage(videoMessage);
  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[videoMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(videoMessage);
  };

  const select =
    rootStore.messageStore.selectedMessage[videoMessage.chatType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[videoMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(videoMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == videoMessage.id || item.mid == videoMessage.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
  };

  // @ts-ignore
  const _thread =
    // @ts-ignore
    videoMessage.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !videoMessage.chatThread &&
    !videoMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: videoMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(videoMessage.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: videoMessage,
      info: videoMessage.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(videoMessage?.chatThreadOverview?.id || '');
  };

  const handlePlayVideo = () => {
    // 消息是发给自己的单聊消息，回复read ack， 引用、转发的消息、已经是read状态的消息，不发read ack
    if (
      videoMessage.chatType == 'singleChat' &&
      videoMessage.from != rootStore.client.context.userId &&
      // @ts-ignore
      videoMessage.status != 'read' &&
      !videoMessage.isChatThread &&
      videoMessage.to == rootStore.client.context.userId
    ) {
      rootStore.messageStore.sendReadAck(videoMessage.id, videoMessage.from || '');
    }
  };
  return (
    <BaseMessage
      id={videoMessage.id}
      className={bubbleClass}
      message={videoMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      // shape="round"
      bubbleStyle={{
        padding: 0,
        background: videoMessage.chatThreadOverview ? undefined : 'transparent',
      }}
      time={videoMessage.time}
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
      chatThreadOverview={videoMessage.chatThreadOverview}
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
          poster={videoMessage.thumb}
          src={`${videoMessage.url}${
            videoMessage?.url?.includes('?')
              ? '&origin-file=true'
              : '?em-redirect=true&origin-file=true'
          }`}
          {...videoProps}
        ></video>
      </div>
    </BaseMessage>
  );
};

const VideoMessageOut = observer(VideoMessage);
VideoMessageOut.displayName = 'VideoMessage';
export default VideoMessageOut;
