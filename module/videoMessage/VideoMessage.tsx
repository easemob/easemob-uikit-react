import React, { useEffect, useRef, useState } from 'react';
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
import videoData from './video.mp4';
import { ChatSDK } from '../SDK';
import { getCvsIdFromMessage } from '../utils';
import { observer } from 'mobx-react-lite';
export interface VideoMessageProps extends BaseMessageProps {
  videoMessage: ChatSDK.VideoMsgBody; // 从SDK收到的视频消息
  prefix?: string;
  style?: React.CSSProperties;
  nickName?: string;
  status?: 'received' | 'read' | 'sent' | 'sending';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  type?: 'primary' | 'secondly';
}
const VideoMessage = (props: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videoMessage, renderUserProfile, type, shape, nickName, thread, ...baseMsgProps } = props;

  let { bySelf, from, reactions } = videoMessage;
  console.log('textMessage --->', from, bySelf, rootStore.client);
  if (typeof bySelf == 'undefined') {
    // console.log('bySelf 是 undefined', rootStore.client.context.userId, from, rootStore);
    bySelf = from == rootStore.client.context.userId;
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(videoMessage);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(videoMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
    );
  };

  const handleClickEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(videoMessage);

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
    let conversationId = getCvsIdFromMessage(videoMessage);
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
    let conversationId = getCvsIdFromMessage(videoMessage);
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
    let conversationId = getCvsIdFromMessage(videoMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: videoMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      videoMessage.mid || videoMessage.id,
      videoMessage.isChatThread,
    );
  };
  let conversationId = getCvsIdFromMessage(videoMessage);
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
  let _thread =
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

  return (
    <BaseMessage
      id={videoMessage.id}
      message={videoMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      nickName={nickName}
      onReplyMessage={handleReplyMsg}
      onDeleteMessage={handleDeleteMsg}
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
      bubbleStyle={{ padding: '0' }}
      {...baseMsgProps}
    >
      <video
        id="videoEle"
        ref={videoRef}
        autoPlay={false}
        controls
        height={374}
        crossOrigin="anonymous"
        preload="metadata"
        src={videoData}
        // src="https://a5-v2.easemob.com/easemob/easeim/chatfiles/4db7f110-b676-11ed-929f-1fcef06124f9?em-redirect=true&share-secret=TbgYILZ2Ee2IYD1BAxWxusBH_NV8dnJY6jFq1PwVkIaY3uys"
      ></video>
    </BaseMessage>
  );
};
export default observer(VideoMessage);
