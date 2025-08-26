import React from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../../header/Header';
import Button from '../../../component/button';
import { Icon } from '../../../component/icon/Icon';
import CallControls from '../components/CallControls';
import type { FullLayoutProps } from '../types/layout';

/**
 * Preview 完整布局组件
 * 预览模式：Header + 预览视频 + Controls
 */
export const PreviewFullLayout: React.FC<FullLayoutProps> = ({
  videos,
  containerSize,
  prefixCls,
  renderVideoWindow,

  // 布局相关
  aspectRatio = 1,
  gap = 8,
  maxVideos,

  // 🔧 多人通话背景图片设置
  backgroundImage,

  // 呼叫状态相关
  callMode = 'video',
  callStatus = 'calling',
  isShowingPreview = true,

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
  const { t } = useTranslation();

  // 获取本地视频（预览模式下显示的视频）
  const localVideo = videos.find(video => video.isLocalVideo);

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
    console.log('🔧 计算Header显示的信息:', {
      callStatus,
      callInfo,
      invitation,
      callMode,
    });
    if (callStatus === 'calling') {
      // 主叫方预览模式：显示目标用户信息
      if (callInfo) {
        return {
          avatar: callInfo.remoteUserAvatar,
          content: callInfo.remoteUserNickname || callInfo.remoteUserId || '',
          subtitle: t('callkit.preview.connecting') as string,
        };
      } else {
        return {
          avatar: undefined,
          content: t('callkit.preview.previewMode') as string,
          subtitle: t('callkit.preview.connecting') as string,
        };
      }
    } else {
      // 被叫方预览模式：显示邀请人信息
      if (invitation) {
        return {
          avatar: invitation.callerAvatar,
          content: invitation.callerName || invitation.id || '',
          subtitle:
            callMode === 'video'
              ? (t('callkit.preview.videoCallInvitation') as string)
              : (t('callkit.preview.audioCallInvitation') as string),
        };
      } else {
        return {
          avatar: undefined,
          content: t('callkit.preview.previewMode') as string,
          subtitle:
            callMode === 'video'
              ? (t('callkit.preview.videoCallInvitation') as string)
              : (t('callkit.preview.audioCallInvitation') as string),
        };
      }
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
  console.log('有 localVideo -->', localVideo, callMode);
  return (
    <div className={`${prefixCls}-one-to-one-full-layout`} style={{ ...backgroundStyle }}>
      {/* 视频内容区域 - 占满整个容器 */}
      <div className={`${prefixCls}-video-content`}>
        {/* 预览视频作为主视频显示 */}
        {localVideo && callMode !== 'audio' && (
          <div className={`${prefixCls}-main-video`}>{renderVideoWindow(localVideo, 0)}</div>
        )}

        {/* 语音通话时的替代界面 */}
        {/* {callMode === 'audio' && (
          <div className={`${prefixCls}-audio-call-content`}>
            <div className={`${prefixCls}-audio-call-avatar`}>
              <div className={`${prefixCls}-avatar-placeholder`}>
                {localVideo?.nickname?.[0]?.toUpperCase() || '我'}
              </div>
            </div>
            <div className={`${prefixCls}-audio-call-info`}>
              <div className={`${prefixCls}-caller-name`}>{localVideo?.nickname || '我'}</div>
              <div className={`${prefixCls}-call-status`}>
                {callStatus === 'calling' ? '正在发起语音通话' : '语音通话邀请'}
              </div>
            </div>
          </div>
        )} */}

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
          avatarShape="square"
        />
      </div>

      {/* Controls - 浮动在视频内容之上 */}
      {showControls && !isMinimized && (
        <div className={`${prefixCls}-floating-controls`}>
          <CallControls
            callMode={callMode}
            isPreview={true}
            isCaller={callStatus === 'calling'}
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
            <div className={`${prefixCls}-minimized-time`}>{t('callkit.preview.preparing')}</div>
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
              <Icon type={muted ? 'MIC_OFF' : 'MIC_ON'} width={16} height={16} />
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
              <Icon
                type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'}
                width={16}
                height={16}
              />
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
              <Icon type="X_MARK_THICK" width={16} height={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
