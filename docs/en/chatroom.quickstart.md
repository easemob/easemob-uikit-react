# ChatroomUIKit

ChatroomUIKit is designed to address most users' chat room requirements specific to pan-entertainment scenarios. It delivers good user experience in the use of APIs (for user-side developers) by streamlining SDK integration, facilitating customization, and offering comprehensive documentation.

# Quick start

## Prerequisites

Before proceeding, ensure that your development environment meets the following requirements:

- React 16.8.0 or higher.
- React DOM 16.8.0 or higher.
- A valid [Agora Chat account](https://docs.agora.io/en/agora-chat/reference/manage-agora-account?platform=android#create-an-agora-account).
- An [Agora project](https://docs.agora.io/en/agora-chat/reference/manage-agora-account?platform=android#create-and-manage-projects) for which you have [enabled Chat](https://docs.agora.io/en/agora-chat/get-started/enable?platform=android#enable-).
- The [App Key](https://docs.agora.io/en/agora-chat/get-started/enable?platform=android#get-chat-project-information) for the project.

## Supported browsers

| Browser           | Supported version |
| ----------------- | ----------------- |
| Internet Explorer | 11 or higher      |
| Edge              | 43 or higher      |
| Firefox           | 10 or higher      |
| Chrome            | 54 or higher      |
| Safari            | 11 or higher      |

## Send your first message

### 1. Create a chat room project

```bash
# Install a CLI tool.
npm install create-react-app
# Build a my-app project.
npx create-react-app my-app
cd my-app
```

```
Project directory:

├── package.json
├── public                  # Static directory of Webpack.
│   ├── favicon.ico
│   ├── index.html          # Default single-page app.
│   └── manifest.json
├── src
│   ├── App.css             # CSS of the app's root component.
│   ├── App.js              # App component code.
│   ├── App.test.js
│   ├── index.css           # Startup file style.
│   ├── index.js            # Startup file.
│   ├── logo.svg
│   └── serviceWorker.js
└── yarn.lock
```

### 2. Install agora-chat-uikit

- Install ChatroomUIKit with npm:

```bash
npm install agora-chat-uikit --save
```

- Install ChatroomUIKit with yarn:

```bash
yarn add agora-chat-uikit
```

### 3. Build your app with ChatroomUIKit components

Import the agora-chat-uikit library to your code:

```javascript
// App.js
import React, { Component, useEffect } from 'react';
import { Provider, Chatroom, useClient, rootStore, ChatroomMember } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatroomApp = observer(() => {
  const client = useClient();
  const chatroomId = ''; // The chat room to join
  const appKey = ''; // Your App Key

  useEffect(() => {
    if (client.addEventHandler) {
      client.addEventHandler('chatroom', {
        onConnected: () => {
          console.log('Login success');
        },
      });
    }
  }, [client]);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const login = () => {
    client
      .open({
        user: userId,
        pwd: password,
        //accessToken: '',
      })
      .then(res => {
        console.log('Successfully getting the token');
      });
  };
  return (
    <>
      <Provider
        theme={{
          mode: 'dark',
        }}
        initConfig={{
          appKey: appKey,
        }}
      >
        <div>
          <div>
            <label>userID</label>
            <input
              onChange={e => {
                setUserId(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <label>password</label>
            <input
              onChange={e => {
                setPassword(e.target.value);
              }}
            ></input>
          </div>
          <div>
            <button onClick={login}>login</button>
          </div>
        </div>

        <div style={{ width: '350px' }}>
          <Chatroom chatroomId={chatroomId}></Chatroom>
        </div>
        <div style={{ width: '350px' }}>
          <ChatroomMember chatroomId={chatroomId}></ChatroomMember>
        </div>
      </Provider>
    </>
  );
});
export default ChatroomApp;
```

### 4. Run the project and send your first message

```bash
npm run start
```

## Customization

### Switch the theme

You can switch the theme by setting the theme properties of the Provider component:

```javascript
import { Chatroom, UIKitProvider } from 'agora-chat-uikit';

const ChatApp = () => {
  return (
    <UIKitProvider
      theme={{
        mode: 'light', // light or dark
        primaryColor: '#00CE76', // Hexadecimal color value
      }}
    >
      <Chatroom className="customClass" prefix="custom" />
    </UIKitProvider>
  );
};
```

### Modify component styles

You can modify component styles by setting the `className`, `style`, and `prefix` properties.

```javascript
import { Chatroom, Button } from 'agora-chat-uikit';

const ChatApp = () => {
  return (
    <div>
      <Chatroom className="customClass" prefix="custom" />
      <Button style={{ width: '100px' }}>Button</Button>
    </div>
  );
};
```

### Use custom components

You can render custom components with the renderX method of container components. The following takes rendering the header as an example.

```javascript
import {Chatroom, Header} from 'agora-chat-uikit'

const ChatApp = () => {
  const CustomHeader = <Header back content="Custom Header">
  return(
    <div>
      <Chatroom renderHeader={(cvs) => CustomHeader}>
    </div>
  )
}

```

## Chat room properties

<table>
    <tr>
        <td>Property</td>
        <td>Type</td>
        <td>Description</td>
    </tr>
    <tr>
      <td style=font-size:10px> className </td>
      <td style=font-size:10px> String </td>
	  <td style=font-size:10px>Class name of the component</td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>String</td>
		<td style=font-size:10px>Prefix of the css class name</td>
	  </tr>
      <tr>
		<td style=font-size:10px>style</td>
        <td style=font-size:10px>React.CSSProperties</td>
		<td style=font-size:10px>Component style</td>
	  </tr>
      <tr>
		<td style=font-size:10px>chatroomId</td>
        <td style=font-size:10px>String</td>
		<td style=font-size:10px>Chat room ID (required)</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderEmpty</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px> Custom rendering of the content of the empty page</td> 
	  </tr>
      <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>(roomInfo: ChatroomInfo) => ReactNode</td>
		<td style=font-size:10px> Custom rendering of the Header component</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Properties of the Header component</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>renderMessageList</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px>Custom rendering of the MessageList component</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderMessageEditor</td>
        <td style=font-size:10px>() => ReactNode</td>
		<td style=font-size:10px>Custom rendering of the MessageEditor component</td>
	  </tr>
       <tr>
    	<td style=font-size:10px>messageEditorProps</td>
        <td style=font-size:10px>MessageEditorProps</td>
    	<td style=font-size:10px>Properties of the MessageEditor component</td>
      </tr>
      <tr>
    	<td style=font-size:10px>messageListProps</td>
        <td style=font-size:10px>MsgListProps</td>
    	<td style=font-size:10px>Properties of the MessageList component</td>
      </tr>
      <tr>
    	<td style=font-size:10px>renderBroadcast</td>
        <td style=font-size:10px>() => ReactNode</td>
    	<td style=font-size:10px>Custom rendering of the Broadcast component</td>
      </tr>
        <tr>
    	<td style=font-size:10px>broadcastProps</td>
        <td style=font-size:10px>BroadcastProps</td>
    	<td style=font-size:10px>Properties of the Broadcast component</td>
      </tr>

   </tr>
</table>

## ChatroomMember Properties

<table>
    <tr>
        <td>Property</td>
        <td>Type</td>
        <td>Description</td>
    </tr>
    <tr>
      <td style=font-size:10px> className </td>
      <td style=font-size:10px> String </td>
	  <td style=font-size:10px>Class name of the component</td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>Prefix of the css class name</td>
	  </tr>
      <tr>
		<td style=font-size:10px>style</td>
        <td style=font-size:10px>React.CSSProperties</td>
		<td style=font-size:10px>Component style</td>
	  </tr>
      <tr>
		<td style=font-size:10px>chatroomId</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>Chat room ID (required)</td>
	  </tr>
      <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>(roomInfo: ChatroomInfo) => ReactNode</td>
		<td style=font-size:10px>Custom rendering of the Header component</td> 
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Properties of the Header component</td> 
	  </tr>
      <tr>
		<td style=font-size:10px>memberListProps</td>
        <td style=font-size:10px> {
            search?: boolean; 
            placeholder?: string;
            renderEmpty?: () => ReactNode;
            renderItem?: (item: AppUserInfo) => ReactNode;
            UserItemProps?: UserItemProps;
        }</td>
		<td style=font-size:10px>Properties of the MemberList component</td> 
	  </tr>
      <tr>
		<td style=font-size:10px>muteListProps</td>
        <td style=font-size:10px> {
            search?: boolean;
            placeholder?: string;
            renderEmpty?: () => ReactNode;
            renderItem?: (item: AppUserInfo) => ReactNode;
            UserItemProps?: UserItemProps;
        }</td>
		<td style=font-size:10px>Properties of the MuteList component</td>
	  </tr>
   </tr>
</table>

## Context

ChatroomUIKit manages global data with React Context. You can use the custom hook `useChatroomContext` to get and manage chat room-related data.

### Usage example

```javascript
import React from 'react';
import { useChatroomContext } from 'agora-chat-uikit';

const ChatAPP = () => {
  const { chatroom, muteChatRoomMember, unmuteChatRoomMember, removerChatroomMember } =
    useChatroomContext();
  return <div>Chatroom</div>;
};
```

### useChatroomContext

<table>
    <tr>
        <td>Property/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>chatroom</td>
        <td style=font-size:10px>ChatroomInfo</td>
        <td style=font-size:10px>Chat room information.</td>
    </tr> 
    <tr>
        <td style=color:blue>muteChatRoomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string, muteDuration?: number | undefined) => Promise<void></td>
        <td style=font-size:10px>Mutes a chat room member.</td>
    </tr>
    <tr>
        <td style=color:blue>unmuteChatRoomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string) => Promise<void></td>
        <td style=font-size:10px>Unmutes a chat room member.</td>
    </tr>
    <tr>
        <td style=color:blue>removerChatroomMember</td>
        <td style=font-size:10px>(chatroomId: string, userId: string) => void</td>
        <td style=font-size:10px>Removes a member from the chat room.</td>
    </tr>
</table>
