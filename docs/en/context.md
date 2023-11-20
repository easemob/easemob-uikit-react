# Context

UIKit uses React context manage global data. Users can use customized hooks to get the data and methods which can be used to modify the data. UIKit provided `RootContext`, `useConversationContext`, `useChatContext`, `useAddressContext`, `useThreadContext`.

## RootContext

It contains UIKit global data.

### Usage example

```javascript
import React, { useContext } from "react";
import { RootContext } from "agora-chat-uikit";

const ChatAPP = () => {
  const context = useContext(RootContext);
  return <div>ChatAPP</div>;
};
```

### Overview of RootContext

<table>
    <tr>
        <td>Attribute/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>rootStore</td>
        <td style=font-size:10px>ContextProps['rootStore']</td>
        <td style=font-size:10px>UIKit global data.</td>
    </tr> 
    <tr>
        <td>initConfig</td>
        <td style=font-size:10px>ContextProps['initConfig']</td>
        <td style=font-size:10px>Initialized configuration.</td>
    </tr> 
    <tr>
        <td>client</td>
        <td style=font-size:10px>ContextProps['client']</td>
        <td style=font-size:10px>An instance of the Chat SDK connection class.</td>
    </tr>
    <tr>
        <td>features</td>
        <td style=font-size:10px>ContextProps['features']</td>
        <td style=font-size:10px>Global configuration of UIKit functions, where you can configure the functions you need.</td>
    </tr>
    <tr>
        <td>reactionConfig</td>
        <td style=font-size:10px>ContextProps['reactionConfig']</td>
        <td style=font-size:10px>Global configuration of custom reaction emoticons.</td>
    </tr>
    <tr>
        <td style=color:blue>onError</td>
        <td style=font-size:10px>ContextProps['onError']</td>
        <td style=font-size:10px>UIKit error callback function.</td>
    </tr>
</table>

## useConversationContext

This custom hook can return conversation related data and methods of managing data.

### Usage example

```javascript
import React from "react";
import { useConversationContext } from "agora-chat-uikit";

const ChatAPP = () => {
  const { conversationList, setCurrentConversation } = useConversationContext();
  const setCurrentCvs = () => {
    setCurrentConversation({
      chatType: "singleChat",
      conversationId: "userId",
    });
  };
  return (
    <div>
      <button onClick={setCurrentCvs}>setCurrentConversation</button>
    </div>
  );
};
```

### Overview of useConversationContext

<table>
    <tr>
        <td>Attribute/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>currentConversation</td>
        <td style=font-size:10px>CurrentConversation</td>
        <td style=font-size:10px>Current Conversation.</td>
    </tr> 
    <tr>
        <td>conversationList</td>
        <td style=font-size:10px>Conversation[]</td>
        <td style=font-size:10px>Collection of all conversations.</td>
    </tr> 
    <tr>
        <td style=color:blue>setCurrentConversation</td>
        <td style=font-size:10px>(currentCvs: CurrentConversation) => void</td>
        <td style=font-size:10px>Method of setting the current conversation.</td>
    </tr>
    <tr>
        <td style=color:blue>deleteConversation</td>
        <td style=font-size:10px>(conversation: CurrentConversation) => void</td>
        <td style=font-size:10px>Method of removing a conversation from the conversation list.</td>
    </tr>
    <tr>
        <td style=color:blue>topConversation</td>
        <td style=font-size:10px> (conversation: Conversation) => void</td>
        <td style=font-size:10px>Method of move a conversation to the top of the conversation list.</td>
    </tr>
    <tr>
        <td style=color:blue>addConversation</td>
        <td style=font-size:10px> (conversation: Conversation) => void</td>
        <td style=font-size:10px>Method of adding a conversation to the conversation list.</td>
    </tr>
    <tr>
        <td style=color:blue>modifyConversation</td>
        <td style=font-size:10px> (conversation: Conversation) => void</td>
        <td style=font-size:10px>Method of modifying a conversation.</td>
    </tr>
