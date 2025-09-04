import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config';
import { Icon } from '../../../component/icon/Icon';
import { useTranslation } from 'react-i18next';
import type { CallControlsIconMap } from '../types/index';
import './CallControls.scss';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';

export interface CallControlsProps {
  className?: string;
  style?: React.CSSProperties;

  // 通话模式
  callMode?: 'video' | 'audio' | 'group';

  // 预览模式
  isPreview?: boolean;

  // 是否为主叫方 - 用于控制预览模式下是否显示接听按钮
  isCaller?: boolean;

  // 状态控制 - 支持受控和非受控模式
  muted?: boolean;
  cameraEnabled?: boolean;
  speakerEnabled?: boolean;
  screenSharing?: boolean;

  // 默认值（仅在非受控模式下使用）
  defaultMuted?: boolean;
  defaultCameraEnabled?: boolean;
  defaultSpeakerEnabled?: boolean;
  defaultScreenSharing?: boolean;

  // 回调事件
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;

  // 预览模式回调
  onPreviewAccept?: () => void;
  onPreviewReject?: () => void;

  // 控制是否使用内部状态管理
  managed?: boolean;

  // 🔧 新增：多人视频通话相关状态
  isGroupCall?: boolean; // 是否为群组通话
  hasParticipants?: boolean; // 是否有其他参与者加入
  isConnected?: boolean; // 是否已连接到通话

  // 🔧 新增：Icon 自定义配置
  customIcons?: CallControlsIconMap; // 自定义图标映射
  iconRenderer?: (
    iconType: string,
    defaultIcon: React.ReactElement,
    context?: any,
  ) => React.ReactElement; // 自定义图标渲染函数
}

