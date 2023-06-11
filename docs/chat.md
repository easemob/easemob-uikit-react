# Chat

The Chat component is used to send and receive messages, including text messages, emoticons, image messages, voice messages, and file messages, and it also provides functions to clear messages and delete a conversation. Chat uses message roaming function to pull historical messages.

## usage example

```jsx
import React from 'react';
import { Chat } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatContainer = () => {
  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chat />
    </div>
  );
};
```

## Customize Chat

1. How to modify the message bubble style

Taking text messages as an example, customize the rendering message list through the `renderMessageList` method, customize rendering messages using the `renderMessage` method, customize text messages through the props of the TextMessage component.

```jsx
import React from 'react';
import { Chat, MessageList, TextMessage } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatContainer = () => {
  const renderTxtMsg = msg => {
    return (
      <TextMessage
        bubbleStyle={{ background: 'hsl(135.79deg 88.79% 36.46%)' }}
        shape="square"
        status={msg.status}
        avatar={<Avatar style={{ background: 'pink' }}>A</Avatar>}
        textMessage={msg}
      ></TextMessage>
    );
  };

  const renderMessage = msg => {
    if (msg.type === 'txt') {
      return renderTxtMsg(msg);
    }
  };

  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chat renderMessageList={() => <MessageList renderMessage={renderMessage} />} />
    </div>
  );
};
```

2. How to add an icon to the MessageEditor

Example how to insert a custom icon after textarea to implement custom functionality. Using the `renderMessageEditor` method to render custom message editor component, and customize `MessageEditor` with `actions` props.

```jsx
import React from 'react';
import { Chat, Icon, MessageEditor } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatContainer = () => {
  // add an icon to the message editor
  const CustomIcon = {
    visible: true,
    name: 'CUSTOM',
    icon: (
      <Icon
        type="DOC"
        onClick={() => {
          console.log('click custom icon');
        }}
      ></Icon>
    ),
  };

  const actions = [...MessageEditor.defaultActions];
  // Insert after textarea
  actions.splice(2, 0, CustomIcon);
  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chat renderMessageEditor={() => <MessageEditor actions={actions} />} />
    </div>
  );
};
```

3. How to Implement Sending Custom Messages

Using the `sendMessage` method in `messageStore` to send custom messages, use `renderMessage` to display custom messages. (Please ensure that the 'to' of the 'message' is the current conversation in order for the message to be displayed)

```jsx
import React from 'react';
import { Chat, MessageList, TextMessage, rootStore, MessageEditor, Icon } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const ChatContainer = () => {
  // Display custom messages
  const renderCustomMsg = msg => {
    return (
      <div>
        <h1>Business Card </h1>
        <div>{msg.customExts.id}</div>
      </div>
    );
  };
  const renderMessage = msg => {
    if (msg.type === 'custom') {
      return renderCustomMsg(msg);
    }
  };

  // add an icon to the message editor
  const CustomIcon = {
    visible: true,
    name: 'CUSTOM',
    icon: (
      <Icon
        type="DOC"
        onClick={() => {
          sendCustomMessage();
        }}
      ></Icon>
    ),
  };
  const actions = [...MessageEditor.defaultActions];
  actions.splice(2, 0, CustomIcon);

  // Implement Sending Custom Messages
  const sendCustomMessage = () => {
    const customMsg = AgoraChat.message.create({
      type: 'custom',
      to: 'targetId', // Need to be the user ID of the current conversation
      chatType: 'singleChat',
      customEvent: 'CARD',
      customExts: {
        id: 'userId3',
      },
    });
    rootStore.messageStore.sendMessage(customMsg).then(() => {
      console.log('send success');
    });
  };
  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chat
        renderMessageList={() => <MessageList renderMessage={renderMessage} />}
        renderMessageEditor={() => <MessageEditor actions={actions} />}
      />
    </div>
  );
};
```

4. Modify Theme

The chat has these variables that can be used to modify the theme. You can refer to another document on how to use variables to modify the theme

```scss
$chat-bg: $component-background;
$msg-base-font-size: $font-size-lg;
$msg-base-color: $font-color;
$msg-base-margin: $margin-xs 0;
$msg-base-padding: 0 $padding-lg;
$msg-bubble-border-radius-left: 12px 16px 16px 4px;
$msg-bubble-border-radius-right: 16px 12px 4px 16px;
$msg-bubble-arrow-border-size: 6px;
$msg-bubble-arrow-bottom: 8px;
$msg-bubble-arrow-left: -11px;
$msg-bubble-arrow-right: -11px;
$msg-bubble-color-secondly: $blue-95;
$msg-bubble-color-primary: $blue-5;
$msg-bubble-font-color-secondly: $font-color;
$msg-bubble-font-color-primary: $gray-98;
$msg-base-content-margin: 0 $margin-xs 0 $margin-sm;
$msg-base-content-padding: $padding-xs $padding-sm;
$msg-base-content-minheight: 24px;
$msg-bubble-none-bg: transparent;
$msg-bubble-none-color: $font-color;
$msg-bubble-square-border-radius: 4px;
$msg-info-margin-left: $margin-sm;
$msg-nickname-font-size: $font-size-sm;
$msg-nickname-font-weight: 500;
$msg-nickname-font-color: #5270ad;
$msg-nickname-height: 16px;
$msg-time-font-size: $font-size-sm;
$msg-time-font-weight: 400;
$msg-time-font-color: $gray-7;
$msg-time-height: 16px;
$msg-time-margin: 0 $margin-xss;
$msg-time-width: 106px;
```

## Overview of Chat props

<table>
<tr>
        <td>Props</td>
        <td>Type</td>
        <td>Description</td>
    </tr>
 <tr>
      <td style=font-size:10px>
	  className
	  </td>
      <td style=font-size:10px>
	  string
	  </td>
	  <td style=font-size:10px>
	  Component CSS class name
	  </td>
	  <tr>
	    <td style=font-size:10px>prefix</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>CSS class name prefix</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>props for Header</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>messageListProps</td>
        <td style=font-size:10px>MsgListProps</td>
		<td style=font-size:10px>Props for the MessageList component</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>messageEditorProps</td>
        <td style=font-size:10px> MessageEditorProps</td>
		<td style=font-size:10px>Props for the MessageEditor component</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>(cvs: CurrentCvs) => React.ReactNode</td>
		<td style=font-size:10px>Custom render Header component that takes a function that returns a react node， CurrentCvs is the current conversation</td>
	  </tr>
	   <tr>
	    <td style=font-size:10px>renderMessageList</td>
        <td style=font-size:10px>() => ReactNode; </td>
		<td style=font-size:10px>Custom render message list component</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderMessageEditor </td>
         <td style=font-size:10px>() => ReactNode; </td>
		<td style=font-size:10px>Custom render message sender component</td>
	  </tr>
	  <tr>
	    <td style=font-size:10px>renderEmpty</td>
        <td style=font-size:10px>() => ReactNode; </td>
		<td style=font-size:10px>Custom render empty pages without a conversation</td>
	  </tr>
   </tr>
</table>
