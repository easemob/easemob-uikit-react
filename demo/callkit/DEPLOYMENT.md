# CallKit Demo 快速部署指南

## 🚀 快速开始

### 1. 构建 Demo

```bash
npm run build:demo
```

### 2. 本地预览

```bash
npm run preview:demo
```

然后访问：http://localhost:4173/demo/callkit/real-call-demo.html

### 3. 开发模式

```bash
npm run dev:demo
```

然后访问：http://localhost:5174/demo/callkit/real-call-demo.html

## 📦 部署选项

### 选项 1: 本地部署

```bash
npm run deploy:demo
```

### 选项 2: GitHub Pages

```bash
npm run deploy:demo:github
```

然后按照提示推送到 GitHub 并启用 GitHub Pages。

### 选项 3: Netlify

```bash
npm run deploy:demo:netlify
```

然后按照提示在 Netlify 中配置。

### 选项 4: Vercel

```bash
npm run deploy:demo:vercel
```

然后按照提示在 Vercel 中配置。

## 📁 构建输出

构建完成后，`dist-demo` 目录包含：

- `real-call-demo.html` - 主页面
- `assets/` - 静态资源
  - `js/` - JavaScript 文件
  - `css/` - CSS 文件
  - `images/` - 图片资源

### ✨ 重要特性

- ✅ **相对路径**：所有资源都使用相对路径，支持部署到任意子目录
- ✅ **OSS 兼容**：可以直接上传到阿里云 OSS、腾讯云 COS 等对象存储
- ✅ **CDN 友好**：支持通过 CDN 加速访问

## 🔧 自定义配置

### 修改构建配置

编辑 `vite.demo.config.ts` 文件来自定义构建选项。

### 修改部署脚本

编辑 `scripts/deploy-demo.sh` 文件来自定义部署流程。

## 📝 注意事项

1. **HTTPS 要求**：生产环境建议使用 HTTPS，因为摄像头权限需要安全上下文
2. **CORS 配置**：确保服务器配置了正确的 CORS 头
3. **浏览器兼容性**：支持现代浏览器（Chrome、Firefox、Safari、Edge）
4. **网络要求**：需要稳定的网络连接用于音视频通话

## 🐛 故障排除

### 构建失败

```bash
# 清理缓存
rm -rf node_modules/.vite
npm install
npm run build:demo
```

### 预览服务器无法启动

```bash
# 检查端口占用
lsof -i :4173
# 或使用其他端口
npm run preview:demo -- --port 3000
```

### 页面加载失败

1. 检查文件路径是否正确
2. 确认所有静态资源都已上传
3. 查看浏览器控制台错误信息

## 📞 功能特性

- ✅ 真实通话功能：使用声网 RTC SDK
- ✅ 环信信令：使用环信 IM SDK
- ✅ 一对一通话：支持视频和语音
- ✅ 群组通话：支持多人视频和语音
- ✅ 通话控制：静音、摄像头、扬声器等
- ✅ URL 参数登录：支持通过 URL 参数直接登录
- ✅ 响应式设计：适配不同屏幕尺寸

## 🔗 访问方式

### URL 参数登录

```
https://your-domain.com/real-call-demo.html?userId=your_user_id&password=your_password&appKey=your_app_key
```

### 手动登录

```
https://your-domain.com/real-call-demo.html
```

## 📚 更多信息

详细文档请参考：[README.md](./README.md)
