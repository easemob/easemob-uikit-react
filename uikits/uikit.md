# Agora ui kits

## introduce

Agora ui kits are a library of communication UI kits, including chat, conversations, search, address books, and more. These kits allow customization and sub-kits at a smaller level. At the same time, it also provides the corresponding provider to manage data. The provider automatically monitors SDK events to update data and drive UI update.

## function

<table>
    <tr>
        <td>module</td>
        <td>function</td>
        <td>description</td>
    </tr>
   <tr>
      <td rowspan="6" style=font-weight:bold>Conversation list</td>
   </tr>
   <tr>
      <td>Conversation list</td>
      <td style=font-size:10px>The conversation list displays the profile picture, nickname, latest message content, unread message reminder, and time</td>
   </tr>
   <tr>
      <td>No disturbing</td>
      <td style=font-size:10px>New messages are not displayed after this function is enabled</td>
   </tr>
   <tr>
      <td>top</td>
      <td style=font-size:10px>Pin the conversation to the top of the list</td>
   </tr>
   <tr>
      <td>Deleting a conversation</td>
      <td style=font-size:10px>Deletes the conversation from the conversation list</td>
   </tr>
   <tr>
      <td>System message notification</td>
      <td style=font-size:10px>Friend requests, group requests, etc</td>
   </tr>
    <tr>
      <td rowspan="6" style=font-weight:bold>Chat</td>
   </tr>
   <tr>
      <td>Message editor</td>
      <td style=font-size:10px>Input message content, support emoticons、picture、file voice、audio and video call</td>
   </tr>
   <tr>
      <td>Message display</td>
      <td style=font-size:10px>Displays single and group chat messages, including profile picture, nickname, message content, time, sent status, and read status. Messages include text, emoticons、picture、file, picture, video, file, voice, notification message, and custom message</td>
   </tr>
   <tr>
      <td>Recall a message</td>
      <td style=font-size:10px>Sent messages can be recalled within 2 minutes by default</td>
   </tr>
   <tr>
      <td>Reaction</td>
      <td style=font-size:10px>Add emoticon replies to messages</td>
   </tr>
   <tr>
      <td>Information card</td>
      <td style=font-size:10px>Click your profile picture to display your friend's information card and you can send your friend's personal business card information</td>
   </tr>
   <tr>
      <td rowspan="6" style=font-weight:bold>Address book</td>
   </tr>
   <tr>
      <td>Information card</td>
      <td style=font-size:10px>Click your profile picture to display your friend's information card</td>
   </tr>
   <tr>
      <td>Delete friends</td>
      <td style=font-size:10px>Delete a friend from the address book</td>
   </tr>
   <tr>
      <td>Block friends</td>
      <td style=font-size:10px>Add a friend to the block list</td>
   </tr>
   <tr>
      <td>Group list</td>
      <td style=font-size:10px>Displays the groups that you have joined</td>
   </tr>
   <tr>
      <td>Block list</td>
      <td style=font-size:10px>Displays the block list. You can remove friends from the block list</td>
   </tr>
   <tr>
      <td rowspan="3" style=font-weight:bold>Personal information</td>
   </tr>
   <tr>
      <td>Edit personal information</td>
      <td style=font-size:10px>You can edit profile picture, nickname, phone number, birthday, email, signature and other personal information</td>
   </tr>
</table>

## Component

