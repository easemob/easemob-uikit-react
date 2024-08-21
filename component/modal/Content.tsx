import React, { useRef } from 'react';
import classNames from 'classnames';
import MemoChildren from './MemoChildren';
import CSSMotion from 'rc-motion';
import { offset } from './util';
import { RootContext } from '../../module/store/rootContext';
export interface ContentProps {
  title?: React.ReactNode;
  holderRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  prefixCls: string;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  sentinelStyle?: React.CSSProperties;
  visible: boolean;
  forceRender: boolean;
  closable?: boolean;
  onClose?: (e: React.SyntheticEvent) => void;
  closeIcon?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  bodyProps?: any;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  modalRender?: (node: React.ReactNode) => React.ReactNode;
  onVisibleChanged: (visible: boolean) => void;
  motionName?: string;
  mousePosition?: {
    x: number;
    y: number;
  } | null;
  destroyOnClose?: boolean;
}

export type ContentRef = {
  focus: () => void;
  changeActive: (next: boolean) => void;
};

const Content = React.forwardRef<ContentRef, ContentProps>((props, ref) => {
  const {
    title,
    holderRef,
    style,
    prefixCls,
    className,
    onMouseDown,
    onMouseUp,
    sentinelStyle,
    visible,
    forceRender,
    closable,
    onClose,
    closeIcon,
    bodyStyle,
    bodyProps,
    children,
    footer,
    width,
    height,
    modalRender,
    onVisibleChanged,
    mousePosition,
    motionName,
    destroyOnClose,
  } = props;
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  const componentsShape = theme?.componentsShape;
  let closer: React.ReactNode;
  if (closable) {
    closer = (
      <button type="button" onClick={onClose} className={`${prefixCls}-close`}>
        {closeIcon || <span className={`${prefixCls}-close-x`} />}
      </button>
    );
  }

  let headerNode: React.ReactNode;
  if (title) {
    headerNode = (
      <div className={`${prefixCls}-header`}>
        <div className={`${prefixCls}-title`}>{title}</div>
      </div>
    );
  }

  let footerNode: React.ReactNode;
  if (footer) {
    footerNode = <div className={`${prefixCls}-footer`}>{footer}</div>;
  }

  const contentClassName = classNames(`${prefixCls}-content`, {
    [`${prefixCls}-content-${themeMode}`]: !!themeMode,
    // 大圆角小圆角
    [`${prefixCls}-content-${componentsShape}`]: !!componentsShape,
  });
  const content = (
    <div className={contentClassName}>
      {closer}
      {headerNode}
      <div className={`${prefixCls}-body`} style={bodyStyle} {...bodyProps}>
        {children}
      </div>
      {footerNode}
    </div>
  );

  // ================================= Refs =================================
  const sentinelStartRef = useRef<HTMLDivElement>(null);
  const sentinelEndRef = useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      sentinelStartRef.current?.focus();
    },
    changeActive: next => {
      const { activeElement } = document;
      if (next && activeElement === sentinelEndRef.current) {
        sentinelStartRef.current?.focus();
      } else if (!next && activeElement === sentinelStartRef.current) {
        sentinelEndRef.current?.focus();
      }
    },
  }));

  // ================================ Style =================================
  const contentStyle: React.CSSProperties = {};

  if (width !== undefined) {
    contentStyle.width = width;
  }
  if (height !== undefined) {
    contentStyle.height = height;
  }

  const dialogRef = useRef<HTMLDivElement>();
  const [transformOrigin, setTransformOrigin] = React.useState<string>();

  if (transformOrigin) {
    contentStyle.transformOrigin = transformOrigin;
  }

  function onPrepare() {
    const elementOffset = offset(dialogRef.current as Element);

    setTransformOrigin(
      mousePosition
        ? `${mousePosition.x - elementOffset.left}px ${mousePosition.y - elementOffset.top}px`
        : '',
    );
  }

  return (
    <CSSMotion
      visible={visible}
      onVisibleChanged={onVisibleChanged}
      onAppearPrepare={onPrepare}
      onEnterPrepare={onPrepare}
      forceRender={forceRender}
      motionName={motionName}
      removeOnLeave={destroyOnClose}
      ref={dialogRef}
    >
      {({ className: motionClassName, style: motionStyle }, motionRef) => (
        <div
          key="dialog-element"
          role="dialog"
          ref={motionRef}
          style={{
            ...style,
            ...contentStyle,
            ...motionStyle,
          }}
          className={classNames(prefixCls, className, motionClassName)}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <div tabIndex={0} ref={sentinelStartRef} style={sentinelStyle} aria-hidden="true" />
          <MemoChildren shouldUpdate={visible || forceRender}>
            {modalRender ? modalRender(content) : content}
          </MemoChildren>
          <div tabIndex={0} ref={sentinelEndRef} style={sentinelStyle} />
        </div>
      )}
    </CSSMotion>
  );
});
Content.displayName = 'Content';
export default Content;
