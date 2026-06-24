# MessageList 自定义渲染器指南

## 概述

新的 `customRenderers` API 允许您按消息类型自定义渲染逻辑，无需重新实现所有消息类型的渲染。

## 为什么需要这个功能？

### 新的方式

```tsx
<MessageList
  customRenderers={{
    // 只需要自定义你关心的类型
    txt: ctx => <MyCustomTextMessage message={ctx.message} />,
    // 其他类型会自动使用默认渲染
  }}
/>
```

## API 说明

### 类型定义

```typescript
export type MessageType =
  | 'txt' // 文本消息
  | 'img' // 图片消息
  | 'audio' // 语音消息
  | 'video' // 视频消息
  | 'file' // 文件消息
  | 'loc' // 位置消息
  | 'combine' // 合并消息
  | 'custom' // 自定义消息
  | 'notice' // 通知消息
  | 'recall'; // 撤回消息

export interface MessageRenderContext {
  message: ChatSDK.MessageBody | NoticeMessageBody;
  style: React.CSSProperties;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  isThread?: boolean;
  messageProps?: BaseMessageProps;
  onOpenThreadPanel?: (threadId: string) => void;
  onRtcInviteMessageClick?: (message: ChatSDK.MessageBody) => void;
  scrollToBottom?: () => void;
}

export type MessageRenderer = (context: MessageRenderContext) => ReactNode;
```

### Props

```typescript
interface MsgListProps {
  // 新增的 API（推荐）
  customRenderers?: Partial<Record<MessageType, MessageRenderer>>;

  // 旧的 API（仍然支持，但不推荐）
  renderMessage?: (message: ChatSDK.MessageBody | NoticeMessageBody) => ReactNode;

  // ... 其他 props
}
```

## 使用示例

### 基础示例：自定义文本消息

```tsx
import { MessageList, MessageRenderContext } from '@easemob/react-uikit';
import { TextMessage } from '@easemob/react-uikit';

function MyChat() {
  return (
    <MessageList
      customRenderers={{
        txt: (ctx: MessageRenderContext) => {
          return (
            <div style={{ background: '#f0f0f0', padding: '10px' }}>
              <TextMessage
                textMessage={ctx.message}
                renderUserProfile={ctx.renderUserProfile}
                thread={ctx.isThread}
                {...ctx.messageProps}
              />
            </div>
          );
        },
      }}
    />
  );
}
```

### 自定义多种类型

```tsx
<MessageList
  customRenderers={{
    txt: ctx => {
      // 自定义文本消息样式
      return (
        <div className="my-text-message">
          <TextMessage textMessage={ctx.message} {...ctx.messageProps} />
        </div>
      );
    },
    img: ctx => {
      // 自定义图片消息，添加水印
      return (
        <div className="my-image-message">
          <img src={ctx.message.url} alt="message" />
          <div className="watermark">公司机密</div>
        </div>
      );
    },
    // audio, video, file 等其他类型会使用默认渲染
  }}
/>
```

### 添加额外功能

```tsx
<MessageList
  customRenderers={{
    txt: ctx => {
      const message = ctx.message as ChatSDK.TextMsgBody;

      const handleCopy = () => {
        navigator.clipboard.writeText(message.msg);
        console.log('已复制消息');
      };

      return (
        <div style={{ position: 'relative' }}>
          <TextMessage
            textMessage={message}
            renderUserProfile={ctx.renderUserProfile}
            thread={ctx.isThread}
            {...ctx.messageProps}
          />
          <button onClick={handleCopy} style={{ position: 'absolute', top: 0, right: 0 }}>
            复制
          </button>
        </div>
      );
    },
  }}
/>
```

### 使用上下文中的方法

```tsx
<MessageList
  customRenderers={{
    txt: ctx => {
      const message = ctx.message as ChatSDK.TextMsgBody;

      return (
        <div
          onClick={() => {
            // 可以访问上下文中的方法
            console.log('消息被点击:', message);
            ctx.scrollToBottom?.(); // 滚动到底部
          }}
        >
          <TextMessage textMessage={message} {...ctx.messageProps} />
        </div>
      );
    },
  }}
/>
```

### 完全自定义渲染

