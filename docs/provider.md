# UIKitProvider

`agora-chat-uikit` provides the `UIKitProvider` to manage data, `UIKitProvider` does not render any UI but only provides global context for components. It automatically listens to SDK events, transmits data downward, and drives component rendering, Other components in UIKIT must be wrapped with `UIKitProvider`

## usage example

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
      }},
      // All the copy can be viewed here https://github.com/easemob/Easemob-UIKit-web/tree/dev/local
      local={{
        fallbackLng: 'en',
        lng: 'en',
        resources: {
          en: {
            translation: {
              'module.conversationTitle': 'Conversation List',
              'module.deleteCvs': 'Delete Conversation',
              // ...
            },
          },
        },
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
	  <td style=font-size:10px>You can configure appKey</td>
	   <tr>
	   <td style=font-size:10px>
       local
        </td>
        <td style=font-size:10px>
       ProviderProps['local']
        </td>
	   <td style=font-size:10px>To configure the localized copy, see the parameters of the i18next init method</td>
	   </tr>
    </tr>
</table>
