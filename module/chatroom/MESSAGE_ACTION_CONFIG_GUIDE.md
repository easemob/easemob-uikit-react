# 聊天室消息操作菜单自定义配置指南

## 功能概述

现在 `Chatroom` 组件支持通过 `messageActionConfig` 参数自定义消息操作菜单。你可以：

1. **选择性启用内置功能**（撤回、翻译、禁言、举报、置顶）
2. **添加自定义菜单项**
3. **控制菜单项的显示条件**

## API 定义

### ChatroomProps

```typescript
interface ChatroomProps {
  // ... 其他属性
  messageActionConfig?: ChatroomMessageActionConfig; // 消息操作菜单配置
}
```

### ChatroomMessageActionConfig

```typescript
interface ChatroomMessageActionConfig {
  // 内置功能开关
  recall?: boolean;    // 撤回消息，默认 true
  translate?: boolean; // 翻译消息，默认 true
  mute?: boolean;      // 禁言（仅群主可见），默认 true
  report?: boolean;    // 举报消息，默认 true
  pin?: boolean;       // 置顶消息（仅群主可见），默认 true
  
  // 自定义菜单项
  customActions?: Array<{
    content: string | ReactNode;  // 菜单项文本或自定义内容
    icon?: ReactNode;             // 菜单项图标
    onClick: (message: ChatSDK.MessageBody) => void; // 点击回调
    visible?: (message: ChatSDK.MessageBody) => boolean; // 是否显示该菜单项（可选）
  }>;
}
```

## 内置功能说明

### 1. 撤回 (recall)
- **默认**: `true`
- **显示条件**: 仅显示在自己发送的消息上
- **功能**: 撤回消息

### 2. 翻译 (translate)
- **默认**: `true`
- **显示条件**: 仅文本消息显示
- **功能**: 翻译消息到目标语言

### 3. 禁言 (mute)
- **默认**: `true`
- **显示条件**: 仅群主可见，且不能禁言自己
- **功能**: 禁言/取消禁言聊天室成员

### 4. 举报 (report)
- **默认**: `true`
- **显示条件**: 不能举报自己的消息
- **功能**: 举报不当消息

### 5. 置顶 (pin)
- **默认**: `true`
- **显示条件**: 仅群主可见
- **功能**: 置顶消息（会取消之前的置顶）

## 使用示例

### 示例 1: 只保留撤回功能

```tsx
import { Chatroom } from '@easemob/react-uikit';

<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    recall: true,      // 保留撤回
    translate: false,  // 禁用翻译
    mute: false,       // 禁用禁言
    report: false,     // 禁用举报
    pin: false,        // 禁用置顶
  }}
/>
```

### 示例 2: 只保留翻译和举报

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    recall: false,
    translate: true,   // 保留翻译
    mute: false,
    report: true,      // 保留举报
    pin: false,
  }}
/>
```

### 示例 3: 添加自定义菜单项

```tsx
import { Chatroom } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';

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
        onClick: (message) => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
            console.log('消息已复制');
          }
        },
      },
      {
        content: '转发',
        icon: <Icon type="SHARE" width={16} height={16} />,
        onClick: (message) => {
          console.log('转发消息:', message);
          // 实现转发逻辑
        },
      },
    ],
  }}
/>
```

### 示例 4: 条件显示自定义菜单项

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    customActions: [
      {
        content: '复制文本',
        icon: <Icon type="COPY" width={16} height={16} />,
        onClick: (message) => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
          }
        },
        // 只在文本消息上显示
        visible: (message) => message.type === 'txt',
      },
      {
        content: '删除消息',
        icon: <Icon type="DELETE" width={16} height={16} />,
        onClick: (message) => {
          // 删除消息逻辑
        },
        // 只能删除自己的消息
        visible: (message) => message.from === rootStore.client.user,
      },
    ],
  }}
/>
```

### 示例 5: 完全自定义（禁用所有内置功能）

```tsx
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
        onClick: (message) => {
          console.log('功能 1', message);
        },
      },
      {
        content: '我的功能 2',
        onClick: (message) => {
          console.log('功能 2', message);
        },
      },
    ],
  }}
/>
```

