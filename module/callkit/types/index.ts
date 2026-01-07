import CallError from '../services/CallError';
import { IAgoraRTCError, VideoEncoderConfigurationPreset } from 'agora-rtc-sdk-ng';
import { CallInfo } from '../services/CallService';
import { ChatSDK } from 'module/SDK';
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
    onVideoClick?: (e: React.MouseEvent, videoId: string) => void,
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
  callerUserId?: string; // 呼叫者userId
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
  // startCalling: () => void; // 主叫发起呼叫

  // 状态查询方法

  getCallStatus: () => 'idle' | 'calling' | 'ringing' | 'connected'; // 获取呼叫状态

  // 预览相关方法
  showPreview: (callModeToSet?: 'video' | 'audio' | 'group') => void; // 显示预览界面

  // 新增：主动发起多人通话方法
  startGroupCall: (options: {
    groupId: string;
    // callType: 'video' | 'audio';
    msg: string;
    ext?: Record<string, any>;
  }) => Promise<ChatSDK.TextMsgBody | null>; // 发起多人通话，先显示用户选择界面

  // 一对一通话方法
  startSingleCall: (options: {
    to: string;
    callType: 'video' | 'audio';
    msg: string;
  }) => Promise<ChatSDK.TextMsgBody | null>; // 发起真实通话
  answerCall: (result: boolean) => void; // 接听真实通话
  exitCall: (reason?: string) => void; // 挂断真实通话
  setUserInfo: (userInfo: { [key: string]: any }) => void; // 设置用户信息

  // 音视频控制方法
  toggleMute: () => Promise<boolean>; // 切换静音状态，返回新的静音状态
  toggleCamera: () => Promise<boolean>; // 切换摄像头状态，返回新的开启状态（异步）
  isMuted: () => boolean; // 获取当前静音状态
  isCameraEnabled: () => boolean; // 获取当前摄像头状态
  getJoinedMembers: () => any[]; // 获取加入的成员列表
  refreshLocalVideoStatus: () => void; // 刷新本地视频状态显示
  playLocalVideoManually: () => void; // 手动播放本地视频
  createLocalVideoTrackForGroupCall: () => Promise<boolean>; // 为多人视频通话创建本地视频轨道
  createLocalVideoTrackFor1v1Preview: () => Promise<boolean>; // 为1v1视频通话创建预览模式的本地视频轨道
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
  chatClient?: ChatSDK.Connection; // 环信 IM 连接
  enableRealCall?: boolean; // 是否启用真实通话功能
  useRTCToken?: boolean; // 是否使用 RTC Token 校验，默认 true；设置为 false 时 join channel 不校验 token

  // 🔧 新增：铃声相关配置
  outgoingRingtoneSrc?: string; // 拨打电话铃声音频文件路径
  incomingRingtoneSrc?: string; // 接听电话铃声音频文件路径
  enableRingtone?: boolean; // 是否启用铃声，默认 true
  ringtoneVolume?: number; // 铃声音量，范围 0-1，默认 0.8
  ringtoneLoop?: boolean; // 是否循环播放，默认 true

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
  onMinimizedChange?: (minimized: boolean) => void; // 最小化状态变化回调
  onMinimizedToggle?: () => void; // 最小化切换回调

  // 邀请相关配置
  invitationCustomContent?: React.ReactNode; // 自定义邀请内容
  acceptText?: string; // 接听按钮文本
  rejectText?: string; // 拒绝按钮文本
  showInvitationAvatar?: boolean; // 是否显示邀请者头像
  showInvitationTimer?: boolean; // 是否显示倒计时
  autoRejectTime?: number; // 自动拒绝时间（秒）

  // 群组成员选择相关
  groupMembers?: any[]; // 群组成员列表
  userSelectTitle?: string; // 用户选择弹窗标题（添加参与者时）
  initiateGroupCallTitle?: string; // 发起群组通话时的弹窗标题

  // 新增：基于 groupId 自动获取群成员的方式
  webimGroupId?: string; // WebIM 群组 ID
  userInfoProvider?: (
    userIds: string[],
  ) => Promise<Array<{ userId: string; nickname?: string; avatarUrl?: string }>>;
  groupInfoProvider?: (
    groupIds: string[],
  ) => Promise<Array<{ groupId: string; groupName?: string; groupAvatar?: string }>>;

  // 事件回调
  onVideoClick?: (id: string) => void;
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onCameraFlip?: (deviceId: string, success: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;
  onAddParticipant?: (event: React.MouseEvent) => void;
  onInvitationAccept?: (invitation: InvitationInfo) => void;
  onInvitationReject?: (invitation: InvitationInfo) => void;

  // 日志管理配置
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose'; // 日志级别，默认 'error'
  enableLogging?: boolean; // 是否启用日志输出，默认 true
  logPrefix?: string; // 日志前缀，默认 '[CallKit]'
  onCallStart?: (videos: VideoWindowProps[]) => void;
  onCallEnd?: (reason: string, callInfo: CallInfo) => void;
  onLayoutModeChange?: (layoutMode: 'grid' | 'main') => void;
  speakingVolumeThreshold?: number; // 说话指示器显示的音量阈值，范围1-100，默认60

  // 🔧 新增：Icon 自定义配置
  customIcons?: CallKitIconMap; // 自定义图标映射

  encoderConfig?: VideoEncoderConfigurationPreset;

  onCallError?: (error: CallError) => void; // SDK error
  onReceivedCall?: (callType: 'video' | 'audio' | 'group', userId: string, ext?: any) => void;
  onRemoteUserJoined?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  onRemoteUserLeft?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  onRtcEngineCreated?: (rtc: any) => void;
  onEndCallWithReason?: (reason: string, callInfo: CallInfo) => void;

  onRingtoneStart?: (type: 'outgoing' | 'incoming') => void;
  onRingtoneEnd?: () => void;
  onCallStatusChanged?: (
    status: 'idle' | 'calling' | 'ringing' | 'connected' | 'disconnected',
  ) => void;
}

// React相关导入
import type React from 'react';

// 🔧 新增：Icon 自定义相关类型
export interface CustomIconProps {
  type?: string;
  width?: number;
  height?: number;
  color?: string;
  [key: string]: any;
}

export type CustomIconComponent = React.ComponentType<CustomIconProps> | React.ReactElement;

// CallControls 可自定义的图标
export interface CallControlsIconMap {
  micOn?: CustomIconComponent;
  micOff?: CustomIconComponent;
  cameraOn?: CustomIconComponent;
  cameraOff?: CustomIconComponent;
  cameraFlip?: CustomIconComponent;
  speakerOn?: CustomIconComponent;
  speakerOff?: CustomIconComponent;
  hangup?: CustomIconComponent;
  accept?: CustomIconComponent;
  reject?: CustomIconComponent;
  screenShare?: CustomIconComponent;
  screenShareStop?: CustomIconComponent;
}

// Header 可自定义的图标
export interface HeaderIconMap {
  back?: CustomIconComponent;
  close?: CustomIconComponent;
  fullscreen?: CustomIconComponent;
  exitFullscreen?: CustomIconComponent;
  minimize?: CustomIconComponent;
  more?: CustomIconComponent;
  addParticipant?: CustomIconComponent; // 添加参与者按钮
  [key: string]: CustomIconComponent | undefined;
}

// 全局 Icon 映射
export interface CallKitIconMap {
  controls?: CallControlsIconMap;
  header?: HeaderIconMap;
}
