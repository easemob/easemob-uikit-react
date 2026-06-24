# Chatroom - 隐藏加入消息快速示例

## 最简单的方式：隐藏 "xx 加入了" 消息

```tsx
import { Chatroom } from '@easemob/react-uikit';
import { ChatSDK } from '@easemob/react-uikit/module/SDK';
import ChatroomMessage from '@easemob/react-uikit/module/chatroomMessage';

<Chatroom
  chatroomId="your-chatroom-id"
  customMessageRenderers={{
    custom: ctx => {
      const message = ctx.message as ChatSDK.CustomMsgBody;

      // 隐藏加入消息
      if (message.customEvent === 'CHATROOMUIKITUSERJOIN') {
        return null;
      }

      // 其他 custom 消息（如礼物）使用默认渲染
      return <ChatroomMessage message={message} key={message.id} />;
    },
  }}
/>;
```

## 说明

- ✅ 加入消息会被隐藏
- ✅ 礼物消息正常显示
- ✅ 文本消息正常显示
- ✅ 操作菜单正常工作

## 加入消息的特征

```typescript
message.type === 'custom';
message.customEvent === 'CHATROOMUIKITUSERJOIN';
```

## 礼物消息的特征

```typescript
message.type === 'custom';
message.customEvent === 'CHATROOMUIKITGIFT';
```

## 更多示例

查看完整文档：[CUSTOM_MESSAGE_RENDERER_GUIDE.md](./CUSTOM_MESSAGE_RENDERER_GUIDE.md)