</table>

## useChatContext

This custom hook can return message related data and methods of managing data.

### Usage example

```javascript
import React from "react";
import { useChatContext, useSDK } from "agora-chat-uikit";

const ChatAPP = () => {
  const { AgoraChat } = useSDK(); // get Chat SDK
  const { messages, sendMessage } = useChatContext();
  const sendCustomMessage = () => {
    const customMsg = AgoraChat.message.create({
      type: "custom",
      to: "targetId", // The user ID of the peer user for one-to-one chat or the current group ID for group chat.
      chatType: "singleChat",
      customEvent: "CARD",
      customExts: {
        id: "userId",
      },
    });
    sendMessage(customMsg);
  };

  return (
    <div>
      <button onClick={sendCustomMessage}>sendMessage</button>
    </div>
  );
};
```

### Overview of useChatContext

<table>
    <tr>
        <td>Attribute/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>messages</td>
        <td style=font-size:10px>Message</td>
        <td style=font-size:10px>All message data in UIKit.</td>
    </tr> 
    <tr>
        <td>repliedMessage</td>
        <td style=font-size:10px>AgoraChat.MessagesType</td>
        <td style=font-size:10px>Message being replied to.</td>
    </tr> 
    <tr>
        <td>typing</td>
        <td style=font-size:10px>Typing</td>
        <td style=font-size:10px>A object of users in the typing state.</td>
    </tr> 
    <tr>
        <td style=color:blue>sendMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody) => Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of sending messages.</td>
    </tr>
    <tr>
        <td style=color:blue>deleteMessage</td>
        <td style=font-size:10px>deleteMessage: (cvs: CurrentConversation, messageId: string | string[]) => void | Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of deleting messages.</td>
    </tr>
    <tr>
        <td style=color:blue>recallMessage</td>
        <td style=font-size:10px>(cvs: CurrentConversation, messageId: string, isChatThread?: boolean) => Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of recalling a message.</td>
    </tr>
    <tr>
        <td style=color:blue>translateMessage</td>
        <td style=font-size:10px>(cvs: CurrentConversation, messageId: string, language: string) => Promise&lt;boolean&gt;</td>
        <td style=font-size:10px>Method of translating a text message.</td>
    </tr>
    <tr>
        <td style=color:blue>modifyMessage</td>
        <td style=font-size:10px>(messageId: string, msg: AgoraChat.TextMsgBody) => Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of Modifying a message on the server, and the other party will display the modified message, which is only valid for text messages.</td>
    </tr>
    <tr>
        <td style=color:blue>modifyLocalMessage</td>
        <td style=font-size:10px>(id: string, message: AgoraChat.MessageBody | RecallMessage) => void</td>
        <td style=font-size:10px>Method of modifying messages locally is valid for any type of message.</td>
    </tr>
    <tr>
        <td style=color:blue>updateMessageStatus</td>
        <td style=font-size:10px>(msgId: string, status: 'received' | 'read' | 'unread' | 'sent' | 'failed' | 'sending' | 'default') => void</td>
        <td style=font-size:10px>Method of updating message status.</td>
    </tr>
    <tr>
        <td style=color:blue>sendTypingCommand</td>
        <td style=font-size:10px> (cvs: CurrentConversation) => void</td>
        <td style=font-size:10px>Method of sending the command being typing.</td>
    </tr>
    <tr>
        <td style=color:blue>setRepliedMessage</td>
        <td style=font-size:10px>(message: AgoraChat.MessageBody | null) => void</td>
        <td style=font-size:10px>Method of setting replied message.</td>
    </tr>
    <tr>
        <td style=color:blue>clearMessages</td>
        <td style=font-size:10px>(cvs: CurrentConversation) => void</td>
        <td style=font-size:10px>Method of clearing conversation local messages.</td>
    </tr>
</table>

## useAddressContext

This custom hook can return contact and group related data and methods of managing data.

### Usage example

