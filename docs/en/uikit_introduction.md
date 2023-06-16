# What is Agora Chat UIKit for Web

`agora-chat-uikit` is a UI component library based on the Chat SDK. It provides common UI components, module components containing the chat business logic, and container components, allowing users to customize the UI using the renderX methods. `agora-chat-uikit` provides a UIKitProvider for data management. The UIKitProvider automatically listens for Chat SDK events to modify data for UI updates. Developers can use the library to quickly build custom instant messaging applications based on actual business requirements.

## Technical principles

Agora Chat UIKit consists of three parts: UI components, mobx store for data management, and chat SDK. UI components include container components, compound components module, and pure UI components. These components at different levels are accessible to the public. Users can reference any of these components to build their own applications. UIKit uses mobx to manage global data, and users can reference the rootStore to get all the data and the action methods for data manipulation. UIKit integrates the chat SDK and interacts with the server through the Chat SDK.

![img](https://github.com/easemob/Easemob-UIKit-web/raw/dev/docs/uikit.png)

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

- Container components: [`UIKitProvider`](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/provider.md)， [`Chat`](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/chat.md)，and [`ConversationList`](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/conversation.md).
- Module components: `BaseMessage`，`AudioMessage`，`FileMessage`， `VideoMessage`，`ImageMessage`，`TextMessage`，`Header`，`Empty`，`MessageList`， `ConversationItem`，`MessageEditor`，`MessageStatus`.
- Pure UI components: `Avatar`，`Badge`，`Button`，`Checkbox`，`Icon`，`Modal`，`Tooltip`.

## store

UIKit provides the rootStore that contains all the data. rootStore consists of the following parts:

- initConfig: UIKit initialization data
- client: Chat SDK instance
- conversationStore: Conversation list data
- messageStore: Message data

For attributes and methods in the rootStore, see the [rootStore document](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/store.md).

## How to customize the UIKit

### Modify the component style

In this section, the `Chat` and `Button` components are used as an example to describe how to modify the component style.

You can modify the style of the `Chat` and `Button` components by passing in `className`, `style`, and `prefix` through the component props.

```jsx
import { Chat, Button } from 'agora-chat-uikit';

const ChatApp = () => {
  return (
    <div>
      <Chat className="customClass" prefix="custom" />
      <Button style={{ width: '100px' }}>Button</Button>
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

The UIKit style is developed using the SCSS framework and defines a series of global style variables, including but not limited to global styles (the primary color, background color, rounded corners, borders, and font size).

For how to modify the theme, see the [Github URL](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/theme.md).

If the above three UIKit customization methods cannot meet your requirements, you can also locate the elements to overwrite the style of UIKit.
