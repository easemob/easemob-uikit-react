# CallKit 新布局系统

CallKit 组件采用了全新的布局系统架构，支持多种布局模式和完整的用户界面。

## 架构概览

### 核心组件

1. **CallKit** - 主组件，负责状态管理和功能协调
2. **FullLayoutManager** - 完整布局管理器，根据模式选择对应的布局组件
3. **布局组件** - 各种布局模式的具体实现

### 布局模式

```typescript
enum LayoutMode {
  ONE_TO_ONE = 'one-to-one', // 1v1 画中画布局
  MULTI_PARTY = 'multi-party', // 多人网格布局
  PREVIEW = 'preview', // 设备预览布局
  MINIMIZED = 'minimized', // 最小化布局
  VOICE_CALL = 'voice-call', // 语音通话布局（待实现）
  SCREEN_SHARE = 'screen-share', // 屏幕共享布局（待实现）
}
```

## 布局组件详解

### 1. OneToOneFullLayout (1v1 画中画)

**特点:**

- 主视频占满整个容器
- 小视频悬浮在右上角
- Header 和 Controls 透明悬浮
- 适合 1v1 视频通话

**布局结构:**

```
┌─────────────────────────────────┐
│ [Header - 透明悬浮]              │
│                     ┌─────────┐ │
│                     │小视频   │ │
│     主视频           │        │ │
│   (占满容器)         └─────────┘ │
│                                 │
│ [Controls - 透明悬浮]           │
└─────────────────────────────────┘
```

### 2. MultiPartyFullLayout (多人网格)

**特点:**

- 传统的上中下布局
- Header 和 Controls 半透明固定
- 视频区域网格排列
- 适合多人视频会议

**布局结构:**

```
┌─────────────────────────────────┐
│ [Header - 半透明固定]           │
├─────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │视频1│ │视频2│ │视频3│        │
│ └─────┘ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │视频4│ │视频5│ │视频6│        │
│ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────┤
│ [Controls - 半透明固定]         │
└─────────────────────────────────┘
```

### 3. PreviewFullLayout (设备预览)

**特点:**

- 用于通话前的设备检测
- 显示本地摄像头预览
- 包含设备控制按钮
- 适合入会前准备

### 4. MinimizedLayout (最小化)

**特点:**

- 显示通话状态信息
- 快速控制按钮
- 点击可恢复正常布局
- 节省屏幕空间

## 使用示例

### 基本用法

```tsx
import { CallKit, LayoutMode } from 'easemob-chat-uikit';

const VideoCall = () => {
  const [videos, setVideos] = useState([
    { id: 'local', nickname: 'You', isLocalVideo: true },
    { id: 'remote', nickname: 'Alice' },
  ]);

  return (
    <CallKit
      videos={videos}
      layoutMode={LayoutMode.ONE_TO_ONE}
      resizable
      draggable
      showControls
      onMuteToggle={muted => console.log('静音:', muted)}
      onCameraToggle={enabled => console.log('摄像头:', enabled)}
      onHangup={() => console.log('挂断')}
    />
  );
};
```

### 多人会议

```tsx
const MultiPartyCall = () => {
  const [videos, setVideos] = useState([
    { id: 'local', nickname: 'You', isLocalVideo: true },
    { id: 'user1', nickname: 'Alice' },
    { id: 'user2', nickname: 'Bob' },
    { id: 'user3', nickname: 'Charlie' },
  ]);

  return (
    <CallKit
      videos={videos}
      layoutMode={LayoutMode.MULTI_PARTY}
      maxVideos={9}
      aspectRatio={16 / 9}
      gap={12}
      resizable
      draggable
    />
  );
};
```

### 设备预览

```tsx
const DevicePreview = () => {
  const [localVideo, setLocalVideo] = useState(null);

  return (
    <CallKit
      videos={localVideo ? [{ id: 'preview', stream: localVideo }] : []}
      layoutMode={LayoutMode.PREVIEW}
      showControls
      onCameraToggle={async enabled => {
        if (enabled) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setLocalVideo(stream);
        } else {
          localVideo?.getTracks().forEach(track => track.stop());
          setLocalVideo(null);
        }
      }}
    />
  );
};
```

