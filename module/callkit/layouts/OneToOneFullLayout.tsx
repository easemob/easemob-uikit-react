import React from 'react';
import { Header } from '../../header/Header';
import Button from '../../../component/button';
import { Icon } from '../../../component/icon/Icon';
import CallControls from '../components/CallControls';
import type { FullLayoutProps } from '../types/layout';
import { useVideoAspectRatio } from '../hooks/useVideoAspectRatio';

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

  // 🔧 新增：多人视频通话相关状态
  isGroupCall = false,
  hasParticipants = false,
  isConnected = false,

  // 🔧 新增：网络质量相关状态
  networkQuality,

  // 🔧 新增：Icon 自定义配置
  customIcons,
  iconRenderer,
}) => {
  // 🔧 添加视频位置互换状态
  const [isLocalVideoMain, setIsLocalVideoMain] = React.useState(false);
  // 分离远程视频和本地视频
  const remoteVideo = videos.find(video => !video.isLocalVideo);
  const localVideo = videos.find(video => video.isLocalVideo);

  // 🔧 检测本地视频流的实际分辨率
  const { aspectRatio: localVideoAspectRatio } = useVideoAspectRatio(localVideo?.stream);

  // 🔧 动态计算画中画视频的高度
  const pipVideoStyle = React.useMemo(() => {
    const baseWidth = 200; // 基础宽度，实际会通过CSS clamp限制
    const calculatedHeight = baseWidth / localVideoAspectRatio;

    // 限制最小和最大高度
    const minHeight = 67;
    const maxHeight = 200;
    const finalHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));

    console.log('🎬 画中画视频尺寸计算:', {
      aspectRatio: localVideoAspectRatio,
      calculatedHeight,
      finalHeight,
      baseWidth,
    });

    return {
      height: `${finalHeight}px`,
    };
  }, [localVideoAspectRatio]);

  // 🔧 新增：渲染 Header 图标的辅助函数
  const renderHeaderIcon = React.useCallback(
    (
      iconKey: string,
      fallbackType: string,
      iconProps: { width?: number; height?: number; color?: string } = {},
    ) => {
      const { width = 24, height = 24, color } = iconProps;

      // 优先使用自定义图标
      const customIcon = customIcons?.header?.[iconKey];
      if (customIcon) {
        if (React.isValidElement(customIcon)) {
          const elementProps = customIcon.props as any;
          return React.cloneElement(customIcon, { width, height, color, ...(elementProps || {}) });
        } else if (typeof customIcon === 'function') {
          const CustomIconComponent = customIcon as React.ComponentType<any>;
          return <CustomIconComponent width={width} height={height} color={color} />;
        }
      }

      // 默认图标
      const defaultIcon = (
        <Icon type={fallbackType as any} width={width} height={height} color={color} />
      );

      // 使用自定义渲染函数
      if (iconRenderer) {
        return iconRenderer(iconKey, defaultIcon, { iconKey, fallbackType, iconProps });
      }

      return defaultIcon;
    },
    [customIcons, iconRenderer],
  );

  // 🔧 计算Header显示的信息
  const getHeaderInfo = () => {
    if (isShowingPreview) {
      // 预览模式：显示邀请人信息
      if (invitation) {
        return {
          avatar: invitation.callerAvatar,
          content: invitation.callerName || '',
          subtitle: callMode === 'video' ? '视频通话邀请 - 连接中...' : '语音通话邀请 - 连接中...',
        };
      } else {
        return {
          avatar: undefined,
          content: '预览模式',
          subtitle: callMode === 'video' ? '视频通话预览 - 连接中...' : '语音通话预览 - 连接中...',
        };
      }
    } else {
      // 通话模式：根据当前主视频显示相应信息
      if (isLocalVideoMain) {
        // 本地视频在主窗口时，显示本地用户信息
        return {
          avatar: localVideo?.avatar,
          content: localVideo?.nickname || '我',
          subtitle: callDuration,
        };
      } else {
        // 远程视频在主窗口时，显示远程用户信息
        const remoteUserInfo = callInfo || {};
        const displayName =
          remoteUserInfo.remoteUserNickname ||
          remoteVideo?.nickname ||
          remoteUserInfo.remoteUserId ||
          '';
        const displayAvatar = remoteUserInfo.remoteUserAvatar || remoteVideo?.avatar;

        return {
          avatar: displayAvatar,
          content: displayName,
          subtitle: callDuration,
        };
      }
    }
  };

  const headerInfo = getHeaderInfo();

  // 🔧 处理视频点击，实现位置互换
  const handleVideoClick = React.useCallback(
    (videoId: string) => {
      if (isShowingPreview || callMode === 'audio') {
        return; // 预览模式和语音通话时不处理视频点击
      }

      console.log('🎬 视频点击:', videoId, '当前状态:', { isLocalVideoMain });

      // 切换视频位置
      setIsLocalVideoMain(prev => !prev);
    },
    [isShowingPreview, callMode],
  );

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
    <div className={`${prefixCls}-one-to-one-full-layout`} style={{ ...backgroundStyle }}>
      {/* 视频内容区域 - 占满整个容器 */}
      <div className={`${prefixCls}-video-content`}>
        {/* 预览模式：本地视频作为主视频显示 */}
        {isShowingPreview && localVideo && callMode !== 'audio' && (
          <div className={`${prefixCls}-main-video`}>{renderVideoWindow(localVideo, 0)}</div>
        )}

        {/* 正常通话模式：主视频 - 根据状态决定显示本地或远程视频 */}
        {!isShowingPreview && callMode !== 'audio' && (
          <>
            {/* 主视频窗口 */}
            {isLocalVideoMain
              ? localVideo && (
                  <div
                    className={`${prefixCls}-main-video`}
                    // onClick={() => handleVideoClick(localVideo.id)}
                    // style={{ cursor: 'pointer' }}
                  >
                    {renderVideoWindow(localVideo, 0)}
                  </div>
                )
              : remoteVideo && (
                  <div
                    className={`${prefixCls}-main-video`}
                    // onClick={() => handleVideoClick(remoteVideo.id)}
                    // style={{ cursor: 'pointer' }}
                  >
                    {renderVideoWindow(remoteVideo, 0)}
                  </div>
                )}

            {/* 画中画视频窗口 */}
            {!isMinimized && (
              <>
                {isLocalVideoMain
                  ? remoteVideo && (
                      <div
                        className={`${prefixCls}-pip-video`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleVideoClick(remoteVideo.id)}
                      >
                        {renderVideoWindow(remoteVideo, 1)}
                      </div>
                    )
                  : localVideo && (
                      <div
                        className={`${prefixCls}-pip-video`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleVideoClick(localVideo.id)}
                      >
                        {renderVideoWindow(localVideo, 1)}
                      </div>
                    )}
              </>
            )}
          </>
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
          avatarShape="square"
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
              {renderHeaderIcon(
                isFullscreen ? 'exitFullscreen' : 'fullscreen',
                isFullscreen ? 'CHEVRON_4_CLUSTER' : 'CHEVRON_4_ALL_AROUND',
                { width: 24, height: 24, color: '#F9FAFA' },
              )}
            </Button>,
            <Button
              key="minimize"
              type="ghost"
              size="small"
              style={{ border: 'none' }}
              onClick={onMinimizedToggle}
            >
              {renderHeaderIcon('minimize', 'BOXES', { width: 24, height: 24, color: '#F9FAFA' })}
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
            // 🔧 新增：多人视频通话相关状态
            isGroupCall={isGroupCall}
            hasParticipants={hasParticipants}
            isConnected={isConnected}
            // 🔧 新增：Icon 自定义配置
            customIcons={customIcons?.controls}
            iconRenderer={iconRenderer}
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
