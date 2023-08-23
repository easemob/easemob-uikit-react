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
  status?: 'received' | 'read' | 'sent' | 'sending';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
}
const VideoMessage = (props: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgSrc, setImgsrc] = useState('');
  const { videoMessage, style, status = 'default', renderUserProfile } = props;
  const getFirstFrame = () => {
    const canvas = document.createElement('canvas');
    const videoEle = document.getElementById('videoEle') as HTMLVideoElement;
    canvas.width = 200;
    canvas.height = 200;
    canvas.getContext('2d')?.drawImage(videoEle, 0, 0, canvas.width, canvas.height);
    const firstFrame = canvas.toDataURL('image/png', 1);
    console.log('firstFrame', firstFrame);
    return firstFrame;
  };
  useEffect(() => {
    setTimeout(() => {
      // const src = getFirstFrame();
      // setImgsrc(src);
    }, 1000);
  }, []);

  let { bySelf, time, from } = videoMessage;
  console.log('textMessage --->', from, bySelf, rootStore.client);
  if (typeof bySelf == 'undefined') {
    console.log('bySelf 是 undefined', rootStore.client.context.userId, from, rootStore);
    bySelf = from == rootStore.client.context.userId;
  }

  return (
    <BaseMessage
      bubbleType="none"
      direction={bySelf ? 'rtl' : 'ltr'}
      style={style}
      time={time}
      nickName={from}
      status={status}
      renderUserProfile={renderUserProfile}
    >
      <div>
        <video
          id="videoEle"
          ref={videoRef}
          width={374}
          autoPlay
          controls
          crossOrigin="anonymous"
          preload="metadata"
          src={videoData}
          // src="https://a5-v2.easemob.com/easemob/easeim/chatfiles/4db7f110-b676-11ed-929f-1fcef06124f9?em-redirect=true&share-secret=TbgYILZ2Ee2IYD1BAxWxusBH_NV8dnJY6jFq1PwVkIaY3uys"
        ></video>
        {/* <img src={imgSrc}></img> */}
      </div>
    </BaseMessage>
  );
};
export { VideoMessage };
