# UIKitProvider

`easemob-chat-uikit` 提供 `UIKitProvider`（也称为 `Provider`）组件来管理数据。`UIKitProvider` 不渲染任何 UI，只用来为其他组件提供全局的 context，它自动监听 SDK 事件，在组件树中向下传递数据来驱动组件更新。UIKit 中其他组件必须用 `UIKitProvider` 包裹。

## 使用示例

### 基础使用

```jsx
import React from 'react';
import { Provider } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';
import ChatApp from './ChatApp';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider
    initConfig={{
      appKey: 'your app key',
      userId: 'user123',
      token: 'user_token', // SDK 5 仅支持 token 登录
    }}
    providers={{
      userInfo: async userIds => {
        return userIds.map(userId => ({
          userId,
          nickname: userId,
          avatarUrl: `https://example.com/avatar/${userId}.png`,
        }));
      },
    }}
  >
    <ChatApp />
  </Provider>,
);
```

### 完整配置示例

```jsx
import React from 'react';
import { Provider } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider
    initConfig={{
      appKey: 'your app key',
      userId: 'user123',
      token: 'user_token',
      translationTargetLanguage: 'zh', // 翻译目标语言
      useUserInfo: true, // 是否使用用户信息
      maxMessages: 200, // 单个会话显示最大消息数
      countMemberJoinToUnread: false, // 聊天室成员加入消息是否计入未读数
    }}
    providers={{
      userInfo: async userIds => {
        return userIds.map(userId => ({
          userId,
          nickname: userId,
          avatarUrl: `https://example.com/avatar/${userId}.png`,
        }));
      },
      groupInfo: async groupIds => {
        return groupIds.map(groupId => ({
          groupId,
          groupName: groupId,
          groupAvatar: `https://example.com/group/${groupId}.png`,
        }));
      },
    }}
    theme={{
      mode: 'light', // 'light' | 'dark'
      primaryColor: '#00CE76', // 主题色（十六进制颜色值或色相值 0-360）
      avatarShape: 'circle', // 'circle' | 'square'
      bubbleShape: 'round', // 'round' | 'square'
      componentsShape: 'round', // 'round' | 'square'
      ripple: true, // 是否显示涟漪效果
    }}
    local={{
      fallbackLng: 'zh',
      lng: 'zh',
      resources: {
        zh: {
          translation: {
            conversationTitle: '会话列表',
            deleteCvs: '删除会话',
            // 更多翻译...
          },
        },
      },
    }}
    features={{
      conversationList: {
        search: true,
        item: {
          moreAction: true,
          deleteConversation: true,
          pinConversation: true,
          muteConversation: true,
          presence: true,
        },
      },
      chat: {
        header: {
          threadList: true,
          moreAction: true,
          clearMessage: true,
          deleteConversation: false,
          audioCall: true,
          videoCall: true,
          pinMessage: true,
        },
        message: {
          status: true,
          thread: true,
          reaction: true,
          moreAction: true,
          reply: true,
          delete: true,
          recall: true,
          translate: true,
          edit: true,
          select: true,
          forward: true,
          report: true,
          pin: true,
        },
        messageInput: {
          mention: true,
          typing: true,
          record: true,
          emoji: true,
          moreAction: true,
          file: true,
          picture: true,
          video: true,
          contactCard: true,
        },
      },
      chatroom: {
        messageInput: {
          emoji: true,
          gift: true,
        },
      },
    }}
    reactionConfig={{
      map: {
        emoji_1: <img src="customIcon1.png" alt="emoji_1" />,
        emoji_2: <img src="customIcon2.png" alt="emoji_2" />,
      },
    }}
    presenceMap={{
      Online: '/path/to/online.png',
      Offline: '/path/to/offline.png',
      Away: '/path/to/away.png',
      Busy: '/path/to/busy.png',
      'Do Not Disturb': '/path/to/dnd.png',
      Custom: '/path/to/custom.png',
    }}
  >
    <ChatApp />
  </Provider>,
);
```

## Client 与登录时序

`client` 已创建、IM 已连接、联系人/会话已同步是三个不同阶段：

1. `Provider` 首次渲染时同步执行 `ChatClient.init`，`RootContext.client` 立即可用。
2. `Provider` 挂载后的 effect 才把实例写入 `rootStore.client`。
3. 如果配置了 `userId + token`，Provider 随后调用 `client.login({ userId, token })`。
4. SDK 触发 `onConnected` 后，`rootStore.loginState` 才变为 `true`。
5. `onSyncDataFinished` 后，联系人、群组和会话等同步数据才完整。

因此，不要在 Provider 子组件的首次 render 中直接访问 `rootStore.client`：

```tsx
// ❌ 首次 render 时 rootStore.client 仍可能是空对象
const userId = rootStore.client.getCurrentUserId();
```

React 组件中优先通过 `RootContext` 获取 client：

```tsx
import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { RootContext, rootStore } from 'easemob-chat-uikit';

