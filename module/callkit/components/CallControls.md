# CallControls 组件使用指南

## 功能改进

### 1. 麦克风图标切换

- **问题**：原来麦克风按钮固定显示 `MIC_ON` 图标
- **解决**：现在根据 `muted` 状态自动切换
  - `muted = false`：显示 `MIC_ON` 图标
  - `muted = true`：显示 `MIC_OFF` 图标，按钮背景变红色

### 2. 事件处理模式

- **问题**：每个布局组件都需要重复处理相同的回调逻辑
- **解决**：提供两种模式，根据需要选择

## 使用模式

### 受控模式 (Controlled Mode)

适合需要精确控制状态的复杂场景

```tsx
const [muted, setMuted] = useState(false);
const [cameraEnabled, setCameraEnabled] = useState(true);

<CallControls
  muted={muted}
  cameraEnabled={cameraEnabled}
  onMuteToggle={newMuted => {
    setMuted(newMuted);
    // 调用 WebRTC API 等
  }}
  onCameraToggle={enabled => {
    setCameraEnabled(enabled);
    // 控制摄像头
  }}
  onHangup={() => {
    // 处理挂断逻辑
  }}
/>;
```

### 自管理模式 (Managed Mode)

适合简单场景，减少样板代码

```tsx
<CallControls
  managed={true}
  defaultMuted={false}
  defaultCameraEnabled={true}
  onMuteToggle={newMuted => {
    // 只需要处理业务逻辑，不需要管理状态
    console.log('麦克风状态:', newMuted ? '静音' : '开启');
  }}
  onHangup={() => {
    // 处理挂断逻辑
  }}
/>
```

### 最简单用法

只处理关键事件

```tsx
<CallControls
  managed={true}
  onHangup={() => {
    // 只处理挂断事件
  }}
/>
```

## 属性说明

### 基础属性

- `className?: string` - 自定义类名
- `style?: React.CSSProperties` - 自定义样式

### 状态控制

- `muted?: boolean` - 是否静音
- `cameraEnabled?: boolean` - 是否开启摄像头
- `speakerEnabled?: boolean` - 是否开启扬声器
- `screenSharing?: boolean` - 是否正在屏幕共享

### 默认值（仅在自管理模式下使用）

- `defaultMuted?: boolean` - 默认静音状态
- `defaultCameraEnabled?: boolean` - 默认摄像头状态
- `defaultSpeakerEnabled?: boolean` - 默认扬声器状态
- `defaultScreenSharing?: boolean` - 默认屏幕共享状态

### 事件回调

- `onMuteToggle?: (muted: boolean) => void` - 静音切换回调
- `onCameraToggle?: (enabled: boolean) => void` - 摄像头切换回调
- `onSpeakerToggle?: (enabled: boolean) => void` - 扬声器切换回调
- `onScreenShareToggle?: (sharing: boolean) => void` - 屏幕共享切换回调
- `onHangup?: () => void` - 挂断回调

### 控制属性

- `managed?: boolean` - 是否使用内部状态管理（默认 `false`）

## 推荐使用场景

### 受控模式

- ✅ 需要与外部状态同步
- ✅ 多个布局组件需要共享状态
- ✅ 需要状态持久化
- ✅ 复杂的业务逻辑

### 自管理模式

- ✅ 简单的使用场景
- ✅ 减少样板代码
- ✅ 独立的组件实例
- ✅ 快速原型开发

## 迁移指南

### 从旧版本迁移

原来的用法仍然完全兼容：

```tsx
// 旧用法 - 仍然有效
<CallControls
  muted={muted}
  cameraEnabled={cameraEnabled}
  onMuteToggle={setMuted}
  onCameraToggle={setCameraEnabled}
/>

// 新用法 - 简化版
<CallControls
  managed={true}
  onHangup={() => console.log('挂断')}
/>
```

### 布局组件中的使用

现在可以选择适合的模式：

```tsx
// 在简单的布局组件中使用自管理模式
<CallControls
  managed={true}
  onHangup={onHangup}
/>

// 在复杂的布局组件中使用受控模式
<CallControls
  muted={muted}
  cameraEnabled={cameraEnabled}
  onMuteToggle={onMuteToggle}
  onCameraToggle={onCameraToggle}
  onHangup={onHangup}
/>
```

## 总结

这次改进解决了两个主要问题：

1. **图标切换**：麦克风按钮现在会根据状态正确显示图标
2. **事件处理**：提供了两种模式，既保持了灵活性，又减少了重复代码

通过这种设计，你可以根据具体需求选择合适的模式：

- 复杂场景使用受控模式
- 简单场景使用自管理模式
- 两种模式可以在同一个项目中混用
