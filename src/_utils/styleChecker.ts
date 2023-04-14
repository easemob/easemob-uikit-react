export const canUseDom = () => {
	return !!(
		typeof window !== 'undefined' &&
		window.document &&
		window.document.createElement
	);
};

export const canUseDocElement = () =>
	canUseDom() && window.document.documentElement;
