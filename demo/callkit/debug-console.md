# 调试控制台输出说明

## 修复的问题

之前出现的无限循环问题是由于以下原因：

1. **webimConnection 对象重复创建**: 每次组件重新渲染时都会创建新的 webimConnection 对象
2. **回调函数引用不稳定**: CallService 的回调函数每次都是新创建的
3. **useEffect 重复执行**: 依赖项变化导致 CallService 被反复初始化和销毁

## 修复方案

### 1. 稳定 webimConnection 引用

```typescript
// 修复前：每次渲染都创建新对象
const webimConnection = {
  /* ... */
};

// 修复后：使用 useMemo 保持引用稳定
const webimConnection = React.useMemo(
  () => ({
    /* ... */
  }),
  [],
);
```

### 2. 稳定回调函数引用

```typescript
// 修复前：每次渲染都创建新函数
onCallStart: videos => {
  /* ... */
};

// 修复后：使用 useCallback 保持引用稳定
const handleCallStart = React.useCallback(videos => {
  /* ... */
}, []);
```

### 3. 完善依赖项数组

```typescript
// 修复前：缺少关键依赖项
}, [enableRealCall, agoraAppId, agoraUid]);

// 修复后：包含所有依赖项
}, [enableRealCall, agoraAppId, agoraUid, webimConnection, ...callbacks]);
```

## 正常的控制台输出

修复后，正常情况下控制台应该只输出：

1. **配置完成时**:

   ```
   Add event handler: callkit
   CallService state change: { type: 'initialized' }
   ```

2. **发起通话时**:

   ```
   CallService state change: { type: 'calling', callInfo: {...} }
   正在发起视频通话...
   ```

3. **通话状态变化时**:
   ```
   CallService state change: { type: 'joined', callInfo: {...} }
   通话已开始，共X位参与者
   ```

## 如果仍有问题

如果仍然出现重复输出，请检查：

1. **浏览器开发者工具的设置**

   - 确保没有开启 "Preserve log"
   - 刷新页面清除旧的日志

2. **React 严格模式**

   - 如果项目开启了 React.StrictMode，开发环境下会故意执行两次 useEffect
   - 这是正常行为，生产环境不会有此问题

3. **组件重复挂载**
   - 检查是否有多个 CallKit 组件被同时渲染
   - 确保 CallKit 组件没有被不必要地重新挂载

## 验证修复效果

1. 打开 `http://localhost:5174/demo/callkit/real-call-demo.html`
2. 填写配置信息并点击"完成配置"
3. 观察控制台，应该只有一次初始化日志
4. 点击"发起视频通话"
5. 控制台应该只输出一次通话相关日志，不会有循环输出
