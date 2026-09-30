# Web CallKit：自定义 RTC 凭证接入

## 用户 ID

CallKit 使用当前登录的 IM `userId` 作为 RTC 字符串 UID。数字形式的 IM ID（如 `"00123"`）也保持字符串，不转换为数字。远端 RTC UID 直接用于用户资料查询、媒体轨道、音量和网络质量事件，无需维护 ID 映射。

同一 RTC 频道的所有端必须使用字符串 UID；移动端应以 User Account 方式加入频道。

## RTC provider

```ts
interface RTCTokenInfo {
  appId: string;
  rtcToken: string;
  /** 已弃用，CallKit 忽略此字段，直接使用登录中的 IM userId。 */
  rtcUid?: string | number;
}

interface CallKitRTCProvider {
  getRTCTokenInfo?: (params: {
    channelName: string;
    userId: string;
  }) => Promise<RTCTokenInfo>;
  /** 已弃用，CallKit 不再调用 UID 映射方法。 */
  getUserIdsWithRTCUids?: (rtcUids: number[]) => Promise<Record<string, string>>;
}
```

`rtcProvider` 是 CallKit 组件级配置。未配置 `getRTCTokenInfo` 时，CallKit 调用 IM 客户端的 `getRTCTokenInfo({ channelName })` 获取凭证。无论凭证来源如何，入会 UID 始终使用当前 IM userId。

启用 Token 校验时，服务端必须按实际频道名和 IM userId **字符串账号**签发 RTC Token（使用 User Account 的 Token 接口）。原来按数字 UID 签发的 Token 需要同步更新；返回的数字 `rtcUid` 不会改变 CallKit 的入会账号。

### 无 Token 校验的 demo

```tsx
import React from 'react';
import { CallKit } from 'easemob-chat-uikit';
import type { CallKitRTCProvider } from 'easemob-chat-uikit';

const rtcProvider: CallKitRTCProvider = {
  getRTCTokenInfo: async () => ({
    appId: 'your-agora-app-id',
    rtcToken: '',
  }),
};

function CallKitLayer() {
  return <CallKit rtcProvider={rtcProvider} useRTCToken={false} />;
}
```

将组件放在已登录的 UIKit `Provider` 内。声网项目关闭 Token 校验时，返回空字符串并设置 `useRTCToken={false}`，CallKit 以 `null` Token 加入频道。

### 使用业务服务端 Token

```tsx
const rtcProvider: CallKitRTCProvider = {
  async getRTCTokenInfo({ channelName, userId }) {
    const response = await fetch('/api/rtc/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ channelName, userId }),
    });
    if (!response.ok) throw new Error('获取 RTC Token 失败');
    const data = await response.json();
    if (!data.appId || !data.rtcToken) throw new Error('RTC 凭证不完整');
    return { appId: data.appId, rtcToken: data.rtcToken };
  },
};

<CallKit rtcProvider={rtcProvider} />;
```

服务端验证当前登录用户，并按 `channelName` 和 `userId` 签发凭证。不要把 App Certificate 放在浏览器中。IM 登录 Token 与 RTC Token 是独立凭证。

Provider 应保持引用稳定（例如定义在组件外或使用 `useMemo`）。CallKit 在加入频道前获取凭证，无需业务代码手动初始化 RTC。

## 常见问题

| 现象 | 排查方向 |
| --- | --- |
| `Valid RTC token info is unavailable` | 检查已登录的 IM userId、非空 appId，以及开启校验时的非空 rtcToken。 |
| 有邀请但无法进入频道 | 确认 Token 按当前 IM userId 字符串账号、实际频道和 App ID 签发。 |
| 远端昵称或头像不正确 | RTC UID 已是 IM userId，检查 `userInfoProvider` 返回的业务资料。 |
| 仍请求 IM SDK 的 RTC 凭证接口 | 配置 `rtcProvider.getRTCTokenInfo`；UID 映射接口已不再使用。 |

## 多人通话与追加邀请

`startGroupCall` 有两种入口：

- 传入 `groupId`：打开 CallKit 内置成员选择器，读取该 IM 群的成员；列表为空时使用联系人列表。搜索不会按任意 userId 查询所有 IM 用户。
- 传入 `userIds`：跳过选择器，直接邀请这些 IM 用户。`groupId` 可省略，此时不绑定 IM 群。

```tsx
await callKitRef.current?.startGroupCall({
  userIds: ['alice', 'bob', 'charlie'],
  callType: 'video',
  msg: '邀请加入多人通话',
});

// 多人通话进行中：发送邀请，其他用户接听后才加入。
const invited = await callKitRef.current?.addParticipants(['david', 'emma']);
```

传入 `userIds` 时会去掉空值、重复项和自己，至少需要一个其他用户。参与者应使用同一个 IM 应用中的真实 userId。一对一通话不支持 `addParticipants`。

通话页面的添加成员按钮默认也会打开内置选择器。传入 `onAddParticipant` 可以接管该按钮，展示自己的输入框或选择器，再通过 `addParticipants(userIds)` 发出邀请。

当前 demo 在“发起多人通话”和“通话中继续邀请”区域提供输入框，支持逗号、空格和分号分隔；添加成员按钮会定位到追加邀请输入框。

多人视频通话在发起或接听时创建摄像头轨道并发布，已有轨道会保留其开关状态。摄像头不可用时通过 `onCallError` 通知，仍可加入通话并发送音频。多人语音通话不会开启摄像头。
