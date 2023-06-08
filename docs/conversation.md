# ConversationList

ConversationList component to display the current user's conversation (single chat, group chat, excluding chat rooms), and provides search and delete conversation functions

会话列表显示的会话名字，单聊优先显示用户属性中设置的 nickname, 没有设置用户属性时显示用户 id， 群组显示群组名称

## usage example

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

## Customize ConversationList

If the default ConversationList interface cannot meet your business needs, you can customize the interface through the custom parameters of the ConversationList component.

1. Modify the background color, size, and other styles of components.

Add a className to the component to define the style.

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

index.css

```css
.conversation {
  background-color: green;
  height: 100%;
  width: 100%;
}
```

2. Customize `ConversationList` header element.

using the `renderHeader` method to customize header element.

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

3. Customize user avatars and nicknames.

Use the `renderItem` method to customize rendering conversation item, and use props to customize `ConversationItem` component.

```jsx
import React from 'react';
import { ConversationList, ConversationItem, Avatar } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';
import './index.css';

const Conversation = () => {
  // Mapping of userId to username
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

4. Using the methods provided by the store to implement custom functions.

- Implementing the top conversation function using the `topConversation` method of `conversationStore`.
- Implementing the create conversation function using the `addConversation` method of `conversationStore`.

```jsx
import React from 'react';
import { ConversationList, ConversationItem, rootStore, Button } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const Conversation = () => {
  // Bring an existing conversation to the top
  const topConversation = () => {
    rootStore.conversationStore.topConversation({
      chatType: 'singleChat', // 'singleChat' or 'groupChat'
      conversationId: 'userID', // Enter a conversation ID from your conversation list.
      lastMessage: {},
    });
  };

  // Create a new conversation
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
                    // Uikit provides default deletion conversation event
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

5. Modify Theme

The conversation list has these variables that can be used to modify the theme. You can refer to another document on how to use variables to modify the theme

```scss
// Conversation
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

## Overview of ConversationList props

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
	  Component class name
	  </td>
	  <tr>
		<td style=font-size:10px>prefix</td>
        <td style=font-size:10px>string</td>
		<td style=font-size:10px>css class name prefix</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>headerProps</td>
        <td style=font-size:10px>HeaderProps</td>
		<td style=font-size:10px>Props for the Header component</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>itemProps</td>
        <td style=font-size:10px>ConversationItemProps</td>
		<td style=font-size:10px>Props for the ConversationItem component</td>
	  </tr>
	   <tr>
		<td style=font-size:10px>renderHeader</td>
        <td style=font-size:10px>() => React.ReactNode</td>
		<td style=font-size:10px>Custom rendering header, which receives a function that returns a react node</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>renderSearch</td>
        <td style=font-size:10px>() => React.ReactNode</td>
		<td style=font-size:10px>Custom rendering search component, which receives a function that returns a react node</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>onItemClick</td>
        <td style=font-size:10px>(data: ConversationData[0]) => void</td>
		<td style=font-size:10px>Click on the conversation event to return the data of the current session</td>
	  </tr>
	  <tr>
		<td style=font-size:10px>onSearch</td>
        <td style=font-size:10px>(e: React.ChangeEvent<HTMLInputElement>) => boolean</td>
		<td style=font-size:10px>Search input change event. If the function returns false, it will prevent the default search behavior. Users can search according to their own conditions</td>
	  </tr>
   </tr>
</table>