```tsx
<MessageList
  customRenderers={{
    txt: ctx => {
      const message = ctx.message as ChatSDK.TextMsgBody;

      // 完全自定义，不使用内置组件
      return (
        <div className="my-custom-message">
          <div className="avatar">{message.from}</div>
          <div className="content">
            <p>{message.msg}</p>
            <span className="time">{new Date(message.time).toLocaleTimeString()}</span>
          </div>
        </div>
      );
    },
  }}
/>
```

## 最佳实践

### 1. 按需自定义

只自定义你需要修改的消息类型，其他类型让库处理：

```tsx
// ✅ 推荐
<MessageList
  customRenderers={{
    txt: customTextRenderer,
    // 只自定义文本消息，其他使用默认
  }}
/>

// ❌ 不推荐
<MessageList
  customRenderers={{
    txt: customTextRenderer,
    img: defaultImageRenderer, // 不需要重复定义默认行为
    audio: defaultAudioRenderer,
    // ...
  }}
/>
```

### 2. 复用上下文

充分利用 `MessageRenderContext` 中的属性和方法：

```tsx
customRenderers={{
  txt: (ctx) => {
    return (
      <TextMessage
        textMessage={ctx.message}
        style={ctx.style} // 使用传入的样式
        renderUserProfile={ctx.renderUserProfile} // 使用传入的渲染器
        thread={ctx.isThread} // 使用传入的状态
        {...ctx.messageProps} // 传递所有消息属性
      />
    );
  },
}}
```

### 3. 类型安全

使用 TypeScript 确保类型安全：

```tsx
import { MessageRenderContext } from '@easemob/react-uikit';
import { ChatSDK } from '@easemob/react-uikit';

const customTextRenderer = (ctx: MessageRenderContext) => {
  const message = ctx.message as ChatSDK.TextMsgBody;
  // TypeScript 会提供类型提示和检查
  return <div>{message.msg}</div>;
};

<MessageList
  customRenderers={{
    txt: customTextRenderer,
  }}
/>;
```

### 4. 性能优化

对于复杂的自定义渲染器，考虑使用 `useMemo` 或 `useCallback`：

```tsx
const customRenderers = useMemo(
  () => ({
    txt: (ctx: MessageRenderContext) => {
      // 复杂的渲染逻辑
      return <CustomTextMessage {...ctx} />;
    },
  }),
  [
    /* 依赖项 */
  ],
);

<MessageList customRenderers={customRenderers} />;
```

## 迁移指南

如果你正在使用旧的 `renderMessage` API，可以按以下步骤迁移：

### 迁移前

```tsx
<MessageList
  renderMessage={message => {
    if (message.type === 'txt') {
      return <MyTextMessage message={message} />;
    }
    if (message.type === 'img') {
      return <ImageMessage imageMessage={message} {...allProps} />;
    }
    // ... 更多类型
    return null;
  }}
/>
```

### 迁移后

```tsx
<MessageList
  customRenderers={{
    txt: ctx => <MyTextMessage message={ctx.message} />,
    // 不需要再处理 img 和其他类型，会自动使用默认渲染
  }}
/>
```

## 注意事项

1. `renderMessage` 和 `customRenderers` 可以同时存在，但 `renderMessage` 优先级更高（为了向后兼容）
2. 如果 `customRenderers` 中没有找到对应类型的渲染器，会使用默认渲染器
3. 自定义渲染器返回 `null` 时，该消息不会被渲染
4. `key` 属性会自动添加，不需要在自定义渲染器中设置

## 常见问题

### Q: 可以访问默认渲染器吗？

A: 目前版本暂不支持在自定义渲染器中调用默认渲染器。如果需要基于默认渲染器修改，建议直接使用对应的消息组件（如 `TextMessage`、`ImageMessage` 等）。

### Q: 如何处理自定义类型的消息？

A: 使用 `custom` 类型的渲染器，然后在内部根据 `customEvent` 进一步判断：

```tsx
customRenderers={{
  custom: (ctx) => {
    const message = ctx.message as CustomMessageType;
    if (message.customEvent === 'myCustomType') {
      return <MyCustomComponent message={message} />;
    }
    // 返回 null 使用默认处理
    return null;
  },
}}
```

### Q: 性能会受到影响吗？

A: 不会。内部使用 `useMemo` 优化，只有在依赖项变化时才会重新创建渲染器映射。
