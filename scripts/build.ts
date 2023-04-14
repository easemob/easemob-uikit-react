import config from '../vite.config';
import { build, InlineConfig, defineConfig, UserConfig } from 'vite';
import fs from 'fs-extra';
import path from 'path';
import packageJson from '../package.json';
import typescript from '@rollup/plugin-typescript';
import jsx from 'acorn-jsx';
import { generateDTS } from './type';
// console.log("config", config);
// 全量打包
// build(defineConfig(config as UserConfig) as InlineConfig);

async function buildComponent() {
	console.log(111);
	await build();
	console.log(222);
	// const __dirname = path.resolve();
	// //   console.log("__dirname", __dirname);
	// const srcDir = path.resolve(__dirname, './module/');
	// console.log(333, srcDir);
	// const viteConfig = config as any;
	// const baseOutDir = viteConfig.build.outDir;
	// // 复制 Package.json 文件
	// generateDTS(path.resolve(viteConfig.build.outDir, `ChatUI.esm.js`));
	// // const packageJson = require("../package.json");
	// packageJson.main = 'chat-ui.umd.js';
	// packageJson.module = 'chat-ui.esm.js';
	// packageJson.types = 'chat-ui.d.ts';
	// fs.outputFile(
	// 	path.resolve(baseOutDir, `package.json`),
	// 	JSON.stringify(packageJson, null, 2)
	// );

	// const componentsDir = fs.readdirSync(srcDir).filter((name) => {
	// 	// 只要目录不要文件，且里面包含index.ts
	// 	const componentDir = path.resolve(srcDir, name);
	// 	const isDir = fs.lstatSync(componentDir).isDirectory();
	// 	return isDir && fs.readdirSync(componentDir).includes('index.ts');
	// });
	// for (let name of componentsDir) {
	// 	const outDir = path.resolve(baseOutDir, name);
	// 	const rollupOptions = {
	// 		external: ['rect', 'react-dom'],
	// 		output: {
	// 			globals: {
	// 				react: 'React',
	// 			},
	// 		},
	// 		acornInjectPlugins: [jsx()],
	// 		plugins: [
	// 			typescript({
	// 				compilerOptions: {
	// 					jsx: 'preserve',
	// 					// outDir: "./dist/types",
	// 					declaration: true,
	// 					declarationDir: outDir,
	// 				},
	// 				// target: "es2015", // 这里指定编译到的版本，
	// 				//   include: ["src/*"],
	// 				exclude: ['node_modules', 'dist'],
	// 				//   allowSyntheticDefaultImports: true,
	// 			}),
	// 		],
	// 	};

	// 	const custom = {
	// 		//   rollupOptions,
	// 		lib: {
	// 			entry: path.resolve(srcDir, name),
	// 			name, // 导出模块名
	// 			fileName: `index`,
	// 			formats: [`esm`, `umd`],
	// 		},
	// 		outDir,
	// 	};
	// 	Object.assign(viteConfig.build, custom);
	// 	await build(defineConfig(viteConfig as UserConfig) as InlineConfig);

	// 	fs.outputFile(
	// 		path.resolve(outDir, `package.json`),
	// 		`{
	//       "name": "chat-ui/${name}",
	//       "main": "index.umd.js",
	//       "module": "index.esm.js"
	//     }`,
	// 		`utf-8`
	// 	);
	// }
	``;
}

buildComponent();
