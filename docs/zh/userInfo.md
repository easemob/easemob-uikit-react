# 头像昵称

## 联系人

UIKit 在不做任何设置直接使用时，默认展示的是用户的 userId，头像默认是 userId 前两个字母。UIKit 提供三种方式来设置用户的头像和昵称：

- 第一种，UIKit 内部默认会使用 SDK 用户属性功能来获取头像昵称。当用户首次登录可以调用 SDK API 来设置自己的头像昵称。

示例代码：

```javascript
rootStore.client.updateUserInfo({
  nickname: 'nickname',
  avatarUrl: 'https://example.com/image',
});
```

这样在联系人列表、会话列表、会话、群成员等位置， UIKit 内部会自动去获取其他用户的个人信息来展示出头像昵称。

- 第二种，如果不想把头像昵称的信息放在环信的服务器，推荐在 Provider 上配置 `providers.userInfo`。UIKit 会在需要展示用户信息时自动传入 userId 列表，你只需要返回用户信息，不需要关心联系人、会话、群成员、消息等组件的触发时机。

```tsx
<UIKitProvider
  initConfig={{
    appKey,
    userId,
    token,
    useUserInfo: false, // 关闭 SDK 用户属性
  }}
  providers={{
    userInfo: async userIds => {
      const users = await getUserInfoFromServer(userIds);
      return users.map(user => ({
        userId: user.id,
        nickname: user.name,
        avatarUrl: user.avatar,
      }));
    },
  }}
>
  <ChatApp />
</UIKitProvider>
```

`providers.userInfo` 也支持返回以 userId 为 key 的对象：

```tsx
providers={{
  userInfo: async userIds => {
    return {
      zd1: {
        userId: 'zd1',
        nickname: '张东1',
        avatarUrl: 'https://example.com/zd1.png',
      },
    };
  },
}}
```

为了兼容老版本，`userInfoProvider` 仍然保留，但新代码推荐统一迁移到 `providers.userInfo`。

- 第三种，为了兼容老版本，仍然可以手动调用 `setAppUserInfo` 设置 UIKit 本地展示缓存。

```tsx
rootStore.addressStore.setAppUserInfo({
  zd1: {
    userId: 'zd1',
    nickname: '张东1',
    avatarUrl: 'https://example.com/zd1.png',
  },
});
```

老版本字段 `avatarurl` 仍然兼容，但新代码推荐使用 SDK5 风格的 `avatarUrl`。

如果你完全不想使用 SDK 用户属性，只使用业务方用户资料，可以这样配置：

```tsx

// ...
<UIKitProvider initConfig={{
    useUserInfo: false // 关闭自动使用用户属性
}}>
    <ChatApp>
</UIKitProvider>

```

在群会话中， UIKit 内部发消息时会在消息扩展里携带上本人的头像昵称信息，收到消息的人会根据消息中的信息展示头像昵称， 同时也会把群成员的信息存储到 appUsersInfo 中，当要查看群成员列表时，会首先在 appUsersInfo 中取个人信息，你需要看群成员有哪些人的信息没有在 appUsersInfo 中，然后再去获取这些人的个人信息设置到 appUsersInfo 中。

## 群头像

如果业务侧维护群名称、群头像，推荐通过 `providers.groupInfo` 统一提供：

```tsx
<UIKitProvider
  initConfig={{ appKey, userId, token }}
  providers={{
    groupInfo: async groupIds => {
      const groups = await getGroupInfoFromServer(groupIds);
      return groups.map(group => ({
        groupId: group.id,
        groupName: group.name,
        groupAvatar: group.avatar,
      }));
    },
  }}
>
  <ChatApp />
</UIKitProvider>
```

UIKit 内部没有获取群头像，需要用户自己设置到 UIKit 内部，形式和设置个人信息类似

示例代码：

```jsx
useEffect(() => {
  if (rootStore.loginState) {
    const groupIds =
      rootStore.addressStore.groups
        .filter(item => !item.avatarUrl)
        .map(item => {
          return item.groupid;
        }) || [];
    // 获取群组头像
    getGroupAvatar(groupIds).then(res => {
      // res: {[groupId]: 'avatarurl'}
      for (let groupId in res) {
        rootStore.addressStore.updateGroupAvatar(groupId, res[groupId]);
      }
    });
  }
}, [rootStore.loginState, rootStore.addressStore.groups.length]);
```
