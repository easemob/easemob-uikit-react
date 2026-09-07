UIKit 改进


 现在你是资深前端技术专家/架构师， 你来看这个组件库的使用方式和工程化方面是否
  需要改进？ 组件设计的是否够灵活？ 或者说作为 IM SDK的配套产品应该怎么定位？设
  计成什么样？ 使用文档是否够详细？ 现在是 AI时代 怎么能让 uikit 更 AI友好？

 我会把这个 UIKit 定位成：IM SDK 的应用层框架，而不是一套普通 React 组件库。

  它不应该只提供 Button、Avatar、MessageBubble，也不应该只是 SDK API 的薄封装。
  它真正的价值应该是：让开发者在很短时间内搭出一个生产可用的 IM 应用，同时还能在
  业务复杂后逐层接管和定制。

  我的总体判断

  现在这个项目的方向是对的：有 SDK、store、module、component、container/page 这
  些层次，也能快速搭出 Chat、ConversationList、ContactList、Chatroom 这类页面级
  能力。

  但当前的问题是：能用，但边界还不够清晰；能定制，但定制方式不够稳定；能快速接
  入，但复杂业务接入后容易深入 rootStore 和内部实现。

  这会带来几个长期问题：

  1. 用户一开始很快，后面改需求时会频繁碰内部 store。
  2. SDK5 数据模型和 UIKit 旧模型容易混在一起。
  3. Provider 配置越来越多，但缺少清晰的“能力分层”。
  4. 组件有页面级能力，但 slot/headless 能力还不够系统。
  5. 文档偏 API 和局部说明，缺少“业务场景接入指南”。
  6. 工程化还没有形成稳定的公共 API 约束，内部改动容易影响用户。

  产品定位建议

  我建议把 UIKit 明确分成三层产品：

  1. 快速应用层
     面向想最快上线 IM 的用户。
     提供：
      - <Provider />
      - <Chat />
      - <ConversationList />
      - <ContactList />
      - <Chatroom />
      - <UIKitApp /> 或完整 demo template
  2. 业务组合层
     面向有自己业务页面的用户。
     提供 hooks、store context、headless 数据能力：
      - useConversationList
      - useMessages
      - useSendMessage
      - useUserInfo
      - useGroupMembers
      - useChatroom
      - useTyping
      - usePresence
  3. 底层 UI 组件层
     面向需要完全自定义 UI 的用户。
     提供纯展示组件：
      - MessageBubble
      - MessageList
      - MessageInput
      - ConversationItem
      - UserItem
      - Avatar
      - Reaction
      - ThreadPanel

  这样用户可以从完整页面开始，后续逐步下沉接管，而不是一上来就被迫理解
  rootStore。

  当前组件设计需要改进的地方

  最重要的是：页面级组件要更 slot 化，逻辑要更 headless。

  比如 Chat 不应该只靠很多 props 控制所有行为，而应该有稳定的插槽：

  <Chat>
    <Chat.Header />
    <Chat.MessageList
      renderMessage={...}
      renderAvatar={...}
      renderName={...}
    />
    <Chat.Input
      renderMoreActions={...}
      beforeSendMessage={...}
    />
  </Chat>

  或者：

  <Chat
    slots={{
      header: CustomHeader,
      message: CustomMessage,
      inputActions: CustomInputActions,
    }}
  />

  现在很多定制点散落在 props、store、message ext、render 函数里，用户能改，但不
  够系统。建议统一成：

  - slots：替换 UI 区块
  - renderers：替换消息渲染
  - providers：接入业务数据
  - handlers：接管业务动作
  - features：开关内置能力
  - adapters：接 SDK 或后端能力

  Provider 设计建议

  Provider 应该成为“应用能力注入点”，但要避免无限堆字段。

  可以设计成：

  <Provider
    sdk={{
      appKey,
      userId,
      token,
      enableSyncData,
    }}
    dataProviders={{
      userInfoProvider,
      groupInfoProvider,
      fileUploadProvider,
    }}
    features={{
      userInfo: true,
      presence: true,
      thread: true,
      reaction: true,
      callkit: true,
      ai: true,
    }}
    theme={theme}
    locale={locale}
  >
    <App />
  </Provider>

  当前 initConfig 里混合了 SDK 初始化、UIKit 行为、业务能力开关，后面会越来越难
  维护。建议逐步拆成：

  - sdk
  - features
  - providers
  - theme
  - locale
  - callbacks
  - experimental

  Store 设计建议

  现在 rootStore 对外暴露是现实需求，但要谨慎。建议把对外 store 分成两类：

  1. Public Store API
     稳定、文档化、语义清楚。
     例如：
      - conversationStore.setCurrentConversation
      - messageStore.sendMessage
      - addressStore.setAppUserInfo
      - addressStore.resolveUserInfo
  2. Internal Store API
     不承诺兼容，不建议用户调用。
     可以用命名、目录或文档区分。

  否则用户会依赖内部字段，一旦升级 SDK5 或重构 store，就会变成破坏性变更。

  工程化建议

  这里需要认真补强。作为 SDK 配套产品，工程质量应该比普通 demo 更高。

  优先级我建议这样排：

  1. 修复类型系统和声明文件
     现在 pnpm build 虽然退出码是 0，但 vite:dts 有类型错误，tsc --noEmit 也有大
     量 demo/story 旧问题。这个对组件库是硬伤。
     需要做到至少：
      - library 源码类型检查通过
      - demo/story 可以分开 tsconfig
      - dts 生成无错误
      - public API 类型稳定
  2. 建立 public API 边界
     用统一出口导出，不让用户随便 import 内部路径。
     可以配合：
      - exports 字段
      - API Extractor
      - TSDoc
      - changelog
  3. 测试分层
     需要几类测试：
      - store 单测
      - hooks 单测
      - SDK adapter contract test
      - message render snapshot
      - Playwright 跑核心 demo 流程
      - SDK5 mock/fake client 测试
  4. SDK 适配层独立
     UIKit 不应该到处直接理解 SDK 细节。建议有一层 sdkAdapter：
      - message normalize
      - conversation normalize
      - user info resolve
      - sync event handle
      - error normalize
  5. 版本和升级机制
     SDK 配套产品一定要有：
      - SDK version compatibility matrix
      - migration guide
      - codemod 或检查脚本
      - OpenSpec change 管理
      - breaking changes 文档

  文档是否够详细

  现在文档不够。不是缺 API，而是缺“用户怎么成功接入”的路径。

  应该重写成这几类：

  1. 5 分钟快速开始
     最小可运行 IM app。
  2. 核心概念
      - Provider
      - SDK client
      - rootStore
      - conversation
      - message
      - userInfo
      - group
      - chatroom
      - thread/reaction/presence
  3. 三种接入模式
      - 完整页面模式
      - 组合 hooks 模式
      - 纯 UI 组件模式
  4. 业务数据接入
      - 用户头像昵称
      - 群头像群名
      - 文件上传
      - 自定义消息
      - 权限/黑名单/审核
  5. 定制指南
      - 自定义消息渲染
      - 自定义 header
      - 自定义 message input action
      - 自定义会话列表 item
      - 自定义主题
  6. SDK5 迁移指南
     这个必须有，而且要写清楚新数据模型，不要再让用户自己猜。
  7. FAQ / Troubleshooting
     比如：
      - 为什么会话有头像但消息 sender 没有？
      - 为什么联系人为空？
      - 为什么同步失败？
      - 为什么 localStorage 加密？
      - 为什么切页面触发同步？

  AI 时代怎么让 UIKit 更 AI 友好

  这里分两层：让 AI 更容易帮用户开发 UIKit，以及 UIKit 自身提供 AI 能力。

  第一层，面向 AI coding agent：

  1. 维护高质量 AGENTS.md
     写清楚：
      - 项目结构
      - public API
      - store 边界
      - SDK5 数据模型
      - 常见任务怎么改
      - 不要做什么
  2. 增加 llms.txt / llms-full.txt
     给 AI 和文档工具读取：
      - docs 索引
      - API 索引
      - 示例入口
      - migration guide
  3. 示例要可复制
     每个场景一个最小 example：
      - 自定义 userInfoProvider
      - 自定义消息
      - 自定义会话列表
      - 接入业务用户系统
      - 接入 AI 助手
      - 接入机器人会话
  4. 公共 API 要强类型和 TSDoc
     AI 很依赖类型。类型越稳定、注释越清楚，AI 生成的代码越准。
  5. OpenSpec 工作流继续保留
     新功能先写 spec / tasks，再实现。这个对 AI 协作很有价值。
  6. 提供 AI 可验证的测试
     比如 Playwright 场景：
      - 登录
      - 同步会话
      - 打开单聊
      - 收消息
      - 显示头像昵称
      - 发送消息
      - 自定义消息渲染

  第二层，UIKit 自身提供 AI 能力：

  1. AI 助手会话
     提供标准 Bot/Agent conversation 类型，而不是让业务方自己 hack 单聊。
  2. 消息智能能力
      - 智能回复
      - 消息总结
      - 翻译
      - 语气改写
      - 会话摘要
      - 未读消息摘要
      - 风险内容提示
  3. AI 插槽
     例如：

     <MessageInput aiAssistant={...} />
     <Chat aiActions={['summary', 'reply', 'translate']} />

  4. 上下文提供机制
     AI 需要上下文，UIKit 可以标准化：
      - 当前会话信息
      - 最近 N 条消息
      - 当前用户资料
      - 群成员信息
      - 业务 metadata
  5. Agent SDK 适配
     如果 SDK 后续有 agent/bot 能力，UIKit 应该第一时间提供 UI 层标准组件：
      - agent typing
      - streaming message
      - tool call message
      - reasoning/引用展示
      - human handoff

  我建议的路线图

  短期，先做基础治理：

  1. 修类型检查和 dts 生成。
  2. 明确 Provider / Store / Public API 边界。
  3. 把用户资料、群资料、文件上传都改成 provider 模式。
  4. 文档补齐快速开始、用户资料、自定义消息、SDK5 迁移。
  5. 给核心 demo 加 Playwright 验证。

  中期，做架构升级：

  1. 提供 headless hooks。
  2. 页面组件全面 slot 化。
  3. SDK adapter 独立。
  4. rootStore API 分 public/internal。
  5. 建立 API compatibility 和 changelog。

  长期，做 AI Native UIKit：

  1. 标准 AI assistant conversation。
  2. 支持 streaming/tool-call/summary/smart-reply。
  3. 输出 AI-friendly docs、examples、specs。
  4. 给 AI agent 提供可执行任务模板和测试闭环。

  一句话总结

  这个项目不要把自己定位成“React 版 IM 组件集合”，而应该定位成：基于 Easemob SDK
  的 IM 应用框架。

  它的核心价值不是组件多，而是：

  - 快速搭建完整 IM
  - 复杂业务可渐进接管
  - SDK 升级对用户透明
  - 默认体验完整可靠
  - 文档和类型足够让人和 AI 都能正确使用

  现在最应该补的不是再加更多功能，而是把 public API、数据 provider、headless
  hooks、文档和工程质量这几条主线收稳。

