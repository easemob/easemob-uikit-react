import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import CallControls from './CallControls';

export default {
  title: 'module/CallKit/CallControls',
  component: CallControls,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '视频通话控制按钮组件，包含麦克风、摄像头、挂断、屏幕共享、扬声器控制。',
      },
    },
  },
  argTypes: {
    muted: {
      control: 'boolean',
      description: '是否静音',
    },
    cameraEnabled: {
      control: 'boolean',
      description: '是否开启摄像头',
    },
    speakerEnabled: {
      control: 'boolean',
      description: '是否开启扬声器',
    },
    screenSharing: {
      control: 'boolean',
      description: '是否正在屏幕共享',
    },
    onMuteToggle: {
      action: 'mute toggled',
      description: '静音切换回调',
    },
    onCameraToggle: {
      action: 'camera toggled',
      description: '摄像头切换回调',
    },
    onSpeakerToggle: {
      action: 'speaker toggled',
      description: '扬声器切换回调',
    },
    onScreenShareToggle: {
      action: 'screen share toggled',
      description: '屏幕共享切换回调',
    },
    onHangup: {
      action: 'hangup',
      description: '挂断回调',
    },
  },
} as Meta<typeof CallControls>;

import { CallControlsProps } from './CallControls';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';

const Template: StoryFn<CallControlsProps> = args => (
  <div
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px',
      borderRadius: '8px',
    }}
  >
    <CallControls {...args} />
  </div>
);

// 默认状态
export const Default = {
  render: Template,
  args: {
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 静音状态
export const Muted = {
  render: Template,
  args: {
    muted: true,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 摄像头关闭
export const CameraOff = {
  render: Template,
  args: {
    muted: false,
    cameraEnabled: false,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 屏幕共享中
export const ScreenSharing = {
  render: Template,
  args: {
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: true,
  },
};

// 所有功能关闭
export const AllDisabled = {
  render: Template,
  args: {
    muted: true,
    cameraEnabled: false,
    speakerEnabled: false,
    screenSharing: false,
  },
};

// 交互式演示
export const Interactive = {
  render: () => {
    const [muted, setMuted] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [speakerEnabled, setSpeakerEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          <h3>交互式演示</h3>
          <p>点击按钮查看状态变化</p>
        </div>
        <CallControls
          muted={muted}
          cameraEnabled={cameraEnabled}
          speakerEnabled={speakerEnabled}
          screenSharing={screenSharing}
          onMuteToggle={newMuted => {
            setMuted(newMuted);
            logDebug('静音状态:', newMuted);
          }}
          onCameraToggle={enabled => {
            setCameraEnabled(enabled);
            logDebug('摄像头状态:', enabled);
          }}
          onSpeakerToggle={enabled => {
            setSpeakerEnabled(enabled);
            logDebug('扬声器状态:', enabled);
          }}
          onScreenShareToggle={sharing => {
            setScreenSharing(sharing);
            logDebug('屏幕共享状态:', sharing);
          }}
          onHangup={() => {
            logDebug('挂断通话');
            alert('通话已挂断');
          }}
        />
        <div style={{ color: 'white', fontSize: '14px', textAlign: 'center' }}>
          <div>静音: {muted ? '是' : '否'}</div>
          <div>摄像头: {cameraEnabled ? '开启' : '关闭'}</div>
          <div>扬声器: {speakerEnabled ? '开启' : '关闭'}</div>
          <div>屏幕共享: {screenSharing ? '进行中' : '未开启'}</div>
        </div>
      </div>
    );
  },
};

// 移动端尺寸演示
export const MobileSize = {
  render: Template,
  args: {
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
