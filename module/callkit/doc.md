# Web CallKit：自定义 RTC 凭证接入

## 概述

CallKit 默认通过传入的 IM SDK 客户端获取 RTC 入会信息和 RTC UID 映射：

- `chatClient.getRTCTokenInfo({ channelName })`：获取声网 App ID、RTC Token 和本端 RTC UID；
- `chatClient.getUserIdsWithRTCUids(rtcUids)`：将远端 RTC UID 映射为 IM `userId`，用于显示用户昵称和头像等业务信息。

如果应用使用自有的声网项目，或希望由业务服务端签发 RTC Token、维护 RTC UID 与 IM 用户 ID 的关系，可以为 `CallKit` 传入 `rtcProvider`。`rtcProvider` 的类型为公开导出的 `CallKitRTCProvider`。

```tsx
import type { CallKitRTCProvider, RTCTokenInfo, RTCUidUserIdMap } from 'easemob-chat-uikit';
```

> **注意：** 这是 Web CallKit 的组件级配置。请勿使用移动端文档中的 `CallTokenProvider`、`getAppId`、`getRTCToken` 或 `getRelations`：这些都不是本组件库提供的 API。也无需在业务代码中手动创建 `CallService`。

## API

```ts
interface RTCTokenInfo {
  appId: string;
  rtcToken: string;
  rtcUid: number;
}

type RTCUidUserIdMap = Record<string, string>;

interface CallKitRTCProvider {
  getRTCTokenInfo?: (params: { channelName: string }) => Promise<RTCTokenInfo>;
  getUserIdsWithRTCUids?: (rtcUids: number[]) => Promise<RTCUidUserIdMap>;
}
```

两个方法都是可选的，可以只替换其中一个数据来源：

| 方法 | 用途 | 未提供时的行为 |
| --- | --- | --- |
| `getRTCTokenInfo` | 为当前通话频道返回 RTC 入会凭证。 | 调用 `chatClient.getRTCTokenInfo({ channelName })`。 |
| `getUserIdsWithRTCUids` | 将远端 RTC UID 批量映射为 IM `userId`。 | 调用 `chatClient.getUserIdsWithRTCUids(rtcUids)`。 |

当某个 provider 方法已提供时，CallKit 会优先使用它，而不会再调用该方法对应的 IM SDK 接口。`getRTCTokenInfo` 抛出异常、返回空值或返回不合法数据时，通话无法发起或加入频道；`getUserIdsWithRTCUids` 失败时，远端 UID 无法通过 IM SDK 再次查询（仅一对一通话会尝试使用邀请中的对端用户 ID 兜底）。因此请在服务端响应和前端转换处完成必要的校验与错误处理。

### `getRTCTokenInfo`

CallKit 在发起通话或接听后加入频道前调用该方法，并将实际的 `channelName` 传入。业务服务端应按这个频道名和当前 IM 用户签发凭证。

返回值要求如下：

- `appId`：非空字符串，且必须是签发该 `rtcToken` 的声网项目 App ID。
- `rtcUid`：有限数字，并且必须与 Token 中的 UID 一致。对于同一 IM 用户，建议在业务侧保持稳定的 RTC UID 映射。
- `rtcToken`：当 `useRTCToken`（默认 `true`）开启时必须为非空字符串；当 `useRTCToken={false}` 时可以为空，CallKit 会以 `null` Token 加入频道。仅在声网项目允许不校验 Token 的场景使用后者。

当前 provider 返回值中不包含 `expiration` 字段，CallKit 也不会依据该字段自动续期。请保证服务端签发的 Token 在预期通话时长内有效；如需 Token 续期，请结合实际 RTC 生命周期和声网 SDK 的续期能力在应用侧设计相应流程。

### `getUserIdsWithRTCUids`

远端用户进入频道后，CallKit 会按需调用该方法，以便把 RTC 层的 UID 关联到 IM 用户资料。返回值的键是 RTC UID 的字符串形式，值是对应的 IM `userId`：

```ts
{
  '10001': 'alice',
  '10002': 'bob',
}
```

接口参数是 UID 数组，服务端可以批量查询和返回映射。缺少映射会导致对应远端用户无法关联到业务用户资料；在一对一通话中，CallKit 会尽力使用邀请中的对端用户 ID 作为兜底，但多人通话应始终返回完整映射。

## 接入步骤

### 1. 在服务端提供 RTC 数据接口

不要在浏览器中生成声网 Token，也不要将声网 App Certificate 暴露给前端。建议让前端只请求业务服务端：

```text
POST /api/rtc/token
{ "userId": "alice", "channelName": "call_channel" }

=> { "appId": "your-agora-app-id", "rtcToken": "...", "rtcUid": 10001 }

POST /api/rtc/user-ids
{ "rtcUids": [10001, 10002] }

=> { "10001": "alice", "10002": "bob" }
```

服务端需要验证当前请求者的身份和通话权限，并确保：Token 中的频道、UID 与返回的 `channelName`、`rtcUid` 一致；UID 映射只返回调用方有权获知的用户数据。

### 2. 创建 `CallKitRTCProvider`

下面示例假定应用已拥有可信的业务登录态，`currentUserId` 是当前已登录的 IM 用户 ID。接口字段名可按服务端实际响应调整，但最终必须转换为 `RTCTokenInfo` 和 `RTCUidUserIdMap`。

