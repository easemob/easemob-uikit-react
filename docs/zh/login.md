# 登录

如果初始化时已经设置了 userId 和 token，Chat UIKit 当 Provider 加载完会自动登录，当 Provider 被卸载时会自动登出。

```javascript
import { UIKitProvider } from 'easemob-chat-uikit';

const App = () => {
  return (
    <UIKitProvider
      initConfig={{
        appKey: '',
        userId: '',
        token: '',
      }}
    ></UIKitProvider>
  );
};
```

如果你想自己控制何时登录登出，你可以获取 Chat SDK connection 实例，然后使用 SDK 的 API 进行登录登出。

```javascript
import { useClient } from 'easemob-chat-uikit';

const ChatApp = () => {
  const client = useClient();
  const login = () => {
    client.open({
      user: 'userId',
      token: 'chat token',
    });
  };
  return <button onClick={login}>Login</button>;
};
```
