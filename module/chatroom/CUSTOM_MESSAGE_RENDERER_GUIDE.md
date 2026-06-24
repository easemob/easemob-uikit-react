# Chatroom 自定义消息渲染指南

## 概述

`Chatroom` 组件现在支持通过 `customMessageRenderers` 参数自定义聊天室消息的渲染。这与 `MessageList` 的 `customRenderers` 保持一致，可以：

1. **自定义文本消息渲染**
2. **自定义 custom 消息渲染**（包括系统加入消息和礼物消息）
3. **隐藏特定消息**（返回 `null` 即可）
4. **完全自定义消息样式**

## API 定义

### ChatroomProps

```typescript
interface ChatroomProps {
  // ... 其他属性
  customMessageRenderers?: {
    txt?: MessageRenderer; // 自定义文本消息渲染
    custom?: MessageRenderer; // 自定义 custom 消息渲染
  };
}
```

### MessageRenderer

```typescript
type MessageRenderer = (context: MessageRenderContext) => ReactNode;

interface MessageRenderContext {
  message: ChatSDK.MessageBody | NoticeMessageBody;
  style: React.CSSProperties;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  isThread?: boolean;
  messageProps?: BaseMessageProps;
  onOpenThreadPanel?: (threadId: string) => void;
  onRtcInviteMessageClick?: (message: ChatSDK.MessageBody) => void;
  scrollToBottom?: () => void;
}
```

## 聊天室消息类型

聊天室主要有三种消息类型：

### 1. 文本消息 (txt)

用户发送的普通文本消息

### 2. Custom 消息 - 加入消息

- **customEvent**: `'CHATROOMUIKITUSERJOIN'`
- **作用**: 用户加入聊天室时自动发送
- **默认显示**: "xx 加入了" / "Joined"

### 3. Custom 消息 - 礼物消息

- **customEvent**: `'CHATROOMUIKITGIFT'`
- **作用**: 用户发送礼物
- **默认显示**: 礼物图标和数量

## 使用场景

### 场景 1: 隐藏 "xx 加入了" 消息

这是最常见的需求。用户希望隐藏加入聊天室的系统消息。

```tsx
import { Chatroom } from '@easemob/react-uikit';
import { ChatSDK } from '@easemob/react-uikit/module/SDK';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 保留其他 custom 消息的默认渲染
      // 如果返回 undefined 或 null，消息会被过滤掉
      // 如果想要默认渲染，需要手动返回组件
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>;
```

### 场景 2: 只隐藏加入消息，保留礼物消息

```tsx
import ChatroomMessage from '@easemob/react-uikit/module/chatroomMessage';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 只隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 礼物消息和其他 custom 消息使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>;
```

