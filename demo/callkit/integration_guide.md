# CallKit 集成指南

本文档详细介绍如何在您的 React 项目中集成和使用环信 CallKit，实现完整的音视频通话功能。

## 目录

- [概述](#概述)
- [安装与配置](#安装与配置)
- [基本使用](#基本使用)
- [详细配置](#详细配置)
- [API 方法](#api-方法)
- [事件回调](#事件回调)
<!-- - [高级功能](#高级功能) -->
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

CallKit 是环信提供的一站式音视频通话解决方案，支持：

- **一对一音视频通话**：支持视频通话和语音通话
- **群组音视频通话**：支持多人视频通话和语音通话
- **丰富的控制功能**：静音、摄像头控制、扬声器控制等
- **灵活的布局管理**：多种布局模式、可拖拽、可调整大小
- **完善的用户体验**：来电通知、铃声、网络质量指示等

## 安装与配置

### 1. 安装依赖

```bash
npm install easemob-chat-uikit
# 或
yarn add easemob-chat-uikit
```

### 2. 导入样式

```tsx
import 'easemob-chat-uikit/style.css';
```

### 3. 基本引入

```tsx
import React, { useRef } from 'react';
import { CallKit, Provider, rootStore } from 'easemob-chat-uikit';
import type { CallKitRef } from 'easemob-chat-uikit';
```

## 基本使用

### 1. 基础组件结构

```tsx
import React, { useRef } from 'react';
import { CallKit, Provider, rootStore, CallKitRef } from 'easemob-chat-uikit';

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);

  return (
    <Provider
      initConfig={{
        appKey: 'your appKey',
        userId: 'userId',
        token: 'token',
      }}
    >
      <CallKit
        ref={callKitRef}
        chatClient={rootStore.client}
        userInfoProvider={userInfoProvider}
        groupInfoProvider={groupInfoProvider}
      />
    </Provider>
  );
};
```

### 2. 用户信息提供者

```tsx
const userInfoProvider = async (userIds: string[]) => {
  // 从您的服务器或本地缓存获取用户信息
  return userIds.map(userId => ({
    userId,
    nickname: `用户 ${userId}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
  }));
};
```

### 3. 群组信息提供者

```tsx
const groupInfoProvider = async (groupIds: string[]) => {
  // 从您的服务器或本地缓存获取群组信息
  return groupIds.map(groupId => ({
    groupId,
    groupName: `群组 ${groupId}`,
    groupAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=group-${groupId}`,
  }));
};
```

### 4. 发起通话

```tsx
// 一对一视频通话
const startVideoCall = () => {
  callKitRef.current?.startSingleCall({
    to: 'target_user_id',
    callType: 'video',
    msg: '邀请你进行视频通话',
  });
};

// 一对一语音通话
const startAudioCall = () => {
  callKitRef.current?.startSingleCall({
    to: 'target_user_id',
    callType: 'audio',
    msg: '邀请你进行语音通话',
  });
};

// 群组通话
const startGroupCall = () => {
  callKitRef.current?.startGroupCall({
    groupId: 'group_id',
    callType: 'video',
    msg: '邀请加入群组视频通话',
  });
};
```

## 详细配置

### 布局配置

```tsx
<CallKit
  // 视频窗口宽高比
  aspectRatio={16 / 9}
  // 窗口间距
  gap={8}
  // 最大显示视频数量
  maxVideos={12}
  // 背景图片
  backgroundImage="https://example.com/background.jpg"
/>
```

### 窗口管理配置

```tsx
<CallKit
  // 可调整大小
  resizable={true}
  minWidth={400}
  minHeight={300}
  maxWidth={1200}
  maxHeight={800}
  onResize={(width, height) => console.log('窗口尺寸:', width, height)}
  // 可拖拽
  draggable={true}
  onDragStart={() => console.log('开始拖拽')}
  onDrag={position => console.log('拖拽位置:', position)}
  onDragEnd={() => console.log('拖拽结束')}
  // 内置位置管理
  managedPosition={true}
  initialPosition={{ left: 100, top: 100 }}
  initialSize={{ width: 800, height: 600 }}
  // 最小化
  minimizedSize={{ width: 120, height: 80 }} // 群组通话最小化的尺寸
  onMinimizedChange={minimized => console.log('最小化状态:', minimized)}
/>
```

### 邀请配置

```tsx
<CallKit
  // 自定义邀请内容
  invitationCustomContent={<CustomInvitationComponent />}
  // 邀请界面显示配置
  showInvitationAvatar={true}
  autoRejectTime={30} // 30秒自动拒绝
/>
```

### 铃声配置

```tsx
<CallKit
  // 呼出铃声
  outgoingRingtoneSrc="/sounds/outgoing.mp3"
  // 来电铃声
  incomingRingtoneSrc="/sounds/incoming.mp3"
  // 启用铃声
  enableRingtone={true}
  // 铃声音量 (0-1)
  ringtoneVolume={0.8}
  // 循环播放
  ringtoneLoop={true}
/>
```

### 音量指示器配置

```tsx
<CallKit
  // 音量阈值（说话检测 0-100）
  speakingVolumeThreshold={60}
/>
```

### 自定义图标

```tsx
const customIcons = {
  controls: {
    micOn: <CustomMicOnIcon />,
    micOff: <CustomMicOffIcon />,
    cameraOn: <CustomCameraOnIcon />,
    cameraOff: <CustomCameraOffIcon />,
    speakerOn: <CustomSpeakerOnIcon />,
    speakerOff: <CustomSpeakerOffIcon />,
    hangup: <CustomHangupIcon />,
    accept: <CustomAcceptIcon />,
    reject: <CustomRejectIcon />,
  },
  header: {
    minimize: <CustomMinimizeIcon />,
    fullscreen: <CustomFullscreenIcon />,
    exitFullscreen: <CustomExitFullscreenIcon />,
    addParticipant: <CustomAddIcon />,
  },
};

<CallKit customIcons={customIcons} />;
```

## API 方法

通过 ref 可以调用以下方法：

### 通话控制

```tsx
const callKitRef = useRef<CallKitRef>(null);

// 发起一对一通话
callKitRef.current?.startSingleCall({
  to: string,
  callType: 'video' | 'audio',
  msg: string,
  ext?: Record<string, any>
});

// 发起群组通话
callKitRef.current?.startGroupCall({
  groupId: string,
  msg: string,
  ext?: Record<string, any>
});

// 挂断通话
callKitRef.current?.exitCall(reason?: string);

// 接听/拒绝通话
callKitRef.current?.answerCall(accept: boolean);
```

<!-- ### 通话控制

```tsx
// 切换静音
callKitRef.current?.toggleMute();

// 切换摄像头
callKitRef.current?.toggleCamera();

// 添加参与者
callKitRef.current?.addParticipants(['user1', 'user2']);
``` -->

### 窗口控制

```tsx
// 调整窗口大小
callKitRef.current?.adjustSize({ width: 800, height: 600 });

// // 显示预览
// callKitRef.current?.showPreview('video');

// // 隐藏邀请
// callKitRef.current?.hideInvitation();
```

## 事件回调

### 通话事件

```tsx
<CallKit
  // 通话开始
  onCallStart={videos => {
    console.log('通话开始，视频列表:', videos);
  }}
  // 通话结束
  onEndCallWithReason={(reason, callInfo) => {
    console.log('通话结束:', reason, callInfo);
  }}
  // 通话错误
  onCallError={error => {
    console.error('通话错误:', error);
  }}
  // 收到通话邀请
  onReceivedCall={invitation => {
    console.log('收到通话邀请:', invitation);
  }}
/>
```

### 用户事件

```tsx
<CallKit
  // 远程用户加入
  onRemoteUserJoined={userId => {
    console.log('远程用户加入:', userId);
  }}
  // 远程用户离开
  onRemoteUserLeft={userId => {
    console.log('远程用户离开:', userId);
  }}
  // 正在说话的用户变化
  onTalkingUsersChange={talkingUsers => {
    console.log('正在说话的用户:', talkingUsers);
  }}
/>
```

### 布局事件

```tsx
<CallKit
  // 布局模式变化
  onLayoutModeChange={mode => {
    console.log('布局模式变化:', mode);
  }}
/>
```

### RTC 引擎事件

```tsx
<CallKit
  // RTC 引擎创建
  onRtcEngineCreated={engine => {
    console.log('RTC引擎创建:', engine);
  }}
/>
```

<!-- ## 高级功能

### 群组成员自动获取

当配置了 `chatClient` 和 `userInfoProvider` 时，CallKit 会自动获取群组成员信息：

```tsx
<CallKit
  chatClient={rootStore.client}
  userInfoProvider={userInfoProvider}
  groupInfoProvider={groupInfoProvider}
  // 手动提供群组成员（可选）
  groupMembers={[
    { userId: 'user1', nickname: '用户1', avatarUrl: 'url1' },
    { userId: 'user2', nickname: '用户2', avatarUrl: 'url2' },
  ]}
/>
```

### 用户选择配置

```tsx
<CallKit
  // 用户选择标题
  userSelectTitle="选择通话成员"
  // 群组成员（用于多人通话时选择）
  groupMembers={groupMembers}
/>
```

### 网络质量监控

```tsx
<CallKit
  // 网络质量变化回调
  onNetworkQualityChange={quality => {
    console.log('网络质量:', quality);
  }}
/>
```

### 预览模式

```tsx
// 显示预览界面
callKitRef.current?.showPreview('video');

// 预览模式回调
<CallKit
  onPreviewAccept={() => console.log('预览接受')}
  onPreviewReject={() => console.log('预览拒绝')}
/>;
``` -->

## 最佳实践

### 1. 错误处理

```tsx
<CallKit
  onCallError={error => {
    // 根据错误类型进行不同处理
    switch (error.code) {
      case 'PERMISSION_DENIED':
        alert('请授权摄像头和麦克风权限');
        break;
      case 'NETWORK_ERROR':
        alert('网络连接异常，请检查网络');
        break;
      default:
        alert(`通话错误: ${error.message}`);
    }
  }}
/>
```

### 2. 用户信息缓存

```tsx
const userInfoCache = new Map();

const userInfoProvider = async (userIds: string[]) => {
  const uncachedIds = userIds.filter(id => !userInfoCache.has(id));

  if (uncachedIds.length > 0) {
    // 只请求未缓存的用户信息
    const newUserInfos = await fetchUserInfoFromServer(uncachedIds);
    newUserInfos.forEach(info => {
      userInfoCache.set(info.userId, info);
    });
  }

  return userIds.map(id => userInfoCache.get(id));
};
```

### 3. 组件卸载时清理

```tsx
useEffect(() => {
  return () => {
    // 组件卸载时结束通话
    callKitRef.current?.exitCall();
  };
}, []);
```
