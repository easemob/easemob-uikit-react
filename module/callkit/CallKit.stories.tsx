import React, { useState, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CallKit from './index';
import type { VideoWindowProps, CallKitRef } from './types/index';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from './utils/logger';

// Storybook 演示用的 Wrapper 组件
const CallKitDemo = (props: any) => {
  const callKitRef = useRef<CallKitRef>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 使用 showPreview 方法来显示 CallKit 预览模式
    const timer = setTimeout(() => {
      if (callKitRef.current) {
        // 如果有 videos 则模拟通话，否则显示预览
        if (props.videos && props.videos.length > 0) {
          // 使用 props 中指定的 callMode，如果没有则根据视频数量决定
          const callMode = props.callMode || (props.videos.length > 2 ? 'group' : 'video');
          callKitRef.current.showPreview(callMode);
          // 延迟一点再开始通话，确保预览模式设置了正确的 callMode
          setTimeout(() => {
            if (callKitRef.current) {
              callKitRef.current.startCall(props.videos);
            }
          }, 100);
        } else {
          callKitRef.current.showPreview(props.callMode || 'video');
        }
        setIsReady(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [props.videos, props.callMode]);

  return (
    <div
      style={{
        width: props.managedPosition === false ? '100%' : '748px',
        height: props.managedPosition === false ? '600px' : '523px',
        position: 'relative',
      }}
    >
      <CallKit ref={callKitRef} {...props} />
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#1a1a1a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
            zIndex: 1000,
          }}
        >
          Initializing CallKit Demo...
        </div>
      )}
    </div>
  );
};

