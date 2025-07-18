import React from 'react';
import { ThemeProvider } from '../module/theme/ThemeProvider';
import Button from '../src/components/Button/Button';

const ThemeExample: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>主题系统示例</h1>

      {/* 全局主题 */}
      <ThemeProvider
        theme={{
          primaryColor: '#1890ff',
          mode: 'light',
          componentsShape: 'round',
          ripple: true,
          spacing: {
            sm: 8,
            md: 16,
            lg: 24,
          },
          borderRadius: {
            md: 8,
            xl: 16,
          },
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <h2>全局主题 - 蓝色主题</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <Button type="primary">主要按钮</Button>
            <Button type="secondary">次要按钮</Button>
            <Button type="danger">危险按钮</Button>
            <Button type="ghost">幽灵按钮</Button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <Button size="small">小按钮</Button>
            <Button size="medium">中按钮</Button>
            <Button size="large">大按钮</Button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button shape="default">默认</Button>
            <Button shape="round">圆角</Button>
            <Button shape="circle">○</Button>
          </div>
        </div>

        {/* 嵌套主题 - 绿色主题区域 */}
        <ThemeProvider
          theme={{
            primaryColor: '#52c41a',
            componentsShape: 'square',
            ripple: false,
            colors: {
              error: '#ff4d4f',
              success: '#52c41a',
            },
          }}
        >
          <div
            style={{
              padding: '20px',
              background: '#f6ffed',
              borderRadius: '8px',
              marginBottom: '40px',
            }}
          >
            <h2>嵌套主题 - 绿色主题（覆盖全局主题）</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <Button type="primary">主要按钮</Button>
              <Button type="secondary">次要按钮</Button>
              <Button type="danger">危险按钮</Button>
              <Button type="ghost">幽灵按钮</Button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button shape="default">默认</Button>
              <Button shape="round">圆角</Button>
              <Button shape="circle">○</Button>
            </div>
          </div>
        </ThemeProvider>

        {/* 嵌套主题 - 紫色主题区域 */}
        <ThemeProvider
          theme={{
            primaryColor: '#722ed1',
            borderRadius: {
              md: 4,
              xl: 8,
            },
            spacing: {
              sm: 6,
              md: 12,
              lg: 18,
            },
          }}
        >
          <div
            style={{
              padding: '20px',
              background: '#f9f0ff',
              borderRadius: '8px',
              marginBottom: '40px',
            }}
          >
            <h2>嵌套主题 - 紫色主题（更小的间距和圆角）</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <Button type="primary">主要按钮</Button>
              <Button type="secondary">次要按钮</Button>
              <Button type="danger">危险按钮</Button>
              <Button type="ghost">幽灵按钮</Button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button size="small">小按钮</Button>
              <Button size="medium">中按钮</Button>
              <Button size="large">大按钮</Button>
            </div>
          </div>
        </ThemeProvider>

        {/* 动态主题切换示例 */}
        <DynamicThemeExample />
      </ThemeProvider>
    </div>
  );
};

// 动态主题切换组件
const DynamicThemeExample: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState({
    primaryColor: '#1890ff',
    mode: 'light' as const,
  });

  const themes = [
    { name: '蓝色', primaryColor: '#1890ff', mode: 'light' as const },
    { name: '绿色', primaryColor: '#52c41a', mode: 'light' as const },
    { name: '红色', primaryColor: '#f5222d', mode: 'light' as const },
    { name: '橙色', primaryColor: '#fa8c16', mode: 'light' as const },
    { name: '紫色', primaryColor: '#722ed1', mode: 'light' as const },
  ];

  return (
    <ThemeProvider theme={currentTheme}>
      <div
        style={{
          padding: '20px',
          background: '#fafafa',
          borderRadius: '8px',
        }}
      >
        <h2>动态主题切换</h2>
        <p>点击下面的按钮切换主题：</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {themes.map(theme => (
            <Button
              key={theme.name}
              type={currentTheme.primaryColor === theme.primaryColor ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setCurrentTheme(theme)}
            >
              {theme.name}
            </Button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="primary">当前主题按钮</Button>
          <Button type="secondary">次要按钮</Button>
          <Button type="ghost">幽灵按钮</Button>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default ThemeExample;
