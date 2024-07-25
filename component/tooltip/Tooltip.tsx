import classNames from 'classnames';
import RcTooltip from 'rc-tooltip';
import type { placements as Placements } from 'rc-tooltip/lib/placements';
import type { TooltipProps as RcTooltipProps } from 'rc-tooltip/lib/Tooltip';
import type { AlignType } from 'rc-trigger/lib/interface';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import * as React from 'react';
import { ConfigContext } from '../config/index';
import { getTransitionName } from '../_utils/motion';
import getPlacements, { AdjustOverflow, PlacementsConfig } from '../_utils/placements';
import { cloneElement, isValidElement, isFragment } from '../_utils/reactNode';
import './style/style.scss';
import { RootContext } from '../../module/store/rootContext';
export type { AdjustOverflow, PlacementsConfig };
export type TooltipPlacement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';

export interface TooltipAlignConfig {
  points?: [string, string];
  offset?: [number | string, number | string];
  targetOffset?: [number | string, number | string];
  overflow?: { adjustX: boolean; adjustY: boolean };
  useCssRight?: boolean;
  useCssBottom?: boolean;
  useCssTransform?: boolean;
}

// remove this after RcTooltip switch visible to open.
interface LegacyTooltipProps
  extends Partial<
    Omit<
      RcTooltipProps,
      'children' | 'visible' | 'defaultVisible' | 'onVisibleChange' | 'afterVisibleChange'
    >
  > {
  open?: RcTooltipProps['visible'];
  defaultOpen?: RcTooltipProps['defaultVisible'];
  onOpenChange?: RcTooltipProps['onVisibleChange'];
  afterOpenChange?: RcTooltipProps['afterVisibleChange'];
}

export interface AbstractTooltipProps extends LegacyTooltipProps {
  style?: React.CSSProperties;
  className?: string;
  color?: string;
  placement?: TooltipPlacement;
  builtinPlacements?: typeof Placements;
  openClassName?: string;
  arrowPointAtCenter?: boolean;
  autoAdjustOverflow?: boolean | AdjustOverflow;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  children?: React.ReactNode;
  arrow?: boolean;
}
export type RenderFunction = () => React.ReactNode;

export interface TooltipPropsWithOverlay extends AbstractTooltipProps {
  title?: React.ReactNode | RenderFunction;
  overlay?: React.ReactNode | RenderFunction;
}
export interface TooltipPropsWithTitle extends AbstractTooltipProps {
  title: React.ReactNode | RenderFunction;
  overlay?: React.ReactNode | RenderFunction;
}

export declare type TooltipProps = TooltipPropsWithTitle | TooltipPropsWithOverlay;

const splitObject = <T extends React.CSSProperties>(
  obj: T,
  keys: (keyof T)[],
): Record<'picked' | 'omitted', T> => {
  const picked: T = {} as T;
  const omitted: T = { ...obj };
  keys.forEach(key => {
    if (obj && key in obj) {
      picked[key] = obj[key];
      delete omitted[key];
    }
  });
  return { picked, omitted };
};

// Fix Tooltip won't hide at disabled button
// mouse events don't trigger at disabled button in Chrome
// https://github.com/react-component/tooltip/issues/18
function getDisabledCompatibleChildren(element: React.ReactElement<any>, prefixCls: string) {
  const elementType = element.type as any;
  if (
    ((elementType.__ANT_BUTTON === true || element.type === 'button') && element.props.disabled) ||
    (elementType.__ANT_SWITCH === true && (element.props.disabled || element.props.loading)) ||
    (elementType.__ANT_RADIO === true && element.props.disabled)
  ) {
    // Pick some layout related style properties up to span
    // Prevent layout bugs like https://github.com/ant-design/ant-design/issues/5254
    const { picked, omitted } = splitObject(element.props.style, [
      'position',
      'left',
      'right',
      'top',
      'bottom',
      'float',
      'display',
      'zIndex',
    ]);
    const spanStyle: React.CSSProperties = {
      display: 'inline-block', // default inline-block is important
      ...picked,
      cursor: 'not-allowed',
      width: element.props.block ? '100%' : undefined,
    };
    const buttonStyle: React.CSSProperties = {
      ...omitted,
      pointerEvents: 'none',
    };
    const child = cloneElement(element, {
      style: buttonStyle,
      className: null,
    });
    return (
      <span
        style={spanStyle}
        className={classNames(element.props.className, `${prefixCls}-disabled-compatible-wrapper`)}
      >
        {child}
      </span>
    );
  }
  return element;
}

