# 聊天页面介绍

环信单群聊 UIKit 提供 `Chat` 组件方便用户快速集成聊天页面和自定义聊天页面。该页面提供如下功能：

- 发送和接收消息，包括文本、表情、图片、语音、视频、文件和名片消息。
- 对消息进行复制、引用、撤回、删除、编辑、重新发送和审核。
- 清除本地消息。

## 页面组件

聊天页面通过 `Chat` 组件实现，由标题栏（`Header`）、消息列表（`MessageList`）和底部输入框（`MessageInput`）组成。

### 标题栏

聊天页面的标题栏使用 `Header` 组件，支持自定义标题、头像、副标题、右侧操作按钮等。详见 [设置标题栏](#设置标题栏)。

### 消息列表

消息列表 `MessageList` 用于展示发送和接收的消息，以及对消息进行操作：

- **发送和接收消息**：包括文本、表情、图片、语音、视频、文件和名片等消息。
- **消息操作**：对消息进行复制、引用、撤回、删除、编辑、重新发送、举报、翻译、转发、多选、置顶操作。

### 底部输入框

消息底部输入框 `MessageInput` 实现各类消息的输入和发送以及表情等功能，包括两部分：

- 底部输入菜单：输入和发送文本和语音消息、添加表情以及扩展功能等。
- 消息扩展菜单：发送附件类型消息，例如，图片、视频、文件以及自定义类型消息（如名片消息）等。

## 使用示例

```jsx
import React from 'react';
import { Chat } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const ChatContainer = () => {
  return (
    <div style={{ width: '70%', height: '100%' }}>
      <Chat />
    </div>
  );
};
```

## 高级设置

## 消息列表的设置

消息列表是聊天界面的核心组件，基于 `MessageList` 组件实现。本文介绍如何通过 `Chat` 组件的 `messageListProps` 实现消息列表和消息条目的设置。

### 概述

`Chat` 组件提供了 `messageListProps` 属性，方便开发者进行一些自定义设置，目前提供的设置项如下：

```jsx
<Chat
  messageListProps={{
    // 使用 customRenderers API 自定义渲染消息
    customRenderers: {
      txt: ctx => <CustomTextMessage message={ctx.message} />,
    },
    // 自定义用户信息渲染
    renderUserProfile: props => <CustomUserProfile {...props} />,
    // 消息属性配置
    messageProps: {
      // 自定义操作菜单
      customAction: {
        visible: true,
        actions: [
          { content: 'FORWARD' },
          { content: 'REPLY' },
          { content: 'UNSEND' },
          // ...
        ],
      },
      // 消息时间格式化
      formatDateTime: time => new Date(time).toLocaleString(),
      // 其他配置...
    },
  }}
/>
```

### 设置消息列表背景

通过 `Chat` 组件的 `className` 和 `style` 属性可以设置聊天界面的背景：

```jsx
<Chat
  className="custom-chat"
  style={{
    backgroundImage: 'url(/path/to/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
/>
```

或使用 CSS 类：

```css
.custom-chat {
  background-image: url(/path/to/background.jpg);
  background-size: cover;
  background-position: center;
}
```

### 设置消息列表空白页面

通过 `Chat` 组件的 `renderEmpty` 属性可以自定义空内容组件：

```jsx
<Chat
  renderEmpty={() => (
    <div className="empty-chat">
      <p>暂无消息</p>
    </div>
  )}
/>
```

### 设置消息条目

对于消息条目，你可以进行自定义设置，例如：

- 添加自定义消息条目
- 设置默认的头像和昵称及其样式
- 设置消息气泡
- 设置消息日期
- 设置长按消息菜单
- 设置消息事件监听

#### 添加自定义消息条目

你可以自定义消息条目的内容，即各种消息类型的自定义消息布局。

使用 `customRenderers`

```jsx
import { Chat, MessageList } from 'easemob-chat-uikit';

const CustomTextMessage = ({ message }) => {
  return (
    <div className="custom-text-message">
      <div>{message.msg}</div>
    </div>
  );
};

<Chat
  messageListProps={{
    customRenderers: {
      txt: ctx => <CustomTextMessage message={ctx.message} />,
      custom: ctx => {
        // 处理自定义消息类型
        if (ctx.message.customEvent === 'CARD') {
          return <CustomCardMessage message={ctx.message} />;
        }
        return null;
      },
    },
  }}
/>;
```

#### 设置头像和昵称

设置消息中显示的头像，[参见](https://github.com/easemob/easemob-uikit-react/wiki/%E5%A4%B4%E5%83%8F%E6%98%B5%E7%A7%B0)

你可以通过 `messageProps` 设置点击头像显示的个人信息：

```jsx
<Chat
  messageListProps={{
    messageProps: {
      // 自定义用户信息渲染
      renderUserProfile: props => {
        return (
          <div>
            <Avatar src={props.avatar} />
            <span>{props.nickname}</span>
          </div>
        );
      },
    },
  }}
/>
```

#### 设置消息气泡

你可以通过自定义消息组件来设置消息气泡样式：

```jsx
import { TextMessage } from 'easemob-chat-uikit';

<Chat
  messageListProps={{
    customRenderers: {
      txt: ctx => (
        <TextMessage
          textMessage={ctx.message}
          bubbleStyle={{
            background: '#your-color',
            borderRadius: '8px',
          }}
          shape="square" // 或 "round"
        />
      ),
    },
  }}
/>;
```

或通过 CSS 类名自定义：

```css
.cui-message-base-content {
  background: #your-color;
  border-radius: 8px;
}
```

#### 设置消息时间

你可以设置消息的发送和接收时间的格式和样式。

**设置消息时间格式**

```jsx
<Chat
  messageListProps={{
    messageProps: {
      formatDateTime: (time: number) => {
        // 自定义显示日期和时间
        const date = new Date(time);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
          return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleString('zh-CN');
      },
    },
  }}
/>
```

**设置消息时间样式**

通过 CSS 类名自定义时间样式：

```css
.cui-message-base-time {
  color: #999;
  font-size: 12px;
}
```

#### 设置消息状态

**设置隐藏消息状态**
```jsx
<Chat
  messageListProps={{
    messageProps: {
      messageStatus: false
    },
  }}
/>
```

**设置消息状态是文本还是图标**

```jsx
<Chat
  messageListProps={{
    messageProps: {
      messageStatusType: 'icon' // icon 或者 text
    },
  }}
/>
```


### 设置消息菜单

在消息列表中长按任意消息，即可弹出操作菜单，支持复制、回复、转发、置顶、多选、翻译、创建话题等丰富功能。

你可以通过 `messageProps.customAction` 来配置菜单项， 可以删除不需要的功能，或者添加自定义的功能：

```jsx
<Chat
  messageListProps={{
    messageProps: {
      customAction: {
        visible: true,
        icon: null,
        actions: [
          {
            // 展示单条转发
            content: 'FORWARD',
            onClick: () => {
              console.log('转发消息');
            },
          },
          {
            // 展示消息引用
            content: 'REPLY',
            onClick: () => {
              console.log('引用消息');
            },
          },
          {
            // 展示消息撤回
            content: 'UNSEND',
            onClick: () => {
              console.log('撤回消息');
            },
          },
          {
            // 展示消息编辑
            content: 'Modify',
            onClick: () => {
              console.log('编辑消息');
            },
          },
          {
            // 展示消息多选
            content: 'SELECT',
            onClick: () => {
              console.log('多选消息');
            },
          },
          {
            // 展示消息固定
            content: 'PIN',
            onClick: () => {
              console.log('固定消息');
            },
          },
          {
            // 展示消息翻译
            content: 'TRANSLATE',
            onClick: () => {
              console.log('翻译消息');
            },
          },
          {
            // 展示消息举报
            content: 'REPORT',
            onClick: () => {
              console.log('举报消息');
            },
          },
          {
            // 展示消息删除
            content: 'DELETE',
            onClick: () => {
              console.log('删除消息');
            },
          },
          {
            // 自定义按钮
            content: '自定义按钮',
            icon: <Icon type="STAR" />,
            onClick: () => {
              console.log('自定义操作');
            },
          },
        ],
      },
    },
  }}
/>
```

### 设置事件监听

通过 `messageProps` 可设置消息条目的各类交互事件监听：

```jsx
<Chat
  messageListProps={{
    messageProps: {
      // 消息气泡点击事件
      onClick: message => {
        console.log('点击消息气泡', message);
      },
    },
  }}
/>
```

### 设置消息发送回调

你可以通过 `messageInputProps` 设置消息发送后回调和消息发送前回调监听。

```jsx
<Chat
  messageInputProps={{
    // 消息发送后回调
    onSendMessage: message => {
      console.log('消息已发送', message);
    },
    // 消息发送前回调，返回 Promise，resolve 则发送，reject 则不发送
    onBeforeSendMessage: async message => {
      // 可以在这里添加扩展字段
      message.customExts = {
        ...message.customExts,
        customField: 'customValue',
      };
      return Promise.resolve();
    },
  }}
/>
```

## 设置底部输入框

消息底部输入框 `MessageInput` 实现各类消息的输入和发送以及表情等功能，包括两部分：

- 底部输入菜单：负责文本与语音消息的输入、发送，支持表情添加及常用功能扩展。
- 消息扩展菜单：提供附件类型消息的发送入口，支持发送图片、视频、文件，并可扩展至自定义消息类型（如名片消息等）。

### 设置底部输入框背景

```jsx
<Chat
  messageInputProps={{
    style: {
      backgroundColor: '#f5f5f5',
    },
  }}
/>
```

或使用 CSS：

```css
.cui-message-editor {
  background-color: #f5f5f5;
}
```

### 设置底部输入菜单

你可以获取 `MessageInput` 组件，对输入菜单进行自定义操作：

```jsx
import { Chat, MessageInput, Icon } from 'easemob-chat-uikit';

<Chat
  renderMessageInput={() => (
    <MessageInput
      // 配置输入框功能
      actions={[
        {
          name: 'RECORDER', // 发送语音功能
          visible: true,
        },
        {
          name: 'TEXTAREA', // 消息输入框
          visible: true,
        },
        {
          name: 'EMOJI', // 表情
          visible: true,
        },
        {
          name: 'MORE', // 更多操作
          visible: true,
        },
      ]}
      // 是否启用正在输入功能
      enabledTyping={true}
      // 是否展示发送按钮
      showSendButton={true}
      // 发送按钮 Icon
      sendButtonIcon={<Icon type="AIR_PLANE" />}
      // Input 行数
      row={1}
      // 默认占位符
      placeHolder="请输入内容"
      // 是否开启@功能
      enabledMention={true}
      // 发送消息的回调
      onSendMessage={message => {
        console.log('发送消息', message);
      }}
      // 消息发送前回调
      onBeforeSendMessage={async message => {
        // 可以在这里添加扩展字段
        message.customExts = {
          ...message.customExts,
          customField: 'customValue',
        };
        return Promise.resolve();
      }}
    />
  )}
/>;
```

#### 设置输入框默认文本

可通过 `MessageInput` 的 `placeHolder` 属性设置输入框占位文本：

```jsx
<Chat
  messageInputProps={{
    placeHolder: '请输入消息内容',
  }}
/>
```

#### 监听输入内容变化

```jsx
<Chat
  messageInputProps={{
    onChange: value => {
      console.log('输入内容变化', value);
    },
    onFocus: () => {
      console.log('输入框获得焦点');
    },
  }}
/>
```

#### 管理表情菜单

Web 端的表情菜单通过 `MessageInput` 组件的 `actions` 配置中的 `EMOJI` 项来控制显示/隐藏。表情数据由 UIKit 内部管理，开发者可以通过自定义渲染来扩展表情功能。

### 设置消息扩展菜单

消息扩展菜单提供发送附件类型消息（如图片、视频、文件）、位置消息以及自定义消息的快捷入口。点击底部输入菜单中的扩展图标（默认为加号）会弹出消息扩展菜单。

#### 管理扩展菜单项

你可以通过 `MessageInput` 的 `customActions` 来动态管理扩展菜单项：

```jsx
import { Chat, MessageInput, Icon } from 'easemob-chat-uikit';

<Chat
  renderMessageInput={() => (
    <MessageInput
      customActions={[
        {
          content: 'IMAGE',
          icon: <Icon type="IMAGE" />,
          onClick: () => {
            console.log('选择图片');
          },
        },
        {
          content: 'VIDEO',
          icon: <Icon type="VIDEO" />,
          onClick: () => {
            console.log('选择视频');
          },
        },
        {
          content: 'FILE',
          icon: <Icon type="FILE" />,
          onClick: () => {
            console.log('选择文件');
          },
        },
        {
          content: 'CARD',
          icon: <Icon type="CARD" />,
          onClick: () => {
            console.log('发送名片');
          },
        },
        {
          // 自定义菜单项
          content: 'CUSTOM',
          icon: <Icon type="STAR" />,
          onClick: () => {
            console.log('自定义操作');
          },
        },
      ]}
    />
  )}
/>;
```

## 设置标题栏

聊天页面的标题栏使用 `Header` 组件，你可以通过 `Chat` 组件的 `headerProps` 进行自定义设置。

### 标题栏可修改的属性

```jsx
<Chat
  headerProps={{
    // 标题内容
    content: '聊天标题',
    // 副标题
    subtitle: '在线',
    // 设置头像
    avatar: <img src="https://example.com/avatar.jpg" />, 
    // 头像地址
    avatarSrc: 'https://example.com/avatar.jpg',
    // 头像形状：'circle' | 'square'
    avatarShape: 'circle',
    // 是否显示返回按钮
    back: true,
    // 返回按钮点击事件
    onClickBack: () => {
      console.log('点击返回');
    },
    // 右侧自定义图标
    suffixIcon: [<Icon type="PIN" key="pin" />, <Icon type="VIDEO_CAMERA" key="video" />],
    // 更多操作菜单
    moreAction: {
      visible: true,
      actions: [
        {
          content: '清除消息',
          onClick: () => {
            console.log('清除消息');
          },
        },
        {
          content: '删除会话',
          onClick: () => {
            console.log('删除会话');
          },
        },
      ],
    },
    // 自定义渲染中间内容部分
    renderContent: () => {
      return <div>自定义标题内容</div>;
    },
    onClickAvatar: () => {
      // 点击头像事件
    },
    style={{
      background: '#ccc' // 设置背景颜色
    }}
  }}
/>
```

### 自定义渲染标题栏

你也可以通过 `renderHeader` 完全自定义标题栏：

```jsx
<Chat
  renderHeader={cvs => {
    return (
      <div className="custom-header">
        <div>{cvs.name || cvs.conversationId}</div>
        <div>自定义标题栏内容</div>
      </div>
    );
  }}
/>
```

## 自定义样式

### 可自定义的 CSS 类名

Chat 提供了以下主要的 CSS 类名，你可以通过覆盖这些类名来自定义样式：

| 类名                        | 说明           |
| :-------------------------- | :------------- |
| `.cui-chat`                 | 聊天页面容器   |
| `.cui-messageList`          | 消息列表       |
| `.cui-messageList-msgItem`  | 消息条目       |
| `.cui-message-base-content` | 消息气泡       |
| `.cui-message-base-time`    | 消息时间       |
| `.cui-message-editor`       | 消息输入框容器 |
| `.cui-header`               | 标题栏         |

## Chat props 总览

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `className` | `String` | 组件的类名 |
| `prefix` | `String` | CSS 类名前缀 |
| `style` | `React.CSSProperties` | 组件的内联样式 |
| `headerProps` | `HeaderProps` | Header 组件的参数 |
| `messageListProps` | `MsgListProps` | MessageList 组件的参数 |
| `messageInputProps` | `MessageInputProps` | MessageInput 组件的参数 |
| `renderHeader` | `(cvs: CurrentCvs) => React.ReactNode` | 自定义渲染 Header 组件的方法 |
| `renderMessageList` | `() => ReactNode` | 自定义渲染 MessageList 组件的方法 |
| `renderMessageInput` | `() => ReactNode` | 自定义渲染 MessageInput 组件的方法 |
| `renderEmpty` | `() => ReactNode` | 自定义渲染空内容组件的方法 |
| `renderRepliedMessage` | `(repliedMessage: ChatSDK.MessageBody \| null) => ReactNode` | 自定义渲染 Input 上面的被回复的消息 |
| `useCallkit` | `boolean` | 是否启用 CallKit，默认为 true |
| `callkitProps` | `Partial<CallKitProps>` | CallKit 组件的配置参数 |

## 修改主题

`Chat` 组件提供了以下与聊天页面主题相关的 SCSS 变量，关于怎样修改主题请查看 [主题文档](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/theme.md)。

```scss
$chat-bg: $component-background;
$msg-base-font-size: $font-size-lg;
$msg-base-color: $font-color;
$msg-base-margin: $margin-xs 0;
$msg-base-padding: 0 $padding-lg;
$msg-bubble-border-radius-left: 12px 16px 16px 4px;
$msg-bubble-border-radius-right: 16px 12px 4px 16px;
$msg-bubble-arrow-border-size: 6px;
$msg-bubble-arrow-bottom: 8px;
$msg-bubble-arrow-left: -11px;
$msg-bubble-arrow-right: -11px;
$msg-bubble-color-secondly: $blue-95;
$msg-bubble-color-primary: $blue-5;
$msg-bubble-font-color-secondly: $font-color;
$msg-bubble-font-color-primary: $gray-98;
$msg-base-content-margin: 0 $margin-xs 0 $margin-sm;
$msg-base-content-padding: $padding-xs $padding-sm;
$msg-base-content-minheight: 24px;
$msg-bubble-none-bg: transparent;
$msg-bubble-none-color: $font-color;
$msg-bubble-square-border-radius: 4px;
$msg-info-margin-left: $margin-sm;
$msg-nickname-font-size: $font-size-sm;
$msg-nickname-font-weight: 500;
$msg-nickname-font-color: #5270ad;
$msg-nickname-height: 16px;
$msg-time-font-size: $font-size-sm;
$msg-time-font-weight: 400;
$msg-time-font-color: $gray-7;
$msg-time-height: 16px;
$msg-time-margin: 0 $margin-xss;
$msg-time-width: 106px;
```
