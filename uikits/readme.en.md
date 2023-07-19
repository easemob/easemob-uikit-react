# Get Started with Agora Chat UIKit for Web

## Overview

agora-chat-uikit is a UI component library based on Agora IM SDK. It provides general UI components and modules containing business logic, including Chat, ConversationList, ContactList and other modules. These components allow users to customize and customize sub-components at a smaller level using common UI components. agora-chat-uikit provides a provider to manage the data. The provider automatically listens for SDK events, updates the data, and drives UI updates. Developers can use the library to quickly build custom IM applications based on actual business requirements.

'agora-chat-uikit' currently has 5 modular components:

`Provider` Provider does not render any UI, only provides global context for components, automatically listens for SDK events, passes data down, and drives component rendering

`Chat` Chat component

`ConversationList` Conversation list component

`ContactList` Address book component

`UserProfile` Personal information component

The `agora-chat-uikit` library provides the following functions:

- Automatically layout the height and width of the chat frame;
- Pass mandatory parameters to implement automatic login internally;
- Send and receive messages, message on the screen, message not read, message type (text, picture, file, expression, audio, video message);
- conversation search;
- Customize the UI.

agora offers an open source AgoraChat-UIKit-web project on GitHub. You can clone and run the project or refer to the logic in it to create projects integrating Agora-chat-uikit.

Source code URL of Agora Chat UIKit for Web:

- https://github.com/AgoraIO-Usecase/AgoraChat-UIKit-web

URL of Agora Chat app using Agora Chat UIKit for Web:

- https://github.com/AgoraIO-Usecase/AgoraChat-web

## Prerequisites

In order to follow the procedure in this page, you must have:

- React 16.8.0 or later
- React DOM 16.8.0 or later
- A valid [Agora account](https://docs.agora.io/cn/AgoraPlatform/sign_in_and_sign_up).
- A valid [Agora project](https://docs.agora.io/cn/AgoraPlatform/sign_in_and_sign_up) with an App Key.

## Compatible browsers

| Browser | Supported Version |
| ------- | ----------------- |
| IE      | 11 or later       |
| Edge    | 43 or later       |
| Firefox | 10 or later       |
| Chrome  | 54 or later       |
| Safari  | 11 or later       |

## Project setup

### 1. Create a Web Chat UIKit project

```bash
# Install a CLI tool.
npm install create-react-app
# Create an my-app project.
npx create-react-app my-app
cd my-app
```

```
The project directory.

├── package.json
├── public # The static directory of Webpack.
│ ├── favicon.ico
│ ├── index.html # The default single-page app.
│ └── manifest.json
├── src
│ ├── App.css # The CSS of the app's root component.
│ ├── App.js # The app component code.
│ ├── App.test.js
│ ├── index.css # The style of the startup file.
│ ├── index.js # The startup file.
│ ├── logo.svg
│ └── serviceWorker.js
└── yarn.lock
```

### 2. Integrate the Web Chat UIKit

#### Install the Web Chat UIKit

- To install the Web Chat UIKit with npm, run the following command:

```bash
npm install agora-chat-uikit --save
```

- To Install Agora chat UIKit for Web with Yarn, run the following command:

```bash
yarn add agora-chat-uikit
```

#### Build the application using the agora-chat-uikit component

Import agora-chat-uikit into your code.

```javascript
// App.js
import React, { Component } from 'react';
import { Provider, Chat, ConversationList, ContactList } from 'agora-chat-uikit';
import './App.scss';

class App extends Component {
  render() {
    return (
      <Provider
        init={
          ((appkey = 'xxx'), // Your registered App Key.
          (username = 'xxx'), // The user ID of the current user.
          (agoraToken = 'xxx')) // The Agora token. For how to obtain an Agora token, see descriptions in the Reference.
        }
      >
        <div>
          <ConversationList />
        </div>
        <div>
          <Chat />
        </div>
      </Provider>
    );
  }
}

export default App;
```

#### Run the project and send your first message

```bash
npm run start
```

Now, you can see your app in the browser.

Now, you can run your app to send messages. In this example, you can use the default App Key, but need to register your own App Key in the formal development environment. When the default App Key is used, a user will receive a one-to-one chat message and a group chat message upon the first login and can type the first message in a type of conversation and send it.

**Note**

If a custom App Key is used, no contact is available by default and you need to first [add contacts](https://docs.agora.io/en/agora-chat/client-api/contacts) or [join a group](https://docs.agora.io/en/agora-chat/client-api/chat-group/manage-chat-groups).

## Customize the functions and UI

### How to modify UI

UIKit styles are developed using the scss framework and define a number of global style variables, including but not limited to global styles (main color, background color, rounded corner, border, font size), you can override these variables to modify the UI.

```scss
// vertical paddings
$padding-lg: 24px; // containers
$padding-md: 20px; // small containers and buttons
$padding-sm: 16px; // Form controls and items
$padding-s: 12px; // small items
$padding-xs: 8px; // small items
$padding-xss: 4px; // more small
// font
$font-size-base: 14px;
$font-size-lg: $font-size-base + 2px;
$font-size-sm: $font-size-base - 2px;

$text-color: fade($black, 85%);
```

Use webpack for variable coverage:

```json
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              additionalData: `@import "@/styles/index.scss";`
            },
          },
        ],
      },
    ],
  },
};
```

If these do not satisfy the customization requirements, you can pass in the class prefix 'prefix' or 'className' when using the component. This allows you to modify the original class name to use your own class, and use className to add your own css properties to override the original class.

### How to customize Features

The agora-chat-uikit component provides various render methods to support custom rendering of the dom, such as a custom implementation of the conversation list header

```jsx
<ContactList renderHeader={() => <MyCustomHeader />}></ContactList>
```

Using application data in user-defined components: Users can obtain all application data from the Provider.

```js
import { useStateContext } from 'agora-chat-uikit';
const { store } = useStateContext();
```

## Community Contribution

If you want to add extra functions to EaseChat to share with others, you can fork our repository on GitHub and create a pull request. For any questions, you can also create a pull request. Thank you for your contributions.

## Feedback

If you have any problems or suggestions regarding the sample projects, feel free to file an issue.

## Reference

- [Agora Chat SDK Product Overview](https://docs.agora.io/en/agora-chat/overview/product-overview)
- [Agora Chat SDK API Reference](https://api-ref.agora.io/en/chat-sdk/web/1.x/index.html)

## Related resources

- Check our [FAQ](https://docs.agora.io/en/faq) to see if your issue has been recorded.
- Dive into [Agora SDK Samples](https://github.com/AgoraIO) to see more tutorials
- Take a look at [Agora Use Case](https://github.com/AgoraIO-usecase) for more complicated real use case
- Repositories managed by developer communities can be found at [Agora Community](https://github.com/AgoraIO-Community)
- If you encounter problems during integration, feel free to ask questions in [Stack Overflow](https://stackoverflow.com/questions/tagged/agora.io)

## License

The sample projects are under the MIT license.

## (It's not a final document, uikit is still under development)
