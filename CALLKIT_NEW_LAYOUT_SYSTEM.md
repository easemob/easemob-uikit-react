# CallKit 新布局系统重构

## 问题分析

您提出的问题非常准确：

1. **原有结构的局限性**：`<header/><LayoutManager/><CallControls/>` 这种固定结构无法满足不同布局模式的需求
2. **1v1 和多人视频布局差异**：1v1 应该是视频占满容器，而不是上中下布局
3. **未来扩展性需求**：语音通话等不同模式需要完全不同的布局
4. **布局控制权限制**：在 LayoutManager 中无法调整 header 和 CallControls 的布局

## 解决方案

我采用了**方案 2 的改进版本**：将 Header 和 CallControls 放入各个 Layout 组件中，通过完整的布局管理器来实现不同模式的布局。

## 新架构设计

### 1. 布局类型定义

```typescript
// module/callkit/types/layout.ts
export interface FullLayoutProps {
  // 基础数据
  videos: VideoWindowProps[];
  containerSize: ContainerSize;
  prefixCls: string;
  renderVideoWindow: (video: VideoWindowProps, index: number) => React.ReactNode;

  // 布局选项
  aspectRatio?: number;
  gap?: number;
  maxVideos?: number;

  // 全屏和最小化
  isFullscreen?: boolean;
  isMinimized?: boolean;
  onFullscreenToggle?: () => void;
  onMinimizedToggle?: () => void;

  // 控制按钮状态和回调
  showControls?: boolean;
  muted?: boolean;
  cameraEnabled?: boolean;
  speakerEnabled?: boolean;
  screenSharing?: boolean;
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;

  // 其他
  callDuration?: string;
  onMinimizedClick?: () => void;
}

export enum LayoutMode {
  MULTI_PARTY = 'multi-party',
  ONE_TO_ONE = 'one-to-one',
  PREVIEW = 'preview',
  MINIMIZED = 'minimized',
  SCREEN_SHARE = 'screen-share',
  VOICE_CALL = 'voice-call', // 新增语音通话模式
}
```

### 2. 完整布局管理器

```typescript
// module/callkit/layouts/FullLayoutManager.tsx
export const FullLayoutManager: React.FC<FullLayoutProps> = props => {
  // 根据视频数量和状态自动选择布局模式
  const getOptimalLayoutMode = (): LayoutMode => {
    if (isMinimized) return LayoutMode.MINIMIZED;
    if (videos.length === 2) return LayoutMode.ONE_TO_ONE;
    if (videos.length > 2) return LayoutMode.MULTI_PARTY;
    return LayoutMode.PREVIEW;
  };

  // 根据布局模式渲染对应的完整布局组件
  switch (actualLayoutMode) {
    case LayoutMode.ONE_TO_ONE:
    case LayoutMode.MINIMIZED:
      return <OneToOneFullLayout {...props} />;

    case LayoutMode.VOICE_CALL:
      return <VoiceCallFullLayout {...props} />; // 待实现

    case LayoutMode.MULTI_PARTY:
      return <MultiPartyFullLayout {...props} />; // 待实现

    // 其他布局模式...
  }
};
```

### 3. OneToOne 完整布局组件

```typescript
// module/callkit/layouts/OneToOneFullLayout.tsx
export const OneToOneFullLayout: React.FC<FullLayoutProps> = ({
  videos,
  isMinimized,
  onFullscreenToggle,
  onMinimizedToggle,
  muted,
  cameraEnabled,
  onMuteToggle,
  onCameraToggle,
  onHangup,
  // ... 其他 props
}) => {
  return (
    <div className={`${prefixCls}-one-to-one-full-layout`}>
      {/* 视频内容区域 - 占满整个容器 */}
      <div className={`${prefixCls}-video-content`}>
        {/* 主视频（远程视频）- 背景 */}
        <div className={`${prefixCls}-main-video`}>{renderVideoWindow(remoteVideo, 0)}</div>

        {/* 画中画视频（本地视频）- 右上角 */}
        {localVideo && !isMinimized && (
          <div className={`${prefixCls}-pip-video`}>{renderVideoWindow(localVideo, 1)}</div>
        )}

        {/* 渐变遮罩 - 增强可读性 */}
        <div className={`${prefixCls}-overlay-gradient`} />
      </div>

      {/* Header - 浮动在视频内容之上 */}
      <div className={`${prefixCls}-floating-header`}>
        <Header
          subtitle={callDuration}
          suffixIcon={[
            <Button onClick={onFullscreenToggle}>全屏</Button>,
            <Button onClick={onMinimizedToggle}>最小化</Button>,
          ]}
        />
      </div>

      {/* Controls - 浮动在视频内容之上 */}
      {showControls && !isMinimized && (
        <div className={`${prefixCls}-floating-controls`}>
          <CallControls
            muted={muted}
            cameraEnabled={cameraEnabled}
            onMuteToggle={onMuteToggle}
            onCameraToggle={onCameraToggle}
            onHangup={onHangup}
          />
        </div>
      )}

      {/* 最小化状态的简化控制 */}
      {isMinimized && (
        <div className={`${prefixCls}-minimized-controls`}>{/* 最小化界面内容 */}</div>
      )}
    </div>
  );
};
```

