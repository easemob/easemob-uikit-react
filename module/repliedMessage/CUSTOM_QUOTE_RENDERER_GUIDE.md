# 自定义消息引用渲染器指南

## 问题背景

当用户实现了自定义的 `custom` 消息类型后，在引用这些自定义消息时，`RepliedMsg` 组件无法正确展示引用信息，因为内置的 `renderMsgContent` 方法只处理了标准消息类型和内置的 `userCard` 类型。

## 解决方案

新增 `renderCustomMessageQuote` 属性，允许用户自定义 custom 消息被引用时的展示内容。

## API 说明

### 类型定义

```typescript
// 自定义消息引用渲染器的上下文
export interface CustomMessageQuoteContext {
  message: ChatSDK.CustomMsgBody;
  msgQuote?: {
    msgID: string;
    msgPreview: string;
    msgSender: string;
    msgType: ChatSDK.MessageBody['type'];
  };
  prefixCls: string;
}

// 自定义消息引用渲染器类型
export type CustomMessageQuoteRenderer = (
  context: CustomMessageQuoteContext
) => ReactNode;
```

### Props

#### BaseMessage

```typescript
interface BaseMessageProps {
  // ... 其他属性
  
  /** 自定义消息被引用时的渲染器 */
  renderCustomMessageQuote?: CustomMessageQuoteRenderer;
}
```

#### RepliedMsg

```typescript
interface RepliedMsgProps {
  // ... 其他属性
  
  /** 自定义消息被引用时的渲染器 */
  renderCustomMessageQuote?: CustomMessageQuoteRenderer;
}
```

## 使用示例

### 示例 1：基础用法

```tsx
import { Chat } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';

function MyChat() {
  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: (context) => {
          const { message, prefixCls } = context;
          
          // 处理你的自定义消息类型
          if (message.customEvent === 'productCard') {
            return (
              <div className={`${prefixCls}-content-text`}>
                <Icon type="SHOPPING_BAG" color="#75828A" width={20} height={20} />
                <span>商品:</span> {message.customExts?.productName}
              </div>
            );
          }
          
          // 返回 null 使用默认渲染
          return null;
        },
      }}
    />
  );
}
```

### 示例 2：多种自定义消息类型

```tsx
import { Chat } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';

function MyChat() {
  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: (context) => {
          const { message, prefixCls } = context;
          
          switch (message.customEvent) {
            case 'productCard':
              return (
                <div className={`${prefixCls}-content-text`}>
                  <Icon type="SHOPPING_BAG" color="#75828A" width={20} height={20} />
                  <span>商品:</span> {message.customExts?.productName}
                </div>
              );
              
            case 'orderCard':
              return (
                <div className={`${prefixCls}-content-text`}>
                  <Icon type="DOC" color="#75828A" width={20} height={20} />
                  <span>订单:</span> {message.customExts?.orderNo}
                </div>
              );
              
            case 'locationCard':
              return (
                <div className={`${prefixCls}-content-text`}>
                  <Icon type="MAP" color="#75828A" width={20} height={20} />
                  <span>位置:</span> {message.customExts?.address}
                </div>
              );
              
            default:
              // 未知类型，返回 null 使用默认渲染
              return null;
          }
        },
      }}
    />
  );
}
```

### 示例 3：带图片的引用

```tsx
function MyChat() {
  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: (context) => {
          const { message, prefixCls } = context;
          
          if (message.customEvent === 'productCard') {
            return (
              <div className={`${prefixCls}-content-text`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 商品缩略图 */}
                  <img
                    src={message.customExts?.thumbnail}
                    alt="product"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {message.customExts?.productName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      ¥{message.customExts?.price}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          return null;
        },
      }}
    />
  );
}
```

### 示例 4：使用 msgQuote 信息

