import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import MessageStore from './MessageStore'; // 假设这是一个导出的类或对象
import Provider from '../store/Provider';

// 添加中文和英文的描述
const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    message: 'Message data',
    selectedMessage: 'Selected message data',
    currentCVS: 'Current conversation',
    repliedMessage: 'Message being replied to',
    typing: 'Typing status of the current conversation',
    holding:
      'Holding status of the current conversation, holding status will prevent the list from scrolling when new messages arrive',
    unreadMessageCount:
      'Unread message count of the current conversation, when the conversation is in holding status, the unread message count will be increased',
    setCurrentCVS: 'Set the current conversation',
    sendMessage: 'Send a message, the message will be added to the message list after sending',
    receiveMessage: 'Receive a message, the message will be added to the message list',
    modifyMessage: 'Modify a message',
    sendChannelAck: 'Send a channel ack, the channel ack will be sent after the message is read',
    updateMessageStatus: 'Update message status',
    clearMessage: 'Clear messages for a conversation',
    setRepliedMessage: 'Set the replied message',
    addReaction: 'Add a reaction to a message',
    deleteReaction: 'Delete a reaction from a message',
    updateReactions: 'Update reactions for a message',
    recallMessage: 'Recall a message',
    modifyLocalMessage: 'Modify a local message',
    modifyServerMessage: 'Re-edit a message, only text messages are supported',
    translateMessage: 'Translate a message, only text messages are supported',
    setSelectedMessage: 'Set the selected message, selected messages can be deleted or forwarded',
    setTyping: 'Set the typing status of the current conversation',
    sendTypingCmd:
      'Send typing command, the other party will receive it and display that you are typing',
    clear: 'Clear all message data',
    deleteMessage: 'Delete a message',
    setHoldingStatus: 'Set holding status',
    setUnreadMessageCount: 'Set unread message count when holding',
    shiftBroadcastMessage: 'Shift broadcast message',
    setKeyValue: 'Set a key-value pair in message map',
    MessageStore:
      'MessageStore is a data store that manages messages, their statuses, and related actions.',
    message_broadcast: 'Chat room broadcast message',
    message_singleChat: 'Single chat message',
    message_groupChat: 'Group chat message',
    message_chatRoom: 'Chat room message',
    message_byId: 'Message map',
  },
  zh: {
    message: '消息数据',
    selectedMessage: '选中的消息数据',
    currentCVS: '当前会话',
    repliedMessage: '被引用的消息',
    typing: '当前会话是否在输入状态',
    holding: '当前会话是否处于保持状态，保持状态会阻止来新消息时列表的滚动',
    unreadMessageCount: '当前会话处于holding状态时，未读消息计数',
    setCurrentCVS: '设置当前会话',
    sendMessage: '发送消息， 发送后的消息会进入消息列表',
    receiveMessage: '接收消息， 接收到的消息会进入消息列表',
    modifyMessage: '修改消息',
    sendChannelAck: '发送会话已读回执',
    updateMessageStatus: '更新消息状态',
    clearMessage: '清除会话的消息',
    setRepliedMessage: '设置回复的消息',
    addReaction: '为消息添加表情回复',
    deleteReaction: '删除消息的某个表情回复',
    updateReactions: '更新消息的反应',
    recallMessage: '撤回消息',
    modifyLocalMessage: '修改本地消息',
    modifyServerMessage: '重新编辑消息，只支持文本消息',
    translateMessage: '翻译消息，只支持文本消息',
    setSelectedMessage: '设置选中的消息，选中后可以进行消息的删除，合并转发操作',
    setTyping: '设置当前会话对方是否在输入状态',
    sendTypingCmd: '发送输入命令，对方收到后会显示你正在输入状态',
    clear: '清除所有消息数据',
    deleteMessage: '删除消息',
    setHoldingStatus: '设置当前会话是否处于保持状态',
    setUnreadMessageCount: '设置处于holding状态时的未读消息计数',
    shiftBroadcastMessage: '移除广播消息',
    setKeyValue: '在消息映射中设置键值对',
    MessageStore: 'MessageStore 是一个管理消息、其状态和相关操作的数据仓库。',
    message_broadcast: '聊天室广播消息',
    message_singleChat: '单聊消息',
    message_groupChat: '群聊消息',
    message_chatRoom: '聊天室消息',
    message_byId: '消息映射',
  },
};

// 假设我们有一个简单的组件来展示MessageStore的内容
const MessageStoreComponent = () => {
  return (
    <div>
      <Provider
        initConfig={{
          appKey: 'a#b',
        }}
      >
        <div>{description[lang].MessageStore}</div>
      </Provider>
    </div>
  );
};

