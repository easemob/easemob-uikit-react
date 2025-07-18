import { useTheme } from './ThemeProvider';
import { useMemo } from 'react';

/**
 * 获取主题颜色的 hook
 */
export const useThemeColors = () => {
  const { mergedTheme } = useTheme();
  return mergedTheme.colors || {};
};

/**
 * 获取主题间距的 hook
 */
export const useThemeSpacing = () => {
  const { mergedTheme } = useTheme();
  return mergedTheme.spacing || {};
};

/**
 * 获取主题圆角的 hook
 */
export const useThemeBorderRadius = () => {
  const { mergedTheme } = useTheme();
  return mergedTheme.borderRadius || {};
};

/**
 * 获取主题阴影的 hook
 */
export const useThemeShadows = () => {
  const { mergedTheme } = useTheme();
  return mergedTheme.shadows || {};
};

/**
 * 根据主题模式获取对应的颜色值
 */
export const useThemeMode = () => {
  const { mergedTheme } = useTheme();

  const isDark = mergedTheme.mode === 'dark';

  return useMemo(
    () => ({
      isDark,
      isLight: !isDark,
      mode: mergedTheme.mode || 'light',
      // 根据模式返回不同的颜色
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      textColor: isDark ? '#ffffff' : '#333333',
      borderColor: isDark ? '#404040' : '#e0e0e0',
    }),
    [isDark, mergedTheme.mode],
  );
};

/**
 * 获取响应式间距的 hook
 */
export const useResponsiveSpacing = () => {
  const { mergedTheme } = useTheme();

  return useMemo(() => {
    const spacing = mergedTheme.spacing || {};

    return {
      // 基础间距
      ...spacing,

      // 响应式间距函数
      responsive: (base: keyof typeof spacing, scale = 1) => {
        const value = spacing[base] || 16;
        return {
          mobile: Math.round(value * 0.75 * scale),
          tablet: Math.round(value * 0.875 * scale),
          desktop: Math.round(value * scale),
        };
      },

      // 快捷方法
      container: {
        mobile: spacing.md || 16,
        tablet: spacing.lg || 24,
        desktop: spacing.xl || 32,
      },
    };
  }, [mergedTheme.spacing]);
};

/**
 * 获取组件样式的 hook（常用组合）
 */
export const useComponentStyles = () => {
  const { mergedTheme } = useTheme();

  return useMemo(
    () => ({
      // 按钮样式
      button: {
        borderRadius:
          mergedTheme.componentsShape === 'round'
            ? mergedTheme.borderRadius?.md || 8
            : mergedTheme.borderRadius?.sm || 4,
        padding: `${mergedTheme.spacing?.sm || 8}px ${mergedTheme.spacing?.md || 16}px`,
      },

      // 卡片样式
      card: {
        borderRadius: mergedTheme.borderRadius?.lg || 12,
        padding: mergedTheme.spacing?.lg || 24,
        boxShadow: mergedTheme.shadows?.md || '0 4px 6px rgba(0,0,0,0.12)',
        backgroundColor: mergedTheme.colors?.surface || '#f5f5f5',
      },

      // 头像样式
      avatar: {
        borderRadius:
          mergedTheme.avatarShape === 'circle' ? '50%' : mergedTheme.borderRadius?.md || 8,
      },

      // 聊天气泡样式
      bubble: {
        borderRadius:
          mergedTheme.bubbleShape === 'round'
            ? mergedTheme.borderRadius?.xl || 16
            : mergedTheme.borderRadius?.sm || 4,
        padding: `${mergedTheme.spacing?.sm || 8}px ${mergedTheme.spacing?.md || 16}px`,
      },
    }),
    [mergedTheme],
  );
};

/**
 * 主题切换的 hook
 */
export const useThemeToggle = () => {
  const { mergedTheme, setTheme } = useTheme();

  const toggleMode = () => {
    setTheme({
      mode: mergedTheme.mode === 'dark' ? 'light' : 'dark',
    });
  };

  const toggleShape = () => {
    setTheme({
      componentsShape: mergedTheme.componentsShape === 'round' ? 'square' : 'round',
    });
  };

  const toggleRipple = () => {
    setTheme({
      ripple: !mergedTheme.ripple,
    });
  };

  return {
    toggleMode,
    toggleShape,
    toggleRipple,
    currentMode: mergedTheme.mode || 'light',
    currentShape: mergedTheme.componentsShape || 'round',
    currentRipple: mergedTheme.ripple !== false,
  };
};
