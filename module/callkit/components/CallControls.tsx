import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config';
import { Icon } from '../../../component/icon/Icon';
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
}) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('call-controls');

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

  const handleMuteClick = () => {
    const newMuted = !muted;

    if (managed) {
      setInternalMuted(newMuted);
    }

    onMuteToggle?.(newMuted);
  };

  const handleCameraClick = () => {
    const newCameraEnabled = !cameraEnabled;

    if (managed) {
      setInternalCameraEnabled(newCameraEnabled);
    }

    onCameraToggle?.(newCameraEnabled);
  };

  const handleSpeakerClick = () => {
    const newSpeakerEnabled = !speakerEnabled;

    if (managed) {
      setInternalSpeakerEnabled(newSpeakerEnabled);
    }

    onSpeakerToggle?.(newSpeakerEnabled);
  };

  const handleScreenShareClick = () => {
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
            <Icon type="X_MARK_THICK" width={24} height={24} color={'#F9FAFA'} />
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
            <Icon
              type={muted ? 'MIC_OFF' : 'MIC_ON'}
              width={24}
              height={24}
              color={muted ? '#F9FAFA' : '#171A1C'}
            />
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
              <Icon
                type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'}
                color={cameraEnabled ? '#171A1C' : '#F9FAFA'}
                width={24}
                height={24}
              />
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
              <Icon
                type={callMode === 'video' ? 'VIDEO_CAMERA' : 'PHONE_PICK'}
                width={24}
                height={24}
                color={'#171A1C'}
              />
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
          })}
          onClick={handleMuteClick}
          title={muted ? '取消静音' : '静音'}
        >
          <Icon
            type={muted ? 'MIC_OFF' : 'MIC_ON'}
            width={24}
            height={24}
            color={muted ? '#F9FAFA' : '#171A1C'}
          />
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
            })}
            onClick={handleCameraClick}
            title={cameraEnabled ? '关闭摄像头' : '开启摄像头'}
          >
            <Icon
              type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'}
              color={cameraEnabled ? '#171A1C' : '#F9FAFA'}
              width={24}
              height={24}
            />
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
            })}
            onClick={handleSpeakerClick}
            title={speakerEnabled ? '关闭扬声器' : '开启扬声器'}
          >
            <Icon
              type={speakerEnabled ? 'SPEAKER_WAVE_2' : 'SPEAKER_X_MARK'}
              width={24}
              height={24}
              color={speakerEnabled ? '#171A1C' : '#F9FAFA'}
            />
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
          <Icon type="X_MARK_THICK" width={24} height={24} color={'#F9FAFA'} />
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>{'End'}</div>
      </div>
    </div>
  );
};

export default CallControls;
