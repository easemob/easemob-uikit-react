# CallKit Demo 部署指南

## 构建命令

### 1. 构建 Demo

```bash
npm run build:demo
```

这将在 `dist-demo` 目录下生成构建文件。

### 2. 预览构建结果

```bash
npm run preview:demo
```

这将在 `http://localhost:4173` 启动预览服务器。

### 3. 开发模式

```bash
npm run dev:demo
```

这将在 `http://localhost:5174` 启动开发服务器。

通话中播放固定语音并在接收端转写的实验步骤见 [远端语音转文字实验](./audio-transcription-experiment.md)。该实验需要另外启动本机 ASR 服务。

### 4. 连接私有调试环境

登录页选择“本地代理（调试环境）”后，AppKey 可直接在表单中配置，demo 会使用以下同源地址：

- REST：`http://localhost:5174/rest`
- MSync：`ws://localhost:5174/websocket`
- Fusion 呼叫信令：`ws://localhost:5174/ws`（由 SDK 根据 REST 地址派生）

Vite 默认将它们分别代理到与 websdk2 demo 相同的服务：

- REST：`http://127.0.0.1:8082`
- MSync：`ws://127.0.0.1:4717`
- Fusion：`ws://127.0.0.1:8081`

可在仓库根目录的 `.env.local` 中覆盖代理目标：

```dotenv
EASEMOB_DEMO_REST_PROXY_TARGET=http://127.0.0.1:8082
EASEMOB_DEMO_MSYNC_PROXY_TARGET=ws://127.0.0.1:4717
EASEMOB_DEMO_FUSION_PROXY_TARGET=ws://127.0.0.1:8081
```

### 5. 直连正式环境

运行 `npm run dev:demo` 打开页面，在登录页选择“自定义服务（直连，可用于正式环境）”，填写：

- 正式环境对应的 App Key、用户 ID 和 IM Token（或密码）。
- 正式 REST 地址（`https://...`）和 MSync WebSocket 地址（`wss://.../websocket`）。原有预填地址不代表你的正式环境，请按实际部署替换。
- RTC App ID 选填，默认留空，通过 IM SDK 获取 RTC App ID 和 Token。手动填写时会覆盖 SDK 获取方式，双方需使用同一个允许无 RTC Token 模式的 RTC 项目。

此模式由浏览器直连服务，不需要启动本地 forward，IM 请求不经过 Vite 代理。`dev:demo` 仍需运行以提供网页；语音识别实验另需本机 ASR 服务。

登录页展示实际的 Fusion 地址。当前 SDK 根据 REST 的域名和端口派生 Fusion，例如 `https://rest.example.com/api` 对应 `wss://rest.example.com/ws`，不能在 demo 单独指定另一个 Fusion 域名。正式服务需提供这个入口，且支持当前 SDK 的呼叫信令协议；REST 需允许浏览器从 demo 页面跨域访问。单纯 IM 登录成功不代表呼叫信令已就绪，建议用两个窗口登录不同账号，分别验证来电、接听、远端音视频和挂断。

这一阶段只调整 demo；E2E 的 `.env.e2e.local` 服务环境和测试用例保持原配置，待手动验证后再切换。

## 部署步骤

### 1. 构建项目

```bash
npm run build:demo
```

### 2. 部署到静态服务器

构建完成后，`dist-demo` 目录包含以下文件：

- `real-call-demo.html` - 主页面
- `assets/` - 静态资源目录
  - `js/` - JavaScript 文件
  - `css/` - CSS 文件
  - `images/` - 图片资源

**重要特性：**

- ✅ **相对路径**：所有资源都使用相对路径，支持部署到任意子目录
- ✅ **OSS 兼容**：可以直接上传到阿里云 OSS、腾讯云 COS 等对象存储
- ✅ **CDN 友好**：支持通过 CDN 加速访问

### 3. 部署选项

#### 选项 1: 部署到 GitHub Pages

1. 将 `dist-demo` 目录重命名为 `docs`
2. 推送到 GitHub 仓库
3. 在仓库设置中启用 GitHub Pages，选择 `docs` 分支

#### 选项 2: 部署到 Netlify

1. 将 `dist-demo` 目录拖拽到 Netlify 部署界面
2. 或连接 GitHub 仓库，设置构建命令为 `npm run build:demo`，发布目录为 `dist-demo`

#### 选项 3: 部署到 Vercel

1. 连接 GitHub 仓库
2. 设置构建命令为 `npm run build:demo`
3. 设置输出目录为 `dist-demo`

#### 选项 4: 部署到传统服务器

1. 将 `dist-demo` 目录上传到服务器
2. 配置 Web 服务器（Nginx/Apache）指向该目录

#### 选项 5: 部署到对象存储（OSS/COS）

1. 将 `dist-demo` 目录中的所有文件上传到 OSS 的任意子目录
2. 设置 OSS 的静态网站托管功能
3. 访问 `https://your-bucket.oss-region.aliyuncs.com/your-subdir/real-call-demo.html`

## 访问方式

部署完成后，可以通过以下方式访问：

### URL 参数登录

```
http://localhost:5174/demo/callkit/call-demo.html?userId=your_user_id&password=your_password&appKey=your_app_key&serviceMode=proxy
```

### 手动登录

```
https://your-domain.com/real-call-demo.html
```

## 功能特性

- ✅ 真实通话功能：使用声网 RTC SDK
- ✅ 环信信令：使用环信 IM SDK
- ✅ 一对一通话：支持视频和语音
- ✅ 群组通话：支持多人视频和语音
- ✅ 通话控制：静音、摄像头、扬声器等
- ✅ URL 参数登录：支持通过 URL 参数直接登录
- ✅ 响应式设计：适配不同屏幕尺寸

## 注意事项

1. **CORS 配置**：确保服务器配置了正确的 CORS 头
2. **HTTPS**：生产环境建议使用 HTTPS，因为摄像头权限需要安全上下文
3. **浏览器兼容性**：支持现代浏览器（Chrome、Firefox、Safari、Edge）
4. **网络要求**：需要稳定的网络连接用于音视频通话

## 故障排除

### 常见问题

1. **摄像头权限被拒绝**

   - 确保使用 HTTPS 或 localhost
   - 检查浏览器权限设置

2. **无法建立通话**

   - 检查网络连接
   - 验证 AppKey 和用户凭据
   - 查看浏览器控制台错误信息

3. **页面加载失败**
   - 检查文件路径是否正确
   - 确认所有静态资源都已上传

### 调试模式

在开发模式下，可以查看详细的日志信息：

```bash
npm run dev:demo
```

然后打开浏览器开发者工具查看控制台输出。
