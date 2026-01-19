# 聊天室页面介绍

环信聊天室 UIKit 提供 `Chatroom` 组件方便用户快速集成聊天室页面和自定义聊天室页面。该页面提供如下功能：

- 发送和接收消息，包括文本、表情、礼物消息。
- 对消息进行撤回、翻译、禁言、举报、置顶等操作。
- 显示全局广播消息。
- 显示置顶消息。

## 页面组件

聊天室页面通过 `Chatroom` 组件实现，由标题栏（`Header`）、消息列表（`MessageList`）、底部输入框（`MessageInput`）和广播组件（`Broadcast`）组成。

### 标题栏

聊天室页面的标题栏使用 `Header` 组件，支持自定义标题、头像、成员数量等。详见 [设置标题栏](#设置标题栏)。

### 消息列表

消息列表 `MessageList` 用于展示发送和接收的消息，以及对消息进行操作：

- **发送和接收消息**：包括文本、表情、礼物等消息。
- **系统消息**：用户加入聊天室的提示消息（可通过 `customMessageRenderers` 隐藏）。
- **消息操作**：对消息进行撤回、翻译、禁言、举报、置顶操作。

### 底部输入框

消息底部输入框 `MessageInput` 实现各类消息的输入和发送以及表情、礼物等功能，包括：

- 文本输入和发送。
- 表情选择。
- 礼物发送。

### 广播组件

广播组件 `Broadcast` 用于显示全局广播消息，支持循环播放。

## 使用示例

```jsx
import React from 'react';
import { Chatroom } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatroomContainer = () => {
  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chatroom chatroomId="your-chatroom-id" />
    </div>
  );
};
```

## 高级设置

## 消息列表的设置

消息列表是聊天室界面的核心组件，基于 `MessageList` 组件实现。本文介绍如何通过 `Chatroom` 组件的 `messageListProps` 实现消息列表和消息条目的设置。

### 概述

`Chatroom` 组件提供了 `messageListProps` 属性，方便开发者进行一些自定义设置：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageListProps={{
    // 自定义渲染消息
    customRenderers: {
      txt: ctx => <CustomTextMessage message={ctx.message} />,
    },
    // 其他配置...
  }}
/>
```

### 设置消息列表背景

通过 `Chatroom` 组件的 `className` 和 `style` 属性可以设置聊天室界面的背景：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  className="custom-chatroom"
  style={{
    backgroundImage: 'url(/path/to/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
/>
```

或使用 CSS 类：

```css
.custom-chatroom {
  background-image: url(/path/to/background.jpg);
  background-size: cover;
  background-position: center;
}
```

### 设置消息列表空白页面

通过 `Chatroom` 组件的 `renderEmpty` 属性可以自定义空内容组件：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  renderEmpty={() => (
    <div className="empty-chatroom">
      <p>暂无消息</p>
    </div>
  )}
/>
```

## 消息列表的高级设置

### 隐藏人员加入消息

聊天室中，当用户加入时会自动发送一条加入消息（`customEvent: 'CHATROOMUIKITUSERJOIN'`）。如果你希望隐藏这些消息，可以使用 `customMessageRenderers`：

**推荐用法：隐藏加入消息**

```jsx
import { Chatroom } from 'easemob-chat-uikit';
import { ChatSDK } from 'easemob-chat-uikit/module/SDK';
import ChatroomMessage from 'easemob-chat-uikit/module/chatroomMessage';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 其他 custom 消息（如礼物）使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**加入消息的特征**

```typescript
message.type === 'custom';
message.customEvent === 'CHATROOMUIKITUSERJOIN';
```

### 自定义消息渲染（customMessageRenderers）

`customMessageRenderers` 允许你自定义特定类型消息的渲染方式。这是**推荐的自定义消息方式**。

#### API 定义

```typescript
interface ChatroomProps {
  customMessageRenderers?: {
    txt?: MessageRenderer; // 自定义文本消息渲染
    custom?: MessageRenderer; // 自定义 custom 消息渲染（包括加入消息和礼物消息）
  };
}

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

#### 使用场景

**场景 1: 隐藏加入消息（推荐用法）**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null; // 隐藏加入消息
      }
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**场景 2: 自定义加入消息样式**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
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
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**场景 3: 自定义礼物消息样式**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
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
            }}
          >
            <span>{message.from} 送出了 {giftData.giftName}</span>
            <span style={{ marginLeft: '8px' }}>x{giftData.giftCount || 1}</span>
          </div>
        );
      }
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**场景 4: 同时自定义文本消息和 custom 消息**

```jsx
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
          <div style={{ fontSize: '12px', color: '#666' }}>{message.from}</div>
          <div>{message.msg}</div>
        </div>
      );
    },
    // 自定义 custom 消息
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null; // 隐藏加入消息
      }
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

