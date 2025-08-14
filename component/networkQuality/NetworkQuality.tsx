import React from 'react';
import classNames from 'classnames';
import './style/style.scss';

export interface NetworkQualityProps {
  /** 网络质量等级，1-6 级，1 极好，6 极差 */
  level: 1 | 2 | 3 | 4 | 5 | 6;
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

  // 将 1-6 级别映射到显示级别：1-2显示3格，3-4显示2格，5-6显示1格
  const getDisplayLevel = (level: number) => {
    if (level <= 2) return 3; // 极好/很好 - 显示3格
    if (level <= 4) return 2; // 好/一般 - 显示2格
    return 1; // 差/极差 - 显示1格
  };

  // 获取颜色级别：1-2绿色，3-4橙色，5-6红色
  const getColorLevel = (level: number) => {
    if (level <= 2) return 'excellent'; // 绿色
    if (level <= 4) return 'good'; // 橙色
    return 'poor'; // 红色
  };

  const displayLevel = getDisplayLevel(level);
  const colorLevel = getColorLevel(level);

  const classes = classNames(
    prefixCls,
    `${prefixCls}-${size}`,
    `${prefixCls}-${colorLevel}`,
    className,
  );

  // 渲染信号格子 - 固定显示3格
  const renderBars = () => {
    const bars = [];
    for (let i = 1; i <= 3; i++) {
      bars.push(
        <div
          key={i}
          className={classNames(`${prefixCls}-bar`, `${prefixCls}-bar-${i}`, {
            [`${prefixCls}-bar-active`]: i <= displayLevel,
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
