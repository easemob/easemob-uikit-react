# CallKit 邀请通知功能

## 功能介绍

CallKit 组件现在支持邀请通知功能，允许在应用的任何路由页面显示通话邀请。这个功能类似于 notification 组件，可以在应用根组件下注册，确保无论用户在哪个页面都能收到通话邀请。

## 主要特性

- ✅ **全局显示**: 可以在任何路由页面显示邀请通知
- ✅ **多种邀请类型**: 支持视频通话、语音通话和群组通话邀请
- ✅ **自定义界面**: 支持自定义邀请内容和样式
- ✅ **自动倒计时**: 支持自动拒绝倒计时功能
- ✅ **头像显示**: 显示邀请者或群组头像
- ✅ **复用通知系统**: 基于现有的 notification 组件实现

## 快速开始

### 1. 基本用法

```tsx
import React, { useRef } from 'react';
import { CallKit, InvitationInfo, CallKitRef } from 'your-ui-kit';

const App = () => {
  const callKitRef = useRef<CallKitRef>(null);

  // 接听邀请
  const handleAccept = (invitation: InvitationInfo) => {
    console.log('接听邀请:', invitation);
    // 开始通话逻辑 - 模拟添加视频流
    const videos = [
      { id: 'local', nickname: '我', isLocalVideo: true },
      { id: 'remote', nickname: invitation.callerName || '对方' },
    ];
    callKitRef.current?.startCall(videos);
  };

  // 拒绝邀请
  const handleReject = (invitation: InvitationInfo) => {
    console.log('拒绝邀请:', invitation);
    // 拒绝通话逻辑
  };

  // 模拟收到邀请
  const simulateInvitation = () => {
    const invitation = {
      id: '1',
      type: 'video',
      callerName: '张三',
      callerAvatar: 'https://example.com/avatar.jpg',
      timestamp: Date.now(),
    };
    callKitRef.current?.showInvitation(invitation);
  };

  return (
    <div>
      {/* 你的应用内容 */}
      <h1>我的应用</h1>
      <button onClick={simulateInvitation}>模拟收到邀请</button>

      {/* CallKit 组件 - 放在根组件下，内部管理状态 */}
      <CallKit
        ref={callKitRef}
        onInvitationAccept={handleAccept}
        onInvitationReject={handleReject}
        managedPosition={true}
        initialPosition={{ left: 100, top: 100 }}
        initialSize={{ width: 800, height: 600 }}
        resizable={true}
        draggable={true}
      />
    </div>
  );
};
```

### 2. 邀请数据结构

```tsx
interface InvitationInfo {
  id: string;
  type: 'video' | 'audio' | 'group'; // 邀请类型
  callerName?: string; // 呼叫者姓名
  callerAvatar?: string; // 呼叫者头像
  groupName?: string; // 群组名称（群组通话时）
  groupAvatar?: string; // 群组头像（群组通话时）
  memberCount?: number; // 群组成员数量
  timestamp?: number; // 邀请时间戳
  customData?: Record<string, any>; // 自定义数据
}
```

### 3. 模拟邀请示例

```tsx
// 视频通话邀请
const videoInvitation: InvitationInfo = {
  id: '1',
  type: 'video',
  callerName: '张三',
  callerAvatar: 'https://example.com/avatar1.jpg',
  timestamp: Date.now(),
};

// 语音通话邀请
const audioInvitation: InvitationInfo = {
  id: '2',
  type: 'audio',
  callerName: '李四',
  callerAvatar: 'https://example.com/avatar2.jpg',
  timestamp: Date.now(),
};

// 群组通话邀请
const groupInvitation: InvitationInfo = {
  id: '3',
  type: 'group',
  groupName: '项目讨论组',
  groupAvatar: 'https://example.com/group-avatar.jpg',
  memberCount: 5,
  timestamp: Date.now(),
};

// 显示邀请
callKitRef.current?.showInvitation(videoInvitation);
```

### 4. 配置选项

```tsx
<CallKit
  ref={callKitRef}
  // 邀请相关配置
  onInvitationAccept={handleAccept}
  onInvitationReject={handleReject}
  invitationCustomContent={customContent} // 自定义邀请内容
  acceptText="接听" // 接听按钮文本
  rejectText="挂断" // 挂断按钮文本
  showInvitationAvatar={true} // 是否显示头像
  showInvitationTimer={true} // 是否显示倒计时
  autoRejectTime={30} // 自动拒绝时间（秒）
  // 其他配置...
  managedPosition={true}
  // ...
/>
```

