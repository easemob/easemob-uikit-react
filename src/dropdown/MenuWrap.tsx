import React, {
	ReactElement,
	useRef,
	useEffect,
	useState,
	useCallback,
} from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface MenuWrapProps {
	className?: string;
	children: ReactElement;
	containerRef: React.RefObject<HTMLDivElement>;
	onClose: () => void;
}

interface MenuPosition {
	left: number;
	top: number;
}

interface getPositionProps {
	containerRef: React.RefObject<HTMLDivElement>;
	menuRef: React.RefObject<HTMLUListElement>;
}

const getMenuPosition = ({
	containerRef,
	menuRef,
}: getPositionProps): MenuPosition => {
	const parentRect = containerRef?.current?.getBoundingClientRect?.();
	const x = parentRect?.x || parentRect?.left || 0;
	const y = parentRect?.y || parentRect?.top || 0;
	const menuStyle = {
		top: y,
		left: x,
	};
	if (!menuRef.current) return menuStyle;
	const { innerWidth, innerHeight } = window;
	const rect = menuRef?.current?.getBoundingClientRect();
	if (y + rect.height > innerHeight) {
		menuStyle.top -= rect.height;
	}
	if (x + rect.width > innerWidth) {
		menuStyle.left -= rect.width;
	}
	if (menuStyle.top < 0) {
		menuStyle.top =
			rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
	}
	if (menuStyle.left < 0) {
		menuStyle.left =
			rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
	}
	menuStyle.top += 32;
	return menuStyle;
};

const MenuWrap = ({
	className,
	children,
	containerRef,
	onClose = () => {},
}: MenuWrapProps) => {
	const menuRef: React.RefObject<HTMLUListElement> = useRef(null);
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('menu-wrap');
	const classes = classNames(prefixCls, className);
	const [listPosition, setPosition] = useState({});
	const closeMask = useCallback((event: any) => {
		if (menuRef?.current && !menuRef?.current?.contains?.(event.target)) {
			onClose?.();
		}
	}, []);

	useEffect(() => {
		document.addEventListener('mousedown', closeMask);
		return () => {
			document.removeEventListener('mousedown', closeMask);
		};
	}, []);

	useEffect(() => {
		let position = getMenuPosition({
			containerRef,
			menuRef,
		});
		setPosition(position);
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = 'auto';
		};
	}, []);

	return (
		<>
			<div className={`${prefixCls}-mask`}></div>
			<ul ref={menuRef} className={classes} style={listPosition}>
				{children}
			</ul>
		</>
	);
};
export { MenuWrap };
