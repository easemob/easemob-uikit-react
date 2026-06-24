# 自定义消息引用渲染功能更新

## 问题

用户实现了自定义的 `custom` 消息后，在引用这些消息时无法正确展示，因为 `RepliedMsg` 组件的 `renderMsgContent` 方法只处理了标准消息类型。

## 解决方案

新增 `renderCustomMessageQuote` 属性，允许用户自定义 custom 消息被引用时的展示内容。

## 快速开始

### 1. 基础用法

```tsx
import { Chat } from '@easemob/react-uikit';

<Chat
  messageProps={{
    renderCustomMessageQuote: context => {
      const { message, prefixCls } = context;

      if (message.customEvent === 'productCard') {
        return (
          <div className={`${prefixCls}-content-text`}>
            <Icon type="SHOPPING_BAG" />
            <span>商品:</span> {message.customExts?.productName}
          </div>
        );
      }

      return null; // 返回 null 使用默认渲染
    },
  }}
/>;
```

### 2. 处理多种类型

```tsx
<Chat
  messageProps={{
    renderCustomMessageQuote: context => {
      const { message, prefixCls } = context;

      switch (message.customEvent) {
        case 'productCard':
          return <ProductQuote message={message} prefixCls={prefixCls} />;
        case 'orderCard':
          return <OrderQuote message={message} prefixCls={prefixCls} />;
        default:
          return null;
      }
    },
  }}
/>
```

## API

### CustomMessageQuoteContext

```typescript
interface CustomMessageQuoteContext {
  message: ChatSDK.CustomMsgBody; // 被引用的自定义消息
  msgQuote?: {
    // 引用信息
    msgID: string;
    msgPreview: string;
    msgSender: string;
    msgType: string;
  };
  prefixCls: string; // CSS 类名前缀
}
```

### CustomMessageQuoteRenderer

```typescript
type CustomMessageQuoteRenderer = (context: CustomMessageQuoteContext) => ReactNode;
```

## 渲染优先级

1. **用户自定义渲染器**（如果返回非 null）
2. **内置 userCard 处理**
3. **默认提示**（显示"自定义消息"）

## 完整示例

```tsx
import React from 'react';
import { Chat } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';

function MyChat() {
  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: context => {
          const { message, prefixCls } = context;

          // 商品卡片
          if (message.customEvent === 'productCard') {
            return (
              <div className={`${prefixCls}-content-text`}>
                <img
                  src={message.customExts?.thumbnail}
                  style={{ width: 40, height: 40, borderRadius: 4 }}
                />
                <div>
                  <div>{message.customExts?.productName}</div>
                  <div style={{ color: '#ff4d4f' }}>¥{message.customExts?.price}</div>
                </div>
              </div>
            );
          }

          // 订单卡片
          if (message.customEvent === 'orderCard') {
            return (
              <div className={`${prefixCls}-content-text`}>
                <Icon type="DOC" color="#75828A" width={20} height={20} />
                <span>订单:</span> {message.customExts?.orderNo}
              </div>
            );
          }

          // 其他类型使用默认渲染
          return null;
        },
      }}
    />
  );
}
```

## 更新的文件

1. **`module/repliedMessage/RepliedMsg.tsx`**

   - 新增 `CustomMessageQuoteContext` 和 `CustomMessageQuoteRenderer` 类型
   - 新增 `renderCustomMessageQuote` 属性
   - 更新 `renderMsgContent` 方法支持自定义渲染

2. **`module/baseMessage/BaseMessage.tsx`**

   - 新增 `renderCustomMessageQuote` 属性
   - 传递给 `RepliedMsg` 组件

3. **`module/repliedMessage/index.ts`**
   - 导出新的类型定义

## 详细文档

查看完整文档：[CUSTOM_QUOTE_RENDERER_GUIDE.md](./CUSTOM_QUOTE_RENDERER_GUIDE.md)
