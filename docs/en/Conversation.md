# ConversationList

The `ConversationList` component displays the current user's conversations (including one-to-one chats and group chats, but excluding chat room chats) and provides conversation search and deletion functions. For one-to-one chats, the conversation name is the nickname of the peer user or his or her user ID if the nickname is not set. For group chats, the conversation name is the group name.

## Usage example

```jsx
import React, { useEffect, useState } from 'react';
import { ConversationList } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const Conversation = () => {
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList />
    </div>
  );
};
```

<div align=center > <img src="../image/cvs-header1.png" width = "200" height = "450" /></div>

## Customize ConversationList

If the default `ConversationList` UI cannot meet your business needs, you can customize the UI by using parameters provided by the `ConversationList` component.

1. Modify the background color, size, and other styles of the component.

Add the `className` to the component to define the styles.

```jsx
import React from 'react';
import { ConversationList } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';
import './index.css';

const Conversation = () => {
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList className="conversation" />
    </div>
  );
};
```

Define the conversation UI style in index.css:

```css
.conversation {
  background-color: '#03A9F4';
  height: 100%;
  width: 100%;
}
```

<div align=center > <img src="../image/cvs-bg.png" width = "200" height = "450" /></div>

2. Customize the `ConversationList` header element.

Use the `renderHeader` method to customize the header element.

```jsx
import React from 'react';
import { ConversationList, Header, Avatar } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const Conversation = () => {
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList
        renderHeader={() => (
          <Header
            avatar={<Avatar>D</Avatar>}
            content="custom header"
            moreAction={{
              visible: true,
              actions: [
                {
                  content: 'my info',
                  onClick: () => {
                    console.log('my info');
                  },
                },
              ],
            }}
          />
        )}
      ></ConversationList>
    </div>
  );
};
```

<div align=center > <img src="../image/cvs-header2.png" width = "200" height = "450" /></div>

3. Set the user's avatar and nickname.

Use the `renderItem` method to render the conversation list item. Use props to customize the `ConversationItem` component.

```jsx
import React from 'react';
import { ConversationList, ConversationItem, Avatar } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';
import './index.css';

const Conversation = () => {
  // Maps the user ID of the peer user in the one-to-one chat to the nickname of the peer user.
  const idToName = {
    userId1: 'name1',
    zd2: 'Henry 2',
  };
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList
        className="conversation"
        renderItem={cvs => {
          return (
            <ConversationItem
              avatar={
                <Avatar
                  size="normal"
                  shape="square"
                  style={{ background: 'yellow', color: 'black' }}
                >
                  {idToName[cvs.conversationId] || cvs.conversationId}
                </Avatar>
              }
              data={{ ...cvs, name: idToName[cvs.conversationId] || cvs.conversationId }}
            />
          );
        }}
      ></ConversationList>
      />
    </div>
  );
};
```

<div align=center > <img src="../image/cvs-nick.png" width = "200" height = "450" /></div>

4. Use methods in `conversationStore` for conversation customization, for example:

- Use the `topConversation` method to pin a conversation.
- Use the `addConversation` method to create a conversation.

```jsx
import React from 'react';
import { ConversationList, ConversationItem, rootStore, Button } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const Conversation = () => {
  // Pins a conversation.
  const topConversation = () => {
    rootStore.conversationStore.topConversation({
      chatType: 'singleChat', // For group chats, the value is `groupChat`.
      conversationId: 'userID', // Enter a conversation ID obtained from your conversation list.
      lastMessage: {},
    });
  };

  // Creates a new conversation.
  const createConversation = () => {
    rootStore.conversationStore.addConversation({
      chatType: 'singleChat',
      conversationId: 'conversationId',
      lastMessage: {},
      unreadCount: 3,
    });
  };
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList
        renderItem={cvs => {
          return (
            <ConversationItem
              moreAction={{
                visible: true,
                actions: [
                  {
                    // UIKit provides the conversation deletion event by default.
                    content: 'DELETE',
                  },
                  {
                    content: 'Top Conversation',
                    onClick: topConversation,
                  },
                ],
              }}
            />
          );
        }}
      ></ConversationList>
      <div>
        <Button onClick={createConversation}>create conversation</Button>
      </div>
    </div>
  );
};
```

<div align=center > <img src="../image/cvs-action.png" width = "200" height = "450" /></div>

5. Modify the conversation theme.

The conversation list provides the following conversation theme variables. For how to modify the theme, see the [Get Started with Agora Chat UIKit for Web](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/theme.md).

```scss
// Variables used to set the conversation theme.
$cvs-background: $component-background;
$cvs-search-margin: $margin-xs $margin-sm;
$cvs-item-height: 74px;
$cvs-item-padding: $padding-s;
$cvs-item-border-radius: 16px;
$cvs-item-margin: $margin-xss $margin-xs;
$cvs-item-selected-bg-color: #e6f5ff;
$cvs-item-selected-name-color: $blue-6;
$cvs-item-hover-bg-color: $gray-98;
$cvs-item-active-bg-color: $gray-9;
$cvs-item-info-right: 16px;
$cvs-item-name-margin: 0 $margin-sm;
$cvs-item-name-font-size: $font-size-lg;
$cvs-item-name-font-weight: 500;
$cvs-item-name-color: $title-color;
$cvs-item-message-margin-left: $margin-sm;
$cvs-item-message-font-size: $font-size-base;
$cvs-item-message-font-weight: 400;
$cvs-item-message-color: $font-color;
$cvs-item-time-font-weight: 400;
$cvs-item-time-font-size: $font-size-sm;
$cvs-item-time-color: $gray-5;
$cvs-item-time-margin-bottom: 9px;
```

## Overview of ConversationList Props

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
    String
	  </td>
	  <td style=font-size:10px>
	  Component class name.
	  </td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>String</td>
		<td style=font-size:10px>The prefix of the CSS class name.</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Props for the Header component.</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>itemProps</td>
        <td style=font-size:10px>ConversationItemProps</td>
		<td style=font-size:10px>Props for the ConversationItem component.</td>
	  </tr>
	   <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>() => React.ReactNode</td>
		<td style=font-size:10px>Renders the custom header.</td> 
	  </tr>
	  <tr>
		<td style=font-size:10px>renderSearch</td>
        <td style=font-size:10px>() => React.ReactNode</td>
		<td style=font-size:10px>Renders the custom search component.</td> 
	  </tr>
	  <tr>
		<td style=font-size:10px>onItemClick</td>
        <td style=font-size:10px>(data: ConversationData[0]) => void</td>
		<td style=font-size:10px>Event of click on the conversation list item.</td> 
	  </tr>
	  <tr>
		<td style=font-size:10px>onSearch</td>
        <td style=font-size:10px>(e: React.ChangeEvent<HTMLInputElement>) => boolean</td>
		<td style=font-size:10px>Search input change event. If the function returns `false`, the default search behavior is prevented and users can search according to their own conditions.</td>
	  </tr>
   </tr>
</table>
