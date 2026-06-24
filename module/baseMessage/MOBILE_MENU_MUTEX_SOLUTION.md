# 移动端消息操作菜单互斥解决方案

## 问题描述

在移动设备上，当一个消息的操作菜单显示时，长按另一条消息也会显示操作菜单，导致同时显示多个操作菜单。而在 PC 浏览器上，点击其他消息会自动关闭之前的菜单，只显示一个。

### 问题原因

1. **PC 端**: 点击事件会触发全局的点击事件处理，Tooltip 组件有内置的互斥机制
2. **移动端**: 长按触发菜单不会触发相同的全局事件，每个 Tooltip 组件独立管理自己的状态
3. **状态隔离**: 每个 `BaseMessage` 组件都有自己独立的 `isPopoverOpen` 状态，彼此不通信

## 解决方案

### 核心思路

使用**全局状态管理器**来追踪当前打开的菜单，当打开新菜单时，自动关闭之前打开的菜单。

### 实现步骤

#### 1. 创建全局状态管理器

```typescript
// 全局状态：当前打开的菜单 ID
let currentOpenMenuId: string | null = null;

// 存储每个菜单的关闭回调
const menuOpenCallbacks = new Map<string, (shouldClose: boolean) => void>();

// 注册菜单
const registerMenu = (menuId: string, callback: (shouldClose: boolean) => void) => {
  menuOpenCallbacks.set(menuId, callback);
};

// 注销菜单
const unregisterMenu = (menuId: string) => {
  menuOpenCallbacks.delete(menuId);
};

// 打开菜单时，关闭其他所有菜单
const openMenu = (menuId: string) => {
  if (currentOpenMenuId && currentOpenMenuId !== menuId) {
    const closeCallback = menuOpenCallbacks.get(currentOpenMenuId);
    closeCallback?.(true); // 通知旧菜单关闭
  }
  currentOpenMenuId = menuId;
};

// 关闭菜单
const closeMenu = (menuId: string) => {
  if (currentOpenMenuId === menuId) {
    currentOpenMenuId = null;
  }
};
```

#### 2. 组件中注册和管理菜单

```typescript
// 生成唯一的菜单 ID
const menuId = useRef(`menu-${message?.id || Math.random()}`).current;

// 注册和注销菜单
useEffect(() => {
  registerMenu(menuId, shouldClose => {
    if (shouldClose) {
      setIsPopoverOpen(false);
      setIsButtonVisible(false);
      setIsReactionVisible(false);
      setForceInlineActionsOnMobile(false);
    }
  });

  return () => {
    unregisterMenu(menuId);
    closeMenu(menuId);
  };
}, [menuId]);
```

#### 3. 统一的菜单打开/关闭处理

```typescript
// 处理菜单打开/关闭
const handleMenuOpen = (open: boolean) => {
  if (open) {
    openMenu(menuId); // 通知全局管理器，可能会关闭其他菜单
  } else {
    closeMenu(menuId);
  }
  setIsPopoverOpen(open);
  setIsButtonVisible(open);
};
```

#### 4. 更新所有菜单触发点

**PC 端点击触发：**
```typescript
<Tooltip
  open={isPopoverOpen}
  onOpenChange={value => {
    handleMenuOpen(value); // ✅ 使用统一方法
  }}
  // ...
/>
```

**移动端长按触发：**
```typescript
onTouchStart={() => {
  if (!isMobile) return;
  longPressTriggeredRef.current = false;
  if (longPressTimerRef.current) {
    clearTimeout(longPressTimerRef.current);
  }
  longPressTimerRef.current = window.setTimeout(() => {
    handleMenuOpen(true); // ✅ 使用统一方法
    longPressTriggeredRef.current = true;
  }, 600);
}}
```

**菜单项点击时关闭：**
```typescript
const deleteMessage = () => {
  handleMenuOpen(false); // ✅ 使用统一方法
  onDeleteMessage && onDeleteMessage(message as BaseMessageType);
};

// 其他所有菜单操作同理
const replyMessage = () => {
  handleMenuOpen(false);
  onReplyMessage && onReplyMessage();
};
```

## 工作流程

### 场景 1: 用户长按第一条消息

```
1. 触发 onTouchStart
2. 600ms 后调用 handleMenuOpen(true)
3. openMenu('menu-msg1') 执行：
   - currentOpenMenuId 为 null
   - 设置 currentOpenMenuId = 'menu-msg1'
4. 消息 1 的菜单显示 ✅
```

### 场景 2: 用户长按第二条消息（第一条菜单仍打开）

```
1. 触发第二条消息的 onTouchStart
2. 600ms 后调用 handleMenuOpen(true)
3. openMenu('menu-msg2') 执行：
   - currentOpenMenuId = 'menu-msg1'
   - 找到消息 1 的 closeCallback 并调用
   - 消息 1 收到关闭通知 ❌
   - 设置 currentOpenMenuId = 'menu-msg2'
4. 消息 1 的菜单关闭 ❌
5. 消息 2 的菜单显示 ✅
```

### 场景 3: 用户点击菜单项（如"删除"）

```
1. 点击"删除"
2. deleteMessage() 调用 handleMenuOpen(false)
3. closeMenu('menu-msg2') 执行：
   - 设置 currentOpenMenuId = null
4. 消息 2 的菜单关闭 ❌
```

## 关键优势

### ✅ 统一管理
- 所有菜单的打开/关闭都通过全局管理器协调
- PC 端和移动端使用相同的逻辑

### ✅ 自动清理
- 组件卸载时自动注销菜单
- 防止内存泄漏

### ✅ 简单可靠
- 不需要复杂的事件监听
- 不依赖 DOM 事件冒泡
- 适用于所有触发方式（点击、长按、代码触发）