```tsx
function MyChat() {
  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: (context) => {
          const { message, msgQuote, prefixCls } = context;
          
          if (message.customEvent === 'richText') {
            return (
              <div className={`${prefixCls}-content-text`}>
                <Icon type="BUBBLE_FILL" color="#75828A" width={20} height={20} />
                <span>富文本消息:</span>
                {/* 使用 msgQuote 中的预览文本 */}
                <span style={{ color: '#666' }}>
                  {msgQuote?.msgPreview || '内容预览'}
                </span>
              </div>
            );
          }
          
          return null;
        },
      }}
    />
  );
}
```

### 示例 5：点击交互

```tsx
function MyChat() {
  const handleQuoteClick = (message: ChatSDK.CustomMsgBody) => {
    console.log('点击了引用消息:', message);
    // 可以打开详情弹窗等
  };

  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote: (context) => {
          const { message, prefixCls } = context;
          
          if (message.customEvent === 'fileCard') {
            return (
              <div
                className={`${prefixCls}-content-text`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleQuoteClick(message)}
              >
                <Icon type="DOC" color="#75828A" width={20} height={20} />
                <span>文件:</span> {message.customExts?.fileName}
                <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                  点击查看
                </span>
              </div>
            );
          }
          
          return null;
        },
      }}
    />
  );
}
```

## 渲染逻辑

### 优先级

1. **用户自定义渲染器**：如果提供了 `renderCustomMessageQuote` 且返回非 null 值，使用自定义渲染
2. **内置 userCard 处理**：如果是 `userCard` 类型，使用内置渲染
3. **默认提示**：显示 "自定义消息" 的默认提示

### 代码实现

```typescript
case 'custom':
  // 优先使用用户自定义的渲染器
  if (renderCustomMessageQuote) {
    const customContent = renderCustomMessageQuote({
      message: repliedMsg as ChatSDK.CustomMsgBody,
      msgQuote,
      prefixCls,
    });
    if (customContent) {
      content = customContent;
      break;
    }
  }
  
  // 内置的 userCard 类型处理
  if ((repliedMsg as ChatSDK.CustomMsgBody).customEvent === 'userCard') {
    content = (
      <div className={`${prefixCls}-content-text`}>
        <Icon type="PERSON_SINGLE_FILL" color="#75828A" width={20} height={20} />
        <span>Contact:</span> {(repliedMsg as ChatSDK.CustomMsgBody).customExts?.nickname}
      </div>
    );
  } else {
    // 未知的 custom 类型，显示默认提示
    content = (
      <div className={`${prefixCls}-content-text`}>
        <Icon type="BUBBLE_FILL" color="#75828A" width={20} height={20} />
        <span>{t('customMessage')}</span>
      </div>
    );
  }
  break;
```

## 样式建议

### 推荐的样式结构

```tsx
<div className={`${prefixCls}-content-text`}>
  {/* 图标 */}
  <Icon type="YOUR_ICON" color="#75828A" width={20} height={20} />
  
  {/* 标签 */}
  <span>类型标签:</span>
  
  {/* 内容 */}
  <span>{content}</span>
</div>
```

### 可用的 CSS 类

- `${prefixCls}-content-text`：标准的内容文本样式
- `${prefixCls}-summary-desc-img`：图片容器样式（如果需要显示图片）

### 自定义样式

```tsx
renderCustomMessageQuote: (context) => {
  return (
    <div 
      className={`${context.prefixCls}-content-text`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        background: '#f5f5f5',
        borderRadius: '4px',
      }}
    >
      {/* 你的内容 */}
    </div>
  );
}
```

## 完整示例

### 场景：电商应用

```tsx
import React from 'react';
import { Chat } from '@easemob/react-uikit';
import Icon from '@easemob/react-uikit/component/icon';

interface ProductCardData {
  productId: string;
  productName: string;
  price: number;
  thumbnail: string;
  stock: number;
}

interface OrderCardData {
  orderNo: string;
  totalAmount: number;
  status: string;
}

function ECommerceChat() {
  const renderCustomMessageQuote = (context) => {
    const { message, prefixCls } = context;
    
    switch (message.customEvent) {
      case 'productCard': {
        const data = message.customExts as ProductCardData;
        return (
          <div className={`${prefixCls}-content-text`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={data.thumbnail}
                alt={data.productName}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {data.productName}
                </div>
                <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                  ¥{data.price}
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      case 'orderCard': {
        const data = message.customExts as OrderCardData;
        return (
          <div className={`${prefixCls}-content-text`}>
            <Icon type="DOC" color="#75828A" width={20} height={20} />
            <span>订单:</span>
            <span style={{ fontWeight: 'bold' }}>{data.orderNo}</span>
            <span style={{ marginLeft: '8px', color: '#999' }}>
              ¥{data.totalAmount}
            </span>
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <Chat
      messageProps={{
        renderCustomMessageQuote,
      }}
    />
  );
}

export default ECommerceChat;
```

