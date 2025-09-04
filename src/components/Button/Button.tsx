import React from 'react';
import classNames from 'classnames';
import { useTheme } from '../../../module/theme/ThemeProvider';
import './Button.scss';

export interface ButtonProps {
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 按钮形状 */
  shape?: 'default' | 'round' | 'circle';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击事件 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 按钮内容 */
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  shape = 'default',
  className,
  style,
  onClick,
  children,
  ...rest
}) => {
  // 使用主题
  const { mergedTheme } = useTheme();

  // 根据主题计算样式
  const computedStyle = React.useMemo(() => {
    const themeStyle: React.CSSProperties = {};

    // 根据主题设置圆角
    if (shape === 'default') {
      themeStyle.borderRadius = `${mergedTheme.borderRadius?.md || 8}px`;
    } else if (shape === 'round') {
      themeStyle.borderRadius = `${mergedTheme.borderRadius?.xl || 16}px`;
    } else if (shape === 'circle') {
      themeStyle.borderRadius = '50%';
    }

    // 根据主题设置间距
    if (size === 'small') {
      themeStyle.padding = `${mergedTheme.spacing?.xs || 4}px ${mergedTheme.spacing?.sm || 8}px`;
    } else if (size === 'medium') {
      themeStyle.padding = `${mergedTheme.spacing?.sm || 8}px ${mergedTheme.spacing?.md || 16}px`;
    } else if (size === 'large') {
      themeStyle.padding = `${mergedTheme.spacing?.md || 16}px ${mergedTheme.spacing?.lg || 24}px`;
    }

    return {
      ...themeStyle,
      ...style,
    };
  }, [mergedTheme, shape, size, style]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onClick?.(event);
  };

  const buttonClass = classNames(
    'cui-button',
    `cui-button--${type}`,
    `cui-button--${size}`,
    `cui-button--${shape}`,
    {
      'cui-button--disabled': disabled,
      'cui-button--loading': loading,
      'cui-button--ripple': mergedTheme.ripple,
    },
    className,
  );

  return (
    <button
      className={buttonClass}
      style={computedStyle}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      {loading && <span className="cui-button__loading-icon">⟳</span>}
      <span className="cui-button__content">{children}</span>
    </button>
  );
};

export default Button;
