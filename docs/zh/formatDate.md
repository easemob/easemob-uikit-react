# 格式化日期时间

会话列表和消息组件支持自定义日期时间格式，可以通过 `formatDateTime` 参数来实现

## 自定义会话列表中的日期时间

```jsx
<ConversationList
  itemProps={{
    formatDateTime: (time: number) => {
      // 将 time 时间戳格式化成自己需要的格式
      return new Date(time).toLocaleString();
    },
  }}
/>
```

## 自定义消息中的日期时间

```jsx
<Chat
  messageListProps={{
    messageProps: {
      formatDateTime: (time: number) => {
        return new Date(time).toLocaleString();
      },
    },
  }}
/>
```
