# CallKit 音量指示器阈值配置

## 概述

CallKit 现在支持配置音量指示器的显示阈值，用户可以根据需要调整说话指示器的敏感度。

## 配置参数

### speakingVolumeThreshold

- **类型**: `number`
- **范围**: 1-100
- **默认值**: 60
- **说明**: 控制说话指示器显示的音量阈值

## 使用方法

### 基本用法

```tsx
import { CallKit } from '@easemob/uikit-react';

function MyCallComponent() {
  return (
    <CallKit
      // 其他配置...
      speakingVolumeThreshold={30} // 设置更敏感的音量阈值
    />
  );
}
```

### 不同阈值的效果

| 阈值   | 敏感度 | 适用场景                         |
| ------ | ------ | -------------------------------- |
| 1-20   | 极高   | 非常安静的环境，需要检测轻微声音 |
| 21-40  | 高     | 安静环境，检测正常说话声音       |
| 41-60  | 中等   | 一般环境，默认推荐值             |
| 61-80  | 低     | 嘈杂环境，只检测较大声音         |
| 81-100 | 极低   | 非常嘈杂的环境，只检测很大声音   |

### 示例配置

```tsx
// 安静环境 - 更敏感
<CallKit speakingVolumeThreshold={20} />

// 一般环境 - 默认值
<CallKit speakingVolumeThreshold={60} />

// 嘈杂环境 - 较不敏感
<CallKit speakingVolumeThreshold={80} />
```

## 技术说明

- 音量阈值基于 Agora RTC 的 `volume-indicator` 事件
- 当用户的音量级别超过设定阈值时，会显示 `SPEAKER_WAVE_2` 指示器
- 阈值越低，指示器越容易触发
- 阈值越高，指示器越不容易触发

## 注意事项

1. 阈值设置过低可能导致误触发（背景噪音也会显示指示器）
2. 阈值设置过高可能导致漏检（正常说话声音不显示指示器）
3. 建议根据实际使用环境调整阈值
4. 多人通话时，所有参与者使用相同的阈值设置
