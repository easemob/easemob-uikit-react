# CallKit VideoLayout 组件

VideoLayout 是一个专门为视频通话设计的响应式布局组件，可以自动适配不同数量的视频窗口。

## 功能特性

- 🎥 **智能布局**: 根据视频数量自动调整布局
  - 1-4 个视频：单排布局
  - 5-12 个视频：双排布局
  - 13+个视频：三排布局（最多 3 排）
- 📱 **响应式设计**: 自动适配不同屏幕尺寸
- ⭐ **正方形窗口**: 默认 1:1 宽高比，可自定义
- 🎨 **丰富功能**: 支持静音指示、昵称显示、本地视频标识等

## 基本使用

```tsx
import React from 'react';
import { VideoLayout, VideoWindowProps } from 'easemob-chat-uikit';

const VideoCallDemo = () => {
  const videos: VideoWindowProps[] = [
    {
      id: 'local',
      nickname: 'You',
      isLocalVideo: true,
      muted: true,
      stream: localMediaStream, // 本地视频流
    },
    {
      id: 'remote-1',
      nickname: 'Alice',
      muted: false,
      stream: remoteMediaStream1, // 远程视频流
    },
    {
      id: 'remote-2',
      nickname: 'Bob',
      muted: false,
      avatar: 'https://example.com/avatar.jpg', // 无视频流时显示头像
    },
  ];

  const handleVideoClick = (videoId: string) => {
    console.log('点击了视频:', videoId);
  };

  return (
    <div style={{ width: '800px', height: '600px' }}>
      <VideoLayout
        videos={videos}
        onVideoClick={handleVideoClick}
        aspectRatio={1} // 正方形
        gap={8} // 8px间距
      />
    </div>
  );
};
```

## 属性说明

### VideoLayoutProps

| 属性         | 类型                 | 默认值 | 说明               |
| ------------ | -------------------- | ------ | ------------------ |
| videos       | VideoWindowProps[]   | []     | 视频窗口配置数组   |
| className    | string               | -      | 自定义 CSS 类名    |
| style        | CSSProperties        | -      | 自定义样式         |
| prefix       | string               | -      | CSS 类名前缀       |
| maxVideos    | number               | -      | 最多显示的视频数量 |
| aspectRatio  | number               | 1      | 视频窗口宽高比     |
| gap          | number               | 8      | 视频窗口间距(px)   |
| onVideoClick | (id: string) => void | -      | 点击视频窗口回调   |

### VideoWindowProps

| 属性         | 类型                 | 必填 | 说明                       |
| ------------ | -------------------- | ---- | -------------------------- |
| id           | string               | ✅   | 视频窗口唯一标识           |
| stream       | MediaStream          | -    | 视频流对象                 |
| videoElement | HTMLVideoElement     | -    | 视频元素                   |
| muted        | boolean              | -    | 是否静音                   |
| nickname     | string               | -    | 用户昵称                   |
| avatar       | string               | -    | 头像 URL（无视频流时显示） |
| isLocalVideo | boolean              | -    | 是否为本地视频             |
| onVideoClick | (id: string) => void | -    | 点击回调                   |

## 布局规则

### 1-4 个视频（单排）

```
[1]
[1][2]
[1][2][3]
[1][2]
[3][4]
```

### 5-12 个视频（双排）

```
[1][2][3]
[4][5][6]

[1][2][3][4]
[5][6][7][8]
```

### 13+个视频（三排）

```
[1][2][3][4][5]
[6][7][8][9][10]
[11][12][13][14][15]
```

## 高级用法

### 自定义宽高比

```tsx
// 16:9 宽屏比例
<VideoLayout
  videos={videos}
  aspectRatio={16/9}
/>

// 4:3 比例
<VideoLayout
  videos={videos}
  aspectRatio={4/3}
/>
```

### 限制显示数量

```tsx
// 即使传入20个视频，也只显示前12个
<VideoLayout videos={allVideos} maxVideos={12} />
```

### 与 CallKit 集成

```tsx
import CallKit from 'chat-callkit';
import { VideoLayout } from 'easemob-chat-uikit';

const CallKitDemo = () => {
  const [videos, setVideos] = useState<VideoWindowProps[]>([]);

  useEffect(() => {
    // 监听CallKit事件，更新视频列表
    CallKit.on('user-published', user => {
      setVideos(prev => [
        ...prev,
        {
          id: user.uid,
          nickname: user.nickname,
          stream: user.videoTrack?.getMediaStreamTrack(),
        },
      ]);
    });

    CallKit.on('user-unpublished', user => {
      setVideos(prev => prev.filter(v => v.id !== user.uid));
    });
  }, []);

  return (
    <VideoLayout
      videos={videos}
      onVideoClick={id => {
        // 处理视频点击，例如切换到大窗口显示
        console.log('切换焦点视频:', id);
      }}
    />
  );
};
```

## 样式自定义

可以通过 CSS 覆盖默认样式：

```css
/* 自定义视频窗口样式 */
.cui-video-layout-window {
  border-radius: 12px !important;
  border: 3px solid #1890ff !important;
}

/* 自定义昵称样式 */
.cui-video-layout-nickname {
  background: rgba(24, 144, 255, 0.9) !important;
  color: white !important;
  font-weight: bold !important;
}

/* 自定义静音指示器 */
.cui-video-layout-muted-indicator {
  background: #ff4d4f !important;
}
```

## 注意事项

1. **性能优化**: 当视频数量较多时，建议使用 `maxVideos` 限制显示数量
2. **流媒体处理**: 确保正确管理 MediaStream 的生命周期，避免内存泄漏
3. **响应式布局**: 组件会自动适配容器大小，建议给容器设置明确的尺寸
4. **浏览器兼容**: 使用了 CSS Grid 和 aspect-ratio，需要现代浏览器支持