### 4. 重构后的 CallKit 组件

```typescript
// module/callkit/CallKit.tsx
const CallKit: React.FC<CallKitProps> = ({
  videos,
  layoutMode,
  isMinimized,
  muted,
  cameraEnabled,
  onMuteToggle,
  onCameraToggle,
  onHangup,
  // ... 其他 props
}) => {
  return (
    <div className={containerClass} style={containerStyle}>
      {/* 使用完整布局管理器 - 包含所有布局逻辑 */}
      <FullLayoutManager
        videos={displayVideos}
        containerSize={actualContainerSize}
        prefixCls={prefixCls}
        renderVideoWindow={renderVideoWindow}
        // 传递所有状态和回调
        isFullscreen={isFullscreen}
        isMinimized={isMinimized}
        onFullscreenToggle={toggleFullscreen}
        onMinimizedToggle={handleMinimizedToggle}
        muted={muted}
        cameraEnabled={cameraEnabled}
        onMuteToggle={onMuteToggle}
        onCameraToggle={onCameraToggle}
        onHangup={onHangup}
        callDuration={callDuration}
        onMinimizedClick={handleMinimizedClick}
      />
    </div>
  );
};
```

## 新系统的优势

### 1. 完全分离的布局逻辑

- 每种布局模式都有独立的组件
- 包含完整的 UI 结构（Header + Content + Controls）
- 布局组件拥有完全的控制权

### 2. 真正的画中画实现

- OneToOne 模式下视频内容占满整个容器
- Header 和 Controls 浮动在视频内容之上
- 使用渐变遮罩增强 UI 可读性

### 3. 灵活的扩展性

- 轻松添加新的布局模式（语音通话、屏幕共享等）
- 每个布局都是独立的，可以有完全不同的 UI 结构
- 支持布局特定的样式和交互

### 4. 清晰的职责分离

- **CallKit**：状态管理、事件处理、容器管理
- **FullLayoutManager**：布局模式选择和路由
- **具体 Layout 组件**：完整的布局实现和 UI 渲染

### 5. 易于维护和测试

- 每个布局组件都是独立的，可以单独测试
- 布局逻辑和业务逻辑分离
- 样式和交互都在各自的布局组件中

## 支持的布局模式

### 已实现

- ✅ **ONE_TO_ONE**：1v1 视频通话，画中画布局
- ✅ **MINIMIZED**：最小化模式，简化控制界面

### 待实现（可轻松扩展）

- 🔄 **MULTI_PARTY**：多人视频通话，网格布局
- 🔄 **PREVIEW**：预览模式，设备检测
- 🔄 **VOICE_CALL**：语音通话模式，头像 + 控制
- 🔄 **SCREEN_SHARE**：屏幕共享模式，主屏幕 + 参与者列表

## 文件结构

```
module/callkit/
├── types/
│   └── layout.ts                    # 新的布局类型定义
├── layouts/
│   ├── FullLayoutManager.tsx        # 完整布局管理器
│   ├── OneToOneFullLayout.tsx       # OneToOne 完整布局
│   ├── MultiPartyFullLayout.tsx     # 多人完整布局（待实现）
│   ├── VoiceCallFullLayout.tsx      # 语音通话完整布局（待实现）
│   └── ScreenShareFullLayout.tsx    # 屏幕共享完整布局（待实现）
├── styles/
│   └── layouts/
│       └── one-to-one-full.scss     # OneToOne 完整布局样式
└── CallKit.tsx                     # 重构后的主组件
```

## 测试

创建了 `test-new-layout-system.html` 来演示新布局系统的效果：

- OneToOne 正常状态：视频占满容器，浮动 UI
- OneToOne 最小化状态：简化控制界面
- 布局系统的优势和特性说明

## 总结

这个新的布局系统完全解决了您提出的问题：

1. ✅ **不同布局模式的差异化需求**：每个模式都有独立的完整布局组件
2. ✅ **1v1 画中画效果**：视频内容占满容器，UI 浮动在上面
3. ✅ **未来扩展性**：可以轻松添加语音通话等新模式
4. ✅ **布局控制权**：Layout 组件拥有完整的 UI 控制权
5. ✅ **职责分离**：CallKit 专注状态管理，Layout 专注布局渲染

这个架构为 CallKit 提供了强大的扩展性和灵活性，同时保持了代码的清晰和可维护性。
