export default {
	stories: [
		'../component/**/*.stories.mdx',
		'../component/**/*.stories.@(js|jsx|ts|tsx)',
		'../module/**/*.stories.mdx',
		'../module/**/*.stories.@(js|jsx|ts|tsx)',
	],
	addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
	core: {
		builder: '@storybook/builder-vite', // 👈 The builder enabled here.
	},
	framework: '@storybook/react-vite',
	async viteFinal(config) {
		// Merge custom configuration into the default config
		const { mergeConfig } = await import('vite');

		return mergeConfig(config, {
			// Add dependencies to pre-optimization
			optimizeDeps: {
				include: ['storybook-dark-mode'],
			},
		});
	},
	typescript: {
		check: false, // 禁用 Storybook 的类型检查，使用自己项目的类型检查
		reactDocgen: 'react-docgen-typescript',
	},
};
