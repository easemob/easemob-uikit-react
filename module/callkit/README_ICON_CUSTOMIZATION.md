# CallKit Icon 自定义功能

## 📖 功能概述

CallKit 现在支持灵活的图标自定义，用户可以通过多种方式替换默认的图标，包括控制按钮和头部区域的图标。

## 🎯 支持的自定义方式

### 1. **Icon 映射对象** (推荐)

通过 `customIcons` 属性提供图标映射，选择性覆盖任何图标：

```typescript
import { CallKit } from '@easemob/uikit-react';
import { MyMicIcon, MyHangupIcon } from './MyIcons';

// 方式1: 使用自定义组件
const customIcons = {
  controls: {
    micOn: MyMicIcon,
    micOff: <MyMicIcon muted />,
    hangup: MyHangupIcon,
  },
  header: {
    back: <ArrowLeftIcon />,
    fullscreen: CustomFullscreenIcon,
  },
};

<CallKit
  customIcons={customIcons}
  // 其他 props...
/>;
```

### 2. **自定义渲染函数**

通过 `iconRenderer` 属性提供完全自定义的渲染逻辑：

```typescript
const iconRenderer = (iconType, defaultIcon, context) => {
  // 可以根据 context 进行条件渲染
  if (iconType === 'hangup') {
    return (
      <div className="custom-hangup-icon">
        <MyCustomHangupIcon color="red" />
      </div>
    );
  }

  // 返回默认图标
  return defaultIcon;
};

<CallKit
  iconRenderer={iconRenderer}
  // 其他 props...
/>;
```

### 3. **组合使用**

```typescript
<CallKit
  customIcons={{
    controls: {
      micOn: <CustomMicIcon />,
      hangup: MyHangupComponent,
    },
  }}
  iconRenderer={(iconType, defaultIcon, context) => {
    // iconRenderer 作为最后的自定义机会
    if (iconType === 'speakerOn' && context.isGroupCall) {
      return <GroupSpeakerIcon />;
    }
    return defaultIcon;
  }}
/>
```

## 🎨 可自定义的图标

### CallControls 图标

| 图标键名     | 说明       | 默认图标类型         |
| ------------ | ---------- | -------------------- |
| `micOn`      | 麦克风开启 | `MIC_ON`             |
| `micOff`     | 麦克风关闭 | `MIC_OFF`            |
| `cameraOn`   | 摄像头开启 | `VIDEO_CAMERA`       |
| `cameraOff`  | 摄像头关闭 | `VIDEO_CAMERA_SLASH` |
| `speakerOn`  | 扬声器开启 | `SPEAKER_WAVE_2`     |
| `speakerOff` | 扬声器关闭 | `SPEAKER_X_MARK`     |
| `hangup`     | 挂断电话   | `X_MARK_THICK`       |
| `accept`     | 接听电话   | `PHONE`              |
| `reject`     | 拒绝电话   | `X_MARK_THICK`       |

### Header 图标

| 图标键名         | 说明       | 默认图标类型           |
| ---------------- | ---------- | ---------------------- |
| `back`           | 返回按钮   | `ARROW_LEFT`           |
| `close`          | 关闭按钮   | `CLOSE`                |
| `fullscreen`     | 全屏按钮   | `CHEVRON_4_ALL_AROUND` |
| `exitFullscreen` | 退出全屏   | `CHEVRON_4_CLUSTER`    |
| `minimize`       | 最小化按钮 | `BOXES`                |

## 🛠️ 实际使用示例

### 示例 1: 使用 Ant Design 图标

```typescript
import { CallKit } from '@easemob/uikit-react';
import { AudioOutlined, AudioMutedOutlined, PhoneOutlined } from '@ant-design/icons';

const App = () => {
  return (
    <CallKit
      customIcons={{
        controls: {
          micOn: props => <AudioOutlined style={{ fontSize: props.width }} />,
          micOff: props => <AudioMutedOutlined style={{ fontSize: props.width }} />,
          hangup: props => (
            <PhoneOutlined rotate={135} style={{ fontSize: props.width, color: props.color }} />
          ),
        },
      }}
      enableRealCall={true}
      webimConnection={conn}
    />
  );
};
```

### 示例 2: 使用 SVG 图标

```typescript
const CustomMicIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z" />
    <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2h2v2c0 2.76 2.24 5 5 5s5-2.24 5-5v-2h2z" />
  </svg>
);

<CallKit
  customIcons={{
    controls: {
      micOn: CustomMicIcon,
      micOff: props => <CustomMicIcon {...props} style={{ opacity: 0.5 }} />,
    },
  }}
/>;
```

### 示例 3: 条件自定义

```typescript
const iconRenderer = (iconType, defaultIcon, context) => {
  // 根据通话类型使用不同的图标
  if (context.callMode === 'group') {
    switch (iconType) {
      case 'hangup':
        return <GroupHangupIcon {...context.iconProps} />;
      case 'micOn':
        return <GroupMicIcon {...context.iconProps} />;
    }
  }

  return defaultIcon;
};
```

## 🔧 技术细节

### 图标组件要求

自定义图标组件应该接受以下标准 props：

```typescript
interface CustomIconProps {
  width?: number; // 图标宽度
  height?: number; // 图标高度
  color?: string; // 图标颜色
  [key: string]: any; // 其他自定义属性
}
```

### 渲染优先级

1. **customIcons 映射** - 优先级最高
2. **iconRenderer 函数** - 其次
3. **默认图标** - 兜底方案

### 性能优化

- 图标渲染函数使用 `React.useCallback` 缓存
- 支持 `React.memo` 优化的图标组件
- 避免在渲染过程中创建新的图标对象

## 🎨 最佳实践

1. **保持一致性**: 确保自定义图标的视觉风格统一
2. **响应式设计**: 图标应该支持不同的尺寸
3. **无障碍性**: 提供适当的 `title` 和 `aria-label`
4. **性能考虑**: 使用 SVG 而不是大尺寸的图片

```typescript
// ✅ 好的做法
const MyIcon = React.memo(({ width, height, color, title }) => (
  <svg width={width} height={height} aria-label={title}>
    {/* SVG 内容 */}
  </svg>
));

// ❌ 避免的做法
const BadIcon = props => <img src="/large-icon.png" style={{ width: props.width }} />;
```
