# Web CallKit 快速开始

利用环信 Web CallKit，你可以轻松实现一对一通话和群组通话功能。本文介绍如何快速实现发起音视频通话。

## 推荐环境

- Node.js: 18.0 及以上
- npm: 9.0 及以上 或 yarn: 1.22 及以上
- React: 18.0 及以上
- TypeScript: 4.9 及以上
- Vite: 4.0 及以上
- 现代浏览器: Chrome/Firefox/Safari/Edge 最新版本
- [有效的环信账号](/product/console/account_register.html#注册账号)

## 快速开始

### 第一步 获取配置信息

在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

1. [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
2. [开通音视频服务](service_activation.html) // TODO：最终替换
3. [创建多个测试用户](/product/console/operation_user.html#创建用户)。
4. [创建群组](/product/console/operation_group.html#创建群组)，获取群组 ID。
5. 将测试用户加入群组。

### 第二步 创建项目

本节介绍使用 Vite 创建 React + TypeScript 项目的步骤。

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

打开浏览器访问 `http://localhost:5173`，确认项目正常运行。

### 第三步 引入 CallKit

#### 安装依赖

在项目根目录下安装 CallKit 依赖：

```bash
npm install easemob-chat-uikit
# 或使用 yarn
yarn add easemob-chat-uikit
```

### 第四步 创建快速开始页面

1. 替换 `src/App.tsx` 文件内容：

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Provider, CallKit, CallError, CallInfo, rootStore } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';
import './App.css';

interface ConnectionStatus {
  isConnected: boolean;
  status: string;
}

const App: React.FC = () => {
  // 登录相关状态
  const [appKey, setAppKey] = useState('org#app'); // 默认AppKey
  const [appKeyInput, setAppKeyInput] = useState(''); // 临时输入的AppKey
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: '连接状态: 未连接',
  });

  // 通话相关状态
  const [targetUserId, setTargetUserId] = useState('');
  const [groupId, setGroupId] = useState('');

  // CallKit 引用
  const callKitRef = useRef<CallKit>(null);

  // 处理URL参数快速登录
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appKeyFromUrl = urlParams.get('appKey');
    if (appKeyFromUrl) {
      setAppKeyInput(appKeyFromUrl);
      setAppKey(appKeyFromUrl);
    }

    const userIdFromUrl = urlParams.get('userId');
    if (userIdFromUrl) setUserId(userIdFromUrl);

    const passwordFromUrl = urlParams.get('password');
    if (passwordFromUrl) setPassword(passwordFromUrl);
  }, []);

  // 设置AppKey
  const handleSetAppKey = () => {
    if (!appKeyInput.trim()) {
      alert('AppKey不能为空!');
      return;
    }
    setAppKey(appKeyInput.trim());
    alert('AppKey设置成功!');
  };

  // 监听连接状态
  useEffect(() => {
    const handleConnectionChange = () => {
      if (rootStore.client?.isOpened()) {
        setConnectionStatus({
          isConnected: true,
          status: '连接状态: 已连接',
        });
      } else {
        setConnectionStatus({
          isConnected: false,
          status: '连接状态: 已断开',
        });
      }
    };

    // 监听连接状态变化
    if (rootStore.client) {
      rootStore.client.addEventHandler('CONNECTION_LISTENER', {
        onConnected: () => {
          console.log('连接成功');
          handleConnectionChange();
        },
        onDisconnected: () => {
          console.log('连接断开');
          handleConnectionChange();
        },
      });
    }

    return () => {
      if (rootStore.client) {
        rootStore.client.removeEventHandler('CONNECTION_LISTENER');
      }
    };
  }, [isLoggedIn]);

  // 登录处理
  const handleLogin = async () => {
    if (!appKey.trim()) {
      alert('请先设置AppKey!');
      return;
    }
    if (!userId.trim() || !password.trim()) {
      alert('用户ID和密码不能为空!');
      return;
    }

    try {
      // 登录 IM
      await rootStore.client.open({
        user: userId.trim(),
        pwd: password.trim(),
      });

      setIsLoggedIn(true);
      setConnectionStatus({
        isConnected: true,
        status: '连接状态: 已连接',
      });
      alert('登录成功!');
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
        status: '连接状态: 已登出',
      });
      // 结束所有通话
      callKitRef.current?.hangupCall();
      alert('登出成功!');
    } catch (error: any) {
      alert(`登出失败: ${error.message || error}`);
    }
  };

  // 发起单人视频通话
  const handleStartVideoCall = async () => {
    if (!targetUserId.trim()) {
      alert('对方用户ID不能为空!');
      return;
    }

    try {
      await callKitRef.current?.startSingleCall({
        to: targetUserId.trim(),
        callType: 'video',
        msg: '邀请你进行视频通话',
      });
    } catch (error: any) {
      alert(`发起视频通话失败: ${error.message || error}`);
    }
  };

  // 发起单人音频通话
  const handleStartAudioCall = async () => {
    if (!targetUserId.trim()) {
      alert('对方用户ID不能为空!');
      return;
    }

    try {
      await callKitRef.current?.startSingleCall({
        to: targetUserId.trim(),
        callType: 'audio',
        msg: '邀请你进行语音通话',
      });
    } catch (error: any) {
      alert(`发起语音通话失败: ${error.message || error}`);
    }
  };

  // 发起群组通话
  const handleStartGroupCall = async () => {
    if (!groupId.trim()) {
      alert('群组ID不能为空!');
      return;
    }

    try {
      await callKitRef.current?.startGroupCall({
        groupId: groupId.trim(),
        callType: 'video',
        msg: '邀请加入群组视频通话',
      });
    } catch (error: any) {
      alert(`发起群组通话失败: ${error.message || error}`);
    }
  };

  // 用户信息提供者
  const userInfoProvider = async (userIds: string[]) => {
    return userIds.map(userId => ({
      userId,
      nickname: `用户 ${userId}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    }));
  };

  // 群组信息提供者
  const groupInfoProvider = async (groupIds: string[]) => {
    return groupIds.map(groupId => ({
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
                connectionStatus.isConnected ? 'connected' : 'disconnected'
              }`}
            />
            <span className="status-text">{connectionStatus.status}</span>
          </div>

          {/* AppKey 配置区域 */}
          <div className="appkey-section">
            <h3>AppKey 配置</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="App Key (格式: orgname#appname)"
                value={appKeyInput}
                onChange={e => setAppKeyInput(e.target.value)}
                disabled={isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button onClick={handleSetAppKey} disabled={isLoggedIn} className="appkey-btn">
                设置 AppKey
              </button>
              {appKey && <span className="appkey-status">✓ 已设置: {appKey}</span>}
            </div>
          </div>

          {/* 登录区域 */}
          <div className="login-section">
            <h3>登录信息</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="用户ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                disabled={isLoggedIn}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button onClick={handleLogin} disabled={isLoggedIn} className="login-btn">
                登录
              </button>
              <button onClick={handleLogout} disabled={!isLoggedIn} className="logout-btn">
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
                onChange={e => setTargetUserId(e.target.value)}
                disabled={!isLoggedIn}
              />
            </div>
            <div className="button-group">
              <button
                onClick={handleStartVideoCall}
                disabled={!isLoggedIn}
                className="call-btn video-btn"
              >
                发起视频通话
              </button>
              <button
                onClick={handleStartAudioCall}
                disabled={!isLoggedIn}
                className="call-btn audio-btn"
              >
                发起语音通话
              </button>
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="群组ID"
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
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
              console.error('通话错误:', error);
              alert(`通话错误: ${error.message}`);
            }}
            onEndCallWithReason={(reason: string, callInfo: CallInfo) => {
              console.log('通话结束:', reason, callInfo);
            }}
          />
        )}
      </div>
    </Provider>
  );
};

