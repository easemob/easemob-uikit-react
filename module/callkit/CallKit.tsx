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
import './styles/index.scss';
import CallError, { CallErrorCode } from './services/CallError';

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
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('callkit', prefix);
  const { t } = useTranslation();

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

  // 监听通话状态变化，自动开始/停止计时
  React.useEffect(() => {
    if (callStatus === 'connected' && isInCall) {
      startCallTimer();
    } else if (callStatus === 'idle' || !isInCall) {
      stopCallTimer();
    }
  }, [callStatus, isInCall, startCallTimer, stopCallTimer]);

  // 内置位置和尺寸管理状态
  const [internalPosition, setInternalPosition] = React.useState(initialPosition);
  const [internalSize, setInternalSize] = React.useState(initialSize);
  const internalRef = React.useRef<HTMLDivElement>(null);

  // 使用邀请定时器hook
  const { setInvitationTimer, clearInvitationTimer, clearAllInvitationTimers, handleUserJoined } =
    useInvitationTimers();

  // 处理邀请超时
  const handleInvitationTimeout = React.useCallback(
    (userId: string) => {
      // 发送取消邀请消息
      if (hasInitialized && callServiceRef.current) {
        callServiceRef.current.cancelInvitation(userId);
      }

      // 从视频列表中移除该用户
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

  // 处理邀请用户被移除的回调
  const handleInvitedUserRemoved = React.useCallback(
    (userId: string, reason: 'refused' | 'cancelled' | 'timeout') => {
      // 清理邀请定时器
      clearInvitationTimer(userId);

      // 从视频列表中移除该用户
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

  // 最小化状态管理
  const [isMinimized, setIsMinimized] = React.useState(false);

  // UserSelect 状态管理
  const [isUserSelectVisible, setIsUserSelectVisible] = React.useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = React.useState<any[]>([]); // 新选择的成员
  const [isInitiatingGroupCall, setIsInitiatingGroupCall] = React.useState(false); // 是否正在发起群组通话
  const [groupCallType, setGroupCallType] = React.useState<'video' | 'audio'>('video'); // 群组通话类型
  const [groupId, setGroupId] = React.useState<string>(''); // 群组ID

  // 新增：从 IM SDK 获取的群成员状态
  const [webimGroupMembers, setWebimGroupMembers] = React.useState<any[]>([]); // 从IM SDK获取的群成员
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = React.useState(false); // 是否正在加载群成员

  // 🔧 新增：群组通话 Promise 控制
  const groupCallPromiseRef = useRef<{
    resolve: (msg: ChatSDK.TextMsgBody | null) => void;
    reject: (error: any) => void;
  } | null>(null);

  // 🔧 新增：主叫发起通话时的目标信息（用于Header显示）
  const [callerTargetInfo, setCallerTargetInfo] = React.useState<{
    // 1v1通话的目标用户
    targetUserId?: string;
    targetUserNickname?: string;
    targetUserAvatar?: string;
    // 群组通话的目标群组
    targetGroupId?: string;
    targetGroupName?: string;
    targetGroupAvatar?: string;
  } | null>(null);

  // 真实通话状态管理 - 覆盖 props 状态
  const [realCallMuted, setRealCallMuted] = React.useState(false);
  const [realCallCameraEnabled, setRealCallCameraEnabled] = React.useState(true);
  const [realCallSpeakerEnabled, setRealCallSpeakerEnabled] = React.useState(true);

  // CallService 实例
  const callServiceRef = React.useRef<CallService | null>(null);

  // 🔧 新增：监听通话模式变化，调整摄像头默认状态
  React.useEffect(() => {
    if (callMode === 'group') {
      // 群通话模式：摄像头默认关闭
      console.log('🔧 CallKit: 检测到群通话模式，设置摄像头默认关闭');
      setRealCallCameraEnabled(false);
    } else if (callMode === 'video') {
      // 1v1视频通话模式：摄像头默认开启
      console.log('🔧 CallKit: 检测到1v1视频通话模式，设置摄像头默认开启');
      setRealCallCameraEnabled(true);
    }
    // 其他模式（如audio）保持当前状态不变
  }, [callMode]);

  const handleCallStart = React.useCallback(
    (videos: VideoWindowProps[]) => {
      console.log('🚀 handleCallStart 接收到视频列表:', {
        视频数量: videos.length,
        视频详情: videos.map(v => ({
          ID: v.id,
          昵称: v.nickname,
          是否本地: v.isLocalVideo,
          是否等待: v.isWaiting,
          摄像头状态: v.cameraEnabled,
        })),
      });

      // 🔧 修复：合并而不是覆盖现有的远程视频，避免丢失已添加的远程视频
      setVideos(prevVideos => {
        console.log('🔧 handleCallStart: 合并视频列表', {
          当前视频数量: prevVideos.length,
          当前视频: prevVideos.map(v => ({ id: v.id, 是否本地: v.isLocalVideo })),
          新传入视频数量: videos.length,
          新传入视频: videos.map(v => ({ id: v.id, 是否本地: v.isLocalVideo })),
        });

        // 创建合并后的视频列表
        const mergedVideos = [...prevVideos];

        // 添加或更新 CallService 传递的视频
        videos.forEach(newVideo => {
          const existingIndex = mergedVideos.findIndex(v => v.id === newVideo.id);
          if (existingIndex >= 0) {
            // 更新现有视频
            mergedVideos[existingIndex] = newVideo;
            console.log('🔧 更新现有视频:', newVideo.id);
          } else {
            // 添加新视频
            mergedVideos.push(newVideo);
            console.log('🔧 添加新视频:', newVideo.id);
          }
        });

        console.log('🔧 handleCallStart: 合并完成', {
          合并后数量: mergedVideos.length,
          合并后视频: mergedVideos.map(v => ({ id: v.id, 是否本地: v.isLocalVideo })),
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
      console.log('🚀 handleCallEnd 接收到通话结束信', currentIsMinimized);
      // 🔧 新增：通话结束时清理所有邀请定时器
      clearAllInvitationTimers();

      if (currentIsMinimized) {
        console.log('🚀 最小化状态，恢复到正常大小', currentIsMinimized);
        // 设置状态并执行DOM恢复操作
        setIsMinimized(false);
        restoreToNormalSize();
        // 触发最小化状态变化回调
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

      // 🔧 新增：重置CallKit尺寸和位置到初始状态
      if (managedPosition) {
        console.log('🔧 重置CallKit尺寸和位置到初始状态');
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        // 立即应用到DOM，避免视觉闪烁
        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${initialPosition.left}px`;
          element.style.top = `${initialPosition.top}px`;
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

      // 🔧 强制清理：停止所有正在播放的视频元素
      try {
        const videoElements = document.querySelectorAll('video[data-video-id]');
        videoElements.forEach((video: any) => {
          if (video.srcObject) {
            video.srcObject = null;
          }
          video.dataset.playingTrackId = '';
          video.dataset.trackPlayed = '';
        });
        console.log('🔧 强制清理了所有视频元素');
      } catch (error) {
        console.warn('清理视频元素失败:', error);
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
    console.log('🚀 接收到新邀请，重置最小化状态');
    setInvitation(invitation);
    setCallStatus('ringing');
    // 🔧 新增：接收新邀请时确保从正常大小状态开始
    setIsMinimized(false);
  }, []);

  // 新增：远程用户发布流回调
  const handleUserPublished = React.useCallback(
    (userId: string, mediaType: string) => {
      console.log('远程用户发布流:', userId, mediaType, callStatus, callMode);

      // 🔧 新增：用户加入时清理邀请定时器
      if (userId) {
        handleUserJoined(userId);
      }

      // 🔧 修复：当有远程用户发布流时，如果当前状态是 calling，更新为 connected
      // 群组通话 callMode 是 video 应该是group
      if (callStatus === 'calling' || callStatus === 'idle') {
        console.log('🔧 远程用户加入，更新通话状态从 calling 到 connected');
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

  // 通用的群成员获取方法
  const fetchGroupMembers = React.useCallback(
    async (groupId: string, context: string = '通用') => {
      console.log(`🚀 ${context}：调用 fetchGroupMembers，参数:`, {
        groupId,
        hasWebimConnection: !!chatClient,
      });

      if (!groupId || !chatClient) {
        console.warn(`❌ ${context}：缺少必要参数`, {
          groupId: !!groupId,
          chatClient: !!chatClient,
        });
        return [];
      }

      try {
        console.log(`🔄 ${context}：开始获取群成员，群组ID:`, groupId);

        // 🔧 修改：循环分页获取所有群成员
        const allMemberUserIds: string[] = [];
        let pageNum = 1;
        const pageSize = 50;
        let hasMoreData = true;

        while (hasMoreData) {
          console.log(`📄 ${context}：获取第 ${pageNum} 页，每页 ${pageSize} 个成员`);
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

              // 判断是否还有下一页数据
              // 检查isLast字段
              if (response.isLast === true) {
                hasMoreData = false;
              }
              // 检查返回数据量是否小于pageSize
              else if (pageUserIds.length < pageSize) {
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

        console.log(`📊 ${context}：分页获取完成，总共获取到 ${allMemberUserIds.length} 个群成员`);

        if (allMemberUserIds.length > 0) {
          const memberUserIds = allMemberUserIds;
          console.log(`📋 ${context}：获取到群成员UserIds:`, memberUserIds);

          // 使用 userInfoProvider 批量获取用户详细信息
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
                avatarUrl: userInfo.avatarUrl, // 不使用假数据，让组件显示默认图标
              }))
              .filter(member => member.userId); // 过滤掉无效的成员

            console.log(`👥 ${context}：群成员获取成功:`, formattedMembers.length, '个有效成员');

            // 🔧 新增：将用户信息设置到CallService中，确保nickname正确显示
            if (callServiceRef.current && formattedMembers.length > 0) {
              const userInfoMap: { [key: string]: any } = {};
              formattedMembers.forEach((member: any) => {
                userInfoMap[member.userId] = {
                  nickname: member.nickname,
                  avatarUrl: member.avatarUrl,
                };
              });
              callServiceRef.current.setUserInfo(userInfoMap);
              console.log(`📝 ${context}：已将用户信息设置到CallService:`, {
                用户数量: formattedMembers.length,
                用户列表: formattedMembers.map((m: any) => `${m.userId}(${m.nickname})`),
              });
            }

            return formattedMembers;
          } catch (error) {
            console.warn(`❌ ${context}：批量获取用户信息失败:`, error);
            // 如果批量获取失败，使用基础信息
            const basicMembers = memberUserIds.map((userId: string) => ({
              userId,
              nickname: userId,
              avatarUrl: undefined, // 不使用假数据，让组件显示默认图标
            }));
            console.log(
              `👥 ${context}：使用基础信息创建群成员列表:`,
              basicMembers.length,
              '个成员',
            );

            // 将基础用户信息设置到CallService中
            if (callServiceRef.current && basicMembers.length > 0) {
              const userInfoMap: { [key: string]: any } = {};
              basicMembers.forEach((member: any) => {
                userInfoMap[member.userId] = {
                  nickname: member.nickname,
                  avatarUrl: member.avatarUrl,
                };
              });
              callServiceRef.current.setUserInfo(userInfoMap);
              console.log(`📝 ${context}：已将基础用户信息设置到CallService:`, {
                用户数量: basicMembers.length,
                用户列表: basicMembers.map((m: any) => `${m.userId}(${m.nickname})`),
              });
            }

            return basicMembers;
          }
        } else {
          console.log(`⚠️ ${context}：群组中没有成员或成员数据为空`);
          return [];
        }
      } catch (error) {
        console.error(`❌ ${context}：获取群成员失败:`, error);
        return [];
      }
    },
    [chatClient, userInfoProvider],
  );

  // 远程视频流准备就绪回调
  const handleRemoteVideoReady = React.useCallback((videoInfo: VideoWindowProps) => {
    if (videoInfo.isLocalVideo) {
      // 本地视频：根据视频ID和当前状态决定更新位置
      const currentIsShowingPreview = isShowingPreviewRef.current;
      const currentIsInCall = isInCallRef.current;
      const currentCallMode = callModeRef.current;
      console.log('视频流准备就绪:', videoInfo);
      // 如果是预览模式的本地视频（ID为local-preview），总是设置到localVideo状态
      if (videoInfo.id === 'local-preview') {
        setLocalVideo(videoInfo);
        console.log('预览模式：设置本地视频到 localVideo 状态:', videoInfo);
      } else if (currentCallMode === 'group') {
        // 多人视频通话：无论是否在预览状态，都将本地视频添加到 videos 数组中
        setVideos(prevVideos => {
          const existingIndex = prevVideos.findIndex(v => v.isLocalVideo);
          if (existingIndex >= 0) {
            // 更新现有的本地视频
            const newVideos = [...prevVideos];
            newVideos[existingIndex] = videoInfo;
            console.log('多人视频通话：更新 videos 数组中的本地视频:', videoInfo);
            return newVideos;
          } else {
            // 添加新的本地视频
            console.log('多人视频通话：添加本地视频到 videos 数组:', videoInfo);
            return [...prevVideos, videoInfo];
          }
        });
      } else if (currentIsShowingPreview && videoInfo.id !== 'local-preview') {
        // 1v1预览模式下的其他本地视频
        setLocalVideo(videoInfo);
        console.log('1v1预览模式：设置本地视频到 localVideo 状态:', videoInfo);
      } else if (currentIsInCall) {
        // 1v1通话模式：更新 videos 数组中的本地视频
        setVideos(prevVideos => {
          const existingIndex = prevVideos.findIndex(v => v.isLocalVideo);
          if (existingIndex >= 0) {
            // 更新现有的本地视频
            const newVideos = [...prevVideos];
            newVideos[existingIndex] = videoInfo;
            console.log('1v1通话模式：更新 videos 数组中的本地视频:', videoInfo);
            return newVideos;
          } else {
            // 添加新的本地视频（这种情况不应该发生，但作为保险）
            console.log('1v1通话模式：添加本地视频到 videos 数组:', videoInfo);
            return [...prevVideos, videoInfo];
          }
        });
      }
    } else {
      // 远程视频：处理添加或移除
      console.log('🎬 处理远程视频:', {
        视频ID: videoInfo.id,
        是否移除: videoInfo.removed,
        当前通话模式: callModeRef.current,
        当前是否在通话中: isInCallRef.current,
      });

      // 🔧 1v1视频通话特殊处理：当只是音频状态变化时，不调用setVideos以避免闪动
      const currentCallMode = callModeRef.current;
      const currentIsInCall = isInCallRef.current;
      const is1v1VideoCall = currentCallMode === 'video' && currentIsInCall;

      if (is1v1VideoCall) {
        // 检查是否只是音频状态变化（摄像头状态未变，只是麦克风状态变化）
        const existingVideo = videos.find(v => v.id === videoInfo.id);
        if (existingVideo) {
          const isOnlyAudioChange =
            existingVideo.cameraEnabled === videoInfo.cameraEnabled &&
            existingVideo.isWaiting === videoInfo.isWaiting &&
            !videoInfo.removed;

          if (isOnlyAudioChange) {
            console.log('🔇 1v1视频通话：检测到只是音频状态变化，跳过setVideos调用以避免闪动:', {
              视频ID: videoInfo.id,
              旧麦克风状态: existingVideo.muted,
              新麦克风状态: videoInfo.muted,
              摄像头状态: videoInfo.cameraEnabled,
            });
            // 只调用外部回调，不更新videos数组
            return;
          }
        }
      }

      setVideos(prevVideos => {
        const existingIndex = prevVideos.findIndex(v => v.id === videoInfo.id);

        console.log('📋 远程视频处理前状态:', {
          视频ID: videoInfo.id,
          现有索引: existingIndex,
          当前视频数量: prevVideos.length,
          当前视频列表: prevVideos.map(v => `${v.id}(${v.isLocalVideo ? '本地' : '远程'})`),
        });

        // 如果标记为移除，从数组中删除
        if (videoInfo.removed) {
          if (existingIndex >= 0) {
            console.log('🗑️ 从 videos 数组中移除离开的用户:', videoInfo.id);
            return prevVideos.filter(v => v.id !== videoInfo.id);
          } else {
            console.log('⚠️ 尝试移除不存在的用户:', videoInfo.id);
            return prevVideos;
          }
        }

        // 正常添加或更新逻辑
        if (existingIndex >= 0) {
          // 更新现有视频
          const oldVideoInfo = prevVideos[existingIndex];
          const newVideos = [...prevVideos];

          newVideos[existingIndex] = videoInfo;
          return newVideos;
        } else {
          // 添加新的远程视频
          const newVideos = [...prevVideos, videoInfo];
          console.log('🎯 添加新的远程视频:', {
            新视频ID: videoInfo.id,
            新视频昵称: videoInfo.nickname,
            更新前数量: prevVideos.length,
            更新后数量: newVideos.length,
            更新后列表: newVideos.map(v => `${v.id}(${v.isLocalVideo ? '本地' : '远程'})`),
          });
          return newVideos;
        }
      });
    }
  }, []);

  // 🔧 新增：处理说话用户变化回调
  const handleTalkingUsersChange = React.useCallback((talkingUsers: string[]) => {
    console.log('🎤 说话用户变化:', talkingUsers);
    setTalkingUsers(talkingUsers);
  }, []);

  const [networkQuality, setNetworkQuality] = React.useState<any>(null);

  // 处理网络质量变化回调
  const handleNetworkQualityChange = React.useCallback((networkQuality: any) => {
    console.log('🌐 网络质量变化:', networkQuality);
    // 把 = 0 的值设置为上次的值
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

  // 初始化 CallService
  React.useEffect(() => {
    if (chatClient) {
      console.log('🔍 CallKit 初始化 CallService', chatClient);
      // 避免重复初始化
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
        onCallError,
        onReceivedCall,
        onRemoteUserJoined,
        onRemoteUserLeft,
        onRtcEngineCreated,
      };

      callServiceRef.current = new CallService(config);

      // 暴露 callService 到全局，供 renderVideoWindow 使用
      (window as any).callService = callServiceRef.current;

      // 设置本地用户信息
      if (chatClient?.user) {
        // 异步获取本地用户头像
        getLocalUserAvatar().then(avatarUrl => {
          const localUserInfo = {
            [chatClient.user]: {
              nickname: t('callkit.localUser.me') as string,
              avatarUrl: avatarUrl,
            },
          };
          if (callServiceRef.current) {
            callServiceRef.current.setUserInfo(localUserInfo);
            console.log('📝 CallService初始化后，已设置本地用户信息:', {
              userId: chatClient.user,
              nickname: t('callkit.localUser.me') as string,
              avatarUrl: avatarUrl,
            });
          }
        });
      }

      // 设置视频元素准备好回调
      // callServiceRef.current.setVideoElementReadyCallback((videoId: string) => {});
      setHasInitialized(true);
      return () => {
        // 清理时移除全局引用
        (window as any).callService = null;
        callServiceRef.current?.destroy(true); // 🔧 传递isInitializing=true，避免触发麦克风权限请求
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
  // 暴露给外部的方法
  useImperativeHandle(
    ref,
    () => ({
      // 内部
      showInvitation: (invitationInfo: InvitationInfo) => {
        setInvitation(invitationInfo);
        // 🔧 修复：只有在非主叫状态下才设置为 ringing，避免覆盖主叫方的 calling 状态
        if (callStatus !== 'calling') {
          setCallStatus('ringing'); // 被叫：响铃中/被邀请中
        }

        // 设置通话模式
        const currentCallMode = invitationInfo.type === 'group' ? 'group' : invitationInfo.type;
        setCallMode(currentCallMode);

        // 如果是群组视频通话，进入群组视频布局的预览模式
        if (invitationInfo.type === 'group') {
          setIsShowingPreview(true);
          setLocalVideo({
            id: 'local-preview',
            isLocalVideo: true,
            nickname: t('callkit.localUser.me') as string,
            muted: false,
            cameraEnabled: true,
            stream: undefined, // 这里应该是实际的本地视频流
          });
        } else if (invitationInfo.type === 'video') {
          // 1v1视频通话的预览模式
          console.log('🔧 1v1视频邀请：设置预览状态');
          setIsShowingPreview(true);
          // 不在这里设置localVideo，等待CallService创建实际的视频轨道后通过onRemoteVideoReady回调
        }
      },
      // 内部
      hideInvitation: () => {
        setInvitation(null);
        setCallStatus('idle');
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video'); // 重置为初始模式

        // 🔧 重置真实通话状态到初始值
        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        // 🔧 新增：重置CallKit尺寸和位置到初始状态
        if (managedPosition) {
          console.log('🔧 hideInvitation: 重置CallKit尺寸和位置到初始状态');
          setInternalSize(initialSize);
          setInternalPosition(initialPosition);

          // 立即应用到DOM，避免视觉闪烁
          const element = internalRef.current;
          if (element) {
            element.style.width = `${initialSize.width}px`;
            element.style.height = `${initialSize.height}px`;
            element.style.left = `${initialPosition.left}px`;
            element.style.top = `${initialPosition.top}px`;
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
      },
      // 内部
      startCall: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
        setIsInCall(true);
        setCallStatus('connected'); // 已接通/通话中
        setIsShowingPreview(false);
        setLocalVideo(null);
        // 设置通话模式：优先使用 prop，否则从邀请信息推断
        if (invitation) {
          setCallMode(invitation.type === 'audio' ? 'audio' : invitation.type);
        }
        setInvitation(null);
        onCallStartRef.current?.(callVideos);
      },
      // 内部
      endCall: () => {
        setVideos([]);
        setIsInCall(false);
        setCallStatus('idle'); // 空闲
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video'); // 重置为初始模式

        // 🔧 重置真实通话状态到初始值
        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        // 🔧 新增：重置CallKit尺寸和位置到初始状态
        if (managedPosition) {
          console.log('🔧 endCall: 重置CallKit尺寸和位置到初始状态');
          setInternalSize(initialSize);
          setInternalPosition(initialPosition);

          // 立即应用到DOM，避免视觉闪烁
          const element = internalRef.current;
          if (element) {
            element.style.width = `${initialSize.width}px`;
            element.style.height = `${initialSize.height}px`;
            element.style.left = `${initialPosition.left}px`;
            element.style.top = `${initialPosition.top}px`;
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

        // onCallEndRef.current?.(reason, callInfo);
      },
      // 内部
      updateVideos: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
      },
      // 内部
      getCurrentInvitation: () => invitation,
      // 内部
      getCallStatus: () => callStatus,
      // 内部 显示预览界面
      showPreview: (callModeToSet?: 'video' | 'audio' | 'group') => {
        setIsShowingPreview(true);
        if (callModeToSet) {
          setCallMode(callModeToSet);
        }
      },
      // 发起多人通话
      startGroupCall: async (options: {
        groupId: string;
        // callType: 'video' | 'audio';
        msg: string;
        ext?: Record<string, any>;
      }): Promise<ChatSDK.TextMsgBody | null> => {
        // 检查当前是否在通话中
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

        // 🔧 创建 Promise 用于异步返回结果
        return new Promise<ChatSDK.TextMsgBody | null>((resolve, reject) => {
          groupCallPromiseRef.current = { resolve, reject };

          setIsInitiatingGroupCall(true);
          setGroupCallType(callType);
          setCallMode('group');
          setSelectedNewMembers([]);
          setGroupId(groupId);
          setExt(ext || {});

          // 获取当前最新的 webimConnection（避免闭包问题）
          const currentWebimConnection = chatClient;

          // 异步操作，不阻塞 Promise 的创建
          (async () => {
            try {
              // 如果提供了webimConnection和userInfoProvider，直接获取当前群组的成员
              if (currentWebimConnection) {
                setIsLoadingGroupMembers(true);

                // 🔧 使用封装的方法获取群成员
                const formattedMembers = await fetchGroupMembers(groupId, 'startGroupCall');
                console.log('🚀 获取群成员', formattedMembers);
                setWebimGroupMembers(formattedMembers);
                setIsLoadingGroupMembers(false);
              } else {
                // 没有配置IM连接和provider，清空群成员数据
                setWebimGroupMembers([]);
              }

              setIsUserSelectVisible(true);
            } catch (error) {
              console.error('startGroupCall 异步操作失败:', error);
              // 如果异步操作失败，不影响用户选择界面的显示
              setIsUserSelectVisible(true);
            }
          })();
        });
      },

      // 发起一对一通话
      startSingleCall: async (options: {
        to: string;
        callType: 'video' | 'audio';
        msg: string;
        ext?: Record<string, any>;
      }) => {
        // 检查当前是否在通话中
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
          // 设置通话模式
          const currentCallMode = options.callType;
          setCallMode(currentCallMode);

          // 1v1通话：设置目标用户信息
          let targetUserNickname = options.to;
          let targetUserAvatar: string | undefined;

          // 尝试使用userInfoProvider获取用户详细信息
          if (userInfoProvider) {
            try {
              const userInfos = await Promise.resolve(userInfoProvider([options.to]));
              const userInfo = userInfos.find(user => user.userId === options.to);
              if (userInfo) {
                targetUserNickname = userInfo.nickname || targetUserNickname;
                targetUserAvatar = userInfo.avatarUrl;
              }
            } catch (error) {
              console.warn('获取用户信息失败:', error);
            }
          }

          // 主叫方发起1v1通话时，设置被叫方用户信息到CallService
          if (callServiceRef.current) {
            const targetUserInfo = {
              [options.to]: {
                nickname: targetUserNickname,
                avatarUrl: targetUserAvatar,
              },
            };
            callServiceRef.current.setUserInfo(targetUserInfo);
            console.log('📝 主叫方发起1v1通话时，已设置被叫方用户信息到CallService:', {
              userId: options.to,
              nickname: targetUserNickname,
              avatar: targetUserAvatar,
            });
          }

          setCallerTargetInfo({
            targetUserId: options.to,
            targetUserNickname,
            targetUserAvatar,
          });

          // 1v1通话：发起方进入预览模式
          setIsShowingPreview(true);

          setCallStatus('calling'); // 主叫：呼叫中

          // 如果是视频通话，设置本地视频预览
          if (options.callType === 'video') {
            setLocalVideo({
              id: 'local-preview',
              isLocalVideo: true,
              nickname: t('callkit.localUser.me') as string,
              muted: false,
              cameraEnabled: true,
              stream: undefined, // 实际的本地视频流由 CallService 创建
            });
          }

          // 使用WebIM.conn.getUniqueId()生成唯一的callId
          const callId = generateRandomChannel(10);

          // 生成随机channel
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
          console.log('发送的邀请消息', msg);
          return msg as ChatSDK.TextMsgBody;
        } else {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'chatClient is required'));
          return null;
        }
      },
      // 内部
      answerCall: async (result: boolean) => {
        if (typeof result !== 'boolean') {
          onCallError?.(CallError.create(CallErrorCode.CALL_PARAM_ERROR, 'result is required'));
          return;
        }

        // 🔧 新增：接听呼叫时确保从正常大小状态开始
        if (result === true && isMinimizedRef.current) {
          console.log('🚀 接听呼叫，从最小化状态恢复到正常大小');
          setIsMinimized(false);
          restoreToNormalSize();
        }

        if (callServiceRef.current && invitation) {
          // 🔧 新增：被叫方接受1v1通话邀请时，设置主叫方用户信息用于Header显示
          if (invitation.type === 'video' || invitation.type === 'audio') {
            console.log('🎯 被叫方接受1v1通话，设置主叫方用户信息...');

            // 从invitation中获取主叫方信息
            const callerUserId = invitation.callerUserId; // invitation.callerName是主叫方的userId
            const callerNickname = invitation.callerName || callerUserId;
            const callerAvatar = invitation.callerAvatar;

            console.log('📝 被叫方获取到主叫方信息:', {
              userId: callerUserId,
              nickname: callerNickname,
              avatar: callerAvatar,
            });

            // 设置主叫方用户信息到CallService
            const callerUserInfo = {
              [callerUserId || '']: {
                nickname: callerNickname,
                avatarUrl: callerAvatar,
              },
            };
            callServiceRef.current.setUserInfo(callerUserInfo);

            // 设置被叫方视角的主叫方目标信息，用于Header显示
            setCallerTargetInfo({
              targetUserId: callerUserId,
              targetUserNickname: callerNickname,
              targetUserAvatar: callerAvatar,
            });

            console.log('✅ 被叫方已设置主叫方用户信息到CallService和callerTargetInfo');
          }

          // 被邀请方接受群组通话邀请时，获取群成员信息确保nickname正确显示
          if (result && invitation?.type === 'group') {
            console.log('🎯 被邀请方接受群组通话，开始获取群成员信息...');

            // 从邀请信息或CallService获取群组ID
            let groupId: string | undefined;
            if (invitation?.groupId) {
              groupId = invitation.groupId;
            } else {
              // 如果邀请信息中没有groupId，尝试从CallService获取
              const callInfo = callServiceRef.current.getCurrentCallInfo();
              groupId = callInfo?.groupId;
            }

            console.log('🔍 被邀请方获取到的群组ID:', groupId);

            if (groupId && chatClient && userInfoProvider) {
              try {
                // 使用封装的方法获取群成员信息
                const formattedMembers = await fetchGroupMembers(groupId, '被邀请方接受邀请');
                console.log('✅ 被邀请方成功获取群成员信息:', {
                  成员数量: formattedMembers.length,
                  成员列表: formattedMembers.map((m: any) => `${m.userId}(${m.nickname})`),
                });
              } catch (error) {
                console.warn('⚠️ 被邀请方获取群成员信息失败:', error);
              }
            } else {
              console.warn('⚠️ 被邀请方无法获取群成员信息:', {
                有群组ID: !!groupId,
                有webimConnection: !!chatClient,
                有userInfoProvider: !!userInfoProvider,
                邀请信息: invitation,
              });
            }
          }

          callServiceRef.current.answerCall(result);
        }
      },

      // exitCall
      exitCall: (reason?: string) => {
        if (callServiceRef.current) {
          callServiceRef.current.hangup(reason);
        }
      },

      // 内部
      setUserInfo: (userInfo: { [key: string]: any }) => {
        if (callServiceRef.current) {
          callServiceRef.current.setUserInfo(userInfo);
        }
      },

      // 内部
      toggleMute: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.toggleMute();
        }
        return false;
      },

      // 内部
      toggleCamera: async () => {
        if (callServiceRef.current) {
          return await callServiceRef.current.toggleCamera();
        }
        return false;
      },
      // 内部
      isMuted: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.isMuted();
        }
        return false;
      },
      // 内部
      isCameraEnabled: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.isCameraEnabled();
        }
        return false;
      },
      // 内部
      getJoinedMembers: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.getJoinedMembers();
        }
        return [];
      },
      // delete
      refreshLocalVideoStatus: () => {
        if (callServiceRef.current) {
          callServiceRef.current.refreshLocalVideoStatus();
        }
      },
      // delete
      playLocalVideoManually: () => {
        if (callServiceRef.current) {
          callServiceRef.current.playLocalVideoManually();
        }
      },
      // delete
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

      // 内部
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

      // 调整CallKit尺寸的方法
      adjustSize: (newSize: { width: number; height: number }) => {
        if (internalRef.current) {
          const element = internalRef.current;

          // 设置动画过渡
          element.style.transition = 'width 0.3s ease-out, height 0.3s ease-out';

          // 调整尺寸
          element.style.width = `${newSize.width}px`;
          element.style.height = `${newSize.height}px`;

          // 重新计算位置，使其居中
          const left = Math.max(0, (window.innerWidth - newSize.width) / 2);
          const top = Math.max(0, window.scrollY + (window.innerHeight - newSize.height) / 2);
          element.style.left = `${left}px`;
          element.style.top = `${top}px`;

          // 动画完成后清理样式并更新状态
          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              setInternalSize(newSize);
              setInternalPosition({ left, top });
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

  // 邀请通知 key
  const invitationNotificationKey = React.useMemo(() => 'callkit-invitation', []);

  // 使用 ref 存储最新的回调函数和 API，避免无限循环
  const onInvitationAcceptRef = useRef(onInvitationAccept);
  const onInvitationRejectRef = useRef(onInvitationReject);
  const onCallStartRef = useRef(onCallStart);

  const notificationApiRef = useRef(notificationApi);

  // 更新回调函数的引用
  React.useEffect(() => {
    onInvitationAcceptRef.current = onInvitationAccept;
    onInvitationRejectRef.current = onInvitationReject;
    onCallStartRef.current = onCallStart;
    onEndCallWithReasonRef.current = onEndCallWithReason;
    notificationApiRef.current = notificationApi;
  }, [onInvitationAccept, onInvitationReject, onCallStart, onEndCallWithReason, notificationApi]);

  // 处理邀请通知显示
  React.useEffect(() => {
    if (invitation) {
      // 显示邀请通知
      const handleAccept = async (invitationData: any) => {
        notificationApiRef.current.destroy(invitationNotificationKey);

        // 根据邀请类型设置正确的通话模式
        const currentCallMode = invitationData.type === 'group' ? 'group' : invitationData.type;
        setCallMode(currentCallMode);

        // 🔧 新增：被邀请方直接接听群组通话时，获取群成员信息确保nickname正确显示
        if (currentCallMode === 'group' && invitationData.groupId) {
          console.log('🎯 被邀请方直接接听群组通话，开始获取群成员信息...');

          if (chatClient && userInfoProvider) {
            try {
              // 使用封装的方法获取群成员信息
              const formattedMembers = await fetchGroupMembers(
                invitationData.groupId,
                '被邀请方直接接听',
              );
              console.log('✅ 被邀请方直接接听时成功获取群成员信息:', {
                成员数量: formattedMembers.length,
                成员列表: formattedMembers.map((m: any) => `${m.userId}(${m.nickname})`),
              });
            } catch (error) {
              console.warn('⚠️ 被邀请方直接接听时获取群成员信息失败:', error);
            }
          } else {
            console.warn('⚠️ 被邀请方无法获取群成员信息:', {
              有webimConnection: !!chatClient,
              有userInfoProvider: !!userInfoProvider,
              邀请groupId: invitationData.groupId,
            });
          }
        }

        // 如果是多人视频通话，需要先创建本地视频轨道
        if (currentCallMode === 'group' && hasInitialized && callServiceRef.current) {
          try {
            console.log('多人视频通话：直接接听，开始创建本地视频轨道');
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } catch (error) {
            console.error('多人视频通话：创建本地视频轨道失败:', error);
          }
        }

        // 🔧 修复：1v1视频通话直接接听，使用与preview页面相同的回调逻辑
        if (currentCallMode === 'video' && hasInitialized && callServiceRef.current) {
          try {
            console.log('🔧 1v1视频通话：点击接听，创建预览视频轨道');
            await callServiceRef.current.createLocalVideoTrackFor1v1Preview();
          } catch (error) {
            console.error('🔧 1v1视频通话：创建预览视频轨道失败:', error);
          }
        }

        // 🔧 CallKit内部自动调用answerCall，现在有防重复调用保护
        if (hasInitialized && callServiceRef.current) {
          try {
            console.log('🔧 CallKit内部自动执行接听操作');
            await callServiceRef.current.answerCall(true);
          } catch (error) {
            console.error('🔧 CallKit自动接听失败:', error);
          }
        }

        setCallStatus('connected'); // 接听后进入通话状态
        setIsInCall(true);
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);

        // 触发外部回调通知接听事件（用户不需要再手动调用answerCall）
        onInvitationAcceptRef.current?.(invitationData);
      };

      const handleReject = async (invitationData: any) => {
        notificationApiRef.current.destroy(invitationNotificationKey);

        // 🔧 CallKit内部自动调用answerCall，现在有防重复调用保护
        if (hasInitialized && callServiceRef.current) {
          try {
            console.log('🔧 CallKit内部自动执行拒绝操作');
            await callServiceRef.current.answerCall(false);
          } catch (error) {
            console.error('🔧 CallKit自动拒绝失败:', error);
          }
        }

        setCallStatus('idle'); // 拒绝后回到空闲状态
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode('video'); // 重置为初始模式

        // 🔧 重置真实通话状态到初始值
        setRealCallMuted(false);
        setRealCallCameraEnabled(true);
        setRealCallSpeakerEnabled(true);

        // 触发外部回调通知拒绝事件（用户不需要再手动调用answerCall）
        onInvitationRejectRef.current?.(invitationData);
      };

      // 处理通知区域点击（除了接听和拒绝按钮）
      const handleNotificationClick = async () => {
        // 隐藏通知，显示预览界面
        notificationApiRef.current.destroy(invitationNotificationKey);
        setIsShowingPreview(true);
        console.log('invitation --->', invitation);

        // 设置通话模式：invitation.type 现在已经是正确的字符串类型
        const currentCallMode = invitation.type === 'group' ? 'group' : invitation.type;
        setCallMode(currentCallMode);

        // 🔧 新增：被邀请方点击通知进入预览时，获取群成员信息确保nickname正确显示
        if (currentCallMode === 'group' && invitation.groupId) {
          if (chatClient && userInfoProvider) {
            try {
              // 使用封装的方法获取群成员信息
              const formattedMembers = await fetchGroupMembers(
                invitation.groupId,
                '被邀请方预览界面',
              );
              console.log('✅ 被邀请方预览时成功获取群成员信息:', {
                成员数量: formattedMembers.length,
                成员列表: formattedMembers.map((m: any) => `${m.userId}(${m.nickname})`),
              });
            } catch (error) {
              console.warn('⚠️ 被邀请方预览时获取群成员信息失败:', error);
            }
          } else {
            console.warn('⚠️ 被邀请方无法获取群成员信息:', {
              有webimConnection: !!chatClient,
              有userInfoProvider: !!userInfoProvider,
              邀请groupId: invitation.groupId,
            });
          }
        }
        // 🔧 修复：根据通话类型创建相应的视频轨道
        if (hasInitialized && callServiceRef.current) {
          if (currentCallMode === 'group') {
            console.log('🔧 notification点击：群组通话，创建群组视频轨道');
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } else if (currentCallMode === 'video') {
            console.log('🔧 notification点击：1v1视频通话，创建预览视频轨道');
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

  // 监听窗口尺寸变化（用于全屏模式）
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

  // 使用自定义Hooks
  const { containerSize, containerRef } = useContainerSize();

  const { isFullscreen, toggleFullscreen } = useFullscreen(
    managedPosition ? internalRef : containerRef,
  );

  // 获取正确的容器尺寸
  const actualContainerSize = useMemo(() => {
    // 全屏模式下，使用全屏尺寸
    if (isFullscreen) {
      return {
        width: windowSize.width,
        height: windowSize.height,
      };
    }

    if (managedPosition) {
      // 内置位置管理时，使用内部尺寸
      const currentSize = isMinimized ? minimizedSize : internalSize;
      return {
        width: currentSize.width,
        height: currentSize.height,
      };
    } else {
      // 用户自定义管理时，使用实际测量的容器尺寸
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

  // 获取实际的布局模式 - 根据通话状态和类型动态选择
  const actualLayoutMode = useMemo(() => {
    console.log('🔧 actualLayoutMode 计算:', {
      isMinimized,
      layoutMode,
      callMode,
      isShowingPreview,
      isInCall,
      videos数量: videos.length,
    });

    if (isMinimized) {
      return LayoutMode.MINIMIZED;
    }

    // 预览模式：根据通话类型选择合适的布局
    if (isShowingPreview) {
      if (callMode === 'group') {
        return LayoutMode.MULTI_PARTY; // 多人视频通话预览使用多人布局
      } else {
        return LayoutMode.PREVIEW; // 1v1通话预览使用专门的预览布局
      }
    }

    // 通话模式：根据通话类型选择布局，优先级高于prop传入的layoutMode
    if (isInCall) {
      if (callMode === 'group') {
        return LayoutMode.MULTI_PARTY; // 群组通话使用多人布局
      } else if (callMode === 'video' || callMode === 'audio') {
        return LayoutMode.ONE_TO_ONE; // 1v1通话使用一对一布局
      }
    }

    // 如果不在通话中且不在预览中，使用传入的layoutMode
    return layoutMode;
  }, [isMinimized, layoutMode, callMode, isShowingPreview, isInCall, videos.length]);

  // 内置位置管理的调整大小处理函数
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

  // 内置位置管理的拖动处理函数
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

  // 限制显示的视频数量
  const displayVideos = React.useMemo(() => {
    const result = maxVideos ? videos.slice(0, maxVideos) : videos;
    return result;
  }, [videos, maxVideos]);

  // 容器样式
  const containerStyle = React.useMemo(() => {
    if (managedPosition) {
      // 内置位置管理：合并内部状态和用户样式
      return {
        position: 'fixed' as const,
        left: internalPosition.left,
        top: internalPosition.top,
        width: internalSize.width,
        height: internalSize.height,
        ...style,
      };
    } else {
      // 用户自定义管理：只使用用户提供的样式
      return style;
    }
  }, [managedPosition, internalPosition, internalSize, style]);

  console.log('🚀 actualLayoutMode ==', actualLayoutMode);
  // 容器类名
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

  // 容器的数据属性，用于1v1视频模式的样式支持
  const containerDataAttributes = React.useMemo(() => {
    const isOneToOneVideo = callMode === 'video' && isMinimized;
    return {
      'data-video-mode': isOneToOneVideo ? 'one-to-one' : undefined,
    };
  }, [callMode, isMinimized]);

  // 动态计算最小化尺寸，根据通话模式调整
  const actualMinimizedSize = React.useMemo(() => {
    const isOneToOneVideo = callMode === 'video'; // 1v1视频通话
    return isOneToOneVideo
      ? { width: 200, height: 150 } // 1v1视频模式使用视频窗口尺寸
      : minimizedSize; // 其他模式使用默认尺寸
  }, [callMode, minimizedSize]);

  // 恢复到正常大小（不执行切换，直接恢复）
  const restoreToNormalSize = React.useCallback(() => {
    console.log('🔧 执行恢复到正常大小的DOM操作');
    if (managedPosition) {
      const element = internalRef.current;
      if (element) {
        // 获取当前最小化状态的中心点
        const currentCenterX = internalPosition.left + actualMinimizedSize.width / 2;
        const currentCenterY = internalPosition.top + actualMinimizedSize.height / 2;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 计算屏幕中心位置（目标位置）
        const targetCenterX = windowWidth / 2;
        const targetCenterY = windowHeight / 2;

        // 计算最终位置（保持中心点对齐）
        const finalX = targetCenterX - initialSize.width / 2;
        const finalY = targetCenterY - initialSize.height / 2;

        // 确保不会超出屏幕边界
        const margin = 20;
        const safeTargetX = Math.max(
          margin,
          Math.min(finalX, windowWidth - initialSize.width - margin),
        );
        const safeTargetY = Math.max(
          margin,
          Math.min(finalY, windowHeight - initialSize.height - margin),
        );

        // 设置动画过渡
        element.style.transition =
          'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
        element.style.transformOrigin = 'center center';

        // 同时改变位置和尺寸
        element.style.left = `${safeTargetX}px`;
        element.style.top = `${safeTargetY}px`;
        element.style.width = `${initialSize.width}px`;
        element.style.height = `${initialSize.height}px`;

        // 动画完成后更新 React 状态并清理样式
        setTimeout(() => {
          if (element) {
            element.style.transition = '';
            element.style.transformOrigin = '';

            // 同步更新 React 状态
            setInternalPosition({
              left: safeTargetX,
              top: safeTargetY,
            });
            setInternalSize(initialSize);

            // 从最小化恢复时，重新播放本地视频
            if (hasInitialized && callServiceRef.current) {
              callServiceRef.current.onRestoreFromMinimized();
            }
          }
        }, 300);
      }
    }
  }, [managedPosition, internalPosition, actualMinimizedSize, initialSize, hasInitialized]);

  // 处理最小化切换
  const handleMinimizedToggle = () => {
    const newMinimizedState = !isMinimized;

    // 如果当前是全屏模式且要切换到最小化，先退出全屏
    if (newMinimizedState && isFullscreen) {
      toggleFullscreen(); // 先退出全屏
    }

    setIsMinimized(newMinimizedState);
    console.log('🚀 handleMinimizedToggle 最小化状态', newMinimizedState);
    if (managedPosition) {
      // 如果是最小化状态，执行自动吸附动画
      if (newMinimizedState) {
        const element = internalRef.current;
        if (element) {
          // 获取当前位置和尺寸
          const currentRect = element.getBoundingClientRect();
          const currentWidth = internalSize.width;
          const currentHeight = internalSize.height;

          // 计算当前中心点
          const currentCenterX = internalPosition.left + currentWidth / 2;
          const currentCenterY = internalPosition.top + currentHeight / 2;

          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // 检测离左右哪个边近
          const isCloserToLeft = currentCenterX < windowWidth / 2;

          // 计算目标位置（基于最小化后的尺寸）
          const margin = 20;
          const targetX = isCloserToLeft
            ? margin
            : windowWidth - actualMinimizedSize.width - margin;

          // 确保不会超出屏幕边界
          const safeTargetX = Math.max(
            margin,
            Math.min(targetX, windowWidth - actualMinimizedSize.width - margin),
          );

          // 确保垂直位置也在安全范围内
          const safeTargetY = Math.max(
            margin,
            Math.min(internalPosition.top, windowHeight - actualMinimizedSize.height - margin),
          );

          // 计算目标中心点
          const targetCenterX = safeTargetX + actualMinimizedSize.width;
          const targetCenterY = safeTargetY + actualMinimizedSize.height / 2;

          // 计算最终位置（保持中心点对齐）
          const finalX = targetCenterX - actualMinimizedSize.width;
          const finalY = targetCenterY - actualMinimizedSize.height / 2;

          // 设置动画过渡
          element.style.transition =
            'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
          element.style.transformOrigin = 'center center';

          // 同时改变位置和尺寸
          element.style.left = `${finalX}px`;
          element.style.top = `${finalY}px`;
          element.style.width = `${actualMinimizedSize.width}px`;
          element.style.height = `${actualMinimizedSize.height}px`;

          // 动画完成后更新 React 状态并清理样式
          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              element.style.transformOrigin = '';

              // 同步更新 React 状态
              setInternalPosition({
                left: finalX,
                top: finalY,
              });
              setInternalSize(actualMinimizedSize);
            }
          }, 300);
        }
      } else {
        // 恢复正常大小时，执行扩展动画
        const element = internalRef.current;
        if (element) {
          // 获取当前最小化状态的中心点
          const currentCenterX = internalPosition.left + actualMinimizedSize.width / 2;
          const currentCenterY = internalPosition.top + actualMinimizedSize.height / 2;

          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // 计算屏幕中心位置（目标位置）
          const targetCenterX = windowWidth / 2;
          const targetCenterY = windowHeight / 2;

          // 计算最终位置（保持中心点对齐）
          const finalX = targetCenterX - initialSize.width / 2;
          const finalY = targetCenterY - initialSize.height / 2;

          // 确保不会超出屏幕边界
          const margin = 20;
          const safeTargetX = Math.max(
            margin,
            Math.min(finalX, windowWidth - initialSize.width - margin),
          );
          const safeTargetY = Math.max(
            margin,
            Math.min(finalY, windowHeight - initialSize.height - margin),
          );

          // 设置动画过渡
          element.style.transition =
            'left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out';
          element.style.transformOrigin = 'center center';

          // 同时改变位置和尺寸
          element.style.left = `${safeTargetX}px`;
          element.style.top = `${safeTargetY}px`;
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;

          // 动画完成后更新 React 状态并清理样式
          setTimeout(() => {
            if (element) {
              element.style.transition = '';
              element.style.transformOrigin = '';

              // 同步更新 React 状态
              setInternalPosition({
                left: safeTargetX,
                top: safeTargetY,
              });
              setInternalSize(initialSize);

              // 从最小化恢复时，重新播放本地视频
              if (hasInitialized && callServiceRef.current) {
                callServiceRef.current.onRestoreFromMinimized();
              }
            }
          }, 300);
        }
      }
    }

    // 调用用户回调通知状态变化
    onMinimizedChange?.(newMinimizedState);
  };

  // 处理最小化状态下的点击 - 恢复正常布局
  const handleMinimizedClick = (event?: React.MouseEvent) => {
    // 如果正在拖动或刚完成拖动，不处理点击事件
    if (isDragging || justFinishedDrag) {
      return;
    }

    if (isMinimized) {
      handleMinimizedToggle();
    }
  };

  // 渲染视频窗口 - 支持根据尺寸控制昵称显示
  const renderVideoWindow = React.useCallback(
    (video: VideoWindowProps, index: number, windowSize?: { width: number; height: number }) => {
      // 🔧 防止在通话结束后继续尝试播放视频
      if (!isInCall && callStatus === 'idle') {
        return (
          <div
            key={video.id}
            className={`${prefixCls}-window`}
            style={{ width: '100%', height: '100%', background: '#000' }}
          >
            <div>通话已结束</div>
          </div>
        );
      }

      const videoClass = classNames(`${prefixCls}-window`, {
        [`${prefixCls}-window-local`]: video.isLocalVideo,
        [`${prefixCls}-window-muted`]: video.muted,
      });

      // 昵称显示阈值：窗口宽度或高度小于140px时不显示昵称
      const NICKNAME_DISPLAY_THRESHOLD = 140;
      const shouldShowNickname =
        callMode === 'group' && // 只有群组通话时才显示昵称
        (!windowSize ||
          (windowSize.width >= NICKNAME_DISPLAY_THRESHOLD &&
            windowSize.height >= NICKNAME_DISPLAY_THRESHOLD));

      const shouldShowIndicator = windowSize && windowSize.width >= 75; // main 布局小，小窗的大小

      // 判断是否应该显示视频（而不是头像）
      // 🔧 修复：处理 cameraEnabled 为 null 的情况，只要摄像头开启就显示视频区域
      const normalizedCameraEnabled =
        video.cameraEnabled === null ? false : Boolean(video.cameraEnabled);
      const normalizedIsWaiting = video.isWaiting === undefined ? false : Boolean(video.isWaiting);
      const shouldShowVideo = normalizedCameraEnabled && !normalizedIsWaiting; // 摄像头开启且不在等待状态时显示video区域

      // 🔧 调试日志
      if (video.isLocalVideo) {
        console.log('🔧 UI渲染判断:', {
          videoId: video.id,
          原始cameraEnabled: video.cameraEnabled,
          标准化cameraEnabled: normalizedCameraEnabled,
          原始isWaiting: video.isWaiting,
          标准化isWaiting: normalizedIsWaiting,
          hasVideoElement: !!video.videoElement,
          hasStream: !!video.stream,
          shouldShowVideo,
          显示模式: shouldShowVideo
            ? '显示视频区域'
            : !normalizedCameraEnabled
            ? '摄像头关闭-显示头像'
            : '摄像头开启但无视频-显示黑屏',
        });
      }
      console.log('---->renderVideoWindow', video);
      if (video.videoElement) {
        alert(video.id);
      }
      // 移除调试日志
      // if (shouldShowVideo && !video.videoElement && !video.stream) {
      //   console.log('---->video', video);
      //   alert(video.id);
      // }
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
              ) : // 🔧 改进：当 stream 为空但需要显示视频时，尝试从 CallService 获取视频流
              // <video
              //   ref={ref => {
              //     if (ref) {
              //       // 🔧 使用更可靠的重复播放检测
              //       const videoTrackId = ref.dataset.playingTrackId;
              //       const videoUserId = video.isLocalVideo
              //         ? 'local'
              //         : video.id.replace('remote-', '');

              //       // 尝试播放视频轨道
              //       const playVideoTrack = async () => {
              //         try {
              //           // 获取CallService实例
              //           const callService = (window as any).callService;
              //           if (!callService) {
              //             console.log('CallService不可用');
              //             return;
              //           }

              //           let targetTrack = null;
              //           let trackId = '';

              //           if (
              //             video.isLocalVideo &&
              //             normalizedCameraEnabled &&
              //             callService.rtc?.localVideoTrack
              //           ) {
              //             // 本地视频轨道
              //             targetTrack = callService.rtc.localVideoTrack;
              //             trackId = targetTrack?.getTrackId?.() || 'local-track';

              //             // 检查是否已经在播放这个轨道
              //             if (videoTrackId === trackId) {
              //               console.log('本地视频轨道已经在播放，跳过:', trackId);
              //               return;
              //             }

              //             console.log('🎬 通过 renderVideoWindow 播放本地视频轨道到:', ref);
              //             await targetTrack.play(ref);
              //             ref.dataset.playingTrackId = trackId;
              //             ref.dataset.trackPlayed = 'true';
              //             console.log('✅ 本地视频轨道播放成功');
              //           } else if (!video.isLocalVideo && normalizedCameraEnabled) {
              //             // 🔧 远程视频轨道 - 使用新的Map方式获取
              //             targetTrack = callService.getRemoteVideoTrack?.(videoUserId);
              //             trackId = targetTrack?.getTrackId?.() || '';

              //             if (!targetTrack) {
              //               console.log(`❌ 最终找不到用户 ${videoUserId} 的视频轨道`, {
              //                 videoUserId,
              //                 videoId: video.id,
              //                 所有远程轨道: callService.getAllRemoteVideoTracks?.(),
              //               });
              //               return;
              //             }

              //             // 检查是否已经在播放这个轨道
              //             if (videoTrackId === trackId) {
              //               console.log('远程视频轨道已经在播放，跳过:', trackId);
              //               return;
              //             }

              //             await targetTrack.play(ref);
              //             ref.dataset.playingTrackId = trackId;
              //             ref.dataset.trackPlayed = 'true';
              //             console.log('✅ 远程视频轨道播放成功');
              //           } else {
              //             console.log('🚫 无法播放视频 - 检查条件:', {
              //               isLocalVideo: video.isLocalVideo,
              //               原始cameraEnabled: video.cameraEnabled,
              //               标准化cameraEnabled: normalizedCameraEnabled,
              //               hasCallService: !!callService,
              //               hasRtc: !!callService?.rtc,
              //               hasLocalVideoTrack: !!callService?.rtc?.localVideoTrack,
              //               videoId: video.id,
              //               userId: videoUserId,
              //               shouldShowVideo: shouldShowVideo,
              //               hasGetRemoteVideoTrack:
              //                 typeof callService.getRemoteVideoTrack === 'function',
              //             });
              //           }
              //         } catch (error) {
              //           console.warn('❌ 视频轨道播放失败:', error);
              //           // 清除失败的标记，允许下次重试
              //           ref.dataset.playingTrackId = '';
              //           ref.dataset.trackPlayed = '';
              //         }
              //       };

              //       // 延迟执行播放，确保DOM已经准备好
              //       setTimeout(playVideoTrack, 100);
              //     }
              //   }}
              //   className={`${prefixCls}-video`}
              //   data-video-id={video.id}
              //   data-local={video.isLocalVideo}
              //   muted={video.muted}
              //   autoPlay
              //   playsInline
              //   style={
              //     video.isLocalVideo || video.id === 'local'
              //       ? {
              //           transform: 'scaleX(-1) !important',
              //         }
              //       : undefined
              //   }
              // />
              video.avatar ? (
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
              )
            ) : (
              // 🔧 修复：区分主动关闭摄像头和摄像头开启但无视频流两种情况
              <div className={`${prefixCls}-placeholder`}>
                {
                  // 摄像头主动关闭：显示头像
                  video.avatar ? (
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
                  )
                }
              </div>
            )}

            {/* 用户昵称和摄像头/麦克风状态指示器 - 根据窗口尺寸控制显示 */}
            {video.nickname && shouldShowIndicator && (
              <div className={`${prefixCls}-video-info`}>
                {shouldShowNickname && (
                  <div className={`${prefixCls}-nickname`}>{video.nickname}</div>
                )}
                {(video.muted ||
                  talkingUsers.includes(video.id.replace('remote-', '')) ||
                  talkingUsers.includes(chatClient?.user)) && (
                  <div className={`${prefixCls}-indicators`}>
                    {/* {!video.cameraEnabled && (
                    <Icon type="VIDEO_CAMERA_SLASH" width={14} height={14} color="#F9FAFA" />
                  )} */}
                    {video.muted && <Icon type="MIC_OFF" width={14} height={14} color="#F9FAFA" />}
                    {/* 🔧 新增：说话指示器 - 只在多人视频通话中显示，样式与MIC_OFF保持一致 */}
                    {/* 🔧 优化：当MIC_OFF显示时，不显示SPEAKER_WAVE_2，确保同一时间只有一个指示器 */}
                    {callMode === 'group' &&
                      !video.muted && // 🔧 新增：只有在不静音时才显示说话指示器
                      !video.isLocalVideo &&
                      (() => {
                        // 从视频ID中提取用户ID（remote-xxx -> xxx）
                        const userId = video.id.replace('remote-', '');
                        const isTalking = talkingUsers.includes(userId);

                        return isTalking ? (
                          <Icon type="SPEAKER_WAVE_2" width={14} height={14} color="#4CAF50" />
                        ) : null;
                      })()}
                    {/* 🔧 新增：本地用户说话指示器 */}
                    {callMode === 'group' &&
                      !video.muted && // 🔧 新增：只有在不静音时才显示说话指示器
                      video.isLocalVideo &&
                      (() => {
                        // 🔧 修复：使用实际的用户ID而不是'local'
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

            {/* 🔧 新增：网络质量指示器 - 只在群组通话时显示，位于右上角 */}
            {callMode === 'group' &&
              shouldShowIndicator &&
              (() => {
                // 获取当前用户的网络质量数据
                const currentUserId = video.isLocalVideo
                  ? chatClient?.user || 'local'
                  : video.id.replace('remote-', '');
                const userNetworkQuality = networkQuality?.[currentUserId];

                if (!userNetworkQuality) return null;

                // 根据是否为本地视频选择使用上行或下行网络质量
                const qualityLevel = video.isLocalVideo
                  ? userNetworkQuality.uplinkNetworkQuality
                  : userNetworkQuality.downlinkNetworkQuality;

                // 0 表示未知，不显示
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

  // 处理预览模式下的接听通话
  const handlePreviewAccept = async () => {
    // 🔧 群通话不再需要预览模式，只处理被叫方接听逻辑
    if (invitation) {
      // 🔧 预览模式：CallKit内部自动调用answerCall，现在有防重复调用保护
      if (hasInitialized && callServiceRef.current) {
        try {
          console.log('🔧 预览模式：CallKit内部自动执行接听操作');
          await callServiceRef.current.answerCall(true);
        } catch (error) {
          console.error('🔧 预览模式：CallKit自动接听失败:', error);
        }
      }

      // 被叫方接听邀请的逻辑
      setIsShowingPreview(false);
      setCallStatus('connected');
      setIsInCall(true);
      setLocalVideo(null);

      // 触发外部回调通知接听事件（用户不需要再手动调用answerCall）
      onInvitationAcceptRef.current?.(invitation);
    }
  };

  // 处理预览模式下的拒绝
  const handlePreviewReject = async () => {
    // 🔧 预览模式：CallKit内部自动调用answerCall，现在有防重复调用保护
    if (hasInitialized && callServiceRef.current && invitation) {
      try {
        console.log('🔧 预览模式：CallKit内部自动执行拒绝操作');
        await callServiceRef.current.answerCall(false);
      } catch (error) {
        console.error('🔧 预览模式：CallKit自动拒绝失败:', error);
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
      console.log('🔧 handlePreviewReject: 重置CallKit尺寸和位置到初始状态');
      setInternalSize(initialSize);
      setInternalPosition(initialPosition);

      // 立即应用到DOM，避免视觉闪烁
      const element = internalRef.current;
      if (element) {
        element.style.width = `${initialSize.width}px`;
        element.style.height = `${initialSize.height}px`;
        element.style.left = `${initialPosition.left}px`;
        element.style.top = `${initialPosition.top}px`;
      }
    }

    // 触发外部回调通知拒绝事件（用户不需要再手动调用answerCall）
    if (currentInvitation) {
      onInvitationRejectRef.current?.(currentInvitation);
    }

    // 🔧 重置群组通话相关状态到初始值
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
      // 被叫方拒绝邀请时，调用 answerCall(false) 发送 refuse 消息
      callServiceRef.current.answerCall(false);
      callServiceRef.current.hangup('refuse');
    }
  };

  // 处理添加参与者按钮点击
  const handleAddParticipant = async () => {
    console.log('🚀 打开用户选择弹窗:', {
      effectiveGroupMembers数量: effectiveGroupMembers.length,
      effectiveGroupMembers: effectiveGroupMembers.map(m => ({
        userId: m.userId,
        nickname: m.nickname,
      })),
      currentParticipants数量: currentParticipants.length,
      currentParticipants: currentParticipants.map(p => ({
        userId: p.userId,
        nickname: p.nickname,
      })),
      isInitiatingGroupCall,
      webimGroupMembers数量: webimGroupMembers.length,
    });

    // 🔧 被邀请方添加参与者时的群成员获取逻辑
    if (
      effectiveGroupMembers.length === 0 && // 没有群成员数据
      chatClient &&
      hasInitialized &&
      callServiceRef.current
    ) {
      console.log('🔍 被邀请方需要获取群成员，开始动态获取...', {
        hasUserInfoProvider: !!userInfoProvider,
        effectiveGroupMembersLength: effectiveGroupMembers.length,
      });

      try {
        // 从 CallService 获取当前通话信息
        const currentCallInfo = callServiceRef.current.getCurrentCallInfo();
        const targetGroupId = currentCallInfo?.groupId;

        console.log('📞 当前通话信息:', {
          callInfo: currentCallInfo,
          groupId: targetGroupId,
          callType: currentCallInfo?.type,
        });

        if (targetGroupId) {
          setIsLoadingGroupMembers(true);

          // 🔧 使用封装的方法获取群成员（内部已包含完整错误处理）
          const formattedMembers = await fetchGroupMembers(targetGroupId, '被邀请方添加参与者');
          setWebimGroupMembers(formattedMembers);
          setIsLoadingGroupMembers(false);

          console.log('✅ 被邀请方动态获取群成员成功:', {
            获取成员数量: formattedMembers.length,
            成员列表: formattedMembers.map((m: any) => `${m.userId}(${m.nickname})`),
          });
        } else {
          console.warn('⚠️ 无法获取群组ID，可能不是群组通话');
          // 如果无法获取群组ID，提供一个提示但仍然打开选择界面
          console.log('📝 无群组ID，使用传统groupMembers或提示用户');
        }
      } catch (error) {
        console.error('❌ 获取通话信息失败:', error);
      }
    } else if (effectiveGroupMembers.length === 0) {
      // 没有任何群成员数据，且不满足动态获取条件
      console.log('⚠️ 无群成员数据且无法动态获取:', {
        hasWebimConnection: !!chatClient,
        hasCallService: !!callServiceRef.current,
        hasInitialized,
        effectiveGroupMembersLength: effectiveGroupMembers.length,
      });
    }
    if (currentParticipants.length >= maxVideos) {
      setUserSelectDisabled(true);
    } else {
      setUserSelectDisabled(false);
    }

    setIsUserSelectVisible(true);
    setSelectedNewMembers([]); // 重置选择
  };

  // 处理用户选择取消
  const handleUserSelectCancel = () => {
    setIsUserSelectVisible(false);
    setUserSelectDisabled(false);
    setSelectedNewMembers([]);
    // 如果是发起群组通话的情况，重置相关状态
    if (isInitiatingGroupCall) {
      setIsInitiatingGroupCall(false);

      // 🔧 重置真实通话状态到初始值
      setRealCallMuted(false);
      setRealCallCameraEnabled(true);
      setRealCallSpeakerEnabled(true);

      // 🔧 新增：重置CallKit尺寸和位置到初始状态
      if (managedPosition) {
        console.log('🔧 handleUserSelectCancel: 重置CallKit尺寸和位置到初始状态');
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        // 立即应用到DOM，避免视觉闪烁
        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${initialPosition.left}px`;
          element.style.top = `${initialPosition.top}px`;
        }
      }

      // 🔧 重置群组通话相关状态到初始值
      setGroupCallType('video');
      setGroupId('');
      setWebimGroupMembers([]);
      setIsLoadingGroupMembers(false);

      // 🔧 新增：用户取消选择，reject Promise
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

          // 🔧 新增：在发起通话前，将选中用户的信息设置到CallService中
          const userInfoMap: { [key: string]: any } = {};
          selectedUsers.forEach((user: any) => {
            userInfoMap[user.userId] = {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            };
          });
          // 添加本地用户信息（如果可以从webimConnection获取）
          if (chatClient?.user) {
            // 异步获取本地用户头像
            getLocalUserAvatar().then(avatarUrl => {
              userInfoMap[chatClient.user] = {
                nickname: t('callkit.localUser.me') as string,
                avatarUrl: avatarUrl,
              };
              if (callServiceRef.current) {
                callServiceRef.current.setUserInfo(userInfoMap);
                console.log('📝 发起群组通话前，已设置用户信息到CallService:', {
                  用户数量: Object.keys(userInfoMap).length,
                  用户列表: Object.entries(userInfoMap).map(
                    ([userId, info]) => `${userId}(${info.nickname})`,
                  ),
                });
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

          // 🔧 获取群组名称：使用groupInfoProvider或默认值
          let finalGroupName = groupId; // 默认使用groupId作为群组名称
          let finalGroupAvatar: string | undefined;
          if (groupInfoProvider) {
            try {
              console.log('🔍 获取群组信息:', groupId);
              const groupInfos = await Promise.resolve(groupInfoProvider([groupId]));
              const groupInfo = groupInfos.find(info => info.groupId === groupId);
              if (groupInfo?.groupName) {
                finalGroupName = groupInfo.groupName;
                finalGroupAvatar = groupInfo.groupAvatar;
                console.log('✅ 成功获取群组名称:', finalGroupName);
              } else {
                console.log('⚠️ 未获取到群组名称，使用默认值:', finalGroupName);
              }
            } catch (error) {
              console.warn('❌ 获取群组信息失败，使用默认值:', error);
            }
          } else {
            console.log('⚠️ 未配置groupInfoProvider，使用groupId作为群组名称');
          }

          // 🔧 设置主叫目标群组信息，用于Header显示
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
          // 🔧 新增：在添加参与者前，将新成员的信息设置到CallService中
          const newUserInfoMap: { [key: string]: any } = {};
          newMembers.forEach((user: any) => {
            newUserInfoMap[user.userId] = {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            };
          });
          callServiceRef.current.setUserInfo(newUserInfoMap);
          console.log('📝 添加参与者前，已设置新成员信息到CallService:', {
            新成员数量: newMembers.length,
            新成员列表: newMembers.map((m: any) => `${m.userId}(${m.nickname})`),
          });

          // 真实通话：使用 CallService 发送邀请
          const memberIds = newMembers.map(user => user.userId);
          callServiceRef.current.addParticipants(memberIds).then(success => {
            if (success) {
              console.log('成功邀请新成员:', memberIds);

              // 为新邀请的成员创建等待状态的视频窗口
              const newVideoWindows: VideoWindowProps[] = newMembers.map(user => ({
                id: `remote-${user.userId}`, // 使用与CallService一致的ID格式
                muted: false,
                cameraEnabled: false, // 初始状态显示头像，等待连接
                nickname: user.nickname,
                avatar: user.avatarUrl, // 不使用假数据，让组件显示默认图标
                isWaiting: true, // 标记为等待状态
              }));

              // 添加到现有视频列表中
              setVideos(prevVideos => [...prevVideos, ...newVideoWindows]);

              // 为邀请的用户设置超时定时器
              const timeoutMs = autoRejectTime * 1000; // 转换为毫秒
              newMembers.forEach(user => {
                setInvitationTimer(user.userId, timeoutMs, handleInvitationTimeout);
              });

              console.log(
                `🔧 为 ${newMembers.length} 个用户设置邀请定时器，超时时间: ${autoRejectTime}秒`,
              );
            } else {
              console.error('邀请新成员失败');
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
        // 如果没有配置 userInfoProvider，返回 undefined 让组件显示默认图标
        return undefined;
      }

      try {
        const userInfos = await Promise.resolve(userInfoProvider([userId]));
        const userInfo = userInfos.find((info: any) => info.userId === userId);
        return userInfo?.avatarUrl; // 不使用假数据，让组件显示默认图标
      } catch (error) {
        console.warn(`获取用户 ${userId} 头像失败:`, error);
        return undefined; // 不使用假数据，让组件显示默认图标
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

  // 控制按钮事件处理函数 - 整合真实通话功能
  const handleMuteToggle = React.useCallback(
    (newMuted: boolean) => {
      if (hasInitialized && callServiceRef.current) {
        // 使用 CallService 的实际控制方法
        const actualMuted = callServiceRef.current.toggleMute();
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
      console.log('🔧 CallKit: handleCameraToggle被调用', {
        newCameraEnabled,
        hasInitialized,
        hasCallService: !!callServiceRef.current,
        currentRealCameraEnabled: realCallCameraEnabled,
      });

      if (hasInitialized && callServiceRef.current) {
        // 使用 CallService 的实际控制方法（异步）
        try {
          console.log('🔧 CallKit: 调用 CallService.toggleCamera()');
          const actualCameraEnabled = await callServiceRef.current.toggleCamera();
          console.log('🔧 CallKit: toggleCamera返回结果:', actualCameraEnabled);

          // 更新内部状态
          setRealCallCameraEnabled(actualCameraEnabled);
          // 触发外部回调，传递实际状态
          onCameraToggle?.(actualCameraEnabled);
        } catch (error) {
          console.error('切换摄像头失败:', error);
        }
      } else {
        // 演示模式，直接调用外部回调
        console.log('🔧 CallKit: 演示模式，直接调用外部回调');
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

  const handleScreenShareToggle = React.useCallback(
    (newScreenSharing: boolean) => {
      // 屏幕共享控制目前使用外部回调
      onScreenShareToggle?.(newScreenSharing);
    },
    [onScreenShareToggle],
  );

  const handleHangup = React.useCallback(() => {
    console.log('🔧 handleHangup 被调用', {
      hasInitialized,
      hasCallService: !!callServiceRef.current,
      callStatus,
      isShowingPreview,
    });

    if (hasInitialized && callServiceRef.current) {
      const isInPreviewMode = isShowingPreview && callStatus === 'calling';
      console.log('🚀 准备挂断通话:', { isInPreviewMode, callStatus, isShowingPreview });
      callServiceRef.current.cancelGroupCall();
      callServiceRef.current.hangup('hangup', isInPreviewMode);
      callServiceRef.current.sendHangupMessage();
      // 演示模式，重置组件状态
      setVideos([]);
      setIsInCall(false);
      setCallStatus('idle');
      setIsShowingPreview(false);
      setLocalVideo(null);
      setInvitation(null);
      setCallMode('video'); // 重置为初始模式

      // 🔧 重置真实通话状态到初始值
      setRealCallMuted(false);
      setRealCallCameraEnabled(true);
      setRealCallSpeakerEnabled(true);
      // 小窗状态恢复
      setIsMinimized(false);
      setNetworkQuality(null);

      // 🔧 新增：重置CallKit尺寸和位置到初始状态
      if (managedPosition) {
        console.log('🔧 handleHangup: 重置CallKit尺寸和位置到初始状态');
        setInternalSize(initialSize);
        setInternalPosition(initialPosition);

        // 立即应用到DOM，避免视觉闪烁
        const element = internalRef.current;
        if (element) {
          element.style.width = `${initialSize.width}px`;
          element.style.height = `${initialSize.height}px`;
          element.style.left = `${initialPosition.left}px`;
          element.style.top = `${initialPosition.top}px`;
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
    }
    // 触发外部回调
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

  // 合并群成员数据：优先使用从IM SDK获取的数据，如果没有则使用传统的groupMembers
  const effectiveGroupMembers = React.useMemo(() => {
    if (webimGroupMembers.length > 0) {
      console.log('📋 使用从startGroupCall动态获取的群成员数据:', webimGroupMembers);
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

  // 🔧 计算多人视频通话相关状态
  const groupCallStatus = React.useMemo(() => {
    const isGroupCall = callMode === 'group';
    const hasParticipants = displayVideos.some(video => !video.isLocalVideo);

    // 🔧 修复：对群通话使用RTC层面的真实连接状态，避免UI状态误导
    const rtcCallStatus = hasInitialized ? callServiceRef.current?.getCallStatus?.() : null;
    const isRTCConnected = rtcCallStatus === CALL_STATUS.IN_CALL;

    // UI层面的连接状态（用于界面显示）
    const isUIConnected = callStatus === 'connected' || isRTCConnected;

    // 🔧 对于群通话，控制按钮使用RTC真实状态；其他通话使用UI状态
    const isConnected = isGroupCall ? isRTCConnected : isUIConnected;

    console.log('🔧 CallKit: 多人视频通话状态计算', {
      callMode,
      displayVideos: displayVideos.map(v => ({ id: v.id, isLocalVideo: v.isLocalVideo })),
      callStatus,
      rtcCallStatus,
      hasInitialized,
      isGroupCall,
      hasParticipants,
      isUIConnected,
      isRTCConnected,
      isConnected: isConnected,
    });

    return {
      isGroupCall,
      hasParticipants,
      isConnected,
    };
  }, [callMode, displayVideos, callStatus, hasInitialized]);

  // 缓存稳定的布局props，避免频繁重新渲染
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
    ],
  );

  // 计算当前通话中的成员，用于UserSelect的checkedUsers
  const currentParticipants = React.useMemo(() => {
    // 如果是发起群组通话，从effectiveGroupMembers中找到当前用户
    if (isInitiatingGroupCall && chatClient?.user) {
      const currentUser = effectiveGroupMembers.find(member => member.userId === chatClient.user);
      return currentUser ? [currentUser] : [];
    }

    // 否则返回当前通话的所有参与者
    const result = displayVideos.map(video => {
      // 处理不同的video.id格式，提取真实的userId
      let userId = video.id;
      if (video.isLocalVideo) {
        // 本地视频：使用当前登录用户的ID
        userId = chatClient?.user || 'local';
      } else if (video.id.startsWith('remote-')) {
        // 远程视频：从'remote-userId'格式中提取userId
        userId = video.id.replace('remote-', '');
      }

      // 从effectiveGroupMembers中找到对应的用户信息
      const memberInfo = effectiveGroupMembers.find(member => member.userId === userId);
      if (memberInfo) {
        return memberInfo;
      }

      // 如果在effectiveGroupMembers中找不到，使用video中的信息
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
      {/* 通知系统 */}
      {notificationContextHolder}

      {/* 用户选择弹窗 */}
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
          {/* 使用完整布局管理器 - 包含所有布局逻辑 */}
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

export default CallKit;
