# Agora UI Kits

## 介绍

agora-chat-uikit 是基于声网 IM SDK 的一款 UI 组件库，提供通用的 UI 组件，和包含业务逻辑的 module，包括聊天、会话、搜索、通讯录等 module 组件，这些组件允许用户自定义和使用通用 UI 组件来自定义更小级别的子组件，agora-chat-uikit 提供 provider 来管理数据，provider 自动监听 SDK 事件，来更新数据，并驱动 UI 更新。开发者可根据实际业务需求利用该库快速搭建自定义 IM 应用。

## 技术原理

UIKIt 由三部分组成：UI 组件，管理数据的 mobx store, chat SDK。UI 组件包含容器组件 container 复合组件 module, 以及纯 UI 组件 components, 这些不同级别的组件全部对外暴露，用户可以引用任意组件构建自己的应用。UIkit 使用 mobx 管理全局数据，用户可以引用 rootStore 来获得全部数据和 action 方法，来操作数据。 UIKit 内部集成了 chat SDK，通过 chat SDK 和服务器交互。 ![uikit](uikit.png)

## 功能

<table>
    <tr>
        <td>模块</td>
        <td>功能</td>
        <td>说明</td>
    </tr>
   <tr>
      <td rowspan="6" style=font-weight:bold>会话列表</td>
   </tr>
   <tr>
      <td>会话列表</td>
      <td style=font-size:10px>会话列表显示头像、昵称、最新消息内容、未读消息提醒和时间）</td>
   </tr>
   <tr>
      <td>免打扰</td>
      <td style=font-size:10px>开启消息免打扰或关闭消息免打扰</td>
   </tr>
   <tr>
      <td>置顶</td>
      <td style=font-size:10px>将会话固定在列表顶部</td>
   </tr>
   <tr>
      <td>删除会话</td>
      <td style=font-size:10px>将会话从会话列表中删除</td>
   </tr>
   <tr>
      <td>系统通知</td>
      <td style=font-size:10px>好友请求，加群申请</td>
   </tr>
    <tr>
      <td rowspan="6" style=font-weight:bold>聊天</td>
   </tr>
   <tr>
      <td>消息发送器</td>
      <td style=font-size:10px>输入消息内容，enter发送，支持表情 图片 文件 语音，音视频呼叫</td>
   </tr>
   <tr>
      <td>消息展示</td>
      <td style=font-size:10px>单、群聊消息展示，包括头像、昵称、消息内容、时间、发送状态、已读状态，消息包括：文本、表情、图片、视频、文件、语音、通知类消息、自定义消息</td>
   </tr>
   <tr>
      <td>撤回消息</td>
      <td style=font-size:10px>已发出的消息默认 2 分钟内可撤回</td>
   </tr>
   <tr>
      <td>reaction</td>
      <td style=font-size:10px>对消息reaction</td>
   </tr>
   <tr>
      <td>名片</td>
      <td style=font-size:10px>点击头像显示好友名片，可以发送好友的个人名片信息</td>
   </tr>
   <tr>
      <td rowspan="6" style=font-weight:bold>通讯录</td>
   </tr>
   <tr>
      <td>名片</td>
      <td style=font-size:10px>点击头像显示好友名片</td>
   </tr>
   <tr>
      <td>删除好友</td>
      <td style=font-size:10px>将好友从通讯录中删除</td>
   </tr>
   <tr>
      <td>拉黑好友</td>
      <td style=font-size:10px>将好友加入黑名单</td>
   </tr>
   <tr>
      <td>群列表</td>
      <td style=font-size:10px>展示已加入的群组</td>
   </tr>
   <tr>
      <td>黑名单</td>
      <td style=font-size:10px>展示黑名单列表，可以将好友移除黑名单</td>
   </tr>
   <tr>
      <td rowspan="3" style=font-weight:bold>个人信息</td>
   </tr>
   <tr>
      <td>编辑个人信息</td>
      <td style=font-size:10px>可以编辑头像、昵称、电话、生日、邮箱、签名等个人信息</td>
   </tr>
</table>

## 容器组件