### 示例 6: 混合使用（部分内置 + 自定义）

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    // 只保留撤回和翻译
    recall: true,
    translate: true,
    mute: false,
    report: false,
    pin: false,
    
    // 添加自定义功能
    customActions: [
      {
        content: '@提及',
        icon: <Icon type="AT" width={16} height={16} />,
        onClick: (message) => {
          // 实现 @提及 功能
          console.log('提及用户:', message.from);
        },
        // 不能提及自己
        visible: (message) => message.from !== rootStore.client.user,
      },
      {
        content: '保存到收藏',
        icon: <Icon type="STAR" width={16} height={16} />,
        onClick: (message) => {
          // 保存到收藏
          console.log('收藏消息:', message);
        },
      },
    ],
  }}
/>
```

### 示例 7: 使用自定义图标和样式

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    customActions: [
      {
        content: (
          <span style={{ color: '#ff4d4f' }}>
            危险操作
          </span>
        ),
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        ),
        onClick: (message) => {
          if (confirm('确定要执行危险操作吗？')) {
            console.log('执行危险操作');
          }
        },
      },
    ],
  }}
/>
```

## 菜单项显示顺序

菜单项按以下顺序显示：

1. **撤回** (recall) - 如果启用且是自己的消息
2. **禁言** (mute) - 如果启用且是群主且不是自己
3. **置顶** (pin) - 如果启用且是群主
4. **翻译** (translate) - 如果启用
5. **举报** (report) - 如果启用且不是自己的消息
6. **自定义菜单项** - 按照 `customActions` 数组的顺序

## 最佳实践

### 1. 根据角色显示不同菜单

```tsx
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

<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={messageActionConfig}
/>
```

### 2. 动态控制自定义菜单项

```tsx
const customActions = useMemo(() => [
  {
    content: '复制',
    icon: <Icon type="COPY" width={16} height={16} />,
    onClick: (message: ChatSDK.MessageBody) => {
      if (message.type === 'txt') {
        navigator.clipboard.writeText(message.msg);
        Toast.success('已复制');
      }
    },
    visible: (message: ChatSDK.MessageBody) => message.type === 'txt',
  },
  // 高级功能仅 VIP 用户可见
  isVipUser && {
    content: 'VIP 功能',
    icon: <Icon type="CROWN" width={16} height={16} />,
    onClick: (message: ChatSDK.MessageBody) => {
      console.log('VIP 功能');
    },
  },
].filter(Boolean), [isVipUser]);

<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    customActions,
  }}
/>
```

### 3. 使用国际化

```tsx
import { useTranslation } from 'react-i18next';

function MyChatroom() {
  const { t } = useTranslation();
  
  return (
    <Chatroom
      chatroomId="your-chatroom-id"
      messageActionConfig={{
        customActions: [
          {
            content: t('copy'),
            onClick: (message) => {
              // ...
            },
          },
          {
            content: t('forward'),
            onClick: (message) => {
              // ...
            },
          },
        ],
      }}
    />
  );
}
```

### 4. 错误处理

```tsx
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    customActions: [
      {
        content: '危险操作',
        onClick: async (message) => {
          try {
            await dangerousAction(message);
            Toast.success('操作成功');
          } catch (error) {
            console.error('操作失败:', error);
            Toast.error('操作失败，请重试');
          }
        },
      },
    ],
  }}
/>
```

## 注意事项

### 1. 内置功能的权限检查

内置功能会自动检查权限：
- **撤回**: 只能撤回自己的消息
- **禁言**: 只有群主可见，且不能禁言自己
- **置顶**: 只有群主可见
- **举报**: 不能举报自己的消息

### 2. 自定义菜单项的权限

自定义菜单项需要自己实现权限检查：

```tsx
customActions: [
  {
    content: '删除',
    onClick: (message) => {
      // ❌ 错误：没有权限检查
      deleteMessage(message);
    },
  },
  {
    content: '删除',
    onClick: (message) => {
      // ✅ 正确：检查权限
      if (message.from === rootStore.client.user || isAdmin) {
        deleteMessage(message);
      } else {
        Toast.error('无权删除此消息');
      }
    },
  },
]
```