const CallControls: React.FC<CallControlsProps> = ({
  className,
  style,
  callMode = 'video',
  isPreview = false,
  isCaller = false,
  muted: propMuted,
  cameraEnabled: propCameraEnabled,
  speakerEnabled: propSpeakerEnabled,
  screenSharing: propScreenSharing,
  defaultMuted = false,
  defaultCameraEnabled, // 🔧 将由组件内部根据通话模式计算
  defaultSpeakerEnabled = true,
  defaultScreenSharing = false,
  onMuteToggle,
  onCameraToggle,
  onSpeakerToggle,
  onScreenShareToggle,
  onHangup,
  onPreviewAccept,
  onPreviewReject,
  managed = false,
  // 🔧 新增：多人视频通话相关状态
  isGroupCall = false,
  hasParticipants = false,
  isConnected = false,
  // 🔧 新增：Icon 自定义配置
  customIcons,
  iconRenderer,
}) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('call-controls');
  const { t } = useTranslation();

  // 🔧 新增：操作状态管理，防止并发操作
  const [isTogglingCamera, setIsTogglingCamera] = React.useState(false);
  const [isTogglingMic, setIsTogglingMic] = React.useState(false);
  const [isTogglingSpeaker, setIsTogglingSpeaker] = React.useState(false);

  // 🔧 新增：防抖控制
  const debounceTimeRef = React.useRef<{
    camera?: NodeJS.Timeout;
    mic?: NodeJS.Timeout;
    speaker?: NodeJS.Timeout;
  }>({});

  // 清理防抖定时器
  React.useEffect(() => {
    return () => {
      Object.values(debounceTimeRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // 🔧 根据通话模式计算合适的默认摄像头状态
  const computedDefaultCameraEnabled = React.useMemo(() => {
    // 如果props中明确提供了defaultCameraEnabled，使用props值
    if (defaultCameraEnabled !== undefined) {
      return defaultCameraEnabled;
    }

    // 根据通话模式设置默认值
    if (isGroupCall || callMode === 'group') {
      // 群通话默认摄像头关闭
      logDebug('🔧 CallControls: 群通话模式，摄像头默认关闭');
      return false;
    } else {
      // 单人通话默认摄像头开启
      logDebug('🔧 CallControls: 单人通话模式，摄像头默认开启');
      return true;
    }
  }, [defaultCameraEnabled, isGroupCall, callMode]);

  // 🔧 新增：渲染图标的辅助函数
  const renderIcon = React.useCallback(
    (
      iconKey: keyof CallControlsIconMap,
      fallbackType: string,
      iconProps: { width?: number; height?: number; color?: string } = {},
    ) => {
      const { width = 24, height = 24, color } = iconProps;

      // 优先使用自定义图标
      const customIcon = customIcons?.[iconKey];
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

  // 内部状态管理
  const [internalMuted, setInternalMuted] = React.useState(defaultMuted);
  const [internalCameraEnabled, setInternalCameraEnabled] = React.useState(
    computedDefaultCameraEnabled,
  );
  const [internalSpeakerEnabled, setInternalSpeakerEnabled] = React.useState(defaultSpeakerEnabled);
  const [internalScreenSharing, setInternalScreenSharing] = React.useState(defaultScreenSharing);

  // 根据模式决定使用哪个状态
  const muted = managed ? internalMuted : propMuted ?? defaultMuted;
  const cameraEnabled = managed
    ? internalCameraEnabled
    : propCameraEnabled ?? computedDefaultCameraEnabled;
  const speakerEnabled = managed
    ? internalSpeakerEnabled
    : propSpeakerEnabled ?? defaultSpeakerEnabled;
  const screenSharing = managed ? internalScreenSharing : propScreenSharing ?? defaultScreenSharing;

  // 🔧 计算按钮是否应该禁用
  const shouldDisableControls = React.useMemo(() => {
    // 🔧 修改：预览模式下允许操作按钮（麦克风、摄像头等）
    // 只在特定条件下才禁用按钮

    // 多人视频通话中，如果未连接，禁用控制按钮
    if (isGroupCall && !isConnected && !isPreview) {
      logDebug('🔧 CallControls: 多人视频通话，未连接，禁用按钮', {
        isGroupCall,
        hasParticipants,
        isConnected,
        isPreview,
      });
      return true;
    }

    logDebug('🔧 CallControls: 按钮可用', {
      isPreview,
      isGroupCall,
      hasParticipants,
      isConnected,
      shouldDisableControls: false,
    });
    return false;
  }, [isPreview, isGroupCall, hasParticipants, isConnected]);

  // 🔧 新增：麦克风按钮单独的禁用逻辑
  const shouldDisableMuteButton = React.useMemo(() => {
    // 🔧 操作进行中时禁用
    if (isTogglingMic) {
      return true;
    }

    // 🔧 预览状态下禁用麦克风，确保必须发布audio轨道
    if (isPreview) {
      logDebug('🔧 CallControls: 预览状态，禁用麦克风按钮', {
        isPreview,
        isGroupCall,
        callMode,
        reason: '预览状态下必须发布audio轨道用于user-published事件',
      });
      return true;
    }

    // 🔧 群通话中，RTC未真正连接时禁用麦克风，确保必须发布audio轨道
    if (isGroupCall && !isConnected) {
      logDebug('🔧 CallControls: 群通话RTC未连接，禁用麦克风按钮', {
        isGroupCall,
        isConnected,
        isPreview,
        isCaller,
        reason: '群通话RTC连接前必须发布audio轨道用于user-published事件',
      });
      return true;
    }

    // 其他情况使用通用禁用逻辑
    return shouldDisableControls;
  }, [isPreview, isGroupCall, isConnected, shouldDisableControls, isTogglingMic]);

  // 🔧 新增：摄像头按钮单独的禁用逻辑
  const shouldDisableCameraButton = React.useMemo(() => {
    // 🔧 操作进行中时禁用
    if (isTogglingCamera) {
      return true;
    }

    // 摄像头在群通话中可以自由切换，不需要像麦克风那样强制禁用
    // 只在真正无法操作的情况下才禁用

    // 如果是群通话且不是预览模式且未连接，但允许摄像头操作
    if (isGroupCall && !isConnected && !isPreview) {
      logDebug('🔧 CallControls: 群通话等待连接，摄像头按钮允许操作', {
        isGroupCall,
        isConnected,
        isPreview,
        reason: '摄像头在群通话等待阶段可以自由切换',
      });
      return false; // 不禁用摄像头
    }

    // 其他情况使用通用禁用逻辑
    return shouldDisableControls;
  }, [isGroupCall, isConnected, isPreview, shouldDisableControls, isTogglingCamera]);

  // 🔧 修复：麦克风切换处理，添加防抖和状态管理
  const handleMuteClick = React.useCallback(() => {
    if (shouldDisableMuteButton || isTogglingMic) {
      logDebug('🔧 CallControls: 麦克风按钮被禁用或正在操作中，忽略点击', {
        shouldDisableMuteButton,
        isTogglingMic,
      });
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimeRef.current.mic) {
      clearTimeout(debounceTimeRef.current.mic);
    }

    // 设置防抖
    debounceTimeRef.current.mic = setTimeout(async () => {
      try {
        setIsTogglingMic(true);
        const newMuted = !muted;

        logDebug('🔧 CallControls: 开始切换麦克风状态', {
          from: muted,
          to: newMuted,
        });

        if (managed) {
          setInternalMuted(newMuted);
        }

        // 调用回调函数
        if (onMuteToggle) {
          onMuteToggle(newMuted);
          // 添加短暂延迟确保操作完成
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        logDebug('🔧 CallControls: 麦克风状态切换成功');
      } catch (error) {
        logError('🔧 CallControls: 麦克风状态切换失败:', error);

        // 操作失败时恢复状态
        if (managed) {
          setInternalMuted(muted);
        }
      } finally {
        setIsTogglingMic(false);
      }
    }, 200); // 200ms 防抖
  }, [shouldDisableMuteButton, isTogglingMic, muted, managed, onMuteToggle]);

  // 🔧 修复：摄像头切换处理，添加防抖和状态管理
  const handleCameraClick = React.useCallback(() => {
    if (shouldDisableCameraButton || isTogglingCamera) {
      logDebug('🔧 CallControls: 摄像头按钮被禁用或正在操作中，忽略点击', {
        shouldDisableCameraButton,
        isTogglingCamera,
        currentCameraEnabled: cameraEnabled,
        isPreview,
        isGroupCall,
        callMode,
      });
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimeRef.current.camera) {
      clearTimeout(debounceTimeRef.current.camera);
    }

    // 设置防抖
    debounceTimeRef.current.camera = setTimeout(async () => {
      try {
        setIsTogglingCamera(true);
        const newCameraEnabled = !cameraEnabled;

        logDebug('🔧 CallControls: 开始切换摄像头状态:', {
          from: cameraEnabled,
          to: newCameraEnabled,
        });

        if (managed) {
          setInternalCameraEnabled(newCameraEnabled);
        }

        // 调用回调函数
        if (onCameraToggle) {
          onCameraToggle(newCameraEnabled);
          // 添加短暂延迟确保操作完成
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        logDebug('🔧 CallControls: 摄像头状态切换成功');
      } catch (error) {
        logError('🔧 CallControls: 摄像头状态切换失败:', error);

        // 操作失败时恢复状态
        if (managed) {
          setInternalCameraEnabled(cameraEnabled);
        }
      } finally {
        setIsTogglingCamera(false);
      }
    }, 200); // 200ms 防抖
  }, [
    shouldDisableCameraButton,
    isTogglingCamera,
    cameraEnabled,
    managed,
    onCameraToggle,
    isPreview,
    isGroupCall,
    callMode,
  ]);

  // 🔧 修复：扬声器切换处理，添加防抖和状态管理
  const handleSpeakerClick = React.useCallback(() => {
    if (shouldDisableControls || isTogglingSpeaker) {
      logDebug('🔧 CallControls: 扬声器按钮被禁用或正在操作中，忽略点击', {
        shouldDisableControls,
        isTogglingSpeaker,
      });
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimeRef.current.speaker) {
      clearTimeout(debounceTimeRef.current.speaker);
    }

    // 设置防抖
    debounceTimeRef.current.speaker = setTimeout(async () => {
      try {
        setIsTogglingSpeaker(true);
        const newSpeakerEnabled = !speakerEnabled;

        logDebug('🔧 CallControls: 开始切换扬声器状态', {
          from: speakerEnabled,
          to: newSpeakerEnabled,
        });

        if (managed) {
          setInternalSpeakerEnabled(newSpeakerEnabled);
        }

        // 调用回调函数
        if (onSpeakerToggle) {
          onSpeakerToggle(newSpeakerEnabled);
          // 添加短暂延迟确保操作完成
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        logDebug('🔧 CallControls: 扬声器状态切换成功');
      } catch (error) {
        logError('🔧 CallControls: 扬声器状态切换失败:', error);

        // 操作失败时恢复状态
        if (managed) {
          setInternalSpeakerEnabled(speakerEnabled);
        }
      } finally {
        setIsTogglingSpeaker(false);
      }
    }, 100); // 100ms 防抖，扬声器操作相对简单
  }, [shouldDisableControls, isTogglingSpeaker, speakerEnabled, managed, onSpeakerToggle]);

  const handleScreenShareClick = () => {
    if (shouldDisableControls) return;

    const newScreenSharing = !screenSharing;

    if (managed) {
      setInternalScreenSharing(newScreenSharing);
    }

    onScreenShareToggle?.(newScreenSharing);
  };

  const handleHangupClick = () => {
    onHangup?.();
  };

  const handleAcceptClick = () => {
    onPreviewAccept?.();
  };

  const handleRejectClick = () => {
    onPreviewReject?.();
  };

  const rootClass = classNames(prefixCls, className);
  // 预览模式下的按钮布局
  if (isPreview) {
    return (
      <div className={rootClass} style={style}>
        {/* 主叫方显示挂断按钮，被叫方显示拒绝按钮 */}
        {!isCaller && (
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
              onClick={isCaller ? handleHangupClick : handleRejectClick}
              title={
                isCaller
                  ? (t('callkit.callcontrols.hangup') as string)
                  : (t('callkit.callcontrols.reject') as string)
              }
            >
              {renderIcon('reject', 'X_MARK_THICK', { width: 24, height: 24, color: '#F9FAFA' })}
            </button>
            <div className={classNames(`${prefixCls}-button-text`)}>
              {isCaller ? t('callkit.callcontrols.end') : t('callkit.callcontrols.reject')}
            </div>
          </div>
        )}

        {/* 麦克风按钮 - 群通话预览状态下禁用 */}
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]: !muted && !shouldDisableMuteButton && !isTogglingMic,
              [`${prefixCls}-button-disabled`]: muted || shouldDisableMuteButton || isTogglingMic,
              [`${prefixCls}-button-loading`]: isTogglingMic,
            })}
            onClick={handleMuteClick}
            title={
              isTogglingMic
                ? (t('callkit.callcontrols.micTogglingStatus') as string)
                : shouldDisableMuteButton
                ? (t('callkit.callcontrols.micDisabledInGroupPreview') as string)
                : muted
                ? (t('callkit.callcontrols.micOn') as string)
                : (t('callkit.callcontrols.micOff') as string)
            }
            disabled={shouldDisableMuteButton || isTogglingMic} // 🔧 操作中也禁用
          >
            {renderIcon(muted ? 'micOff' : 'micOn', muted ? 'MIC_OFF' : 'MIC_ON', {
              width: 24,
              height: 24,
              color: shouldDisableMuteButton ? '#171A1C' : muted ? '#F9FAFA' : '#171A1C',
            })}
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {muted ? t('callkit.callcontrols.mikeOff') : t('callkit.callcontrols.mikeOn')}
          </div>
        </div>

        {/* 摄像头按钮 - 只有视频通话时才显示，群通话等待阶段也可操作 */}
        {(callMode === 'video' || callMode === 'group') && (
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, {
                [`${prefixCls}-button-active`]:
                  cameraEnabled && !shouldDisableCameraButton && !isTogglingCamera,
                [`${prefixCls}-button-disabled`]:
                  !cameraEnabled || shouldDisableCameraButton || isTogglingCamera,
                [`${prefixCls}-button-loading`]: isTogglingCamera,
              })}
              onClick={handleCameraClick}
              title={
                isTogglingCamera
                  ? (t('callkit.callcontrols.cameraTogglingStatus') as string)
                  : shouldDisableCameraButton
                  ? (t('callkit.callcontrols.cameraDisabledTemporarily') as string)
                  : cameraEnabled
                  ? (t('callkit.callcontrols.cameraOn') as string)
                  : (t('callkit.callcontrols.cameraOff') as string)
              }
              disabled={shouldDisableCameraButton || isTogglingCamera} // 🔧 操作中也禁用
            >
              {renderIcon(
                cameraEnabled ? 'cameraOn' : 'cameraOff',
                cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH',
                {
                  width: 24,
                  height: 24,
                  color: cameraEnabled ? '#171A1C' : '#F9FAFA',
                },
              )}
            </button>
            <div className={classNames(`${prefixCls}-button-text`)}>
              {cameraEnabled
                ? t('callkit.callcontrols.cameraOnText')
                : t('callkit.callcontrols.cameraOffText')}
            </div>
          </div>
        )}

        {/* 接听/开始通话按钮 */}
        {!isCaller ? (
          // 被叫方显示接听按钮
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, `${prefixCls}-button-accept`)}
              onClick={handleAcceptClick}
              title={t('callkit.callcontrols.accept') as string}
            >
              {renderIcon('accept', 'PHONE_PICK', {
                width: 24,
                height: 24,
                color: '#F9FAFA',
              })}
            </button>
            <div className={classNames(`${prefixCls}-button-text`)}>
              {t('callkit.callcontrols.accept')}
            </div>
          </div>
        ) : (
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
              onClick={handleHangupClick}
              title={t('callkit.callcontrols.hangup') as string}
            >
              {renderIcon('reject', 'X_MARK_THICK', { width: 24, height: 24, color: '#F9FAFA' })}
            </button>
            <div className={classNames(`${prefixCls}-button-text`)}>
              {t('callkit.callcontrols.end')}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 正常通话模式下的按钮布局
  return (
    <div className={rootClass} style={style}>
      {/* 麦克风按钮 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, {
            [`${prefixCls}-button-active`]: !muted && !shouldDisableMuteButton && !isTogglingMic,
            [`${prefixCls}-button-disabled`]: muted || shouldDisableMuteButton || isTogglingMic,
            [`${prefixCls}-button-loading`]: isTogglingMic,
          })}
          onClick={handleMuteClick}
          title={
            isTogglingMic
              ? (t('callkit.callcontrols.micTogglingStatus') as string)
              : shouldDisableMuteButton
              ? (t('callkit.callcontrols.micDisabledInGroupPreview') as string)
              : muted
              ? (t('callkit.callcontrols.micOn') as string)
              : (t('callkit.callcontrols.micOff') as string)
          }
          disabled={shouldDisableMuteButton || isTogglingMic} // 🔧 操作中也禁用
        >
          {renderIcon(muted ? 'micOff' : 'micOn', muted ? 'MIC_OFF' : 'MIC_ON', {
            width: 24,
            height: 24,
            color: shouldDisableMuteButton ? '#171A1C' : muted ? '#F9FAFA' : '#171A1C',
          })}
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>
          {muted ? t('callkit.callcontrols.mikeOff') : t('callkit.callcontrols.mikeOn')}
        </div>
      </div>

      {/* 摄像头按钮 - 语音通话时不显示 */}
      {callMode !== 'audio' && (
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]:
                cameraEnabled && !shouldDisableCameraButton && !isTogglingCamera,
              [`${prefixCls}-button-disabled`]:
                !cameraEnabled || shouldDisableCameraButton || isTogglingCamera,
              [`${prefixCls}-button-loading`]: isTogglingCamera,
            })}
            onClick={handleCameraClick}
            title={
              isTogglingCamera
                ? (t('callkit.callcontrols.cameraTogglingStatus') as string)
                : shouldDisableCameraButton
                ? (t('callkit.callcontrols.cameraDisabledTemporarily') as string)
                : cameraEnabled
                ? (t('callkit.callcontrols.cameraOn') as string)
                : (t('callkit.callcontrols.cameraOff') as string)
            }
            disabled={shouldDisableCameraButton || isTogglingCamera} // 🔧 操作中也禁用
          >
            {renderIcon(
              cameraEnabled ? 'cameraOn' : 'cameraOff',
              cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH',
              {
                width: 24,
                height: 24,
                color: cameraEnabled ? '#171A1C' : '#F9FAFA',
              },
            )}
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {cameraEnabled
              ? t('callkit.callcontrols.cameraOnText')
              : t('callkit.callcontrols.cameraOffText')}
          </div>
        </div>
      )}

      {/* 屏幕共享按钮 */}
      {/* <button
        className={classNames(`${prefixCls}-button`, {
          [`${prefixCls}-button-active`]: !screenSharing,
          [`${prefixCls}-button-sharing`]: screenSharing,
        })}
        onClick={handleScreenShareClick}
        title={screenSharing ? '停止屏幕共享' : '屏幕共享'}
      >
        <Icon type="TRIANGLE_IN_RECTANGLE" width={24} height={24} color={'#fff'} />
      </button> */}

      {/* 扬声器按钮 - 所有通话类型都显示 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, {
            [`${prefixCls}-button-active`]: speakerEnabled && !isTogglingSpeaker,
            [`${prefixCls}-button-disabled`]: !speakerEnabled || isTogglingSpeaker,
            [`${prefixCls}-button-loading`]: isTogglingSpeaker,
          })}
          onClick={handleSpeakerClick}
          title={
            isTogglingSpeaker
              ? (t('callkit.callcontrols.speakerTogglingStatus') as string)
              : speakerEnabled
              ? (t('callkit.callcontrols.speakerOn') as string)
              : (t('callkit.callcontrols.speakerOff') as string)
          }
          disabled={shouldDisableControls || isTogglingSpeaker} // 🔧 操作中也禁用
        >
          {renderIcon(
            speakerEnabled ? 'speakerOn' : 'speakerOff',
            speakerEnabled ? 'SPEAKER_WAVE_2' : 'SPEAKER_X_MARK',
            { width: 24, height: 24, color: speakerEnabled ? '#171A1C' : '#F9FAFA' },
          )}
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>
          {speakerEnabled
            ? t('callkit.callcontrols.speakerOnText')
            : t('callkit.callcontrols.speakerOffText')}
        </div>
      </div>

      {/* 挂断按钮 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
          onClick={handleHangupClick}
          title={t('callkit.callcontrols.hangup') as string}
        >
          {renderIcon('hangup', 'X_MARK_THICK', {
            width: 24,
            height: 24,
            color: '#F9FAFA',
          })}
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>
          {t('callkit.callcontrols.end')}
        </div>
      </div>
    </div>
  );
};

export default CallControls;
