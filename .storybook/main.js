const svgr = require('vite-plugin-svgr');

module.exports = {
	stories: [
		'../src/**/*.stories.mdx',
		'../src/**/*.stories.@(js|jsx|ts|tsx)',
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
		};
	},
};