## 使用场景

### 1. IM 应用

在即时通讯应用中，用户可以在聊天页面、联系人页面或设置页面等任何地方收到通话邀请。

### 2. 协作应用

在团队协作应用中，用户可以在文档编辑、项目管理等页面收到会议邀请。

### 3. 客服系统

在客服系统中，客服人员可以在处理工单、查看数据等页面收到客户的视频通话请求。

## 工作原理

1. **组件隐藏**: CallKit 组件默认是隐藏的，内部管理显示状态
2. **邀请触发**: 调用 `callKitRef.current?.showInvitation()` 会在屏幕顶部显示邀请通知
3. **用户交互**: 用户可以点击接听或拒绝按钮
4. **状态切换**: 接听后隐藏邀请通知，显示通话界面；拒绝后直接隐藏通知
5. **自动拒绝**: 倒计时结束后自动调用拒绝回调
6. **内部管理**: 组件内部管理邀请状态、通话状态、视频列表等，用户无需关心

## 演示

运行演示文件查看完整功能：

```bash
# 在项目根目录下
cd demo/callkit
# 打开 invitation-demo.html 文件
```

演示包含：

- 模拟不同类型的邀请
- 邀请通知的显示和交互
- 通话界面的切换
- 完整的状态管理示例

## 注意事项

1. **位置管理**: 建议使用 `managedPosition={true}` 让组件自动管理位置
2. **状态同步**: 确保在接听/拒绝后正确更新应用状态
3. **路由兼容**: 组件不会因为路由切换而卸载，确保通话连续性
4. **性能优化**: 当没有邀请时组件是完全隐藏的，不会影响性能
5. **样式自定义**: 可以通过 CSS 自定义邀请通知的样式

## API 参考

### CallKit Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ref` | `React.RefObject<CallKitRef>` | - | 组件引用，用于调用方法 |
| `onInvitationAccept` | `(invitation: InvitationInfo) => void` | - | 接听邀请回调 |
| `onInvitationReject` | `(invitation: InvitationInfo) => void` | - | 拒绝邀请回调 |
| `onCallStart` | `(videos: VideoWindowProps[]) => void` | - | 通话开始回调 |
| `onCallEnd` | `() => void` | - | 通话结束回调 |
| `invitationCustomContent` | `React.ReactNode` | - | 自定义邀请内容 |
| `acceptText` | `string` | `"接听"` | 接听按钮文本 |
| `rejectText` | `string` | `"挂断"` | 挂断按钮文本 |
| `showInvitationAvatar` | `boolean` | `true` | 是否显示邀请头像 |
| `showInvitationTimer` | `boolean` | `true` | 是否显示倒计时 |
| `autoRejectTime` | `number` | `30` | 自动拒绝时间（秒） |
| `managedPosition` | `boolean` | `false` | 是否启用内置位置管理 |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `draggable` | `boolean` | `false` | 是否可拖拽 |

### CallKit Ref 方法

| 方法                   | 类型                                   | 说明             |
| ---------------------- | -------------------------------------- | ---------------- |
| `showInvitation`       | `(invitation: InvitationInfo) => void` | 显示邀请通知     |
| `hideInvitation`       | `() => void`                           | 隐藏邀请通知     |
| `startCall`            | `(videos: VideoWindowProps[]) => void` | 开始通话         |
| `endCall`              | `() => void`                           | 结束通话         |
| `updateVideos`         | `(videos: VideoWindowProps[]) => void` | 更新视频列表     |
| `isInCall`             | `() => boolean`                        | 是否在通话中     |
| `hasInvitation`        | `() => boolean`                        | 是否有邀请       |
| `getCurrentInvitation` | `() => InvitationInfo \| null`         | 获取当前邀请信息 |

### InvitationInfo 接口

```tsx
interface InvitationInfo {
  id: string;
  type: 'video' | 'audio' | 'group';
  callerName?: string;
  callerAvatar?: string;
  groupName?: string;
  groupAvatar?: string;
  memberCount?: number;
  timestamp?: number;
  customData?: Record<string, any>;
}
```
