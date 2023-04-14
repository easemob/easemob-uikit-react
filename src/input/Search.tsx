import React, { ReactNode, ChangeEventHandler, ChangeEvent } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import Icon from '../icon';

import './style/style.scss';

export interface SearchProps {
	className?: string;
	prefix?: string;
	icon?: ReactNode;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	style?: React.CSSProperties;
	shape?: 'ground' | 'square';
}
export default function Search(props: SearchProps) {
	const {
		onChange,
		prefix: customizePrefixCls,
		className,
		shape = 'ground',
		...others
	} = props;
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('search', customizePrefixCls);
	const classString = classNames(
		prefixCls,
		{
			[`${prefixCls}-${shape}`]: shape,
		},
		className
	);

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange && onChange(e);
	};
	return (
		<div className={classString}>
			<Icon type="SEARCH" className={`${prefixCls}-icon`}></Icon>
			<input
				type="text"
				placeholder="Search"
				onChange={handleChange}
				className={`${prefixCls}-input`}
				{...others}
			/>
		</div>
	);
}

export { Search };