**最佳实践**

1. **始终返回带 key 的元素**

```jsx
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

2. **使用类型断言**

```jsx
// ✅ 好的做法
custom: ctx => {
  const message = ctx.message as ChatSDK.CustomMsgBody;
  if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
    // ...
  }
};
```

3. **应用 ctx.style（虚拟滚动所需）**

```jsx
custom: ctx => {
  return (
    <div
      key={ctx.message.id}
      style={{
        ...ctx.style, // ⚠️ 重要：应用虚拟滚动样式
        padding: '12px',
      }}
    >
      {/* 内容 */}
    </div>
  );
};
```

## 设置消息操作菜单

聊天室支持通过 `messageActionConfig` 配置消息长按菜单，包括内置功能和自定义菜单项。

### 概述

`messageActionConfig` 允许你：

1. **选择性启用内置功能**（撤回、翻译、禁言、举报、置顶）
2. **添加自定义菜单项**
3. **控制菜单项的显示条件**

### API 定义

```typescript
interface ChatroomMessageActionConfig {
  // 内置功能开关
  recall?: boolean; // 撤回消息，默认 true
  translate?: boolean; // 翻译消息，默认 true
  mute?: boolean; // 禁言（仅群主可见），默认 true
  report?: boolean; // 举报消息，默认 true
  pin?: boolean; // 置顶消息（仅群主可见），默认 true

  // 自定义菜单项
  customActions?: Array<{
    content: string | ReactNode; // 菜单项文本或自定义内容
    icon?: ReactNode; // 菜单项图标
    onClick: (message: ChatSDK.MessageBody) => void; // 点击回调
    visible?: (message: ChatSDK.MessageBody) => boolean; // 是否显示该菜单项（可选）
  }>;
}
```

### 内置功能说明

| 功能             | 默认值 | 显示条件                   | 描述                         |
| :--------------- | :----- | :------------------------- | :--------------------------- |
| 撤回 (recall)    | `true` | 仅显示在自己发送的消息上   | 撤回消息                     |
| 翻译 (translate) | `true` | 仅文本消息显示             | 翻译消息到目标语言           |
| 禁言 (mute)      | `true` | 仅群主可见，且不能禁言自己 | 禁言/取消禁言聊天室成员      |
| 举报 (report)    | `true` | 不能举报自己的消息         | 举报不当消息                 |
| 置顶 (pin)       | `true` | 仅群主可见                 | 置顶消息（会取消之前的置顶） |

### 使用示例

**示例 1: 只保留撤回功能**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    recall: true, // 保留撤回
    translate: false, // 禁用翻译
    mute: false, // 禁用禁言
    report: false, // 禁用举报
    pin: false, // 禁用置顶
  }}
/>
```

**示例 2: 添加自定义菜单项**

```jsx
import { Chatroom } from 'easemob-chat-uikit';
import Icon from 'easemob-chat-uikit/component/icon';

<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    // 保留所有内置功能（默认）
    recall: true,
    translate: true,
    mute: true,
    report: true,
    pin: true,

    // 添加自定义菜单项
    customActions: [
      {
        content: '复制',
        icon: <Icon type="COPY" width={16} height={16} />,
        onClick: message => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
            console.log('消息已复制');
          }
        },
      },
      {
        content: '转发',
        icon: <Icon type="SHARE" width={16} height={16} />,
        onClick: message => {
          console.log('转发消息:', message);
        },
      },
    ],
  }}
/>;
```

**示例 3: 条件显示自定义菜单项**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    customActions: [
      {
        content: '复制文本',
        icon: <Icon type="COPY" width={16} height={16} />,
        onClick: message => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
          }
        },
        // 只在文本消息上显示
        visible: message => message.type === 'txt',
      },
      {
        content: '删除消息',
        icon: <Icon type="DELETE" width={16} height={16} />,
        onClick: message => {
          // 删除消息逻辑
        },
        // 只能删除自己的消息
        visible: message => message.from === rootStore.client.user,
      },
    ],
  }}
