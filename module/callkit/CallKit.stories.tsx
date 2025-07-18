import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CallKit from './CallKit';
import { LayoutMode } from './types/index';
import type { VideoWindowProps } from './types/index';

const meta = {
  title: 'Module/CallKit/CallKit',
  component: CallKit,
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
    layoutMode: {
      control: 'select',
      options: Object.values(LayoutMode),
    },
    aspectRatio: {
      control: { type: 'range', min: 0.5, max: 2, step: 0.1 },
    },
    gap: {
      control: { type: 'range', min: 0, max: 20, step: 2 },
    },
    maxVideos: {
      control: { type: 'number', min: 1, max: 20 },
    },
    resizable: {
      control: 'boolean',
    },
    minWidth: {
      control: { type: 'number', min: 200, max: 800, step: 50 },
    },
    minHeight: {
      control: { type: 'number', min: 150, max: 600, step: 50 },
    },
  },
} as Meta<typeof CallKit>;

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
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 预览模式（单个视频）
export const PreviewMode: Story = {
  args: {
    videos: mockVideos1,
    layoutMode: LayoutMode.PREVIEW,
    aspectRatio: 9 / 16, // 竖屏比例
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 1v1模式
export const OneToOneMode: Story = {
  args: {
    videos: mockVideos2,
    layoutMode: LayoutMode.ONE_TO_ONE,
    aspectRatio: 16 / 9, // 横屏比例
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 多人模式 - 4人
export const MultiParty4: Story = {
  args: {
    videos: mockVideos4,
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 多人模式 - 8人
export const MultiParty8: Story = {
  args: {
    videos: mockVideos8,
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 6,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 多人模式 - 12人
export const MultiParty12: Story = {
  args: {
    videos: mockVideos12,
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 4,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 无视频流
export const NoVideos: Story = {
  args: {
    videos: [],
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 自动布局模式（根据视频数量自动选择）
export const AutoLayout: Story = {
  args: {
    videos: mockVideos2, // 可以在控制面板中修改视频数量来测试自动布局
    layoutMode: LayoutMode.MULTI_PARTY, // 使用默认模式，让系统自动选择
    aspectRatio: 1,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 不显示控制按钮
export const NoControls: Story = {
  args: {
    videos: mockVideos4,
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 8,
    showControls: false,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
  },
};

// 自定义样式
export const CustomStyle: Story = {
  args: {
    videos: mockVideos4,
    layoutMode: LayoutMode.MULTI_PARTY,
    aspectRatio: 1,
    gap: 12,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
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
    layoutMode: LayoutMode.MULTI_PARTY,
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
    screenSharing: false,
    onResize: (width: number, height: number) => {
      console.log(`组件大小已调整为: ${width}x${height}`);
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
    layoutMode: LayoutMode.ONE_TO_ONE,
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
    screenSharing: false,
    onResize: (width: number, height: number) => {
      console.log(`1v1模式组件大小已调整为: ${width}x${height}`);
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
    layoutMode: LayoutMode.MAIN_VIDEO,
    aspectRatio: 16 / 9,
    gap: 8,
    showControls: true,
    muted: false,
    cameraEnabled: true,
    speakerEnabled: true,
    screenSharing: false,
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

// 最小化功能演示
export const MinimizedDemo = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00:01'); // 从 1 秒开始

  // 模拟通话时长更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => {
        const [hours, minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + 1;
        const newHours = Math.floor(totalSeconds / 3600);
        const newMinutes = Math.floor((totalSeconds % 3600) / 60);
        const newSeconds = totalSeconds % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMinutes
          .toString()
          .padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h3>最小化功能演示</h3>
      <p>点击 BOXES 按钮切换最小化状态，最小化后点击任何位置恢复正常布局</p>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={isMinimized}
            onChange={e => setIsMinimized(e.target.checked)}
          />
          最小化状态
        </label>
      </div>

      {/* 视频通话最小化演示 */}
      <div style={{ marginBottom: '30px' }}>
        <h4>视频通话最小化 (120x80)</h4>
        <CallKit
          videos={mockVideos1}
          managedPosition={true}
          initialPosition={{ left: 50, top: 50 }}
          initialSize={{ width: 600, height: 400 }}
          minimizedSize={{ width: 120, height: 80 }}
          isMinimized={isMinimized}
          callDuration={callDuration}
          onMinimizedToggle={setIsMinimized}
          resizable={true}
          draggable={true}
          showControls={true}
        />
      </div>

      {/* 语音通话最小化演示 */}
      <div style={{ marginBottom: '30px' }}>
        <h4>语音通话最小化 (120x80) - 深色主题</h4>
        <CallKit
          videos={[]} // 无视频，模拟语音通话
          managedPosition={true}
          initialPosition={{ left: 300, top: 50 }}
          initialSize={{ width: 600, height: 400 }}
          minimizedSize={{ width: 120, height: 80 }}
          isMinimized={isMinimized}
          callDuration={callDuration}
          onMinimizedToggle={setIsMinimized}
          resizable={true}
          draggable={true}
          showControls={true}
        />
      </div>
    </div>
  );
};
