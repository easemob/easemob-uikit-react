// 主要组件导入
import { CallKit } from './CallKit';
import VideoLayout from './VideoLayout';
import CallControls from './components/CallControls';

// 类型导出
export type {
  CallKitProps,
  CallKitRef,
  VideoWindowProps,
  LayoutMode,
  InvitationInfo,
  InvitationNotificationProps,
} from './types/index';

export type { CallError, CallErrorCode } from './services/CallError';
export type { CallInfo } from './services/CallService';

// 向后兼容的类型导出
export type { VideoLayoutProps } from './VideoLayout';
export type { CallControlsProps } from './components/CallControls';

// 主要组件导出
export { CallKit, VideoLayout, CallControls };

// 组件导出
export { MiniSizeWindow } from './components/MiniSizeWindow';
export { default as InvitationContent } from './components/InvitationContent';

// 布局组件导出
export { MultiPartyLayout } from './layouts/MultiPartyLayout';
// export { PreviewLayout } from './layouts/PreviewLayout';
export { FullLayoutManager } from './layouts/FullLayoutManager';

// 完整布局组件导出
export { OneToOneFullLayout } from './layouts/OneToOneFullLayout';
export { MultiPartyFullLayout } from './layouts/MultiPartyFullLayout';
export { PreviewFullLayout } from './layouts/PreviewFullLayout';

// Hooks导出
export { useContainerSize } from './hooks/useContainerSize';
export { useFullscreen } from './hooks/useFullscreen';

// 默认导出（新的CallKit组件）
export default CallKit;
