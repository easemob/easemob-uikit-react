# Login

If the account and token are set during initialization, UIKIt will automatically log in and can listen for login failures in onError

```javascript
import { UIKitProvider } from "agora-chat-uikit";

const App = () => {
  return (
    <UIKitProvider
      initConfig={{
        appKey: "",
        userId: "",
        token: "",
      }}
      onError={(error) => {
        console.log(error);
      }}
    ></UIKitProvider>
  );
};
```

If you want to control when to log in, you can obtain the Chat SDK connection instance and call the methods on the instance to log in.

```javascript
import { useClient } from "agora-chat-uikit";

const ChatApp = () => {
  const client = useClient();
  const login = () => {
    client.open({
      user: "userId",
      agoraToken: "chat token",
    });
  };
  return <button onClick={login}>Login</button>;
};
```
