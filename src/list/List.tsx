import React, { useEffect, useRef, useState } from 'react';
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
  return <div style={style}>{content}</div>;
};

interface ListProps {
  height: number; // List 高度
  itemCount: number; // item 数量
  itemSize: number | ((i: number) => number); // item 高度
  width?: number | string; // List 宽度
  itemData?: any; // list item 数据
  children: ({ index, style }: { index: number; style: React.CSSProperties }) => JSX.Element;
  isItemLoaded: (index: number) => boolean;
  onItemRendered?: (index: number) => boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => void | Promise<void>;
}

interface List extends React.ForwardRefExoticComponent<ListProps & React.RefAttributes<any>> {
  Row: ({ index, style }: { index: number; style: React.CSSProperties }) => JSX.Element;
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
    isItemLoaded,
    itemData,
    ...others
  } = props;

  let myItemSize: any;
  if (typeof itemSize == 'number') {
    myItemSize = () => itemSize;
  } else {
    myItemSize = itemSize;
  }
  const infiniteLoaderRef = useRef(null);

  //   useEffect(() => {
  //     //@ts-ignore
  //     infiniteLoaderRef.current?.resetloadMoreItemsCache();
  //     console.log('刷新了');
  //   }, [itemData]);
  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
      ref={infiniteLoaderRef}
      threshold={5}
    >
      {({ onItemsRendered }: { onItemsRendered: any }) => (
        <RWList
          onItemsRendered={onItemsRendered}
          ref={ref}
          height={height}
          itemCount={itemCount}
          itemSize={myItemSize}
          width={width}
          itemData={itemData}
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
