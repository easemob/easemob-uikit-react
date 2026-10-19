import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

const __dirname = path.resolve();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const restProxyTarget =
    env.EASEMOB_DEMO_REST_PROXY_TARGET ||
    env.VITE_EASEMOB_REST_PROXY_TARGET ||
    'http://127.0.0.1:8082';
  const msyncProxyTarget =
    env.EASEMOB_DEMO_MSYNC_PROXY_TARGET ||
    env.VITE_EASEMOB_MSYNC_PROXY_TARGET ||
    'ws://127.0.0.1:4717';
  const fusionProxyTarget =
    env.EASEMOB_DEMO_FUSION_PROXY_TARGET ||
    env.VITE_EASEMOB_FUSION_PROXY_TARGET ||
    'ws://127.0.0.1:8081';

  return {
    plugins: [
      react(),
      svgr(),
      {
        name: 'dns-proxy',
        configureServer(server) {
          server.middlewares.use('/dns-proxy', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '', 'http://localhost');
              const targetUrl = requestUrl.searchParams.get('url');
              if (!targetUrl) {
                res.statusCode = 400;
                res.end('Missing url parameter');
                return;
              }

              const response = await fetch(targetUrl);
              const body = await response.text();
              res.statusCode = response.status;
              res.setHeader(
                'Content-Type',
                response.headers.get('content-type') || 'application/json',
              );
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(body);
            } catch (error) {
              res.statusCode = 500;
              res.end(error instanceof Error ? error.message : 'DNS proxy failed');
            }
          });
        },
      },
    ],
    envPrefix: ['VITE_', 'EASEMOB_'],
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    // 设置基础路径为空，使用相对路径
    base: '',
    build: {
      target: 'esnext',
      outDir: './dist-demo',
      rollupOptions: {
        input: {
          'call-demo': path.resolve(__dirname, 'demo/callkit/call-demo.html'),
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
      minify: 'esbuild',
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
      proxy: {
        '/rest': {
          target: restProxyTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/rest/, ''),
        },
        '/websocket': {
          target: msyncProxyTarget,
          ws: true,
          changeOrigin: true,
        },
        '/ws': {
          target: fusionProxyTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    // 预览服务器配置
    preview: {
      port: 4173,
      host: true,
    },
  };
});
