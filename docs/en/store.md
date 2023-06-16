# rootStore

UIKit uses mobx to manage global data. Users can import the `rootStore` to get all the data and the action methods which can be used to modify the data to implement UI updates.

## Usage example

### How to implement conversation pinning

Call the `topConversation` method to pin a conversation.

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

### How to implement the sending of custom messages

Call the `sendMessage` method to send a custom message.

```jsx
import React from 'react';
import { rootStore, Button } from 'agora-chat-uikit';
import AgoraChat from 'agora-chat';
import 'agora-chat-uikit/style.css';

const StoreUseCase = () => {
  const sendCustomMsg = () => {
    const customMsg = AgoraChat.message.create({
      type: 'custom',
      to: 'targetId', // The user ID of the peer user for one-to-one chat or the current group ID for group chat.
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
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
      <td rowspan="10" >conversationStore</td>
    </<tr>
    <tr>
        <td>currentCvs</td>
        <td style=font-size:10px>CurrentConversation</td>
        <td style=font-size:10px>Data of the current conversation.</td>
    </tr> 
    <tr>
        <td>conversationList</td>
        <td style=font-size:10px>Conversation[]</td>
        <td style=font-size:10px>Data of all conversations.</td>
    </tr> 
    <tr>
        <td>searchList</td>
        <td style=font-size:10px>Conversation[]</td>
        <td style=font-size:10px>Data of the retrieved conversations.</td>
    </tr> 
   <tr>
        <td style=color:blue>setCurrentCvs</td>
        <td style=font-size:10px>(currentCvs: CurrentConversation) => void</td>
        <td style=font-size:10px>Sets the current conversation.</td>
    </tr> 
    <tr>
        <td style=color:blue>setConversation</td>
        <td style=font-size:10px>(conversations: Conversation[]) => void</td>
        <td style=font-size:10px>Sets all conversations.</td>
    </tr> 
    <tr>
        <td style=color:blue>deleteConversation</td>
        <td style=font-size:10px>(conversation: CurrentConversation) => void</td>
        <td style=font-size:10px>Deletes a conversation.</td>
    </tr> 
   <tr>
        <td style=color:blue>addConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Adds a conversation.</td>
    </tr> 
    <tr>
        <td style=color:blue>topConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Pins a conversation.</td>
    </tr> 
    <tr>
        <td style=color:blue>modifyConversation</td>
        <td style=font-size:10px>(conversation: Conversation) => void</td>
        <td style=font-size:10px>Modifies a conversation.</td>
    </tr>
     <tr>
      <td rowspan="10" >messageStore</td>
    </tr>
   <tr>
        <td>message</td>
        <td style=font-size:10px>Message</td>
        <td style=font-size:10px>Messages in all conversations, including one-to-one (`singleChat`) messages and group (`groupChat`) messages. </td style=font-size:10px>  
    </tr>
    <tr>
        <td style=color:blue>sendMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody) => Promise<void> </td>
        <td style=font-size:10px>Sends a message.</td>
    </tr>
    <tr>
        <td style=color:blue>receiveMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody) => void </td>
        <td style=font-size:10px>Receives a message.</td>
    </tr>
    <tr>
        <td style=color:blue>modifyMessage</td>
        <td style=font-size:10px>(id: string, message: AgoraChat.MessageBody) => void </td>
        <td style=font-size:10px>Edits a message.</td>
    </tr>
    <tr>
        <td style=color:blue>sendChannelAck</td>
        <td style=font-size:10px>(cvs: CurrentConversation) => void </td>
        <td style=font-size:10px>Replies with a channel ack to clear unread data from the conversation.</td>
    </tr>
   <tr>
        <td style=color:blue>updateMessageStatus</td>
        <td style=font-size:10px>(msgId: string, status: string) => void </td>
        <td style=font-size:10px>Updates the message status, i.e., whether the message is sent or read.</td>
    </tr>
     <tr>
        <td style=color:blue>clearMessage</td>
        <td style=font-size:10px>(cvs: CurrentConversation) => void </td>
        <td style=font-size:10px>Clears a conversation's messages.</td>
    </tr>

</table>