import React from 'react';
import type { VideoWindowProps, ContainerSize } from '../types/index';
import { LayoutMode } from '../types/layout';
import type { FullLayoutProps } from '../types/layout';
import { OneToOneFullLayout } from './OneToOneFullLayout';
import { MultiPartyFullLayout } from './MultiPartyFullLayout';
import { PreviewFullLayout } from './PreviewFullLayout';
import { MultiPartyLayout } from './MultiPartyLayout';
import MinimizedFullLayout from '../components/MiniSizeWindow';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';

/**
 * 完整布局管理器 - 根据布局模式选择合适的完整布局组件
 * 与原来的 LayoutManager 不同，这个管理器包含完整的布局逻辑（包括 Header 和 Controls）
 */
export const FullLayoutManager: React.FC<FullLayoutProps> = props => {
  const {
    videos,
    containerSize,
    prefixCls,
    renderVideoWindow,

    // 布局相关
    aspectRatio = 1,
    gap = 6,
    maxVideos,

    // 呼叫状态相关
    callMode = 'video',
    callStatus = 'idle',
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

    // 其他
    callDuration = '00:00:00',
    onMinimizedClick,
    ...restProps
  } = props;

  // 根据通话模式和状态选择布局
  const getLayoutMode = (): LayoutMode => {
    // 最小化状态优先
    if (isMinimized) {
      return LayoutMode.MINIMIZED;
    }

    // 预览模式：根据通话类型选择合适的布局
    if (isShowingPreview) {
      if (callMode === 'group') {
        return LayoutMode.MULTI_PARTY; // 多人视频通话预览使用多人布局
      } else {
        return LayoutMode.PREVIEW; // 1v1通话预览使用专门的预览布局
      }
    }

    // 根据通话模式选择布局
    if (callMode === 'group') {
      return LayoutMode.MULTI_PARTY; // 群组通话使用多人布局
    } else if (callMode === 'video' || callMode === 'audio') {
      return LayoutMode.ONE_TO_ONE; // 1v1通话使用一对一布局
    } else {
      return LayoutMode.ONE_TO_ONE; // 默认使用一对一布局
    }
  };

  const actualLayoutMode = getLayoutMode();
  // 根据布局模式渲染对应的完整布局组件
  switch (actualLayoutMode) {
    case LayoutMode.ONE_TO_ONE:
      return <OneToOneFullLayout {...props} />;

    case LayoutMode.MINIMIZED: {
      // 获取远程视频信息（用于1v1视频通话的最小化显示）
      const remoteVideo = videos.find(video => !video.isLocalVideo);

      return (
        <MinimizedFullLayout
          prefixCls={prefixCls}
          callDuration={callDuration}
          participantCount={videos.length}
          callType={callMode} // 直接传递callMode，保持group类型
          callStatus={
            callStatus === 'idle'
              ? 'connected'
              : callStatus === 'calling'
              ? 'connecting'
              : (callStatus as 'ringing' | 'connected' | 'connecting')
          } // 状态映射
          muted={muted}
          cameraEnabled={cameraEnabled}
          // 视频相关props（仅在1v1视频通话时使用）
          remoteVideoStream={remoteVideo?.stream}
          remoteVideoElement={remoteVideo?.videoElement}
          remoteUserAvatar={remoteVideo?.avatar}
          remoteUserNickname={remoteVideo?.nickname}
          onClick={onMinimizedClick}
          onMuteToggle={onMuteToggle}
          onCameraToggle={onCameraToggle}
          onHangup={onHangup}
        />
      );
    }

    case LayoutMode.VOICE_CALL:
      // TODO: 实现语音通话布局
      return <OneToOneFullLayout {...props} />;

    case LayoutMode.PREVIEW:
      return <PreviewFullLayout {...props} />;

    case LayoutMode.SCREEN_SHARE:
      // TODO: 实现屏幕共享布局
      return (
        <div className={`${prefixCls}-screen-share-full-layout`}>
          {/* 屏幕共享布局暂时使用多人布局 */}
          <MultiPartyLayout
            videos={videos}
            containerSize={containerSize}
            layoutOptions={{
              aspectRatio,
              gap,
              headerHeight: 60,
              controlsHeight: showControls ? 60 : 0,
              maxVideos,
            }}
            renderVideoWindow={renderVideoWindow}
            prefixCls={prefixCls}
          />
        </div>
      );

    case LayoutMode.MULTI_PARTY:
    default:
      return <MultiPartyFullLayout {...props} />;
  }
};
