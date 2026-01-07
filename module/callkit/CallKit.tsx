import React, { useMemo, useRef, forwardRef, useImperativeHandle, useState, memo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ConfigContext } from '../../component/config';
import { Icon } from '../../component/icon/Icon';
import { NetworkQuality } from '../../component/networkQuality';
import LoadingDots from '../../component/loading/LoadingDots';
import { useNotification } from '../../component/notification';
import VideoPlayer from './components/VideoPlayer';
import { useContainerSize } from './hooks/useContainerSize';
import { useFullscreen } from './hooks/useFullscreen';
import { useResizable } from './hooks/useResizable';
import { useDraggable } from './hooks/useDraggable';
import { useCallTimer } from './hooks/useCallTimer';
import { useInvitationTimers } from './hooks/useInvitationTimers';
import { FullLayoutManager } from './layouts/FullLayoutManager';
import InvitationContent from './components/InvitationContent';
import UserSelect from '../userSelect/UserSelect';
import { ChatSDK } from 'module/SDK';
import {
  CallService,
  CALL_STATUS,
  CALL_TYPE,
  CallServiceConfig,
  CallInfo,
} from './services/CallService';
import type {
  CallKitProps,
  CallKitRef,
  VideoWindowProps,
  LayoutOptions,
  InvitationInfo,
} from './types/index';
import type { FullLayoutProps } from './types/layout';
import { LayoutMode } from './types/index';
import { generateRandomChannel, getUserAvatar, calculateSafePosition } from './utils/callUtils';
import { logger, LogLevel } from './utils/logger';
import './styles/index.scss';
import CallError, { CallErrorCode } from './services/CallError';
import { useIsMobile } from '../hooks/useScreen';
/**
 * 优化的 FullLayoutManager 组件
 * 使用 React.memo 进行性能优化
 */
const MemoizedFullLayoutManager = memo<FullLayoutProps>(FullLayoutManager);

let groupCallInviteMsg = '邀请你进行音视频通话';
/**
 * CallKit主组件
 */
