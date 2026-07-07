# Foundation Quickstart

这份文档只覆盖当前推荐的最短接入路径，目标是尽快搭起一个可运行、可继续扩展的 UIKit 应用。

## 1. 推荐导入面

优先使用这些稳定入口：

- `easemob-chat-uikit`
- `easemob-chat-uikit/module`
- `easemob-chat-uikit/component`
- `easemob-chat-uikit/style.css`

不要直接依赖仓库内部路径，例如 `module/store/*`、`module/index`、`component/entry`。

## 2. 最小可运行示例

```tsx
import React from 'react';
import { Provider, Chat, ConversationList, rootStore } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const conversation = {
  chatType: 'singleChat' as const,
  conversationId: 'alice',
  name: 'Alice',
  lastMessage: {},
};

function ChatApp() {
  React.useEffect(() => {
    rootStore.conversationStore.addConversation(conversation);
  }, []);

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
        userInfo: async userIds => {
          return userIds.map(userId => ({
            userId,
            nickname: userId,
          }));
        },
      }}
    >
      <ChatApp />
    </Provider>
  );
}
```

## 3. Provider 推荐分组

- `initConfig`: SDK 初始化和 UIKit 运行时参数。
- `providers.userInfo`: 业务侧用户昵称/头像提供器。
- `providers.groupInfo`: 业务侧群名称/头像提供器。
- `features`: 内置能力开关。
- `theme` / `local`: 主题和国际化。

旧的 `userInfoProvider` 仍然兼容，但新接入推荐统一改为 `providers.userInfo`。

## 4. SDK 5 数据模型注意点

新代码请优先使用 SDK 5 原生字段：

- `msgLocalId`
- `msgServerId`
- `conversationId`
- `conversationType`
- `timestamp`
- `body.*`

不要把 SDK 5 消息再降回旧字段作为主模型，例如 `id`、`msg`、`chatType`、`time`、`bySelf`。

## 5. 发布级验证

在修改公共 API、Provider 配置、类型定义、导出面之后，至少运行：

```bash
npm run validate:lib
npm run validate:foundation
```

如果改动影响发布产物，再运行：

```bash
npm run build
```