### 3. visible 函数的使用

`visible` 函数在每次渲染菜单时都会调用，应该：
- 保持逻辑简单
- 避免复杂计算
- 不要在其中进行异步操作

```tsx
// ✅ 好的做法
visible: (message) => message.type === 'txt'

// ✅ 好的做法
visible: (message) => message.from === currentUserId

// ❌ 不好的做法
visible: async (message) => {
  const hasPermission = await checkPermission(); // 异步操作
  return hasPermission;
}
```

### 4. onClick 异步操作

onClick 支持异步操作，但要注意错误处理：

```tsx
customActions: [
  {
    content: '加载更多',
    onClick: async (message) => {
      try {
        await loadMore(message);
      } catch (error) {
        console.error(error);
        // 显示错误提示
      }
    },
  },
]
```

## 完整示例

```tsx
import React, { useMemo } from 'react';
import { Chatroom } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';
import { useTranslation } from 'react-i18next';
import rootStore from '@easemob/react-uikit/module/store';

function MyChatroom() {
  const { t } = useTranslation();
  const currentUserId = rootStore.client.user;

  const messageActionConfig = useMemo(() => ({
    // 配置内置功能
    recall: true,
    translate: true,
    mute: true,
    report: true,
    pin: true,
    
    // 添加自定义功能
    customActions: [
      {
        content: t('copy'),
        icon: <Icon type="COPY" width={16} height={16} />,
        onClick: (message) => {
          if (message.type === 'txt') {
            navigator.clipboard.writeText(message.msg);
            console.log('已复制');
          }
        },
        visible: (message) => message.type === 'txt',
      },
      {
        content: t('forward'),
        icon: <Icon type="SHARE" width={16} height={16} />,
        onClick: (message) => {
          // 打开转发对话框
          openForwardDialog(message);
        },
      },
      {
        content: t('delete'),
        icon: <Icon type="DELETE" width={16} height={16} />,
        onClick: async (message) => {
          if (confirm(t('confirmDelete'))) {
            try {
              await deleteMessage(message);
              console.log('删除成功');
            } catch (error) {
              console.error('删除失败:', error);
            }
          }
        },
        visible: (message) => message.from === currentUserId,
      },
    ],
  }), [t, currentUserId]);

  return (
    <Chatroom
      chatroomId="your-chatroom-id"
      messageActionConfig={messageActionConfig}
    />
  );
}
```

## 迁移指南

### 从旧版本迁移

如果你之前没有使用任何配置，**不需要修改任何代码**，所有内置功能默认启用。

如果你想自定义菜单，只需添加 `messageActionConfig` 参数：

```tsx
// 旧代码
<Chatroom chatroomId="your-chatroom-id" />

// 新代码（保持默认行为）
<Chatroom chatroomId="your-chatroom-id" />

// 新代码（自定义配置）
<Chatroom
  chatroomId="your-chatroom-id"
  messageActionConfig={{
    recall: true,
    translate: false, // 禁用翻译
    // ...
  }}
/>
```

## 常见问题

### Q1: 如何完全隐藏操作菜单？

**A**: 将所有内置功能设为 `false` 且不提供 `customActions`：

```tsx
messageActionConfig={{
  recall: false,
  translate: false,
  mute: false,
  report: false,
  pin: false,
}}
```

### Q2: 自定义菜单项的图标从哪里来？

**A**: 你可以：
1. 使用 UIKit 内置的 Icon 组件
2. 使用自己的 SVG
3. 使用图标库（如 antd icons）

### Q3: 可以修改内置功能的文本吗？

**A**: 内置功能的文本使用 i18n，你可以修改翻译文件来自定义文本。

### Q4: 如何知道消息是否被成功处理？

**A**: 使用 `async/await` 和 `try/catch`：

```tsx
onClick: async (message) => {
  try {
    await processMessage(message);
    Toast.success('成功');
  } catch (error) {
    Toast.error('失败');
  }
}
```

## 相关文档

- [Chatroom 组件文档](../chatroom/README.md)
- [ChatroomMessage 组件文档](./README.md)
- [Icon 组件文档](../../component/icon/README.md)