const Tooltip = React.forwardRef<unknown, TooltipProps>((props, ref) => {
  const {
    getPopupContainer: getContextPopupContainer,
    getPrefixCls,
    // direction,
  } = React.useContext(ConfigContext);
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  const [open, setOpen] = useMergedState(false, {
    value: props.open,
    defaultValue: props.defaultOpen,
  });

  const isNoTitle = () => {
    const { title, overlay } = props;
    return !title && !overlay && title !== 0; // overlay for old version compatibility
  };

  const onOpenChange = (vis: boolean) => {
    setOpen(isNoTitle() ? false : vis);

    if (!isNoTitle()) {
      props.onOpenChange?.(vis);
    }
  };

  const getTooltipPlacements = () => {
    const {
      builtinPlacements,
      arrowPointAtCenter = false,
      autoAdjustOverflow = true,
      arrow = true,
    } = props;

    // const mergedArrowPointAtCenter =
    // 	(typeof arrow !== 'boolean' && arrow?.arrowPointAtCenter) ??
    // 	arrowPointAtCenter;

    return (
      builtinPlacements ||
      getPlacements({
        arrowPointAtCenter: false,
        autoAdjustOverflow,
        arrowWidth: 20,
      })
    );
  };

  const onPopupAlign = (domNode: HTMLElement, align: AlignType) => {
    const placements = getTooltipPlacements();
    // 当前返回的位置
    const placement = Object.keys(placements).find(
      key =>
        placements[key].points![0] === align.points?.[0] &&
        placements[key].points![1] === align.points?.[1],
    );

    if (placement) {
      // 根据当前坐标设置动画点
      const rect = domNode.getBoundingClientRect();

      const transformOrigin: React.CSSProperties = {
        top: '50%',
        left: '50%',
      };

      if (/top|Bottom/.test(placement)) {
        transformOrigin.top = `${rect.height - align.offset![1]}px`;
      } else if (/Top|bottom/.test(placement)) {
        transformOrigin.top = `${-align.offset![1]}px`;
      }
      if (/left|Right/.test(placement)) {
        transformOrigin.left = `${Math.floor(rect.width - align.offset![0])}px`;
      } else if (/right|Left/.test(placement)) {
        transformOrigin.left = `${Math.floor(-align.offset![0])}px`;
      }
      domNode.style.transformOrigin = `${transformOrigin.left} ${transformOrigin.top}`;
    }
  };

  const getOverlay = () => {
    const { title, overlay } = props;
    if (title === 0) {
      return title;
    }
    return overlay || title || '';
  };

  const {
    getPopupContainer,
    placement = 'top',
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0.1,
    ...otherProps
  } = props;

  const {
    prefixCls: customizePrefixCls,
    openClassName,
    getTooltipContainer,
    overlayClassName,
    overlayInnerStyle,
    children,
  } = props;
  let { color } = props;
  if (themeMode == 'dark') {
    color = 'dark';
  }
  const prefixCls = getPrefixCls('tooltip', customizePrefixCls);
  const rootPrefixCls = getPrefixCls();

  let tempOpen = open;

  if (!('open' in props) && isNoTitle()) {
    tempOpen = false;
  }

  const child = getDisabledCompatibleChildren(
    isValidElement(children) && !isFragment(children) ? children : <span>{children}</span>,
    prefixCls,
  );
  const childProps = child.props;
  const childCls =
    !childProps.className || typeof childProps.className === 'string'
      ? classNames(childProps.className, {
          [openClassName || `${prefixCls}-open`]: true,
        })
      : childProps.className;

  const customOverlayClassName = classNames(overlayClassName, {
    [`${prefixCls}-${color}`]: color,
  });

  const formattedOverlayInnerStyle = overlayInnerStyle;
  const arrowContentStyle: React.CSSProperties = {};

  return (
    <RcTooltip
      {...otherProps}
      placement={placement}
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={mouseLeaveDelay}
      prefixCls={prefixCls}
      overlayClassName={customOverlayClassName}
      getTooltipContainer={getPopupContainer || getTooltipContainer || getContextPopupContainer}
      ref={ref}
      builtinPlacements={getTooltipPlacements()}
      overlay={getOverlay()}
      visible={tempOpen}
      onVisibleChange={onOpenChange}
      onPopupAlign={onPopupAlign}
      // trigger={['contextMenu']}
      overlayInnerStyle={formattedOverlayInnerStyle}
      // showArrow={false}
      // arrowContent={<span className={`${prefixCls}-arrow-content`} />}
      arrowContent={
        props.arrow ? (
          <span className={`${prefixCls}-arrow-content`} style={arrowContentStyle}></span>
        ) : null
      }
      motion={{
        motionName: getTransitionName(rootPrefixCls, 'zoom-big-fast', props.transitionName),
        motionDeadline: 1000,
      }}
    >
      {tempOpen ? cloneElement(child, { className: childCls }) : child}
    </RcTooltip>
  );
});
Tooltip.displayName = 'Tooltip';
export { Tooltip };
