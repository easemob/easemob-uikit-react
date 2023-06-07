import React, { ReactElement } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface PopoverProps {
	children?: string;
	className?: string;
}
const Popover = ({
	className = '',
	children = '',
}: PopoverProps): ReactElement => {
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('popover');
	const classes = classNames(prefixCls, className);
	return (
		<div className={classes}>
			<span>{children}</span>
		</div>
	);
};

export { Popover };
