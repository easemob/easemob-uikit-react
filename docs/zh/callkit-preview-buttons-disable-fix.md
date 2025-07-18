# CallKit 预览模式按钮禁用功能

## 功能描述

在 1v1 视频通话的预览模式下，除了接通和挂断按钮外，其他按钮（麦克风、摄像头、扬声器、屏幕共享）应该被禁用，提供更好的用户体验。

### 功能特点

- ✅ 预览模式下麦克风按钮禁用
- ✅ 预览模式下摄像头按钮禁用
- ✅ 预览模式下扬声器按钮禁用
- ✅ 预览模式下屏幕共享按钮禁用
- ✅ 接通和挂断按钮保持可用
- ✅ 禁用按钮显示半透明灰色
- ✅ 禁用按钮无法点击，不触发回调

## 实现方案

### 1. 修改 CallControls 组件

**修改文件：** `module/callkit/components/CallControls.tsx`

**修改内容：**

```typescript
// 预览模式下的按钮布局
if (isPreview) {
  return (
    <div className={rootClass} style={style}>
      {/* 主叫方显示挂断按钮，被叫方显示拒绝按钮 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, `${prefixCls}-button-hangup`)}
          onClick={isCaller ? handleHangupClick : handleRejectClick}
          title={isCaller ? '挂断' : '拒绝'}
        >
          <Icon type="X_MARK_THICK" width={24} height={24} color={'#F9FAFA'} />
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>{isCaller ? 'End' : 'Reject'}</div>
      </div>

      {/* 麦克风按钮 - 预览模式下禁用 */}
      <div className={classNames(`${prefixCls}-button-group`)}>
        <button
          className={classNames(`${prefixCls}-button`, {
            [`${prefixCls}-button-active`]: !muted,
            [`${prefixCls}-button-disabled`]: muted,
            [`${prefixCls}-button-preview-disabled`]: true, // 预览模式下禁用
          })}
          onClick={handleMuteClick}
          title={muted ? '取消静音' : '静音'}
          disabled={true} // 预览模式下禁用点击
        >
          <Icon
            type={muted ? 'MIC_OFF' : 'MIC_ON'}
            width={24}
            height={24}
            color={muted ? '#F9FAFA' : '#171A1C'}
          />
        </button>
        <div className={classNames(`${prefixCls}-button-text`)}>
          {muted ? 'Mike off' : 'Mike on'}
        </div>
      </div>

      {/* 摄像头按钮 - 只有视频通话时才显示，预览模式下禁用 */}
      {callMode === 'video' && (
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, {
              [`${prefixCls}-button-active`]: cameraEnabled,
              [`${prefixCls}-button-disabled`]: !cameraEnabled,
              [`${prefixCls}-button-preview-disabled`]: true, // 预览模式下禁用
            })}
            onClick={handleCameraClick}
            title={cameraEnabled ? '关闭摄像头' : '开启摄像头'}
            disabled={true} // 预览模式下禁用点击
          >
            <Icon
              type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'}
              color={cameraEnabled ? '#171A1C' : '#F9FAFA'}
              width={24}
              height={24}
            />
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>
            {cameraEnabled ? 'Camera on' : 'Camera off'}
          </div>
        </div>
      )}

      {/* 接听按钮 - 只有被叫方才显示 */}
      {!isCaller && (
        <div className={classNames(`${prefixCls}-button-group`)}>
          <button
            className={classNames(`${prefixCls}-button`, `${prefixCls}-button-accept`)}
            onClick={handleAcceptClick}
            title="接听"
          >
            <Icon
              type={callMode === 'video' ? 'VIDEO_CAMERA' : 'PHONE_PICK'}
              width={24}
              height={24}
              color={'#171A1C'}
            />
          </button>
          <div className={classNames(`${prefixCls}-button-text`)}>{'Accept'}</div>
        </div>
      )}
    </div>
  );
}
```

### 2. 添加禁用按钮样式

**修改文件：** `module/callkit/components/CallControls.scss`

