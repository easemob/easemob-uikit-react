import React, { ReactElement, MouseEvent } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface MenuItemProps {
	className?: string;
	disabled?: boolean;
	children?: ReactElement;
	onClick: (e: MouseEvent) => void;
}

const MenuItem = ({
	className,
	disabled,
	children = <></>,
	onClick,
}: MenuItemProps) => {
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('menu-item');
	const classes = classNames(prefixCls, className);
	const isDisabled = !!disabled;

	const handleClick = (e: MouseEvent) => {
		if (isDisabled) {
			e.stopPropagation();
			e.preventDefault();
			return;
		}
		onClick(e);
	};

	return (
		<li className={classes}>
			{React.cloneElement(children, {
				onClick: (e: MouseEvent) => {
					handleClick(e);
				},
			})}
		</li>
	);
};

export { MenuItem };
