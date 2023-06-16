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
      }},
      // All the UI texts can be viewed in the URL: https://github.com/easemob/Easemob-UIKit-web/tree/dev/local
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
	  <td style=font-size:10px>You can configure the appKey.</td>
	   <tr>
	   <td style=font-size:10px>
       local
        </td>
        <td style=font-size:10px>
       ProviderProps['local']
        </td>
	   <td style=font-size:10px>For the local UI texts, you can configure the parameters of the i18next init method.</td>
	   </tr>
    </tr>
</table>
