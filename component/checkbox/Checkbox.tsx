import React, { ChangeEvent, ReactElement, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface CheckboxProps {
	id?: string;
	className?: string;
	checked?: boolean;
	disabled?: boolean;
	children?: React.ReactNode;
	onChange?(e: ChangeEvent<HTMLInputElement>): void;
}

const Checkbox = ({
	id,
	checked,
	disabled,
	children,
	className,
	onChange,
}: CheckboxProps): ReactElement => {
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('checkbox');
	const classes = classNames(prefixCls, className);
	const [isChecked, setIsCheck] = useState(checked);
	return (
		<label className={`${prefixCls}-wrapper`} htmlFor={id}>
			<span className={classes}>
				<input
					disabled={disabled}
					id={id}
					type="checkbox"
					checked={isChecked}
					onClick={() => {
						if (!disabled) setIsCheck(!isChecked);
					}}
					onChange={onChange}
				/>
				<span
					className={classNames(
						`${prefixCls}--mark`,
						disabled ? 'disabled' : ''
					)}
				/>
			</span>
			{children !== undefined && <span>{children}</span>}
		</label>
	);
};

export { Checkbox };