```javascript
import React from "react";
import { useAddressContext } from "agora-chat-uikit";

const ChatAPP = () => {
  const { appUsersInfo } = useAddressContext();
  console.log(appUsersInfo);
  return <div>ChatAPP</div>;
};
```

### Overview of useAddressContext

<table>
    <tr>
        <td>Attribute/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>appUsersInfo</td>
        <td style=font-size:10px>Record&lt;string, AppUserInfo&gt;</td>
        <td style=font-size:10px>Information for all users.</td>
    </tr> 
    <tr>
        <td>groups</td>
        <td style=font-size:10px>GroupItem[]</td>
        <td style=font-size:10px>All groups.</td>
    </tr> 
    <tr>
        <td style=color:blue>setAppUserInfo</td>
        <td style=font-size:10px>(appUsersInfo: Record&lt;string, AppUserInfo&gt;) => void</td>
        <td style=font-size:10px>Method of setting user information.</td>
    </tr>
    <tr>
        <td style=color:blue>setGroups</td>
        <td style=font-size:10px> (groups: GroupItem[]) => void</td>
        <td style=font-size:10px>Method of setting group data.</td>
    </tr>
    <tr>
        <td style=color:blue>setGroupMemberAttributes</td>
        <td style=font-size:10px>(groupId: string, userId: string, attributes: AgoraChat.MemberAttributes) => void</td>
        <td style=font-size:10px>Method of setting group member attributes.</td>
    </tr>
</table>

## useThreadContext

This custom hook can return thread related data and methods of managing data.

### Usage example

```javascript
import React from "react";
import { useThreadContext } from "agora-chat-uikit";

const ChatAPP = () => {
  const { currentThread, threadList } = useThreadContext();
  console.log(threadList);
  return <div>ChatAPP</div>;
};
```

### Overview of useThreadContext

<table>
    <tr>
        <td>Attribute/Method</td>
        <td>Type</td>
        <td>Description</td>
    </tr> 
    <tr>
        <td>currentThread</td>
        <td style=font-size:10px>CurrentThread</td>
        <td style=font-size:10px>The current thread.</td>
    </tr>
    <tr>
        <td>threadList</td>
        <td style=font-size:10px>{
        [key: string]: (AgoraChat.ChatThreadDetail & {
        members?: string[] | undefined;
        })[];
        }
        </td>
        <td style=font-size:10px>object of all threads.</td>
    </tr> 
    <tr>
        <td>threadVisible</td>
        <td style=font-size:10px>boolean</td>
        <td style=font-size:10px>Is the thread panel visible.</td>
    </tr> 
    <tr>
        <td style=color:blue>setCurrentThread</td>
        <td style=font-size:10px>(thread: CurrentThread) => void</td>
        <td style=font-size:10px>Method of setting the current thread.</td>
    </tr>
    <tr>
        <td style=color:blue>setThreadVisible</td>
        <td style=font-size:10px> (visible: boolean) => void</td>
        <td style=font-size:10px>Method of setting whether the thread is visible.</td>
    </tr>
    <tr>
        <td style=color:blue>getGroupChatThreads</td>
        <td style=font-size:10px>(parentId: string, cursor?: string | undefined) => Promise&lt;string | null&gt;</td>
        <td style=font-size:10px>Method of getting all threads in the specified group.</td>
    </tr>
    <tr>
        <td style=color:blue>getThreadMembers</td>
        <td style=font-size:10px>(parentId: string, threadId: string) => Promise&lt;string[]&gt;</td>
        <td style=font-size:10px>Method of getting the users in the specified thread.</td>
    </tr>
    <tr>
        <td style=color:blue>removeChatThreadMember</td>
        <td style=font-size:10px>(parentId: string, threadId: string, userId: string) => Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of removing a member from thread.</td>
    </tr>
    <tr>
        <td style=color:blue>getCurrentChatThreadDetail</td>
        <td style=font-size:10px>(threadId: string) => Promise&lt;void&gt;</td>
        <td style=font-size:10px>Method of getting current thread details.</td>
    </tr>
</table>
