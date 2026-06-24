# 移动端禁止文本选择解决方案

## 问题

在移动设备上长按消息气泡时，即使设置了 `user-select: none`，仍然会出现文本选中的情况。

## 原因

移动端（特别是 iOS Safari 和移动端 Chrome）需要额外的浏览器特定前缀和属性来完全禁止文本选择和长按行为。

## 完整解决方案

### 所需的 CSS 属性

```scss
.element {
  user-select: none; /* 标准属性 */
  -webkit-user-select: none; /* Safari 和 Chrome */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+ 和 Edge */
  -webkit-touch-callout: none; /* iOS Safari - 禁用长按弹出菜单 */
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮效果 */
}
```

### 各属性说明

#### 1. `user-select: none`

- **作用**: 标准 CSS 属性，禁止用户选择文本
- **浏览器支持**: 现代浏览器

#### 2. `-webkit-user-select: none`

- **作用**: WebKit 浏览器前缀（Safari、Chrome、新版 Edge）
- **必需性**: ⭐⭐⭐⭐⭐ 非常重要
- **支持浏览器**:
  - iOS Safari
  - Android Chrome
  - macOS Safari
  - Chrome/Edge (Chromium)

#### 3. `-moz-user-select: none`

- **作用**: Firefox 浏览器前缀
- **必需性**: ⭐⭐⭐ 重要
- **支持浏览器**: Firefox

#### 4. `-ms-user-select: none`

- **作用**: 旧版 IE 和 Edge 浏览器前缀
- **必需性**: ⭐⭐ 可选（如果需要支持旧版浏览器）
- **支持浏览器**: IE10+, 旧版 Edge

#### 5. `-webkit-touch-callout: none` ⭐ 关键！

- **作用**: 禁用 iOS Safari 的长按菜单（复制、粘贴等）
- **必需性**: ⭐⭐⭐⭐⭐ 非常重要
- **支持浏览器**: iOS Safari
- **效果**:
  - 禁用长按弹出的"拷贝"、"查询"等菜单
  - 这是移动端必须的属性！

#### 6. `-webkit-tap-highlight-color: transparent`

- **作用**: 移除移动端点击元素时的高亮效果
- **必需性**: ⭐⭐⭐⭐ 很重要
- **支持浏览器**: iOS Safari, Android Chrome
- **效果**: 点击时不会出现灰色或蓝色的高亮背景

## 应用位置

在 BaseMessage 组件中，已在以下位置添加这些属性：

### 1. 消息容器（最外层）

```scss
.#{$status-prefix-cls} {
  // ... 其他样式
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
```

### 2. 消息主体

```scss
.#{$status-prefix-cls}-body {
  // ... 其他样式
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
```

### 3. 消息内容（气泡）

```scss
.#{$status-prefix-cls}-content {
  // ... 其他样式
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
```

## 测试清单

### iOS Safari

- [ ] 长按消息气泡 → 不应弹出"拷贝"、"查询"菜单
- [ ] 双击消息气泡 → 不应选中文本
- [ ] 拖动选择 → 不应能选中文本
- [ ] 点击消息 → 不应出现高亮效果

### Android Chrome

- [ ] 长按消息气泡 → 不应弹出选择句柄
- [ ] 长按消息气泡 → 不应选中文本
- [ ] 点击消息 → 不应出现高亮效果

### 桌面浏览器

- [ ] 拖动选择 → 不应能选中文本
- [ ] 双击 → 不应选中文本

## 可能的例外情况

有些情况下，你可能**希望**允许文本选择：

### 1. 文本消息内容

如果需要让用户能够复制消息内容，可以针对文本内容部分允许选择：

```scss
.cui-message-text {
  &-content {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    // 但仍然保留禁用长按菜单
    -webkit-touch-callout: none;
  }
}
```

### 2. 代码块或重要信息

```scss
.code-block,
.important-text {
  user-select: text !important;
  -webkit-user-select: text !important;
}
```

## 浏览器兼容性

