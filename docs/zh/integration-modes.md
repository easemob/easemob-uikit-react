# 三种接入模式

UIKit 不是只能整页塞进去，也不应一上来就深入 `rootStore` 内部字段。推荐按业务复杂度选择下面三种模式，并逐步下沉定制。

相关文档：

- 最短路径：[Foundation Quickstart](./foundation-quickstart.md)
- Provider 配置：[UIKitProvider](./provider.md)
- SDK 5 迁移：[SDK 5 迁移指南](./sdk5-migration.md)
- 业务数据：[业务数据接入](./business-data.md)
- 场景 FAQ：[FAQ](./faq.md)

## 模式对比

| 模式 | 适用场景 | 你要写的代码 | 不建议做的事 |
|------|----------|--------------|--------------|
| 完整页面 | 最快上线 IM | `Provider` + `ConversationList` + `Chat` | 复制内部 store 实现 |
| hooks / store 组合 | 已有业务页面，只要数据和动作 | 导出的 hooks / 文档化 store action | `import .../module/store/*` |
| 纯 UI | 完全自定义页面结构 | 导出的 UI / 消息组件 + 自己的数据 | 假设已有完整 headless / slot API |

只使用这些稳定导入面：

```ts
import { ... } from 'easemob-chat-uikit';
import { ... } from 'easemob-chat-uikit/module';
import { ... } from 'easemob-chat-uikit/component';
import 'easemob-chat-uikit/style.css';
```

不要依赖仓库内部路径，例如 `module/store/*`、`module/index`、`component/entry`。

---

## 模式一：完整页面

适合想最快搭出「会话列表 + 聊天」的应用。

```tsx
import React from 'react';
import { Provider, Chat, ConversationList, rootStore } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

function ChatApp() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 320 }}>
        <ConversationList />
      </div>
      <div style={{ flex: 1 }}>
        <Chat />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider
      initConfig={{
        appKey: 'your app key',
        userId: 'your user id',
        token: 'your token',
      }}
      providers={{
        userInfo: async userIds =>
          userIds.map(userId => ({
            userId,
            nickname: userId,
          })),
      }}
    >
      <ChatApp />
    </Provider>
  );
}
```

定制入口：

- `features`：开关内置能力
- `renderHeader` / `renderMessage` / `renderItem` 等 render props
- `providers.userInfo` / `providers.groupInfo`

可选：登录后若需要手动补一条会话，可使用 `rootStore.conversationStore.addConversation(...)`；正常在线同步时 `ConversationList` 会自行拉取会话。

---

## 模式二：hooks / store 组合

适合你已有业务布局，只需要会话列表数据、当前会话、发送消息等能力。

```tsx
import React from 'react';
import {
  Provider,
  RootContext,
  useConversationContext,
  useChatContext,
  rootStore,
} from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

function ConversationPanel() {
  const { conversationList, setCurrentConversation } = useConversationContext();

  return (
    <ul>
      {conversationList.map(cvs => (
        <li
          key={`${cvs.chatType}_${cvs.conversationId}`}
          onClick={() =>
            setCurrentConversation({
              chatType: cvs.chatType,
              conversationId: cvs.conversationId,
              name: cvs.name,
            })
          }
        >
          {cvs.name || cvs.conversationId} ({cvs.unreadCount || 0})
        </li>
      ))}
    </ul>
  );
}

function Composer() {
  const { sendMessage } = useChatContext();
  const { client } = React.useContext(RootContext);

  const onSend = () => {
    if (!rootStore.loginState) return;
    const current = rootStore.conversationStore.currentCvs;
    if (!current?.conversationId) return;
    const message = client.chatManager.createTextMessage({
      conversationId: current.conversationId,
      conversationType: current.chatType,
      content: 'hello',
      needReadReceipt: current.chatType !== 'chatRoom',
    });
    sendMessage(message);
  };

  return <button onClick={onSend}>发送</button>;
}

export default function App() {
  return (
    <Provider
      initConfig={{
        appKey: 'your app key',
        userId: 'your user id',
        token: 'your token',
      }}
    >
      <ConversationPanel />
      <Composer />
    </Provider>
  );
}
```

业务组件应从 `RootContext.client` 获取 SDK 实例。不要在首次 render 直接读取
`rootStore.client`；需要联网的 Manager API 还应等待 `rootStore.loginState === true`。

当前可优先使用的导出 hooks：

- `useConversationContext`
- `useChatContext`
- `useAddressContext`
- `useChatroomContext`
- `useThreadContext`

更细的 store 公共/内部边界将在后续 change `uikit-public-store-api` 中收紧；在那之前，请只调用文档示例中出现的 action，不要依赖未文档化的内部字段。

---

## 模式三：纯 UI

适合你要完全自定义页面结构，只复用气泡、头像、列表项等展示能力。

```tsx
import React from 'react';
import { Avatar, Button } from 'easemob-chat-uikit/component';
import { TextMessage } from 'easemob-chat-uikit';

function CustomBubble(props: {
  message: any;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Avatar>{props.message.sender?.nickname || props.message.from}</Avatar>
      <TextMessage textMessage={props.message} onlyContent />
    </div>
  );
}

export default function CustomPage() {
  return (
    <div>
      <CustomBubble
        message={{
          msgLocalId: 'local-1',
          msgServerId: 'server-1',
          conversationId: 'alice',
          conversationType: 'singleChat',
          type: 'text',
          timestamp: Date.now(),
          from: 'alice',
          to: 'me',
          sendStatus: 'sent',
          direct: 'RECEIVE',
          body: { content: '纯 UI 示例' },
          sender: { userId: 'alice', nickname: 'Alice' },
          ext: {},
        }}
      />
      <Button>业务按钮</Button>
    </div>
  );
}
```

### 当前限制（请先读）

- 页面级 **slot API**（如 `<Chat.Header />` 组合）尚未系统化，现阶段仍以 props / render props 为主。
- **headless hooks** 覆盖还不完整；复杂收发、未读、已读回执仍可能需要页面组件或 store action。
- 后续计划：
  - `uikit-public-store-api`：文档化可调用 Store API，标记 internal
  - `uikit-headless-hooks` / `uikit-slot-api`：补齐组合层与插槽

如果你现在就要深度定制，优先：完整页面模式 + render props / features，而不是 fork 内部实现。
