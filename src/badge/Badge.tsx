import React, { useMemo, useContext, useRef } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import CSSMotion from 'rc-motion';
import { ConfigContext } from '../config/index';
import { cloneElement } from '../_utils/reactNode';
import ScrollNumber from './ScrollNumber';
export interface BadgeProps {
	/** Number to show in badge */
	count?: React.ReactNode;
	/** Max count to show */
	overflowCount?: number;
	/** Whether to show red dot without number */
	dot?: boolean;
	showZero?: boolean;
	style?: React.CSSProperties;
	className?: string;
	text?: React.ReactNode;
	size?: 'default' | 'small';
	offset?: [number | string, number | string];
	title?: string;
	children?: React.ReactNode;
	scrollNumberPrefixCls?: string;
	prefixCls?: string;
	color?: string;
}

export const Badge = ({
	count,
	overflowCount = 99,
	dot = false,
	showZero = false,
	style,
	className,
	text,
	size = 'default',
	offset,
	title,
	children,
	color,
	scrollNumberPrefixCls: customizeScrollNumberPrefixCls,
	prefixCls: customizePrefixCls,
	...restProps
}: BadgeProps) => {
	const { getPrefixCls } = useContext(ConfigContext);
	const prefixCls = getPrefixCls('badge', customizePrefixCls);

	// >>> control
	const numberedDisplayCount = (
		(count as number) > (overflowCount as number)
			? `${overflowCount}+`
			: count
	) as string | number | null;

	const isZero = numberedDisplayCount === '0' || numberedDisplayCount === 0;
	const ignoreCount = count === null || isZero;
	const showAsDot = dot && !isZero;
	const mergedCount = showAsDot ? '' : numberedDisplayCount;

	const isHidden = useMemo(() => {
		const isEmpty =
			mergedCount === null ||
			mergedCount === undefined ||
			mergedCount === '';
		return (isEmpty || (isZero && !showZero)) && !showAsDot;
	}, [mergedCount, isZero, showZero, showAsDot]);

	// Count should be cache in case hidden change it
	const countRef = useRef(count);
	if (!isHidden) {
		countRef.current = count;
	}
	const livingCount = countRef.current;

	// We need cache count since remove motion should not change count display
	const displayCountRef = useRef(mergedCount);
	if (!isHidden) {
		displayCountRef.current = mergedCount;
	}
	const displayCount = displayCountRef.current;

	// We will cache the dot status to avoid shaking on leaved motion
	const isDotRef = useRef(showAsDot);
	if (!isHidden) {
		isDotRef.current = showAsDot;
	}

	// const hasStatus =
	// 	((status !== null && status !== undefined) ||
	// 		(color !== null && color !== undefined)) &&
	// 	ignoreCount;

	// >>> style
	const mergedStyle = useMemo<React.CSSProperties>(() => {
		if (!offset) {
			return { ...style };
		}
		const offsetStyle: React.CSSProperties = {
			marginTop: offset[1],
			marginLeft: offset[0],
		};
		return {
			...offsetStyle,
			...style,
		};
	}, [offset, style]);

	const badgeClassName = classNames(
		prefixCls,
		{
			[`${prefixCls}-not-a-wrapper`]: !children,
		},
		className
	);

	// >>> Title
	const titleNode =
		title ??
		(typeof livingCount === 'string' || typeof livingCount === 'number'
			? livingCount
			: undefined);

	// >>> Status Text
	const statusTextNode =
		isHidden || !text ? null : (
			<span className={`${prefixCls}-status-text`}>{text}</span>
		);
	// >>> Display Component
	const displayNode =
		!livingCount || typeof livingCount !== 'object'
			? undefined
			: cloneElement(livingCount, (oriProps) => ({
					style: {
						...mergedStyle,
						...oriProps.style,
					},
			  }));

	return (
		<span {...restProps} className={badgeClassName}>
			{children}
			<CSSMotion
				visible={!isHidden}
				motionName={`${prefixCls}-zoom`}
				motionAppear={false}
				motionDeadline={1000}
			>
				{({ className: motionClassName }) => {
					const scrollNumberPrefixCls = getPrefixCls(
						'scroll-number',
						customizeScrollNumberPrefixCls
					);

					const isDot = isDotRef.current;
					const scrollNumberCls = classNames({
						[`${prefixCls}-dot`]: isDot,
						[`${prefixCls}-count`]: !isDot,
						[`${prefixCls}-count-sm`]: size === 'small',
						[`${prefixCls}-multiple-words`]:
							!isDot &&
							displayCount &&
							displayCount.toString().length > 1,
						// [`${prefixCls}-status-${color}`]: isPresetColor(color),
					});
					let scrollNumberStyle: React.CSSProperties = {
						...mergedStyle,
					};
					if (color) {
						scrollNumberStyle = scrollNumberStyle || {};
						scrollNumberStyle.background = color;
					}
					return (
						<ScrollNumber
							prefixCls={scrollNumberPrefixCls}
							show={!isHidden}
							motionClassName={motionClassName}
							className={scrollNumberCls}
							count={displayCount}
							title={titleNode}
							style={scrollNumberStyle}
							key="scrollNumber"
						>
							{displayNode}
						</ScrollNumber>
					);
				}}
			</CSSMotion>
		</span>
	);
};
