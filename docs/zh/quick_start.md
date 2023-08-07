# Get Started with Agora Chat UIKit for Web

Instant messaging connects people wherever they are and allows them to communicate with others in real time. With built-in user interfaces (UI) for the conversation list and contact list, the [Agora Chat UI Samples](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web) enables you to quickly embed real-time messaging into your app without requiring extra effort on the UI.

This page shows a sample code to add peer-to-peer messaging into your app by using the Agora Chat UI Samples.

## Understand the tech

The following figure shows the workflow of how clients send and receive peer-to-peer messages:

![agora_chat](https://docs.agora.io/en/assets/images/get-started-sdk-understand-009486abec0cc276183ab535456cf889.png)

1. Clients retrieve a token from your app server.
2. Client A and Client B log in to Agora Chat.
3. Client A sends a message to Client B. The message is sent to the Agora Chat server and the server delivers the message to Client B. When Client B receives the message, the SDK triggers an event. Client B listens for the event and gets the message.

## Prerequisites

In order to follow the procedure in this page, you must have:

- React 16.8.0 or later
- React DOM 16.8.0 or later
- A Windows or macOS computer that has a browser supported by the Agora Chat SDK:
  - Internet Explorer 11 or later
  - Edge 43 or later
  - Firefox 10 or later
  - Chrome 54 or later
  - Safari 11 or later
- An [App Key](./enable#get-the-information-of-the-chat-project).
- A valid [Agora account](https://docs.agora.io/en/video-calling/reference/manage-agora-account/?platform=web#create-an-agora-account).
- A valid [Agora project](https://docs.agora.io/en/video-calling/reference/manage-agora-account/?platform=web#create-an-agora-project) with an App Key.

## Token Generation

This section describes how to register a user at Agora Console and generate a temporary token.

### Register a user

To generate a user ID, do the following:

1. On the **Project Management** page, click **Config** for the project you want to use.

![](https://web-cdn.agora.io/docs-files/1664531061644)

2. On the **Edit Project** page, click **Config** next to **Chat** below **Features**.

![](https://web-cdn.agora.io/docs-files/1664531091562)

3. In the left-navigation pane, select **Operation Management** > **User** and click **Create User**.

![](https://web-cdn.agora.io/docs-files/1664531141100)

4. In the **Create User** dialog box, fill in the **User ID**, **Nickname**, and **Password**, and click **Save** to create a user.

![](https://web-cdn.agora.io/docs-files/1664531162872)

### Generate a user token

To ensure communication security, Agora recommends using tokens to authenticate users logging in to an Agora Chat system.

For testing purposes, Agora Console supports generating Agora chat tokens. To generate an Agora chat token, do the following:

1. On the **Project Management** page, click **Config** for the project you want to use.

![](https://web-cdn.agora.io/docs-files/1664531061644)

2. On the **Edit Project** page, click **Config** next to **Chat** below **Features**.

![](https://web-cdn.agora.io/docs-files/1664531091562)

3. In the **Data Center** section of the **Application Information** page, enter the user ID in the **Chat User Temp Token** box and click **Generate** to generate a token with user privileges.

![](https://web-cdn.agora.io/docs-files/1664531214169)

## Project setup

### Create a Web Chat UIKit project

1. Install a CLI tool.

```
npm install create-react-app
```

2. Create an my-app project.

```
npx create-react-app my-app
cd my-app
```

The project directory is as follows:

```
├── package.json
├── public # The static directory of Webpack.
│ ├── favicon.ico
│ ├── index.html # The default single-page app.
│ └── manifest.json
├── src
│ ├── App.css # The CSS of the app's root component.
│ ├── App.js # The app component code.
│ ├── App.test.js
│ ├── index.css # The style of the startup file.
│ ├── index.js # The startup file.
│ ├── logo.svg
│ └── serviceWorker.js
└── yarn.lock
```

### Install the Web Chat UIKit

- To install the Web Chat UIKit with npm, run the following command:

```
npm install agora-chat-uikit --save
```

- To Install Agora chat UIKit for Web with Yarn, run the following command:

```
yarn add agora-chat-uikit
```

### Build the application using the agora-chat-uikit

Import agora-chat-uikit into your code.

```
// App.js
import React, { Component, useEffect } from 'react';
import { UIKitProvider, Chat, ConversationList, useClient, rootStore } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatApp = () => {
  const client = useClient();
  useEffect(() => {
    client &&
      client
        .open({
          user: '',
          agoraToken: '',
        })
        .then(res => {
          console.log('get token success', res);
          // Creates a conversation.
          rootStore.conversationStore.addConversation({
            chatType: '', // 'singleChat' || 'groupChat'
            conversationId: '', // The user ID of the peer user for one-to-one chats for group ID for group chats.
            name: '', // The nickname of the peer user for one-to-one chats for group name for group chats.
          });
        });
  }, [client]);

  return (
    <div>
      <div>
        <ConversationList />
      </div>
      <div>
        <Chat />
      </div>
    </div>
  );
};

class App extends Component {
  render() {
    return (
      <UIKitProvider
        initConfig={{
          appKey: 'you app key',
        }}
      >
        <ChatApp />
      </UIKitProvider>
    );
  }
}

export default App;
```

### Run the project and send your first message

In your terminal, run the following command to launch the app:

```
npm run start
```

Now, you can see your app in the browser.

![img](https://github.com/easemob/Easemob-UIKit-web/raw/dev/docs/chat.png)

If the default App Key is used, the UIKit allows you to send the text, emoji, image, and voice messages.

**Note**

If a custom App Key is used, no contact is available by default and you need to first [add contacts](https://docs.agora.io/en/agora-chat/client-api/contacts) or [join a group](https://docs.agora.io/en/agora-chat/client-api/chat-group/manage-chat-groups).

## Reference

Agora provides an open-source Web project for Agora Chat UIKit on GitHub. You can clone and run the project or reference the logic to create a project that integrates agora-chat-uikit.

- [URL for Agora Chat UIKit Web source code](https://github.com/easemob/Easemob-UIKit-web)
- [URL for Agora Chat application using agora-chat-uikit](https://github.com/AgoraIO-Usecase/AgoraChat-web/tree/dev-2.0)
