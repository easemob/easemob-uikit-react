import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import react from '@vitejs/plugin-react';
// const path = require("path");
// const jsx = require("acorn-jsx");
import jsx from 'acorn-jsx';
const __dirname = path.resolve();
const resolvePath = (str: string) => path.resolve(__dirname, str);
// import { UserConfig } from "vitest";

// const rollupOptions = {
//   external: ['rect', 'react-dom'],
//   output: {
//     globals: {
//       react: 'React',
//       'react-dom': 'react-dom',
//     },
//   },
//   acornInjectPlugins: [jsx()],
//   plugins: [
//     typescript({
//       compilerOptions: {
//         jsx: 'preserve',
//         outDir: './build/types',
//         declaration: true,
//         declarationDir: './build',
//       },
//       target: 'es2015', // 这里指定编译到的版本，
//       include: ['component/', 'module/'],
//       // exclude: ['node_modules', 'dist'],
//       // allowSyntheticDefaultImports: true,
//     }),
//   ],
// };
export default defineConfig({
  plugins: [
    dts({
      outputDir: './build/types',
      insertTypesEntry: true, // 插入TS 入口
      copyDtsFiles: true, // 是否将源码里的 .d.ts 文件复制到 outputDir
    }),
    svgr(),
  ],
  build: {
    // rollupOptions,
    minify: true,
    lib: {
      entry: './index.ts',
      name: 'ChatUI',
      fileName: 'ChatUI',
      // 导出模块格式
      formats: ['esm', 'umd', 'cjs'],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['react', 'react-dom'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          react: 'react',
          'react-dom': 'react-dom',
        },
      },
    },
    outDir: './build',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  resolve: {
    // 配置路径别名
    alias: {
      '~': path.resolve(__dirname),
    },
  },
} as any);