/>
```

**示例 4: 完全自定义（禁用所有内置功能）**

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    // 禁用所有内置功能
    recall: false,
    translate: false,
    mute: false,
    report: false,
    pin: false,

    // 只使用自定义菜单
    customActions: [
      {
        content: '我的功能 1',
        onClick: message => {
          console.log('功能 1', message);
        },
      },
      {
        content: '我的功能 2',
        onClick: message => {
          console.log('功能 2', message);
        },
      },
    ],
  }}
/>
```

**示例 5: 根据角色显示不同菜单**

```jsx
import { useMemo } from 'react';

const messageActionConfig = useMemo(() => {
  const isOwner = chatroomData.owner === rootStore.client.user;

  if (isOwner) {
    // 群主可以使用所有功能
    return {
      recall: true,
      translate: true,
      mute: true,
      report: true,
      pin: true,
    };
  } else {
    // 普通成员只能撤回自己的消息和翻译
    return {
      recall: true,
      translate: true,
      mute: false,
      report: true,
      pin: false,
    };
  }
}, [chatroomData.owner]);

<Chatroom chatroomId="your-chatroom-id" messageActionConfig={messageActionConfig} />;
```

### 菜单项显示顺序

菜单项按以下顺序显示：

1. **撤回** (recall) - 如果启用且是自己的消息
2. **禁言** (mute) - 如果启用且是群主且不是自己
3. **置顶** (pin) - 如果启用且是群主
4. **翻译** (translate) - 如果启用
5. **举报** (report) - 如果启用且不是自己的消息
6. **自定义菜单项** - 按照 `customActions` 数组的顺序

### 与 customMessageRenderers 配合使用

`messageActionConfig` 可以与 `customMessageRenderers` 一起使用：

```jsx
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

## 设置底部输入框

消息底部输入框 `MessageInput` 实现各类消息的输入和发送以及表情、礼物等功能。

### 设置底部输入框背景

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageInputProps={{
    style: {
      backgroundColor: '#f5f5f5',
    },
  }}
/>
```

或使用 CSS：

```css
.cui-message-editor {
  background-color: #f5f5f5;
}
```

### 设置底部输入菜单

你可以通过 `messageInputProps` 配置输入菜单：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageInputProps={{
    // 配置输入框功能
    actions: [
      {
        name: 'TEXTAREA', // 消息输入框
        visible: true,
      },
      {
        name: 'EMOJI', // 表情
        visible: true,
      },
      {
        name: 'GIFT', // 礼物
        visible: true,
      },
    ],
    // 默认占位符
    placeHolder: '请输入内容',
    // 发送消息的回调
    onSendMessage: message => {
      console.log('发送消息', message);
    },
  }}
/>
```

### 自定义礼物功能

礼物功能由 `GiftKeyboard` 组件提供，你可以通过全局配置控制是否显示：

```jsx
// 在初始化时配置
const features = {
  chatroom: {
    messageInput: {
      gift: true, // 显示礼物功能（默认）
      emoji: true, // 显示表情功能（默认）
    },
  },
};
```

## 设置标题栏

聊天室页面的标题栏使用 `Header` 组件，你可以通过 `Chatroom` 组件的 `headerProps` 进行自定义设置。

### 标题栏可修改的属性

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  headerProps={{
    // 头像
    avatar: <Avatar src="avatar-url" />,
    // 点击头像的回调
    onAvatarClick: () => {
      console.log('点击头像');
    },
    // 点击成员列表的回调
    onClickMember: () => {
      console.log('点击成员列表');
    },
    // 更多操作菜单
    moreAction: {
      visible: true,
      actions: [
        {
          content: '聊天室设置',
          onClick: () => {
            console.log('聊天室设置');
          },
        },
      ],
    },
  }}
/>
```

### 自定义渲染标题栏

你也可以通过 `renderHeader` 完全自定义标题栏：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  renderHeader={roomInfo => {
    return (
      <div className="custom-header">
        <div>{roomInfo.name || roomInfo.id}</div>
        <div>自定义标题栏内容</div>
      </div>
    );
  }}
/>
```

## 设置广播组件

聊天室支持显示全局广播消息，你可以通过 `broadcastProps` 配置广播组件：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  broadcastProps={{
    loop: 0, // 循环次数，0 表示无限循环
    delay: 1, // 延迟时间（秒）
    play: true, // 是否自动播放
  }}
/>
```

