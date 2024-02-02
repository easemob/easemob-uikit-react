import config from '../vite.config';
import { build, InlineConfig, defineConfig, UserConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';
import packageJson from '../package.json';
import typescript from '@rollup/plugin-typescript';
import jsx from 'acorn-jsx';
import { generateDTS } from './type';

const __dirname = path.resolve();
const srcDir = path.resolve(__dirname, './component/');
const moduleDir = path.resolve(__dirname, './module/');
const commonDir = path.resolve(__dirname, './common/');

async function buildComponent() {
  await build();
  // await build(defineConfig(config) as InlineConfig);
  const viteConfig = config as any;
  const baseOutDir = viteConfig.build.outDir;

  // 复制 Package.json 文件
  //   generateDTS(path.resolve(viteConfig.build.outDir, `ChatUI.esm.js`));
  //   const packageJson = require('../package.json');
  packageJson.main = 'chat-ui.umd.js';
  packageJson.module = 'chat-ui.esm.js';
  packageJson.types = 'chat-ui.d.ts';
  fs.outputFile(path.resolve(baseOutDir, `package.json`), JSON.stringify(packageJson, null, 2));

  const baseComponentsDir = fs.readdirSync(srcDir).filter(name => {
    // 只要目录不要文件，且里面包含index.ts
    const componentDir = path.resolve(srcDir, name);
    const isDir = fs.lstatSync(componentDir).isDirectory();
    return isDir && fs.readdirSync(componentDir).includes('index.ts') && name != 'config';
  });
  console.log('pure components', baseComponentsDir);
  const moduleComponentsDir = fs.readdirSync(moduleDir).filter(name => {
    const componentDir = path.resolve(moduleDir, name);
    const isDir = fs.lstatSync(componentDir).isDirectory();
    return isDir && fs.readdirSync(componentDir).includes('style');
  });
  console.log('module components', moduleComponentsDir);
  const componentsDir = [...baseComponentsDir, ...moduleComponentsDir];

  await copyScss(baseComponentsDir, srcDir, baseOutDir);
  await copyScss(moduleComponentsDir, moduleDir, baseOutDir);
  return;
  for (let name of componentsDir) {
    const outDir = path.resolve(baseOutDir, name);
    console.log(111, path.resolve(srcDir, name));

    let newFilePath = path.resolve(srcDir, name, 'style');
    let oldFilePath = path.resolve(outDir, 'style');

    const rollupOptions = {
      external: ['rect', 'react-dom'],
      output: {
        globals: {
          react: 'React',
        },
      },
      acornInjectPlugins: [jsx()],
      plugins: [
        typescript({
          // compilerOptions: {
          //   jsx: 'preserve',
          //   // outDir: "./dist/types",
          //   declaration: true,
          //   declarationDir: outDir,
          // },
          target: 'es2015', // 这里指定编译到的版本，
          include: ['src/*'],
          exclude: ['node_modules', 'dist'],
          allowSyntheticDefaultImports: true,
        }),
      ],
    };

    const custom = {
      // rollupOptions,
      lib: {
        entry: path.resolve(srcDir, name),
        name, // 导出模块名
        fileName: `index`,
        formats: [`esm`],
      },
      outDir,
    };
    Object.assign(viteConfig.build, custom);
    await build(defineConfig(viteConfig as UserConfig) as InlineConfig);

    fs.outputFile(
      path.resolve(outDir, `package.json`),
      `{
        "name": "chat-ui/${name}",
        "main": "index.umd.js",
        "module": "index.esm.js"
      }`,
      `utf-8`,
    );
    if (!fs.existsSync(oldFilePath)) {
      fs.mkdir(oldFilePath, err => {
        // console.log(err)
      });
    }
    getFiles(newFilePath, oldFilePath);
  }
}

buildComponent();

function getFiles(OriginFilePath, CopyFilePath) {
  //读取newFile文件夹下的文件
  fs.readdir(OriginFilePath, { withFileTypes: true }, (err, files) => {
    console.log('files', files, OriginFilePath);
    for (let file of files) {
      //判断是否是文件夹，不是则直接复制文件到newFile中
      if (!file.isDirectory()) {
        //获取旧文件夹中要复制的文件
        const OriginFile = path.resolve(OriginFilePath, file.name);
        //获取新文件夹中复制的地方
        const CopyFile = path.resolve(CopyFilePath, file.name);
        //将文件从旧文件夹复制到新文件夹中
        fs.copyFileSync(OriginFile, CopyFile);

        // 读取文件内容
        const fileData = fs.readFileSync(OriginFile, 'utf-8');
        const dataArray = fileData.split('\n');
        // console.log('dataArray', dataArray);
        const index = dataArray.indexOf("@import '~/common/style/index.scss';");
        console.log('index', index);
        if (index >= 0) {
          dataArray.splice(index, 1);
        }
        const newFileData = dataArray.join('\n');
        fs.writeFileSync(CopyFile, newFileData);
      } else {
        //如果是文件夹就递归变量把最新的文件夹路径传过去
        const CopyDirPath = path.resolve(CopyFilePath, file.name);
        const OriginDirPath = path.resolve(OriginFilePath, file.name);
        fs.mkdir(CopyDirPath, err => {});
        // OriginFilePath = OriginPath
        // CopyFilePath = DirPath
        getFiles(OriginDirPath, CopyDirPath);
      }
    }
  });
}

async function copyScss(componentsDir, srcDir, outDir) {
  if (!fs.existsSync(path.resolve(outDir, 'style'))) {
    await fs.mkdir(path.resolve(outDir, 'style'));
  }
  for (let name of componentsDir) {
    let orgFilePath = path.resolve(srcDir, name, 'style');
    let copyFilePath = path.resolve(outDir, 'style', name, 'style');

    await fs.mkdir(path.resolve(outDir, 'style', name));
    await fs.mkdir(path.resolve(outDir, 'style', name, 'style'));
    getFiles(orgFilePath, copyFilePath);
  }
  if (!fs.existsSync(path.resolve(outDir, 'style', 'style'))) {
    await fs.mkdir(path.resolve(outDir, 'style', 'style'));
    getFiles(path.resolve(commonDir, 'style'), path.resolve(outDir, 'style', 'style'));
  }
}
