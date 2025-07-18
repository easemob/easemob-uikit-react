import React from 'react';
import classNames from 'classnames';
import './style/style.scss';

export interface NetworkQualityProps {
  /** 网络质量等级，1-3 格 */
  level: 1 | 2 | 3;
  /** 组件大小 */
  size?: 'small' | 'medium' | 'large';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

const NetworkQuality: React.FC<NetworkQualityProps> = ({
  level,
  size = 'medium',
  className,
  style,
}) => {
  const prefixCls = 'cui-network-quality';

  const classes = classNames(
    prefixCls,
    `${prefixCls}-${size}`,
    `${prefixCls}-level-${level}`,
    className,
  );

  // 渲染信号格子
  const renderBars = () => {
    const bars = [];
    for (let i = 1; i <= 3; i++) {
      bars.push(
        <div
          key={i}
          className={classNames(`${prefixCls}-bar`, `${prefixCls}-bar-${i}`, {
            [`${prefixCls}-bar-active`]: i <= level,
          })}
        />,
      );
    }
    return bars;
  };

  return (
    <div className={classes} style={style}>
      <div className={`${prefixCls}-bars`}>{renderBars()}</div>
    </div>
  );
};

export default NetworkQuality;
