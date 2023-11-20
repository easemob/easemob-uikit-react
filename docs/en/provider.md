# UIKitProvider

`agora-chat-uikit` provides the `UIKitProvider` component for data management. `UIKitProvider` does not render any UI, but only provides the global context for components. It automatically listens for SDK events, passes data down in the React component hierarchy, and drives component rendering. Other components in UIKit must be wrapped with `UIKitProvider`.

## Usage example

```jsx
import React from 'react';
import { UIKitProvider } from 'agora-chat-uikit';
import 'agora-chat-uikit/style.css';
import ChatApp from './ChatApp'
ReactDOM.createRoot(document.getElementById('root') as Element).render(
  <div>
    <UIKitProvider
      initConfig={{
        appKey: 'your app key',
        userId: 'userId',
        token: 'chat token'
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
      theme={{
        primaryColor: '#00CE76' // Hexadecimal color value
      }}
    >
      <ChatApp></ChatApp>
    </UIKitProvider>
  </div>,
);
```

## Overview of UIKitProvider

<table>
    <tr>
        <td>Props</td>
        <td>Type</td>
        <td>Description</td>
    </tr>
    <tr>
      <td style=font-size:10px>
        initConfig
      </td>
      <td style=font-size:10px>
        ProviderProps['initConfig']
      </td>
	  <td style=font-size:10px>You can configure the appKey.</td>
      </tr>
	   <tr>
	   <td style=font-size:10px>
       local
        </td>
        <td style=font-size:10px>
       ProviderProps['local']
        </td>
	   <td style=font-size:10px>For the local UI texts, you can configure the parameters of the i18next init method.</td>
	   </tr>
        <tr>
	   <td style=font-size:10px>
       features
        </td>
        <td style=font-size:10px>
       ProviderProps['features']
        </td>
	   <td style=font-size:10px>What functions are used for global configuration. By default, all functions are displayed. If the features are also configured in the component, the configuration in the component will prevail.</td>
	   </tr>
        <tr>
	   <td style=font-size:10px>
       reactionConfig
        </td>
        <td style=font-size:10px>
       ProviderProps['reactionConfig']
        </td>
	   <td style=font-size:10px>Global reaction emoticon configuration. If this parameter is also configured in the message component, the configuration in the message component shall prevail</td>
	   </tr>
       <tr>
	   <td style=font-size:10px>
       onError
        </td>
        <td style=font-size:10px>
       ProviderProps['onError']
        </td>
	   <td style=font-size:10px>OnError event in SDK.</td>
	   </tr>
       
</table>
