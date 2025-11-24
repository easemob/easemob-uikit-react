declare module 'react-photo-view' {
  import { ReactNode } from 'react';

  export interface DataType {
    src: string;
    key?: string;
    originRef?: React.MutableRefObject<HTMLElement | null>;
  }

  export interface PhotoSliderProps {
    images: DataType[];
    visible: boolean;
    onClose: () => void;
    index?: number;
    onIndexChange?: (index: number) => void;
    loop?: boolean | number;
    speed?: (type: number) => number;
    easing?: (type: number) => string;
    toolbarRender?: (params: {
      images: DataType[];
      index: number;
      onIndexChange: (index: number) => void;
      visible: boolean;
      onClose: () => void;
      overlayVisible: boolean;
      overlay: ReactNode;
      rotate: number;
      onRotate: (rotate: number) => void;
      scale: number;
      onScale: (scale: number) => void;
    }) => ReactNode;
    overlayRender?: (params: {
      images: DataType[];
      index: number;
      onIndexChange: (index: number) => void;
      visible: boolean;
      onClose: () => void;
      overlayVisible: boolean;
      overlay: ReactNode;
      rotate: number;
      onRotate: (rotate: number) => void;
      scale: number;
      onScale: (scale: number) => void;
    }) => ReactNode;
    maskOpacity?: number;
    pullClosable?: boolean;
    maskClosable?: boolean;
    bannerVisible?: boolean;
    afterClose?: () => void;
    className?: string;
    loadingElement?: ReactNode;
    brokenElement?: ReactNode;
  }

  export const PhotoSlider: React.FC<PhotoSliderProps>;

  export interface PhotoProviderProps {
    children?: ReactNode;
    speed?: (type: number) => number;
    easing?: (type: number) => string;
    toolbarRender?: PhotoSliderProps['toolbarRender'];
    overlayRender?: PhotoSliderProps['overlayRender'];
    maskOpacity?: number;
    pullClosable?: boolean;
    maskClosable?: boolean;
    bannerVisible?: boolean;
    loop?: boolean | number;
    className?: string;
    loadingElement?: ReactNode;
    brokenElement?: ReactNode;
  }

  export const PhotoProvider: React.FC<PhotoProviderProps>;

  export interface PhotoViewProps {
    src?: string;
    width?: number;
    height?: number;
    render?: (params: {
      scale: number;
      attrs: React.HTMLAttributes<HTMLDivElement>;
    }) => ReactNode;
    children?: ReactNode;
  }

  export const PhotoView: React.FC<PhotoViewProps>;
}

declare module 'react-photo-view/dist/react-photo-view.css';

