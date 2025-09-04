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
https://your-domain.com/real-call-demo.html?userId=your_user_id&password=your_password&appKey=your_app_key
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
