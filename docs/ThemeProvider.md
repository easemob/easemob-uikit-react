# ThemeProvider 使用指南

## 概述

`ThemeProvider` 是一个独立的主题管理组件，支持主题嵌套、动态切换和 CSS 变量注入。它与原有的 `Provider` 分离，提供更灵活的主题管理能力。

## 特性

- ✅ **主题嵌套**：支持多层主题嵌套，子主题会覆盖父主题
- ✅ **动态切换**：运行时动态更改主题
- ✅ **CSS 变量**：自动注入 CSS 变量，支持所有组件
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **向后兼容**：与现有的 Provider 主题系统兼容

## 基本使用

### 1. 全局主题设置

```tsx
import React from 'react';
import { ThemeProvider } from '../module/theme/ThemeProvider';
import App from './App';

function Root() {
  return (
    <ThemeProvider
      theme={{
        primaryColor: '#1890ff',
        mode: 'light',
        componentsShape: 'round',
        ripple: true,
      }}
    >
      <App />
    </ThemeProvider>
  );
}
```

### 2. 嵌套主题

```tsx
function App() {
  return (
    <div>
      <h1>全局主题区域</h1>
      <Button type="primary">全局主题按钮</Button>

      {/* 嵌套主题 - 会覆盖全局主题 */}
      <ThemeProvider
        theme={{
          primaryColor: '#52c41a', // 绿色主题
          componentsShape: 'square',
        }}
      >
        <div>
          <h2>嵌套主题区域</h2>
          <Button type="primary">绿色主题按钮</Button>
        </div>
      </ThemeProvider>
    </div>
  );
}
```

### 3. 组件中使用主题

```tsx
import { useTheme } from '../module/theme/ThemeProvider';

function MyComponent() {
  const { mergedTheme, setTheme } = useTheme();

  const handleChangeTheme = () => {
    setTheme({
      primaryColor: '#f5222d',
      ripple: false,
    });
  };

  return (
    <div
      style={{
        padding: mergedTheme.spacing?.md,
        borderRadius: mergedTheme.borderRadius?.md,
        backgroundColor: mergedTheme.colors?.surface,
      }}
    >
      <Button onClick={handleChangeTheme}>切换主题</Button>
    </div>
  );
}
```

## 主题配置

### ThemeConfig 接口

```tsx
interface ThemeConfig {
  // 基础主题
  primaryColor?: string | number;
  mode?: 'light' | 'dark';
  avatarShape?: 'circle' | 'square';
  bubbleShape?: 'round' | 'square';
  componentsShape?: 'round' | 'square';
  ripple?: boolean;

  // 扩展颜色
  colors?: {
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
    error?: string;
    warning?: string;
    success?: string;
    info?: string;
  };

  // 间距系统
  spacing?: {
    xs?: number; // 4px
    sm?: number; // 8px
    md?: number; // 16px
    lg?: number; // 24px
    xl?: number; // 32px
  };

  // 圆角系统
  borderRadius?: {
    sm?: number; // 4px
    md?: number; // 8px
    lg?: number; // 12px
    xl?: number; // 16px
  };

  // 阴影系统
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}
```

## 优先级规则

主题合并遵循以下优先级（从低到高）：

1. **默认主题** - 系统内置的默认值
2. **父级主题** - 来自父级 ThemeProvider 的主题
3. **当前主题** - 当前 ThemeProvider 的 theme prop
4. **动态主题** - 通过 setTheme 设置的主题

```tsx
// 优先级示例
<ThemeProvider theme={{ primaryColor: '#1890ff' }}>
  {' '}
  {/* 优先级2 */}
  <ThemeProvider theme={{ primaryColor: '#52c41a' }}>
    {' '}
    {/* 优先级3，会覆盖父级 */}
    <MyComponent /> {/* 最终使用绿色主题 */}
  </ThemeProvider>
</ThemeProvider>
```

## CSS 变量

ThemeProvider 会自动将主题值注入为 CSS 变量，你可以在样式中直接使用：

