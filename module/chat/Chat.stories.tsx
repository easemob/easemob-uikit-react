import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import Chat, { ChatProps } from './index';
import rootStore from '../store';
import Provider from '../store/Provider';
import { HeaderProps } from '../header';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    chat: `Chat is a chat page component that includes Header, MessageList, and MessageInput components, providing the following functions:

- Sending and receiving messages, including text, emojis, pictures, voice, video, files, business cards, and combining multiple types of messages.
- Operations for responding to messages with emojis, citations, retractions, deletions, translations, and edits.
- Clearing local messages.
- Deleting a conversation.
- Pulling historical messages.`,
    prefix: 'Prefix',
    className: 'Class name',
    style: 'Style',
    headerProps: 'props for Header',
    messageListProps: 'props for MessageList',
    messageInputProps: 'props for MessageInput',
    rtcConfig:
      'Audio and video call related configurations, after configuring this parameter, the audio and video call buttons will be displayed in the header',
    onOpenThread: 'Callback of opening thread',
    onVideoCall: 'Callback of starting a video call',
    onAudioCall: 'Callback of starting an audio call',
    renderHeader: 'Render header',
    renderMessageList: 'Render message list',
    renderMessageInput: 'Render message input',
    renderRepliedMessage: 'Render replied message',
    renderEmpty: 'The content displayed when rendering an empty conversation',
    'rtcConfig.appId': 'Agora appId',
    'rtcConfig.agoraUid': 'rtc user ID',
    'rtcConfig.onInvite': `In the group, when starting an audio and video call, clicking the call button will trigger this callback function. This function needs to return a promise containing the information of the invited person, id is the Chat user ID, name is the user nickname to be displayed`,
    'rtcConfig.onAddPerson':
      'Invite other people to join the audio and video call in the group chat, and return a promise containing the information of the invited person, id is the Chat user ID',
    'rtcConfig.getIdMap': `Provide a function to get the mapping of current channel rtc user ID and Chat user ID, this function needs to return {[rtcUserId]: chatUserId}`,
    'rtcConfig.onStateChange': 'Callback function for audio and video call status change',
    'rtcConfig.onRing': 'Callback when being called, you can play a ringtone',
    'rtcConfig.getRTCToken': `Provide a function, receive channel and chatUserId, and return the Agora user ID and the token to join the channel`,
    'rtcConfig.groupAvatar': 'Avatar for group audio and video calls',
    useCallkit: 'Whether to use Callkit',
    callkitProps: 'Callkit props',
  },
  zh: {
    chat: `Chat 是聊天页面组件，包含了 Header, MessageList, MessageInput 三个组件，提供了以下功能:
 - 发送和接收消息, 包括文本，表情，图片，语音，视频，文件，名片，合并类型的消息。
 - 对消息进行表情回复，引用，撤回，删除，翻译，编辑的操作。
 - 清除本地消息。
 - 删除会话。
 - 拉历史消息。`,
    prefix: '组件类名前缀',
    className: '组件类名',
    style: '组件样式',
    headerProps: 'Header 组件的参数',
    messageListProps: 'MessageList 组件的参数',
    messageInputProps: 'MessageInput 组件的参数',
    rtcConfig: '音视频通话相关配置，配置了这个参数后，会在头部显示音视频通话按钮',
    onOpenThread: '打开子区域的回调',
    onVideoCall: '发起视频通话的回调',
    onAudioCall: '发起音频通话的回调',
    renderHeader: '渲染头部',
    renderMessageList: '渲染消息列表',
    renderMessageInput: '渲染消息输入框',
    renderRepliedMessage: '渲染回复消息',
    renderEmpty: '渲染空会话时展示的内容',
    'rtcConfig.appId': '声网 appId',
    'rtcConfig.agoraUid': 'rtc 用户 ID',
    'rtcConfig.onInvite':
      '群组中发起音视频通话, 点击呼叫按钮时触发这个回调函数，这个函数需要返回一个promise 包含被邀请人信息，id 为Chat用户 ID，name 为要显示的用户昵称',
    'rtcConfig.onAddPerson':
      '群聊音视频过程中邀请其他人加入音视频通话, 需要返回一个promise 包含被邀请人信息， id 为Chat用户 ID',
    'rtcConfig.getIdMap':
      '提供一个函数获取当前channel rtc 用户 ID 和Chat用户 ID 的映射，这个函数需要返回{[rtcUserId]: chatUserId}',
    'rtcConfig.onStateChange': '音视频通话状态变化的回调函数',
    'rtcConfig.onRing': '被呼叫时的回调 可以播放铃声',
    'rtcConfig.getRTCToken': `提供一个函数，接收 channel和chatUserId, 能返回声网用户 ID 和 加入channel的token`,
    'rtcConfig.groupAvatar': '群聊音视频通话时的头像',
    useCallkit: '是否使用 Callkit',
    callkitProps: 'Callkit 参数',
  },
};
export default {
  title: 'Container/Chat',
  component: Chat,
  parameters: {
    docs: {
      description: {
        component: description[lang].chat,
      },
    },
  },
  argTypes: {
    prefix: {
      control: 'text',
      description: description[lang].prefix,
      default: 'cui',
      type: 'string',
    },
    className: {
      control: 'text',
      description: description[lang].className,
      type: 'string',
    },
    style: {
      control: 'object',
      description: description[lang].style,
    },
    headerProps: {
      control: 'object',
      description: description[lang].headerProps,
    },
    messageListProps: {
      control: 'object',
      description: description[lang].messageListProps,
    },
    messageInputProps: {
      control: 'object',
      description: description[lang].messageInputProps,
    },
    onOpenThread: {
      type: 'function',
      description: description[lang].onOpenThread,
    },
    onVideoCall: {
      type: 'function',
      description: description[lang].onVideoCall,
    },
    onAudioCall: {
      type: 'function',
      description: description[lang].onAudioCall,
    },
    renderHeader: {
      type: 'function',
      // action: 'renderHeader',
      description: description[lang].renderHeader,
    },
    renderMessageList: {
      type: 'function',
      description: description[lang].renderMessageList,
    },
    renderMessageInput: {
      type: 'function',
      description: description[lang].renderMessageInput,
    },
    renderRepliedMessage: {
      type: 'function',
      description: description[lang].renderRepliedMessage,
    },
    renderEmpty: {
      type: 'function',
      description: description[lang].renderEmpty,
    },
    useCallkit: {
      control: 'boolean',
      description: description[lang].useCallkit,
    },
    callkitProps: {
      control: 'object',
      description: description[lang].callkitProps,
    },
  },
} as Meta<React.FC<ChatProps>>;

rootStore.conversationStore.setCurrentCvs({
  chatType: 'singleChat',
  conversationId: 'zd2',
  name: 'Henry',
});

const DefaultTemplate: StoryFn<React.FC<ChatProps>> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'light',
      }}
    >
      <Chat {...(args as ChatProps)} />
    </Provider>
  </div>
);

const DarkTemplate: StoryFn<React.FC<ChatProps>> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'dark',
      }}
    >
      <Chat {...(args as ChatProps)} />
    </Provider>
  </div>
);

const SquareTemplate: StoryFn<React.FC<ChatProps>> = args => (
  <div style={{ height: '500px' }}>
    <Provider
      initConfig={{
        appKey: 'a#b',
      }}
      theme={{
        mode: 'light',
        avatarShape: 'square',
        bubbleShape: 'square',
        componentsShape: 'square',
      }}
    >
      <Chat {...(args as ChatProps)} />
    </Provider>
  </div>
);

export const Default = {
  render: DefaultTemplate,
};
export const Dark = {
  render: DarkTemplate,
};
export const Square = {
  render: SquareTemplate,
};
