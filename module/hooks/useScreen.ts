import { useEffect, useMemo, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface Breakpoints {
  xs: number; // < xs
  sm: number; // >= xs
  md: number; // >= sm
  lg: number; // >= md
  xl: number; // >= lg
}

export interface ScreenInfo {
  width: number;
  height: number;
  vw: number; // viewport width (alias of width)
  vh: number; // viewport height (alias of height)
  devicePixelRatio: number;
  orientation: Orientation;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
}

const DEFAULT_BREAKPOINTS: Breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

function getBreakpoint(width: number, bp: Breakpoints): BreakpointKey {
  if (width >= bp.xl) return 'xl';
  if (width >= bp.lg) return 'lg';
  if (width >= bp.md) return 'md';
  if (width >= bp.sm) return 'sm';
  return 'xs';
}

function isTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator as any).maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function getOrientation(width: number, height: number): Orientation {
  return height >= width ? 'portrait' : 'landscape';
}

export function useScreen(customBreakpoints?: Partial<Breakpoints>): ScreenInfo {
  const breakpoints: Breakpoints = useMemo(
    () => ({ ...DEFAULT_BREAKPOINTS, ...(customBreakpoints || {}) }),
    [customBreakpoints],
  );

  const getSnapshot = (): ScreenInfo => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        vw: 0,
        vh: 0,
        devicePixelRatio: 1,
        orientation: 'portrait',
        breakpoint: 'xs',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        prefersReducedMotion: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width, breakpoints);
    const orientation = getOrientation(width, height);
    const devicePixelRatio = window.devicePixelRatio || 1;
    const prefersReducedMotion = getReducedMotion();
    const touch = isTouchCapable();

    const isMobile = width < breakpoints.md || /Mobi|Android/i.test(navigator.userAgent);
    const isTablet = !isMobile && width < breakpoints.lg;
    const isDesktop = !isMobile && !isTablet;

    return {
      width,
      height,
      vw: width,
      vh: height,
      devicePixelRatio,
      orientation,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice: touch,
      prefersReducedMotion,
    };
  };

  const [screen, setScreen] = useState<ScreenInfo>(getSnapshot);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setScreen(getSnapshot());

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let mql: MediaQueryList | null = null;
    if (typeof window.matchMedia === 'function') {
      mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      // modern browsers
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleResize);
      } else if (typeof (mql as any).addListener === 'function') {
        // legacy Safari
        (mql as any).addListener(handleResize);
      }
    }

    // initial sync (in case of SSR hydration diff)
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mql) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', handleResize);
        } else if (typeof (mql as any).removeListener === 'function') {
          (mql as any).removeListener(handleResize);
        }
      }
    };
  }, [breakpoints.xs, breakpoints.sm, breakpoints.md, breakpoints.lg, breakpoints.xl]);

  return screen;
}

export function useIsMobile(customBreakpoints?: Partial<Breakpoints>): boolean {
  const { isMobile } = useScreen(customBreakpoints);
  return isMobile;
}
