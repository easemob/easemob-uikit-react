# UIKitProvider

`easemob-chat-uikit` 提供 `UIKitProvider` 组件来管理数据。 `UIKitProvider` 不渲染任何 UI, 只用来为其他组件提供全局的 context，它自动监听 SDK 事件, 在组件树中向下传递数据来驱动组件更新，UIKit 中其他组件必须用 `UIKitProvider` 包裹。

## 使用示例

```jsx
import React from 'react';
import { UIKitProvider } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';
import ChatApp from './ChatApp'
ReactDOM.createRoot(document.getElementById('root') as Element).render(
  <div>
    <UIKitProvider
      initConfig={{
        appKey: 'your app key',
      }}
      // All the UI texts can be viewed in the URL: https://github.com/easemob/Easemob-UIKit-web/tree/dev/local
      local={{
        fallbackLng: 'en',
        lng: 'en',
        resources: {
          en: {
            translation: {
              'conversationTitle': 'Conversation List',
              'deleteCvs': 'Delete Conversation',
              // ...
            },
          },
        },
      }}

      reactionConfig={{
        map: {
            'emoji_1': <img src={'customIcon'} alt={'emoji_1'} />,
            'emoji_2': <img src={'customIcon'} alt={'emoji_2'} />,
        }
      }}

      features={{
        conversationList: {
          // search: false,
          item: {
            moreAction: false,
            deleteConversation: false,
          },
        },
        chat: {
          header: {
            threadList: true,
            moreAction: true,
            clearMessage: true,
            deleteConversation: false,
            audioCall: false,
          },
          message: {
            status: false,
            reaction: true,
            thread: true,
            recall: true,
            translate: false,
            edit: false,
          },
          messageEditor: {
            mention: false,
            typing: false,
            record: true,
            emoji: false,
            moreAction: true,
            picture: true,
          },
        },
      }}
    >
      <ChatApp></ChatApp>
    </UIKitProvider>
  </div>,
);
```

## UIKitProvider props 概览

<table>
    <tr>
        <td>参数</td>
        <td>类型</td>
        <td>描述</td>
    </tr>
    <tr>
      <td style=font-size:10px>
        initConfig
      </td>
      <td style=font-size:10px>
        ProviderProps['initConfig']
      </td>
	  <td style=font-size:10px>设置你的 appKey</td>
      </tr>
	   <tr>
	   <td style=font-size:10px>
       local
        </td>
        <td style=font-size:10px>
       ProviderProps['local']
        </td>
	   <td style=font-size:10px>国际化配置参数，你可以在初始化时配置 `i18next` 的参数</td>
	   </tr>
        <tr>
	   <td style=font-size:10px>
       features
        </td>
        <td style=font-size:10px>
       ProviderProps['features']
        </td>
	   <td style=font-size:10px>全局配置你需要的功能，UIKit 默认展示全部的功能。如果在组件中也配置了需要的功能，会议在组件中的配置为准。</td>
	   </tr>
        <tr>
	   <td style=font-size:10px>
       reactionConfig
        </td>
        <td style=font-size:10px>
       ProviderProps['reactionConfig']
        </td>
	   <td style=font-size:10px>全局配置消息表情回复功能的表情，如果在消息组件中也设置了这个参数，会以消息组件中设置的为准。</td>
	   </tr>
       
</table>
