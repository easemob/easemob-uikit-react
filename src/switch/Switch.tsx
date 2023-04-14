import React, { useEffect, useState, ChangeEvent, ReactElement } from 'react';
import { ConfigContext } from '../config/index';
import classNames from 'classnames';
import './style/style.scss';
export interface SwitchProps {
	className?: string;
	checked: boolean;
	disabled?: boolean;
	onChange?(e: ChangeEvent<HTMLInputElement>): void;
}

const Switch = ({
	checked,
	onChange,
	disabled,
	className = '',
}: SwitchProps): ReactElement => {
	const [isChecked, setIsChecked] = useState(checked);
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('switch');

	const wrapClassNames = disabled
		? classNames(prefixCls, className, `${prefixCls}-disabled`)
		: classNames(prefixCls, className);

	useEffect(() => {
		setIsChecked(checked);
	}, [checked]);

	function onInputChange(e: ChangeEvent<HTMLInputElement>) {
		if (disabled) return;
		const value = e.currentTarget.checked;
		setIsChecked(value);
		if (!onChange) {
			return;
		}
		onChange(e);
	}

	return (
		<label className={wrapClassNames}>
			<input
				type="checkbox"
				checked={isChecked}
				onChange={onInputChange}
				className={`${prefixCls}-checkbox`}
			/>
			<div
				className={
					isChecked
						? `${prefixCls}-container ${prefixCls}-container-checked`
						: `${prefixCls}-container`
				}
			></div>
		</label>
	);
};

export { Switch };
