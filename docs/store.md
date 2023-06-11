# rootStore

UIkit uses mobx to manage global data, and users can reference the `rootStore` to get all the data and the action method, which can be used to modify the data, At the same time, the UI will also be automatically updated.

## usage example

1. How to Implement Topping a conversation

```jsx
import React from 'react';
import { rootStore, Button } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';

const StoreUseCase = () => {
  const topConversation = () => {
    rootStore.conversationStore.topConversation({
      chatType: 'singleChat',
      conversationId: 'userId',
      lastMessage: {},
    });
  };
  return (
    <div>
      <Button onClick={topConversation}>top conversation</Button>
    </div>
  );
};
```

2. How to Implement Sending Custom Messages

```jsx
import React from 'react';
import { rootStore, Button } from 'agora-chat-uikit';
import AgoraChat from 'agora-chat';
import 'agora-chat-uikit/style.css';

const StoreUseCase = () => {
  const sendCustomMsg = () => {
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
    <div>
      <Button onClick={sendCustomMsg}>send custom message</Button>
    </div>
  );
};
```

## Overview of rootStore

<table>
    <tr>
        <td>Store</td>
        <td>Attribute/Method</td>
        <td>type</td>
        <td>Description</td>
    </tr> 
    <tr>
      <td rowspan="10" >conversationStore</td>
    </<tr>
    <tr>
        <td>currentCvs</td>
        <td style=font-size:10px>CurrentConversation</td>
        <td style=font-size:10px>Current conversation</td>
    </tr> 
    <tr>
        <td>conversationList</td>
        <td style=font-size:10px>Conversation[]</td>
        <td style=font-size:10px>All conversations</td>
    </tr> 
    <tr>
        <td>searchList</td>
        <td style=font-size:10px>Conversation[]</td>
        <td style=font-size:10px>The searched conversations</td>
    </tr> 
   <tr>
        <td style=color:blue>setCurrentCvs</td>
        <td style=font-size:10px>(currentCvs: CurrentConversation) => void</td>
        <td style=font-size:10px>Set the current conversation</td>
    </tr> 
    <tr>
        <td style=color:blue>setConversation</td>
        <td style=font-size:10px>(conversations: Conversation[]) => void</td>
        <td style=font-size:10px>Set all conversations</td>
    </tr> 
    <tr>
        <td style=color:blue>deleteConversation</td>
        <td style=font-size:10px>(conversation: CurrentConversation) => void</td>
        <td style=font-size:10px>Delete a conversation</td>
    </tr> 
   <tr>
        <td style=color:blue>addConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Add a conversation</td>
    </tr> 
    <tr>
        <td style=color:blue>topConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Top a conversation</td>
    </tr> 
    <tr>
        <td style=color:blue>modifyConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Modifying a conversation</td>
    </tr>
     <tr>
      <td rowspan="10" >messageStore</td>
    </tr>
   <tr>
        <td>message</td>
        <td style=font-size:10px>Message</td>
        <td style=font-size:10px>All conversation messages, including singleChat, groupChat, byId</td style=font-size:10px>
    </tr>
    <tr>
        <td style=color:blue>sendMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody) => Promise<void> </td>
        <td style=font-size:10px>Send a message</td>
    </tr>
    <tr>
        <td style=color:blue>receiveMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody) => void </td>
        <td style=font-size:10px>Receive a message</td>
    </tr>
    <tr>
        <td style=color:blue>modifyMessage</td>
        <td style=font-size:10px>(id: string, message: AgoraChat.MessageBody) => void </td>
        <td style=font-size:10px>Edit a message</td>
    </tr>
    <tr>
        <td style=color:blue>sendChannelAck</td>
        <td style=font-size:10px>(cvs: CurrentConversation) => void </td>
        <td style=font-size:10px>Reply with a channel ack to clear unread data from the conversation</td>
    </tr>
   <tr>
        <td style=color:blue>updateMessageStatus</td>
        <td style=font-size:10px>(msgId: string, status: string) => void </td>
        <td style=font-size:10px>Update message status</td>
    </tr>
     <tr>
        <td style=color:blue>clearMessage</td>
        <td style=font-size:10px>(cvs: CurrentConversation) => void </td>
        <td style=font-size:10px>Clear a conversation's messages</td>
    </tr>
    
</table>
