import React from 'react';
import { Header } from '../../header/Header';
import Button from '../../../component/button';
import { Icon } from '../../../component/icon/Icon';
import CallControls from '../components/CallControls';
import type { FullLayoutProps } from '../types/layout';

/**
 * OneToOne 完整布局组件
 * 视频内容占满整个容器，Header 和 Controls 浮动在上面
 */
export const OneToOneFullLayout: React.FC<FullLayoutProps> = ({
  videos,
  containerSize,
  prefixCls,
  renderVideoWindow,

  // 🔧 背景图片设置
  backgroundImage,

  // 呼叫状态相关
  callMode = 'video',
  callStatus = 'connected',
  isShowingPreview = false,

  // 全屏相关
  isFullscreen = false,
  onFullscreenToggle,

  // 最小化相关
  isMinimized = false,
  onMinimizedToggle,

  // 控制按钮相关
  showControls = true,
  muted = false,
  cameraEnabled = true,
  speakerEnabled = true,
  screenSharing = false,

  // 控制按钮回调
  onMuteToggle,
  onCameraToggle,
  onSpeakerToggle,
  onScreenShareToggle,
  onHangup,
  onAddParticipant,

  // 预览模式回调
  onPreviewAccept,
  onPreviewReject,

  // 其他
  callDuration = '00:00:00',
  onMinimizedClick,

  // 🔧 新增：通话信息
  invitation,
  callInfo,
}) => {
  // 分离远程视频和本地视频
  const remoteVideo = videos.find(video => !video.isLocalVideo);
  const localVideo = videos.find(video => video.isLocalVideo);

  // 🔧 计算Header显示的信息
  const getHeaderInfo = () => {
    if (isShowingPreview) {
      // 预览模式：显示邀请人信息
      if (invitation) {
        return {
          avatar: invitation.callerAvatar,
          content: invitation.callerName || '未知用户',
          subtitle:
            callMode === 'video'
              ? '视频通话邀请 - 检查您的摄像头和麦克风'
              : '语音通话邀请 - 检查您的麦克风',
        };
      } else {
        return {
          avatar: undefined,
          content: '预览模式',
          subtitle:
            callMode === 'video'
              ? '视频通话预览 - 检查您的摄像头和麦克风'
              : '语音通话预览 - 检查您的麦克风',
        };
      }
    } else {
      // 通话模式：显示对方信息
      const remoteUserInfo = callInfo || {};
      const displayName =
        remoteUserInfo.remoteUserNickname ||
        remoteVideo?.nickname ||
        remoteUserInfo.remoteUserId ||
        '用户';
      const displayAvatar = remoteUserInfo.remoteUserAvatar || remoteVideo?.avatar;

      return {
        avatar: displayAvatar,
        content: displayName,
        subtitle: callDuration,
      };
    }
  };

  const headerInfo = getHeaderInfo();

  // 处理最小化状态下的点击
  const handleMinimizedClick = () => {
    if (isMinimized) {
      onMinimizedClick?.();
    }
  };

  // 🔧 计算背景样式
  const backgroundStyle = React.useMemo(() => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100% 100%',
        backgroundPosition: '0px 0px',
        backgroundRepeat: 'no-repeat',
      };
    }
    return undefined; // 返回undefined，让CSS默认样式生效
  }, [backgroundImage]);

  return (
    <div
      className={`${prefixCls}-one-to-one-full-layout`}
      style={{ ...backgroundStyle, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      {/* 视频内容区域 - 占满整个容器 */}
      <div className={`${prefixCls}-video-content`}>
        {/* 预览模式：本地视频作为主视频显示 */}
        {isShowingPreview && localVideo && callMode !== 'audio' && (
          <div className={`${prefixCls}-main-video`}>{renderVideoWindow(localVideo, 0)}</div>
        )}

        {/* 正常通话模式：主视频（远程视频）- 背景，语音通话时不显示 */}
        {!isShowingPreview && remoteVideo && callMode !== 'audio' && (
          <div className={`${prefixCls}-main-video`}>{renderVideoWindow(remoteVideo, 0)}</div>
        )}

        {/* 正常通话模式：画中画视频（本地视频）- 右上角，语音通话时不显示 */}
        {!isShowingPreview && localVideo && !isMinimized && callMode !== 'audio' && (
          <div className={`${prefixCls}-pip-video`}>{renderVideoWindow(localVideo, 1)}</div>
        )}

        {/* 语音通话时的替代界面 */}
        {
          callMode === 'audio' && null
          // <div className={`${prefixCls}-audio-call-content`}>
          //   <div className={`${prefixCls}-audio-call-avatar`}>
          //     {/* 预览模式显示本地用户头像，正常模式显示远程用户头像 */}
          //     {isShowingPreview ? (
          //       <div className={`${prefixCls}-avatar-placeholder`}>
          //         {localVideo?.nickname?.[0]?.toUpperCase() || '我'}
          //       </div>
          //     ) : remoteVideo?.avatar ? (
          //       <img src={remoteVideo.avatar} alt={remoteVideo.nickname} />
          //     ) : (
          //       <div className={`${prefixCls}-avatar-placeholder`}>
          //         {remoteVideo?.nickname?.[0]?.toUpperCase() || '?'}
          //       </div>
          //     )}
          //   </div>
          //   <div className={`${prefixCls}-audio-call-info`}>
          //     <div className={`${prefixCls}-caller-name`}>
          //       {isShowingPreview
          //         ? localVideo?.nickname || '我'
          //         : remoteVideo?.nickname ||
          //           callInfo?.remoteUserNickname ||
          //           callInfo?.remoteUserId ||
          //           (remoteVideo?.id?.startsWith('remote-')
          //             ? remoteVideo.id.replace('remote-', '')
          //             : remoteVideo?.id) ||
          //           '用户'}
          //     </div>
          //     {/* <div className={`${prefixCls}-call-status`}>
          //       {isShowingPreview
          //         ? '语音通话邀请'
          //         : callStatus === 'calling'
          //         ? '呼叫中...'
          //         : '语音通话中'}
          //     </div> */}
          //   </div>
          //   {/* 音频波形或其他视觉效果可以在这里添加 */}
          // </div>
        }

        {/* 渐变遮罩 - 增强 Header 和 Controls 的可读性 */}
        <div className={`${prefixCls}-overlay-gradient`} />
      </div>

      {/* Header - 浮动在视频内容之上 */}
      <div className={`${prefixCls}-floating-header`}>
        <Header
          avatarSrc={headerInfo.avatar}
          content={headerInfo.content}
          style={{ color: 'white' }}
          subtitle={headerInfo.subtitle}
          suffixIcon={[
            <Button
              key="fullscreen"
              type="ghost"
              size="small"
              style={{ border: 'none' }}
              onClick={onFullscreenToggle}
            >
              <Icon
                type={isFullscreen ? 'CHEVRON_4_CLUSTER' : 'CHEVRON_4_ALL_AROUND'}
                width={24}
                height={24}
                color="#F9FAFA"
              />
            </Button>,
            <Button
              key="minimize"
              type="ghost"
              size="small"
              style={{ border: 'none' }}
              onClick={onMinimizedToggle}
            >
              <Icon type="BOXES" width={24} height={24} color="#F9FAFA" />
            </Button>,
          ]}
        />
      </div>

      {/* Controls - 浮动在视频内容之上 */}
      {showControls && !isMinimized && (
        <div className={`${prefixCls}-floating-controls`}>
          <CallControls
            callMode={callMode}
            isPreview={isShowingPreview}
            muted={muted}
            cameraEnabled={cameraEnabled}
            speakerEnabled={speakerEnabled}
            screenSharing={screenSharing}
            onMuteToggle={onMuteToggle}
            onCameraToggle={onCameraToggle}
            onSpeakerToggle={onSpeakerToggle}
            onScreenShareToggle={onScreenShareToggle}
            onHangup={onHangup}
            onPreviewAccept={onPreviewAccept}
            onPreviewReject={onPreviewReject}
          />
        </div>
      )}

      {/* 最小化状态的简化控制 */}
      {isMinimized && (
        <div className={`${prefixCls}-minimized-controls`} onClick={handleMinimizedClick}>
          <div className={`${prefixCls}-minimized-info`}>
            <div className={`${prefixCls}-minimized-avatar`}>
              <Icon type="PLAY" width={16} height={16} style={{ color: '#52c41a' }} />
            </div>
            <div className={`${prefixCls}-minimized-time`}>{callDuration}</div>
          </div>
          <div className={`${prefixCls}-minimized-quick-controls`}>
            <Button
              type="text"
              size="small"
              style={{ color: muted ? '#ff4d4f' : 'white' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onMuteToggle?.(!muted);
              }}
            >
              <Icon type={muted ? 'CLOSE' : 'DONE_ALL'} width={16} height={16} />
            </Button>
            <Button
              type="text"
              size="small"
              style={{ color: cameraEnabled ? 'white' : '#ff4d4f' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onCameraToggle?.(!cameraEnabled);
              }}
            >
              <Icon type={cameraEnabled ? 'PLAY_VIDEO' : 'CLOSE'} width={16} height={16} />
            </Button>
            <Button
              type="text"
              size="small"
              style={{ color: '#ff4d4f' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onHangup?.();
              }}
            >
              <Icon type="SHUT_DOWN" width={16} height={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
