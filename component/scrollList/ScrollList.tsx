import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect, memo } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { observer } from 'mobx-react-lite';
import { useDebounceFn } from 'ahooks';
import './style/style.scss';
import { RootContext } from '../../module/store/rootContext';
export interface ScrollListProps<T> {
  className?: string;
  style?: React.CSSProperties;
  renderItem: (item: T, index: number) => React.ReactNode;
  paddingHeight?: number; // 距离顶部多高开始触发加载
  loadMoreItems?: () => void | Promise<void>; // 触发加载更多的函数
  scrollTo?: () => 'top' | 'bottom' | string; // 滚动到指定位置
  hasMore?: boolean; // 是否还有更多
  scrollDirection?: 'up' | 'down';
  prefix?: string;
  data: Array<T>;
  loading: boolean;
  onScroll?: (e: Event) => void;
}

let ScrollList = function ScrollListInner<T>() {
  return memo(
    observer(
      forwardRef<any, ScrollListProps<T>>(function InternalScrollList(props, ref) {
        const {
          className,
          style,
          renderItem,
          paddingHeight,
          loadMoreItems,
          scrollTo,
          hasMore = true,
          prefix,
          loading = false,
          scrollDirection = 'up',
          data,
          onScroll,
        } = props;
        const { run } = useDebounceFn(
          () => {
            loadMoreItems?.();
          },
          {
            wait: 100,
          },
        );
        const { getPrefixCls } = React.useContext(ConfigContext);
        const prefixCls = getPrefixCls('scrollList', prefix);
        const { theme } = React.useContext(RootContext);
        const themeMode = theme?.mode;
        const classString = classNames(
          prefixCls,
          {
            [`${prefixCls}-${themeMode}`]: !!themeMode,
          },
          className,
        );
        const containerRef = useRef<HTMLDivElement>(null);
        useImperativeHandle(ref, () => ({
          scrollTo: innerScrollTo,
          scrollHeight: containerRef?.current?.scrollHeight || 0,
          scrollTop: scrollTop,
        }));

        const innerScrollTo = (position: 'top' | 'bottom' | number) => {
          if (!containerRef) {
            return;
          }
          if (position === 'top') {
            (containerRef as React.MutableRefObject<HTMLDivElement>).current.scrollTop = 0;
          } else if (position === 'bottom') {
            (containerRef as React.MutableRefObject<HTMLDivElement>).current.scrollTop =
              containerRef?.current?.scrollHeight || 0;
          } else {
            (containerRef as React.MutableRefObject<HTMLDivElement>).current.scrollTop =
              position || 0;
          }
        };
        const [scrollTop, setScrollTop] = useState(0);
        const [scrollBottom, setScrollBottom] = useState(0);
        useEffect(() => {
          const scrollEvent = (event: Event) => {
            onScroll?.(event);
            if (!hasMore || loading) return;
            //可视区高度
            let scrollHeight = (event.target as HTMLElement)?.scrollHeight;
            //滚动高度
            let scrollTop = (event.target as HTMLElement).scrollTop;
            //列表内容实际高度
            let offsetHeight = (event.target as HTMLElement).offsetHeight;
            setScrollTop(scrollTop);
            // 滚动到顶加载更多
            if (scrollDirection === 'up' && scrollTop < 100) {
              let offsetBottom = scrollHeight - (scrollTop + offsetHeight);
              setScrollBottom(offsetBottom);
              run();
            }
            // scroll to bottom load data
            if (scrollDirection === 'down') {
              let offsetBottom = scrollHeight - (scrollTop + offsetHeight);
              setScrollBottom(offsetBottom);
              if (offsetBottom < 50) {
                run();
              }
            }
          };

          containerRef.current?.addEventListener('scroll', scrollEvent);

          return () => {
            containerRef.current?.removeEventListener('scroll', scrollEvent);
          };
        }, [hasMore, loading]);

        // 监听当前滚动位置， 记录滚动位置， 当data数据变多时，设置滚动条位置为原来的位置
        useEffect(() => {
          if (containerRef.current && scrollDirection == 'up' && scrollTop < 100) {
            let scrollHeight = containerRef.current.scrollHeight;
            //列表内容实际高度
            let offsetHeight = containerRef.current.offsetHeight;
            containerRef.current.scrollTop = scrollHeight - scrollBottom - offsetHeight;
          }
        }, [data.length]);
        return (
          <div className={classString} style={style} ref={containerRef}>
            <RenderItem data={data} renderItem={renderItem}></RenderItem>
          </div>
        );
      }),
    ),
  );
};

const RenderItem = memo(
  (props: { data: any[]; renderItem: (item: any, index: number) => React.ReactNode }) => {
    const { data, renderItem } = props;
    return (
      <>
        {data.map((itemData, index) => {
          return renderItem(itemData, index);
        })}
      </>
    );
  },
);

export { ScrollList };
