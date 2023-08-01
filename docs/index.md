# Chat-UI

## 安装依赖使用 pnpm

```bash
pnpm install
```

## 运行

```bash
pnpm run dev
```

在浏览器可以加上路径 /demo/自己的 demo 路径, 如：http://localhost:5173/demo/button/

## 打包

```bash
pnpm run build
```

## 单元测试

使用 vitest https://cn.vitest.dev/guide/

```bash
pnpm run test
```

## 文件命名规范

```
├── src # 组件代码
    └── button # 组件包名
       ├── index.ts # 组件入口
       ├── Button.tsx # 组件代码
       ├── Button.stories.tsx # storybook
       ├── style.scss # 组件样式
       └── **tests** # 测试用例
          └── Button.spec.ts
```

- 包名：小写 + 中划线；
- 统一入口文件： index.ts；
- 组件代码： 大驼峰；
- 测试用例代码 ： 测试对象名+ .spec.ts。

文档在 docs 缺少

TODO:

- notice
- popover

- messageEditor 里需要循环取 style
- build 里没有 types
- 自动删除 theme style scss
- package.json 里如果有依赖会报错

反馈；

1. 拆分 conversation chat provider store 文档（功能介绍，示例代码，自定义示例代码）
2. 增加场景 demo
3. 提供 storybook
4. 增加主题变量，以及注释
5. store 增加方法， ts 类型（ts doc?）
