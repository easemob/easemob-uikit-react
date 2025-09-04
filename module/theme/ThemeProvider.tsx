import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { hexToHsla, generateColors, isHueValue, isHexColor } from '../utils/color';

export interface ThemeConfig {
  primaryColor?: string | number;
  mode?: 'light' | 'dark';
  avatarShape?: 'circle' | 'square';
  bubbleShape?: 'round' | 'square';
  componentsShape?: 'round' | 'square';
  ripple?: boolean;
  // 扩展更多主题配置
  colors?: {
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
    error?: string;
    warning?: string;
    success?: string;
    info?: string;
  };
  spacing?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  borderRadius?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

interface ThemeContextValue {
  theme: ThemeConfig;
  parentTheme?: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  mergedTheme: ThemeConfig;
}

const defaultTheme: ThemeConfig = {
  primaryColor: 'hsla(203, 100%, 60%, 1)',
  mode: 'light',
  avatarShape: 'circle',
  bubbleShape: 'round',
  componentsShape: 'round',
  ripple: true,
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    info: '#2196f3',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 6px rgba(0,0,0,0.12)',
    lg: '0 10px 25px rgba(0,0,0,0.15)',
    xl: '0 20px 40px rgba(0,0,0,0.2)',
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  theme?: Partial<ThemeConfig>;
  children: ReactNode;
  /** 是否应用CSS变量到DOM */
  applyGlobalStyles?: boolean;
  /** CSS变量前缀 */
  cssPrefix?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme: providedTheme = {},
  children,
  applyGlobalStyles = true,
  cssPrefix = 'cui',
}) => {
  // 获取父级主题上下文
  const parentContext = useContext(ThemeContext);
  const parentTheme = parentContext?.mergedTheme || defaultTheme;

  // 合并主题：默认主题 < 父级主题 < 当前提供的主题
  const mergedTheme = useMemo(() => {
    return {
      ...defaultTheme,
      ...parentTheme,
      ...providedTheme,
      colors: {
        ...defaultTheme.colors,
        ...parentTheme.colors,
        ...providedTheme.colors,
      },
      spacing: {
        ...defaultTheme.spacing,
        ...parentTheme.spacing,
        ...providedTheme.spacing,
      },
      borderRadius: {
        ...defaultTheme.borderRadius,
        ...parentTheme.borderRadius,
        ...providedTheme.borderRadius,
      },
      shadows: {
        ...defaultTheme.shadows,
        ...parentTheme.shadows,
        ...providedTheme.shadows,
      },
    };
  }, [parentTheme, providedTheme]);

  // 当前主题状态
  const [currentTheme, setCurrentTheme] = React.useState<ThemeConfig>(mergedTheme);

  // 更新主题的方法
  const setTheme = React.useCallback((newTheme: Partial<ThemeConfig>) => {
    setCurrentTheme(prev => ({
      ...prev,
      ...newTheme,
      colors: {
        ...prev.colors,
        ...newTheme.colors,
      },
      spacing: {
        ...prev.spacing,
        ...newTheme.spacing,
      },
      borderRadius: {
        ...prev.borderRadius,
        ...newTheme.borderRadius,
      },
      shadows: {
        ...prev.shadows,
        ...newTheme.shadows,
      },
    }));
  }, []);

  // 最终合并的主题
  const finalMergedTheme = useMemo(() => {
    return {
      ...mergedTheme,
      ...currentTheme,
    };
  }, [mergedTheme, currentTheme]);

  // 应用主题色彩到CSS变量
  useEffect(() => {
    if (!applyGlobalStyles) return;

    const { primaryColor } = finalMergedTheme;

    // 处理主色调
    if (isHexColor(primaryColor as string)) {
      const color = hexToHsla(primaryColor as string);
      if (color) {
        generateColors(color);
      }
    } else if (isHueValue(primaryColor as number)) {
      generateColors(`hsla(${primaryColor}, 100%, 60%, 1)`);
    }

    // 应用其他CSS变量
    const root = document.documentElement;
    const theme = finalMergedTheme;

    // 颜色变量
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--${cssPrefix}-color-${key}`, value);
        }
      });
    }

    // 间距变量
    if (theme.spacing) {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--${cssPrefix}-spacing-${key}`, `${value}px`);
        }
      });
    }

    // 圆角变量
    if (theme.borderRadius) {
      Object.entries(theme.borderRadius).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--${cssPrefix}-border-radius-${key}`, `${value}px`);
        }
      });
    }

    // 阴影变量
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--${cssPrefix}-shadow-${key}`, value);
        }
      });
    }

    // 其他主题变量
    root.style.setProperty(
      `--${cssPrefix}-avatar-shape`,
      theme.avatarShape === 'circle' ? '50%' : '8px',
    );
    root.style.setProperty(
      `--${cssPrefix}-bubble-shape`,
      theme.bubbleShape === 'round' ? '16px' : '4px',
    );
    root.style.setProperty(
      `--${cssPrefix}-components-shape`,
      theme.componentsShape === 'round' ? '8px' : '4px',
    );
  }, [finalMergedTheme, applyGlobalStyles, cssPrefix]);

  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    parentTheme,
    setTheme,
    mergedTheme: finalMergedTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

// Hook for using theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // 如果没有ThemeProvider，返回默认主题
    return {
      theme: defaultTheme,
      setTheme: () => {},
      mergedTheme: defaultTheme,
    };
  }
  return context;
};

// Hook for using theme with fallback - 简化版本，避免循环依赖
export const useThemeWithFallback = () => {
  const themeContext = useContext(ThemeContext);

  if (themeContext) {
    return themeContext;
  }

  // 如果没有ThemeProvider，返回默认主题
  return {
    theme: defaultTheme,
    setTheme: () => {},
    mergedTheme: defaultTheme,
  };
};

export default ThemeProvider;
