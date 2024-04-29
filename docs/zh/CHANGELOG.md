# 1.2.0

### 新增特性

- Provider 中 primaryColor 支持配置 hue 颜色值
- 支持单条消息转发
- thread 中支持视频消息和名片消息
- 群详情支持展示头像。
- 联系人列表支持展示头像
- 会话列表支持展示群组头像
- 个人信息页面增加音视频呼叫按钮
- 增加消息举报功能
- AddressStore 增加 updateGroupAvatar 方法，来设置群组头像

### 修复

- 修复获取群成员属性超限的错误
- 修复被引用的语音消息不能播发
- 修复有时无法获取会话列表

### 优化

- 修改 VideoMessage， ImageMessage, UserCardMessage 样式， 消息时间位置。
- 修改 Modal， Badge 样式。
- 语音消息过长影响布局。
- thread 中文本消息过长影响布局。
- GroupDetail 情支持展示头像。
- Header 组件增加点击更多按钮的回调 onClickEllipsis
- Input 组件增减 onFocus, onBlur, ref 参数。
- UserSelect 增加 disabled 参数
- 优化消息列表组件性能
- 优化 dark 主题下的组件样式

### 重大变更
