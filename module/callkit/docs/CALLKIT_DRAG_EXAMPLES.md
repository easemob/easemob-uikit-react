# CallKit 拖动功能使用指南

CallKit 组件现在支持拖动功能，用户可以点击组件内部区域来拖动整个组件移动位置。

## 基本使用

### 1. 启用拖动功能

```tsx
import CallKit from 'easemob-chat-uikit/callkit';

const MyComponent = () => {
  return (
    <CallKit
      videos={videos}
      draggable={true}
      style={{ position: 'absolute', left: 100, top: 100 }}
      onDragStart={pos => console.log('开始拖动:', pos)}
      onDrag={(pos, delta) => console.log('拖动中:', pos, delta)}
      onDragEnd={pos => console.log('拖动结束:', pos)}
    />
  );
};
```

### 2. 内置位置管理（推荐）

```tsx
const MyComponent = () => {
  return (
    <CallKit
      videos={videos}
      draggable={true}
      managedPosition={true}
      initialPosition={{ left: 100, top: 100 }}
      initialSize={{ width: 800, height: 600 }}
    />
  );
};
```

## 高级用法

### 1. 指定拖动手柄区域

```tsx
const MyComponent = () => {
  return (
    <CallKit
      videos={videos}
      draggable={true}
      dragHandle=".cui-callkit-header" // 只有点击头部区域才能拖动
      style={{ position: 'absolute', left: 100, top: 100 }}
    />
  );
};
```

### 2. 同时启用拖动和调整大小

```tsx
const MyComponent = () => {
  const [position, setPosition] = useState({ left: 100, top: 100 });
  const [size, setSize] = useState({ width: 800, height: 600 });

  const handleDrag = (newPosition, delta) => {
    setPosition({ left: newPosition.x, top: newPosition.y });
  };

  const handleResize = (width, height, newLeft, newTop) => {
    setSize({ width, height });
    if (newLeft !== undefined || newTop !== undefined) {
      setPosition({
        left: newLeft ?? position.left,
        top: newTop ?? position.top,
      });
    }
  };

  return (
    <CallKit
      videos={videos}
      draggable={true}
      resizable={true}
      onDrag={handleDrag}
      onResize={handleResize}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: size.width,
        height: size.height,
      }}
    />
  );
};
```

### 3. 限制拖动范围

```tsx
const MyComponent = () => {
  const [position, setPosition] = useState({ left: 100, top: 100 });

  const handleDrag = (newPosition, delta) => {
    // 限制在容器内拖动
    const containerWidth = 1200;
    const containerHeight = 800;
    const callkitWidth = 800;
    const callkitHeight = 600;

    const constrainedPosition = {
      left: Math.max(0, Math.min(newPosition.x, containerWidth - callkitWidth)),
      top: Math.max(0, Math.min(newPosition.y, containerHeight - callkitHeight)),
    };

    setPosition(constrainedPosition);
  };

  return (
    <div style={{ position: 'relative', width: 1200, height: 800 }}>
      <CallKit
        videos={videos}
        draggable={true}
        onDrag={handleDrag}
        style={{
          position: 'absolute',
          left: position.left,
          top: position.top,
          width: 800,
          height: 600,
        }}
      />
    </div>
  );
};
```

## 属性说明

### 拖动相关属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `draggable` | `boolean` | `false` | 是否启用拖动功能 |
| `dragHandle` | `string` | - | CSS 选择器，指定拖动手柄区域 |
| `onDragStart` | `(pos: {x: number, y: number}) => void` | - | 开始拖动时的回调 |
| `onDrag` | `(pos: {x: number, y: number}, delta: {x: number, y: number}) => void` | - | 拖动过程中的回调 |
| `onDragEnd` | `(pos: {x: number, y: number}) => void` | - | 拖动结束时的回调 |

### 内置位置管理属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `managedPosition` | `boolean` | `false` | 是否使用内置位置管理 |
| `initialPosition` | `{left: number, top: number}` | `{left: 50, top: 50}` | 初始位置 |
| `initialSize` | `{width: number, height: number}` | `{width: 800, height: 600}` | 初始尺寸 |

## 行为说明

### 1. 拖动区域检测

- 默认情况下，整个 CallKit 组件都可以拖动
- 如果指定了 `dragHandle`，只有点击指定区域才能拖动
- 点击边缘区域（调整大小区域）时不会触发拖动

### 2. 光标样式

- 鼠标悬停在可拖动区域时显示 `grab` 光标
- 拖动过程中显示 `grabbing` 光标
- 边缘区域显示对应的 resize 光标

### 3. 事件处理

- 拖动和调整大小功能可以同时启用
- 拖动优先级低于调整大小，边缘区域优先触发调整大小
- 全屏模式下自动禁用拖动功能

### 4. 性能优化

- 拖动过程中禁用文本选择和子元素的 pointer-events
- 使用 requestAnimationFrame 优化拖动性能
- 支持同步 DOM 更新，避免视觉跳动

## 样式定制

### CSS 类名

- `.cui-callkit-draggable` - 可拖动状态
- `.cui-callkit-dragging` - 拖动中状态

### 自定义样式

```scss
.cui-callkit {
  &-draggable {
    // 可拖动状态的样式
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &-dragging {
    // 拖动中的样式
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
}
```

## 注意事项

1. **定位方式**：使用拖动功能时，CallKit 组件需要设置 `position: absolute` 或 `position: fixed`
2. **容器设置**：确保父容器有足够的空间供组件拖动
3. **性能考虑**：避免在拖动回调中执行复杂的计算
4. **移动端支持**：目前主要针对桌面端设计，移动端支持待优化
5. **全屏模式**：全屏时自动禁用拖动功能

## 完整示例

```tsx
import React, { useState } from 'react';
import CallKit from 'easemob-chat-uikit/callkit';

const DraggableCallKitDemo = () => {
  const [videos] = useState([
    { id: '1', nickname: 'Alice', avatar: '/avatar1.jpg' },
    { id: '2', nickname: 'Bob', avatar: '/avatar2.jpg' },
    { id: '3', nickname: 'Charlie', avatar: '/avatar3.jpg' },
  ]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <CallKit
        videos={videos}
        draggable={true}
        resizable={true}
        managedPosition={true}
        initialPosition={{ left: 100, top: 100 }}
        initialSize={{ width: 800, height: 600 }}
        minWidth={400}
        minHeight={300}
        maxWidth={1200}
        maxHeight={900}
        onDragStart={pos => console.log('开始拖动:', pos)}
        onDrag={(pos, delta) => console.log('拖动中:', pos, delta)}
        onDragEnd={pos => console.log('拖动结束:', pos)}
      />
    </div>
  );
};

export default DraggableCallKitDemo;
```
