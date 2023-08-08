import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { observer } from 'mobx-react-lite';
import { useDebounceFn } from 'ahooks';
import './style/style.scss';
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
}

let ScrollList = function <T>() {
  return observer(
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

      const classString = classNames(prefixCls, className);
      const containerRef = useRef<HTMLDivElement>(null);
      useImperativeHandle(ref, () => ({
        scrollTo: innerScrollTo,
      }));

      const innerScrollTo = (position: 'top' | 'bottom' | string) => {
        if (!containerRef) {
          return;
        }
        console.log(222, containerRef?.current?.scrollHeight);
        if (position === 'top') {
          (containerRef as React.MutableRefObject<HTMLDivElement>).current.scrollTop = 0;
        } else if (position === 'bottom') {
          (containerRef as React.MutableRefObject<HTMLDivElement>).current.scrollTop =
            containerRef?.current?.scrollHeight || 0;
        } else {
        }
      };

      useEffect(() => {
        const scrollEvent = (event: Event) => {
          if (!hasMore || loading) return;
          //可视区高度
          let scrollHeight = (event.target as HTMLElement)?.scrollHeight;
          //滚动高度
          let scrollTop = (event.target as HTMLElement).scrollTop;
          //列表内容实际高度
          let offsetHeight = (event.target as HTMLElement).offsetHeight;
          // 滚动到顶加载更多
          if (scrollDirection === 'up' && scrollTop < 100) {
            run();
          }
          // scroll to bottom load data
          if (scrollDirection === 'down') {
            let offsetBottom = scrollHeight - (scrollTop + offsetHeight);
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

      return (
        <div className={classString} style={style} ref={containerRef}>
          {data.map((itemData, index) => {
            return renderItem(itemData, index);
          })}
        </div>
      );
    }),
  );
};

export { ScrollList };
