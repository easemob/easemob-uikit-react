import React, { useContext } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import warning from '../_utils/warning';
import { composeRef } from '../_utils/ref';

import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { RootContext } from '../../module/store/rootContext';
import { Tooltip } from '../tooltip/Tooltip';
export interface AvatarProps {
  size?: 'large' | 'small' | 'default' | number;
  shape?: 'circle' | 'square';
  src?: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  prefixCls?: string;
  className?: string;
  children?: React.ReactNode;
  alt?: string;
  isOnline?: boolean;
  draggable?: boolean;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  srcSet?: string;
  presence?: {
    visible: boolean;
    text?: string;
    icon?: HTMLImageElement | string;
  };
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  /* callback when img load error */
  /* return false to prevent Avatar show default fallback behavior, then you can do fallback by your self */
  onError?: () => boolean;
}

export const InternalAvatar = (props: any, ref: any) => {
  const [isImgExist, setIsImgExist] = React.useState(true);

  const avatarNodeRef = React.useRef<HTMLSpanElement>(null);
  const avatarChildrenRef = React.useRef<HTMLSpanElement>(null);
  const avatarNodeMergeRef = composeRef<HTMLSpanElement>(ref, avatarNodeRef);

  const { getPrefixCls } = React.useContext(ConfigContext);

  React.useEffect(() => {
    if (props.src !== '') {
      setIsImgExist(true);
    }
  }, [props.src]);

  const handleImgLoadError = () => {
    const { onError } = props;
    const errorFlag = onError ? onError() : undefined;
    if (errorFlag !== false) {
      setIsImgExist(false);
    }
  };

  const {
    prefixCls: customizePrefixCls,
    shape = 'circle',
    size: customSize = 'default',
    src,
    icon,
    className,
    alt,
    children,
    draggable,
    crossOrigin,
    srcSet,
    isOnline,
    presence,
    ...others
  } = props;

  const prefixCls = getPrefixCls('avatar', customizePrefixCls);
  const wrapCls = getPrefixCls('avatar-wrap', customizePrefixCls);
  const presenceCls = getPrefixCls('presence-tag', customizePrefixCls);
  const { theme } = useContext(RootContext);
  const themeMode = theme?.mode;
  const sizeCls = classNames({
    [`${prefixCls}-lg`]: customSize === 'large',
    [`${prefixCls}-sm`]: customSize === 'small',
  });
  const hasImageElement = React.isValidElement(src);

  const classString = classNames(
    prefixCls,
    sizeCls,
    {
      [`${prefixCls}-${shape}`]: !!shape,
      [`${prefixCls}-hasImage`]: typeof src === 'string' && isImgExist && src !== '',
      [`${prefixCls}-icon`]: !!icon,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const sizeStyle: React.CSSProperties =
    typeof customSize === 'number'
      ? {
          width: customSize,
          height: customSize,
          lineHeight: `${customSize}px`,
          fontSize: customSize / 2 - 4,
        }
      : {};

  let childrenToRender: React.ReactNode;

  if (typeof src === 'string' && isImgExist && src !== '') {
    childrenToRender = (
      <div className={`${prefixCls}-image`}>
        <img
          src={src}
          draggable={draggable}
          srcSet={srcSet}
          onError={handleImgLoadError}
          alt={alt}
          crossOrigin={crossOrigin}
        />
      </div>
    );
  } else if (hasImageElement) {
    childrenToRender = src;
  } else if (icon) {
    childrenToRender = icon;
  } else if (typeof children == 'string') {
    childrenToRender = (
      <span className={`${prefixCls}-string`} ref={avatarChildrenRef}>
        {customSize < 20 ? children.slice(0, 1) : children.slice(0, 2)}
      </span>
    );
  } else {
    childrenToRender = (
      <span className={`${prefixCls}-string`} ref={avatarChildrenRef}>
        {children}
      </span>
    );
  }
  // status 定义三种尺寸 large >= 100, 100 > default  > 40, small <= 40, 对应 status 28, 16, 12
  let presenceSize: 'large' | 'default' | 'small' = 'default';
  if (typeof customSize === 'number') {
    if (customSize >= 100) {
      presenceSize = 'large';
    } else if (customSize <= 40) {
      presenceSize = 'small';
    } else {
      presenceSize = 'default';
    }
  } else if (customSize === 'large') {
    presenceSize = 'large';
  } else if (customSize === 'small') {
    presenceSize = 'small';
  }

  const PresenceSize = {
    large: 28,
    default: 16,
    small: 12,
  };

  const presenceStyle: React.CSSProperties =
    shape === 'circle'
      ? {
          width: PresenceSize[presenceSize],
          height: PresenceSize[presenceSize],
          padding: presenceSize === 'large' ? 4 : 2,
          right: `calc(14.65% - ${PresenceSize[presenceSize] / 2}px)`,
          bottom: `calc(14.65% - ${PresenceSize[presenceSize] / 2}px)`,
        }
      : {
          width: PresenceSize[presenceSize],
          height: PresenceSize[presenceSize],
          padding: presenceSize === 'large' ? 4 : 2,
          right: presenceSize === 'large' ? -4 : -2,
          bottom: presenceSize === 'large' ? -4 : -2,
        };
  return (
    <div
      className={classString}
      ref={avatarNodeMergeRef}
      {...others}
      style={{ ...sizeStyle, ...others.style }}
    >
      {childrenToRender}
      {isOnline && (
        <div className={`${presenceCls}-wrap`}>
          <div className={presenceCls}></div>
        </div>
      )}
      {presence?.visible && (
        <Tooltip
          title={
            presence.text ? (
              <div className={`${prefixCls}-presence-text`}>{presence.text}</div>
            ) : null
          }
          placement="bottom"
        >
          <div className={`${prefixCls}-presence-wrap`} style={presenceStyle}>
            {React.isValidElement(presence.icon) ? (
              presence.icon
            ) : (
              <img alt={presence.text} src={presence.icon} />
            )}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(InternalAvatar);

export default Avatar;
