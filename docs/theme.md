# Theme

The UIKit style is developed using the scss framework and defines a series of global style variables, including but not limited to global styles (main color, background color, rounded corners, borders, font size).

You can find all the defined variables here [theme variables](https://github.com/easemob/Easemob-UIKit-web/blob/dev/common/style/themes/default.scss)

## How to modify the theme

1. In create-react-app

In the project you created with create-react-app, you can create an scss file to override the default variables of the uikit. Need to ensure the order of importing files.

```scss
@import 'agora-chat-uikit/style.scss'; // agora-chat-uikit theme
@import 'your-theme.scss'; // your theme
@import 'agora-chat-uikit/components.scss'; // components style
```

```scss
// your-theme.scss
$component-background: green;
$primary-color: pink;
// ...
```

2. Webpack

Configure scss loader to automatically import style.scss files.

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@import "./src/scss-vars.scss";`,
            },
          },
        ],
      },
    ],
  },
};
```

```scss
// scss-vars.scss
@import 'agora-chat-uikit/style.scss';
$component-background: green;
$primary-color: pink;
// ...
@import 'agora-chat-uikit/components.scss';
```