### ✅ 向后兼容
- 不影响现有功能
- 只是增强了菜单的互斥性

## 技术细节

### 1. 为什么使用 Map 而不是单个变量？

```typescript
// ❌ 错误方式：只存储当前打开的 ID
let currentOpenMenuId: string | null = null;
// 问题：无法通知旧菜单关闭

// ✅ 正确方式：存储 ID 和关闭回调
const menuOpenCallbacks = new Map<string, (shouldClose: boolean) => void>();
// 优势：可以调用回调来关闭旧菜单
```

### 2. 为什么使用 useRef 存储 menuId？

```typescript
// ✅ 正确：使用 useRef 确保 ID 不变
const menuId = useRef(`menu-${message?.id || Math.random()}`).current;

// ❌ 错误：每次渲染都会生成新 ID
const menuId = `menu-${message?.id || Math.random()}`;
```

原因：
- `useRef` 在组件生命周期内保持不变
- 确保注册和注销使用相同的 ID
- 避免内存泄漏

### 3. 为什么在 useEffect 中注册？

```typescript
useEffect(() => {
  registerMenu(menuId, closeCallback);
  
  return () => {
    unregisterMenu(menuId);
    closeMenu(menuId);
  };
}, [menuId]);
```

原因：
- 组件挂载时注册
- 组件卸载时自动清理
- 防止内存泄漏
- React 的最佳实践

### 4. 回调函数的作用

```typescript
registerMenu(menuId, shouldClose => {
  if (shouldClose) {
    setIsPopoverOpen(false);
    setIsButtonVisible(false);
    // ... 清理所有相关状态
  }
});
```

作用：
- 当其他菜单打开时，接收通知
- 可以在关闭时清理所有相关状态
- 不只是关闭菜单，还包括相关的辅助状态

## 测试清单

### PC 端
- [ ] 点击消息 1 的更多按钮 → 菜单显示
- [ ] 点击消息 2 的更多按钮 → 消息 1 的菜单关闭，消息 2 的菜单显示
- [ ] 点击菜单项（如删除）→ 菜单关闭
- [ ] 点击空白区域 → 菜单关闭

### 移动端
- [ ] 长按消息 1 → 菜单显示
- [ ] 长按消息 2 → 消息 1 的菜单关闭，消息 2 的菜单显示 ⭐ 关键
- [ ] 点击菜单项（如删除）→ 菜单关闭
- [ ] 点击表情反应 → 操作菜单关闭，表情盘显示
- [ ] 滚动列表 → 不应影响菜单状态

### 边界情况
- [ ] 快速长按多条消息 → 只显示最后一条的菜单
- [ ] 消息被删除时菜单打开 → 菜单应关闭且不报错
- [ ] 大量消息快速滚动 → 性能正常

## 性能考虑

### 内存占用
- 每个消息只存储一个回调函数
- 组件卸载时自动清理
- Map 操作的时间复杂度为 O(1)

### 渲染性能
- 不会导致不必要的重新渲染
- 只影响需要关闭的组件
- 使用 useRef 避免重复计算

## 可能的改进

### 1. 添加动画过渡

```typescript
const handleMenuOpen = (open: boolean) => {
  if (open) {
    openMenu(menuId);
  } else {
    // 添加延迟，等待动画完成
    setTimeout(() => {
      closeMenu(menuId);
    }, 300);
  }
  setIsPopoverOpen(open);
  setIsButtonVisible(open);
};
```

### 2. 支持菜单优先级

```typescript
interface MenuConfig {
  id: string;
  priority: number; // 高优先级可以关闭低优先级
}

// 高优先级菜单（如系统通知）不会被普通菜单关闭
```

### 3. 添加日志调试

```typescript
const openMenu = (menuId: string) => {
  console.log('[MenuManager] Opening menu:', menuId);
  if (currentOpenMenuId && currentOpenMenuId !== menuId) {
    console.log('[MenuManager] Closing previous menu:', currentOpenMenuId);
    // ...
  }
};
```

## 常见问题

### Q1: 为什么不使用全局状态管理库（如 Redux）？

**A**: 
- 这是组件内部的 UI 状态，不需要全局持久化
- 使用简单的模块级变量更轻量
- 避免增加项目依赖
- 性能更好

### Q2: 多个消息列表（不同会话）会互相影响吗？

**A**: 
- 当前实现是全局的，会影响
- 如果需要隔离，可以为每个会话创建独立的管理器实例
- 或者在 menuId 中包含会话 ID

### Q3: 会不会有竞态条件（Race Condition）？

**A**: 
- JavaScript 是单线程的，不会有真正的竞态
- 长按的 setTimeout 是异步的，但回调执行是同步的
- 事件循环保证了操作的顺序性

### Q4: 为什么不直接使用 Context API？

**A**: 
- Context 会导致所有消费者重新渲染
- 我们只需要通知一个旧组件关闭
- 模块级变量更高效

## 相关代码

### 涉及的文件
- `module/baseMessage/BaseMessage.tsx` - 主要实现

### 涉及的函数
- `openMenu()` - 打开菜单
- `closeMenu()` - 关闭菜单
- `registerMenu()` - 注册菜单
- `unregisterMenu()` - 注销菜单
- `handleMenuOpen()` - 统一的菜单打开/关闭处理

## 总结

通过引入全局菜单管理器，我们解决了移动端多个操作菜单同时显示的问题：

- ✅ **互斥性**: 确保同一时间只显示一个菜单
- ✅ **统一性**: PC 端和移动端行为一致
- ✅ **可维护**: 集中管理，易于调试
- ✅ **性能好**: 轻量级实现，无性能损耗
- ✅ **可扩展**: 易于添加新功能（如优先级、动画等）

这个解决方案简单、高效、可靠，完美解决了移动端菜单互斥的问题！

