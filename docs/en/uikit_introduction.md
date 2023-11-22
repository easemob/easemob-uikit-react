# What is Agora Chat UIKit for Web

`agora-chat-uikit` is a UI component library based on the SoundNet Chat SDK, which includes three levels of components: pure UI components, module components and container components. The component integrates the Chat SDK internally, allowing users to quickly build applications using UIKit. At the same time, UIKit also provides extension and customization capabilities, Developers can use this library to customize IM applications based on actual business needs.

## Technical principles

Agora Chat UIKit consists of three parts: UI components, rootStore for managing data, and chat SDK. UI components include container components, module components, and pure UI components. These different levels of components are accessible to the public, and users can reference any of these components to build their own applications. UIkit uses React Context to manage global data. Users can use custom hooks to obtain the required data from the global data rootStore, or they can use custom hooks to obtain methods for manipulating this data. UIKit integrates the chat SDK internally and interacts with the server through the chat SDK.

![img](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/blob/UIKit-1.2/docs/uikit.png)

## Functions

The `agora-chat-uikit` repository provides the following functions:

- Implements automatic layout to match the width and height of the container.
- Sends and receives messages, displays messages, shows the unread message count, and clears messages. The text, image, file, emoji, and audio messages are supported.
- Searches for and deletes conversations.
- Customizes UI styles.

<table><tr><th valign="top">Module</th><th valign="top">Function</th><th valign="top">Description</th></tr>
<tr><td rowspan="2" valign="top">Conversation List</td><td valign="top">Conversation list</td><td valign="top">Presents the conversation information, including the user's avatar and nickname, content of the last message, unread message count, and the time when the last message is sent or received.</td></tr>
<tr><td valign="top">Delete conversation</td><td valign="top">Deletes the conversation from the conversation list.</td></tr>
<tr><td rowspan="2" valign="top">Chat</td><td valign="top">Message sender</td><td valign="top">Sends text, emoji, image, file, and voice messages.</td></tr>
<tr><td valign="top">Display message</td><td valign="top">Displays one-to-one messages or group messages, including the user's avatar and nickname and the message's content, sending time or reception time, sending status, and read status. The text, image, emoji, file, and voice, messages can be displayed.</td></tr> 
</table>

## Component

`agora-chat-uikit` provides the following components:

- Container components: [`UIKitProvider`](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/tree/UIKit-1.2/docs/en/provider.md), [`Chat`](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/tree/UIKit-1.2/docs/en/chat.md)，and [`ConversationList`](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/tree/UIKit-1.2/docs/en/conversation.md).
- Module components: `BaseMessage`，`AudioMessage`，`FileMessage`， `VideoMessage`，`ImageMessage`，`TextMessage`，`Header`，`Empty`，`MessageList`， `ConversationItem`，`MessageEditor`，`MessageStatus`.
- Pure UI components: `Avatar`，`Badge`，`Button`，`Checkbox`，`Icon`，`Modal`，`Tooltip`.

## Context

UIKit uses React context manage global data. Users can use customized hooks to get the data and methods which can be used to modify the data. UIKit provided `RootContext`, `useConversationContext`, `useChatContext`, `useAddressContext`, `useThreadContext`.

For attributes and methods in the Context, see the [Context document](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/tree/UIKit-1.2/docs/en/context.md).

## How to customize the UIKit

### Modify the component style

In this section, the `Chat` and `Button` components are used as an example to describe how to modify the component style.

You can modify the style of the `Chat` and `Button` components by passing in `className` and `style` through the component props.

```jsx
import { Chat, Button } from "agora-chat-uikit";

const ChatApp = () => {
  return (
    <div>
      <Chat className="customClass" />
      <Button style={{ width: "100px" }}>Button</Button>
    </div>
  );
};
```

### Use custom components

This section uses the `CustomHeader` component to describe how to use custom components.

You can render the `CustomHeader` component by using the `renderHeader` method of the container component `Chat`.

```jsx
import {Chat, Header} from 'agora-chat-uikit'

const ChatApp = () => {
  const CustomHeader = <Header back content="Custom Header">
  return(
    <div>
      <Chat renderHeader={(cvs) => CustomHeader}>
    </div>
  )
}
```

### Modify the theme

1. You can set the theme.primaryColor in the Provider component to set the primary color of the UIKit.

2. The UIKit style is developed using the SCSS framework and defines a series of global style variables, including but not limited to global styles (the primary color, background color, rounded corners, borders, and font size).

For how to modify the theme, see the [Github URL](https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web/tree/UIKit-1.2/docs/en/theme.md).

If the above three UIKit customization methods cannot meet your requirements, you can also find the elements to overwrite the style of UIKit.
