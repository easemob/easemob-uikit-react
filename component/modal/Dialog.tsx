import React from 'react';
import { useRef, useEffect } from 'react';
import type { ReactNode, CSSProperties, SyntheticEvent } from 'react';

import classNames from 'classnames';
import { getMotionName } from './util';
import KeyCode from 'rc-util/lib/KeyCode';
import useId from 'rc-util/lib/hooks/useId';
import contains from 'rc-util/lib/Dom/contains';
import pickAttrs from 'rc-util/lib/pickAttrs';
import type { GetContainer } from 'rc-util/lib/PortalWrapper';
import Mask from './Mast';
import Content from './Content';
import type { ContentRef } from './Content';
import './style/style.scss';

export interface DialogPropTypes {
	className?: string;
	keyboard?: boolean;
	style?: CSSProperties;
	mask?: boolean;
	children?: any;
	afterClose?: () => any;
	onClose?: (e: SyntheticEvent) => void;
	closable?: boolean;
	maskClosable?: boolean;
	visible?: boolean;
	destroyOnClose?: boolean;
	mousePosition?: {
		x: number;
		y: number;
	} | null;
	title?: ReactNode;
	footer?: ReactNode;
	transitionName?: string;
	maskTransitionName?: string;
	animation?: any;
	maskAnimation?: any;
	wrapStyle?: Record<string, any>;
	bodyStyle?: Record<string, any>;
	maskStyle?: Record<string, any>;
	prefixCls?: string;
	wrapClassName?: string;
	width?: string | number;
	height?: string | number;
	zIndex?: number;
	bodyProps?: any;
	maskProps?: any;
	rootClassName?: string;
	wrapProps?: any;
	getContainer?: GetContainer | false;
	closeIcon?: ReactNode;
	modalRender?: (node: ReactNode) => ReactNode;
	forceRender: boolean;
	// https://github.com/ant-design/ant-design/issues/19771
	// https://github.com/react-component/dialog/issues/95
	focusTriggerAfterClose?: boolean;
}

export default function Dialog(props: DialogPropTypes) {
	const {
		prefixCls = 'rc-dialog',
		zIndex,
		visible = false,
		keyboard = true,
		focusTriggerAfterClose = true,
		// scrollLocker,

		// Wrapper
		wrapStyle,
		wrapClassName,
		wrapProps,
		onClose,
		afterClose,

		// Dialog
		transitionName,
		animation,
		closable = true,

		// Mask
		mask = true,
		maskTransitionName,
		maskAnimation,
		maskClosable = true,
		maskStyle,
		maskProps,
		rootClassName,
	} = props;

	const lastOutSideActiveElementRef = useRef<HTMLElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement>();
	const contentRef = useRef<ContentRef>(null);

	const [animatedVisible, setAnimatedVisible] = React.useState(visible);

	// ========================== Init ==========================
	const ariaId = useId();

	function saveLastOutSideActiveElementRef() {
		if (!contains(wrapperRef.current, document.activeElement as Node)) {
			lastOutSideActiveElementRef.current =
				document.activeElement as HTMLElement;
		}
	}

	function focusDialogContent() {
		if (!contains(wrapperRef.current, document.activeElement as Node)) {
			contentRef.current?.focus();
		}
	}

	// ========================= Events =========================
	function onDialogVisibleChanged(newVisible: boolean) {
		// Try to focus
		if (newVisible) {
			focusDialogContent();
		} else {
			// Clean up scroll bar & focus back
			setAnimatedVisible(false);

			if (
				mask &&
				lastOutSideActiveElementRef.current &&
				focusTriggerAfterClose
			) {
				try {
					lastOutSideActiveElementRef.current.focus({
						preventScroll: true,
					});
				} catch (e) {
					// Do nothing
				}
				lastOutSideActiveElementRef.current = null;
			}

			// Trigger afterClose only when change visible from true to false
			if (animatedVisible) {
				afterClose?.();
			}
		}
	}

	function onInternalClose(e: React.SyntheticEvent) {
		onClose?.(e);
	}

	// >>> Content
	const contentClickRef = useRef(false);
	const contentTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// We need record content click incase content popup out of dialog
	const onContentMouseDown: React.MouseEventHandler = () => {
		clearTimeout(contentTimeoutRef.current);
		contentClickRef.current = true;
	};

	const onContentMouseUp: React.MouseEventHandler = () => {
		contentTimeoutRef.current = setTimeout(() => {
			contentClickRef.current = false;
		});
	};

	// >>> Wrapper
	// Close only when element not on dialog
	let onWrapperClick: (e: React.SyntheticEvent) => void = () => {};
	if (maskClosable) {
		onWrapperClick = (e) => {
			if (contentClickRef.current) {
				contentClickRef.current = false;
			} else if (wrapperRef.current === e.target) {
				onInternalClose(e);
			}
		};
	}

	function onWrapperKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
		if (keyboard && e.keyCode === KeyCode.ESC) {
			e.stopPropagation();
			onInternalClose(e);
			return;
		}

		// keep focus inside dialog
		if (visible) {
			if (e.keyCode === KeyCode.TAB) {
				contentRef.current?.changeActive(!e.shiftKey);
			}
		}
	}

	// ========================= Effect =========================
	useEffect(() => {
		if (visible) {
			setAnimatedVisible(true);
			saveLastOutSideActiveElementRef();
		}
	}, [visible]);

	// Remove direct should also check the scroll bar update
	useEffect(
		() => () => {
			clearTimeout(contentTimeoutRef.current);
		},
		[]
	);

	return (
		<div
			className={classNames(`${prefixCls}-root`, rootClassName)}
			{...pickAttrs(props, { data: true })}
		>
			<Mask
				prefixCls={prefixCls}
				visible={mask && visible}
				motionName={getMotionName(
					prefixCls,
					maskTransitionName,
					maskAnimation
				)}
				style={{
					zIndex,
					...maskStyle,
				}}
				maskProps={maskProps}
			/>
			<div
				tabIndex={-1}
				onKeyDown={onWrapperKeyDown}
				className={classNames(`${prefixCls}-wrap`, wrapClassName)}
				ref={wrapperRef}
				onClick={onWrapperClick}
				style={{
					zIndex,
					...wrapStyle,
					display: !animatedVisible ? 'none' : null,
				}}
				{...wrapProps}
			>
				<Content
					{...props}
					onMouseDown={onContentMouseDown}
					onMouseUp={onContentMouseUp}
					ref={contentRef}
					closable={closable}
					prefixCls={prefixCls}
					visible={visible && animatedVisible}
					onClose={onInternalClose}
					onVisibleChanged={onDialogVisibleChanged}
					motionName={getMotionName(
						prefixCls,
						transitionName,
						animation
					)}
				/>
			</div>
		</div>
	);
}
