# 自定义图片预览组件指南

## 问题背景

### 当前设计的问题

用户反馈：在使用 `Chat` 组件时，默认的图片预览功能不够强大，不支持：

- 放大/缩小
- 旋转
- 拖拽移动
- 手势操作
- 下载

而且，如果要替换图片预览组件，需要：

1. 重新实现整个 `ImageMessage` 组件
2. 手动处理 `BaseMessage` 上的所有回调（回复、删除、表情、撤回等）
3. 代码重复，维护困难

### 设计合理性分析

**问题：** 这些回调（回复、删除、表情等）不应该放在 `ImageMessage` 组件里吗？

**回答：** 当前设计在架构层面是合理的，原因如下：

1. **职责分离**：

   - `BaseMessage`：负责消息的通用功能（头像、昵称、时间、操作菜单、表情回应等）
   - `ImageMessage`/`TextMessage`等：负责具体消息类型的内容展示
   - 这是组合模式（Composition Pattern）的典型应用

2. **代码复用**：

   - 避免在每个消息类型组件中重复实现相同的功能
   - 所有消息类型共享同一套交互逻辑

3. **一致性**：
   - 保证所有消息类型的交互行为一致
   - 便于统一管理和更新

**但是**，当前设计缺少一个关键的扩展点：**内容渲染的自定义能力**

## 解决方案

### 方案 1：新增 `renderImagePreview` 属性（已实现，推荐）

#### 优点

- ✅ 简单直接，无需重写整个组件
- ✅ 只替换预览部分，保留所有消息功能
- ✅ 向后兼容，不影响现有代码

#### 使用方法

```tsx
import { Chat } from '@easemob/react-uikit';
import { AdvancedImageViewer } from './CustomImagePreview';

<Chat
  messageProps={{
    // 为所有图片消息提供自定义预览
    renderImagePreview: ({ visible, imageUrl, onClose, message }) => {
      return <AdvancedImageViewer visible={visible} imageUrl={imageUrl} onClose={onClose} />;
    },
  }}
/>;
```

### 方案 2：使用 `customRenderers` 完全自定义（灵活性最高）

如果需要完全控制图片消息的渲染，可以使用新的 `customRenderers` API：

```tsx
import { MessageList } from '@easemob/react-uikit';
import ImageMessage from '@easemob/react-uikit/module/imageMessage';

<MessageList
  customRenderers={{
    img: (ctx) => {
      const message = ctx.message;

      return (
        <ImageMessage
          imageMessage={message}
          renderUserProfile={ctx.renderUserProfile}
          thread={ctx.isThread}
          style={ctx.style}
          // 自定义预览组件
          renderImagePreview={({ visible, imageUrl, onClose }) => {
            return <YourCustomViewer {...} />;
          }}
          {...ctx.messageProps}
        />
      );
    },
  }}
/>
```

## 完整示例

### 示例 1：基础的放大缩小旋转功能

```tsx
import React, { useState } from 'react';
import { Chat } from '@easemob/react-uikit';

const AdvancedImageViewer = ({ visible, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* 工具栏 */}
      <div style={{ position: 'absolute', top: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={e => {
            e.stopPropagation();
            setScale(s => s + 0.2);
          }}
        >
          放大 +
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            setScale(s => s - 0.2);
          }}
        >
          缩小 -
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            setRotation(r => r + 90);
          }}
        >
          旋转 ↻
        </button>
        <button onClick={onClose}>关闭 ✕</button>
      </div>

      {/* 图片 */}
      <img
        src={imageUrl}
        alt="preview"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: 'transform 0.3s',
          maxWidth: '90%',
          maxHeight: '90%',
        }}
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
};

// 使用
function App() {
  return (
    <Chat
      messageProps={{
        renderImagePreview: props => <AdvancedImageViewer {...props} />,
      }}
    />
  );
}
```

### 示例 2：使用第三方库 react-photo-view（推荐）

```bash
npm install react-photo-view --save
```

```tsx
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { Chat } from '@easemob/react-uikit';

function App() {
  return (
    <PhotoProvider
      toolbarRender={({ onScale, scale }) => (
        <>
          <button onClick={() => onScale(scale + 1)}>放大</button>
          <button onClick={() => onScale(scale - 1)}>缩小</button>
        </>
      )}
    >
      <Chat
        messageProps={{
          renderImagePreview: ({ visible, imageUrl, onClose }) => {
            if (!visible) return null;

            return (
              <div onClick={onClose}>
                <PhotoView src={imageUrl}>
                  <img src={imageUrl} alt="preview" style={{ display: 'none' }} />
                </PhotoView>
              </div>
            );
          },
        }}
      />
    </PhotoProvider>
  );
}
```

### 示例 3：使用 react-image-lightbox

```bash
npm install react-image-lightbox --save
```

```tsx
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { Chat } from '@easemob/react-uikit';

function App() {
  return (
    <Chat
      messageProps={{
        renderImagePreview: ({ visible, imageUrl, onClose }) => {
          if (!visible) return null;

          return (
            <Lightbox
              mainSrc={imageUrl}
              onCloseRequest={onClose}
              enableZoom={true}
              toolbarButtons={[
                <button
                  key="download"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = 'image.jpg';
                    a.click();
                  }}
                >
                  下载
                </button>,
              ]}
            />
          );
        },
      }}
    />
  );
}
```

### 示例 4：完整功能的图片查看器