```scss
.my-component {
  // 使用主题颜色
  background: var(--cui-color-primary, #1890ff);
  color: var(--cui-color-text, #333);
  border: 1px solid var(--cui-color-border, #e0e0e0);

  // 使用主题间距
  padding: var(--cui-spacing-md, 16px);
  margin: var(--cui-spacing-sm, 8px);

  // 使用主题圆角
  border-radius: var(--cui-border-radius-md, 8px);

  // 使用主题阴影
  box-shadow: var(--cui-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12));
}
```

## 与现有 Provider 的关系

### 推荐的使用方式

```tsx
// 推荐：使用独立的ThemeProvider
function App() {
  return (
    <Provider initConfig={initConfig}>
      {' '}
      {/* 聊天功能 */}
      <ThemeProvider theme={theme}>
        {' '}
        {/* 主题管理 */}
        <ChatApp />
      </ThemeProvider>
    </Provider>
  );
}
```

### 向后兼容

现有的 Provider 主题配置仍然有效，但建议迁移到新的 ThemeProvider：

```tsx
// 旧方式（仍然支持）
<Provider
  initConfig={initConfig}
  theme={{ primaryColor: '#1890ff' }}  // 已标记为deprecated
>
  <ChatApp />
</Provider>

// 新方式（推荐）
<Provider initConfig={initConfig}>
  <ThemeProvider theme={{ primaryColor: '#1890ff' }}>
    <ChatApp />
  </ThemeProvider>
</Provider>
```

## 最佳实践

### 1. 合理的 Provider 层级

```tsx
// ✅ 推荐的结构
<Provider initConfig={initConfig}>
  {' '}
  {/* 根Provider - 聊天功能 */}
  <ThemeProvider theme={globalTheme}>
    {' '}
    {/* 全局主题 */}
    <Router>
      {' '}
      {/* 路由 */}
      <Layout>
        {' '}
        {/* 布局 */}
        <Routes>
          <Route
            path="/chat"
            element={
              <ThemeProvider theme={chatTheme}>
                {' '}
                {/* 聊天页面特定主题 */}
                <ChatPage />
              </ThemeProvider>
            }
          />
          <Route
            path="/callkit"
            element={
              <ThemeProvider theme={callkitTheme}>
                {' '}
                {/* 通话页面特定主题 */}
                <CallKitPage />
              </ThemeProvider>
            }
          />
        </Routes>
      </Layout>
    </Router>
  </ThemeProvider>
</Provider>
```

### 2. 主题设计原则

- **一致性**：同一应用中保持视觉风格一致
- **层次性**：合理使用主题嵌套，避免过深的层级
- **性能**：避免频繁的主题切换，使用 useMemo 优化
- **可访问性**：确保颜色对比度符合无障碍标准

### 3. 组件开发建议

```tsx
// ✅ 推荐的组件实现
function MyComponent({ className, style, ...props }) {
  const { mergedTheme } = useTheme();

  const computedStyle = useMemo(
    () => ({
      padding: mergedTheme.spacing?.md,
      borderRadius: mergedTheme.borderRadius?.md,
      ...style,
    }),
    [mergedTheme, style],
  );

  return <div className={classNames('my-component', className)} style={computedStyle} {...props} />;
}
```

## 常见问题

### Q: 会不会造成 Provider 嵌套过多？

A: 合理的 Provider 嵌套是可以接受的，现代 React 应用通常都有多个 Provider。关键是：

- 每个 Provider 职责单一
- 避免不必要的嵌套
- 使用组合模式减少嵌套层级

### Q: 性能会受到影响吗？

A: 不会。ThemeProvider 使用了以下优化：

- Context 值使用 useMemo 缓存
- CSS 变量只在主题变化时更新
- 组件只在使用的主题值变化时重渲染

### Q: 如何迁移现有代码？

A: 渐进式迁移：

1. 保持现有 Provider 的 theme 配置不变
2. 在需要特殊主题的组件树中添加 ThemeProvider
3. 逐步将全局主题迁移到 ThemeProvider
4. 最后移除 Provider 中的 theme 配置

## 总结

独立的 ThemeProvider 提供了：

- 更好的关注点分离
- 更灵活的主题管理
- 更强的扩展能力
- 更好的开发体验

建议在新项目中直接使用 ThemeProvider，现有项目可以渐进式迁移。
