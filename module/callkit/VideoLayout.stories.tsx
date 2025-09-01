import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import VideoLayout, { VideoLayoutProps, VideoWindowProps } from './VideoLayout';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from './utils/logger';

const description = {
  en: {
    videoLayout: 'Video Layout Component for video calls',
    videos: 'Array of video window configurations',
    maxVideos: 'Maximum number of videos to display',
    aspectRatio: 'Aspect ratio of video windows (1 = square)',
    gap: 'Gap between video windows in pixels',
    onVideoClick: 'Callback when a video window is clicked',
  },
  zh: {
    videoLayout: '视频通话布局组件',
    videos: '视频窗口配置数组',
    maxVideos: '最多显示的视频数量',
    aspectRatio: '视频窗口宽高比 (1 = 正方形)',
    gap: '视频窗口间距(像素)',
    onVideoClick: '点击视频窗口时的回调',
  },
};

// 模拟视频数据
const createMockVideos = (count: number): VideoWindowProps[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `video-${index + 1}`,
    nickname: `User ${index + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${index}`,
    muted: Math.random() > 0.7, // 随机静音
    isLocalVideo: index === 0, // 第一个视频是本地视频
  }));
};

export default {
  title: 'Module/CallKit/VideoLayout',
  component: VideoLayout,
  argTypes: {
    videos: {
      description: description[lang].videos,
      control: {
        type: 'object',
      },
    },
    maxVideos: {
      description: description[lang].maxVideos,
      control: {
        type: 'number',
        min: 1,
        max: 50,
      },
    },
    aspectRatio: {
      description: description[lang].aspectRatio,
      control: {
        type: 'number',
        min: 0.5,
        max: 2,
        step: 0.1,
      },
    },
    gap: {
      description: description[lang].gap,
      control: {
        type: 'number',
        min: 0,
        max: 20,
      },
    },
    onVideoClick: {
      description: description[lang].onVideoClick,
      action: 'video clicked',
    },
  },
  decorators: [
    Story => (
      <Provider
        initConfig={{
          appKey: 'test#test',
        }}
      >
        <div style={{ width: '800px', height: '600px', background: '#f0f0f0', padding: '20px' }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
} as Meta<typeof VideoLayout>;

const Template: StoryFn<VideoLayoutProps> = args => <VideoLayout {...args} />;

// 1个视频（单人通话）
export const SingleVideo = {
  render: Template,
  args: {
    videos: createMockVideos(1),
    aspectRatio: 1,
    gap: 8,
  },
};

// 2个视频
export const TwoVideos = {
  render: Template,
  args: {
    videos: createMockVideos(2),
    aspectRatio: 1,
    gap: 8,
  },
};

// 4个视频（1排布局）
export const FourVideos = {
  render: Template,
  args: {
    videos: createMockVideos(4),
    aspectRatio: 1,
    gap: 8,
  },
};

// 6个视频（2排布局）
export const SixVideos = {
  render: Template,
  args: {
    videos: createMockVideos(6),
    aspectRatio: 1,
    gap: 8,
  },
};

// 9个视频（2排布局）
export const NineVideos = {
  render: Template,
  args: {
    videos: createMockVideos(9),
    aspectRatio: 1,
    gap: 8,
  },
};

// 12个视频（2排布局最大值）
export const TwelveVideos = {
  render: Template,
  args: {
    videos: createMockVideos(12),
    aspectRatio: 1,
    gap: 8,
  },
};

// 15个视频（3排布局）
export const FifteenVideos = {
  render: Template,
  args: {
    videos: createMockVideos(15),
    aspectRatio: 1,
    gap: 8,
  },
};

// 21个视频（3排布局）
export const TwentyOneVideos = {
  render: Template,
  args: {
    videos: createMockVideos(21),
    aspectRatio: 1,
    gap: 6,
  },
};

// 自定义宽高比
export const CustomAspectRatio = {
  render: Template,
  args: {
    videos: createMockVideos(6),
    aspectRatio: 16 / 9, // 16:9 宽屏比例
    gap: 8,
  },
};

// 限制最大视频数量
export const MaxVideosLimit = {
  render: Template,
  args: {
    videos: createMockVideos(20), // 提供20个视频
    maxVideos: 12, // 但只显示12个
    aspectRatio: 1,
    gap: 8,
  },
};

// 空状态
export const EmptyState = {
  render: Template,
  args: {
    videos: [],
    aspectRatio: 1,
    gap: 8,
  },
};

// 带真实视频流的示例（模拟）
export const WithVideoStreams = {
  render: Template,
  args: {
    videos: [
      {
        id: 'local-video',
        nickname: 'You (Local)',
        isLocalVideo: true,
        muted: true,
        // 在实际使用中，这里会是真实的 MediaStream
        stream: undefined,
      },
      {
        id: 'remote-video-1',
        nickname: 'Alice',
        muted: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
      {
        id: 'remote-video-2',
        nickname: 'Bob',
        muted: false,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      },
      {
        id: 'remote-video-3',
        nickname: 'Charlie',
        muted: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      },
    ],
    aspectRatio: 1,
    gap: 8,
  },
};

// 5个视频（第二排居中对齐测试）
export const FiveVideosSecondRowCentered = {
  render: Template,
  args: {
    videos: createMockVideos(5),
    aspectRatio: 1,
    gap: 8,
  },
};

// 7个视频（第二排居中对齐测试）
export const SevenVideosSecondRowCentered = {
  render: Template,
  args: {
    videos: createMockVideos(7),
    aspectRatio: 1,
    gap: 8,
  },
};

// 13个视频（第三排居中对齐测试）
export const ThirteenVideosThirdRowCentered = {
  render: Template,
  args: {
    videos: createMockVideos(13),
    aspectRatio: 1,
    gap: 8,
  },
};

// 16个视频（第三排居中对齐测试）
export const SixteenVideosThirdRowCentered = {
  render: Template,
  args: {
    videos: createMockVideos(16),
    aspectRatio: 1,
    gap: 8,
  },
};

// 带控制按钮的完整示例
export const WithControls = {
  render: () => {
    const [muted, setMuted] = React.useState(false);
    const [cameraEnabled, setCameraEnabled] = React.useState(true);
    const [speakerEnabled, setSpeakerEnabled] = React.useState(true);
    const [screenSharing, setScreenSharing] = React.useState(false);

    return (
      <VideoLayout
        videos={createMockVideos(6)}
        aspectRatio={1}
        gap={8}
        showControls={true}
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
        onVideoClick={id => logDebug('点击视频:', id)}
      />
    );
  },
};

// 隐藏控制按钮
export const WithoutControls = {
  render: Template,
  args: {
    videos: createMockVideos(4),
    showControls: false,
    aspectRatio: 1,
    gap: 8,
  },
};
