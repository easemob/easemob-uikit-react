# 跑通 Web 示例项目

本文档基于 call-demo.tsx 示例，帮助你快速集成和运行环信 Web CallKit，实现一对一音视频通话和群组音视频通话功能。

## 推荐环境

- Node.js: 16.0 及以上
- npm/yarn: 推荐最新版本
- React: 18.0 及以上
- TypeScript: 4.9 及以上
- 现代浏览器: Chrome/Firefox/Safari/Edge 最新版本
- [有效的环信账号](/product/console/account_register.html#注册账号)。

## 操作步骤

### 第一步 获取配置信息

在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

1. [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
2. [开通音视频服务](service_activation.html) // TODO：最终替换
3. [创建多个测试用户](/product/console/operation_user.html#创建用户)。
4. [创建群组](/product/console/operation_group.html#创建群组)，获取群组 ID。
5. 将测试用户加入群组。

### 第二步 项目配置

1. 克隆或下载项目。

```bash
git clone https://github.com/easemob/easemob-uikit-react
cd easemob-uikit-react
```

2. 安装依赖。

```bash
npm install
# 或
yarn install
```

3. 启动开发服务器。

```bash
npm run dev
# 或
yarn dev
```

### 第三步 访问示例

打开浏览器访问 `http://localhost:5173/demo/callkit/call-demo.html`

### 第四步 测试通话功能

1. **登录**：

   - 填写 App Key、用户 ID 和密码
   - 点击 **登录** 按钮
   - 等待登录成功提示

2. **完成配置**：

   - 输入目标用户 ID（用于一对一通话）或群组 ID（用于群组通话）
   - 点击 **完成配置**

3. **选择背景**（可选）：

   - 在背景选择面板中选择喜欢的背景图片

4. **发起通话**：

   - **一对一视频通话**：点击 **发起视频通话**
   - **一对一音频通话**：点击 **发起语音通话**
   - **群组通话**：点击 **发起群组视频通话**，选择要邀请的成员

5. **授权权限**：

   - 在浏览器弹出的权限请求中，允许访问摄像头和麦克风

6. **通话控制**：
   - 在通话中可以控制静音、摄像头、扬声器等
   - 点击 **结束通话** 挂断

## 功能说明

### CallKit 初始化

```tsx
import CallKit from '../../module/callkit/CallKit';
import Provider from '../../module/store/Provider';
import rootStore from '../../module/store/index';

// 1. 使用 Provider 包装应用
<Provider
  initConfig={{
    appKey: 'your_org#your_app',
    userId: 'your_user_id',
    password: 'your_password',
  }}
>
  {/* 2. 使用 CallKit 组件 */}
  <CallKit ref={callKitRef} chatClient={rootStore.client} />
</Provider>;
```

### 发起音视频通话

```tsx
// 一对一视频通话
const handleStartVideoCall = () => {
  callKitRef.current?.startSingleCall({
    to: targetUser,
    callType: 'video',
    msg: '邀请你进行视频通话',
  });
};

// 一对一音频通话
const handleStartAudioCall = () => {
  callKitRef.current?.startSingleCall({
    to: targetUser,
    callType: 'audio',
    msg: '邀请你进行语音通话',
  });
};

// 群组通话
const handleStartGroupCall = (callType: 'video' | 'audio') => {
  callKitRef.current?.startGroupCall({
    groupId: targetUser,
    callType,
    msg: `邀请加入群组${callType === 'video' ? '视频' : '语音'}通话`,
  });
};
```

### 用户信息提供者

```tsx
// 实现用户信息提供者
const userInfoProvider = async (userIds: string[]) => {
  // 模拟从服务器获取用户信息
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
```

## （可选）铃声配置

将铃声文件放在 demo/callkit/ 目录下：

```
demo/callkit/
├── 拨打电话.mp3     # 呼出铃声
├── 接听电话.mp3     # 来电铃声
└── real-call-demo.tsx
```

在 CallKit 中配置铃声：

```tsx
<CallKit
  outgoingRingtoneSrc={outgoingRingtone} // 导入的铃声文件
  incomingRingtoneSrc={incomingRingtone} // 导入的铃声文件
  enableRingtone={true} // 启用铃声
  ringtoneVolume={0.8} // 音量 80%
  ringtoneLoop={true} // 循环播放
  // 其他配置...
/>
```

### （可选）自定义背景

```tsx
// 预设背景选项
const backgroundOptions = [
  {
    id: 0,
    name: '默认背景',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  },
  // 更多背景选项...
];

// 应用背景
<CallKit
  backgroundImage={backgroundOptions[selectedBackground].url}
  // 其他配置...
/>;
```

### （可选）自定义图标

```tsx
<CallKit
  customIcons={{
    controls: {
      hangup: <CustomHangupIcon />,
      micOn: <CustomMicOnIcon />,
      micOff: <CustomMicOffIcon />,
      // 更多自定义图标...
    },
    header: {
      back: <CustomBackIcon />,
      minimize: <CustomMinimizeIcon />,
      // 更多自定义图标...
    },
  }}
  // 其他配置...
/>
```

## URL 参数快速登录

为了方便测试，demo 支持通过 URL 参数快速登录：

```
http://localhost:5173/demo/callkit/call-demo.html?userId=your_user_id&password=your_password&appKey=your_org%23your_app
```

参数说明：

- `userId`: 用户 ID
- `password`: 用户密码
- `appKey`: App Key（需要 URL 编码，# 替换为 %23）

## 进阶配置

### 音量指示器

```tsx
<CallKit
  speakingVolumeThreshold={30} // 设置音量阈值，默认 60
  onTalkingUsersChange={talkingUsers => {
    console.log('正在说话的用户:', talkingUsers);
  }}
/>
```

### 布局管理

```tsx
<CallKit
  layoutMode={LayoutMode.MULTI_PARTY} // 多人布局模式
  aspectRatio={1} // 视频窗口宽高比
  gap={6} // 窗口间距
  resizable={true} // 允许调整大小
  draggable={true} // 允许拖拽
  managedPosition={true} // 自动管理位置
/>
```

## 常见问题

| 错误类型 | 描述 |
| :-- | :-- |
| 发起通话无反应 | - **检查 chatClient**：chatClient 为 IM SDK 示例， 需确保 SDK 已经初始化并登录。<br/> - **用户不存在**：确保已在环信控制台创建用户。 |
| 通话无法建立 | - **权限问题**：确保已授权摄像头、麦克风权限。<br/> - **对方离线**：确保接听方在线且已登录。 <br/> - **网络问题**：检查网络连接状况。 |
| 音视频问题 | - **无声音**：检查麦克风权限和音频设备。<br/> - **无画面**：检查摄像头权限和浏览器兼容性。 <br/> - **画面卡顿**：检查网络带宽。 |
| 浏览器兼容性 | **不支持 WebRTC**：确保使用现代浏览器最新版本。<br/> - **HTTPS 要求**：生产环境需要 HTTPS 协议。 |