```tsx
import React from 'react';
import type { CallKitRTCProvider, RTCTokenInfo, RTCUidUserIdMap } from 'easemob-chat-uikit';

function useCallKitRTCProvider(currentUserId: string): CallKitRTCProvider {
  return React.useMemo(
    () => ({
      async getRTCTokenInfo({ channelName }): Promise<RTCTokenInfo> {
        const response = await fetch('/api/rtc/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: currentUserId, channelName }),
        });

        if (!response.ok) {
          throw new Error(`获取 RTC Token 失败：${response.status}`);
        }

        const data = (await response.json()) as RTCTokenInfo;
        if (!data.appId || !Number.isFinite(data.rtcUid) || !data.rtcToken) {
          throw new Error('RTC Token 接口返回的数据不完整');
        }

        return {
          appId: data.appId,
          rtcToken: data.rtcToken,
          rtcUid: data.rtcUid,
        };
      },

      async getUserIdsWithRTCUids(rtcUids): Promise<RTCUidUserIdMap> {
        const response = await fetch('/api/rtc/user-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rtcUids }),
        });

        if (!response.ok) {
          throw new Error(`查询 RTC UID 映射失败：${response.status}`);
        }

        return (await response.json()) as RTCUidUserIdMap;
      },
    }),
    [currentUserId],
  );
}
```

如果你的 IM 服务仍负责 UID 映射，只需提供 `getRTCTokenInfo`；省略 `getUserIdsWithRTCUids` 后，CallKit 会继续使用 IM SDK 的映射接口。

### 3. 将 provider 传给 `CallKit`

`CallKit` 必须使用 `Provider` 创建的 IM 客户端。下面通过公开导出的 `RootContext` 获取该客户端，避免依赖仓库内部模块路径。

```tsx
import React from 'react';
import { CallKit, Provider, RootContext } from 'easemob-chat-uikit';
import type { CallKitRef } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

function CallKitLayer({ currentUserId }: { currentUserId: string }) {
  const { client } = React.useContext(RootContext);
  const callKitRef = React.useRef<CallKitRef>(null);
  const rtcProvider = useCallKitRTCProvider(currentUserId);

  return (
    <CallKit
      ref={callKitRef}
      chatClient={client}
      rtcProvider={rtcProvider}
      onCallError={error => {
        console.error('CallKit 通话失败', error);
      }}
    />
  );
}

export default function App() {
  const currentUserId = 'alice';

  return (
    <Provider
      initConfig={{
        appKey: 'your-org#your-app',
        userId: currentUserId,
        token: 'your-im-token',
      }}
    >
      <CallKitLayer currentUserId={currentUserId} />
    </Provider>
  );
}
```

`Provider` 会使用 `initConfig.userId` 和 `initConfig.token` 登录 IM；这份 IM Token 与 RTC Token 是两套独立凭证。CallKit 在需要加入 RTC 频道时才会调用 `rtcProvider`，无需在登录成功后手动预取或初始化 RTC 服务。

### 4. 发起通话

自定义 RTC provider 不改变 CallKit 的通话 API。通过组件 ref 发起一对一通话即可：

```tsx
await callKitRef.current?.startSingleCall({
  to: 'bob',
  callType: 'video',
  msg: '邀请你进行视频通话',
});
```

发起方会使用新建的频道名调用 `getRTCTokenInfo`；被叫方接受邀请并加入同一频道前也会调用该方法。因此，服务端必须能够针对任意有效频道为每位参与者返回相匹配的 App ID、Token 和 UID。

## 常见问题

| 现象 | 排查方向 |
| --- | --- |
| 收到 `Valid RTC token info is unavailable` 错误 | 检查 `getRTCTokenInfo` 是否成功返回非空 `appId`、有限数字 `rtcUid`，以及在 `useRTCToken` 为 `true` 时返回非空 `rtcToken`。 |
| 能发送通话邀请但无法进入频道 | 确认 Token 的 App ID、频道名和 UID 与返回数据一致，并检查 Token 是否已过期。 |
| 多人通话中远端用户只有 UID，昵称或头像没有正确显示 | 实现 `getUserIdsWithRTCUids`，并确保返回对象以 UID 的字符串作为键、IM `userId` 作为值。 |
| 配置了 provider 后仍然请求 IM SDK 的 RTC 接口 | 确认传给 `CallKit` 的 `rtcProvider` 中包含对应方法；只配置一个方法时，另一个方法仍会按设计回退到 IM SDK。 |

## RTC 数据来源模式

CallKit 以传入的 `chatClient` 为基础工作。未配置 `rtcProvider` 时，UIKit 会通过该 IM SDK 客户端自动获取 RTC 数据；需要使用自有声网项目或业务服务端 Token 时，再按需覆写相应方法。

| 配置项 | 默认 UIKit / IM SDK 模式 | 自定义 `CallKitRTCProvider` 模式 |
| --- | --- | --- |
| 适用场景 | 使用环信 IM SDK 提供的 RTC 凭证与 UID 映射。 | 使用自有声网项目，或由业务服务端签发 RTC Token、维护 UID 映射。 |
| 组件配置 | `<CallKit chatClient={client} />` | `<CallKit chatClient={client} rtcProvider={rtcProvider} />` |
| 入会凭证 | UIKit 调用 `chatClient.getRTCTokenInfo({ channelName })`。 | `rtcProvider.getRTCTokenInfo({ channelName })` 返回 `{ appId, rtcToken, rtcUid }`。 |
| UID → IM 用户 ID | UIKit 调用 `chatClient.getUserIdsWithRTCUids(rtcUids)`。 | `rtcProvider.getUserIdsWithRTCUids(rtcUids)` 返回 `{ [rtcUid]: userId }`。 |
| 需要自行维护的数据 | 无。 | 声网 App ID、RTC Token、RTC UID，以及 RTC UID 与 IM `userId` 的映射。 |

`CallKitRTCProvider` 的两个方法可独立配置。例如，只提供 `getRTCTokenInfo` 时，Token 由业务服务端获取，而 UID 映射仍由 IM SDK 获取；未提供的方法始终按默认模式回退到 `chatClient`。
