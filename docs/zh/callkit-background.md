# CallKit 背景图片功能

## 功能介绍

CallKit 组件新增了 `backgroundImage` 参数，允许为多人视频通话和 1v1 语音通话设置自定义背景图片。这个功能特别适用于群组视频会议和语音通话，可以提供更加美观和专业的视觉体验。

## 基本用法

### 使用自定义背景图片

```tsx
import { CallKit, LayoutMode } from '@easemob/uikit-react';

const MyVideoCall = () => {
  const groupVideos = [
    { id: 'local', nickname: '我', isLocalVideo: true },
    { id: 'user1', nickname: '张三' },
    { id: 'user2', nickname: '李四' },
    { id: 'user3', nickname: '王五' },
  ];

  return (
    <CallKit
      videos={groupVideos}
      callMode="group"
      layoutMode={LayoutMode.MULTI_PARTY}
      backgroundImage="https://example.com/meeting-background.jpg"
      showControls={true}
      aspectRatio={1}
      gap={12}
    />
  );
};
```

### 使用默认背景

```tsx
<CallKit
  videos={groupVideos}
  callMode="group"
  layoutMode={LayoutMode.MULTI_PARTY}
  // 不设置 backgroundImage 或设置为 undefined 使用默认背景
  showControls={true}
/>
```

### 1v1 语音通话背景

```tsx
<CallKit
  videos={[{ id: 'local', nickname: '我', isLocalVideo: true }]}
  callMode="audio"
  layoutMode={LayoutMode.ONE_TO_ONE}
  backgroundImage="https://example.com/voice-call-background.jpg"
  showControls={true}
/>
```

## API 参数

### backgroundImage

- **类型**: `string | undefined`
- **默认值**: `undefined`
- **说明**: 通话背景图片的 URL 地址

当 `backgroundImage` 参数有值时，组件会使用指定的图片作为背景；当 `backgroundImage` 为 `undefined` 或不传递时，使用 CSS 中定义的默认背景样式。

## 背景样式规则

背景图片会应用以下 CSS 样式规则：

```css
.cui-callkit-multi-party-full-layout {
  background-image: url(your-image-url);
  background-size: 100% 100%; /* 拉伸填满整个容器 */
  background-position: 0px 0px; /* 左上角对齐 */
  background-repeat: no-repeat; /* 不重复 */
}
```

## 适用场景

### ✅ 推荐使用场景

1. **多人群组通话**: 为群组会议设置公司 logo 或品牌背景
2. **1v1 语音通话**: 为语音通话设置个性化背景
3. **在线会议**: 提供专业的会议背景
4. **社交通话**: 使用有趣的主题背景
5. **教育场景**: 设置教室或学习相关的背景

### ❌ 不适用场景

1. **1v1 视频通话**: 视频通话时背景图片会被视频内容覆盖
2. **预览模式**: 预览界面不会显示背景图片
3. **最小化状态**: 最小化时不显示背景

## 最佳实践

### 图片规格建议

1. **分辨率**: 建议使用 1920x1080 或更高分辨率
2. **宽高比**: 推荐 16:9 比例，适配大多数屏幕
3. **格式**: 支持 JPEG、PNG、WebP 等常见格式
4. **文件大小**: 建议控制在 2MB 以内，确保加载速度

### 设计建议

```tsx
// 推荐：使用适当对比度的背景，确保视频窗口清晰可见
<CallKit
  backgroundImage="https://example.com/low-contrast-background.jpg"
  videos={videos}
  gap={16} // 适当增大间距，让视频窗口更突出
/>

// 避免：过于花哨或高对比度的背景
<CallKit
  backgroundImage="https://example.com/too-busy-background.jpg" // ❌
  videos={videos}
/>
```

### 性能优化

1. **使用 CDN**: 建议将背景图片托管在 CDN 上，提高加载速度
2. **图片优化**: 压缩图片大小，但保持足够的质量
3. **预加载**: 可以在组件挂载前预加载背景图片

```tsx
// 预加载背景图片
useEffect(() => {
  const img = new Image();
  img.src = 'https://example.com/background.jpg';
}, []);
```

## 动态背景切换

支持在通话过程中动态更换背景：

```tsx
const VideoCallWithDynamicBackground = () => {
  const [currentBg, setCurrentBg] = useState('background1.jpg');

  const backgroundOptions = [
    'https://example.com/background1.jpg',
    'https://example.com/background2.jpg',
    'https://example.com/background3.jpg',
  ];

  return (
    <div>
      {/* 背景选择器 */}
      <div className="background-selector">
        {backgroundOptions.map((bg, index) => (
          <button
            key={index}
            onClick={() => setCurrentBg(bg)}
            className={currentBg === bg ? 'active' : ''}
          >
            背景 {index + 1}
          </button>
        ))}
      </div>

      {/* CallKit 组件 */}
      <CallKit
        videos={videos}
        backgroundImage={currentBg}
        callMode="group"
        layoutMode={LayoutMode.MULTI_PARTY}
      />
    </div>
  );
};
```

## 样式定制

### 覆盖默认背景样式

如果需要自定义背景的显示方式，可以通过 CSS 覆盖：

```css
.my-custom-callkit .cui-callkit-multi-party-full-layout {
  background-size: cover !important; /* 保持比例填充 */
  background-position: center !important; /* 居中显示 */
}
```

```tsx
<CallKit
  className="my-custom-callkit"
  backgroundImage="https://example.com/background.jpg"
  videos={videos}
/>
```

### 添加渐变叠加

可以在背景图片上添加渐变叠加层，增强视觉效果：

```css
.callkit-with-overlay .cui-callkit-multi-party-full-layout::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.callkit-with-overlay .cui-callkit-header,
.callkit-with-overlay .cui-callkit-content,
.callkit-with-overlay .cui-callkit-controls {
  position: relative;
  z-index: 2;
}
```

## 故障排除

### 常见问题

1. **背景图片不显示**

   - 检查图片 URL 是否正确
   - 确认图片服务器支持跨域请求
   - 验证图片格式是否受支持

2. **图片加载缓慢**

   - 优化图片大小和压缩比
   - 使用 CDN 加速
   - 考虑使用渐进式 JPEG 格式

3. **图片显示变形**
   - 检查原始图片的宽高比
   - 考虑使用 `background-size: cover` 替代默认的 `100% 100%`

### 调试方法

```tsx
const CallKitWithDebug = () => {
  const [bgError, setBgError] = useState(false);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        console.log('背景图片加载成功:', backgroundImage);
        setBgError(false);
      };
      img.onerror = () => {
        console.error('背景图片加载失败:', backgroundImage);
        setBgError(true);
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  return (
    <div>
      {bgError && <div className="error-message">背景图片加载失败，使用默认背景</div>}
      <CallKit backgroundImage={bgError ? undefined : backgroundImage} videos={videos} />
    </div>
  );
};
```

## 版本兼容性

- ✅ **支持版本**: v1.2.1+
- ✅ **React 版本**: 16.8+
- ✅ **浏览器支持**: Chrome 60+, Firefox 60+, Safari 12+

## 相关链接

- [CallKit 组件文档](./callkit.md)
- [多人布局系统](./callkit-layout-system.md)
- [CallKit API 参考](./callkit-api.md)
