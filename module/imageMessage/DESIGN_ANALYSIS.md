# 图片预览组件设计分析与解决方案

## 问题描述

用户在使用 `Chat` 组件时，想要替换默认的图片预览组件（不支持放大、缩小、旋转），但发现：

1. **替换困难**：需要重新实现整个 `ImageMessage` 组件
2. **代码重复**：必须手动处理 `BaseMessage` 上的所有回调（回复、删除、表情、撤回、选择等）
3. **维护成本高**：每次 SDK 更新都需要同步更新自定义组件

用户质疑：**这些回调不应该放在 `ImageMessage` 组件里吗？这样的设计合理吗？**

---

## 设计合理性分析

### 当前架构

```
BaseMessage (容器组件)
  ├─ 头像、昵称、时间
  ├─ 操作菜单（回复、删除、转发等）
  ├─ 表情回应
  ├─ 消息状态
  ├─ 选择框
  └─ children (内容组件)
      ├─ TextMessage
      ├─ ImageMessage
      ├─ AudioMessage
      ├─ VideoMessage
      └─ ...
```

### 这样设计的原因

#### ✅ 优点

1. **职责清晰**（Single Responsibility Principle）
   - `BaseMessage`：负责所有消息类型的通用功能
   - 具体消息组件：只负责展示该类型的内容

2. **代码复用**（DRY - Don't Repeat Yourself）
   - 避免在每个消息类型中重复实现相同的功能
   - 例如：表情回应、回复、删除等功能对所有消息类型都一样

3. **一致性**
   - 保证所有消息类型的交互行为完全一致
   - 统一的视觉效果和用户体验

4. **易于维护**
   - 修改通用功能只需要改 `BaseMessage`
   - 新增消息类型只需要关注内容展示

5. **符合组合模式**（Composition Pattern）
   - React 推荐的设计模式
   - 类似于 HOC (Higher-Order Component) 的思想

#### ❌ 问题

**扩展性不足**：当用户想要自定义某个消息类型的部分功能（如图片预览）时，缺少灵活的扩展点。

---

## 解决方案

### 方案对比

| 方案 | 难度 | 灵活性 | 兼容性 | 推荐度 |
|------|------|--------|--------|--------|
| 1. 新增 `renderImagePreview` | ⭐ | ⭐⭐⭐ | ✅ 完全兼容 | ⭐⭐⭐⭐⭐ |
| 2. 使用 `customRenderers` | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ 完全兼容 | ⭐⭐⭐⭐ |
| 3. 重构为 Headless Component | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ 破坏性变更 | ⭐⭐ |

### 已实现：方案 1 - 新增 `renderImagePreview` 属性

#### 实现内容

1. **在 `ImageMessage` 中新增属性**：

```typescript
export interface ImageMessageProps extends BaseMessageProps {
  // ... 其他属性
  
  /** 自定义图片预览组件 */
  renderImagePreview?: (props: {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
    message: ImageMessageType;
  }) => React.ReactNode;
}
```

2. **在渲染逻辑中支持自定义预览**：

```tsx
{renderImagePreview ? (
  renderImagePreview({
    visible: previewVisible,
    imageUrl: message.url || previewImageUrl || '',
    onClose: () => setPreviewVisible(false),
    message: message,
  })
) : (
  previewVisible && <ImagePreview ... />
)}
```

#### 使用方式

```tsx
// 方式 1: 通过 Chat 组件传递（最简单）
<Chat
  messageProps={{
    renderImagePreview: (props) => <CustomViewer {...props} />
  }}
/>

// 方式 2: 通过 customRenderers（更灵活）
<MessageList
  customRenderers={{
    img: (ctx) => (
      <ImageMessage
        {...ctx.message}
        renderImagePreview={(props) => <CustomViewer {...props} />}
        {...ctx.messageProps}
      />
    )
  }}
/>
```

#### 优点

- ✅ **简单**：用户只需要实现预览组件
- ✅ **无需重复代码**：保留所有 `BaseMessage` 的功能
- ✅ **向后兼容**：不影响现有代码
- ✅ **类型安全**：完整的 TypeScript 支持

---

## 为什么不把回调放在 ImageMessage 里？

### 如果放在 ImageMessage 里会怎样？

```tsx
// ❌ 不推荐的设计
const ImageMessage = (props) => {
  // 需要在每个消息类型中重复实现这些
  const handleReply = () => { ... };
  const handleDelete = () => { ... };
  const handleReaction = () => { ... };
  const handleRecall = () => { ... };
  const handleSelect = () => { ... };
  const handleForward = () => { ... };
  const handleReport = () => { ... };
  const handlePin = () => { ... };
  const handleTranslate = () => { ... };
  const handleModify = () => { ... };
  
  return (
    <div>
      {/* 头像、昵称、时间等 UI */}
      {/* 操作菜单 UI */}
      {/* 表情回应 UI */}
      {/* 消息状态 UI */}
      {/* 选择框 UI */}
      {/* 图片内容 */}
    </div>
  );
};
```

**问题**：
1. ❌ 10+ 个回调在每个消息类型中重复实现
2. ❌ UI 代码重复（头像、昵称、时间、操作菜单等）
3. ❌ 逻辑重复（状态管理、事件处理等）
4. ❌ 维护困难（修改一个功能需要改多个文件）
5. ❌ 不一致风险（不同消息类型的行为可能不一致）

### 当前设计的优势

