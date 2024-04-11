# 头像昵称

## 联系人

UIKit 在不做任何设置直接使用时，默认展示的是用户的 userId, 头像默认是 userId 前两个字母。UIKit 提供两种方式来设置用户的头像和昵称：

- 第一种， UIKit 内部默认会使用用户属性功能来获取头像昵称，当用户首次登录可以调用 SDK API 来设置自己的头像昵称

示例代码：

```javascript
rootStore.client.updateUserInfo({
  nickname: 'nickname',
  avatarurl: 'https://example.com/image',
});
```

这样在联系人列表、会话列表、会话、群成员等位置， UIKit 内部会自动去获取其他用户的个人信息来展示出头像昵称。

- 第二种，如果不想把头像昵称的信息放在环信的服务器，在初始化时需要配置不使用用户属性功能

```javascript

// ...
<UIKitProvider initConfig={{
    useUserInfo: false // 关闭自动使用用户属性
}}>
    <ChatApp>
</UIKitProvider>

```

然后监听联系人数据，自己获取每个用户的头像昵称之后设置到 UIKit 中：

示例代码：

```jsx
import { useEffect } from 'react';

useEffect(() => {
  if (rootStore.loginState) {
    // 刷选出来没有用户信息的用户id
    const userIds = rootStore.addressStore.contacts
      .filter(item => !rootStore.addressStore.appUsersInfo[item.id])
      .map(item => {
        return item.id;
      });
    // 从自己的服务器获取用户头像昵称
    getUserInfo(userIds).then(usersInfo => {
      //usersInfo: {[userId]: {avatarurl: '', nickname: '', userId: ''}}
      rootStore.addressStore.setAppUserInfo(usersInfo);
    });
  }
}, [rootStore.loginState, rootStore.addressStore.contacts.length]);
```

在群会话中， UIKit 内部发消息时会在消息扩展里携带上本人的头像昵称信息，收到消息的人会根据消息中的信息展示头像昵称， 同时也会把群成员的信息存储到 appUsersInfo 中，当要查看群成员列表时，会首先在 appUsersInfo 中取个人信息，你需要看群成员有哪些人的信息没有在 appUsersInfo 中，然后再去获取这些人的个人信息设置到 appUsersInfo 中。

## 群头像

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
