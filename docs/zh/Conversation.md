# 会话列表页面介绍

`ConversationList` 组件用于展示当前用户的所有会话，包含单聊和群组聊天（不包括聊天室），并且提供会话搜索、删除、置顶和免打扰功能。

## 页面组件

会话列表页面通过 `ConversationList` 组件实现，由标题栏、搜索栏和会话列表组成。

### 标题栏

会话列表页面与聊天页面、联系人列表页面、群详情页面、联系人详情页面的标题栏均使用 `Header` 组件。详见 [设置标题栏](#设置标题栏)。

### 会话搜索栏

会话搜索栏 `Search` 组件实现会话搜索。在搜索框中输入内容，可按会话名称或会话 ID 搜索会话。关于自定义，详见 [设置会话搜索栏](#设置会话搜索栏)。

### 会话列表

会话列表组件 `ConversationList` 实现按会话中最新一条消息的时间的倒序显示所有会话，包括：

- 两个用户之间发送消息后创建的单聊会话。
- 群组中发送消息后创建的群组会话。

在会话列表中，置顶的会话排在列表最上方。

会话条目组件 `ConversationItem` 实现单条会话展示，包括会话名称、最新一条消息、最新一条消息的时间以及置顶和免打扰状态等。

- **会话名称和头像**：对于单聊，会话名称为对端用户的昵称，若对端用户未设置昵称则展示对方用户 ID；会话头像是对方头像，若未设置则使用默认头像。对于群聊，会话名称为当前群组的名称或者群组 ID，头像为默认头像。
- **点击会话**：点击单个会话条目，跳转到会话详情页面。
- **长按会话**：长按单个会话条目显示会话操作弹窗，默认实现会话免打扰、会话置顶、会话标记已读和会话删除操作。

## 使用示例

```jsx
import React from 'react';
import { ConversationList } from 'easemob-chat-uikit';
import 'easemob-chat-uikit/style.css';

const Conversation = () => {
  return (
    <div style={{ width: '30%', height: '100%' }}>
      <ConversationList />
    </div>
  );
};
```

## 高级设置

## 会话列表的设置

本文介绍如何通过 `ConversationList` 组件的 props 实现会话列表的设置，包括会话列表空白页面、添加自定义会话列表和设置会话事件监听。

### 概述

`ConversationList` 组件提供了以下 props，方便开发者进行一些自定义设置：

```jsx
<ConversationList
  className="custom-conversation-list"
  style={{ backgroundColor: '#f5f5f5' }}
  // 自定义渲染 Header
  renderHeader={() => <CustomHeader />}
  // 自定义渲染 Search
  renderSearch={() => <CustomSearch />}
  // 自定义渲染会话条目
  renderItem={(cvs, index) => <CustomConversationItem cvs={cvs} />}
  // Header 的配置
  headerProps={{
    content: '会话',
    back: false,
    moreAction: {
      visible: true,
      actions: [{ content: '清除消息', onClick: () => {} }],
    },
  }}
  // 会话条目的配置
  itemProps={{
    avatarSize: 50,
    avatarShape: 'circle',
    badgeColor: '#ff0000',
    formatDateTime: time => new Date(time).toLocaleString(),
    renderMessageContent: msg => <div>自定义消息内容</div>,
    moreAction: {
      visible: true,
      actions: [{ content: 'DELETE' }, { content: 'PIN' }, { content: 'SILENT' }],
    },
  }}
  // 事件监听
  onItemClick={cvs => {
    console.log('点击会话', cvs);
  }}
  onSearch={e => {
    // 自定义搜索逻辑，返回 false 阻止默认搜索
    return true;
  }}
/>
```

`ConversationList` 组件提供的主要 props 如下表所示：

| 属性 | 类型 | 描述 |
| :-- | :-- | :-- |
| `className` | `string` | 组件的类名 |
| `style` | `React.CSSProperties` | 组件的内联样式 |
| `renderHeader` | `() => React.ReactNode` | 自定义渲染 Header 组件的方法 |
| `renderSearch` | `(props: { onSearch: (e: ChangeEvent<HTMLInputElement>) => void }) => React.ReactNode` | 自定义渲染搜索栏；参数中的 `onSearch` 需绑定到输入框的 `onChange` 以触发搜索并更新列表 |
| `renderItem` | `(cvs: Conversation, index: number) => React.ReactNode` | 自定义渲染会话条目的方法 |
| `headerProps` | `HeaderProps` | Header 组件的参数 |
| `itemProps` | `Partial<ConversationItemProps>` | ConversationItem 组件的参数 |
| `onItemClick` | `(data: Conversation) => void` | 点击会话条目的事件监听器 |
| `onSearch` | `(e: React.ChangeEvent<HTMLInputElement>) => boolean` | 搜索输入框的 change 事件，返回 false 会阻止默认搜索行为 |
| `showSearchList` | `boolean` | 是否显示搜索列表 |
| `includeEmptyConversations` | `boolean` | 是否包含空会话 |

### 设置会话列表背景

通过 `ConversationList` 组件的 `className` 和 `style` 属性可以设置会话列表的背景：

```jsx
<ConversationList
  className="custom-conversation-list"
  style={{
    backgroundImage: 'url(/path/to/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
/>
```

或使用 CSS 类：

```css
.custom-conversation-list {
  background-image: url(/path/to/background.jpg);
  background-size: cover;
  background-position: center;
}
```

### 设置会话列表空白页面

通过 `renderItem` 属性可以自定义会话条目的渲染，当没有会话时，可以通过外层容器来处理空白状态：

```jsx
<ConversationList
  renderItem={(cvs, index) => {
    if (!cvs) {
      return (
        <div className="empty-conversation">
          <p>暂无会话</p>
        </div>
      );
    }
    return <ConversationItem data={cvs} />;
  }}
/>
```

### 添加自定义会话列表

你可以通过 `renderItem` 方法自定义会话条目的渲染：

```jsx
import { ConversationList, ConversationItem } from 'easemob-chat-uikit';

const CustomConversationItem = ({ cvs }) => {
  return (
    <div className="custom-conversation-item">
      <Avatar src={cvs.avatarUrl} />
      <div>
        <div>{cvs.name}</div>
        <div>{cvs.lastMessage?.msg}</div>
      </div>
    </div>
  );
};

<ConversationList
  renderItem={(cvs, index) => {
    return <CustomConversationItem cvs={cvs} />;
  }}
/>;
```

### 设置事件监听

`ConversationList` 组件提供了针对会话条目的事件监听配置：

```jsx
<ConversationList
  // 点击会话条目事件
  onItemClick={cvs => {
    console.log('点击会话', cvs);
    // 跳转到聊天页面
    navigateToChat(cvs);
  }}
  // 搜索事件
  onSearch={e => {
    const value = e.target.value;
    console.log('搜索内容', value);
    // 返回 false 会阻止默认搜索行为，可以使用自己的搜索逻辑
    // return false;
    return true;
  }}
/>
```

### 默认会话操作

长按会话条目会显示会话操作菜单。会话列表页面默认实现以下操作：

| 会话操作   | 描述                |
| :--------- | :------------------ |
| 会话免打扰 | 设置/取消会话免打扰 |
| 会话置顶   | 置顶/取消置顶会话   |
| 会话删除   | 删除会话            |

你可以通过 `itemProps.moreAction` 来配置这些操作：

```jsx
<ConversationList
  itemProps={{
    moreAction: {
      visible: true,
      actions: [
        {
          content: 'DELETE', // 删除会话
        },
        {
          content: 'PIN', // 置顶会话
        },
        {
          content: 'SILENT', // 免打扰
        },
        {
          content: '自定义操作',
          onClick: cvs => {
            console.log('自定义操作', cvs);
          },
          icon: <Icon type="STAR" />,
        },
      ],
    },
  }}
/>
```

<!-- ## 会话列表的高级设置

### 概述

你可以通过 `ConversationList` 组件的 `itemProps` 属性进行高级设置：

```jsx
<ConversationList
  itemProps={{
    // 设置头像
    avatarSize: 50,
    avatarShape: 'circle', // 或 'square'
    avatar: <CustomAvatar />,
    // 设置未读数气泡颜色
    badgeColor: '#ff0000',
    // 设置时间格式
    formatDateTime: time => new Date(time).toLocaleString(),
    // 自定义消息内容渲染
    renderMessageContent: msg => <div>自定义消息内容</div>,
    // 设置更多操作菜单
    moreAction: {
      visible: true,
      actions: [{ content: 'DELETE' }, { content: 'PIN' }, { content: 'SILENT' }],
    },
  }}
/>
``` -->

### 设置会话条目背景

通过 CSS 类名可以设置会话条目的背景：

```css
.cui-conversationItem {
  background-color: #fff;
}

.cui-conversationItem:hover {
  background-color: #f5f5f5;
}

.cui-conversationItem-selected {
  background-color: #e6f5ff;
}

.cui-conversationItem-sticky {
  background-color: #fff9e6;
}
```

### 设置会话条目高度

通过 CSS 可以设置会话条目的高度：

```css
.cui-conversationItem {
  height: 74px;
  min-height: 74px;
}
```

### 设置会话标题文字大小、颜色等

通过 CSS 设置会话标题样式

```css
.cui-conversationItem-nickname {
  font-size: 16px;
  color: #171a1c;
}
```

### 设置会话条目内容

默认情况下，会话条目的内容区域显示 **最新一条消息摘要**，例如，文字、图片、语音等会转换为对应的摘要文本。

你可以通过 `itemProps.renderMessageContent` 自定义消息内容渲染：

```jsx
<ConversationList
  itemProps={{
    renderMessageContent: msg => {
      if (msg.type === 'txt') {
        return <div>文本消息：{msg.msg}</div>;
      } else if (msg.type === 'img') {
        return <div>[图片]</div>;
      }
      return <div>其他消息</div>;
    },
  }}
/>
```

或通过 CSS 调整内容样式：

```css
.cui-conversationItem-message {
  font-size: 14px;
  color: #666;
}
```

### 设置会话条目时间

默认情况下，会话条目的时间区域显示 **最新消息时间**（格式化后的时间字符串）。

你可以通过 `itemProps.formatDateTime` 设置时间格式：

```jsx
<ConversationList
  itemProps={{
    formatDateTime: time => {
      const date = new Date(time);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleString('zh-CN');
    },
  }}
/>
```

或通过 CSS 调整时间样式：

```css
.cui-conversationItem-time {
  font-size: 12px;
  color: #999;
}
```

### 设置会话条目头像

#### 设置默认头像

会话条目的默认头像由 `Avatar` 组件处理。如果会话数据中没有 `avatarUrl`，则使用默认头像。

#### 设置头像样式

如果要全局设置头像昵称，[参见](https://github.com/easemob/easemob-uikit-react/wiki/%E5%A4%B4%E5%83%8F%E6%98%B5%E7%A7%B0)

你可以通过 `itemProps` 设置头像的大小和形状：

```jsx
<ConversationList
  itemProps={{
    avatarSize: 50, // 头像大小，单位 px
    avatarShape: 'circle', // 头像形状：'circle' | 'square'
    // 或完全自定义头像
    avatar: (
      <Avatar src={customAvatarUrl} size={50} shape="square" style={{ borderRadius: '8px' }} />
    ),
  }}
/>
```

#### 隐藏会话条目头像

你可以通过 `renderItem` 方法自定义渲染，不渲染头像：

```jsx
<ConversationList
  renderItem={(cvs, index) => {
    return (
      <ConversationItem
        data={cvs}
        avatar={null} // 不显示头像
        itemProps={
          {
            // 其他配置...
          }
        }
      />
    );
  }}
/>
```

### 设置会话条目长按菜单

长按会话条目会显示会话操作菜单。会话列表页面默认实现会话免打扰、会话置顶、会话标记已读和会话删除操作。

#### 设置会话操作

你可以通过 `itemProps.moreAction` 来管理长按菜单项：

```jsx
<ConversationList
  itemProps={{
    moreAction: {
      visible: true,
      actions: [
        {
          content: 'DELETE',
          onClick: async cvs => {
            // 自定义删除逻辑
            const confirmed = await showConfirmDialog();
            if (confirmed) {
              // 执行删除
              return true;
            }
            return false;
          },
        },
        {
          content: 'PIN',
          onClick: cvs => {
            // 自定义置顶逻辑
            console.log('置顶会话', cvs);
          },
        },
        {
          content: 'SILENT',
          onClick: cvs => {
            // 自定义免打扰逻辑
            console.log('免打扰会话', cvs);
          },
        },
        {
          content: '自定义操作',
          icon: <Icon type="STAR" />,
          onClick: cvs => {
            console.log('自定义操作', cvs);
          },
        },
      ],
    },
  }}
/>
```

### 设置消息未读计数图标

会话列表的未读提示支持 **数字** 与 **小蓝点** 两种样式。

默认以数字形式显示在会话项右侧。

#### 设置计数展示方式

你可以通过 `itemProps.badgeColor` 设置未读数气泡颜色：

```jsx
<ConversationList
  itemProps={{
    badgeColor: '#ff0000', // 未读数气泡颜色
  }}
/>
```

未读数的显示逻辑由 `Badge` 组件控制：

- 当 `unreadCount > 0` 时，显示数字。
- 当 `silent === true` 时，显示小点（dot）。

#### 替换背景与图标

通过 CSS 可以自定义未读数气泡的样式：

```css
.cui-badge {
  /* 未读数气泡样式 */
  background-color: #ff0000;
  color: #fff;
}

.cui-badge-dot {
  /* 未读点样式 */
  background-color: #ff0000;
}
```

#### 隐藏未读图标

你可以通过自定义渲染来隐藏未读图标：

```jsx
<ConversationList
  renderItem={(cvs, index) => {
    return (
      <ConversationItem
        data={{
          ...cvs,
          unreadCount: 0, // 设置为 0 隐藏未读数
        }}
      />
    );
  }}
/>
```

## 设置会话搜索栏

会话列表页面支持按会话名称搜索会话。你可以设置是否使用搜索栏、自定义搜索栏的样式和自定义搜索逻辑。

### 设置使用默认搜索栏

你可以通过 `showSearchList` 属性控制是否显示搜索栏：

```jsx
<ConversationList
  showSearchList={true} // 显示搜索栏（默认）
/>
```

或通过全局配置控制：

```jsx
// 在初始化时配置
const features = {
  conversationList: {
    search: true, // 显示搜索栏
  },
};
```

### 自定义搜索栏

你可以通过 `renderSearch` 方法自定义搜索栏的 UI。`renderSearch` 会收到一个参数对象，包含 **`onSearch`** 方法：在自定义输入框的 `onChange` 中调用 `onSearch(e)`，即可触发组件内部的搜索逻辑并更新下方会话列表的展示结果。

**实现方式：**

- 使用 `renderSearch` 提供的 `onSearch`：将 `onSearch(e)` 绑定到你的 input 的 `onChange`，列表会按「会话 ID」和「会话名称」做默认过滤并更新。
- 若需要完全自定义过滤逻辑（例如按备注、拼音等），可同时使用 `onSearch` 属性：在回调里返回 `false` 并自行从 `RootContext` 获取 `conversationStore`，调用 `setSearchList(filteredList)` 设置搜索结果（详见下方「自定义搜索逻辑」）。

**示例：自定义搜索栏 UI，使用内置搜索行为**

```jsx
<ConversationList
  renderSearch={({ onSearch }) => (
    <div className="custom-search">
      <input
        type="text"
        placeholder="搜索会话"
        onChange={e => onSearch(e)}
      />
    </div>
  )}
/>
```

**示例：自定义搜索栏 UI + 自定义搜索逻辑（自己设置搜索结果）**

在父组件中通过 `useContext(RootContext)` 获取 `rootStore`，再在 `onSearch` 回调中使用（不可在回调内部调用 `useContext`）：

```jsx
import { useContext } from 'react';
import { RootContext } from 'module/store/rootContext';

function MyConversationList() {
  const { rootStore } = useContext(RootContext);
  const { conversationStore } = rootStore;

  return (
    <ConversationList
      renderSearch={({ onSearch }) => (
        <div className="custom-search">
          <input
            type="text"
            placeholder="按名称或 ID 搜索"
            onChange={e => onSearch(e)}
          />
        </div>
      )}
      onSearch={e => {
        const value = e.target.value.trim();
        const list = conversationStore.conversationList;
        const filteredList = list.filter(cvs => {
          const name = cvs.name ?? '';
          return name.includes(value) || cvs.conversationId.includes(value);
        });
        conversationStore.setSearchList(filteredList);
        return false; // 阻止默认搜索，使用上面设置的结果
      }}
    />
  );
}
```

### 自定义搜索逻辑

通过 `onSearch` 可以接管搜索逻辑。`onSearch` 签名为 `(e: React.ChangeEvent<HTMLInputElement>) => boolean`：

- **不返回或返回非 `false`**：组件会使用默认逻辑（按会话 ID、会话名称过滤），并自动更新展示的会话列表。
- **返回 `false`**：表示由你完全自定义搜索；组件不会更新列表，你需要**自己设置搜索结果**，否则列表不会变化。

**如何设置搜索结果**

当 `onSearch` 返回 `false` 时，必须由你在回调内更新「搜索列表」：

1. 使用 `RootContext` 获取 `rootStore`，再取 `rootStore.conversationStore`。
2. 会话数据来源：`conversationStore.conversationList`（类型为 `Conversation[]`）。
3. 根据输入关键字过滤得到 `filteredList`（保持为 `Conversation[]`）。
4. 调用 **`conversationStore.setSearchList(filteredList)`**，列表会展示你传入的会话数组；清空输入时建议传入空数组或完整列表。

**示例：仅自定义过滤条件，自己设置搜索结果**

在父组件中获取 `rootStore`，在 `onSearch` 中过滤并调用 `setSearchList`：

```jsx
import { useContext } from 'react';
import { RootContext } from 'module/store/rootContext';

function MyConversationList() {
  const { rootStore } = useContext(RootContext);

  return (
    <ConversationList
      onSearch={e => {
        const value = e.target.value;
        const list = rootStore.conversationStore.conversationList;
        const filteredList = list.filter(cvs => {
          return (
            (cvs.name && cvs.name.includes(value)) ||
            cvs.conversationId.includes(value)
          );
        });
        rootStore.conversationStore.setSearchList(filteredList);
        return false; // 使用上面设置的结果
      }}
    />
  );
}
```

**示例：使用默认搜索栏，仅扩展过滤条件（不接管）**

若不返回 `false`，可以不设置 `setSearchList`，仅用 `onSearch` 做额外逻辑（如埋点），列表仍由组件默认更新：

```jsx
<ConversationList
  onSearch={e => {
    console.log('用户搜索:', e.target.value);
    // 不 return false，使用默认搜索与结果
  }}
/>
```

## 设置标题栏

会话列表页面的标题栏使用 `Header` 组件，你可以通过 `ConversationList` 组件的 `headerProps` 进行自定义设置。

### 标题栏可修改的属性

```jsx
<ConversationList
  headerProps={{
    // 标题内容
    content: '会话',
    // 副标题
    subtitle: '在线',
    // 是否显示返回按钮
    back: false,
    // 返回按钮点击事件
    onClickBack: () => {
      console.log('点击返回');
    },
    // 右侧自定义图标
    suffixIcon: <Icon type="PLUS_IN_CIRCLE" />,
    // 更多操作菜单
    moreAction: {
      visible: true,
      actions: [
        {
          content: '新建会话',
          onClick: () => {
            console.log('新建会话');
          },
        },
        {
          content: '添加联系人',
          onClick: () => {
            console.log('添加联系人');
          },
        },
      ],
    },
    // 自定义渲染中间内容部分
    renderContent: () => {
      return <div>自定义标题内容</div>;
    },
  }}
/>
```

### 自定义渲染标题栏

你也可以通过 `renderHeader` 完全自定义标题栏：

```jsx
<ConversationList
  renderHeader={() => {
    return (
      <div className="custom-header">
        <div>会话列表</div>
        <div>自定义标题栏内容</div>
      </div>
    );
  }}
/>
```

## 自定义样式与资源

### 修改会话列表背景

**方式一：通过 style 属性**

```jsx
<ConversationList
  style={{
    backgroundImage: 'url(/path/to/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
/>
```

**方式二：通过 CSS 类名**

```css
.cui-conversationList {
  background-image: url(/path/to/background.jpg);
  background-size: cover;
  background-position: center;
}
```

### 可自定义的 CSS 类名

ConversationList 提供了以下主要的 CSS 类名，你可以通过覆盖这些类名来自定义样式：

| 类名                             | 说明                         |
| :------------------------------- | :--------------------------- |
| `.cui-conversationList`          | 会话列表容器                 |
| `.cui-conversationList-search`   | 搜索栏容器                   |
| `.cui-conversationItem`          | 会话条目                     |
| `.cui-conversationItem-selected` | 选中的会话条目               |
| `.cui-conversationItem-sticky`   | 置顶的会话条目               |
| `.cui-conversationItem-nickname` | 会话名称                     |
| `.cui-conversationItem-message`  | 会话消息内容                 |
| `.cui-conversationItem-time`     | 会话时间                     |
| `.cui-conversationItem-info`     | 会话信息区域（时间和未读数） |

## ConversationList props 总览

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `className` | `string` | 组件的类名 |
| `prefix` | `string` | CSS 类名前缀 |
| `style` | `React.CSSProperties` | 组件的内联样式 |
| `headerProps` | `HeaderProps` | Header 组件的参数 |
| `itemProps` | `Partial<ConversationItemProps>` | ConversationItem 组件的参数 |
| `renderHeader` | `() => React.ReactNode` | 自定义渲染 Header 组件的方法 |
| `renderSearch` | `(props: { onSearch: (e: ChangeEvent<HTMLInputElement>) => void }) => React.ReactNode` | 自定义渲染搜索栏；参数中的 `onSearch` 需绑定到输入框的 `onChange` 以触发搜索并更新列表 |
| `renderItem` | `(cvs: Conversation, index: number) => React.ReactNode` | 自定义渲染会话条目的方法 |
| `onItemClick` | `(data: Conversation) => void` | 点击会话列表中每个会话的回调事件 |
| `onSearch` | `(e: React.ChangeEvent<HTMLInputElement>) => boolean` | 搜索输入框的 change 事件，当函数返回 false 时，会阻止默认的搜索行为 |
| `showSearchList` | `boolean` | 是否显示搜索列表 |
| `includeEmptyConversations` | `boolean` | 是否包含空会话（会话里消息被撤回或者过期） |
| `presence` | `boolean` | 是否显示在线状态 |

## ConversationItem props 总览

| 参数 | 类型 | 描述 |
| :-- | :-- | :-- |
| `className` | `string` | 组件的类名 |
| `prefix` | `string` | CSS 类名前缀 |
| `style` | `React.CSSProperties` | 组件的内联样式 |
| `avatarSize` | `number` | 头像大小，单位 px，默认 50 |
| `avatarShape` | `'circle' \| 'square'` | 头像形状，默认 'circle' |
| `avatar` | `ReactNode` | 自定义头像 |
| `badgeColor` | `string` | 未读数气泡颜色 |
| `isActive` | `boolean` | 是否被选中 |
| `data` | `Conversation` | 会话数据 |
| `renderMessageContent` | `(msg: BaseMessageType) => ReactNode \| undefined` | 自定义渲染消息内容的方法 |
| `formatDateTime` | `(time: number) => string` | 自定义时间格式化方法 |
| `moreAction` | `object` | 更多操作菜单配置 |
| `ripple` | `boolean` | 是否显示涟漪效果 |

## 修改主题

`ConversationList` 组件提供了以下与会话列表页面主题相关的 SCSS 变量，关于怎样修改主题请查看 [主题文档](https://github.com/easemob/Easemob-UIKit-web/blob/dev/docs/theme.md)。

```scss
// Variables used to set the conversation theme.
$cvs-background: $component-background;
$cvs-search-margin: $margin-xs $margin-sm;
$cvs-item-height: 74px;
$cvs-item-padding: $padding-s;
$cvs-item-border-radius: 16px;
$cvs-item-margin: $margin-xss $margin-xs;
$cvs-item-selected-bg-color: #e6f5ff;
$cvs-item-selected-name-color: $blue-6;
$cvs-item-hover-bg-color: $gray-98;
$cvs-item-active-bg-color: $gray-9;
$cvs-item-info-right: 16px;
$cvs-item-name-margin: 0 $margin-sm;
$cvs-item-name-font-size: $font-size-lg;
$cvs-item-name-font-weight: 500;
$cvs-item-name-color: $title-color;
$cvs-item-message-margin-left: $margin-sm;
$cvs-item-message-font-size: $font-size-base;
$cvs-item-message-font-weight: 400;
$cvs-item-message-color: $font-color;
$cvs-item-time-font-weight: 400;
$cvs-item-time-font-size: $font-size-sm;
$cvs-item-time-color: $gray-5;
$cvs-item-time-margin-bottom: 9px;
```
