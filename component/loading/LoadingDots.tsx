import React from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config';
import './style/index.scss';

export interface LoadingDotsProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'default' | 'large';
  color?: string;
  overlay?: boolean;
  overlayStyle?: React.CSSProperties;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  className,
  style,
  size = 'default',
  color = '#fff',
  overlay = false,
  overlayStyle,
}) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('loading-dots');

  const dotSize = React.useMemo(() => {
    switch (size) {
      case 'small':
        return 6;
      case 'large':
        return 10;
      default:
        return 8;
    }
  }, [size]);

  const dotGap = React.useMemo(() => {
    switch (size) {
      case 'small':
        return 3;
      case 'large':
        return 5;
      default:
        return 4;
    }
  }, [size]);

  const dots = (
    <div
      className={classNames(prefixCls, className)}
      style={{
        display: 'flex',
        gap: `${dotGap}px`,
        alignItems: 'center',
        ...style,
      }}
    >
      {[0, 1, 2].map(index => (
        <div
          key={index}
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'fade 1.4s infinite ease-in-out both',
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`${prefixCls}-overlay`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'inherit',
          ...overlayStyle,
        }}
      >
        {dots}
      </div>
    );
  }

  return dots;
};

export default LoadingDots;
