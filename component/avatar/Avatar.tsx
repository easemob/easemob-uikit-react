import React from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import warning from '../_utils/warning';
import { composeRef } from '../_utils/ref';

import classNames from 'classnames';
import { ConfigContext } from '../config/index';
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
    ...others
  } = props;

  const prefixCls = getPrefixCls('avatar', customizePrefixCls);
  const wrapCls = getPrefixCls('avatar-wrap', customizePrefixCls);
  const presenceCls = getPrefixCls('presence-tag', customizePrefixCls);

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
      [`${prefixCls}-image`]: hasImageElement || (src && isImgExist),
      [`${prefixCls}-icon`]: !!icon,
    },
    className,
  );

  const sizeStyle: React.CSSProperties =
    typeof customSize === 'number'
      ? {
          width: customSize,
          height: customSize,
          lineHeight: `${customSize}px`,
          fontSize: icon ? customSize / 2 : '.8em',
        }
      : {};

  let childrenToRender: React.ReactNode;

  if (typeof src === 'string' && isImgExist) {
    childrenToRender = (
      <img
        src={src}
        draggable={draggable}
        srcSet={srcSet}
        onError={handleImgLoadError}
        alt={alt}
        crossOrigin={crossOrigin}
      />
    );
  } else if (hasImageElement) {
    childrenToRender = src;
  } else if (icon) {
    childrenToRender = icon;
  } else if (typeof children == 'string') {
    childrenToRender = (
      <span className={`${prefixCls}-string`} ref={avatarChildrenRef}>
        {children.slice(0, 2)}
      </span>
    );
  } else {
    childrenToRender = (
      <span className={`${prefixCls}-string`} ref={avatarChildrenRef}>
        {children}
      </span>
    );
  }

  return (
    <div className={wrapCls}>
      <span
        {...others}
        style={{ ...sizeStyle, ...others.style }}
        className={classString}
        ref={avatarNodeMergeRef}
      >
        {childrenToRender}
      </span>
      {isOnline && (
        <div className={`${presenceCls}-wrap`}>
          <div className={presenceCls}></div>
        </div>
      )}
    </div>
  );
};

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(InternalAvatar);

export default Avatar;
