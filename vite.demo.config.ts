import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

const __dirname = path.resolve();

export default defineConfig({
  plugins: [react(), svgr()],
  // 设置基础路径为空，使用相对路径
  base: '',
  build: {
    outDir: './dist-demo',
    rollupOptions: {
      input: {
        'real-call-demo': path.resolve(__dirname, 'demo/callkit/real-call-demo.html'),
      },
      output: {
        // 确保资源文件路径正确，使用相对路径
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return `assets/[name].[ext]`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name].[ext]`;
          }
          return `assets/[name].[ext]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // 确保生成 sourcemap 用于调试
    sourcemap: true,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console 用于调试
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
    },
  },
  // 开发服务器配置
  server: {
    port: 5174,
    host: true,
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },
});
