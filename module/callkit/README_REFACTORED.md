# CallKit 重构版本

## 📋 重构概述

基于原有的 VideoLayout 组件，我们采用**策略模式 + 组合模式**对 CallKit 模块进行了全面重构，实现了更好的代码组织和可扩展性。

## 🏗️ 架构设计

### 核心组件结构

```
CallKit (主容器)
├── LayoutManager (布局管理器)
│   ├── MultiPartyLayout (多人布局)
│   ├── OneToOneLayout (1v1布局)
│   ├── PreviewLayout (预览布局)
│   └── ScreenShareLayout (屏幕共享布局)
├── VideoRenderer (视频渲染器)
├── CallControls (控制按钮)
└── CallHeader (顶部栏)
```

### 文件结构

```
module/callkit/
├── CallKit.tsx                 # 主组件
├── VideoLayout.tsx             # 原组件（保持向后兼容）
├── types/
│   └── index.ts                # 类型定义
├── hooks/
│   ├── useContainerSize.ts     # 容器尺寸监听
│   └── useFullscreen.ts        # 全屏控制
├── layouts/
│   ├── LayoutManager.tsx       # 布局管理器
│   ├── MultiPartyLayout.tsx    # 多人布局
│   ├── OneToOneLayout.tsx      # 1v1布局
│   └── PreviewLayout.tsx       # 预览布局
├── components/
│   ├── CallControls/           # 控制按钮
│   └── CallHeader/             # 顶部栏
└── styles/
    ├── index.scss              # 主样式
    ├── variables.scss          # 变量
    ├── mixins.scss             # 混合器
    └── layouts/                # 布局专用样式
        ├── multi-party.scss
        ├── one-to-one.scss
        └── preview.scss
```

## 🎯 支持的布局模式

### 1. 多人网格布局 (MULTI_PARTY)

- **适用场景**: 3 人以上的多人视频会议
- **特点**: 智能网格布局，自动计算最优排列
- **布局规则**:
  - 1-4 人: 单排显示
  - 5-12 人: 双排显示
  - 13+人: 三排显示

### 2. 1v1 画中画布局 (ONE_TO_ONE)

- **适用场景**: 两人视频通话
- **特点**: 远程视频全屏显示，本地视频画中画
- **布局规则**:
  - 主视频: 远程用户，占满整个容器
  - 小视频: 本地用户，右上角悬浮显示

### 3. 预览布局 (PREVIEW)

- **适用场景**: 通话前预览自己的画面
- **特点**: 竖屏布局，带提示文字
- **布局规则**:
  - 视频比例: 9:16 (竖屏)
  - 居中显示，带脉冲动画边框
  - 底部显示提示文字

### 4. 屏幕共享布局 (SCREEN_SHARE)

- **适用场景**: 屏幕共享场景
- **特点**: 共享内容为主，参与者视频为辅
- **状态**: 待实现

## 🔧 核心特性

### 智能布局算法

- **双重约束**: 同时考虑宽度和高度限制
- **自适应**: 根据容器尺寸自动选择最优布局
- **响应式**: 支持移动端、平板、桌面端

### 优化的视频尺寸计算

```typescript
// 基于宽度和高度约束，选择较小尺寸
const finalSize = Math.min(widthBasedSize, heightBasedSize);
```

### 模块化样式系统

- **变量系统**: 统一的颜色、尺寸、动画变量
- **混合器**: 可复用的样式片段
- **主题支持**: 易于扩展的主题系统

## 🚀 使用方式

### 基本用法

```tsx
import { CallKit, LayoutMode } from '@easemob/uikit-react';

// 自动布局（推荐）
<CallKit
  videos={videoList}
  onVideoClick={handleVideoClick}
  onMuteToggle={handleMuteToggle}
  onHangup={handleHangup}
/>

// 指定布局模式
<CallKit
  videos={videoList}
  layoutMode={LayoutMode.ONE_TO_ONE}
  aspectRatio={16/9}
  gap={12}
/>
```

### 高级用法

```tsx
// 自定义样式
<CallKit
  videos={videoList}
  layoutMode={LayoutMode.PREVIEW}
  style={{
    border: '2px solid #1890ff',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  }}
  showControls={false}
/>;

// 使用单独的布局组件
import { LayoutManager } from '@easemob/uikit-react';

<LayoutManager
  layoutMode={LayoutMode.MULTI_PARTY}
  videos={videos}
  containerSize={containerSize}
  layoutOptions={layoutOptions}
  renderVideoWindow={renderVideoWindow}
  prefixCls="my-callkit"
/>;
```

## 📊 API 文档

### CallKit Props

