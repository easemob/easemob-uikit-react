import React, { useRef } from 'react';
import { VariableSizeList as RWList } from 'react-window';
import { types } from 'sass';
// @ts-ignore
import InfiniteLoader from 'react-window-infinite-loader';
const Row = ({
	index,
	style,
	content,
}: {
	index: number;
	style: React.CSSProperties;
	content?: React.ReactNode;
}) => {
	console.log(111, index, style);
	return <div style={style}>{content}</div>;
};

interface ListProps {
	height: number; // List 高度
	itemCount: number; // item 数量
	itemSize: number | ((i: number) => number); // item 高度
	width?: number | string; // List 宽度
	itemData?: any; // list item 数据
	children: ({
		index,
		style,
	}: {
		index: number;
		style: React.CSSProperties;
	}) => JSX.Element;

	onItemRendered: (index: number) => boolean;
	loadMoreItems: (
		startIndex: number,
		stopIndex: number
	) => void | Promise<void>;
}

interface List
	extends React.ForwardRefExoticComponent<
		ListProps & React.RefAttributes<any>
	> {
	Row: ({
		index,
		style,
	}: {
		index: number;
		style: React.CSSProperties;
	}) => JSX.Element;
}

const List = React.forwardRef<any, ListProps>((props, ref) => {
	const {
		height,
		itemCount,
		itemSize,
		width = '100%',
		children,
		loadMoreItems,
		onItemRendered,
		...others
	} = props;
	// console.log('children', children == Row);
	console.log('children', children);

	let myItemSize: any;
	if (typeof itemSize == 'number') {
		myItemSize = () => itemSize;
	} else {
		myItemSize = itemSize;
	}
	return (
		<InfiniteLoader
			isItemLoaded={onItemRendered}
			itemCount={itemCount}
			loadMoreItems={loadMoreItems}
		>
			{({ onItemsRendered }: { onItemsRendered: any }) => (
				<RWList
					onItemsRendered={onItemsRendered}
					ref={ref}
					height={height}
					itemCount={itemCount}
					itemSize={myItemSize}
					width={width}
					{...others}
				>
					{children}
				</RWList>
			)}
		</InfiniteLoader>
	);
}) as List;

List.Row = Row;
export { List };