const meta = {
  title: 'Module/CallKit',
  component: CallKitDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '重构后的CallKit组件，支持多种布局模式和可调整大小功能',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // 基础配置
    className: {
      control: 'text',
      description: '自定义CSS类名',
    },
    prefix: {
      control: 'text',
      description: 'CSS类名前缀',
    },

    // 布局相关
    maxVideos: {
      control: { type: 'number', min: 1, max: 20 },
      description: '最大显示视频数量',
    },
    aspectRatio: {
      control: { type: 'range', min: 0.5, max: 2, step: 0.1 },
      description: '视频窗口宽高比',
    },
    gap: {
      control: { type: 'range', min: 0, max: 20, step: 2 },
      description: '视频窗口间隙（像素）',
    },
    backgroundImage: {
      control: 'text',
      description: '多人通话背景图片URL',
    },

    // 通话模式
    callMode: {
      control: 'select',
      options: ['video', 'audio', 'group'],
      description: '通话模式，如果不提供则从邀请信息推断',
    },

    // 控制按钮相关
    showControls: {
      control: 'boolean',
      description: '是否显示控制按钮',
    },
    muted: {
      control: 'boolean',
      description: '是否静音',
    },
    cameraEnabled: {
      control: 'boolean',
      description: '是否启用摄像头',
    },
    speakerEnabled: {
      control: 'boolean',
      description: '是否启用扬声器',
    },

    // 铃声相关配置
    enableRingtone: {
      control: 'boolean',
      description: '是否启用铃声',
    },
    ringtoneVolume: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: '铃声音量，范围0-1',
    },
    ringtoneLoop: {
      control: 'boolean',
      description: '是否循环播放铃声',
    },
    outgoingRingtoneSrc: {
      control: 'text',
      description: '拨打电话铃声音频文件路径',
    },
    incomingRingtoneSrc: {
      control: 'text',
      description: '接听电话铃声音频文件路径',
    },

    // 可调整大小相关
    resizable: {
      control: 'boolean',
      description: '是否可调整大小',
    },
    minWidth: {
      control: { type: 'number', min: 200, max: 800, step: 50 },
      description: '最小宽度',
    },
    minHeight: {
      control: { type: 'number', min: 150, max: 600, step: 50 },
      description: '最小高度',
    },
    maxWidth: {
      control: { type: 'number', min: 800, max: 2000, step: 50 },
      description: '最大宽度',
    },
    maxHeight: {
      control: { type: 'number', min: 600, max: 1500, step: 50 },
      description: '最大高度',
    },

    // 拖动相关
    draggable: {
      control: 'boolean',
      description: '是否可拖动',
    },
    dragHandle: {
      control: 'text',
      description: 'CSS选择器，指定拖动手柄区域',
    },

    // 内置位置管理
    managedPosition: {
      control: 'boolean',
      description: '是否使用内置位置管理',
    },

    // 最小化相关
    isMinimized: {
      control: 'boolean',
      description: '最小化状态',
    },

    // 邀请相关配置
    acceptText: {
      control: 'text',
      description: '接听按钮文本',
    },
    rejectText: {
      control: 'text',
      description: '拒绝按钮文本',
    },
    showInvitationAvatar: {
      control: 'boolean',
      description: '是否显示邀请者头像',
    },
    showInvitationTimer: {
      control: 'boolean',
      description: '是否显示倒计时',
    },
    autoRejectTime: {
      control: { type: 'number', min: 10, max: 120, step: 5 },
      description: '自动拒绝时间（秒）',
    },

    // 群组成员选择相关
    userSelectTitle: {
      control: 'text',
      description: '用户选择弹窗标题（添加参与者时）',
    },
    initiateGroupCallTitle: {
      control: 'text',
      description: '发起群组通话时的弹窗标题',
    },

    // 日志管理配置
    logLevel: {
      control: 'select',
      options: ['error', 'warn', 'info', 'debug', 'verbose'],
      description: '日志级别',
    },
    enableLogging: {
      control: 'boolean',
      description: '是否启用日志输出',
    },
    logPrefix: {
      control: 'text',
      description: '日志前缀',
    },

    useRTCToken: {
      control: 'boolean',
      description: '是否使用RTC Token,默认true,测试环境可以设置为false',
    },

    // 音量阈值配置
    speakingVolumeThreshold: {
      control: { type: 'range', min: 1, max: 100, step: 1 },
      description: '说话指示器显示的音量阈值，范围1-100',
    },

    // 禁用复杂类型的控制器
    style: { control: false, description: '自定义内联样式' },
    chatClient: { control: false, description: '环信IM SDK实例' },
    groupMembers: { control: false, description: '群组成员列表' },
    userInfoProvider: { control: false, description: '用户信息提供器' },
    groupInfoProvider: { control: false, description: '群组信息提供器' },
    customIcons: { control: false, description: '自定义图标映射' },
    encoderConfig: { control: false, description: '视频编码配置' },
    invitationCustomContent: { control: false, description: '自定义邀请内容' },

    // 回调函数
    onVideoClick: { control: false, description: '视频点击回调' },
    onMuteToggle: { control: false, description: '静音切换回调' },
    onCameraToggle: { control: false, description: '摄像头切换回调' },
    onSpeakerToggle: { control: false, description: '扬声器切换回调' },
    onScreenShareToggle: { control: false, description: '屏幕共享切换回调' },
    onHangup: { control: false, description: '挂断回调' },
    onAddParticipant: { control: false, description: '添加参与者回调' },
    onInvitationAccept: { control: false, description: '接受邀请回调' },
    onInvitationReject: { control: false, description: '拒绝邀请回调' },
    onCallStart: { control: false, description: '通话开始回调' },
    onCallEnd: { control: false, description: '通话结束回调' },
    onLayoutModeChange: { control: false, description: '布局模式切换回调' },
    onResize: { control: false, description: '大小调整回调' },
    onDragStart: { control: false, description: '拖动开始回调' },
    onDrag: { control: false, description: '拖动回调' },
    onDragEnd: { control: false, description: '拖动结束回调' },
    onMinimizedChange: { control: false, description: '最小化状态变化回调' },
    onCallError: { control: false, description: 'SDK错误回调' },
    onReceivedCall: { control: false, description: '接收到通话回调' },
    onRemoteUserJoined: { control: false, description: '远程用户加入回调' },
    onRemoteUserLeft: { control: false, description: '远程用户离开回调' },
    onRtcEngineCreated: { control: false, description: 'RTC引擎创建回调' },
    onEndCallWithReason: { control: false, description: '带原因的通话结束回调' },
  },
} as Meta<typeof CallKitDemo>;

export default meta;
type Story = any;

// 创建模拟视频数据
const createMockVideo = (id: string, nickname: string, isLocal = false): VideoWindowProps => ({
  id,
  nickname,
  isLocalVideo: isLocal,
  muted: Math.random() > 0.7, // 30%概率静音
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
});

const mockVideos1: VideoWindowProps[] = [createMockVideo('local', '我', true)];

