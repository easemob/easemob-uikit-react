# 快速开始

利用环信 Web CallKit，你可以轻松实现一对一通话和群组通话功能。本文介绍如何快速实现发起音视频通话。

## 推荐环境

- Node.js: 18.0 或以上版本
- npm: 9.0 或以上 或 yarn: 1.22 或以上版本
- React: 18.0 或以上版本
- TypeScript: 4.9 或以上版本
- Vite: 4.0 或以上版本
- 现代浏览器: Chrome/Firefox/Safari/Edge 最新版本
- IM SDK 4.16.0 或以上/UIKit 2.0.0 或以上版本

## 前提条件

在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

1. [注册环信账号](/product/console/account_register.html#注册账号)。
2. [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
3. [创建用户](/product/console/operation_user.html#创建用户)，获取用户 ID。
4. [开通音视频服务](product_activation.html)。为了保障流畅的用户体验，开通服务后，你需等待 15 分钟才能实现发起音视频通话。

## 快速开始

### 步骤 1 创建项目

本节介绍使用 Vite 创建 React + TypeScript 项目。

1. 使用 Vite 创建新项目：

```bash
npm create vite@latest callkit-quickstart -- --template react-ts
cd callkit-quickstart
```

2. 安装项目依赖：

```bash
npm install
```

3. 启动开发服务器验证项目创建成功：

```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:5173`，确认项目正常运行。

### 步骤 2 引入 CallKit

在项目根目录下安装 CallKit 依赖：

```bash
npm install easemob-chat-uikit
# 或使用 yarn
yarn add easemob-chat-uikit
```

### 步骤 3 创建快速开始页面

1. 替换 `src/App.tsx` 文件内容：

::: details src/App.tsx 文件中的替换代码

```tsx
import React, { useState, useRef, useEffect } from "react";
import { Provider, CallKit, rootStore } from "easemob-chat-uikit";
import type { CallError, CallInfo } from "easemob-chat-uikit";
import "easemob-chat-uikit/style.css";
import "./App.css";

interface ConnectionStatus {
  isConnected: boolean;
  status: string;
}
const appKey = "org#app"; // 修改成你自己的 appKey
const App: React.FC = () => {
  // 登录相关状态
  const [userId, setUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: "连接状态: 未连接",
  });

  // 通话相关状态
  const [targetUserId, setTargetUserId] = useState("");
  const [groupId, setGroupId] = useState("");

  // CallKit 引用
  const callKitRef = useRef<CallKit>(null);

  // 处理 URL 参数快速登录
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get("userId");
    if (userIdFromUrl) setUserId(userIdFromUrl);

    const accessTokenFromUrl = urlParams.get("accessToken");
    if (accessTokenFromUrl) setAccessToken(accessTokenFromUrl);
  }, []);

  // 监听连接状态
  useEffect(() => {
    // 监听连接状态变化
    if (rootStore.client) {
      rootStore.client.addEventHandler("CONNECTION_LISTENER", {
        onConnected: () => {
          setConnectionStatus({
            isConnected: true,
            status: "连接状态: 已连接",
          });
        },
        onDisconnected: () => {
          setConnectionStatus({
            isConnected: false,
            status: "连接状态: 已断开",
          });
        },
      });
    }

    return () => {
      if (rootStore.client) {
        rootStore.client.removeEventHandler("CONNECTION_LISTENER");
      }
    };
  }, [isLoggedIn]);

  // 登录处理
  const handleLogin = async () => {
    if (!userId.trim() || !accessToken.trim()) {
      alert("用户ID和 accessToken 不能为空!");
      return;
    }

    try {
      // 登录环信 IM
      await rootStore.client.open({
        user: userId.trim(),
        accessToken: accessToken.trim(),
      });

      setIsLoggedIn(true);
      setConnectionStatus({
        isConnected: true,
        status: "连接状态: 已连接",
      });
      alert("登录成功!");
    } catch (error: any) {
      alert(`登录失败: ${error.message || error}`);
    }
  };

  // 登出处理
  const handleLogout = async () => {
    try {
      await rootStore.client?.close();
      setIsLoggedIn(false);
      setConnectionStatus({
        isConnected: false,
        status: "连接状态: 已登出",
      });
      // 结束所有通话
      callKitRef.current?.exitCall();
      alert("登出成功!");
    } catch (error: any) {
      alert(`登出失败: ${error.message || error}`);
    }
  };

  // 发起一对一视频通话
  const handleStartVideoCall = async () => {
    if (!targetUserId.trim()) {
      alert("对方用户ID不能为空!");
      return;
    }

    try {
      await callKitRef.current?.startSingleCall({
        to: targetUserId.trim(),
        callType: "video",
        msg: "邀请你进行视频通话",
      });
    } catch (error: any) {
      alert(`发起视频通话失败: ${error.message || error}`);
    }
  };

  // 发起一对一音频通话
  const handleStartAudioCall = async () => {
    if (!targetUserId.trim()) {
      alert("对方用户ID不能为空!");
      return;
    }

    try {
      await callKitRef.current?.startSingleCall({
        to: targetUserId.trim(),
        callType: "audio",
        msg: "邀请你进行语音通话",
      });
    } catch (error: any) {
      alert(`发起语音通话失败: ${error.message || error}`);
    }
  };

  // 发起群组通话
  const handleStartGroupCall = async () => {
    if (!groupId.trim()) {
      alert("群组ID不能为空!");
      return;
    }

    try {
      await callKitRef.current?.startGroupCall({
        groupId: groupId.trim(),
        callType: "video",
        msg: "邀请加入群组视频通话",
      });
    } catch (error: any) {
      alert(`发起群组通话失败: ${error.message || error}`);
    }
  };

  // 用户信息提供者
  const userInfoProvider = async (userIds: string[]) => {
    return userIds.map((userId) => ({
      userId,
      nickname: `用户 ${userId}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    }));
  };

  // 群组信息提供者
  const groupInfoProvider = async (groupIds: string[]) => {
    return groupIds.map((groupId) => ({
      groupId,
      groupName: `群组 ${groupId}`,
      groupAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupId}`,
    }));
  };

  return (
    <Provider initConfig={{ appKey }}>
      <div className="app-container">
        <div className="main-content">
          <h1>CallKit 快速开始</h1>

          {/* 连接状态指示器 */}
          <div className="status-section">
            <div
              className={`status-indicator ${
                connectionStatus.isConnected ? "connected" : "disconnected"
              }`}
            />
            <span className="status-text">{connectionStatus.status}</span>
          </div>

          {/* 登录区域 */}
          <div className="login-section">
            <h3>登录信息</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="用户ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isLoggedIn}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button
                onClick={handleLogin}
                disabled={isLoggedIn}
                className="login-btn"
              >
                登录
              </button>
              <button
                onClick={handleLogout}
                disabled={!isLoggedIn}
                className="logout-btn"
              >
                登出
              </button>
            </div>
          </div>

          {/* 通话区域 */}
          <div className="call-section">
            <h3>通话功能</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="对方用户ID"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                disabled={!isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button
                onClick={handleStartVideoCall}
                disabled={!isLoggedIn}
                className="call-btn video-btn"
              >
                发起一对一视频通话
              </button>
              <button
                onClick={handleStartAudioCall}
                disabled={!isLoggedIn}
                className="call-btn audio-btn"
              >
                发起一对一语音通话
              </button>
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="群组ID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                disabled={!isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button
                onClick={handleStartGroupCall}
                disabled={!isLoggedIn}
                className="call-btn group-btn"
              >
                发起群组通话
              </button>
            </div>
          </div>
        </div>

        {/* CallKit 组件 */}
        {isLoggedIn && (
          <CallKit
            ref={callKitRef}
            chatClient={rootStore.client}
            userInfoProvider={userInfoProvider}
            groupInfoProvider={groupInfoProvider}
            onCallError={(error: CallError) => {
              console.error("通话错误:", error);
              alert(`通话错误: ${error.message}`);
            }}
            onEndCallWithReason={(reason: string, callInfo: CallInfo) => {
              console.log("通话结束:", reason, callInfo);
            }}
          />
        )}
      </div>
    </Provider>
  );
};

export default App;
```

:::

2. 替换 `src/App.css` 文件内容：

::: details src/App.css 文件中的替换代码

```css
.app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

h3 {
  color: #34495e;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

/* 状态指示器 */
.status-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
}

.status-indicator.connected {
  background-color: #4caf50;
}

.status-indicator.disconnected {
  background-color: #808080;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

/* 登录和通话区域 */
.login-section,
.call-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.input-group {
  margin-bottom: 15px;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-group input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

.button-group button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 登录按钮 */
.login-btn {
  background-color: #28a745;
  color: white;
}

.login-btn:hover:not(:disabled) {
  background-color: #218838;
}

.logout-btn {
  background-color: #6c757d;
  color: white;
}

.logout-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

/* 通话按钮 */
.call-btn {
  color: white;
  font-weight: 600;
}

.video-btn {
  background-color: #007bff;
}

.video-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.audio-btn {
  background-color: #17a2b8;
}

.audio-btn:hover:not(:disabled) {
  background-color: #117a8b;
}

.group-btn {
  background-color: #6f42c1;
}

.group-btn:hover:not(:disabled) {
  background-color: #5a32a3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .main-content {
    padding: 20px;
  }

  .button-group {
    flex-direction: column;
  }

  h1 {
    font-size: 24px;
  }
}
```

:::

### 步骤 4 配置 App Key

将 App.jsx 代码中的 `org#app` 替换成你自己的 App Key。

### 步骤 5 发起首次通话

1. 启动应用：

```bash
npm run dev
```

2. 输入用户 ID 和 accessToken，点击 **登录**。等待状态指示器变绿，显示 **已连接**。

   此外，为了方便测试，应用支持通过将用户 ID 和 accessToken 拼接到 URL 中快速登录：

   ```
   http://localhost:5173?userId=your_user_id&accessToken=your_accessToken
   ```

在生产环境中，为了安全考虑，你需要在你的应用服务器集成 [获取 App Token API](/document/server-side/easemob_app_token.html) 和 [获取用户 Token API](/document/server-side/easemob_user_token.html) 实现获取 Token 的业务逻辑，使你的用户从你的应用服务器获取 Token。

3. 输入对方用户 ID，点击 **发起一对一视频通话** 或 **发起一对一语音通话**。
4. 在浏览器弹出的权限请求中，允许访问摄像头和麦克风。
5. 在通话中可以控制静音、摄像头、扬声器等，或者点击挂断按钮结束通话。

<img src="/images/callkit/web/quickstart_run.png" width="500">

## 运行应用

运行应用前，你需要授权摄像头、麦克风、悬浮窗等权限。

1. 在浏览器中访问 `http://localhost:5173`。
2. 输入 App Key、用户 ID 和 accessToken，点击 **登录** 进行登录，登录成功后状态指示器会变绿。
3. 在另一个浏览器标签页或设备上打开同样的页面，使用另一个账号登录。
4. 在主叫浏览器或设备上输入被叫方的用户 ID，点击对应的通话按钮，即可发起音视频通话。

运行应用过程中的常见问题排查如下：

- 连接失败：检查 App Key 是否正确配置。
- 通话无声音：检查麦克风权限是否已授权。
- 视频无画面：检查摄像头权限是否已授权。
- HTTPS 问题：生产环境部署时确保使用 HTTPS 协议。
