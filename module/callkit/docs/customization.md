# 自定义资源

## 布局配置

| 资源          | 描述               |
| :------------ | :----------------- |
| `aspectRatio` | 视频窗口宽高比。   |
| `gap`         | 窗口间距。         |
| `maxVideos`   | 最大显示视频数量。 |

## 窗口管理配置

| 资源                | 描述                         |
| :------------------ | :--------------------------- |
| `resizable`         | 窗口是否可调整大小。                 |
| `minWidth`          | 窗口最小宽度。                   |
| `minHeight`         | 窗口最小高度。                   |
| `maxWidth`          | 窗口最大宽度。                   |
| `maxHeight`         | 窗口最大高度。                   |
| `onResize`          | 窗口尺寸调整时的回调函数。   |
| `draggable`         | 窗口是否可拖拽。                     |
| `onDragStart`       | 开始拖拽时的回调函数。       |
| `onDrag`            | 拖拽过程中的回调函数。       |
| `onDragEnd`         | 拖拽结束时的回调函数。       |
| `managedPosition`   | 内置位置管理。               |
| `initialPosition`   | 初始位置。                   |
| `initialSize`       | 初始尺寸。                   |
| `minimizedSize`     | 群组通话最小化的尺寸。       |
| `onMinimizedChange` | 最小化状态变化时的回调函数。 |

## 自定义通话背景

| 资源              | 描述                |
| :---------------- | :------------------ |
| `backgroundImage` | 通话背景图片的 URL。 |

## 邀请配置

| 资源                      | 描述                   |
| :------------------------ | :--------------------- |
| `invitationCustomContent` | 自定义邀请内容组件。   |
| `showInvitationAvatar`    | 邀请界面是否显示头像。 |

## 呼叫超时时间

| 资源             | 描述                           |
| :--------------- | :----------------------------- |
| `autoRejectTime` | 呼叫超时自动取消的时间（秒），默认为 30 秒。 |

## 铃声配置

| 资源                  | 描述                   |
| :-------------------- | :--------------------- |
| `outgoingRingtoneSrc` | 呼出铃声的音频源路径。 |
| `incomingRingtoneSrc` | 来电铃声的音频源路径。 |
| `enableRingtone`      | 是否启用铃声。         |
| `ringtoneVolume`      | 铃声音量（0-1）。      |
| `ringtoneLoop`        | 铃声是否循环播放。     |

## 音量指示器

| 资源                      | 描述                         |
| :------------------------ | :--------------------------- |
| `speakingVolumeThreshold` | 音量阈值：说话检测 0-100，默认为 60。 |

## 自定义图标

| 资源                                | 描述                           |
| :---------------------------------- | :----------------------------- |
| `customIcons.controls.micOn`        | 麦克风打开时的自定义图标。     |
| `customIcons.controls.micOff`       | 麦克风关闭时的自定义图标。     |
| `customIcons.controls.cameraOn`     | 摄像头打开时的自定义图标。     |
| `customIcons.controls.cameraOff`    | 摄像头关闭时的自定义图标。     |
| `customIcons.controls.speakerOn`    | 扬声器打开时的自定义图标。     |
| `customIcons.controls.speakerOff`   | 扬声器关闭时的自定义图标。     |
| `customIcons.controls.hangup`       | 挂断按钮的自定义图标。         |
| `customIcons.controls.accept`       | 接听按钮的自定义图标。         |
| `customIcons.controls.reject`       | 拒接按钮的自定义图标。         |
| `customIcons.header.minimize`       | 最小化按钮的自定义图标。       |
| `customIcons.header.fullscreen`     | 全屏按钮的自定义图标。         |
| `customIcons.header.exitFullscreen` | 退出全屏按钮的自定义图标。     |
| `customIcons.header.addParticipant` | 群通话邀请人按钮的自定义图标。 |