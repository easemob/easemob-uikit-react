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

export interface VideoMessageProps {
  videoMessage: VideoMessageType; // 从SDK收到的视频消息
  prefix?: string;
  style?: React.CSSProperties;
  nickName?: string;
  status?: 'received' | 'read' | 'sent' | 'sending';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
}
const VideoMessage = (props: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videoMessage, renderUserProfile } = props;

  let { bySelf, from } = videoMessage;
  console.log('textMessage --->', from, bySelf, rootStore.client);
  if (typeof bySelf == 'undefined') {
    // console.log('bySelf 是 undefined', rootStore.client.context.userId, from, rootStore);
    bySelf = from == rootStore.client.context.userId;
  }

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
      {...baseMsgProps}
    >
      <div>
        <video
          id="videoEle"
          ref={videoRef}
          autoPlay={false}
          controls
          crossOrigin="anonymous"
          preload="metadata"
          src={videoData}
          // src="https://a5-v2.easemob.com/easemob/easeim/chatfiles/4db7f110-b676-11ed-929f-1fcef06124f9?em-redirect=true&share-secret=TbgYILZ2Ee2IYD1BAxWxusBH_NV8dnJY6jFq1PwVkIaY3uys"
        ></video>
      </div>
    </BaseMessage>
  );
};
export { VideoMessage };