const mockVideos2: VideoWindowProps[] = [
  createMockVideo('remote1', 'Alice'),
  createMockVideo('local', '我', true),
];

const mockVideos4: VideoWindowProps[] = [
  createMockVideo('remote1', 'Alice'),
  createMockVideo('remote2', 'Bob'),
  createMockVideo('remote3', 'Charlie'),
  createMockVideo('local', '我', true),
];

const mockVideos8: VideoWindowProps[] = [
  createMockVideo('remote1', 'Alice'),
  createMockVideo('remote2', 'Bob'),
  createMockVideo('remote3', 'Charlie'),
  createMockVideo('remote4', 'David'),
  createMockVideo('remote5', 'Eve'),
  createMockVideo('remote6', 'Frank'),
  createMockVideo('remote7', 'Grace'),
  createMockVideo('local', '我', true),
];

const mockVideos12: VideoWindowProps[] = [
  ...mockVideos8,
  createMockVideo('remote8', 'Henry'),
  createMockVideo('remote9', 'Ivy'),
  createMockVideo('remote10', 'Jack'),
  createMockVideo('remote11', 'Kate'),
];

// 默认故事
export const Default: Story = {
  args: {
    videos: mockVideos4,
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    // 添加这些属性来强制显示CallKit
    managedPosition: false, // 不使用固定定位，适配Storybook
  },
};

// 多人模式 - 4人
export const MultiParty4: Story = {
  args: {
    videos: mockVideos4,
    callMode: 'group', // 明确指定为群组通话模式
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    managedPosition: false,
  },
};

// 多人模式 - 8人
export const MultiParty8: Story = {
  args: {
    videos: mockVideos8,
    callMode: 'group', // 明确指定为群组通话模式
    aspectRatio: 1,
    gap: 6,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    managedPosition: false,
  },
};

// 多人模式 - 12人
export const MultiParty12: Story = {
  args: {
    videos: mockVideos12,
    callMode: 'group', // 明确指定为群组通话模式
    aspectRatio: 1,
    gap: 4,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    managedPosition: false,
  },
};

// 无视频流
export const NoVideos: Story = {
  args: {
    videos: [],
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
  },
};

// 自动布局模式（根据视频数量自动选择）
export const AutoLayout: Story = {
  args: {
    videos: mockVideos2, // 可以在控制面板中修改视频数量来测试自动布局
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
  },
};

// 不显示控制按钮
export const NoControls: Story = {
  args: {
    videos: mockVideos4,
    aspectRatio: 1,
    gap: 8,
    showControls: false,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
  },
};

// 自定义样式
export const CustomStyle: Story = {
  args: {
    videos: mockVideos4,
    aspectRatio: 1,
    gap: 12,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    style: {
      border: '2px solid #1890ff',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    },
  },
};

// 可调整大小模式
export const ResizableMode: Story = {
  args: {
    videos: mockVideos4,
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    resizable: true,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 1200,
    maxHeight: 800,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    onResize: (width: number, height: number) => {
      logDebug(`组件大小已调整为: ${width}x${height}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '启用可调整大小功能，鼠标移动到组件边缘（8px范围内）时显示resize光标，可以拖拽调整大小。支持设置最小和最大尺寸限制。',
      },
    },
  },
};

// 1v1可调整大小模式
export const ResizableOneToOne: Story = {
  args: {
    videos: mockVideos2,
    callMode: 'video', // 明确指定为1v1视频通话模式
    aspectRatio: 16 / 9,
    gap: 8,
    showControls: true,
    resizable: true,
    minWidth: 480,
    minHeight: 320,
    maxWidth: 1920,
    maxHeight: 1080,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    onResize: (width: number, height: number) => {
      logDebug(`1v1模式组件大小已调整为: ${width}x${height}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: '1v1模式下的可调整大小功能，适合用于弹窗或浮动窗口场景。',
      },
    },
  },
};

// 主视频布局演示
export const MainVideoLayout: Story = {
  args: {
    videos: mockVideos8,
    callMode: 'group', // 明确指定为群组通话模式
    aspectRatio: 16 / 9,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    managedPosition: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '主视频布局模式：点击任意视频窗口，该视频会变大显示在上方，其他视频变小显示在下方一排并支持滑动。点击返回按钮可切换回网格布局。',
      },
    },
  },
};