const ClientPanel = observer(() => {
  const { client, initConfig } = useContext(RootContext);

  // client 首次 render 即可用；登录前 getCurrentUserId() 返回 null
  const currentUserId = client.getCurrentUserId();

  const loadContacts = async () => {
    if (!rootStore.loginState) return;
    await client.contactManager.getContacts();
  };

  return (
    <button disabled={!rootStore.loginState} onClick={loadContacts}>
      {currentUserId || initConfig.userId || '未登录'}
    </button>
  );
});
```

推荐规则：

- React render、effect 和点击回调：优先使用 `RootContext.client`。
- 登录前已知的业务用户 ID：使用业务登录状态或 `RootContext.initConfig.userId`。
- 登录后的 SDK 当前用户：使用 `client.getCurrentUserId()`；未登录时返回 `null`。
- 需要调用联网 API：等待 `rootStore.loginState === true`。
- 需要联系人、群组或会话完整数据：还要等待 SDK 同步完成。
- `rootStore.client` 仅适合确认 Provider 已挂载后的 store/action 内部调用，不建议作为业务组件的 client 来源。
- 不要使用 SDK 4 的 `client.user`、`client.open()`、`updateUserInfo()` 等接口。

## 自动登录

如果初始化时设置了 `userId` 和 `token`，UIKit 会在 Provider 挂载后自动登录。SDK 5 不支持密码登录；Provider 卸载也不会自动登出，需要业务在退出登录时显式调用 `client.logout()`。

```jsx
<Provider
  initConfig={{
    appKey: 'your app key',
    userId: 'user123',
    token: 'user_token',
  }}
>
  <ChatApp />
</Provider>
```

如果你想自己控制登录和登出，只向 Provider 传入 `appKey`，然后从 `RootContext` 获取客户端：

```jsx
import React, { useContext } from 'react';
import { Provider, RootContext } from 'easemob-chat-uikit';

const ChatApp = () => {
  const { client } = useContext(RootContext);

  const login = async () => {
    await client.login({
      userId: 'user123',
      token: 'user_token',
    });
  };

  const logout = async () => {
    await client.logout();
  };

  return (
    <>
      <button onClick={login}>登录</button>
      <button onClick={logout}>退出</button>
    </>
  );
};

<Provider initConfig={{ appKey: 'your app key' }}>
  <ChatApp />
