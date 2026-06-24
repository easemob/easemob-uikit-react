# ImagePreview 组件更新说明

## 更新内容

已使用 `react-photo-view` 重新实现 `ImagePreview` 组件，支持以下功能：

### 新增功能

1. ✅ **放大/缩小**
   - 点击放大按钮增加 50% 缩放
   - 点击缩小按钮减少 50% 缩放
   - 实时显示当前缩放比例

2. ✅ **旋转**
   - 点击旋转按钮顺时针旋转 90°
   - 支持连续旋转

3. ✅ **优化的用户体验**
   - 流畅的动画效果
   - 美观的工具栏UI
   - 支持键盘ESC关闭
   - 支持点击蒙层关闭

### 技术实现

使用 [react-photo-view](https://react-photo-view.vercel.app/docs/getting-started) 库实现，这是一个功能强大的 React 图片预览组件库。

## 安装依赖

在使用之前，需要先安装 `react-photo-view`：

```bash
pnpm install react-photo-view
```

或

```bash
npm install react-photo-view
```

或

```bash
yarn add react-photo-view
```

## 代码变更

### 新增导入

```typescript
import { PhotoSlider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
```

### ImagePreview 组件

```typescript
export const ImagePreview = (props: ImagePreviewProps) => {
  const { visible, previewImageUrl, alt, onCancel } = props;

  return (
    <PhotoSlider
      images={[{ src: previewImageUrl, key: previewImageUrl }]}
      visible={visible}
      onClose={() => onCancel?.()}
      index={0}
      loop={false}
      toolbarRender={({ onScale, scale, rotate, onRotate }) => {
        return (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* 放大按钮 */}
            <button onClick={() => onScale(scale + 0.5)}>放大</button>
            
            {/* 缩小按钮 */}
            <button onClick={() => onScale(scale - 0.5)}>缩小</button>
            
            {/* 旋转按钮 */}
            <button onClick={() => onRotate(rotate + 90)}>旋转</button>
            
            {/* 显示当前缩放比例 */}
            <span>{Math.round(scale * 100)}%</span>
          </div>
        );
      }}
    />
  );
};
```

## 功能说明

### 1. 放大/缩小

- **放大**：每次点击增加 0.5 倍缩放（50%）
- **缩小**：每次点击减少 0.5 倍缩放（50%）
- **缩放范围**：react-photo-view 会自动限制合理的缩放范围
- **实时显示**：工具栏右侧显示当前缩放百分比

### 2. 旋转

- **旋转角度**：每次点击旋转 90°
- **连续旋转**：可以连续点击实现 180°、270°、360° 旋转
- **平滑动画**：旋转过程有流畅的过渡动画

### 3. 其他功能

- **ESC 关闭**：按 ESC 键关闭预览
- **点击蒙层关闭**：点击图片外的黑色区域关闭预览
- **拖拽移动**：放大后可以拖拽图片查看不同区域
- **滚轮缩放**：使用鼠标滚轮也可以缩放图片

### 4. 禁用的功能

- **循环预览**：设置 `loop={false}`，因为只有单张图片，不需要上一张/下一张功能

## 工具栏按钮样式

自定义了美观的工具栏按钮样式：

```typescript
const toolbarButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  outline: 'none',
};
```

特点：
- 半透明背景
- 白色边框和图标
- 圆角设计
- Hover 效果（通过 CSS）
- 响应式设计

## 使用示例

### 基础使用

```tsx
import { ImagePreview } from './ImageMessage';

function MyComponent() {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <button onClick={() => setVisible(true)}>预览图片</button>
      
      <ImagePreview
        visible={visible}
        previewImageUrl="https://example.com/image.jpg"
        onCancel={() => setVisible(false)}
      />
    </>
  );
}
```

### 在 ImageMessage 中使用

组件已经集成到 `ImageMessage` 中，点击图片消息时会自动打开预览：

```tsx
<ImageMessage
  imageMessage={message}
  onClick={(msg) => {
    // 点击图片会自动触发预览
    return false; // 返回 false 使用默认预览
  }}
/>
```

### 自定义预览（如果需要）

如果想使用自己的预览组件，可以通过 `renderImagePreview` 属性：

```tsx
<ImageMessage
  imageMessage={message}
  renderImagePreview={({ visible, imageUrl, onClose }) => {
    return <YourCustomViewer {...props} />;
  }}
/>
```

## 对比：旧版 vs 新版

### 旧版（基于 Modal）

```tsx
<Modal open={visible} onCancel={onCancel}>
  <img src={previewImageUrl} alt={alt} />
</Modal>
```

**功能**：
- ❌ 无法放大缩小
- ❌ 无法旋转
- ❌ 无法拖拽
- ✅ 基础的预览

### 新版（基于 react-photo-view）

```tsx
<PhotoSlider
  images={[{ src: previewImageUrl }]}
  visible={visible}
  onClose={onCancel}
  toolbarRender={...}
/>
```

**功能**：
- ✅ 支持放大缩小
- ✅ 支持旋转
- ✅ 支持拖拽移动
- ✅ 支持滚轮缩放
- ✅ 流畅的动画
- ✅ 美观的UI
- ✅ 键盘快捷键

## 注意事项

1. **依赖安装**
   - 必须先安装 `react-photo-view` 依赖
   - 需要导入 CSS 文件

2. **类型定义**
   - 项目中已包含 `react-photo-view.d.ts` 类型声明文件
   - 如果 TypeScript 报错，确保该文件在项目根目录

3. **浏览器兼容性**
   - 支持所有现代浏览器
   - IE 11+ 需要 polyfill

4. **性能**
   - react-photo-view 性能优秀
   - 支持大图片的流畅预览
   - 内存占用合理

## 相关链接

- [react-photo-view 官方文档](https://react-photo-view.vercel.app/docs/getting-started)
- [react-photo-view GitHub](https://github.com/MinJieLiu/react-photo-view)
- [在线示例](https://react-photo-view.vercel.app/)

## 更新日志

### 2025-11-24

- ✅ 使用 react-photo-view 重新实现 ImagePreview
- ✅ 添加放大/缩小功能
- ✅ 添加旋转功能
- ✅ 优化工具栏UI
- ✅ 添加缩放比例显示
- ✅ 禁用循环预览（单张图片场景）
- ✅ 添加类型声明文件
- ✅ 更新 package.json 依赖

