# Theme

## Set primaryColor

You can set the theme.primaryColor in the Provider component to set the primary color of the UIKit.

```javascript
import { UIKitProvider } from "agora-chat-uikit";

const App = () => {
  return (
    <UIKitProvider
      theme={{
        primaryColor: "#00CE76", // Hexadecimal color value
      }}
    ></UIKitProvider>
  );
};
```

## SCSS variable

The UIKit style is developed using the SCSS framework and defines a series of global style variables, including but not limited to global styles (primary color, background color, rounded corners, borders, and font size).

You can find all the defined variables [here](https://github.com/easemob/Easemob-UIKit-web/blob/dev/common/style/themes/default.scss).

This page describes how to modify the theme.

### Modify the theme in a project created via create-react-app

In the project that you create with create-react-app, you can create an SCSS file, i.e.,`your-theme.scss` in the following example, to overwrite the default variables of the UIKit. Remember to import the files in the following order.

```scss
@import "agora-chat-uikit/style.scss"; // Theme of agora-chat-uikit
@import "your-theme.scss"; // Your theme file
@import "agora-chat-uikit/components.scss"; // Styles of UIKit components
```

### Modify the theme in a project built with Webpack

Configure the SCSS loader to automatically import the style.scss file.

```javascript
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
              additionalData: `@import "@/styles/index.scss";`,
            },
          },
        ],
      },
    ],
  },
};
```
