# CallKit 智能定位系统

## 概述

CallKit 的可调整大小功能现在支持智能定位，能够自动检测组件的定位方式并提供正确的坐标计算。用户无需关心父容器的定位设置。

## 支持的定位方式

### 1. `position: absolute` (默认)

- **相对于最近的已定位祖先元素**
- 如果没有已定位的祖先，则相对于文档
- Hook 会自动检测 `offsetParent` 并计算正确的相对坐标

### 2. `position: fixed`

- **相对于视口定位**
- 不受页面滚动影响
- Hook 直接使用视口坐标

### 3. `position: relative`

- **相对于元素的正常位置**
- 通常用于建立定位上下文
- Hook 提供位置偏移信息

## 智能处理逻辑

```typescript
// Hook 内部会自动检测定位方式
const elementStyle = window.getComputedStyle(element);
const position = elementStyle.position;

if (position === 'fixed') {
  // 相对于视口，直接使用计算出的位置
  callbackLeft = newLeft;
  callbackTop = newTop;
} else if (position === 'absolute') {
  // 检查定位上下文
  const offsetParent = element.offsetParent;
  if (offsetParent && offsetParent !== document.body) {
    // 有定位父元素，计算相对位置
    const parentRect = offsetParent.getBoundingClientRect();
    callbackLeft = newLeft - parentRect.left;
    callbackTop = newTop - parentRect.top;
  } else {
    // 相对于文档
    callbackLeft = newLeft;
    callbackTop = newTop;
  }
}
```

## 使用示例

### 基本用法

```jsx
const handleResize = (width, height, newLeft, newTop, direction) => {
  // 更新尺寸
  setSize({ width, height });

  // 直接使用 Hook 提供的坐标，无需手动计算
  if (newLeft !== undefined || newTop !== undefined) {
    setPosition({
      left: newLeft !== undefined ? newLeft : position.left,
      top: newTop !== undefined ? newTop : position.top,
    });
  }
};

<CallKit
  resizable={true}
  onResize={handleResize}
  style={{
    position: 'absolute', // 或 'fixed'
    left: position.left,
    top: position.top,
    width: size.width,
    height: size.height,
  }}
/>;
```

### Fixed 定位示例

```jsx
// 固定在视口右下角
<CallKit
  resizable={true}
  onResize={handleResize}
  style={{
    position: 'fixed',
    right: 20,
    bottom: 20,
    width: 400,
    height: 300,
  }}
/>
```

## 优势

1. **用户友好**：无需关心父容器的定位设置
2. **自动适配**：支持所有常见的定位方式
3. **精确计算**：根据实际定位上下文提供正确坐标
4. **无缝切换**：可以动态改变定位方式而不影响功能

## 注意事项

- 只有在拖动左边或上边时才会触发位置回调
- Hook 会自动检测元素的定位方式，无需手动配置
- 支持动态切换定位方式
- 在 `position: static` 的情况下，通常不需要位置调整