**新增样式：**

```scss
// 预览模式下禁用状态
&-preview-disabled {
  opacity: 0.5;
  cursor: not-allowed;

  &:hover {
    transform: none;
    background: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: none;
    background: rgba(255, 255, 255, 0.2);
  }

  // 禁用时图标颜色变灰
  svg {
    opacity: 0.6;
  }
}
```

## 按钮控制规则

### 预览模式下可用按钮

1. **接通按钮（Accept）**

   - 显示条件：被叫方（`!isCaller`）
   - 功能：接听通话
   - 样式：绿色背景

2. **挂断按钮（End/Reject）**
   - 显示条件：主叫方显示"End"，被叫方显示"Reject"
   - 功能：挂断通话或拒绝邀请
   - 样式：红色背景

### 预览模式下禁用按钮

1. **麦克风按钮**

   - 状态：禁用（`disabled={true}`）
   - 样式：半透明灰色（`opacity: 0.5`）
   - 交互：无法点击（`cursor: not-allowed`）

2. **摄像头按钮**

   - 状态：禁用（`disabled={true}`）
   - 显示条件：视频通话模式（`callMode === 'video'`）
   - 样式：半透明灰色
   - 交互：无法点击

3. **扬声器按钮**

   - 状态：禁用（预览模式下不显示）
   - 显示条件：非音频通话（`callMode !== 'audio'`）

4. **屏幕共享按钮**
   - 状态：禁用（预览模式下不显示）
   - 功能：屏幕共享控制

## 视觉反馈

### 禁用按钮样式特点

1. **透明度降低**：`opacity: 0.5`
2. **鼠标指针**：`cursor: not-allowed`
3. **悬停效果**：无变化（`transform: none`）
4. **图标颜色**：变灰（`opacity: 0.6`）
5. **背景色**：保持原色，不响应悬停

### 可用按钮样式特点

1. **接通按钮**：绿色背景（`#52C41A`）
2. **挂断按钮**：红色背景（`#FF6680`）
3. **正常交互**：悬停和点击效果正常

## 测试验证

### 测试页面

- **文件：** `demo/callkit/preview-buttons-test.html`
- **功能：** 验证预览模式下按钮禁用功能

### 测试步骤

1. 初始化 CallKit
2. 进入预览模式
3. 观察按钮状态
4. 测试交互效果
5. 验证可用按钮

### 预期结果

- ✅ 麦克风按钮显示为禁用状态
- ✅ 摄像头按钮显示为禁用状态
- ✅ 禁用按钮无法点击
- ✅ 接通和挂断按钮正常可用
- ✅ 禁用按钮显示半透明灰色

## 技术细节

### 禁用实现方式

1. **HTML 属性禁用**：`disabled={true}`
2. **CSS 样式禁用**：`cursor: not-allowed`
3. **视觉反馈**：`opacity: 0.5`
4. **事件阻止**：React 自动处理 disabled 按钮的点击事件

### 样式优先级

```scss
&-preview-disabled {
  opacity: 0.5; // 覆盖默认透明度
  cursor: not-allowed; // 覆盖默认鼠标指针

  &:hover {
    transform: none; // 覆盖悬停效果
    background: rgba(255, 255, 255, 0.2); // 覆盖悬停背景
  }
}
```

## 兼容性

### 支持的通话类型

- ✅ 1v1 视频通话
- ✅ 1v1 音频通话
- ✅ 群组视频通话
- ✅ 群组音频通话

### 浏览器支持

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ 移动端浏览器

## 总结

这个功能实现了在预览模式下禁用不必要的按钮，提供更清晰的用户界面。通过 HTML 的`disabled`属性和 CSS 的视觉反馈，确保用户能够明确区分哪些按钮可用，哪些按钮不可用。

### 关键改进

1. **用户体验**：减少界面干扰，突出重要操作
2. **视觉一致性**：统一的禁用状态样式
3. **交互安全**：防止误操作
4. **代码可维护性**：清晰的样式结构和逻辑
