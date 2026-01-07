import React from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../../header/Header';
import Button from '../../../component/button';
import { Icon } from '../../../component/icon/Icon';
import CallControls from '../components/CallControls';
import { MultiPartyLayout } from './MultiPartyLayout';
import type { FullLayoutProps } from '../types/layout';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';

/**
 * MultiParty 完整布局组件
 * 传统的上中下布局：Header + 多人视频网格 + Controls
 */
export const MultiPartyFullLayout: React.FC<FullLayoutProps> = ({
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
  callMode = 'group',
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
  onCameraFlip,
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

  // 🔧 新增：布局切换回调
  onLayoutModeChange,

  // 🔧 新增：网络质量相关状态
  networkQuality,

  // 🔧 新增：Icon 自定义配置
  customIcons,
  iconRenderer,
  // 🔧 新增：拖动状态
  isDragging,
  justFinishedDrag,
}) => {
  const { t } = useTranslation();

  // 🔧 计算Header显示的信息
  const getHeaderInfo = () => {
    if (isShowingPreview) {
      // 预览模式：显示群组邀请信息
      if (invitation && invitation.type === 'group') {
        return {
          avatar: invitation.groupAvatar,
          content: invitation.groupName || (t('callkit.groupCall.groupCall') as string),
          subtitle: t('callkit.groupCall.groupCallInvitation') as string,
        };
      } else {
        return {
          avatar: undefined,
          content: t('callkit.groupCall.groupCall') as string,
          subtitle: t('callkit.groupCall.groupCallInvitation') as string,
        };
      }
    } else {
      // 通话模式：显示群组信息
      const groupInfo = callInfo || {};
      const displayName = groupInfo.groupName;
      const displayAvatar = groupInfo.groupAvatar;

      return {
        avatar: displayAvatar,
        content: displayName,
        subtitle: callDuration,
      };
    }
  };

  const headerInfo = getHeaderInfo();

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

  // 处理最小化状态下的点击
  const handleMinimizedClick = () => {
    if (isMinimized) {
      onMinimizedClick?.();
    }
  };

  // 布局选项
  const layoutOptions = {
    aspectRatio,
    gap,
    headerHeight: 60,
    controlsHeight: showControls ? 60 : 0,
    maxVideos,
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

  // 增加一个清屏的state,默认是false
  const [isClearScreen, setIsClearScreen] = React.useState(false);
  // 点击主视频时切换清屏状态
  const handleClearScreen = (e: React.MouseEvent) => {
    // 拖动中或拖动刚结束时不触发清屏
    if (isDragging || justFinishedDrag) return;
    setIsClearScreen(!isClearScreen);
  };
  return (
    <div className={`${prefixCls}-multi-party-full-layout`} style={backgroundStyle}>
      {/* 最小化状态的特殊处理 */}
      {isMinimized ? (
        <div className={`${prefixCls}-minimized-controls`} onClick={handleMinimizedClick}>
          <MultiPartyLayout
            style={{
              display: 'none',
            }}
            videos={videos}
            containerSize={containerSize}
            layoutOptions={layoutOptions}
            renderVideoWindow={renderVideoWindow}
            prefixCls={prefixCls}
          />
        </div>
      ) : (
        <>
          {/* Header - 顶部固定 */}
          {!isClearScreen && (
            <div
              className={`${prefixCls}-header`}
              onClick={(e: React.MouseEvent) => handleClearScreen(e)}
            >
              <Header
                avatarSrc={headerInfo.avatar}
                avatarShape="square"
                content={headerInfo.content}
                style={{ color: 'white', padding: '0 16px' }}
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
                    {renderHeaderIcon('minimize', 'BOXES', {
                      width: 24,
                      height: 24,
                      color: '#F9FAFA',
                    })}
                  </Button>,
                  // 添加参与者按钮 - 只在通话中时显示
                  ...(callStatus === 'connected'
                    ? [
                        <Button
                          key="add-participant"
                          type="ghost"
                          size="small"
                          style={{ border: 'none' }}
                          onClick={onAddParticipant}
                        >
                          {renderHeaderIcon('addParticipant', 'PERSON_ADD', {
                            width: 24,
                            height: 24,
                            color: '#F9FAFA',
                          })}
                        </Button>,
                      ]
                    : []),
                ]}
              />
            </div>
          )}

          {/* 视频内容区域 - 中间弹性 */}
          <div
            className={`${prefixCls}-content`}
            onClick={(e: React.MouseEvent) => handleClearScreen(e)}
          >
            {videos.length === 0 ? (
              <div className={`${prefixCls}-empty`}>{/** 暂无视频流 */}</div>
            ) : (
              <MultiPartyLayout
                videos={videos}
                containerSize={containerSize}
                layoutOptions={layoutOptions}
                renderVideoWindow={renderVideoWindow}
                prefixCls={prefixCls}
                onLayoutModeChange={onLayoutModeChange}
              />
            )}
          </div>

          {/* Controls - 底部固定 */}
          {showControls && !isClearScreen && (
            <div className={`${prefixCls}-controls`}>
              <CallControls
                callMode={callMode}
                isPreview={isShowingPreview}
                isCaller={callStatus === 'calling'} // 🔧 新增：传递 isCaller 属性
                muted={muted}
                cameraEnabled={cameraEnabled}
                speakerEnabled={speakerEnabled}
                screenSharing={screenSharing}
                onMuteToggle={onMuteToggle}
                onCameraToggle={onCameraToggle}
                onSpeakerToggle={onSpeakerToggle}
                onCameraFlip={onCameraFlip}
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
        </>
      )}
    </div>
  );
};
