export function noop() {}

export function rcWarning(valid: boolean, message: string) {
	// Support uglify
	if (
		process.env.NODE_ENV !== 'production' &&
		!valid &&
		console !== undefined
	) {
		console.error(`Warning: ${message}`);
	}
}

type Warning = (valid: boolean, component: string, message?: string) => void;

// eslint-disable-next-line import/no-mutable-exports
let warning: Warning = noop;
if (process.env.NODE_ENV !== 'production') {
	warning = (valid, component, message) => {
		rcWarning(valid, `[ChatUI: ${component}] ${message}`);
	};
}

export default warning;
