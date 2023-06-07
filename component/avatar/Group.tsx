import React from 'react';
import Avatar from './Avatar';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { cloneElement } from '../_utils/reactNode';
import './style/group.scss';
export interface GroupProps {
	className?: string;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	prefixCls?: string;
	size: 'large' | 'small' | 'default' | number;
	shape: 'circle' | 'square';
}

const Group: React.FC<GroupProps> = (props) => {
	const { getPrefixCls } = React.useContext(ConfigContext);
	const {
		children,
		className,
		prefixCls: customizePrefixCls,
		shape = 'circle',
		size: customSize = 'default',
	} = props;
	const prefixCls = getPrefixCls('avatar-group', customizePrefixCls);
	const sizeCls = classNames({
		[`${prefixCls}-lg`]: customSize === 'large',
		[`${prefixCls}-sm`]: customSize === 'small',
	});
	const sizeStyle: React.CSSProperties =
		typeof customSize === 'number'
			? {
					width: customSize,
					height: customSize,
					lineHeight: `${customSize}px`,
			  }
			: {};

	let childrenWithProps = React.Children.map(children, (child, index) =>
		cloneElement(child, {
			key: `avatar-key-${index}`,
			size: customSize,
			shape: shape,
		})
	);
	if (childrenWithProps == null || typeof childrenWithProps == 'undefined') {
		childrenWithProps = [];
	}
	const numOfChildren = childrenWithProps.length;
	const maxCount = 2;
	const childrenShow = childrenWithProps.slice(0, maxCount);

	const cls = classNames(
		prefixCls,
		sizeCls,
		{ [`${prefixCls}-${shape}`]: !!shape },
		className
	);
	return (
		<div className={cls} style={{ ...sizeStyle, ...props.style }}>
			{childrenShow}
		</div>
	);
};

export default Group;