```tsx
// ✅ 推荐的设计
const ImageMessage = (props) => {
  // 只关注图片相关的逻辑
  const handleClickImage = () => { ... };
  
  return (
    <BaseMessage
      {...props}
      // BaseMessage 处理所有通用功能
    >
      {/* 只关注图片内容的展示 */}
      <img ... />
    </BaseMessage>
  );
};
```

**优势**：
1. ✅ 单一职责：每个组件只做一件事
2. ✅ 代码复用：通用功能只实现一次
3. ✅ 易于维护：修改通用功能只需要改一个地方
4. ✅ 一致性：所有消息类型行为完全一致
5. ✅ 扩展性：通过 props 提供扩展点

---

## 架构最佳实践

### 当前架构遵循的设计原则

1. **单一职责原则 (SRP)**
   - `BaseMessage`：消息容器和通用功能
   - `ImageMessage`：图片内容展示

2. **开闭原则 (OCP)**
   - 对扩展开放：通过 `renderImagePreview`、`customRenderers` 扩展
   - 对修改封闭：核心功能不需要修改

3. **组合优于继承 (Composition over Inheritance)**
   - 使用组件组合而不是继承
   - React 推荐的模式

4. **Don't Repeat Yourself (DRY)**
   - 通用功能不重复实现

### 类似的设计在其他库中的应用

#### Ant Design

```tsx
// List + List.Item 的组合
<List>
  <List.Item>内容</List.Item>
</List>

// Card + Card.Meta 的组合
<Card>
  <Card.Meta title="标题" description="描述" />
</Card>
```

#### Material-UI

```tsx
// ListItem + ListItemText 的组合
<ListItem>
  <ListItemAvatar>
    <Avatar />
  </ListItemAvatar>
  <ListItemText primary="标题" secondary="描述" />
</ListItem>
```

#### 我们的设计

```tsx
// BaseMessage + ImageMessage 的组合
<BaseMessage {...通用props}>
  <ImageMessage />
</BaseMessage>
```

---

## 用户如何简化替换过程？

### 场景 1：只替换预览功能（最常见）

```tsx
// ✅ 超级简单：3 行代码
<Chat
  messageProps={{
    renderImagePreview: (props) => <CustomViewer {...props} />
  }}
/>
```

### 场景 2：修改图片展示样式

```tsx
// ✅ 使用 customRenderers
<MessageList
  customRenderers={{
    img: (ctx) => (
      <div className="my-custom-style">
        <ImageMessage
          imageMessage={ctx.message}
          renderImagePreview={(props) => <CustomViewer {...props} />}
          {...ctx.messageProps}
        />
      </div>
    )
  }}
/>
```

### 场景 3：完全自定义（极少数情况）

```tsx
// 如果真的需要完全自定义
<MessageList
  customRenderers={{
    img: (ctx) => {
      // 完全自由的实现
      return <YourCompletelyCustomComponent {...ctx} />;
    }
  }}
/>
```

---

## 总结

### 关于设计合理性

| 问题 | 答案 |
|------|------|
| 当前设计是否合理？ | ✅ **是的**，符合 React 和软件工程最佳实践 |
| 回调应该放在 ImageMessage 里吗？ | ❌ **不应该**，会导致代码重复和维护困难 |
| 如何简化替换过程？ | ✅ 使用 `renderImagePreview` 属性 |

### 新增的能力

1. ✅ **`renderImagePreview`**：轻松替换图片预览组件
2. ✅ **`customRenderers`**：按类型自定义消息渲染
3. ✅ **完整的文档和示例**：快速上手

### 推荐方案

对于 **95%** 的用户：

```tsx
<Chat
  messageProps={{
    renderImagePreview: (props) => <CustomViewer {...props} />
  }}
/>
```

### 相关文档

- 📖 [完整指南](./CUSTOM_IMAGE_PREVIEW_GUIDE.md)
- 🚀 [快速开始](./QUICK_START.md)
- 💡 [示例代码](../../demo/module/chat/CustomImagePreviewExample.tsx)
- 🎨 [自定义消息渲染](../chat/CUSTOM_RENDERER_GUIDE.md)

---

## 附录：如果真的要重构成 Headless Component

### 什么是 Headless Component？

将逻辑和 UI 完全分离，用户可以完全自定义 UI。

### 示例

```tsx
// Headless 组件只提供逻辑
const useMessageLogic = (message) => {
  const handleReply = () => { ... };
  const handleDelete = () => { ... };
  // ... 其他逻辑
  
  return {
    handleReply,
    handleDelete,
    // ...
  };
};

// 用户完全自定义 UI
const CustomMessage = ({ message }) => {
  const logic = useMessageLogic(message);
  
  return (
    <div>
      {/* 完全自定义的 UI */}
      <button onClick={logic.handleReply}>回复</button>
      <button onClick={logic.handleDelete}>删除</button>
    </div>
  );
};
```

### 为什么不采用这种方案？

1. ❌ **破坏性变更**：现有代码全部需要重写
2. ❌ **学习成本高**：用户需要理解所有内部逻辑
3. ❌ **实现成本高**：用户需要自己实现 UI
4. ❌ **不一致性**：不同用户的实现可能差异很大

### 当前方案的优势

1. ✅ **渐进式增强**：提供默认实现，支持按需自定义
2. ✅ **学习成本低**：简单场景 3 行代码搞定
3. ✅ **向后兼容**：不影响现有代码
4. ✅ **一致性**：保证基本体验一致

