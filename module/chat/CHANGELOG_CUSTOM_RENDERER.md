# MessageList 自定义渲染器功能更新

## 更新日期

2025-11-24

## 更新内容

### 新增功能：按类型自定义消息渲染器 (`customRenderers`)

#### 问题背景

在之前的版本中，如果开发者想要自定义某一种消息类型的样式（例如只修改文本消息），需要通过 `renderMessage` 属性接管所有消息的渲染，这意味着：

1. 必须重新实现所有消息类型的渲染逻辑（文本、图片、视频、音频、文件等）
2. 需要处理每种消息类型的特殊逻辑和边界情况
3. 代码重复，维护成本高
4. 难以与默认渲染器配合使用

#### 解决方案

新增 `customRenderers` 属性，支持按消息类型选择性地自定义渲染器：

- 只需要传入想要自定义的消息类型
- 未自定义的类型会自动使用默认渲染器
- 提供完整的渲染上下文（样式、回调、状态等）
- 保持向后兼容，旧的 `renderMessage` 仍然可用

### API 变更

#### 新增类型定义

```typescript
// 消息类型枚举
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

// 消息渲染上下文
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

// 自定义渲染器函数类型
export type MessageRenderer = (context: MessageRenderContext) => ReactNode;
```

#### MsgListProps 更新

```typescript
export interface MsgListProps {
  // ... 其他属性保持不变

  /** @deprecated 使用 customRenderers 替代，支持按类型自定义 */
  renderMessage?: (message: ChatSDK.MessageBody | NoticeMessageBody) => ReactNode;

  /** 按消息类型自定义渲染器，只需要传入想自定义的类型即可，其他类型会使用默认渲染 */
  customRenderers?: Partial<Record<MessageType, MessageRenderer>>;
}
```

### 使用示例

#### 基础用法：只自定义文本消息

```tsx
import { MessageList } from '@easemob/react-uikit';

<MessageList
  customRenderers={{
    txt: ctx => {
      const message = ctx.message as any;
      return <div style={{ background: '#f0f0f0', padding: '10px' }}>{message.msg}</div>;
    },
    // 其他类型（img, audio, video 等）会自动使用默认渲染
  }}
/>;
```

#### 自定义多种类型

```tsx
<MessageList
  customRenderers={{
    txt: ctx => <CustomTextMessage message={ctx.message} />,
    img: ctx => <CustomImageMessage message={ctx.message} />,
    // audio, video, file 等未指定的类型使用默认渲染
  }}
/>
```

### 迁移指南

#### 从旧 API 迁移

**迁移前：**

```tsx
<MessageList
  renderMessage={message => {
    if (message.type === 'txt') {
      return <CustomTextMessage message={message} />;
    }
    if (message.type === 'img') {
      return <ImageMessage imageMessage={message} {...allProps} />;
    }
    // 需要处理所有类型...
    return null;
  }}
/>
```

**迁移后：**

```tsx
<MessageList
  customRenderers={{
    txt: ctx => <CustomTextMessage message={ctx.message} />,
    // 不需要再处理其他类型，自动使用默认渲染
  }}
/>
```

### 兼容性说明

1. ✅ **向后兼容**：旧的 `renderMessage` API 仍然有效
2. ✅ **优先级**：如果同时提供 `renderMessage` 和 `customRenderers`，`renderMessage` 优先（为了向后兼容）
3. ✅ **TypeScript 支持**：提供完整的类型定义和类型推断
4. ✅ **默认行为**：未自定义的类型完全保持原有的默认渲染逻辑

### 性能优化

- 使用 `useMemo` 缓存默认渲染器，避免不必要的重新创建
- 渲染器合并逻辑优化，只在必要时重新计算
- 保持与原有实现相同的性能特性

### 测试和文档

1. **示例代码**：

   - `/demo/module/chat/MessageListCustomRendererExample.tsx` - 基础示例
   - `/demo/module/chat/MessageListUsageExamples.tsx` - 完整用法示例

2. **详细文档**：

   - `/module/chat/CUSTOM_RENDERER_GUIDE.md` - 完整使用指南

3. **类型导出**：
   - 从 `@easemob/react-uikit` 可以导入 `MessageRenderContext`、`MessageRenderer`、`MessageType`

### Breaking Changes

❌ 无破坏性变更

### 已知限制

1. 目前不支持在自定义渲染器中调用默认渲染器（可以直接使用对应的消息组件）
2. `renderMessage` 和 `customRenderers` 同时存在时，`renderMessage` 优先

### 未来计划

- [ ] 支持在自定义渲染器中调用默认渲染器（`renderDefault` 参数）
- [ ] 提供更多渲染上下文信息
- [ ] 支持消息渲染插件系统

### 相关文件

- `module/chat/MessageList.tsx` - 主要实现
- `module/chat/index.ts` - 类型导出
- `module/chat/CUSTOM_RENDERER_GUIDE.md` - 使用指南
- `demo/module/chat/MessageListCustomRendererExample.tsx` - 基础示例
- `demo/module/chat/MessageListUsageExamples.tsx` - 完整示例

### 贡献者

AI Assistant

---

## 升级建议

### 推荐立即升级的场景

1. 需要自定义特定消息类型样式的项目
2. 需要在消息上添加额外交互功能的项目
3. 需要集成第三方渲染库（如 emoji、markdown 等）的项目

### 可选升级的场景

1. 当前使用 `renderMessage` 且工作正常的项目（可保持不变）
2. 完全使用默认渲染的项目（不受影响）

### 如何升级

1. 更新到最新版本
2. 查看示例代码和文档
3. 根据需求选择性地使用 `customRenderers`
4. （可选）将现有的 `renderMessage` 迁移到 `customRenderers`