</Provider>;
```

## UIKitProvider props 概览

### providers

业务数据提供器分组入口。新接入推荐优先使用该字段，而不是把展示数据能力散落在单独 props 上。

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `userInfo` | `(userIds: string[]) => Promise<AppUserInfo[] \| Record<string, AppUserInfo>>` | 批量提供用户昵称、头像等展示信息 |
| `groupInfo` | `(groupIds: string[]) => Promise<GroupInfo[] \| Record<string, GroupInfo>>` | 批量提供群名称、群头像等展示信息 |

兼容性说明：

- `userInfoProvider` 仍然可用，但推荐迁移到 `providers.userInfo`
- 现阶段 `groupInfo` 主要用于统一业务侧群展示信息和 CallKit 等场景

### initConfig

初始化配置，包含 SDK 连接和 UIKit 行为相关的配置。

| 参数 | 类型 | 默认值 | 描述 |
| :-- | :-- | :-- | :-- |
| `appKey` | `string` | - | 应用的 App Key；与 `appId` 必须且只能传一个 |
| `appId` | `string` | - | 应用的 App ID；与 `appKey` 必须且只能传一个。App ID 模式使用 DNS 服务发现，不支持同时配置 `restUrl` 或 `msyncUrl` |
| `userId` | `string` | - | 用户 ID，如果提供会自动登录 |
| `token` | `string` | - | 用户 Token，与 `userId` 一起使用进行自动登录（推荐） |
| `password` | `string` | - | 兼容字段；SDK 5 不支持密码登录，传入时会触发登录错误 |
| `translationTargetLanguage` | `string` | - | 翻译目标语言，如 'zh'、'en' 等 |
| `useUserInfo` | `boolean` | - | 是否使用用户信息，启用后会自动获取用户信息 |
| `msyncUrl` | `string` | - | 自定义消息同步服务地址 |
| `restUrl` | `string` | - | 自定义 REST API 服务地址 |
| `isHttpDNS` | `boolean` | `true` | 是否使用 HTTP DNS |
| `useReplacedMessageContents` | `boolean` | - | 是否使用替换后的消息内容 |
| `deviceId` | `string` | - | 设备 ID |
| `maxMessages` | `number` | `200` | 单个会话显示最大消息数，超出后会自动清除，清除的消息可通过拉取更多消息获取 |
| `isFixedDeviceId` | `boolean` | `true` | 是否固定设备 ID |
| `useOwnUploadFun` | `boolean` | `false` | 是否使用自定义上传函数 |
| `countMemberJoinToUnread` | `boolean` | `false` | 聊天室成员加入消息是否计入未读数。`false` 表示不计入，`true` 表示计入 |

### local

国际化配置参数，你可以在初始化时配置 `i18next` 的参数。

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `fallbackLng` | `string` | 回退语言，当当前语言资源不存在时使用 |
| `lng` | `string` | 当前语言代码，如 'zh'、'en' 等 |
| `resources` | `object` | 翻译资源对象，格式为 `{ [language]: { translation: { [key]: string } } }` |

**使用示例：**

```jsx
<Provider
  local={{
    fallbackLng: 'zh',
    lng: 'zh',
    resources: {
      zh: {
        translation: {
          conversationTitle: '会话列表',
          deleteCvs: '删除会话',
          send: '发送',
          // 更多翻译...
        },
      },
      en: {
        translation: {
          conversationTitle: 'Conversation List',
          deleteCvs: 'Delete Conversation',
          send: 'Send',
        },
      },
    },
  }}
>
  <ChatApp />