参见 `/demo/module/chat/CustomImagePreviewExample.tsx` 中的 `FullFeaturedImageViewer` 组件，支持：

- ✅ 放大/缩小（滚轮 + 按钮）
- ✅ 旋转
- ✅ 拖拽移动
- ✅ 重置
- ✅ 下载
- ✅ 显示文件信息
- ✅ 键盘快捷键

## API 说明

### ImageMessage Props

```typescript
export interface ImageMessageProps extends BaseMessageProps {
  imageMessage: ImageMessageType;

  // ... 其他属性

  /** 自定义图片预览组件 */
  renderImagePreview?: (props: {
    visible: boolean; // 是否显示预览
    imageUrl: string; // 图片 URL
    onClose: () => void; // 关闭预览的回调
    message: ImageMessageType; // 完整的消息对象
  }) => React.ReactNode;
}
```

### 通过 Chat 组件传递

```typescript
<Chat
  messageProps={{
    renderImagePreview: props => {
      // 自定义预览组件
      return <YourCustomViewer {...props} />;
    },
  }}
/>
```

### 通过 MessageList 的 customRenderers 传递

```typescript
<MessageList
  customRenderers={{
    img: ctx => {
      return (
        <ImageMessage
          imageMessage={ctx.message}
          renderImagePreview={props => {
            return <YourCustomViewer {...props} />;
          }}
          {...ctx.messageProps}
        />
      );
    },
  }}
/>
```

## 最佳实践

### 1. 选择合适的方案

| 场景                 | 推荐方案                                      |
| -------------------- | --------------------------------------------- |
| 只需要替换预览功能   | 使用 `renderImagePreview`                     |
| 需要修改图片展示样式 | 使用 `customRenderers` + `renderImagePreview` |
| 完全自定义图片消息   | 使用 `customRenderers` 重写整个组件           |

### 2. 使用成熟的第三方库

推荐使用以下库来实现图片预览功能：

1. **react-photo-view** ⭐⭐⭐⭐⭐

   - 功能完善（缩放、旋转、拖拽）
   - 性能优秀
   - 支持手势
   - 轻量级

2. **react-image-lightbox** ⭐⭐⭐⭐

   - 功能全面
   - UI 美观
   - 支持画廊模式

3. **react-medium-image-zoom** ⭐⭐⭐
   - 简单轻量
   - 适合简单场景

### 3. 性能优化

```tsx
// 使用 useMemo 缓存渲染函数
const renderImagePreview = useMemo(
  () => {
    return props => <CustomViewer {...props} />;
  },
  [
    /* 依赖项 */
  ],
);

<Chat
  messageProps={{
    renderImagePreview,
  }}
/>;
```

### 4. 键盘快捷键支持

```tsx
const CustomViewer = ({ visible, onClose, imageUrl }) => {
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
      // 添加其他快捷键
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // ...
};
```

### 5. 移动端适配

```tsx
const CustomViewer = ({ visible, imageUrl, onClose }) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const handleTouchStart = e => {
    if (e.touches.length === 2) {
      // 处理双指缩放
    }
  };

  // 添加触摸事件处理
  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* ... */}
    </div>
  );
};
```

## 常见问题

### Q1: 为什么不直接在 ImageMessage 内置这些功能？

**A:** 考虑到：

1. 不同项目对图片预览的需求差异很大
2. 内置完整功能会增加包体积
3. 灵活性：让用户选择自己喜欢的预览库

### Q2: renderImagePreview 和 customRenderers 哪个优先级更高？

**A:** `customRenderers` 优先级更高，因为它可以完全控制消息的渲染。

### Q3: 可以在预览组件中访问消息的其他信息吗？

**A:** 可以，`renderImagePreview` 的参数中包含完整的 `message` 对象：

```tsx
renderImagePreview: ({ message }) => {
  console.log(message.from, message.time, message.file);
  // ...
};
```

### Q4: 如何在预览时添加水印？

```tsx
renderImagePreview: ({ visible, imageUrl, onClose }) => {
  return (
    <div style={{ position: 'relative' }}>
      <img src={imageUrl} />
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          color: 'white',
          fontSize: 24,
          opacity: 0.5,
        }}
      >
        © 公司机密
      </div>
    </div>
  );
};
```

### Q5: 如何支持图片下载？

```tsx
const handleDownload = (imageUrl, filename) => {
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = filename || 'image.jpg';
  a.click();
};

renderImagePreview: ({ visible, imageUrl, onClose, message }) => {
  return (
    <div>
      <img src={imageUrl} />
      <button onClick={() => handleDownload(imageUrl, message.file?.filename)}>下载</button>
    </div>
  );
};
```

## 总结

### 关于设计合理性

当前的 `BaseMessage` + `ImageMessage` 的组合设计是合理的，因为：

1. ✅ 职责清晰：通用功能和具体内容分离
2. ✅ 代码复用：避免重复实现
3. ✅ 一致性：保证所有消息类型行为一致

### 简化替换过程

通过新增 `renderImagePreview` 属性：

1. ✅ 用户只需关注预览部分
2. ✅ 无需重新实现 `BaseMessage` 的功能
3. ✅ 保持向后兼容
4. ✅ 使用第三方库非常简单

### 推荐方案

对于大多数用户：

```tsx
// 最简单的方式
<Chat
  messageProps={{
    renderImagePreview: props => <YourCustomViewer {...props} />,
  }}
/>
```

完整示例请参考：

- `/demo/module/chat/CustomImagePreviewExample.tsx`