export default App;
```

2. 替换 `src/App.css` 文件内容：

```css
.app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

### 第五步 发起首次通话

1. **启动应用**：

```bash
npm run dev
```

2. **登录**：

   - 填写你的 App Key、用户 ID 和密码
   - 点击 **登录** 按钮
   - 等待状态指示器变绿，显示 **已连接**

3. **发起通话**：

   - **一对一视频通话**：输入对方用户 ID，点击 **发起视频通话**
   - **一对一音频通话**：输入对方用户 ID，点击 **发起语音通话**
   - **群组通话**：输入群组 ID，点击 **发起群组通话**

4. **授权权限**：

   - 在浏览器弹出的权限请求中，允许访问摄像头和麦克风

5. **通话控制**：
   - 在通话中可以控制静音、摄像头、扬声器等
   - 点击挂断按钮结束通话

## 测试应用

测试前，你需要了解以下几方面：

- 首次使用时需要授权摄像头、麦克风权限
- 确保设备网络连接正常
- 测试多人通话时，需要先创建群组并获取群组 ID
- 建议使用现代浏览器的最新版本以获得最佳体验
- 生产环境必须使用 HTTPS 协议

按照以下步骤进行测试：

1. 在浏览器中访问 `http://localhost:5173`
2. 输入 App Key、用户 ID 和密码，点击 **登录** 进行登录，登录成功后状态指示器会变绿
3. 在另一个浏览器标签页或设备上打开同样的页面，使用另一个账号登录
4. 两个用户分别输入对方的账号，点击对应的通话按钮，即可发起音视频通话

测试过程中的常见问题排查：

- **连接失败**：检查 App Key 是否正确配置
- **通话无声音**：检查麦克风权限是否已授权
- **视频无画面**：检查摄像头权限是否已授权
- **群组通话失败**：确认群组 ID 是否正确且用户已加入该群组
- **HTTPS 问题**：生产环境部署时确保使用 HTTPS 协议

## URL 参数快速登录

为了方便测试，应用支持通过 URL 参数快速登录：

```
http://localhost:5173?appKey=your_org%23your_app&userId=your_user_id&password=your_password
```

参数说明：

- `appKey`: App Key（需要 URL 编码，# 替换为 %23）
- `userId`: 用户 ID
- `password`: 用户密码
