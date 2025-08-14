import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config';
import { Icon } from '../../../component/icon/Icon';
import type { CallControlsIconMap } from '../types/index';
import './CallControls.scss';

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
  defaultCameraEnabled = true,
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
  const [internalCameraEnabled, setInternalCameraEnabled] = React.useState(defaultCameraEnabled);
  const [internalSpeakerEnabled, setInternalSpeakerEnabled] = React.useState(defaultSpeakerEnabled);
  const [internalScreenSharing, setInternalScreenSharing] = React.useState(defaultScreenSharing);

  // 根据模式决定使用哪个状态
  const muted = managed ? internalMuted : propMuted ?? defaultMuted;
  const cameraEnabled = managed ? internalCameraEnabled : propCameraEnabled ?? defaultCameraEnabled;
  const speakerEnabled = managed
    ? internalSpeakerEnabled
    : propSpeakerEnabled ?? defaultSpeakerEnabled;
  const screenSharing = managed ? internalScreenSharing : propScreenSharing ?? defaultScreenSharing;

  // 🔧 计算按钮是否应该禁用
  const shouldDisableControls = React.useMemo(() => {
    // 预览模式下禁用所有控制按钮（除了挂断/拒绝和接听）
    if (isPreview) {
      console.log('🔧 CallControls: 预览模式，禁用按钮');
      return true;
    }

    // 多人视频通话中，如果未连接，禁用控制按钮
    if (isGroupCall && !isConnected) {
      console.log('🔧 CallControls: 多人视频通话，未连接，禁用按钮', {
        isGroupCall,
        hasParticipants,
        isConnected,
      });
      return true;
    }

    console.log('🔧 CallControls: 按钮可用', {
      isPreview,
      isGroupCall,
      hasParticipants,
      isConnected,
      shouldDisableControls: false,
    });
    return false;
  }, [isPreview, isGroupCall, hasParticipants, isConnected]);

  const handleMuteClick = () => {
    if (shouldDisableControls) return;

    const newMuted = !muted;

    if (managed) {
      setInternalMuted(newMuted);
    }

    onMuteToggle?.(newMuted);
  };

  const handleCameraClick = () => {
    if (shouldDisableControls) return;

    const newCameraEnabled = !cameraEnabled;

    if (managed) {
      setInternalCameraEnabled(newCameraEnabled);
    }

    onCameraToggle?.(newCameraEnabled);
  };

  const handleSpeakerClick = () => {
    if (shouldDisableControls) return;

    const newSpeakerEnabled = !speakerEnabled;

    if (managed) {
      setInternalSpeakerEnabled(newSpeakerEnabled);
    }

    onSpeakerToggle?.(newSpeakerEnabled);
  };

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
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
            onClick={isCaller ? handleHangupClick : handleRejectClick}
            title={isCaller ? '挂断' : '拒绝'}
          >
            {renderIcon('reject', 'X_MARK_THICK', { width: 24, height: 24, color: '#F9FAFA' })}
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {isCaller ? 'End' : 'Reject'}
          </div>
        </div>

        {/* 麦克风按钮 - 预览模式下禁用 */}
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]: !muted,
              [`${prefixCls}-button-disabled`]: muted,
              [`${prefixCls}-button-preview-disabled`]: true, // 预览模式下禁用
            })}
            onClick={handleMuteClick}
            title={muted ? '取消静音' : '静音'}
            disabled={true} // 预览模式下禁用点击
          >
            {renderIcon(muted ? 'micOff' : 'micOn', muted ? 'MIC_OFF' : 'MIC_ON', {
              width: 24,
              height: 24,
              color: muted ? '#F9FAFA' : '#171A1C',
            })}
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {muted ? 'Mike off' : 'Mike on'}
          </div>
        </div>

        {/* 摄像头按钮 - 只有视频通话时才显示，预览模式下禁用 */}
        {callMode === 'video' && (
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, {
                [`${prefixCls}-button-active`]: cameraEnabled,
                [`${prefixCls}-button-disabled`]: !cameraEnabled,
                [`${prefixCls}-button-preview-disabled`]: true, // 预览模式下禁用
              })}
              onClick={handleCameraClick}
              title={cameraEnabled ? '关闭摄像头' : '开启摄像头'}
              disabled={true} // 预览模式下禁用点击
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
              {cameraEnabled ? 'Camera on' : 'Camera off'}
            </div>
          </div>
        )}

        {/* 接听按钮 - 只有被叫方才显示 */}
        {!isCaller && (
          <div className={classNames(`${prefixCls}-button-group`)}>
            <button
              className={classNames(`${prefixCls}-button`, `${prefixCls}-button-accept`)}
              onClick={handleAcceptClick}
              title="接听"
            >
              {renderIcon('accept', callMode === 'video' ? 'VIDEO_CAMERA' : 'PHONE_PICK', {
                width: 24,
                height: 24,
                color: '#171A1C',
              })}
            </button>
            <div className={classNames(`${prefixCls}-button-text`)}>{'Accept'}</div>
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
            [`${prefixCls}-button-active`]: !muted,
            [`${prefixCls}-button-disabled`]: muted,
            [`${prefixCls}-button-preview-disabled`]: shouldDisableControls, // 🔧 根据条件禁用
          })}
          onClick={handleMuteClick}
          title={muted ? '取消静音' : '静音'}
          disabled={shouldDisableControls} // 🔧 根据条件禁用点击
        >
          {renderIcon(muted ? 'micOff' : 'micOn', muted ? 'MIC_OFF' : 'MIC_ON', {
            width: 24,
            height: 24,
            color: muted ? '#F9FAFA' : '#171A1C',
          })}
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>
          {muted ? 'Mike off' : 'Mike on'}
        </div>
      </div>

      {/* 摄像头按钮 - 语音通话时不显示 */}
      {callMode !== 'audio' && (
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]: cameraEnabled,
              [`${prefixCls}-button-disabled`]: !cameraEnabled,
              [`${prefixCls}-button-preview-disabled`]: shouldDisableControls, // 🔧 根据条件禁用
            })}
            onClick={handleCameraClick}
            title={cameraEnabled ? '关闭摄像头' : '开启摄像头'}
            disabled={shouldDisableControls} // 🔧 根据条件禁用点击
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
            {cameraEnabled ? 'Camera on' : 'Camera off'}
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

      {/* 扬声器按钮 - 语音通话时不显示 */}
      {callMode !== 'audio' && (
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]: speakerEnabled,
              [`${prefixCls}-button-disabled`]: !speakerEnabled,
              [`${prefixCls}-button-preview-disabled`]: shouldDisableControls, // 🔧 根据条件禁用
            })}
            onClick={handleSpeakerClick}
            title={speakerEnabled ? '关闭扬声器' : '开启扬声器'}
            disabled={shouldDisableControls} // 🔧 根据条件禁用点击
          >
            {renderIcon(
              speakerEnabled ? 'speakerOn' : 'speakerOff',
              speakerEnabled ? 'SPEAKER_WAVE_2' : 'SPEAKER_X_MARK',
              { width: 24, height: 24, color: speakerEnabled ? '#171A1C' : '#F9FAFA' },
            )}
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {speakerEnabled ? 'Speaker on' : 'Speaker off'}
          </div>
        </div>
      )}

      {/* 挂断按钮 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
          onClick={handleHangupClick}
          title="挂断"
        >
          {renderIcon('hangup', 'X_MARK_THICK', {
            width: 24,
            height: 24,
            color: '#F9FAFA',
          })}
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>{'End'}</div>
      </div>
    </div>
  );
};

export default CallControls;