或通过 `renderBroadcast` 自定义渲染：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  renderBroadcast={() => {
    return <CustomBroadcast />;
  }}
/>
```

### 可自定义的 CSS 类名

Chatroom 提供了以下主要的 CSS 类名，你可以通过覆盖这些类名来自定义样式：

| 类名                       | 说明           |
| :------------------------- | :------------- |
| `.cui-chatroom`            | 聊天室容器     |
| `.cui-messageList`         | 消息列表       |
| `.cui-messageList-msgItem` | 消息条目       |
| `.cui-message-editor`      | 消息输入框容器 |
| `.cui-header`              | 标题栏         |

## Chatroom props 总览

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `className` | `string` | 组件的类名 |
| `prefix` | `string` | CSS 类名前缀 |
| `style` | `React.CSSProperties` | 组件的内联样式 |
| `chatroomId` | `string` | 聊天室 ID（必须） |
| `headerProps` | `object` | Header 组件的参数 |
| `messageListProps` | `MsgListProps` | MessageList 组件的参数 |
| `messageInputProps` | `MessageInputProps` | MessageInput 组件的参数 |
| `broadcastProps` | `BroadcastProps` | Broadcast 组件的参数 |
| `renderHeader` | `(roomInfo: ChatroomInfo) => ReactNode` | 自定义渲染 Header 组件的方法 |
| `renderMessageList` | `() => ReactNode` | 自定义渲染 MessageList 组件的方法 |
| `renderMessageInput` | `() => ReactNode` | 自定义渲染 MessageInput 组件的方法 |
| `renderBroadcast` | `() => ReactNode` | 自定义渲染 Broadcast 组件的方法 |
| `renderEmpty` | `() => ReactNode` | 自定义渲染空内容组件的方法 |
| `messageActionConfig` | `ChatroomMessageActionConfig` | 消息操作菜单配置 |
| `customMessageRenderers` | `object` | 自定义消息渲染器 |
| `reportType` | `Record<string, string>` | 自定义举报内容 |
| `showUnreadCount` | `boolean` | 消息列表不在最下面时，是否显示未读数，默认 false |

## 修改主题

`Chatroom` 组件提供了以下与聊天室页面主题相关的配置，关于怎样修改主题请查看 [主题文档](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/theme.md)。

```javascript
import { Provider } from 'easemob-chat-uikit';

<Provider
  theme={{
    mode: 'light', // 'light' | 'dark'
    primaryColor: '#00CE76', // 主题色
  }}
>
  <Chatroom chatroomId="your-chatroom-id" />
</Provider>;
```

## 常见问题

### Q1: 如何隐藏所有加入消息？

**A**: 使用 `customMessageRenderers`：

```jsx
<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>
```

### Q2: 如何禁止发送加入消息？

**A**: `customMessageRenderers` 只控制渲染，不能阻止消息发送。加入消息是在 `Chatroom` 组件内部自动发送的。如果你想完全禁用发送加入消息，需要：

1. 使用 `renderMessageList` 自己渲染 MessageList
2. 自己实现 join chatroom 逻辑，不发送加入消息

### Q3: 为什么我的自定义渲染器没有操作菜单？

**A**: 操作菜单是 `ChatroomMessage` 组件提供的。如果你完全自定义渲染，需要自己实现菜单，或者返回 `<ChatroomMessage>` 组件：

```jsx
// 方案 1: 返回 ChatroomMessage（保留菜单）
return <ChatroomMessage message={message} key={message.id} />;

// 方案 2: 完全自定义（需要自己实现菜单）
return <MyCustomChatroomMessage message={message} />;
```

### Q4: customMessageRenderers 和 renderMessage 有什么区别？

**A**:

- `renderMessage` (已废弃): 需要处理所有消息类型，一旦使用就要完全接管渲染
- `customMessageRenderers`: 只需要提供想要自定义的类型，其他类型会使用默认渲染

```jsx
// ❌ 旧方式：renderMessage（已废弃）
messageListProps={{
  renderMessage: msg => {
    if (msg.type === 'txt') return <MyTxtMsg />;
    if (msg.type === 'custom') return <MyCustomMsg />;
    // 必须处理所有类型...
  },
}}

// ✅ 新方式：customMessageRenderers
customMessageRenderers={{
  custom: ctx => {
    // 只处理 custom 类型，txt 类型自动使用默认渲染
    return null; // 隐藏
  },
}}
```
