import React from 'react';
import type { VideoWindowProps, ContainerSize, InvitationInfo } from './index';

/**
 * 布局组件的通用 Props
 */
export interface BaseLayoutProps {
  videos: VideoWindowProps[];
  containerSize: ContainerSize;
  prefixCls: string;

  // 渲染函数
  renderVideoWindow: (video: VideoWindowProps, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderControls?: () => React.ReactNode;

  // 布局选项
  aspectRatio?: number;
  gap?: number;
  maxVideos?: number;

  // 🔧 多人通话背景图片设置
  backgroundImage?: string;

  // 事件回调
  callDuration?: string;
  onMinimizedClick?: () => void;
}

/**
 * 完整布局组件的 Props（包含所有 CallKit 的状态和回调）
 */
export interface FullLayoutProps extends BaseLayoutProps {
  // 覆盖 BaseLayoutProps 中的 renderVideoWindow 以支持窗口尺寸参数
  renderVideoWindow: (
    video: VideoWindowProps,
    index: number,
    windowSize?: { width: number; height: number },
  ) => React.ReactElement;

  // 呼叫状态相关
  callMode?: 'video' | 'audio' | 'group';
  callStatus?: 'idle' | 'calling' | 'ringing' | 'connected';

  // 预览模式
  isShowingPreview?: boolean;

  // 全屏相关
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;

  // 最小化相关
  isMinimized?: boolean;
  onMinimizedToggle?: () => void;

  // 控制按钮相关
  showControls?: boolean;
  muted?: boolean;
  cameraEnabled?: boolean;
  speakerEnabled?: boolean;
  screenSharing?: boolean;

  // 控制按钮回调
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;
  onAddParticipant?: () => void;

  // 预览模式回调
  onPreviewAccept?: () => void;
  onPreviewReject?: () => void;

  // 覆盖 BaseLayoutProps 中的 onMinimizedClick 以支持事件参数
  onMinimizedClick?: (event?: React.MouseEvent) => void;

  // 🔧 新增：通话信息相关（用于Header显示）
  invitation?: InvitationInfo | null; // 邀请信息
  callInfo?: {
    // 当前通话信息
    groupId?: string;
    groupName?: string;
    groupAvatar?: string;
    // 1v1通话中的对方信息
    remoteUserId?: string;
    remoteUserNickname?: string;
    remoteUserAvatar?: string;
  };
}

/**
 * 布局组件的工厂函数类型
 */
export type LayoutComponent = React.FC<FullLayoutProps>;

/**
 * 布局模式枚举
 */
export enum LayoutMode {
  MULTI_PARTY = 'multi-party',
  ONE_TO_ONE = 'one-to-one',
  PREVIEW = 'preview',
  MINIMIZED = 'minimized',
  SCREEN_SHARE = 'screen-share',
  VOICE_CALL = 'voice-call', // 新增语音通话模式
}
