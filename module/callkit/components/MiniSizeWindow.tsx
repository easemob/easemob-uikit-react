import React from 'react';
import classNames from 'classnames';
import { Icon } from '../../../component/icon/Icon';

export interface MiniSizeWindowProps {
  /** CSS类名前缀 */
  prefixCls?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;

  /** 通话时长 */
  callDuration?: string;
  /** 参与者数量 */
  participantCount?: number;
  /** 通话类型 */
  callType?: 'video' | 'audio' | 'group';
  /** 通话状态 */
  callStatus?: 'connecting' | 'connected' | 'ringing';

  /** 控制状态 */
  muted?: boolean;
  cameraEnabled?: boolean;

  /** 视频相关 */
  remoteVideoStream?: MediaStream;
  remoteVideoElement?: HTMLVideoElement;
  remoteUserAvatar?: string;
  remoteUserNickname?: string;

  /** 事件回调 */
  onClick?: () => void;
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onHangup?: () => void;
}

/**
 * 最小化窗口组件
 * 用于显示通话的最小化状态，包含基本信息和快速控制
 */
export const MiniSizeWindow: React.FC<MiniSizeWindowProps> = ({
  prefixCls = 'cui-callkit',
  className,
  style,

  callDuration = '00:00:00',
  participantCount = 1,
  callType = 'video',
  callStatus = 'connected',

  remoteVideoStream,
  remoteVideoElement,
  remoteUserAvatar,
  remoteUserNickname,

  onClick,
}) => {
  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  // 处理控制按钮点击，阻止事件冒泡
  const handleControlClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation();
    callback?.();
  };

  // 获取状态图标
  const getStatusIcon = () => {
    switch (callStatus) {
      case 'connecting':
        return (
          <Icon
            type="LOADING"
            width={16}
            height={16}
            className={`${prefixCls}-mini-status-icon connecting`}
          />
        );
      case 'ringing':
        return (
          <Icon
            type="BELL"
            width={16}
            height={16}
            className={`${prefixCls}-mini-status-icon ringing`}
          />
        );
      case 'connected':
      default:
        return (
          <Icon
            type="PHONE_PICK"
            width={28}
            height={28}
            color="#00FF95"
            className={`${prefixCls}-mini-status-icon connected`}
          />
        );
    }
  };

  // 获取时长文本
  const getDurationText = () => {
    return callDuration || '00:00:00';
  };

  // 获取参与者信息
  const getParticipantInfo = () => {
    if (participantCount <= 1) {
      return callType === 'video' ? '视频通话' : '语音通话';
    }
    return `${participantCount}人${callType === 'video' ? '视频' : '语音'}通话`;
  };

  // 判断是否是1v1视频通话
  const isOneToOneVideo = callType === 'video';

  const containerClass = classNames(
    `${prefixCls}-mini-window`,
    {
      [`${prefixCls}-mini-window-video`]: isOneToOneVideo,
      [`${prefixCls}-mini-window-normal`]: !isOneToOneVideo,
    },
    className,
  );

  const containerStyle = isOneToOneVideo
    ? {
        width: '108px',
        height: '192px',
        borderRadius: '12px',
        overflow: 'hidden',
        ...style,
      }
    : style;

  // 🔧 改进：渲染视频引用处理
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // 🔧 改进：更完善的视频流处理逻辑
  React.useEffect(() => {
    if (isOneToOneVideo && videoRef.current) {
      console.log('🎬 MiniSizeWindow 视频流处理:', {
        hasRemoteVideoStream: !!remoteVideoStream,
        hasRemoteVideoElement: !!remoteVideoElement,
        videoRef: !!videoRef.current,
        callStatus,
        callType,
      });

      if (remoteVideoStream) {
        console.log('🎬 设置远程视频流到最小化窗口');
        videoRef.current.srcObject = remoteVideoStream;

        // 确保视频播放
        videoRef.current.play().catch(error => {
          console.warn('🎬 最小化窗口视频播放失败:', error);
        });
      }
    }
  }, [isOneToOneVideo, remoteVideoStream, remoteVideoElement, callStatus, callType]);

  // 🔧 新增：调试信息
  React.useEffect(() => {
    if (isOneToOneVideo) {
      console.log('🔍 MiniSizeWindow 调试信息:', {
        callType,
        callStatus,
        hasRemoteVideoStream: !!remoteVideoStream,
        hasRemoteVideoElement: !!remoteVideoElement,
        remoteUserNickname,
        remoteUserAvatar,
        participantCount,
      });
    }
  }, [
    isOneToOneVideo,
    callType,
    callStatus,
    remoteVideoStream,
    remoteVideoElement,
    remoteUserNickname,
    remoteUserAvatar,
    participantCount,
  ]);

  return (
    <div className={containerClass} style={containerStyle} onClick={handleClick}>
      {isOneToOneVideo ? (
        /* 1v1视频模式：显示对方视频窗口 */
        <div className={`${prefixCls}-mini-video-container`}>
          {/* 🔧 改进：优先使用 remoteVideoElement，其次使用 remoteVideoStream */}
          {remoteVideoElement ? (
            <video
              className={`${prefixCls}-mini-video`}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : remoteVideoStream ? (
            <video
              ref={videoRef}
              className={`${prefixCls}-mini-video`}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            /* 无视频流时显示头像占位 */
            <div className={`${prefixCls}-mini-video-placeholder`}>
              {remoteUserAvatar ? (
                <img
                  src={remoteUserAvatar}
                  alt={remoteUserNickname}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
              ) : (
                <div
                  className={`${prefixCls}-mini-avatar-placeholder`}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    backgroundColor: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon type="PERSON_SINGLE_FILL" width="40%" height="40%" color="#ffffff" />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 普通模式：显示状态信息 */
        <>
          {/* 状态图标 */}
          <div className={`${prefixCls}-mini-avatar`}>{getStatusIcon()}</div>

          {/* 文本信息 */}
          <div className={`${prefixCls}-mini-text`}>
            <div className={`${prefixCls}-mini-duration`}>{getDurationText()}</div>
            {/* <div className={`${prefixCls}-mini-participants`}>{getParticipantInfo()}</div> */}
          </div>
        </>
      )}
    </div>
  );
};

export default MiniSizeWindow;