### 最小化功能

```tsx
const MinimizableCall = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00:00');

  return (
    <CallKit
      videos={videos}
      layoutMode={LayoutMode.ONE_TO_ONE}
      isMinimized={isMinimized}
      callDuration={callDuration}
      minimizedSize={{ width: 200, height: 150 }}
      onMinimizedToggle={setIsMinimized}
      onMinimizedClick={() => setIsMinimized(false)}
    />
  );
};
```

## 高级功能

### 可调整大小

```tsx
<CallKit
  resizable
  minWidth={400}
  minHeight={300}
  maxWidth={1200}
  maxHeight={800}
  onResize={(width, height) => {
    console.log('尺寸变化:', { width, height });
  }}
/>
```

### 可拖动

```tsx
<CallKit
  draggable
  dragHandle=".cui-callkit-header" // 指定拖动手柄
  onDrag={(position, delta) => {
    console.log('位置变化:', position, delta);
  }}
/>
```

### 内置位置管理

```tsx
<CallKit
  managedPosition
  initialPosition={{ left: 100, top: 100 }}
  initialSize={{ width: 800, height: 600 }}
  resizable
  draggable
/>
```

## 自定义渲染

### 自定义视频窗口

```tsx
const renderVideoWindow = (video, style) => {
  return (
    <div style={style} className="custom-video-window">
      <video
        ref={ref => {
          if (ref && video.stream) {
            ref.srcObject = video.stream;
          }
        }}
        autoPlay
        muted={video.muted}
      />
      <div className="video-overlay">
        <span>{video.nickname}</span>
        {video.muted && <MuteIcon />}
      </div>
    </div>
  );
};

<CallKit videos={videos} renderVideoWindow={renderVideoWindow} />;
```

## 样式自定义

### CSS 变量

```css
:root {
  --callkit-header-height: 60px;
  --callkit-controls-height: 60px;
  --callkit-gap: 8px;
  --callkit-border-radius: 8px;
  --callkit-background: rgba(0, 0, 0, 0.8);
}
```

### 布局特定样式

```css
/* OneToOne 布局 */
.cui-callkit-one-to-one-full-layout {
  .cui-callkit-main-video {
    border-radius: 0;
  }

  .cui-callkit-pip-video {
    border: 2px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* MultiParty 布局 */
.cui-callkit-multi-party-full-layout {
  .cui-callkit-header,
  .cui-callkit-controls {
    backdrop-filter: blur(10px);
  }
}
```

## 最佳实践

1. **布局选择**: 根据参与者数量自动选择合适的布局模式
2. **性能优化**: 使用 `maxVideos` 限制同时渲染的视频数量
3. **响应式设计**: 在移动设备上使用较小的 `gap` 和 `aspectRatio`
4. **用户体验**: 提供最小化功能，避免占用过多屏幕空间
5. **自定义渲染**: 根据业务需求自定义视频窗口的渲染逻辑

## 迁移指南

### 从旧版本迁移

如果你之前使用的是旧版本的 CallKit 或 VideoLayout，需要进行以下调整：

1. **导入更新**:

```tsx
// 旧版本
import { VideoLayout } from 'easemob-chat-uikit';

// 新版本
import { CallKit, LayoutMode } from 'easemob-chat-uikit';
```

2. **属性调整**:

```tsx
// 旧版本
<VideoLayout videos={videos} onVideoClick={handleClick} />

// 新版本
<CallKit
  videos={videos}
  layoutMode={LayoutMode.MULTI_PARTY}
  onVideoClick={handleClick}
/>
```

3. **布局模式**: 新版本需要明确指定布局模式，而不是自动推断。

### 兼容性

- VideoLayout 组件仍然可用，但建议迁移到新的 CallKit 组件
- 所有原有的属性和回调函数都得到保留
- 新增了大量高级功能和自定义选项
