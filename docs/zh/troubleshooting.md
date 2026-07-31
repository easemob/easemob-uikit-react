# 故障排查

构建、依赖和运行时报错看本文。业务接入场景问题（头像不一致、联系人为空、未读重登回来等）请先看 [场景 FAQ](./faq.md)。

## 常见错误及解决方案

### 业务场景问题入口

| 现象 | 文档 |
|------|------|
| 会话有头像、消息没有 | [FAQ - 头像](./faq.md#会话有头像但消息-sender-没有) |
| 联系人为空 / 同步异常 | [FAQ - 联系人/同步](./faq.md#联系人为空) |
| 未读点击后消失、重登又回来 | [FAQ - 未读](./faq.md#未读点击后消失重新登录又回来) |
| 依赖了内部 import 路径 | [FAQ - 导入面](./faq.md#为什么不能-import--from-modulestorexxx) |

### 错误：`rootStore.client.getCurrentUserId is not a function`

**原因：** Provider 子组件首次 render 时直接访问了 `rootStore.client`。真实 client 要到
Provider effect 执行后才写入 rootStore，此时初始空对象上没有该方法。

**解决：**

```tsx
const { client } = React.useContext(RootContext);
const userId = client.getCurrentUserId() || '';
```

`RootContext.client` 首次 render 即可用，但 `getCurrentUserId()` 在登录前返回 `null`。
调用联网 API 前还需确认 `rootStore.loginState === true`。

### 错误：`client.updateUserInfo is not a function`

SDK 5 的用户资料能力位于 `userInfoManager`：

```ts
await client.userInfoManager.updateOwnInfo({ nickname: 'Alice' });
```

头像字段使用 `avatarUrl`。不要使用 SDK 4 的 `updateUserInfo`、`updateOwnUserInfo`
或 `avatarurl` 参数名。

### 错误：`client.close is not a function`

SDK 5 退出登录使用：

```ts
await client.logout();
```

### 错误：`Cannot read properties of undefined (reading 'forwardRef')`

**错误信息：**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef')
```

**可能原因：**

1. **React 未正确引入**（UMD 格式）
   - 使用 UMD 格式时，需要确保在使用 UIKit 之前先引入 React 和 ReactDOM
   - React 必须作为全局变量 `React` 和 `ReactDOM` 暴露

2. **React 版本不兼容**
   - UIKit 要求 React 版本 >= 18.2.0
   - 确保项目中安装的 React 版本符合要求

3. **依赖未正确安装**（ESM/CJS 格式）
   - 使用 ESM 或 CJS 格式时，需要确保项目中安装了所有 peer dependencies

**解决方案：**

#### 方案 1：使用 UMD 格式（通过 script 标签引入）

确保在使用 UIKit 之前先引入 React 和 ReactDOM：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>UIKit Demo</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- 1. 先引入 React 和 ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- 2. 再引入 UIKit -->
  <script src="./path/to/ChatUI.umd.js"></script>
  
  <!-- 3. 使用 UIKit -->
  <script>
    const { Provider, Chat } = ChatUI;
    // 你的代码...
  </script>
</body>
</html>
```

**注意：**
- React 和 ReactDOM 必须在使用 UIKit 之前加载
- 确保 React 版本 >= 18.2.0
- React 会被暴露为全局变量 `React` 和 `ReactDOM`

#### 方案 2：使用 ESM/CJS 格式（通过 npm/yarn 安装）

1. **安装依赖：**

```bash
npm install easemob-chat-uikit react react-dom mobx mobx-react-lite
# 或
yarn add easemob-chat-uikit react react-dom mobx mobx-react-lite
```

2. **确保 React 版本兼容：**

检查 `package.json` 中的 React 版本：

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "easemob-chat-uikit": "^x.x.x"
  }
}
```

3. **正确引入：**

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, Chat } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

// 你的代码...
```

#### 方案 3：检查打包配置（如果自己打包 UIKit）

如果是从源码打包 UIKit，确保：

1. **vite.config.ts 中的 external 配置正确：**

```typescript
rollupOptions: {
  external: ['react', 'react-dom', 'mobx', 'mobx-react-lite'],
  output: {
    globals: {
      react: 'React',        // UMD 格式必须是 'React'（大写）
      'react-dom': 'ReactDOM', // UMD 格式必须是 'ReactDOM'
      mobx: 'mobx',
      'mobx-react-lite': 'mobxReactLite',
    },
  },
}
```

2. **确保使用正确的构建命令：**

```bash
npm run build
```

#### 方案 4：检查多个 React 实例

如果项目中存在多个 React 实例，可能会导致此错误。检查方法：

1. **检查 node_modules：**

```bash
# 查找所有 react 安装位置
npm ls react
```

2. **使用 npm/yarn 的 resolutions 或 overrides：**

在 `package.json` 中：

```json
{
  "resolutions": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

或使用 yarn：

```json
{
  "overrides": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

3. **清理并重新安装：**

```bash
rm -rf node_modules package-lock.json
npm install
```

### 错误：`Cannot find module 'react'` 或 `Module not found`

**可能原因：**
- 依赖未安装
- 使用了错误的导入路径

**解决方案：**

1. **安装依赖：**

```bash
npm install react react-dom mobx mobx-react-lite
```

2. **检查导入路径：**

```jsx
// ✅ 正确
import { Provider } from 'easemob-chat-uikit';

// ❌ 错误
import { Provider } from 'easemob-chat-uikit/build';
```

### 错误：`Cannot read properties of undefined (reading 'useState')` 或其他 React Hooks 错误

**可能原因：**
- React 版本过低（< 18.0.0）
- React 和 ReactDOM 版本不匹配

**解决方案：**

1. **升级 React 版本：**

```bash
npm install react@^18.2.0 react-dom@^18.2.0
```

2. **确保 React 和 ReactDOM 版本一致：**

检查 `package.json`：

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 错误：样式文件未加载

**错误现象：**
- 组件显示正常，但样式丢失
- 控制台没有错误，但 UI 样式不正确

**解决方案：**

确保引入了样式文件：

```jsx
import 'easemob-chat-uikit/style.css';
```

或在使用 UMD 格式时：

```html
<link rel="stylesheet" href="./path/to/style.css">
```

### 错误：MobX 相关错误

**可能原因：**
- MobX 版本不兼容
- MobX 未正确安装

**解决方案：**

1. **安装正确版本的 MobX：**

```bash
npm install mobx@^6.0.0 mobx-react-lite@^3.0.0
```

2. **检查版本兼容性：**

UIKit 要求：
- `mobx`: ^6.0.0
- `mobx-react-lite`: ^3.0.0

## 调试技巧

### 1. 检查 React 是否正确加载

在浏览器控制台中运行：

```javascript
console.log(window.React); // UMD 格式应该输出 React 对象
console.log(React.version); // 应该输出 React 版本号
```

### 2. 检查依赖版本

```bash
npm ls react react-dom mobx mobx-react-lite
```

### 3. 检查打包文件

如果使用 UMD 格式，检查打包文件开头是否有正确的 external 声明：

```javascript
// 应该看到类似这样的代码
import * as React from "react";
import React__default, { forwardRef, ... } from "react";
```

### 4. 使用 React DevTools

安装 React DevTools 浏览器扩展，可以帮助检查：
- React 组件树
- Props 和 State
- React 版本信息

## 获取帮助

如果以上方案都无法解决问题，请提供以下信息：

1. **错误信息**：完整的错误堆栈
2. **使用方式**：UMD / ESM / CJS
3. **React 版本**：`npm ls react react-dom`
4. **UIKit 版本**：`npm ls easemob-chat-uikit`
5. **浏览器信息**：浏览器类型和版本
6. **代码示例**：最小可复现的代码示例