<table>
    <tr>
        <td>component</td>
        <td>description</td>
        <td>parameter</td>
    </tr> 
   <tr>
      <td style=font-weight:bold>Provider</td>
      <td style=font-size:10px>The Provider does not render any UI but only provides global context for components. It automatically listens to SDK events, transmits data downward, and drives component rendering</td>
      <td style=font-size:10px>
      initOptions: Initialization parameters, such as appKey, useId, token, etc  <br/>
      localeConfig: Set localization language <br/>
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>ConversationList</td>
      <td style=font-size:10px>Conversation list component</td>
      <td style=font-size:10px>
      currentConversation: Set current conversation <br/>
      onConversationClick: Click event of the conversation <br/>
      onConversationDeleteClick: Delete conversation event <br/>
      onConversationMuteChange: Conversation disturbing state change event <br/>
      onAvatarClick: Click the conversation avatar event <br/>
      renderConversationEmpty: Customize what happens when the list of rendering conversations is empty <br/>
      renderP2pConversation: Customize the conversation of rendering single chat <br/>
      renderGroupConversation: Customize the conversation of rendering group chat <br/>
      renderLastMessage: Custom rendering conversation last message <br/>
      renderContactAvatar: Custom rendering of single chat session avatar <br/>
      renderContactName: Custom rendering single chat session name <br/>
      renderGroupAvatar: Custom rendering group chat session avatar <br/>
      renderGroupName: Custom rendering group chat session name <br/>
      ((options: { session: ISession; }) => Element | null)<br/>
      prefix：Style prefix<br/>
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>ContactList</td>
      <td style=font-size:10px>Address Book Component(Not necessarily in this period)</td>
      <td style=font-size:10px>
      onFriendItemClick: Click a friend's event <br/>
      onGroupItemClick: Click group event <br/>
      onBlackItemClick: Click block list member event <br/>
      renderContactEmpty: Customize rendering content without contacts <br/>
      renderHeader: Customize rendering the top content of the address book <br/>
      renderCustomContact: Custom Render Contact Component <br/>
      className: Component class <br/>
      prefix: Style prefix<br/>
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>UserProfile</td>
      <td style=font-size:10px>Personal information component</td>
      <td style=font-size:10px>
      Personal information editable items:
      [{
         field: string;
         visible?: boolean;
         disabled?: boolean;
         value?: string|number;
         onChange?: (e: MouseEvent) => void;
         onBlur?: (e: MouseEvent) => void
      }]
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>Chat</td>
      <td style=font-size:10px>Chat component</td>
      <td style=font-size:10px>
      renderHeader: Custom render chat header method <br/>
      renderMessage: Custom Render Message Method <br/>
      renderMessageEditor: Custom Render Message Sender Method <br/>
      renderEmpty: Customize what to render without messages <br/>
      renderInputPlaceHolder: Custom render message input box placeholder<br/>
      onMessageClick: Click Message Event <br/>
      onMessageAvatarClick: Click the message header event <br/>
      actions: Configuration of various function buttons in the message editor
      <ul>
         <li>action: Button type. Built-in types include emoji, sendImg and sendFile. If you need to customize, please use a custom action name</li>
         <li>visible：boolean，Whether to display this button is true by default</li>
         <li>render: (props: ActionRenderProps) => ReactNode}，Custom rendering, if not, use the default rendering method</li>
      </ul>
      className: Component class<br/>
      prefix: Style prefix<br/>
      </td>
   </tr>
</table>

## Usage examples

In addition to Chat、ConversationList、ContactList components, it also provides a smaller range of sub-components

```jsx
import { Provider, ConversationList, ContactList, Chat, Message, MessageEditor } from 'agora-chat-uikit';

<Provider initOptions={{}}>
    <div>
        <ConversationList
            currentConversation={chatType: 'singleChat', conversationId: 'tom'}
            renderContactEmpty={() => <span>no contact</span>}
        />
    </div>
    <div>
        <Chat
            renderHeader={() => <h1>header</h1>}
            renderMessage={(message) => (<Message style={{ color: 'red' }}>{message}</Message>
                )}
            renderMessageEditor={() => <MessageEditor style={{ height: '200px' }}>}
        />
    </div>
    <div>
        <ContactList/>
    </div>
</Provider>;
```

## Apis

Use provider to provide api,
enables users to customize implementation components

`sendMessage`: Send a message
`recallMessage` Recall a message
`setCurrentConversation`: Set current conversation
`login`
`logout`

example:

```JSX
<CustomMessageEditor onSendMessage={(msg)=> sendMessage(msg)}>
```
