/* eslint-disable react/prop-types */
import React, { useRef, useEffect, useMemo } from 'react';
import classNames from 'classnames';

interface VideoPlayerProps {
  videoId: string;
  isLocalVideo: boolean;
  stream: MediaStream | null;
  muted: boolean;
  className?: string;
  prefixCls: string;
  videoElement?: HTMLVideoElement | null;
}

// 自定义比较函数，只有当 stream 真正变化时才重新渲染
const arePropsEqual = (prevProps: VideoPlayerProps, nextProps: VideoPlayerProps) => {
  // 如果 stream 没有变化，且只是 muted 状态变化，则不重新渲染
  if (
    prevProps.stream === nextProps.stream &&
    prevProps.videoId === nextProps.videoId &&
    prevProps.isLocalVideo === nextProps.isLocalVideo &&
    prevProps.className === nextProps.className &&
    prevProps.prefixCls === nextProps.prefixCls &&
    prevProps.videoElement === nextProps.videoElement
  ) {
    // 只有 muted 状态变化，不重新渲染
    return true;
  }

  // 其他属性变化，需要重新渲染
  return false;
};

const VideoPlayerComponent = ({
  videoId,
  isLocalVideo,
  stream,
  muted,
  className,
  prefixCls,
  videoElement,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 useMemo 来缓存类名，避免不必要的重新计算
  const videoClassName = useMemo(() => {
    const baseClass = classNames(`${prefixCls}-video`, className);
    return isLocalVideo || videoId === 'local'
      ? `${baseClass} ${prefixCls}-video-mirror`
      : baseClass;
  }, [prefixCls, className, isLocalVideo, videoId]);

  // 使用 useEffect 来处理 stream 变化，避免在 ref 回调中设置
  useEffect(() => {
    const currentVideoElement = videoRef.current;
    if (currentVideoElement && stream && currentVideoElement.srcObject !== stream) {
      currentVideoElement.srcObject = stream;
    }
  }, [stream]);

  // 如果有外部传入的 videoElement，使用 ref 来挂载它
  useEffect(() => {
    if (videoElement && containerRef.current) {
      // 清空当前内容
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      // 添加外部传入的 videoElement
      containerRef.current.appendChild(videoElement);
    }
  }, [videoElement]);

  // 如果有外部传入的 videoElement，渲染容器而不是 video 元素
  if (videoElement) {
    return (
      <div
        ref={containerRef}
        className={videoClassName}
        data-video-id={videoId}
        data-local={isLocalVideo}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={videoClassName}
      data-video-id={videoId}
      data-local={isLocalVideo}
      muted={muted}
      autoPlay
      playsInline
    />
  );
};

const VideoPlayer = React.memo(VideoPlayerComponent, arePropsEqual);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