export default {
  title: 'Store/MessageStore',
  component: MessageStoreComponent,
  argTypes: {
    message: {
      control: 'object',
      description: description[lang].message,
      table: {
        type: {
          summary: 'object',
          detail: `{
    singleChat: Record<string, ChatSDK.MessageBody[]>; // ${description[lang].message_singleChat}
    groupChat: Record<string, ChatSDK.MessageBody[]>; // ${description[lang].message_groupChat}
    chatRoom: Record<string, ChatSDK.MessageBody[]>; // ${description[lang].message_chatRoom}
    byId: Map<string, ChatSDK.MessageBody>; // ${description[lang].message_byId}
    broadcast: ChatSDK.MessageBody[]; // ${description[lang].message_broadcast}
}`,
        },
        defaultValue: { summary: '{}' },
      },
    },
    currentCVS: {
      control: 'object',
      description: description[lang].currentCVS,
      table: {
        type: { summary: 'object', detail: '{conversationId: string, chatType: ChatType}' },
        defaultValue: { summary: '{}' },
      },
    },
    repliedMessage: {
      control: 'object',
      description: description[lang].repliedMessage,
      table: {
        type: { summary: 'ChatSDK.MessageBody | null' },
        defaultValue: { summary: 'null' },
      },
    },
    typing: {
      control: 'boolean',
      description: description[lang].typing,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    holding: {
      control: 'boolean',
      description: description[lang].holding,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    unreadMessageCount: {
      control: 'number',
      description: description[lang].unreadMessageCount,
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    selectedMessage: {
      control: 'object',
      description: description[lang].selectedMessage,
      table: {
        type: {
          summary: 'object',
          detail: `{
    singleChat: Record<string, ChatSDK.MessageBody>;
    groupChat: Record<string, ChatSDK.MessageBody>;
}`,
        },
        defaultValue: { summary: '{}' },
      },
    },
    setCurrentCVS: {
      description: description[lang].setCurrentCVS,
      table: {
        type: { summary: 'function', detail: '(cvs: CurrentConversation) => void' },
      },
      control: 'function',
    },
    sendMessage: {
      description: description[lang].sendMessage,
      table: {
        type: { summary: 'function', detail: '(message: ChatSDK.MessageBody) => Promise<void>' },
      },
      control: 'function',
    },
    receiveMessage: {
      description: description[lang].receiveMessage,
      table: {
        type: { summary: 'function', detail: '(message: ChatSDK.MessageBody) => void' },
      },
      control: 'function',
    },
    modifyMessage: {
      description: description[lang].modifyMessage,
      table: {
        type: { summary: 'function', detail: '(id: string, message: ChatSDK.MessageBody) => void' },
      },
      control: 'function',
    },
    sendChannelAck: {
      description: description[lang].sendChannelAck,
      table: {
        type: { summary: 'function', detail: '(cvs: CurrentConversation) => Promise<void>' },
      },
      control: 'function',
    },
    updateMessageStatus: {
      description: description[lang].updateMessageStatus,
      table: {
        type: { summary: 'function', detail: '(msgId: string, status: string) => void' },
      },
      control: 'function',
    },
    clearMessage: {
      description: description[lang].clearMessage,
      table: {
        type: { summary: 'function', detail: '(cvs: CurrentConversation) => void' },
      },
      control: 'function',
    },
    setRepliedMessage: {
      description: description[lang].setRepliedMessage,
      table: {
        type: { summary: 'function', detail: '(message: ChatSDK.MessageBody | null) => void' },
      },
      control: 'function',
    },
    addReaction: {
      description: description[lang].addReaction,
      table: {
        type: { summary: 'function', detail: '(msgId: string, reaction: string) => void' },
      },
      control: 'function',
    },
    deleteReaction: {
      description: description[lang].deleteReaction,
      table: {
        type: { summary: 'function', detail: '(msgId: string, reaction: string) => void' },
      },
      control: 'function',
    },
    recallMessage: {
      description: description[lang].recallMessage,
      table: {
        type: { summary: 'function', detail: '(msgId: string) => void' },
      },
      control: 'function',
    },
    modifyServerMessage: {
      description: description[lang].modifyServerMessage,
      table: {
        type: {
          summary: 'function',
          detail: '(msgId: string, message: ChatSDK.MessageBody) => void',
        },
      },
      control: 'function',
    },
    translateMessage: {
      description: description[lang].translateMessage,
      table: {
        type: { summary: 'function', detail: '(msgId: string, targetLang: string) => void' },
      },
      control: 'function',
    },
    setSelectedMessage: {
      description: description[lang].setSelectedMessage,
      table: {
        type: {
          summary: 'function',
          detail: '({selectable: boolean, selectedMessage: ChatSDK.MessageBody[]}) => void',
        },
      },
      control: 'function',
    },
    setTyping: {
      description: description[lang].setTyping,
      table: {
        type: { summary: 'function', detail: '(typing: Typing) => void' },
      },
      control: 'function',
    },
    sendTypingCmd: {
      description: description[lang].sendTypingCmd,
      table: {
        type: { summary: 'function', detail: '(cvs: CurrentConversation) => void' },
      },
      control: 'function',
    },
    deleteMessage: {
      description: description[lang].deleteMessage,
      table: {
        type: { summary: 'function', detail: '(msgId: string) => void' },
      },
      control: 'function',
    },
    setHoldingStatus: {
      description: description[lang].setHoldingStatus,
      table: {
        type: { summary: 'function', detail: '(holding: boolean) => void' },
      },
      control: 'function',
    },
    setUnreadMessageCount: {
      description: description[lang].setUnreadMessageCount,
      table: {
        type: { summary: 'function', detail: '(count: number) => void' },
      },
      control: 'function',
    },
    shiftBroadcastMessage: {
      description: description[lang].shiftBroadcastMessage,
      table: {
        type: { summary: 'function', detail: '() => void' },
      },
      control: 'function',
    },
  },
} as Meta<typeof MessageStoreComponent>;

const Template: StoryFn<typeof MessageStoreComponent> = args => <MessageStoreComponent />;

export const Default = {
  render: Template,
  args: {
    // 根据实际的MessageStore属性和方法设置默认参数
  },
};
