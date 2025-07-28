// 视频窗口属性
export interface VideoWindowProps {
  id: string;
  stream?: MediaStream;
  videoElement?: HTMLVideoElement;
  muted?: boolean;
  cameraEnabled?: boolean;
  nickname?: string;
  avatar?: string;
  isLocalVideo?: boolean;
  isWaiting?: boolean; // 是否处于等待状态（显示头像和加载动画）
  onVideoClick?: (id: string) => void;
  removed?: boolean; // 是否为移除的用户（用于通知UI移除视频窗口）
}

// 布局模式枚举
export enum LayoutMode {
  MULTI_PARTY = 'multi-party', // 多人网格布局
  ONE_TO_ONE = 'one-to-one', // 1v1画中画布局
  PREVIEW = 'preview', // 预览布局（竖屏）
  SCREEN_SHARE = 'screen-share', // 屏幕共享布局
  MINIMIZED = 'minimized', // 最小化布局
  MAIN_VIDEO = 'main-video', // 主视频 + 缩略图布局
}

// 布局配置
export interface LayoutConfig {
  rows: number;
  cols: number;
  itemsPerRow: number[];
  maxCols: number;
  mode: LayoutMode;
}

// 视频尺寸信息
export interface VideoSize {
  width: string;
  height: string;
  actualWidth: number;
  actualHeight: number;
}

// 容器尺寸
export interface ContainerSize {
  width: number;
  height: number;
}

// 视频切换状态
export interface VideoSwitchingState {
  isVideoSwitching: boolean;
  switchingFromVideoId?: string | null;
  switchingToVideoId?: string | null;
}

// 布局策略接口
export interface LayoutStrategy {
  calculateLayout(videoCount: number, containerSize: ContainerSize): LayoutConfig;
  calculateVideoSize(
    layoutConfig: LayoutConfig,
    containerSize: ContainerSize,
    options: LayoutOptions,
  ): VideoSize;
  renderLayout(
    videos: VideoWindowProps[],
    layoutConfig: LayoutConfig,
    videoSize: VideoSize,
    renderVideoWindow: (
      video: VideoWindowProps,
      index: number,
      windowSize?: { width: number; height: number },
    ) => React.ReactNode,
    prefixCls: string,
    gap: number,
    selectedVideoId?: string,
    onVideoClick?: (videoId: string) => void,
    switchingState?: VideoSwitchingState,
    onExitMainVideoMode?: () => void,
  ): React.ReactNode;
}

// 布局选项
export interface LayoutOptions {
  aspectRatio: number;
  gap: number;
  headerHeight: number;
  controlsHeight: number;
  maxVideos?: number;
}

// 邀请信息
export interface InvitationInfo {
  id: string;
  type: 'video' | 'audio' | 'group'; // 邀请类型
  callerName?: string; // 呼叫者姓名
  callerAvatar?: string; // 呼叫者头像
  groupId?: string; // 群组ID（群组通话时）
  groupName?: string; // 群组名称（群组通话时）
  groupAvatar?: string; // 群组头像（群组通话时）
  memberCount?: number; // 群组成员数量
  timestamp?: number; // 邀请时间戳
  customData?: Record<string, any>; // 自定义数据
}

// 邀请通知组件属性
export interface InvitationNotificationProps {
  invitation: InvitationInfo;
  onAccept: (invitation: InvitationInfo) => void;
  onReject: (invitation: InvitationInfo) => void;
  customContent?: React.ReactNode; // 自定义内容
  acceptText?: string; // 接听按钮文本
  rejectText?: string; // 挂断按钮文本
  showAvatar?: boolean; // 是否显示头像
  showTimer?: boolean; // 是否显示倒计时
  autoRejectTime?: number; // 自动拒绝时间（秒）
  className?: string;
  style?: React.CSSProperties;
}

// CallKit 方法接口 - 通过 ref 暴露给外部
export interface CallKitRef {
  // 邀请相关方法
  showInvitation: (invitation: InvitationInfo) => void; // 显示邀请
  hideInvitation: () => void; // 隐藏邀请

  // 通话相关方法
  startCall: (videos: VideoWindowProps[]) => void; // 开始通话（演示模式）
  endCall: () => void; // 结束通话
  updateVideos: (videos: VideoWindowProps[]) => void; // 更新视频列表
  startCalling: () => void; // 主叫发起呼叫

  // 状态查询方法
  isInCall: () => boolean; // 是否在通话中
  hasInvitation: () => boolean; // 是否有邀请
  getCallStatus: () => 'idle' | 'calling' | 'ringing' | 'connected'; // 获取呼叫状态

  // 预览相关方法
  showPreview: (callModeToSet?: 'video' | 'audio' | 'group') => void; // 显示预览界面

  // 新增：主动发起多人通话方法
  startGroupCall: (groupId: string, callType?: 'video' | 'audio') => Promise<void>; // 发起多人通话，先显示用户选择界面

  // 真实通话相关方法
  startRealCall: (options: {
    to: string;
    callType: 'video' | 'audio';
    groupId?: string;
    groupName?: string;
    members?: string[];
  }) => void; // 发起真实通话
  answerRealCall: (result: boolean) => void; // 接听真实通话
  hangupRealCall: (reason?: string) => void; // 挂断真实通话
  setUserInfo: (userInfo: { [key: string]: any }) => void; // 设置用户信息