</Provider>
```

所有 UI 文本可以在 [这里](https://github.com/easemob/Easemob-UIKit-web/tree/dev/local) 查看。

### features

全局配置你需要的功能，UIKit 默认展示全部的功能。如果在组件中也配置了需要的功能，会以组件中的配置为准。

#### conversationList

会话列表功能配置。

| 参数                      | 类型      | 默认值 | 描述                 |
| :------------------------ | :-------- | :----- | :------------------- |
| `search`                  | `boolean` | `true` | 是否显示搜索栏       |
| `item.moreAction`         | `boolean` | `true` | 是否显示更多操作菜单 |
| `item.deleteConversation` | `boolean` | `true` | 是否允许删除会话     |
| `item.pinConversation`    | `boolean` | `true` | 是否允许置顶会话     |
| `item.muteConversation`   | `boolean` | `true` | 是否允许免打扰会话   |
| `item.presence`           | `boolean` | `true` | 是否显示在线状态     |

#### chat

聊天页面功能配置。

**header（标题栏）**

| 参数                 | 类型      | 默认值 | 描述                 |
| :------------------- | :-------- | :----- | :------------------- |
| `threadList`         | `boolean` | `true` | 是否显示话题列表     |
| `moreAction`         | `boolean` | `true` | 是否显示更多操作菜单 |
| `clearMessage`       | `boolean` | `true` | 是否允许清除消息     |
| `deleteConversation` | `boolean` | `true` | 是否允许删除会话     |
| `audioCall`          | `boolean` | `true` | 是否显示语音通话按钮 |
| `videoCall`          | `boolean` | `true` | 是否显示视频通话按钮 |
| `pinMessage`         | `boolean` | `true` | 是否允许置顶消息     |

**message（消息）**

| 参数         | 类型      | 默认值 | 描述                                       |
| :----------- | :-------- | :----- | :----------------------------------------- |
| `status`     | `boolean` | `true` | 是否显示消息状态（已发送、已送达、已读等） |
| `thread`     | `boolean` | `true` | 是否支持话题功能                           |
| `reaction`   | `boolean` | `true` | 是否支持消息表情回复                       |
| `moreAction` | `boolean` | `true` | 是否显示更多操作菜单                       |
| `reply`      | `boolean` | `true` | 是否支持回复消息                           |
| `delete`     | `boolean` | `true` | 是否允许删除消息                           |
| `recall`     | `boolean` | `true` | 是否允许撤回消息                           |
| `translate`  | `boolean` | `true` | 是否支持翻译消息                           |
| `edit`       | `boolean` | `true` | 是否允许编辑消息                           |
| `select`     | `boolean` | `true` | 是否支持多选消息                           |
| `forward`    | `boolean` | `true` | 是否支持转发消息                           |
| `report`     | `boolean` | `true` | 是否支持举报消息                           |
| `pin`        | `boolean` | `true` | 是否允许置顶消息                           |

**messageInput（消息输入框）**

| 参数          | 类型      | 默认值 | 描述                 |
| :------------ | :-------- | :----- | :------------------- |
| `mention`     | `boolean` | `true` | 是否支持 @ 提及功能  |
| `typing`      | `boolean` | `true` | 是否显示正在输入状态 |
| `record`      | `boolean` | `true` | 是否支持语音录制     |
| `emoji`       | `boolean` | `true` | 是否显示表情按钮     |
| `moreAction`  | `boolean` | `true` | 是否显示更多操作按钮 |
| `file`        | `boolean` | `true` | 是否支持发送文件     |
| `picture`     | `boolean` | `true` | 是否支持发送图片     |
| `video`       | `boolean` | `true` | 是否支持发送视频     |
| `contactCard` | `boolean` | `true` | 是否支持发送名片     |

#### chatroom

聊天室功能配置。

| 参数                 | 类型      | 默认值 | 描述             |
| :------------------- | :-------- | :----- | :--------------- |
| `messageInput.emoji` | `boolean` | `true` | 是否显示表情按钮 |
| `messageInput.gift`  | `boolean` | `true` | 是否显示礼物按钮 |

**使用示例：**

```jsx
<Provider
  features={{
    conversationList: {
      search: false, // 隐藏搜索栏
      item: {
        moreAction: false, // 隐藏更多操作菜单
      },
    },
    chat: {
      header: {
        audioCall: false, // 隐藏语音通话按钮
        videoCall: false, // 隐藏视频通话按钮
      },
      message: {
        translate: false, // 禁用翻译功能
        edit: false, // 禁用编辑功能
      },
      messageInput: {
        mention: false, // 禁用 @ 提及功能
        record: false, // 禁用语音录制
      },
    },
    chatroom: {
      messageInput: {
        emoji: false, // 隐藏表情按钮
        gift: false, // 隐藏礼物按钮
      },
    },
  }}
>
  <ChatApp />
</Provider>
```

### reactionConfig

全局配置消息表情回复功能的表情，如果在消息组件中也设置了这个参数，会以消息组件中设置的为准。

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `map` | `object` | 表情映射对象，格式为 `{ [key]: HTMLImageElement }`，key 为表情标识，value 为图片元素 |

**使用示例：**

```jsx
<Provider
  reactionConfig={{
    map: {
      emoji_1: <img src="customIcon1.png" alt="emoji_1" />,
      emoji_2: <img src="customIcon2.png" alt="emoji_2" />,
      emoji_3: <img src="customIcon3.png" alt="emoji_3" />,
    },
  }}
>
  <ChatApp />
</Provider>
```

### theme

主题配置，用于自定义 UIKit 的外观样式。

| 参数 | 类型 | 默认值 | 描述 |
| :-- | :-- | :-- | :-- |
| `mode` | `'light' \| 'dark'` | `'light'` | 主题模式，亮色或暗色 |
| `primaryColor` | `string \| number` | - | 主题色，可以是十六进制颜色值（如 `'#00CE76'`）或色相值（0-360 的数字） |
| `avatarShape` | `'circle' \| 'square'` | - | 头像形状，圆形或方形 |
| `bubbleShape` | `'round' \| 'square'` | - | 消息气泡形状，圆角或方形 |
| `componentsShape` | `'round' \| 'square'` | - | 组件形状，圆角或方形 |
| `ripple` | `boolean` | - | 是否显示涟漪效果 |

**使用示例：**

```jsx
<Provider
  theme={{
    mode: 'dark', // 暗色主题
    primaryColor: '#00CE76', // 主题色（十六进制）
    // 或 primaryColor: 203, // 主题色（色相值 0-360）
    avatarShape: 'circle', // 圆形头像
    bubbleShape: 'round', // 圆角气泡
    componentsShape: 'round', // 圆角组件
    ripple: true, // 显示涟漪效果
  }}