### 场景 3: 自定义加入消息的样式

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 自定义加入消息的显示
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        const userInfo = message.ext?.chatroom_uikit_userInfo || {};
        return (
          <div
            key={message.id}
            style={{
              textAlign: 'center',
              padding: '8px',
              color: '#999',
              fontSize: '12px',
            }}
          >
            🎉 欢迎 {userInfo.nickname || message.from} 进入直播间！
          </div>
        );
      }

      // 其他消息使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### 场景 4: 自定义礼物消息的样式

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 自定义礼物消息
      if (message.customEvent === 'CHATROOMUIKITGIFT') {
        let giftData = message.customExts?.chatroom_uikit_gift || {};
        if (typeof giftData === 'string') {
          giftData = JSON.parse(giftData);
        }

        return (
          <div
            key={message.id}
            style={{
              padding: '12px',
              background: 'linear-gradient(90deg, #ff6b6b, #ee5a6f)',
              borderRadius: '8px',
              margin: '8px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img src={giftData.giftIcon} alt="" style={{ width: '40px', height: '40px' }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {message.from} 送出了 {giftData.giftName}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>x{giftData.giftCount || 1}</div>
            </div>
          </div>
        );
      }

      // 其他消息使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### 场景 5: 同时自定义文本消息和 custom 消息

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    // 自定义文本消息
    txt: ctx => {
      const message = ctx.message as ChatSDK.TextMsgBody;

      return (
        <div
          key={message.id}
          style={{
            padding: '12px',
            background: '#f0f0f0',
            borderRadius: '8px',
            margin: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{message.from}</div>
          <div>{message.msg}</div>
        </div>
      );
    },

    // 自定义 custom 消息
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 礼物消息使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### 场景 6: 根据条件显示/隐藏消息

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 根据时间隐藏加入消息（只显示最近 5 分钟的）
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (message.time < fiveMinutesAgo) {
          return null; // 隐藏 5 分钟前的加入消息
        }
      }

      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### 场景 7: 完全自定义聊天室消息样式（不使用 ChatroomMessage）

```tsx
import { renderTxt } from '@easemob/react-uikit/module/textMessage';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    txt: ctx => {
      const message = ctx.message as ChatSDK.TextMsgBody;
      const userInfo = message.ext?.chatroom_uikit_userInfo || {};

      return (
        <div
          key={message.id}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            ...ctx.style,
          }}
        >
          <img
            src={userInfo.avatarURL || '/default-avatar.png'}
            alt=""
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
            }}
          />
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {userInfo.nickname || message.from}
            </div>
            <div style={{ marginTop: '4px' }}>{renderTxt(message.msg, true, () => {})}</div>
          </div>
        </div>
      );
    },

    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 完全自定义或隐藏
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null; // 隐藏
      }

      if (message.customEvent === 'CHATROOMUIKITGIFT') {
        // 自定义礼物消息
        return (
          <div key={message.id} style={ctx.style}>
            {/* 你的自定义礼物组件 */}
          </div>
        );
      }

      return null;
    },
  }}
/>;
```

## 与 messageActionConfig 配合使用

`customMessageRenderers` 可以与 `messageActionConfig` 一起使用，但需要注意：

- 如果使用 `customMessageRenderers` 并且**不返回** `<ChatroomMessage>` 组件，消息将**不会有操作菜单**
- 如果想要保留操作菜单，必须返回 `<ChatroomMessage>` 并传递 `actionConfig`

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  // 配置操作菜单
  messageActionConfig={{
    recall: true,
    translate: true,
    report: false,
  }}
  // 自定义渲染
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 礼物消息保留操作菜单（通过返回 ChatroomMessage）
      // messageActionConfig 会自动传递给 ChatroomMessage
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**注意**: 在 `customMessageRenderers` 中返回的 `<ChatroomMessage>` 组件会自动继承 `messageActionConfig`，无需手动传递。

## 最佳实践

### 1. 始终返回带 key 的元素

```tsx
// ✅ 好的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;
  return <ChatroomMessage message={message} key={message.id} />;
};

// ❌ 不好的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;
  return <ChatroomMessage message={message} />; // 缺少 key
};
```

### 2. 使用类型断言

```tsx
// ✅ 好的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;
  if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
    // ...
  }
};

// ❌ 不好的做法
custom: ctx => {
  if (ctx.message.customEvent === 'CHATROOMUIKITUSERJOIN') {
    // TypeScript 错误：MessageBody 上不存在 customEvent
  }
};
```

### 3. 处理所有消息类型

```tsx
// ✅ 好的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;

  // 处理加入消息
  if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
    return null;
  }

  // 处理礼物消息
  if (message.customEvent === 'CHATROOMUIKITGIFT') {
    return <ChatroomMessage message={message} key={message.id} />;
  }

  // 处理其他 custom 消息
  return <ChatroomMessage message={message} key={message.id} />;
};

// ⚠️ 需要注意的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;

  if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
    return null;
  }

  // 没有返回值，其他 custom 消息会被隐藏
};
```

### 4. 使用 useMemo 优化性能

如果渲染器逻辑复杂，建议使用 `useMemo`：

```tsx
import { useMemo } from 'react';

function MyChatroom() {
  const customRenderers = useMemo(
    () => ({
      custom: ctx => {
        const message = ctx.message as ChatSDK.CustomMsgBody;
        if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
          return null;
        }
        return <ChatroomMessage message={message} key={message.id} />;
      },
    }),
    [],
  ); // 依赖数组为空，因为逻辑不依赖外部状态

  return <Chatroom chatroomId="room-id" customMessageRenderers={customRenderers} />;
}
```

### 5. 应用 ctx.style

如果你自定义渲染，记得应用 `ctx.style`（包含虚拟滚动所需的定位样式）：

```tsx
custom: ctx => {
  return (
    <div
      key={ctx.message.id}
      style={{
        ...ctx.style, // ⚠️ 重要：应用虚拟滚动样式
        padding: '12px',
        // 你的其他样式
      }}
    >
      {/* 内容 */}
    </div>
  );
};
```

## 常见问题

### Q1: 如何隐藏所有加入消息？

**A**: 在 `customMessageRenderers.custom` 中检查 `customEvent` 并返回 `null`：

```tsx
customMessageRenderers={{
  custom: (ctx) => {
    const message = ctx.message as ChatSDK.CustomMsgBody;
    if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
      return null;
    }
    return <ChatroomMessage message={message} key={message.id} />;
  },
}}
```

### Q2: 如何禁止发送加入消息？

**A**: `customMessageRenderers` 只控制渲染，不能阻止消息发送。加入消息是在 `Chatroom` 组件内部自动发送的（`sendJoinedNoticeMessage` 函数）。

如果你想完全禁用发送加入消息，需要：

1. 使用 `renderMessageList` 自己渲染 MessageList
2. 自己实现 join chatroom 逻辑，不发送加入消息

或者向我们提需求，我们可以添加一个 `disableJoinMessage` 参数。

### Q3: 为什么我的自定义渲染器没有操作菜单？

**A**: 操作菜单是 `ChatroomMessage` 组件提供的。如果你完全自定义渲染，需要自己实现菜单：

```tsx
// 方案 1: 返回 ChatroomMessage（保留菜单）
return <ChatroomMessage message={message} key={message.id} />;

// 方案 2: 完全自定义（需要自己实现菜单）
return <MyCustomChatroomMessage message={message} />;
```

### Q4: customMessageRenderers 和 renderMessage 有什么区别？

**A**:

- `renderMessage` (已废弃): 需要处理所有消息类型，一旦使用就要完全接管渲染
- `customMessageRenderers`: 只需要提供想要自定义的类型，其他类型会使用默认渲染

```tsx
// ❌ 旧方式：renderMessage（已废弃）
renderMessage={(msg) => {
  if (msg.type === 'txt') return <MyTxtMsg />;
  if (msg.type === 'custom') return <MyCustomMsg />;
  // 必须处理所有类型...
}}

// ✅ 新方式：customMessageRenderers
customMessageRenderers={{
  custom: (ctx) => {
    // 只处理 custom 类型，txt 类型自动使用默认渲染
    return null; // 隐藏
  },
}}
```

### Q5: 可以在 customMessageRenderers 中使用异步操作吗？

**A**: 渲染器必须同步返回 ReactNode，但你可以在组件内部使用异步操作：

```tsx
// ❌ 不能这样
custom: async ctx => {
  const data = await fetchData();
  return <MyComponent data={data} />;
};

// ✅ 可以这样
custom: ctx => {
  // 返回一个组件，在组件内部处理异步
  return <MyAsyncComponent message={ctx.message} />;
};

function MyAsyncComponent({ message }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  if (!data) return <Loading />;
  return <div>{data}</div>;
}
```

## 完整示例

```tsx
import React, { useMemo } from 'react';
import { Chatroom } from '@easemob/react-uikit';
import { ChatSDK } from '@easemob/react-uikit/module/SDK';
import ChatroomMessage from '@easemob/react-uikit/module/chatroomMessage';

function MyChatroom() {
  const customRenderers = useMemo(
    () => ({
      // 自定义 custom 消息渲染
      custom: ctx => {
        const message = ctx.message as ChatSDK.CustomMsgBody;

        // 1. 隐藏加入消息
        if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
          return null;
        }

        // 2. 自定义礼物消息样式
        if (message.customEvent === 'CHATROOMUIKITGIFT') {
          let giftData = message.customExts?.chatroom_uikit_gift || {};
          if (typeof giftData === 'string') {
            giftData = JSON.parse(giftData);
          }

          return (
            <div
              key={message.id}
              style={{
                ...ctx.style,
                padding: '12px',
                background: 'linear-gradient(90deg, #ff6b6b, #ee5a6f)',
                borderRadius: '8px',
                margin: '8px',
                color: 'white',
              }}
            >
              <span>
                {message.from} 送出了 {giftData.giftName}
              </span>
              <span style={{ marginLeft: '8px' }}>x{giftData.giftCount || 1}</span>
            </div>
          );
        }

        // 3. 其他 custom 消息使用默认渲染
        return <ChatroomMessage message={message} key={message.id} />;
      },
    }),
    [],
  );

  return (
    <Chatroom
      chatroomId="your-chatroom-id"
      customMessageRenderers={customRenderers}
      messageActionConfig={{
        recall: true,
        translate: true,
        report: true,
      }}
    />
  );
}
```

## 迁移指南

### 从 renderMessage 迁移

如果你之前使用的是 `renderMessage`（已废弃），建议迁移到 `customMessageRenderers`：

```tsx
// ❌ 旧代码（renderMessage，已废弃）
<Chatroom
  chatroomId="room-id"
  messageListProps={{
    renderMessage: (msg) => {
      if (msg.type === 'txt') {
        return <ChatroomMessage message={msg} />;
      }
      if (msg.type === 'custom') {
        const customMsg = msg as ChatSDK.CustomMsgBody;
        if (customMsg.customEvent === 'CHATROOMUIKITUSERJOIN') {
          return null; // 隐藏加入消息
        }
        return <ChatroomMessage message={msg} />;
      }
    },
  }}
/>

// ✅ 新代码（customMessageRenderers）
<Chatroom
  chatroomId="room-id"
  customMessageRenderers={{
    custom: (ctx) => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null; // 隐藏加入消息
      }
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**优势**:

- ✅ 更简洁：不需要处理 `txt` 类型，会自动使用默认渲染
- ✅ 更类型安全：`ctx.message` 在不同渲染器中有不同的类型
- ✅ 更灵活：可以访问更多上下文信息（如 `scrollToBottom`）

## 相关文档

- [Chatroom 组件文档](./README.md)
- [MessageList customRenderers 文档](../chat/CUSTOM_RENDERER_GUIDE.md)
- [ChatroomMessage 组件文档](../chatroomMessage/README.md)
- [消息操作菜单配置文档](./MESSAGE_ACTION_CONFIG_GUIDE.md)