const CallKit = forwardRef<CallKitRef, CallKitProps>((props, ref) => {
  const {
    className,
    style,
    prefix,

    // 布局相关
    layoutMode = LayoutMode.MULTI_PARTY,
    maxVideos = 16,
    aspectRatio = 1,
    gap = 6,

    // 通话背景图片设置
    backgroundImage,

    // 控制按钮相关
    showControls = true,
    muted = false,
    cameraEnabled = true,
    speakerEnabled = true,
    screenSharing = false,

    // 通话相关配置
    chatClient,

    // RTC Token 配置
    useRTCToken = true,

    // 铃声相关配置
    outgoingRingtoneSrc,
    incomingRingtoneSrc,
    enableRingtone = true,
    ringtoneVolume = 0.8, // 测试
    ringtoneLoop = true,

    // Icon 自定义配置
    customIcons,

    // 可调整大小相关
    resizable = false,
    minWidth = 400,
    minHeight = 300,
    maxWidth,
    maxHeight,
    onResize,

    // 拖动相关
    draggable = false,
    dragHandle,
    onDragStart,
    onDrag,
    onDragEnd,

    // 内置位置管理
    managedPosition = true,
    initialPosition = { left: 50, top: 50 },
    initialSize = { width: 748, height: 523 },

    // 最小化相关
    minimizedSize = { width: 80, height: 64 },
    onMinimizedChange,

    // 邀请相关配置
    invitationCustomContent,
    acceptText,
    rejectText,
    showInvitationAvatar = true,
    showInvitationTimer = true,
    autoRejectTime = 30,

    // 群组成员选择相关
    groupMembers = [],
    userSelectTitle,
    initiateGroupCallTitle,

    // 基于 groupId 自动获取群成员的方式  callInfoProvider
    userInfoProvider,
    groupInfoProvider,

    // 事件回调  去掉
    onVideoClick,
    onMuteToggle,
    onCameraToggle,
    onSpeakerToggle,
    onCameraFlip,
    onScreenShareToggle,
    onHangup, // 去掉
    onAddParticipant,
    onInvitationAccept,
    onInvitationReject,
    onCallStart,

    onLayoutModeChange,

    // 音量阈值配置
    speakingVolumeThreshold,

    onCallError,
    onReceivedCall,
    onRemoteUserJoined,
    onRemoteUserLeft,
    onRtcEngineCreated,
    onEndCallWithReason,

    onRingtoneStart, // 铃声开始播放
    onRingtoneEnd, // 铃声结束播放
    onCallStatusChanged, // 通话状态变化

    // 日志管理配置
    logLevel = 'error',
    enableLogging = true,
    logPrefix = '[CallKit]',

    encoderConfig,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('callkit', prefix);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  // 设置标题的默认值，支持用户自定义
  const finalUserSelectTitle = userSelectTitle || t('callkit.userselect.addParticipants');
  const finalInitiateGroupCallTitle =
    initiateGroupCallTitle || t('callkit.userselect.initiateGroupCall');

  // 内部状态管理
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>(
    'idle',
  );
  const [isInCall, setIsInCall] = useState(false);
  const [isShowingPreview, setIsShowingPreview] = useState(false);
  const [localVideo, setLocalVideo] = useState<VideoWindowProps | null>(null);
  const [videos, setVideos] = useState<VideoWindowProps[]>([]);
  const [callMode, setCallMode] = useState<'video' | 'audio' | 'group'>('video');
  const [talkingUsers, setTalkingUsers] = useState<string[]>([]); // 🔧 新增：正在说话的用户列表
  const [hasInitialized, setHasInitialized] = useState(false);
  const onEndCallWithReasonRef = useRef(onEndCallWithReason);

  // 通知系统
  const [notificationApi, notificationContextHolder] = useNotification({
    placement: 'topRight',
    duration: autoRejectTime, // 30秒
    maxCount: 1, // 最多显示一个邀请通知
  });

  // 使用计时器hook
  const { callDuration, startCallTimer, stopCallTimer } = useCallTimer();

  // 初始化日志管理器
  React.useEffect(() => {
    if (enableLogging) {
      const levelMap = {
        error: LogLevel.ERROR,
        warn: LogLevel.WARN,
        info: LogLevel.INFO,
        debug: LogLevel.DEBUG,
        verbose: LogLevel.VERBOSE,
      };

      logger.setLevel(levelMap[logLevel] || LogLevel.ERROR);
      logger.setConsoleEnabled(true);
      logger.setPrefix(logPrefix);
    } else {
      logger.setConsoleEnabled(false);
    }
  }, [logLevel, enableLogging, logPrefix]);

  // 监听通话状态变化，自动开始/停止计时
  React.useEffect(() => {
    if (callStatus === 'connected' && isInCall) {
      startCallTimer();
    } else if (callStatus === 'idle' || !isInCall) {
      stopCallTimer();
    }
  }, [callStatus, isInCall, startCallTimer, stopCallTimer]);

  // 触发外部通话状态变化回调
  React.useEffect(() => {
    onCallStatusChanged?.(callStatus);
  }, [callStatus, onCallStatusChanged]);

  // 内置位置和尺寸管理状态
  const [internalPosition, setInternalPosition] = React.useState(initialPosition);
  const [internalSize, setInternalSize] = React.useState(initialSize);
  const internalRef = React.useRef<HTMLDivElement>(null);

  const { setInvitationTimer, clearInvitationTimer, clearAllInvitationTimers, handleUserJoined } =
    useInvitationTimers();

  const handleInvitationTimeout = React.useCallback(
    (userId: string) => {
      if (hasInitialized && callServiceRef.current) {
        callServiceRef.current.cancelInvitation(userId);
      }
      logger.debug('handleInvitationTimeout', userId);
      setVideos(prevVideos => {
        const updatedVideos = prevVideos.filter(video => {
          const videoUserId = video.isLocalVideo
            ? 'local'
            : video.id.startsWith('remote-')
            ? video.id.replace('remote-', '')
            : video.id;
          return videoUserId !== userId;
        });
        return updatedVideos;
      });
    },
    [hasInitialized],
  );

  const handleInvitedUserRemoved = React.useCallback(
    (userId: string, reason: 'refused' | 'cancelled' | 'timeout') => {
      clearInvitationTimer(userId);

      setVideos(prevVideos => {
        const updatedVideos = prevVideos.filter(video => {
          const videoUserId = video.isLocalVideo
            ? 'local'
            : video.id.startsWith('remote-')
            ? video.id.replace('remote-', '')
            : video.id;
          return videoUserId !== userId;
        });
        return updatedVideos;
      });
    },
    [clearInvitationTimer],
  );

  const [isMinimized, setIsMinimized] = React.useState(false);

  const [isUserSelectVisible, setIsUserSelectVisible] = React.useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = React.useState<any[]>([]);
  const [isInitiatingGroupCall, setIsInitiatingGroupCall] = React.useState(false);
  const [groupCallType, setGroupCallType] = React.useState<'video' | 'audio'>('video');
  const [groupId, setGroupId] = React.useState<string>('');

  const [webimGroupMembers, setWebimGroupMembers] = React.useState<any[]>([]);
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = React.useState(false);

  const groupCallPromiseRef = useRef<{
    resolve: (msg: ChatSDK.TextMsgBody | null) => void;
    reject: (error: any) => void;
  } | null>(null);

  const [callerTargetInfo, setCallerTargetInfo] = React.useState<{
    targetUserId?: string;
    targetUserNickname?: string;
    targetUserAvatar?: string;
    targetGroupId?: string;
    targetGroupName?: string;
    targetGroupAvatar?: string;
  } | null>(null);

  const [realCallMuted, setRealCallMuted] = React.useState(false);
  const [realCallCameraEnabled, setRealCallCameraEnabled] = React.useState(true);
  const [realCallSpeakerEnabled, setRealCallSpeakerEnabled] = React.useState(true);

  const callServiceRef = React.useRef<CallService | null>(null);

  React.useEffect(() => {
    if (callMode === 'group') {
      setRealCallCameraEnabled(false);
    } else if (callMode === 'video') {
      setRealCallCameraEnabled(true);
    }
  }, [callMode]);

  const handleCallStart = React.useCallback(
    (videos: VideoWindowProps[]) => {
      setVideos(prevVideos => {
        const mergedVideos = [...prevVideos];

        videos.forEach(newVideo => {
          const existingIndex = mergedVideos.findIndex(v => v.id === newVideo.id);
          if (existingIndex >= 0) {
            mergedVideos[existingIndex] = newVideo;
          } else {
            mergedVideos.push(newVideo);
          }
        });

        return mergedVideos;
      });

      setIsInCall(true);
      setIsShowingPreview(false); // 结束预览模式, 由等待接听页面进入通话页面
      setCallStatus('connected');
      setLocalVideo(null); // 清除预览时的localVideo状态
      setInvitation(null); // 清除邀请信息

      // 同步 CallService 的初始状态
      if (hasInitialized && callServiceRef.current) {
        setRealCallMuted(callServiceRef.current.isMuted());
        setRealCallCameraEnabled(callServiceRef.current.isCameraEnabled());
        // 🔧 确保扬声器状态始终为开启，避免被叫接听时状态异常
        setRealCallSpeakerEnabled(true);
      }

      onCallStartRef.current?.(videos);
    },
    [hasInitialized],
  );

  const handleCallEnd = React.useCallback(
    (reason: string, callInfo: CallInfo) => {
      const currentIsMinimized = isMinimizedRef.current;
      clearAllInvitationTimers();

      if (currentIsMinimized) {
        setIsMinimized(false);
        restoreToNormalSize();
        onMinimizedChange?.(false);
      }

      // 🔧 立即清理所有状态，停止视频播放尝试
      setVideos([]);
      setIsInCall(false);
      setCallStatus('idle');
      setIsShowingPreview(false);
      setLocalVideo(null);
      setInvitation(null);
      setCallMode('video'); // 重置为初始模式
      setCallerTargetInfo(null); // 清理主叫目标信息

      // 重置真实通话状态到初始值
      setRealCallMuted(false);
      setRealCallCameraEnabled(true);
      setRealCallSpeakerEnabled(true);

      if (managedPosition) {
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
          element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
        }
      }

      // 🔧 重置群组通话相关状态到初始值
      setIsInitiatingGroupCall(false);
      setGroupCallType('video');
      setGroupId('');
      setSelectedNewMembers([]);
      setWebimGroupMembers([]);
      setIsLoadingGroupMembers(false);
      setIsUserSelectVisible(false);

      try {
        const videoElements = document.querySelectorAll('video[data-video-id]');
        videoElements.forEach((video: any) => {
          if (video.srcObject) {
            video.srcObject = null;
          }
          video.dataset.playingTrackId = '';
          video.dataset.trackPlayed = '';
        });
      } catch (error) {
        logger.warn('Failed to cleanup video elements:', error);
      }

      onEndCallWithReasonRef.current?.(reason, callInfo);
    },
    [
      clearAllInvitationTimers,
      onEndCallWithReasonRef,
      onMinimizedChange,
      managedPosition,
      initialSize,
      initialPosition,
    ],
  );
  const handleInvitationReceived = React.useCallback((invitation: any) => {
    setInvitation(invitation);
    setCallStatus('ringing');
    setIsMinimized(false);
  }, []);

  const handleUserPublished = React.useCallback(
    (userId: string) => {
      if (userId) {
        handleUserJoined(userId);
      }

      if (callStatus === 'calling' || callStatus === 'idle') {
        setCallStatus('connected');
      }
    },
    [handleUserJoined],
  );

  // 使用 ref 存储最新的状态，避免回调函数重新创建
  const isShowingPreviewRef = useRef(isShowingPreview);
  const isInCallRef = useRef(isInCall);
  const callModeRef = useRef(callMode);
  const isMinimizedRef = useRef(isMinimized);

  // 更新状态引用
  React.useEffect(() => {
    isShowingPreviewRef.current = isShowingPreview;
    isInCallRef.current = isInCall;
    callModeRef.current = callMode;
    isMinimizedRef.current = isMinimized;
  }, [isShowingPreview, isInCall, callMode, isMinimized]);

  const fetchGroupMembers = React.useCallback(
    async (groupId: string, context: string = 'General') => {
      if (!groupId || !chatClient) {
        return [];
      }

      try {
        const allMemberUserIds: string[] = [];
        let pageNum = 1;
        const pageSize = 50;
        let hasMoreData = true;

        while (hasMoreData) {
          try {
            const response = await chatClient.listGroupMembers({
              groupId: groupId,
              pageNum: pageNum,
              pageSize: pageSize,
            });

            if (response?.data && Array.isArray(response.data)) {
              const pageUserIds = response.data
                .map((item: any) => item.owner || item.member)
                .filter(Boolean);

              allMemberUserIds.push(...pageUserIds);

              if (response.isLast === true) {
                hasMoreData = false;
              } else if (pageUserIds.length < pageSize) {
                hasMoreData = false;
              } else {
                pageNum++;
              }
            } else {
              hasMoreData = false;
            }
          } catch (e) {
            hasMoreData = false;
          }
        }

        if (allMemberUserIds.length > 0) {
          const memberUserIds = allMemberUserIds;

          try {
            if (!userInfoProvider) {
              throw new Error('userInfoProvider not available, using fallback');
            }
            const membersWithInfo = await Promise.resolve(userInfoProvider(memberUserIds));
            if (!Array.isArray(membersWithInfo)) {
              return [];
            }

            const formattedMembers = membersWithInfo
              .map((userInfo: any) => ({
                userId: userInfo.userId,
                nickname: userInfo.nickname || userInfo.userId,
                avatarUrl: userInfo.avatarUrl,
              }))
              .filter(member => member.userId);

            if (callServiceRef.current && formattedMembers.length > 0) {
              const userInfoMap: { [key: string]: any } = {};
              formattedMembers.forEach((member: any) => {
                userInfoMap[member.userId] = {
                  nickname: member.nickname,
                  avatarUrl: member.avatarUrl,
                };
              });
              callServiceRef.current.setUserInfo(userInfoMap);
            }

            return formattedMembers;
          } catch (error) {
            const basicMembers = memberUserIds.map((userId: string) => ({
              userId,
              nickname: userId,
              avatarUrl: undefined,
            }));

            if (callServiceRef.current && basicMembers.length > 0) {
              const userInfoMap: { [key: string]: any } = {};
              basicMembers.forEach((member: any) => {
                userInfoMap[member.userId] = {
                  nickname: member.nickname,
                  avatarUrl: member.avatarUrl,
                };
              });
              callServiceRef.current.setUserInfo(userInfoMap);
            }

            return basicMembers;
          }
        } else {
          return [];
        }
      } catch (error) {
        logger.error(`Failed to fetch group members:`, error);
        return [];
      }
    },
    [chatClient, userInfoProvider],
  );

  const handleRemoteVideoReady = React.useCallback((videoInfo: VideoWindowProps) => {
    if (videoInfo.isLocalVideo) {
      const currentIsShowingPreview = isShowingPreviewRef.current;
      const currentIsInCall = isInCallRef.current;
      const currentCallMode = callModeRef.current;

      if (videoInfo.id === 'local-preview') {
        setLocalVideo(videoInfo);
      } else if (currentCallMode === 'group') {
        setVideos(prevVideos => {
          const existingIndex = prevVideos.findIndex(v => v.isLocalVideo);
          if (existingIndex >= 0) {
            const newVideos = [...prevVideos];
            newVideos[existingIndex] = videoInfo;
            return newVideos;
          } else {
            return [...prevVideos, videoInfo];
          }
        });
      } else if (currentIsShowingPreview && videoInfo.id !== 'local-preview') {
        setLocalVideo(videoInfo);
      } else if (currentIsInCall) {
        setVideos(prevVideos => {
          const existingIndex = prevVideos.findIndex(v => v.isLocalVideo);
          if (existingIndex >= 0) {
            const newVideos = [...prevVideos];
            newVideos[existingIndex] = videoInfo;
            return newVideos;
          } else {
            return [...prevVideos, videoInfo];
          }
        });
      }
    } else {
      const currentCallMode = callModeRef.current;
      const currentIsInCall = isInCallRef.current;
      const is1v1VideoCall = currentCallMode === 'video' && currentIsInCall;

      if (is1v1VideoCall) {
        const existingVideo = videos.find(v => v.id === videoInfo.id);
        if (existingVideo) {
          const isOnlyAudioChange =
            existingVideo.cameraEnabled === videoInfo.cameraEnabled &&
            existingVideo.isWaiting === videoInfo.isWaiting &&
            !videoInfo.removed;

          if (isOnlyAudioChange) {
            return;
          }
        }
      }

      setVideos(prevVideos => {
        const existingIndex = prevVideos.findIndex(v => v.id === videoInfo.id);

        if (videoInfo.removed) {
          if (existingIndex >= 0) {
            return prevVideos.filter(v => v.id !== videoInfo.id);
          } else {
            return prevVideos;
          }
        }

        if (existingIndex >= 0) {
          const newVideos = [...prevVideos];
          newVideos[existingIndex] = videoInfo;
          return newVideos;
        } else {
          return [...prevVideos, videoInfo];
        }
      });
    }
  }, []);

  const handleTalkingUsersChange = React.useCallback((talkingUsers: string[]) => {
    setTalkingUsers(talkingUsers);
  }, []);

  const [networkQuality, setNetworkQuality] = React.useState<any>(null);

  const handleNetworkQualityChange = React.useCallback((networkQuality: any) => {
    setNetworkQuality((prev: any) => {
      const newNetworkQuality = { ...prev, ...networkQuality };
      if (newNetworkQuality.uplinkNetworkQuality === 0) {
        newNetworkQuality.uplinkNetworkQuality = prev.uplinkNetworkQuality;
      }
      if (newNetworkQuality.downlinkNetworkQuality === 0) {
        newNetworkQuality.downlinkNetworkQuality = prev.downlinkNetworkQuality;
      }
      return newNetworkQuality;
    });
  }, []);

  React.useEffect(() => {
    if (chatClient) {
      if (callServiceRef.current) {
        callServiceRef.current.destroy();
        callServiceRef.current = null;
      }

      // 创建统一的用户信息提供器函数，确保总是返回 Promise
      const createUserInfoProvider = () => {
        if (!userInfoProvider) return undefined;

        return async (userIds: string[]) => {
          const result = await Promise.resolve(userInfoProvider(userIds));
          return result;
        };
      };

      // 创建统一的群组信息提供器函数，确保总是返回 Promise
      const createGroupInfoProvider = () => {
        if (!groupInfoProvider) return undefined;

        return async (groupIds: string[]) => {
          const result = await Promise.resolve(groupInfoProvider(groupIds));
          return result;
        };
      };

      const config: CallServiceConfig = {
        connection: chatClient,
        onCallStart: handleCallStart,
        onCallEnd: handleCallEnd,
        onInvitationReceived: handleInvitationReceived,

        onUserPublished: handleUserPublished,
        // onUserLeft: handleUserLeft,
        // onUserUnpublished: handleUserUnpublished,
        onRemoteVideoReady: handleRemoteVideoReady,
        onTalkingUsersChange: handleTalkingUsersChange, // 说话用户变化回调
        onInvitedUserRemoved: handleInvitedUserRemoved, // 🔧 新增：邀请用户被移除回调
        userInfoProvider: createUserInfoProvider(),
        // 群组信息提供器
        groupInfoProvider: createGroupInfoProvider(),
        // 音量指示器配置
        speakingVolumeThreshold: speakingVolumeThreshold,
        onNetworkQualityChange: handleNetworkQualityChange,
        // 铃声相关配置
        outgoingRingtoneSrc,
        incomingRingtoneSrc,
        enableRingtone,
        ringtoneVolume,
        ringtoneLoop,
        onRingtoneStart,
        onRingtoneEnd,
        onCallError,
        onReceivedCall,
        onRemoteUserJoined,
        onRemoteUserLeft,
        onRtcEngineCreated,
        encoderConfig,
        // RTC Token 配置
        useRTCToken,
      };

      callServiceRef.current = new CallService(config);

      (window as any).callService = callServiceRef.current;

      if (chatClient?.user) {
        getLocalUserAvatar().then(avatarUrl => {
          const localUserInfo = {
            [chatClient.user]: {
              nickname: t('callkit.localUser.me') as string,
              avatarUrl: avatarUrl,
            },
          };
          if (callServiceRef.current) {
            callServiceRef.current.setUserInfo(localUserInfo);
          }
        });
      }

      setHasInitialized(true);
      return () => {
        (window as any).callService = null;
        callServiceRef.current?.destroy(true);
      };
    }
  }, [
    hasInitialized,
    chatClient,
    handleCallStart,
    handleInvitationReceived,

    handleUserPublished,
    // handleUserLeft,
    // handleUserUnpublished,
    handleRemoteVideoReady,
    handleTalkingUsersChange,
    handleInvitedUserRemoved, // 🔧 新增：邀请用户被移除回调依赖
    // userInfo, // If userInfo is a prop, uncomment and pass it.
  ]);

  const [ext, setExt] = useState<Record<string, any>>({});
  useImperativeHandle(
    ref,
    () => ({
      showInvitation: (invitationInfo: InvitationInfo) => {
        setInvitation(invitationInfo);
        if (callStatus !== 'calling') {
          setCallStatus('ringing');
        }

        const currentCallMode = invitationInfo.type === 'group' ? 'group' : invitationInfo.type;
        setCallMode(currentCallMode);

        if (invitationInfo.type === 'group') {
          setIsShowingPreview(true);
          setLocalVideo({
            id: 'local-preview',
            isLocalVideo: true,
            nickname: t('callkit.localUser.me') as string,
            muted: false,
            cameraEnabled: true,
            stream: undefined,
          });
        } else if (invitationInfo.type === 'video') {
          setIsShowingPreview(true);
        }
      },
      hideInvitation: () => {
        setInvitation(null);
        setCallStatus('idle');
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video');

        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        if (managedPosition) {
          setInternalSize(initialSize);
          setInternalPosition(initialPosition);

          const element = internalRef.current;
          if (element) {
            element.style.width = `${initialSize.width}px`;
            element.style.height = `${initialSize.height}px`;
            element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
            element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
          }
        }

        setIsInitiatingGroupCall(false);
        setGroupCallType('video');
        setGroupId('');
        setSelectedNewMembers([]);
        setWebimGroupMembers([]);
        setIsLoadingGroupMembers(false);
        setIsUserSelectVisible(false);
      },
      startCall: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
        setIsInCall(true);
        setCallStatus('connected');
        setIsShowingPreview(false);
        setLocalVideo(null);
        if (invitation) {
          setCallMode(invitation.type === 'audio' ? 'audio' : invitation.type);
        }
        setInvitation(null);
        onCallStartRef.current?.(callVideos);
      },
      endCall: () => {
        setVideos([]);
        setIsInCall(false);
        setCallStatus('idle');
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video');

        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        if (managedPosition) {
          setInternalSize(initialSize);
          setInternalPosition(initialPosition);

          const element = internalRef.current;
          if (element) {
            element.style.width = `${initialSize.width}px`;
            element.style.height = `${initialSize.height}px`;
            element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
            element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
          }
        }

        setIsInitiatingGroupCall(false);
        setGroupCallType('video');
        setGroupId('');
        setSelectedNewMembers([]);
        setWebimGroupMembers([]);
        setIsLoadingGroupMembers(false);
        setIsUserSelectVisible(false);
      },
      updateVideos: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
      },
      getCurrentInvitation: () => invitation,
      getCallStatus: () => callStatus,
      showPreview: (callModeToSet?: 'video' | 'audio' | 'group') => {
        setIsShowingPreview(true);
        if (callModeToSet) {
          setCallMode(callModeToSet);
        }
      },
      startGroupCall: async (options: {
        groupId: string;
        msg: string;
        ext?: Record<string, any>;
      }): Promise<ChatSDK.TextMsgBody | null> => {
        if (isInCall || callStatus !== 'idle') {
          onCallError?.(
            CallError.create(CallErrorCode.CALL_STATE_ERROR, 'is in call', {
              currentStatus: callStatus,
              isInCall,
            }),
          );
          return null;
        }

        const { groupId, ext } = options;
        const callType = 'video';
        if (!groupId) {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'groupId is required'));
          return null;
        }

        groupCallInviteMsg = options.msg;

        return new Promise<ChatSDK.TextMsgBody | null>((resolve, reject) => {
          groupCallPromiseRef.current = { resolve, reject };

          setIsInitiatingGroupCall(true);
          setGroupCallType(callType);
          setCallMode('group');
          setSelectedNewMembers([]);
          setGroupId(groupId);
          setExt(ext || {});

          const currentWebimConnection = chatClient;

          (async () => {
            try {
              if (currentWebimConnection) {
                setIsLoadingGroupMembers(true);

                const formattedMembers = await fetchGroupMembers(groupId, 'startGroupCall');
                setWebimGroupMembers(formattedMembers);
                setIsLoadingGroupMembers(false);
              } else {
                setWebimGroupMembers([]);
              }

              setIsUserSelectVisible(true);
            } catch (error) {
              logger.error('startGroupCall async operation failed:', error);
              setIsUserSelectVisible(true);
            }
          })();
        });
      },

      startSingleCall: async (options: {
        to: string;
        callType: 'video' | 'audio';
        msg: string;
        ext?: Record<string, any>;
      }) => {
        if (isInCall || callStatus !== 'idle') {
          onCallError?.(
            CallError.create(CallErrorCode.CALL_STATE_ERROR, 'is in call', {
              currentStatus: callStatus,
              isInCall,
            }),
          );
          return null;
        }

        if (callServiceRef.current && chatClient) {
          const currentCallMode = options.callType;
          setCallMode(currentCallMode);

          let targetUserNickname = options.to;
          let targetUserAvatar: string | undefined;

          if (userInfoProvider) {
            try {
              const userInfos = await Promise.resolve(userInfoProvider([options.to]));
              const userInfo = userInfos.find(user => user.userId === options.to);
              if (userInfo) {
                targetUserNickname = userInfo.nickname || targetUserNickname;
                targetUserAvatar = userInfo.avatarUrl;
              }
            } catch (error) {
              logger.warn('Failed to get user info:', error);
            }
          }

          if (callServiceRef.current) {
            const targetUserInfo = {
              [options.to]: {
                nickname: targetUserNickname,
                avatarUrl: targetUserAvatar,
              },
            };
            callServiceRef.current.setUserInfo(targetUserInfo);
          }

          setCallerTargetInfo({
            targetUserId: options.to,
            targetUserNickname,
            targetUserAvatar,
          });

          setIsShowingPreview(true);

          setCallStatus('calling');

          if (options.callType === 'video') {
            setLocalVideo({
              id: 'local-preview',
              isLocalVideo: true,
              nickname: t('callkit.localUser.me') as string,
              muted: false,
              cameraEnabled: true,
              stream: undefined,
            });
          }

          const callId = generateRandomChannel(10);
          const channel = generateRandomChannel(8);

          const callTypeEnum =
            options.callType === 'video' ? CALL_TYPE.VIDEO_1V1 : CALL_TYPE.AUDIO_1V1;

          const msg = await callServiceRef.current.startCall({
            msg: options.msg,
            callId,
            channel,
            chatType: 'singleChat',
            callType: callTypeEnum,
            to: options.to,
            ext: options.ext,
          });
          return msg as ChatSDK.TextMsgBody;
        } else {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'chatClient is required'));
          return null;
        }
      },
      answerCall: async (result: boolean) => {
        if (typeof result !== 'boolean') {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'result is required'));
          return;
        }

        if (result === true && isMinimizedRef.current) {
          setIsMinimized(false);
          restoreToNormalSize();
        }

        if (callServiceRef.current && invitation) {
          if (invitation.type === 'video' || invitation.type === 'audio') {
            const callerUserId = invitation.callerUserId;
            const callerNickname = invitation.callerName || callerUserId;
            const callerAvatar = invitation.callerAvatar;

            const callerUserInfo = {
              [callerUserId || '']: {
                nickname: callerNickname,
                avatarUrl: callerAvatar,
              },
            };
            callServiceRef.current.setUserInfo(callerUserInfo);

            setCallerTargetInfo({
              targetUserId: callerUserId,
              targetUserNickname: callerNickname,
              targetUserAvatar: callerAvatar,
            });
          }

          if (result && invitation?.type === 'group') {
            let groupId: string | undefined;
            if (invitation?.groupId) {
              groupId = invitation.groupId;
            } else {
              const callInfo = callServiceRef.current.getCurrentCallInfo();
              groupId = callInfo?.groupId;
            }

            if (groupId && chatClient && userInfoProvider) {
              try {
                await fetchGroupMembers(groupId, 'Accept invitation');
              } catch (error) {
                logger.warn('Failed to get group members when accepting invitation:', error);
              }
            }
          }

          callServiceRef.current.answerCall(result);
        }
      },

      exitCall: (reason?: string) => {
        if (callServiceRef.current) {
          callServiceRef.current.hangup(reason);
        }
      },

      setUserInfo: (userInfo: { [key: string]: any }) => {
        if (callServiceRef.current) {
          callServiceRef.current.setUserInfo(userInfo);
        }
      },

      toggleMute: async () => {
        if (callServiceRef.current) {
          return await callServiceRef.current.toggleMute();
        }
        return false;
      },

      toggleCamera: async () => {
        if (callServiceRef.current) {
          return await callServiceRef.current.toggleCamera();
        }
        return false;
      },
      isMuted: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.isMuted();
        }
        return false;
      },
      isCameraEnabled: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.isCameraEnabled();
        }
        return false;
      },
      getJoinedMembers: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.getJoinedMembers();
        }
        return [];
      },
      refreshLocalVideoStatus: () => {
        if (callServiceRef.current) {
          callServiceRef.current.refreshLocalVideoStatus();
        }
      },
      playLocalVideoManually: () => {
        if (callServiceRef.current) {
          callServiceRef.current.playLocalVideoManually();
        }
      },
      createLocalVideoTrackForGroupCall: async () => {
        if (callServiceRef.current) {
          return await callServiceRef.current.createLocalVideoTrackForGroupCall();
        }
        return false;
      },
      createLocalVideoTrackFor1v1Preview: async () => {
        if (callServiceRef.current) {
          return await callServiceRef.current.createLocalVideoTrackFor1v1Preview();
        }
        return false;
      },

      addParticipants: async (newMembers: string[]) => {
        if (!Array.isArray(newMembers)) {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'newMembers is required'));
          return false;
        }

        if (callServiceRef.current) {
          return await callServiceRef.current.addParticipants(newMembers);
        }
        return false;
      },

      adjustSize: (newSize: { width: number; height: number }) => {
        if (internalRef.current) {
          const element = internalRef.current;

          element.style.transition = 'width 0.3s ease-out, height 0.3s ease-out';

          element.style.width = `${newSize.width}px`;
          element.style.height = `${newSize.height}px`;

          const left = Math.max(0, (window.innerWidth - newSize.width) / 2);
          const top = Math.max(0, window.scrollY + (window.innerHeight - newSize.height) / 2);
          element.style.left = `${isMobile ? 0 : left}px`;
          element.style.top = `${isMobile ? 0 : top}px`;

          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              setInternalSize(newSize);
              setInternalPosition({ left: isMobile ? 0 : left, top: isMobile ? 0 : top });
            }
          }, 300);
        }
      },
    }),
    [
      invitation,
      isInCall,
      callStatus,
      chatClient,
      userInfoProvider,
      groupInfoProvider,
      hasInitialized,
    ],
  );

  const invitationNotificationKey = React.useMemo(() => 'callkit-invitation', []);

  const onInvitationAcceptRef = useRef(onInvitationAccept);
  const onInvitationRejectRef = useRef(onInvitationReject);
  const onCallStartRef = useRef(onCallStart);

  const notificationApiRef = useRef(notificationApi);

  React.useEffect(() => {
    onInvitationAcceptRef.current = onInvitationAccept;
    onInvitationRejectRef.current = onInvitationReject;
    onCallStartRef.current = onCallStart;
    onEndCallWithReasonRef.current = onEndCallWithReason;
    notificationApiRef.current = notificationApi;
  }, [onInvitationAccept, onInvitationReject, onCallStart, onEndCallWithReason, notificationApi]);

  React.useEffect(() => {
    if (invitation) {
      const handleAccept = async (invitationData: any) => {
        notificationApiRef.current.destroy(invitationNotificationKey);

        // 根据邀请类型设置正确的通话模式
        const currentCallMode = invitationData.type === 'group' ? 'group' : invitationData.type;
        setCallMode(currentCallMode);

        if (currentCallMode === 'group' && invitationData.groupId) {
          if (chatClient && userInfoProvider) {
            try {
              await fetchGroupMembers(invitationData.groupId, 'Direct accept');
            } catch (error) {
              logger.warn('Failed to get group members when directly accepting:', error);
            }
          }
        }

        if (currentCallMode === 'group' && hasInitialized && callServiceRef.current) {
          try {
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } catch (error) {
            logger.error('Failed to create local video track for group call:', error);
          }
        }

        if (currentCallMode === 'video' && hasInitialized && callServiceRef.current) {
          try {
            await callServiceRef.current.createLocalVideoTrackFor1v1Preview();
          } catch (error) {
            logger.error('Failed to create preview video track for 1v1 call:', error);
          }
        }

        if (hasInitialized && callServiceRef.current) {
          try {
            await callServiceRef.current.answerCall(true);
          } catch (error) {
            logger.error('Auto answer call failed:', error);
          }
        }

        setCallStatus('connected');
        setIsInCall(true);
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);

        onInvitationAcceptRef.current?.(invitationData);
      };

      const handleReject = async (invitationData: any) => {
        notificationApiRef.current.destroy(invitationNotificationKey);

        if (hasInitialized && callServiceRef.current) {
          try {
            await callServiceRef.current.answerCall(false);
          } catch (error) {
            logger.error('Auto reject call failed:', error);
          }
        }

        setCallStatus('idle');
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video');

        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        onInvitationRejectRef.current?.(invitationData);
      };

      const handleNotificationClick = async () => {
        notificationApiRef.current.destroy(invitationNotificationKey);
        setIsShowingPreview(true);

        const currentCallMode = invitation.type === 'group' ? 'group' : invitation.type;
        setCallMode(currentCallMode);

        if (currentCallMode === 'group' && invitation.groupId) {
          if (chatClient && userInfoProvider) {
            try {
              await fetchGroupMembers(invitation.groupId, 'Preview interface');
            } catch (error) {
              console.warn('Failed to get group members in preview:', error);
            }
          }
        }

        if (hasInitialized && callServiceRef.current) {
          if (currentCallMode === 'group') {
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } else if (currentCallMode === 'video') {
            await callServiceRef.current.createLocalVideoTrackFor1v1Preview();
          }
        }
      };

      notificationApiRef.current.open({
        key: invitationNotificationKey,
        message: '',
        description: invitationCustomContent || (
          <div onClick={handleNotificationClick}>
            <InvitationContent
              invitation={invitation}
              onAccept={handleAccept}
              onReject={handleReject}
              acceptText={acceptText}
              rejectText={rejectText}
              showAvatar={showInvitationAvatar}
              showTimer={showInvitationTimer}
              autoRejectTime={autoRejectTime}
              // 🔧 新增：传递自定义图标配置
              customIcons={customIcons?.controls}
            />
          </div>
        ),
        closable: false,
        duration: 0,
        icon: null,
        style: {
          background: '#2F3437',
          cursor: 'pointer',
        },
      });
    } else {
      // 隐藏邀请通知
      notificationApiRef.current.destroy(invitationNotificationKey);
    }
  }, [
    invitation,
    invitationCustomContent,
    acceptText,
    rejectText,
    showInvitationAvatar,
    showInvitationTimer,
    autoRejectTime,
    invitationNotificationKey,
  ]);

  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { containerSize, containerRef } = useContainerSize();

  const { isFullscreen, toggleFullscreen } = useFullscreen(
    managedPosition ? internalRef : containerRef,
  );

  const actualContainerSize = useMemo(() => {
    if (isFullscreen) {
      return {
        width: windowSize.width,
        height: windowSize.height,
      };
    }

    if (managedPosition) {
      const currentSize = isMinimized ? minimizedSize : internalSize;
      return {
        width: currentSize.width,
        height: currentSize.height,
      };
    } else {
      return containerSize;
    }
  }, [
    managedPosition,
    internalSize,
    containerSize,
    isMinimized,
    minimizedSize,
    isFullscreen,
    windowSize,
  ]);

  const actualLayoutMode = useMemo(() => {
    if (isMinimized) {
      return LayoutMode.MINIMIZED;
    }

    if (isShowingPreview) {
      if (callMode === 'group') {
        return LayoutMode.MULTI_PARTY;
      } else {
        return LayoutMode.PREVIEW;
      }
    }

    if (isInCall) {
      if (callMode === 'group') {
        return LayoutMode.MULTI_PARTY;
      } else if (callMode === 'video' || callMode === 'audio') {
        return LayoutMode.ONE_TO_ONE;
      }
    }

    return layoutMode;
  }, [isMinimized, layoutMode, callMode, isShowingPreview, isInCall, videos.length]);

  const handleInternalResize = React.useCallback(
    (width: number, height: number, newLeft?: number, newTop?: number, direction?: string) => {
      // 更新内部状态
      setInternalSize({ width, height });

      // 同步更新位置，避免拖动过程中的视觉跳动
      if (newLeft !== undefined || newTop !== undefined) {
        const newPosition = {
          left: newLeft !== undefined ? newLeft : internalPosition.left,
          top: newTop !== undefined ? newTop : internalPosition.top,
        };

        setInternalPosition(newPosition);

        // 立即应用位置到 DOM，避免等待 React 重新渲染
        const element = internalRef.current;
        if (element) {
          if (newLeft !== undefined) {
            element.style.left = `${newPosition.left}px`;
          }
          if (newTop !== undefined) {
            element.style.top = `${newPosition.top}px`;
          }
        }
      }

      // 如果用户提供了自定义回调，也调用它
      onResize?.(width, height, newLeft, newTop, direction);
    },
    [internalPosition.left, internalPosition.top, onResize],
  );

  const handleInternalDrag = React.useCallback(
    (newPosition: { x: number; y: number }, delta: { x: number; y: number }) => {
      // 更新内部位置状态
      setInternalPosition({ left: newPosition.x, top: newPosition.y });

      // 立即应用位置到 DOM，避免等待 React 重新渲染
      const element = internalRef.current;
      if (element) {
        element.style.left = `${newPosition.x}px`;
        element.style.top = `${newPosition.y}px`;
      }

      // 如果用户提供了自定义回调，也调用它
      onDrag?.(newPosition, delta);
    },
    [onDrag],
  );

  const { state: resizableState } = useResizable({
    enabled: resizable && !isFullscreen && !isMinimized, // 全屏和最小化时禁用调整大小
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    onResize: managedPosition ? handleInternalResize : onResize,
    containerRef: managedPosition ? internalRef : containerRef,
  });

  const { isDragging, justFinishedDrag } = useDraggable({
    enabled: draggable && !isFullscreen, // 全屏时禁用拖动，最小化时仍可拖动
    resizableEnabled: resizable && !isFullscreen && !isMinimized, // 传递调整大小功能的启用状态
    onDragStart,
    onDrag: managedPosition ? handleInternalDrag : onDrag,
    onDragEnd,
    containerRef: managedPosition ? internalRef : containerRef,
    dragHandle, // 可以指定拖动手柄区域
    getCurrentPosition: managedPosition
      ? () => ({ left: internalPosition.left, top: internalPosition.top })
      : undefined,
  });

  const displayVideos = React.useMemo(() => {
    const result = maxVideos ? videos.slice(0, maxVideos) : videos;
    return result;
  }, [videos, maxVideos]);

  const containerStyle = React.useMemo(() => {
    if (managedPosition) {
      return {
        position: 'fixed' as const,
        left: isMobile ? 0 : internalPosition.left,
        top: isMobile ? 0 : internalPosition.top,
        width: internalSize.width,
        height: internalSize.height,
        padding: isMobile ? 0 : undefined,
        ...style,
      };
    } else {
      return style;
    }
  }, [managedPosition, internalPosition, internalSize, style, isMobile]);

  const containerClass = React.useMemo(
    () =>
      classNames(
        prefixCls,
        `${prefixCls}-${actualLayoutMode}`,
        {
          [`${prefixCls}-fullscreen`]: isFullscreen,
          [`${prefixCls}-resizable`]: resizable,
          [`${prefixCls}-resizing`]: resizableState.isResizing,
          [`${prefixCls}-draggable`]: draggable,
          [`${prefixCls}-dragging`]: isDragging,
        },
        className,
      ),
    [
      prefixCls,
      actualLayoutMode,
      isFullscreen,
      resizable,
      resizableState.isResizing,
      draggable,
      isDragging,
      className,
    ],
  );

  const containerDataAttributes = React.useMemo(() => {
    const isOneToOneVideo = callMode === 'video' && isMinimized;
    return {
      'data-video-mode': isOneToOneVideo ? 'one-to-one' : undefined,
    };
  }, [callMode, isMinimized]);

  const actualMinimizedSize = React.useMemo(() => {
    const isOneToOneVideo = callMode === 'video';
    return isOneToOneVideo ? { width: 200, height: 150 } : minimizedSize;
  }, [callMode, minimizedSize]);

  const restoreToNormalSize = React.useCallback(() => {
    if (managedPosition) {
      const element = internalRef.current;
      if (element) {
        const currentCenterX = internalPosition.left + actualMinimizedSize.width / 2;
        const currentCenterY = internalPosition.top + actualMinimizedSize.height / 2;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const targetCenterX = windowWidth / 2;
        const targetCenterY = windowHeight / 2;

        const finalX = targetCenterX - initialSize.width / 2;
        const finalY = targetCenterY - initialSize.height / 2;

        const margin = 20;
        const safeTargetX = Math.max(
          margin,
          Math.min(finalX, windowWidth - initialSize.width - margin),
        );
        const safeTargetY = Math.max(
          margin,
          Math.min(finalY, windowHeight - initialSize.height - margin),
        );

        element.style.transition =
          'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
        element.style.transformOrigin = 'center center';

        element.style.left = `${safeTargetX}px`;
        element.style.top = `${safeTargetY}px`;
        element.style.width = `${initialSize.width}px`;
        element.style.height = `${initialSize.height}px`;

        setTimeout(() => {
          if (element) {
            element.style.transition = '';
            element.style.transformOrigin = '';

            setInternalPosition({
              left: safeTargetX,
              top: safeTargetY,
            });
            setInternalSize(initialSize);

            if (hasInitialized && callServiceRef.current) {
              callServiceRef.current.onRestoreFromMinimized();
            }
          }
        }, 300);
      }
    }
  }, [managedPosition, internalPosition, actualMinimizedSize, initialSize, hasInitialized]);

  const handleMinimizedToggle = (event: React.MouseEvent) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const newMinimizedState = !isMinimized;

    if (newMinimizedState && isFullscreen) {
      toggleFullscreen(event);
    }

    setIsMinimized(newMinimizedState);
    if (managedPosition) {
      if (newMinimizedState) {
        const element = internalRef.current;
        if (element) {
          const currentWidth = internalSize.width;
          const currentHeight = internalSize.height;

          const currentCenterX = internalPosition.left + currentWidth / 2;
          const currentCenterY = internalPosition.top + currentHeight / 2;

          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          const isCloserToLeft = currentCenterX < windowWidth / 2;

          const margin = 20;
          const targetX = isCloserToLeft
            ? margin
            : windowWidth - actualMinimizedSize.width - margin;

          const safeTargetX = Math.max(
            margin,
            Math.min(targetX, windowWidth - actualMinimizedSize.width - margin),
          );

          const safeTargetY = Math.max(
            margin,
            Math.min(internalPosition.top, windowHeight - actualMinimizedSize.height - margin),
          );

          const targetCenterX = safeTargetX + actualMinimizedSize.width;
          const targetCenterY = safeTargetY + actualMinimizedSize.height / 2;

          const finalX = targetCenterX - actualMinimizedSize.width;
          const finalY = targetCenterY - actualMinimizedSize.height / 2;

          element.style.transition =
            'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
          element.style.transformOrigin = 'center center';

          element.style.left = `${finalX}px`;
          element.style.top = `${finalY}px`;
          element.style.width = `${actualMinimizedSize.width}px`;
          element.style.height = `${actualMinimizedSize.height}px`;

          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              element.style.transformOrigin = '';

              setInternalPosition({
                left: finalX,
                top: finalY,
              });
              setInternalSize(actualMinimizedSize);
            }
          }, 300);
        }
      } else {
        const element = internalRef.current;
        if (element) {
          const currentCenterX = internalPosition.left + actualMinimizedSize.width / 2;
          const currentCenterY = internalPosition.top + actualMinimizedSize.height / 2;

          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          const targetCenterX = windowWidth / 2;
          const targetCenterY = windowHeight / 2;

          const finalX = targetCenterX - initialSize.width / 2;
          const finalY = targetCenterY - initialSize.height / 2;

          const margin = 20;
          const safeTargetX = Math.max(
            margin,
            Math.min(finalX, windowWidth - initialSize.width - margin),
          );
          const safeTargetY = Math.max(
            margin,
            Math.min(finalY, windowHeight - initialSize.height - margin),
          );

          element.style.transition =
            'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
          element.style.transformOrigin = 'center center';

          element.style.left = `${isMobile ? 0 : safeTargetX}px`;
          element.style.top = `${isMobile ? 0 : safeTargetY}px`;
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;

          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              element.style.transformOrigin = '';

              setInternalPosition({
                left: isMobile ? 0 : safeTargetX,
                top: isMobile ? 0 : safeTargetY,
              });
              setInternalSize(initialSize);

              if (hasInitialized && callServiceRef.current) {
                callServiceRef.current.onRestoreFromMinimized();
              }
            }
          }, 300);
        }
      }
    }

    onMinimizedChange?.(newMinimizedState);
  };

  const handleMinimizedClick = (event?: React.MouseEvent | undefined) => {
    if (isDragging || justFinishedDrag) {
      return;
    }

    if (isMinimized) {
      handleMinimizedToggle(event as React.MouseEvent);
    }
  };

  const renderVideoWindow = React.useCallback(
    (video: VideoWindowProps, index: number, windowSize?: { width: number; height: number }) => {
      if (!isInCall && callStatus === 'idle') {
        return (
          <div
            key={video.id}
            className={`${prefixCls}-window`}
            style={{ width: '100%', height: '100%', background: '#000' }}
          >
            <div>Call ended</div>
          </div>
        );
      }

      const videoClass = classNames(`${prefixCls}-window`, {
        [`${prefixCls}-window-local`]: video.isLocalVideo,
        [`${prefixCls}-window-muted`]: video.muted,
      });

      const NICKNAME_DISPLAY_THRESHOLD = 140;
      const shouldShowNickname =
        callMode === 'group' &&
        (!windowSize ||
          (windowSize.width >= NICKNAME_DISPLAY_THRESHOLD &&
            windowSize.height >= NICKNAME_DISPLAY_THRESHOLD));

      const shouldShowIndicator = windowSize && windowSize.width >= 75;

      const normalizedCameraEnabled =
        video.cameraEnabled === null ? false : Boolean(video.cameraEnabled);
      const normalizedIsWaiting = video.isWaiting === undefined ? false : Boolean(video.isWaiting);
      const shouldShowVideo = normalizedCameraEnabled && !normalizedIsWaiting;

      return (
        <div
          key={video.id}
          className={videoClass}
          data-video-id={video.id}
          data-is-local={video.isLocalVideo}
          onClick={() => onVideoClick?.(video.id)}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <div className={`${prefixCls}-video-container`}>
            {shouldShowVideo ? (
              video.videoElement ? (
                <VideoPlayer
                  videoId={video.id}
                  isLocalVideo={Boolean(video.isLocalVideo)}
                  stream={null}
                  muted={Boolean(video.muted)}
                  prefixCls={prefixCls}
                  videoElement={video.videoElement}
                />
              ) : video.stream ? (
                <VideoPlayer
                  videoId={video.id}
                  isLocalVideo={Boolean(video.isLocalVideo)}
                  stream={video.stream}
                  muted={Boolean(video.muted)}
                  prefixCls={prefixCls}
                />
              ) : video.avatar ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={video.avatar}
                    alt={video.nickname}
                    className={`${prefixCls}-avatar`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 'inherit',
                    }}
                  />
                  {video.isWaiting && <LoadingDots overlay />}
                </div>
              ) : (
                <div
                  className={`${prefixCls}-avatar-placeholder`}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'inherit',
                    position: 'relative',
                  }}
                >
                  <Icon type="PERSON_SINGLE_FILL" width="82%" height="82%" color="#464E53" />
                  {video.isWaiting && <LoadingDots overlay />}
                </div>
              )
            ) : (
              <div className={`${prefixCls}-placeholder`}>
                {video.avatar ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={video.avatar}
                      alt={video.nickname}
                      className={`${prefixCls}-avatar`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 'inherit',
                      }}
                    />
                    {/* 等待状态显示加载动画 */}
                    {video.isWaiting && <LoadingDots overlay />}
                  </div>
                ) : (
                  <div
                    className={`${prefixCls}-avatar-placeholder`}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'inherit',
                      position: 'relative',
                    }}
                  >
                    <Icon type="PERSON_SINGLE_FILL" width="82%" height="82%" color="#464E53" />
                    {/* 等待状态显示加载动画 */}
                    {video.isWaiting && <LoadingDots overlay />}
                  </div>
                )}
              </div>
            )}

            {video.nickname && shouldShowIndicator && (
              <div className={`${prefixCls}-video-info`}>
                {shouldShowNickname && (
                  <div className={`${prefixCls}-nickname`}>{video.nickname}</div>
                )}
                {(video.muted ||
                  talkingUsers.includes(video.id.replace('remote-', '')) ||
                  talkingUsers.includes(chatClient?.user)) && (
                  <div className={`${prefixCls}-indicators`}>
                    {video.muted && <Icon type="MIC_OFF" width={14} height={14} color="#F9FAFA" />}
                    {callMode === 'group' &&
                      !video.muted &&
                      !video.isLocalVideo &&
                      (() => {
                        const userId = video.id.replace('remote-', '');
                        const isTalking = talkingUsers.includes(userId);

                        return isTalking ? (
                          <Icon type="SPEAKER_WAVE_2" width={14} height={14} color="#4CAF50" />
                        ) : null;
                      })()}
                    {callMode === 'group' &&
                      !video.muted &&
                      video.isLocalVideo &&
                      (() => {
                        const localUserId = chatClient?.user || 'local';
                        const isLocalTalking = talkingUsers.includes(localUserId);

                        return isLocalTalking ? (
                          <Icon type="SPEAKER_WAVE_2" width={14} height={14} color="#4CAF50" />
                        ) : null;
                      })()}
                  </div>
                )}
              </div>
            )}

            {callMode === 'group' &&
              shouldShowIndicator &&
              (() => {
                const currentUserId = video.isLocalVideo
                  ? chatClient?.user || 'local'
                  : video.id.replace('remote-', '');
                const userNetworkQuality = networkQuality?.[currentUserId];

                if (!userNetworkQuality) return null;

                const qualityLevel = video.isLocalVideo
                  ? userNetworkQuality.uplinkNetworkQuality
                  : userNetworkQuality.downlinkNetworkQuality;

                if (!qualityLevel || qualityLevel === 0) return null;

                return (
                  <div
                    className={`${prefixCls}-network-quality`}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 10,
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '4px',
                      padding: '4px',
                    }}
                  >
                    <NetworkQuality level={qualityLevel as 1 | 2 | 3 | 4 | 5 | 6} size="small" />
                  </div>
                );
              })()}
          </div>
        </div>
      );
    },
    [
      prefixCls,
      callMode,
      onVideoClick,
      talkingUsers,
      networkQuality,
      chatClient,
      isInCall,
      callStatus,
    ],
  );

  const handlePreviewAccept = async () => {
    if (invitation) {
      if (hasInitialized && callServiceRef.current) {
        try {
          await callServiceRef.current.answerCall(true);
        } catch (error) {
          logger.error('Preview mode auto answer failed:', error);
        }
      }

      setIsShowingPreview(false);
      setCallStatus('connected');
      setIsInCall(true);
      setLocalVideo(null);

      onInvitationAcceptRef.current?.(invitation);
    }
  };

  const handlePreviewReject = async () => {
    if (hasInitialized && callServiceRef.current && invitation) {
      try {
        await callServiceRef.current.answerCall(false);
      } catch (error) {
        logger.error('Preview mode auto reject failed:', error);
      }
    }

    setIsShowingPreview(false);
    setCallStatus('idle');
    const currentInvitation = invitation; // 保存当前邀请信息
    setInvitation(null);
    setLocalVideo(null);
    setCallMode('video'); // 重置为初始模式

    // 🔧 重置真实通话状态到初始值
    setRealCallMuted(false);
    setRealCallCameraEnabled(true);
    setRealCallSpeakerEnabled(true);

    // 🔧 新增：重置CallKit尺寸和位置到初始状态
    if (managedPosition) {
      logger.info('🔧 handlePreviewReject: 重置CallKit尺寸和位置到初始状态');
      setInternalSize(initialSize);
      setInternalPosition(initialPosition);

      const element = internalRef.current;
      if (element) {
        element.style.width = `${initialSize.width}px`;
        element.style.height = `${initialSize.height}px`;
        element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
        element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
      }
    }

    if (currentInvitation) {
      onInvitationRejectRef.current?.(currentInvitation);
    }

    setIsInitiatingGroupCall(false);
    setGroupCallType('video');
    setGroupId('');
    setSelectedNewMembers([]);
    setWebimGroupMembers([]);
    setIsLoadingGroupMembers(false);
    setIsUserSelectVisible(false);

    if (invitation) {
      onInvitationRejectRef.current?.(invitation);
    }

    if (callServiceRef.current) {
      callServiceRef.current.answerCall(false);
      callServiceRef.current.hangup('refuse');
    }
  };

  const handleAddParticipant = async (e: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (
      effectiveGroupMembers.length === 0 &&
      chatClient &&
      hasInitialized &&
      callServiceRef.current
    ) {
      try {
        const currentCallInfo = callServiceRef.current.getCurrentCallInfo();
        const targetGroupId = currentCallInfo?.groupId;

        if (targetGroupId) {
          setIsLoadingGroupMembers(true);
          const formattedMembers = await fetchGroupMembers(targetGroupId, 'Add participant');
          setWebimGroupMembers(formattedMembers);
          setIsLoadingGroupMembers(false);
        }
      } catch (error) {
        logger.error('Failed to get call info:', error);
      }
    }
    if (currentParticipants.length >= maxVideos) {
      setUserSelectDisabled(true);
    } else {
      setUserSelectDisabled(false);
    }

    setIsUserSelectVisible(true);
    setSelectedNewMembers([]);
  };

  const handleUserSelectCancel = () => {
    setIsUserSelectVisible(false);
    setUserSelectDisabled(false);
    setSelectedNewMembers([]);
    if (isInitiatingGroupCall) {
      setIsInitiatingGroupCall(false);

      setRealCallMuted(false);
      setRealCallCameraEnabled(true);
      setRealCallSpeakerEnabled(true);

      if (managedPosition) {
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
          element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
        }
      }

      setGroupCallType('video');
      setGroupId('');
      setWebimGroupMembers([]);
      setIsLoadingGroupMembers(false);

      if (groupCallPromiseRef.current) {
        groupCallPromiseRef.current = null;
      }
    }
  };

  // 选完用户后，开始发起群组通话
  const handleUserSelectConfirm = async (selectedUsers: any[]) => {
    setIsUserSelectVisible(false);

    if (isInitiatingGroupCall) {
      // 发起群组通话的情况
      if (selectedUsers.length > 0) {
        if (hasInitialized && callServiceRef.current) {
          // 真实通话：发起群组通话
          const members = selectedUsers.map(user => user.userId);

          const userInfoMap: { [key: string]: any } = {};
          selectedUsers.forEach((user: any) => {
            userInfoMap[user.userId] = {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            };
          });

          if (chatClient?.user) {
            getLocalUserAvatar().then(avatarUrl => {
              userInfoMap[chatClient.user] = {
                nickname: t('callkit.localUser.me') as string,
                avatarUrl: avatarUrl,
              };
              if (callServiceRef.current) {
                callServiceRef.current.setUserInfo(userInfoMap);
              }
            });
          }

          // 🔧 修改：群组通话选择完成员后直接开始通话，不需要预览模式
          setCallStatus('connected'); // 主叫：直接连接状态
          setCallMode('group');
          setIsShowingPreview(false); // 🔧 修改：不进入预览模式，直接开始通话
          setIsInCall(true); // 🔧 修改：直接进入通话状态
          setIsInitiatingGroupCall(false); // 🔧 重置群通话发起状态

          // 创建群组视频布局数据：发起方的视频 + 被邀请方的等待状态
          const groupVideos: VideoWindowProps[] = [
            {
              id: 'local',
              isLocalVideo: true,
              muted: false,
              cameraEnabled: false, // 🔧 修改：群通话发起方默认摄像头关闭
              nickname: t('callkit.localUser.me') as string,
              avatar: undefined, // 不使用假数据，让组件显示默认图标
            },
            // 添加选中的成员，初始状态为等待连接（显示头像）
            ...selectedUsers.map((user, index) => ({
              id: `remote-${user.userId}`, // 使用与CallService一致的ID格式
              muted: false,
              cameraEnabled: false, // 初始状态显示头像，等待连接
              nickname: user.nickname,
              avatar: user.avatarUrl, // 不使用假数据，让组件显示默认图标
              isWaiting: true, // 标记为等待状态
            })),
          ];

          setVideos(groupVideos);

          let finalGroupName = groupId;
          let finalGroupAvatar: string | undefined;
          if (groupInfoProvider) {
            try {
              const groupInfos = await Promise.resolve(groupInfoProvider([groupId]));
              const groupInfo = groupInfos.find(info => info.groupId === groupId);
              if (groupInfo?.groupName) {
                finalGroupName = groupInfo.groupName;
                finalGroupAvatar = groupInfo.groupAvatar;
              }
            } catch (error) {
              logger.warn('Failed to get group info, using default:', error);
            }
          }

          setCallerTargetInfo({
            targetGroupId: groupId,
            targetGroupName: finalGroupName,
            targetGroupAvatar: finalGroupAvatar,
          });
          try {
            const msg = await callServiceRef.current.startCall({
              callId: generateRandomChannel(10),
              channel: generateRandomChannel(8),
              chatType: 'groupChat',
              callType: groupCallType === 'video' ? 2 : 3, // VIDEO_MULTI = 2, AUDIO_MULTI = 3
              to: members, // 主要接收者
              groupId: groupId,
              groupName: finalGroupName, // 使用获取到的群组名称或默认值
              groupAvatar: finalGroupAvatar,
              members,
              msg: groupCallInviteMsg,
              ext,
            });

            // 为每个邀请的用户设置超时定时器
            const timeoutMs = autoRejectTime * 1000; // 转换为毫秒
            selectedUsers.forEach(user => {
              setInvitationTimer(user.userId, timeoutMs, handleInvitationTimeout);
            });

            // 🔧 新增：群组通话发送成功，resolve Promise
            if (groupCallPromiseRef.current) {
              groupCallPromiseRef.current.resolve(msg);
              groupCallPromiseRef.current = null;
            }
          } catch (error) {
            // 🔧 新增：群组通话发送失败，reject Promise
            if (groupCallPromiseRef.current) {
              groupCallPromiseRef.current.reject(error);
              groupCallPromiseRef.current = null;
            }
          }
        }

        // 🔧 修复：不要在这里重置 isInitiatingGroupCall，应该在实际开始通话时重置
        // setIsInitiatingGroupCall(false); // 移除过早的重置
        setSelectedNewMembers([]);
      } else {
        // 没有选择成员，重置状态
        setIsInitiatingGroupCall(false);
        setSelectedNewMembers([]);

        // 🔧 重置真实通话状态到初始值
        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        // 🔧 新增：没有选择成员，resolve null
        if (groupCallPromiseRef.current) {
          groupCallPromiseRef.current.resolve(null);
          groupCallPromiseRef.current = null;
        }
      }
    } else {
      // 通话中添加参与者的情况
      const currentParticipantIds = displayVideos.map(video => {
        // 使用与currentParticipants相同的逻辑提取userId
        if (video.isLocalVideo) {
          return chatClient?.user || 'local';
        } else if (video.id.startsWith('remote-')) {
          return video.id.replace('remote-', '');
        }
        return video.id;
      });

      const newMembers = selectedUsers.filter(user => !currentParticipantIds.includes(user.userId));

      if (newMembers.length > 0) {
        if (hasInitialized && callServiceRef.current) {
          const newUserInfoMap: { [key: string]: any } = {};
          newMembers.forEach((user: any) => {
            newUserInfoMap[user.userId] = {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            };
          });
          callServiceRef.current.setUserInfo(newUserInfoMap);

          const memberIds = newMembers.map(user => user.userId);
          callServiceRef.current.addParticipants(memberIds).then(success => {
            if (success) {
              const newVideoWindows: VideoWindowProps[] = newMembers.map(user => ({
                id: `remote-${user.userId}`,
                muted: false,
                cameraEnabled: false,
                nickname: user.nickname,
                avatar: user.avatarUrl,
                isWaiting: true,
              }));

              setVideos(prevVideos => [...prevVideos, ...newVideoWindows]);

              const timeoutMs = autoRejectTime * 1000;
              newMembers.forEach(user => {
                setInvitationTimer(user.userId, timeoutMs, handleInvitationTimeout);
              });
            } else {
              logger.error('Failed to invite new members');
            }
          });
        }
      }

      setSelectedNewMembers([]);
    }
  };

  const getUserAvatar = React.useCallback(
    async (userId: string): Promise<string | undefined> => {
      if (!userInfoProvider) {
        return undefined;
      }

      try {
        const userInfos = await Promise.resolve(userInfoProvider([userId]));
        const userInfo = userInfos.find((info: any) => info.userId === userId);
        return userInfo?.avatarUrl;
      } catch (error) {
        logger.warn(`Failed to get avatar for user ${userId}:`, error);
        return undefined;
      }
    },
    [userInfoProvider],
  );

  // 获取本地用户头像的辅助函数
  const getLocalUserAvatar = React.useCallback(async (): Promise<string | undefined> => {
    if (!chatClient?.user) {
      return undefined; // 不使用假数据，让组件显示默认图标
    }

    return await getUserAvatar(chatClient.user);
  }, [chatClient?.user, getUserAvatar]);

  // 处理用户选择变化
  const [userSelectDisabled, setUserSelectDisabled] = React.useState(false);
  const handleUserSelect = (user: any, users: any[]) => {
    if (users.length + currentParticipants.length >= maxVideos) {
      setUserSelectDisabled(true);
    } else {
      userSelectDisabled && setUserSelectDisabled(false);
    }
    setSelectedNewMembers(users);
  };

  const handleMuteToggle = React.useCallback(
    async (newMuted: boolean) => {
      if (hasInitialized && callServiceRef.current) {
        // 使用 CallService 的实际控制方法
        const actualMuted = !(await callServiceRef.current.toggleMute());
        // 更新内部状态
        setRealCallMuted(actualMuted);
        // 触发外部回调，传递实际状态
        onMuteToggle?.(actualMuted);
      } else {
        // 演示模式，直接调用外部回调
        onMuteToggle?.(newMuted);
      }
    },
    [hasInitialized, onMuteToggle],
  );

  const handleCameraToggle = React.useCallback(
    async (newCameraEnabled: boolean) => {
      if (hasInitialized && callServiceRef.current) {
        try {
          const actualCameraEnabled = await callServiceRef.current.toggleCamera();
          setRealCallCameraEnabled(actualCameraEnabled);
          onCameraToggle?.(actualCameraEnabled);
        } catch (error) {
          logger.error('Failed to toggle camera:', error);
        }
      } else {
        onCameraToggle?.(newCameraEnabled);
      }
    },
    [hasInitialized, onCameraToggle, realCallCameraEnabled],
  );

  const handleSpeakerToggle = React.useCallback(
    (newSpeakerEnabled: boolean) => {
      if (hasInitialized && callServiceRef.current) {
        // 使用 CallService 的实际扬声器控制方法
        const actualSpeakerEnabled = callServiceRef.current.toggleSpeaker();
        // 更新内部状态
        setRealCallSpeakerEnabled(actualSpeakerEnabled);
        // 触发外部回调，传递实际状态
        onSpeakerToggle?.(actualSpeakerEnabled);
      } else {
        // 演示模式，直接调用外部回调
        onSpeakerToggle?.(newSpeakerEnabled);
      }
    },
    [hasInitialized, onSpeakerToggle],
  );

  const handleCameraFlip = React.useCallback(
    async (deviceId: string) => {
      if (hasInitialized && callServiceRef.current) {
        callServiceRef.current.flipCamera(deviceId);
        const success = await callServiceRef.current?.flipCamera(deviceId);
        onCameraFlip?.(deviceId, success);
      }
    },
    [hasInitialized, onCameraFlip],
  );

  const handleScreenShareToggle = React.useCallback(
    (newScreenSharing: boolean) => {
      // 屏幕共享控制目前使用外部回调
      onScreenShareToggle?.(newScreenSharing);
    },
    [onScreenShareToggle],
  );

  const handleHangup = React.useCallback(() => {
    logger.debug('handleHangup');
    if (hasInitialized && callServiceRef.current) {
      const isInPreviewMode = isShowingPreview && callStatus === 'calling';
      callServiceRef.current.cancelGroupCall();
      callServiceRef.current.hangup('hangup', isInPreviewMode);
      callServiceRef.current.sendHangupMessage();

      setVideos([]);
      setIsInCall(false);
      setCallStatus('idle');
      setIsShowingPreview(false);
      setLocalVideo(null);
      setInvitation(null);
      setCallMode('video');

      setRealCallMuted(false);
      setRealCallCameraEnabled(true);
      setRealCallSpeakerEnabled(true);
      setIsMinimized(false);
      setNetworkQuality(null);

      if (managedPosition) {
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${isMobile ? 0 : initialPosition.left}px`;
          element.style.top = `${isMobile ? 0 : initialPosition.top}px`;
        }
      }

      setIsInitiatingGroupCall(false);
      setGroupCallType('video');
      setGroupId('');
      setSelectedNewMembers([]);
      setWebimGroupMembers([]);
      setIsLoadingGroupMembers(false);
      setIsUserSelectVisible(false);
    }
    onHangup?.();
  }, [
    hasInitialized,
    onHangup,
    isShowingPreview,
    callStatus,
    managedPosition,
    initialSize,
    initialPosition,
  ]);

  const effectiveGroupMembers = React.useMemo(() => {
    if (webimGroupMembers.length > 0) {
      return webimGroupMembers;
    }
    return groupMembers;
  }, [webimGroupMembers, groupMembers]);

  // 🔧 计算当前通话信息，用于Header显示
  const callInfo = React.useMemo(() => {
    if (callMode === 'group') {
      // 群组通话：从各种来源获取群组信息
      let groupName: string | undefined;
      let groupAvatar: string | undefined;
      let groupId: string | undefined;

      // 1. 优先从邀请信息获取（被叫方）
      if (invitation?.type === 'group') {
        groupName = invitation.groupName;
        groupAvatar = invitation.groupAvatar;
        groupId = invitation.groupId;
      }
      // 2. 从主叫目标信息获取（主叫方）
      else if (callerTargetInfo?.targetGroupId) {
        groupName = callerTargetInfo.targetGroupName;
        groupAvatar = callerTargetInfo.targetGroupAvatar;
        groupId = callerTargetInfo.targetGroupId;
      }
      // 3. 如果都没有，尝试从CallService获取
      else if (hasInitialized && callServiceRef.current) {
        const currentCallInfo = callServiceRef.current.getCurrentCallInfo();
        groupName = currentCallInfo?.groupName;
        groupId = currentCallInfo?.groupId;
      }

      return {
        groupId,
        groupName,
        groupAvatar,
      };
    } else {
      // 1v1通话：获取对方信息
      let remoteUserId: string | undefined;
      let remoteUserNickname: string | undefined;
      let remoteUserAvatar: string | undefined;

      // 1. 优先从主叫目标信息获取（主叫方）
      if (callerTargetInfo?.targetUserId) {
        remoteUserId = callerTargetInfo.targetUserId;
        remoteUserNickname = callerTargetInfo.targetUserNickname;
        remoteUserAvatar = callerTargetInfo.targetUserAvatar;
      }
      // 2. 从视频列表获取（通话中）
      else {
        const remoteVideo = displayVideos.find(video => !video.isLocalVideo);
        // 从视频ID中提取userId（格式：'remote-userId' 或直接是userId）
        if (remoteVideo?.id) {
          remoteUserId = remoteVideo.id.startsWith('remote-')
            ? remoteVideo.id.replace('remote-', '')
            : remoteVideo.id;
        }
        remoteUserNickname = remoteVideo?.nickname;
        remoteUserAvatar = remoteVideo?.avatar;
      }

      return {
        remoteUserId,
        remoteUserNickname,
        remoteUserAvatar,
      };
    }
  }, [callMode, invitation, callerTargetInfo, hasInitialized, displayVideos]);

  const groupCallStatus = React.useMemo(() => {
    const isGroupCall = callMode === 'group';
    const hasParticipants = displayVideos.some(video => !video.isLocalVideo);

    const rtcCallStatus = hasInitialized ? callServiceRef.current?.getCallStatus?.() : null;
    const isRTCConnected = rtcCallStatus === CALL_STATUS.IN_CALL;

    const isUIConnected = callStatus === 'connected' || isRTCConnected;
    const isConnected = isGroupCall ? isRTCConnected : isUIConnected;

    return {
      isGroupCall,
      hasParticipants,
      isConnected,
    };
  }, [callMode, displayVideos, callStatus, hasInitialized]);

  const stableLayoutProps = React.useMemo(
    () => ({
      videos:
        isShowingPreview && callMode !== 'group' ? (localVideo ? [localVideo] : []) : displayVideos,
      containerSize: actualContainerSize,
      prefixCls,
      renderVideoWindow,
      // 布局相关
      aspectRatio,
      gap,
      maxVideos,
      // 🔧 多人通话背景图片设置
      backgroundImage,
      // 呼叫状态相关
      callMode,
      callStatus,
      isShowingPreview,
      // 全屏相关
      isFullscreen,
      onFullscreenToggle: toggleFullscreen,
      // 最小化相关
      isMinimized,
      onMinimizedToggle: handleMinimizedToggle,
      // 控制按钮相关
      showControls,
      muted: hasInitialized ? realCallMuted : muted,
      cameraEnabled: hasInitialized ? realCallCameraEnabled : cameraEnabled,
      speakerEnabled: hasInitialized ? realCallSpeakerEnabled : speakerEnabled,
      screenSharing,
      // 控制按钮回调
      onMuteToggle: handleMuteToggle,
      onCameraToggle: handleCameraToggle,
      onSpeakerToggle: handleSpeakerToggle,
      onCameraFlip: handleCameraFlip,
      onScreenShareToggle: handleScreenShareToggle,
      onHangup: handleHangup,
      onAddParticipant: handleAddParticipant,
      // 预览模式回调
      onPreviewAccept: handlePreviewAccept,
      onPreviewReject: handlePreviewReject,
      // 其他
      onMinimizedClick: handleMinimizedClick,
      // 🔧 通话信息
      invitation,
      callInfo,
      // 🔧 多人视频通话相关状态
      ...groupCallStatus,
      // 🔧 新增：布局切换回调
      onLayoutModeChange,
      // 🔧 新增：网络质量相关状态
      networkQuality,
      // 🔧 新增：Icon 自定义配置
      customIcons,
      // 🔧 新增：拖动状态，避免拖动触发清屏点击
      isDragging,
      justFinishedDrag,
    }),
    [
      isShowingPreview,
      localVideo,
      displayVideos,
      actualContainerSize,
      prefixCls,
      renderVideoWindow,
      aspectRatio,
      gap,
      maxVideos,
      backgroundImage,
      callMode,
      callStatus,
      isFullscreen,
      toggleFullscreen,
      isMinimized,
      handleMinimizedToggle,
      showControls,
      hasInitialized,
      realCallMuted,
      muted,
      realCallCameraEnabled,
      cameraEnabled,
      realCallSpeakerEnabled,
      speakerEnabled,
      screenSharing,
      handleMuteToggle,
      handleCameraToggle,
      handleSpeakerToggle,
      handleScreenShareToggle,
      handleHangup,
      handleAddParticipant,
      handlePreviewAccept,
      handlePreviewReject,
      handleMinimizedClick,
      invitation,
      callInfo,
      callerTargetInfo,
      groupCallStatus,
      onLayoutModeChange,
      networkQuality,
      customIcons,
      isDragging,
      justFinishedDrag,
    ],
  );

  const currentParticipants = React.useMemo(() => {
    if (isInitiatingGroupCall && chatClient?.user) {
      const currentUser = effectiveGroupMembers.find(member => member.userId === chatClient.user);
      return currentUser ? [currentUser] : [];
    }

    const result = displayVideos.map(video => {
      let userId = video.id;
      if (video.isLocalVideo) {
        userId = chatClient?.user || 'local';
      } else if (video.id.startsWith('remote-')) {
        userId = video.id.replace('remote-', '');
      }

      const memberInfo = effectiveGroupMembers.find(member => member.userId === userId);
      if (memberInfo) {
        return memberInfo;
      }

      return {
        userId: userId,
        nickname: video.nickname,
        avatarUrl: video.avatar,
      };
    });

    return result;
  }, [displayVideos, chatClient?.user, effectiveGroupMembers, isInitiatingGroupCall]);

  return (
    <>
      {notificationContextHolder}

      <UserSelect
        title={
          isInitiatingGroupCall
            ? isLoadingGroupMembers
              ? (t('callkit.userselect.loadingGroupMembers') as string)
              : finalInitiateGroupCallTitle
            : isLoadingGroupMembers
            ? (t('callkit.userselect.loadingGroupMembers') as string)
            : finalUserSelectTitle
        }
        open={isUserSelectVisible}
        onCancel={handleUserSelectCancel}
        onConfirm={handleUserSelectConfirm}
        enableMultipleSelection
        onUserSelect={handleUserSelect}
        users={effectiveGroupMembers}
        checkedUsers={currentParticipants}
        closable={true}
        disabled={userSelectDisabled}
      />

      {/* 根据呼叫状态显示界面 */}
      {(callStatus === 'calling' ||
        callStatus === 'connected' ||
        (callStatus === 'ringing' && isShowingPreview)) && (
        <div
          ref={managedPosition ? internalRef : containerRef}
          className={containerClass}
          style={containerStyle}
          {...containerDataAttributes}
        >
          <MemoizedFullLayoutManager
            {...stableLayoutProps}
            callDuration={callDuration}
            networkQuality={networkQuality}
          />
        </div>
      )}
    </>
  );
});

CallKit.displayName = 'CallKit';
export { CallKit };
export default CallKit;