<table>
    <tr>
        <td>组件</td>
        <td>描述</td>
        <td>参数</td>
    </tr> 
   <tr>
      <td style=font-weight:bold>Provider</td>
      <td style=font-size:10px>Provider 不渲染任何UI, 只为组件提供全局上下文，自动监听SDK事件，向下传递数据，驱动组件渲染</td>
      <td style=font-size:10px>
      initOptions: 初始化参数，如 appKey, useId, token等  <br/>
      localeConfig: 设置本地化语言 <br/>
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>ConversationList</td>
      <td style=font-size:10px>会话列表组件</td>
      <td style=font-size:10px>
      setCurrentConversation: 设置当前会话 <br/>
      onConversationClick: 点击会话的事件 <br/>
      onConversationDeleteClick: 点击删除会话事件 <br/>
      onConversationMuteChange: 会话免打扰状态改变事件 <br/>
      onAvatarClick: 点击会话头像事件 <br/>
      renderConversationEmpty: 自定义渲染会话列表为空时的内容 <br/>
      renderP2pConversation: 自定义渲染单聊的会话 <br/>
      renderGroupConversation: 自定义渲染群聊的会话 <br/>
      renderLastMessage: 自定义渲染会话最后一条消息 <br/>
      renderContactAvatar: 自定义渲染单聊会话头像 <br/>
      renderContactName: 自定义渲染单聊会话名称 <br/>
      renderGroupAvatar: 自定义渲染群聊会话头像 <br/>
      renderGroupName: 自定义渲染群聊会话名称 <br/>
      ((options: { session: ISession; }) => Element | null)<br/>
      prefix：样式前缀<br/>
      （或者提供 Conversation 子组件来自定义 avatar name）
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>ContactList</td>
      <td style=font-size:10px>通讯录组件</td>
      <td style=font-size:10px>
      onFriendItemClick: 点击好友的事件 <br/>
      onGroupItemClick: 点击群组事件 <br/>
      onBlackItemClick: 点击黑名单成员事件 <br/>
      renderContactEmpty: 自定义渲染没有联系人内容 <br/>
      renderHeader: 自定义渲染通讯录顶部内容 <br/>
      renderCustomContact: 自定义渲染联系人组件 <br/>
      className: 组件class <br/>
      prefix: 样式前缀<br/>
      (会根据UI设计，做调整)
      </td>
   </tr>
   <tr>
      <td style=font-weight:bold>UserProfile</td>
      <td style=font-size:10px>个人信息组件</td>
      <td style=font-size:10px>
      items：个人信息可编辑项
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
      <td style=font-size:10px>聊天组件</td>
      <td style=font-size:10px>
      renderHeader: 自定义渲染chat header 方法 <br/>
      renderMessage: 自定义渲染消息方法 <br/>
      renderTeamCustomMessage: 渲染自定义消息方法 <br/>
      renderMessageEditor: 自定义渲染消息发送器方法 <br/>
      renderEmpty: 自定义渲染没有消息时的内容 <br/>
      renderInputPlaceHolder: 自定义渲染消息输入框 placeholder<br/>
      onMessageClick: 点击消息事件 <br/>
      onMessageAvatarClick: 点击消息头像事件 <br/>
      actions: 消息发送按钮组配置，不传使用默认的配置
      <ul>
         <li>action: 按钮类型，内置类型包括表情(emoji）、发送图片（sendImg）和发送文件（sendFile）,如需自定义请使用自定义 action 名称</li>
         <li>visible：boolean 类型，是否显示该按钮，默认 true</li>
         <li>render: (props: ActionRenderProps) => ReactNode}类型，自定义渲染，如果不传则使用默认渲染方法</li>
      </ul>
      className: 组件class<br/>
      prefix: 样式前缀<br/>
      </td>
   </tr>
</table>

## store

UIKit 提供了一个包含全部数据的 rootStore, rootStore 包含:

- initConfig：UIKit 初始化数据
- client：IM SDK 实例
- conversationStore: 会话列表相关数据
- messageStore： 消息相关数据
- addressStore：通讯录相关数据单独提供，或者在 Provider 提供

<table>
    <tr>
        <td>store</td>
        <td>属性/方法</td>
        <td>说明</td>
    </tr> 
    <tr>
      <td rowspan="10" >conversationStore</td>
    </<tr>
    <tr>
        <td>currentCvs</td>
        <td style=font-size:10px>当前的会话</td>
    </tr> 
    <tr>
        <td>conversationList</td>
        <td style=font-size:10px>全部会话</td>
    </tr> 
    <tr>
        <td>searchList</td>
        <td style=font-size:10px>搜索出来的会话</td>
    </tr> 
   <tr>
        <td style=color:blue>setCurrentCvs</td>
        <td style=font-size:10px>设置当前的会话</td>
    </tr> 
    <tr>
        <td style=color:blue>setConversation</td>
        <td style=font-size:10px>设置全部的会话</td>
    </tr> 
    <tr>
        <td style=color:blue>deleteConversation</td>
        <td style=font-size:10px>删除会话</td>
    </tr> 
   <tr>
        <td style=color:blue>addConversation</td>
        <td style=font-size:10px>添加一个会话</td>
    </tr> 
    <tr>
        <td style=color:blue>topConversation</td>
        <td style=font-size:10px>置顶一个会话</td>
    </tr> 
    <tr>
        <td style=color:blue>modifyConversation</td>
        <td style=font-size:10px>修改一个会话</td>
    </tr>
     <tr>
      <td rowspan="10" >messageStore</td>
    </tr>
   <tr>
        <td>message</td>
        <td style=font-size:10px>全部会话的消息，里面包含singleChat, groupChat, byId</td style=font-size:10px>
    </tr>
   <tr>
        <td style=color:blue>currentCvsMsgs</td>
        <td style=font-size:10px>设置当前会话的消息</td>
    </tr>
    <tr>
        <td style=color:blue>sendMessage</td>
        <td style=font-size:10px>发送一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>receiveMessage</td>
        <td style=font-size:10px>接收一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>modifyMessage</td>
        <td style=font-size:10px>编辑一条消息</td>
    </tr>
    <tr>
        <td style=color:blue>sendChannelAck</td>
        <td style=font-size:10px>回复一条channel ack, 清空会话中的未读数</td>
    </tr>
   <tr>
        <td style=color:blue>updateMessageStatus</td>
        <td style=font-size:10px>更新消息状态</td>
    </tr>
     <tr>
        <td style=color:blue>clearMessage</td>
        <td style=font-size:10px>清空一个会话的消息</td>
    </tr>
    
</table>