| 属性 | Chrome | Safari | Firefox | Edge | iOS Safari | Android Chrome |
| --- | --- | --- | --- | --- | --- | --- |
| `user-select: none` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `-webkit-user-select` | ✅ | ✅ | - | ✅ | ✅ | ✅ |
| `-moz-user-select` | - | - | ✅ | - | - | - |
| `-ms-user-select` | - | - | - | ⚠️ 旧版 | - | - |
| `-webkit-touch-callout` | - | ✅ | - | - | ✅ | - |
| `-webkit-tap-highlight-color` | ✅ | ✅ | - | ✅ | ✅ | ✅ |

✅ 支持 | ⚠️ 部分支持 | - 不支持/不需要

## 调试技巧

### 1. 检查是否生效

在 Chrome DevTools 的 Mobile 模式下：

```javascript
// 在控制台运行
const element = document.querySelector('.cui-message-base');
const styles = window.getComputedStyle(element);
console.log({
  userSelect: styles.userSelect,
  webkitUserSelect: styles.webkitUserSelect,
  webkitTouchCallout: styles.webkitTouchCallout,
  webkitTapHighlightColor: styles.webkitTapHighlightColor,
});
```

### 2. 使用实际设备测试

模拟器和真机的行为可能不同，建议：

- 使用 iOS 真机（Safari）
- 使用 Android 真机（Chrome）
- 或使用 Chrome 的远程调试功能

### 3. 检查样式覆盖

确保没有其他样式覆盖了这些属性：

```scss
// ❌ 错误：可能被子元素样式覆盖
.message-content * {
  user-select: text; // 这会覆盖父元素的 none
}

// ✅ 正确：明确指定需要选择的元素
.message-content .selectable-text {
  user-select: text;
}
```

## 常见问题

### Q1: 为什么设置了还是能选中？

**A**: 检查以下几点：

1. 是否添加了所有必需的前缀
2. 是否有其他样式覆盖了这些属性
3. 是否在真机上测试（模拟器可能不准确）
4. 子元素是否有 `user-select: text` 覆盖

### Q2: `-webkit-touch-callout: none` 不生效？

**A**: 这个属性只在 iOS Safari 上有效，在其他浏览器上会被忽略。确保：

1. 使用 iOS 真机测试
2. 同时设置了 `-webkit-user-select: none`

### Q3: 会不会影响正常的点击事件？

**A**: 不会。这些属性只禁止文本选择，不影响：

- 点击事件（onClick）
- 触摸事件（onTouchStart, onTouchEnd）
- 滚动事件
- 其他交互

### Q4: 所有消息都不能复制了吗？

**A**: 是的，如果你希望用户能复制消息内容，可以：

1. 添加一个"复制"按钮
2. 使用 JS 的 `navigator.clipboard.writeText()`
3. 或者只在特定区域允许选择（见"例外情况"）

## 最佳实践

### 1. 渐进增强

```scss
.message-bubble {
  // 基础样式
  user-select: none;

  // WebKit 浏览器（最重要）
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;

  // 其他浏览器
  -moz-user-select: none;
  -ms-user-select: none;
}
```

### 2. 使用 Mixin（推荐）

```scss
// 定义一个通用的 mixin
@mixin no-user-select {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

// 使用
.message-bubble {
  @include no-user-select;
}
```

### 3. 使用 PostCSS Autoprefixer

如果项目使用了 PostCSS，可以配置 Autoprefixer 自动添加前缀：

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: ['iOS >= 9', 'Android >= 4.4', 'last 2 versions'],
    },
  },
};
```

## 相关资源

- [MDN - user-select](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select)
- [Can I Use - user-select](https://caniuse.com/user-select-none)
- [WebKit - touch-callout](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html)

## 更新日志

### 2024-12-03

- ✅ 添加完整的浏览器前缀支持
- ✅ 在三个关键位置应用防选中样式
- ✅ 添加 `-webkit-touch-callout: none` 解决 iOS 长按问题
- ✅ 添加 `-webkit-tap-highlight-color: transparent` 移除点击高亮