  // 音视频控制方法
  toggleMute: () => boolean; // 切换静音状态，返回新的静音状态
  toggleCamera: () => boolean; // 切换摄像头状态，返回新的开启状态
  isMuted: () => boolean; // 获取当前静音状态
  isCameraEnabled: () => boolean; // 获取当前摄像头状态
  getJoinedMembers: () => any[]; // 获取加入的成员列表
  refreshLocalVideoStatus: () => void; // 刷新本地视频状态显示
  playLocalVideoManually: () => void; // 手动播放本地视频
  createLocalVideoTrackForGroupCall: () => Promise<boolean>; // 为多人视频通话创建本地视频轨道
  addParticipants: (newMembers: string[]) => Promise<boolean>; // 添加参与者到当前通话

  // 🔧 新增：调整CallKit尺寸的方法
  adjustSize: (newSize: { width: number; height: number }) => void; // 动态调整CallKit尺寸
}

// CallKit主组件属性
export interface CallKitProps {
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;

  // 布局相关
  layoutMode?: LayoutMode;
  maxVideos?: number;
  aspectRatio?: number;
  gap?: number;

  // 🔧 多人通话背景图片设置
  backgroundImage?: string;

  // 通话模式（可选，如果不提供则从邀请信息推断）
  callMode?: 'video' | 'audio' | 'group';

  // 控制按钮相关
  showControls?: boolean;
  muted?: boolean;
  cameraEnabled?: boolean;
  speakerEnabled?: boolean;
  screenSharing?: boolean;

  // 真实通话相关配置
  webimConnection?: any; // 环信 IM 连接
  enableRealCall?: boolean; // 是否启用真实通话功能

  // 可调整大小相关
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (
    width: number,
    height: number,
    deltaX?: number,
    deltaY?: number,
    direction?: string,
  ) => void;

  // 拖动相关
  draggable?: boolean;
  dragHandle?: string; // CSS 选择器，指定拖动手柄区域
  onDragStart?: (startPosition: { x: number; y: number }) => void;
  onDrag?: (newPosition: { x: number; y: number }, delta: { x: number; y: number }) => void;
  onDragEnd?: (finalPosition: { x: number; y: number }) => void;

  // 内置位置管理
  managedPosition?: boolean;
  initialPosition?: { left: number; top: number };
  initialSize?: { width: number; height: number };

  // 最小化相关
  isMinimized?: boolean; // 最小化状态
  minimizedSize?: { width: number; height: number }; // 最小化时的尺寸，默认 { width: 200, height: 150 }
  callDuration?: string; // 通话时长，用于最小化时显示
  onMinimizedChange?: (minimized: boolean) => void; // 最小化状态变化回调
  onMinimizedToggle?: () => void; // 最小化切换回调

  // 邀请相关配置
  invitationCustomContent?: React.ReactNode; // 自定义邀请内容
  acceptText?: string; // 接听按钮文本
  rejectText?: string; // 挂断按钮文本
  showInvitationAvatar?: boolean; // 是否显示邀请头像
  showInvitationTimer?: boolean; // 是否显示邀请倒计时
  autoRejectTime?: number; // 自动拒绝时间（秒）

  // 事件回调
  onVideoClick?: (id: string) => void;
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;
  onAddParticipant?: (newMembers?: any[]) => void;

  // 群组成员选择相关
  groupMembers?: any[]; // 群组成员列表，用于添加参与者时选择（传统方式）
  userSelectTitle?: string; // 用户选择弹窗标题

  // 新增：基于 groupId 自动获取群成员的方式
  /** @deprecated 不再使用，请直接调用 startGroupCall(groupId) 方法 */
  webimGroupId?: string; // [已废弃] 群组ID，现在统一通过 startGroupCall 方法传入

  // 通用用户信息提供器 - 用于获取任何用户的头像昵称（包括群成员、邀请人等）
  userInfoProvider?: (userIds: string[]) =>
    | Promise<
        {
          userId: string;
          nickname?: string;
          avatarUrl?: string;
        }[]
      >
    | { userId: string; nickname?: string; avatarUrl?: string }[]; // 通用用户信息获取provider

  // 群组信息提供器 - 用于获取群组的名称和头像
  groupInfoProvider?: (groupIds: string[]) =>
    | Promise<
        {
          groupId: string;
          groupName?: string;
          groupAvatar?: string;
        }[]
      >
    | { groupId: string; groupName?: string; groupAvatar?: string }[]; // 群组信息获取provider

  // 邀请事件回调
  onInvitationAccept?: (invitation: InvitationInfo) => void; // 接听邀请回调
  onInvitationReject?: (invitation: InvitationInfo) => void; // 拒绝邀请回调
  onCallStart?: (videos: VideoWindowProps[]) => void; // 通话开始回调
  onCallEnd?: () => void; // 通话结束回调

  // Agora RTC 事件回调
  onUserPublished?: (user: any, mediaType: string) => void; // 远程用户发布流
  onUserLeft?: (user: any, reason: string) => void; // 远程用户离开
  onUserUnpublished?: (user: any, mediaType: string) => void; // 远程用户停止发布流
  onRemoteVideoReady?: (videoInfo: VideoWindowProps) => void; // 远程视频流准备就绪

  // 🔧 新增：布局切换回调
  onLayoutModeChange?: (layoutMode: 'grid' | 'main') => void; // 布局模式切换回调
}

// React相关导入
import type React from 'react';