## 最佳实践

### 1. 类型判断

始终检查 `customEvent` 类型，只处理你的自定义类型：

```tsx
renderCustomMessageQuote: (context) => {
  const { message } = context;
  
  // 只处理你的类型
  if (message.customEvent === 'myType') {
    return <YourComponent />;
  }
  
  // 其他类型返回 null，使用默认处理
  return null;
}
```

### 2. 错误处理

添加错误边界，防止渲染失败：

```tsx
renderCustomMessageQuote: (context) => {
  try {
    const { message, prefixCls } = context;
    
    if (message.customEvent === 'myType') {
      return (
        <div className={`${prefixCls}-content-text`}>
          {/* 你的内容 */}
        </div>
      );
    }
  } catch (error) {
    console.error('渲染自定义引用消息失败:', error);
    return (
      <div className={`${context.prefixCls}-content-text`}>
        <span>消息加载失败</span>
      </div>
    );
  }
  
  return null;
}
```

### 3. 性能优化

对于复杂的渲染逻辑，考虑使用 `useMemo`：

```tsx
const renderCustomMessageQuote = useMemo(() => {
  return (context) => {
    // 复杂的渲染逻辑
    return <ComplexComponent {...context} />;
  };
}, [/* 依赖项 */]);

<Chat messageProps={{ renderCustomMessageQuote }} />
```

### 4. 一致性

保持与内置消息类型相似的视觉风格：

```tsx
// ✅ 推荐：与内置样式一致
<div className={`${prefixCls}-content-text`}>
  <Icon type="YOUR_ICON" color="#75828A" width={20} height={20} />
  <span>标签:</span> {content}
</div>

// ❌ 不推荐：完全不同的样式
<div style={{ background: 'red', fontSize: '24px' }}>
  {content}
</div>
```

## 常见问题

### Q1: 为什么我的自定义渲染器没有生效？

**A:** 检查以下几点：
1. 确保返回的不是 `null`
2. 检查 `customEvent` 的值是否匹配
3. 确保 `renderCustomMessageQuote` 正确传递到了 `Chat` 或 `MessageList` 组件

### Q2: 如何访问消息的完整数据？

**A:** 通过 `context.message` 可以访问完整的消息对象：

```tsx
renderCustomMessageQuote: (context) => {
  const message = context.message;
  console.log('完整消息数据:', message);
  console.log('自定义扩展:', message.customExts);
  console.log('消息ID:', message.id);
  // ...
}
```

### Q3: 可以在引用中显示图片吗？

**A:** 可以，参考示例 3：

```tsx
<div className={`${prefixCls}-content-text`}>
  <img src={imageUrl} style={{ width: '40px', height: '40px' }} />
</div>
```

### Q4: 如何处理点击事件？

**A:** 在返回的 JSX 中添加 `onClick`：

```tsx
<div
  className={`${prefixCls}-content-text`}
  style={{ cursor: 'pointer' }}
  onClick={() => {
    // 处理点击
  }}
>
  {content}
</div>
```

### Q5: 内置的 userCard 类型会被覆盖吗？

**A:** 不会。只有当你的渲染器返回非 null 值时才会使用自定义渲染。如果返回 null，会继续使用内置的 userCard 处理逻辑。

## 相关文档

- [BaseMessage 组件文档](../baseMessage/README.md)
- [RepliedMsg 组件文档](./README.md)
- [自定义消息发送指南](../messageInput/CUSTOM_MESSAGE_GUIDE.md)