| 属性         | 类型                       | 默认值        | 说明             |
| ------------ | -------------------------- | ------------- | ---------------- |
| videos       | `VideoWindowProps[]`       | `[]`          | 视频窗口数组     |
| layoutMode   | `LayoutMode`               | `MULTI_PARTY` | 布局模式         |
| aspectRatio  | `number`                   | `1`           | 视频宽高比       |
| gap          | `number`                   | `8`           | 视频间距         |
| showControls | `boolean`                  | `true`        | 是否显示控制按钮 |
| maxVideos    | `number`                   | -             | 最大显示视频数   |
| onVideoClick | `(id: string) => void`     | -             | 视频点击回调     |
| onMuteToggle | `(muted: boolean) => void` | -             | 静音切换回调     |
| onHangup     | `() => void`               | -             | 挂断回调         |

### LayoutMode 枚举

```typescript
enum LayoutMode {
  MULTI_PARTY = 'multi-party', // 多人网格布局
  ONE_TO_ONE = 'one-to-one', // 1v1画中画布局
  PREVIEW = 'preview', // 预览布局
  SCREEN_SHARE = 'screen-share', // 屏幕共享布局
}
```

### VideoWindowProps 接口

```typescript
interface VideoWindowProps {
  id: string; // 唯一标识
  stream?: MediaStream; // 媒体流
  videoElement?: HTMLVideoElement; // 视频元素
  muted?: boolean; // 是否静音
  nickname?: string; // 昵称
  avatar?: string; // 头像URL
  isLocalVideo?: boolean; // 是否本地视频
  onVideoClick?: (id: string) => void; // 点击回调
}
```

## 🎨 样式定制

### CSS 变量

```scss
// 自定义颜色
:root {
  --callkit-background: #000;
  --callkit-window-background: #1a1a1a;
  --callkit-border-color: rgba(255, 255, 255, 0.1);
  --callkit-text-color: #fff;
}

// 自定义尺寸
:root {
  --callkit-header-height: 60px;
  --callkit-controls-height: 60px;
  --callkit-gap: 8px;
  --callkit-border-radius: 8px;
}
```

### 自定义主题

```scss
.my-custom-callkit {
  --callkit-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --callkit-window-background: rgba(255, 255, 255, 0.1);
  --callkit-border-color: rgba(255, 255, 255, 0.2);

  .cui-callkit-window {
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
}
```

## 🔄 向后兼容

重构后的 CallKit 完全向后兼容原有的 VideoLayout 组件：

```tsx
// 原有代码无需修改
import { VideoLayout } from '@easemob/uikit-react';

<VideoLayout videos={videos} aspectRatio={1} gap={8} onVideoClick={handleClick} />;
```

## 🚦 迁移指南

### 从 VideoLayout 迁移到 CallKit

1. **更新导入**:

```tsx
// 之前
import { VideoLayout } from '@easemob/uikit-react';

// 之后
import { CallKit } from '@easemob/uikit-react';
```

2. **更新组件名**:

```tsx
// 之前
<VideoLayout videos={videos} />

// 之后
<CallKit videos={videos} />
```

3. **使用新的布局模式**:

```tsx
// 之前 - 只有多人布局
<VideoLayout videos={videos} />

// 之后 - 支持多种布局
<CallKit videos={videos} layoutMode={LayoutMode.ONE_TO_ONE} />
```

## 🏆 重构收益

### 代码质量提升

- ✅ 单一职责原则: 每个组件职责明确
- ✅ 开闭原则: 易于扩展新布局模式
- ✅ 依赖倒置: 基于接口编程
- ✅ 组合优于继承: 使用组合模式

### 性能优化

- ✅ 智能布局算法: 避免溢出和重叠
- ✅ 响应式设计: 适配各种屏幕尺寸
- ✅ 按需渲染: 只渲染可见视频
- ✅ 内存优化: 合理的组件生命周期

### 开发体验

- ✅ TypeScript 支持: 完整的类型定义
- ✅ Storybook 演示: 可视化组件库
- ✅ 模块化结构: 易于维护和扩展
- ✅ 文档完善: 详细的 API 文档

### 用户体验

- ✅ 多种布局模式: 适应不同使用场景
- ✅ 智能适配: 自动选择最优布局
- ✅ 流畅动画: 自然的交互体验
- ✅ 响应式设计: 跨设备一致体验

## 🔮 未来规划

1. **屏幕共享布局**: 实现专门的屏幕共享布局模式
2. **虚拟背景**: 支持虚拟背景和美颜功能
3. **手势控制**: 支持手势操作和快捷键
4. **AI 增强**: 智能视频质量优化和噪音消除
5. **多平台**: 支持更多平台和设备类型
