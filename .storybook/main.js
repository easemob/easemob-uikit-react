const svgr = require('vite-plugin-svgr');
const path = require('path');
// const __dirname = path.resolve();

module.exports = {
	stories: [
		'../component/**/*.stories.mdx',
		'../component/**/*.stories.@(js|jsx|ts|tsx)',
		'../module/**/*.stories.mdx',
		'../module/**/*.stories.@(js|jsx|ts|tsx)',
	],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
	],
	framework: '@storybook/react',
	core: {
		builder: '@storybook/builder-vite',
	},
	async viteFinal(config) {
		config.plugins = [
			...config.plugins,
			svgr({
				svgrOptions: {
					icon: true,
				},
			}),
		];

		return {
			...config,
			define: {
				...config.define,
			},
			resolve: {
				// 配置路径别名
				alias: {
					'~': path.resolve(__dirname, '../'),
				},
			},
		};
	},
};
