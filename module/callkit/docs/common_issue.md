# 常见问题

## 1. 发起通话无反应
   
- 检查 chatClient：chatClient 为 IM SDK 示例， 需确保 SDK 已经初始化并登录。
- 用户不存在：确保已在环信控制台创建用户。详见 [控制台文档](/product/console/operation_user.html#创建用户)。

## 2. 通话无法建立

- 对方离线：确保接听方在线且已登录。
- 网络问题：检查网络连接状况。

## 3. 音视频问题 

 - 无声音：检查麦克风权限和音频设备。
 - 无画面：检查摄像头权限和浏览器兼容性。 
 - 画面卡顿：检查网络带宽。 
  
## 4. 浏览器兼容性

- 不支持 Web RTC：确保使用现代浏览器最新版本。
- HTTPS 要求：生产环境需要 HTTPS 协议。
- 浏览器兼容详情，详见 [声网 RTC 文档](https://doc.shengwang.cn/doc/rtc/javascript/overview/browser-compatibility)。

## 5. 好友检查

默认情况下，环信 CallKit 支持陌生人之间进行通话，即无需添加好友即可通话。若在即时通讯 IM 控制台 [开启了好友检查](/product/console/basic_user.html#好友关系检查)，会导致非好友不能通过 CallKit 进行一对一通话，群组音视频通话信令也会受影响（邀请使用群定向消息，其他信令均为单聊消息）。建议不开启好友检查，后续 SDK 迭代会优化。