>
  <ChatApp />
</Provider>
```

### presenceMap

在线状态图标映射，用于自定义在线状态的显示图标。

| 参数             | 类型                         | 描述           |
| :--------------- | :--------------------------- | :------------- |
| `Online`         | `string \| HTMLImageElement` | 在线状态图标   |
| `Offline`        | `string \| HTMLImageElement` | 离线状态图标   |
| `Away`           | `string \| HTMLImageElement` | 离开状态图标   |
| `Busy`           | `string \| HTMLImageElement` | 忙碌状态图标   |
| `Do Not Disturb` | `string \| HTMLImageElement` | 勿扰状态图标   |
| `Custom`         | `string \| HTMLImageElement` | 自定义状态图标 |

**使用示例：**

```jsx
import OnlineIcon from './assets/online.png';
import OfflineIcon from './assets/offline.png';

<Provider
  presenceMap={{
    Online: OnlineIcon, // 使用图片路径或图片元素
    Offline: OfflineIcon,
    Away: '/path/to/away.png',
    Busy: '/path/to/busy.png',
    'Do Not Disturb': '/path/to/dnd.png',
    Custom: '/path/to/custom.png',
  }}
>
  <ChatApp />
</Provider>;
```

## 完整配置示例

```jsx
import React from 'react';
import { Provider } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const App = () => {
  return (
    <Provider
      initConfig={{
        appKey: 'your app key',
        userId: 'user123',
        token: 'user_token',
        translationTargetLanguage: 'zh',
        useUserInfo: true,
        maxMessages: 200,
        countMemberJoinToUnread: false,
      }}
      theme={{
        mode: 'light',
        primaryColor: '#00CE76',
        avatarShape: 'circle',
        bubbleShape: 'round',
        componentsShape: 'round',
        ripple: true,
      }}
      local={{
        fallbackLng: 'zh',
        lng: 'zh',
        resources: {
          zh: {
            translation: {
              conversationTitle: '会话列表',
              deleteCvs: '删除会话',
            },
          },
        },
      }}
      features={{
        conversationList: {
          search: true,
          item: {
            moreAction: true,
            deleteConversation: true,
            pinConversation: true,
            muteConversation: true,
            presence: true,
          },
        },
        chat: {
          header: {
            threadList: true,
            moreAction: true,
            clearMessage: true,
            deleteConversation: false,
            audioCall: true,
            videoCall: true,
            pinMessage: true,
          },
          message: {
            status: true,
            thread: true,
            reaction: true,
            moreAction: true,
            reply: true,
            delete: true,
            recall: true,
            translate: true,
            edit: true,
            select: true,
            forward: true,
            report: true,
            pin: true,
          },
          messageInput: {
            mention: true,
            typing: true,
            record: true,
            emoji: true,
            moreAction: true,
            file: true,
            picture: true,
            video: true,
            contactCard: true,
          },
        },
        chatroom: {
          messageInput: {
            emoji: true,
            gift: true,
          },
        },
      }}
      reactionConfig={{
        map: {
          emoji_1: <img src="customIcon1.png" alt="emoji_1" />,
          emoji_2: <img src="customIcon2.png" alt="emoji_2" />,
        },
      }}
      presenceMap={{
        Online: '/path/to/online.png',
        Offline: '/path/to/offline.png',
      }}
    >
      {/* 你的应用组件 */}
    </Provider>
  );
};

export default App;
```

## 注意事项

1. **自动登录**：提供 `userId` 和 `token` 后 UIKit 会自动登录。SDK 5 不支持密码登录；退出时需显式调用 `client.logout()`。

2. **功能配置优先级**：组件级别的功能配置会覆盖全局配置。

3. **主题色格式**：`primaryColor` 支持两种格式：

   - 十六进制颜色值：`'#00CE76'`
   - 色相值（0-360）：`203`

4. **国际化资源**：所有 UI 文本的 key 可以在 [这里](https://github.com/easemob/Easemob-UIKit-web/tree/dev/local) 查看。

5. **聊天室未读数**：`countMemberJoinToUnread` 控制聊天室成员加入消息是否计入未读数。设置为 `false` 时，加入消息不会增加未读数；设置为 `true` 时，加入消息会增加未读数。
