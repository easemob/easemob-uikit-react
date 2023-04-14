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

文档在 docs
