import React, {
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useEffect,
  memo,
} from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config';
import { Header } from '../header/Header';
import { Icon } from '../../component/icon/Icon';
import Button from '../../component/button';
import { useNotification } from '../../component/notification';
import { useContainerSize } from './hooks/useContainerSize';
import { useFullscreen } from './hooks/useFullscreen';
import { useResizable } from './hooks/useResizable';
import { useDraggable } from './hooks/useDraggable';
import { FullLayoutManager } from './layouts/FullLayoutManager';
import CallControls from './components/CallControls';
import InvitationContent from './components/InvitationContent';
import UserSelect from '../userSelect/UserSelect';
import { CallService, CALL_STATUS, CALL_TYPE, CallServiceConfig } from './services/CallService';
import type {
  CallKitProps,
  CallKitRef,
  VideoWindowProps,
  LayoutOptions,
  InvitationInfo,
} from './types/index';
import type { FullLayoutProps } from './types/layout';
import { LayoutMode } from './types/index';
import './styles/index.scss';

/**
 * 被缓存的FullLayoutManager包装器
 * 将callDuration从其他props中分离，避免时间更新导致的视频重新渲染
 */
const MemoizedFullLayoutManager = memo<FullLayoutProps>(
  (props: FullLayoutProps) => {
    return <FullLayoutManager {...props} />;
  },
  (prevProps, nextProps) => {
    // 自定义比较函数：忽略callDuration的变化，只在其他props变化时才重新渲染
    const { callDuration: prevCallDuration, ...prevOtherProps } = prevProps;
    const { callDuration: nextCallDuration, ...nextOtherProps } = nextProps;

    // 使用浅比较，忽略callDuration
    const prevKeys = Object.keys(prevOtherProps);
    const nextKeys = Object.keys(nextOtherProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (
        prevOtherProps[key as keyof typeof prevOtherProps] !==
        nextOtherProps[key as keyof typeof nextOtherProps]
      ) {
        return false;
      }
    }

    return true;
  },
);

MemoizedFullLayoutManager.displayName = 'MemoizedFullLayoutManager';

/**
 * 生成随机channel字符串
 * @param length 字符串长度，默认8位
 * @returns 随机字符串
 */
const generateRandomChannel = (length: number = 8): string => {
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
};

/**
 * CallKit主组件 - 重构后的视频通话组件
 */
const CallKit = forwardRef<CallKitRef, CallKitProps>((props, ref) => {
  const {
    className,
    style,
    prefix,

    // 布局相关
    layoutMode = LayoutMode.MULTI_PARTY,
    maxVideos,
    aspectRatio = 1,
    gap = 6,

    // 🔧 多人通话背景图片设置
    backgroundImage,

    // 通话模式（可选，如果不提供则从邀请信息推断）
    callMode: propCallMode,

    // 控制按钮相关
    showControls = true,
    muted = false,
    cameraEnabled = true,
    speakerEnabled = true,
    screenSharing = false,

    // 真实通话相关配置
    webimConnection,
    enableRealCall = false,

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
    managedPosition = false,
    initialPosition = { left: 50, top: 50 },
    initialSize = { width: 800, height: 600 },

    // 最小化相关
    minimizedSize = { width: 80, height: 64 },
    callDuration = '00:00:00',
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
    userSelectTitle = '添加参与者',

    // 新增：基于 groupId 自动获取群成员的方式
    webimGroupId,
    userInfoProvider,
    groupInfoProvider,

    // 事件回调
    onVideoClick,
    onMuteToggle,
    onCameraToggle,
    onSpeakerToggle,
    onScreenShareToggle,
    onHangup,
    onAddParticipant,
    onInvitationAccept,
    onInvitationReject,
    onCallStart,
    onCallEnd,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('callkit', prefix);

  // 内部状态管理
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [videos, setVideos] = useState<VideoWindowProps[]>([]);
  const [callMode, setCallMode] = useState<'video' | 'audio' | 'group'>(propCallMode || 'video');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>(
    'idle',
  );
  const [isShowingPreview, setIsShowingPreview] = useState(false);
  const [localVideo, setLocalVideo] = useState<VideoWindowProps | null>(null);

  // 通知系统
  const [notificationApi, notificationContextHolder] = useNotification({
    placement: 'top',
    duration: 0, // 不自动关闭
    maxCount: 1, // 最多显示一个邀请通知
  });

  // 内置位置和尺寸管理状态
  const [internalPosition, setInternalPosition] = React.useState(initialPosition);
  const [internalSize, setInternalSize] = React.useState(initialSize);
  const internalRef = React.useRef<HTMLDivElement>(null);

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
  // 注释：currentWebimGroupId 不再需要，因为 startGroupCall 直接使用传入的 groupId

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

  // 使用 useCallback 稳定回调函数引用
  const handleStateChange = React.useCallback((state: any) => {
    console.log('CallService state change:', state);
  }, []);

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

      setVideos(videos);
      setIsInCall(true);
      setCallStatus('connected');
      setIsShowingPreview(false); // 结束预览模式
      setLocalVideo(null); // 清除预览时的localVideo状态
      setInvitation(null); // 清除邀请信息

      // 同步 CallService 的初始状态
      if (enableRealCall && callServiceRef.current) {
        setRealCallMuted(callServiceRef.current.isMuted());
        setRealCallCameraEnabled(callServiceRef.current.isCameraEnabled());
        // 🔧 确保扬声器状态始终为开启，避免被叫接听时状态异常
        setRealCallSpeakerEnabled(true);
      }

      onCallStartRef.current?.(videos);
    },
    [enableRealCall],
  );

  const handleCallEnd = React.useCallback(
    (reason: string) => {
      setVideos([]);
      setIsInCall(false);
      setCallStatus('idle');
      setIsShowingPreview(false);
      setLocalVideo(null);
      setInvitation(null);
      setCallMode(propCallMode || 'video'); // 重置为初始模式
      setCallerTargetInfo(null); // 🔧 清理主叫目标信息
      onCallEndRef.current?.();
    },
    [propCallMode],
  );

  const handleInvitationReceived = React.useCallback((invitation: any) => {
    setInvitation(invitation);
    setCallStatus('ringing');
  }, []);

  const handleCallDurationUpdate = React.useCallback((duration: string) => {
    // 可以添加通话时长更新逻辑
  }, []);

  // 新增：远程用户发布流回调
  const handleUserPublished = React.useCallback(
    (user: any, mediaType: string) => {
      console.log('远程用户发布流:', user, mediaType);
      props.onUserPublished?.(user, mediaType);
    },
    [props.onUserPublished],
  );

  // 新增：远程用户离开回调
  const handleUserLeft = React.useCallback(
    (user: any, reason: string) => {
      console.log('远程用户离开:', user, reason);
      props.onUserLeft?.(user, reason);
    },
    [props.onUserLeft],
  );

  // 新增：远程用户停止发布流回调
  const handleUserUnpublished = React.useCallback(
    (user: any, mediaType: string) => {
      console.log('远程用户停止发布流:', user, mediaType);
      props.onUserUnpublished?.(user, mediaType);
    },
    [props.onUserUnpublished],
  );

  // 使用 ref 存储最新的状态，避免回调函数重新创建
  const isShowingPreviewRef = useRef(isShowingPreview);
  const isInCallRef = useRef(isInCall);
  const callModeRef = useRef(callMode);

  // 💡 注释掉自动获取群成员的 useEffect，避免与 startGroupCall 重复
  // 现在统一在 startGroupCall 方法中动态获取群成员，避免重复请求

  // React.useEffect(() => {
  //   // 这段代码已移至 startGroupCall 方法中，避免重复逻辑
  // }, [webimGroupId, currentWebimGroupId, webimConnection, userInfoProvider]);

  // 更新状态引用
  React.useEffect(() => {
    isShowingPreviewRef.current = isShowingPreview;
    isInCallRef.current = isInCall;
    callModeRef.current = callMode;
  }, [isShowingPreview, isInCall, callMode]);

  // 🔧 通用的群成员获取方法（封装重复逻辑）
  const fetchGroupMembers = React.useCallback(
    async (groupId: string, context: string = '通用') => {
      console.log(`🚀 ${context}：调用 fetchGroupMembers，参数:`, {
        groupId,
        hasWebimConnection: !!webimConnection,
        hasUserInfoProvider: !!userInfoProvider,
      });

      if (!groupId || !webimConnection || !userInfoProvider) {
        console.warn(`❌ ${context}：缺少必要参数`, {
          groupId: !!groupId,
          webimConnection: !!webimConnection,
          userInfoProvider: !!userInfoProvider,
        });
        return [];
      }

      // 检查 webimConnection 和 listGroupMembers 方法是否存在
      if (typeof webimConnection.listGroupMembers !== 'function') {
        console.error(`❌ ${context}：webimConnection.listGroupMembers 方法不可用`);
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

          const response = await webimConnection.listGroupMembers({
            groupId: groupId,
            pageNum: pageNum,
            pageSize: pageSize,
          });

          if (response?.data && Array.isArray(response.data)) {
            const pageUserIds = response.data
              .map((item: any) => item.owner || item.member)
              .filter(Boolean);

            console.log(`📋 ${context}：第 ${pageNum} 页获取到 ${pageUserIds.length} 个成员`);
            allMemberUserIds.push(...pageUserIds);

            // 判断是否还有下一页数据
            // 方法1：检查isLast字段
            if (response.isLast === true) {
              console.log(`✅ ${context}：通过 isLast 字段判断已获取完所有成员`);
              hasMoreData = false;
            }
            // 方法2：检查返回数据量是否小于pageSize
            else if (pageUserIds.length < pageSize) {
              console.log(
                `✅ ${context}：返回数据量 ${pageUserIds.length} < ${pageSize}，已获取完所有成员`,
              );
              hasMoreData = false;
            } else {
              pageNum++;
            }
          } else {
            console.warn(
              `❌ ${context}：第 ${pageNum} 页获取群成员失败，响应数据为空或格式错误:`,
              response,
            );
            hasMoreData = false;
          }
        }

        console.log(`📊 ${context}：分页获取完成，总共获取到 ${allMemberUserIds.length} 个群成员`);

        if (allMemberUserIds.length > 0) {
          const memberUserIds = allMemberUserIds;
          console.log(`📋 ${context}：获取到群成员UserIds:`, memberUserIds);

          // 使用 userInfoProvider 批量获取用户详细信息
          try {
            const membersWithInfo = await Promise.resolve(userInfoProvider(memberUserIds));

            // 确保返回的是数组
            if (!Array.isArray(membersWithInfo)) {
              console.warn(
                `❌ ${context}：userInfoProvider 返回的不是数组:`,
                typeof membersWithInfo,
              );
              return [];
            }

            const formattedMembers = membersWithInfo
              .map((userInfo: any) => ({
                userId: userInfo.userId,
                nickname: userInfo.nickname || userInfo.userId,
                avatarUrl:
                  userInfo.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.userId}`,
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
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            }));
            console.log(
              `👥 ${context}：使用基础信息创建群成员列表:`,
              basicMembers.length,
              '个成员',
            );

            // 🔧 新增：将基础用户信息设置到CallService中
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
    [webimConnection, userInfoProvider],
  );

  // 新增：远程视频流准备就绪回调
  const handleRemoteVideoReady = React.useCallback(
    (videoInfo: VideoWindowProps) => {
      console.log('🔄 handleRemoteVideoReady 收到视频信息:', {
        视频ID: videoInfo.id,
        是否本地: videoInfo.isLocalVideo,
        昵称: videoInfo.nickname,
        摄像头状态: videoInfo.cameraEnabled,
        是否等待: videoInfo.isWaiting,
        是否移除: videoInfo.removed,
      });

      if (videoInfo.isLocalVideo) {
        // 本地视频：根据视频ID和当前状态决定更新位置
        const currentIsShowingPreview = isShowingPreviewRef.current;
        const currentIsInCall = isInCallRef.current;
        const currentCallMode = callModeRef.current;

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
            console.log('🔄 更新现有远程视频:', {
              视频ID: videoInfo.id,
              索引: existingIndex,
              更新后视频数量: newVideos.length,
              旧状态: {
                cameraEnabled: oldVideoInfo.cameraEnabled,
                isWaiting: oldVideoInfo.isWaiting,
                muted: oldVideoInfo.muted,
              },
              新状态: {
                cameraEnabled: videoInfo.cameraEnabled,
                isWaiting: videoInfo.isWaiting,
                muted: videoInfo.muted,
              },
            });
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

      props.onRemoteVideoReady?.(videoInfo);
    },
    [props.onRemoteVideoReady], // 只依赖于 props.onRemoteVideoReady
  );

  // 初始化 CallService
  React.useEffect(() => {
    if (enableRealCall && webimConnection) {
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
        connection: webimConnection,
        onStateChange: handleStateChange,
        onCallStart: handleCallStart,
        onCallEnd: handleCallEnd,
        onInvitationReceived: handleInvitationReceived,
        onCallDurationUpdate: handleCallDurationUpdate,
        onUserPublished: handleUserPublished,
        onUserLeft: handleUserLeft,
        onUserUnpublished: handleUserUnpublished,
        onRemoteVideoReady: handleRemoteVideoReady,
        // 用户信息提供器：优先使用 userInfoProvider，兼容旧的 userInfoProvider
        userInfoProvider: createUserInfoProvider(),
        // 群组信息提供器
        groupInfoProvider: createGroupInfoProvider(),
      };

      callServiceRef.current = new CallService(config);

      // 暴露 callService 到全局，供 renderVideoWindow 使用
      (window as any).callService = callServiceRef.current;

      // 🔧 新增：设置本地用户信息
      if (webimConnection?.user) {
        // 异步获取本地用户头像
        getLocalUserAvatar().then(avatarUrl => {
          const localUserInfo = {
            [webimConnection.user]: {
              nickname: '我',
              avatarUrl: avatarUrl,
            },
          };
          if (callServiceRef.current) {
            callServiceRef.current.setUserInfo(localUserInfo);
            console.log('📝 CallService初始化后，已设置本地用户信息:', {
              userId: webimConnection.user,
              nickname: '我',
              avatarUrl: avatarUrl,
            });
          }
        });
      }

      // 🔧 新增：设置视频元素准备好回调
      callServiceRef.current.setVideoElementReadyCallback((videoId: string) => {
        console.log(`🎯 CallKit 收到视频元素准备好通知: ${videoId}`);
        // 这里可以触发 UI 更新或其他逻辑
      });

      return () => {
        // 清理时移除全局引用
        (window as any).callService = null;
        callServiceRef.current?.destroy();
      };
    }
  }, [
    enableRealCall,
    webimConnection,
    handleStateChange,
    handleCallStart,
    handleCallEnd,
    handleInvitationReceived,
    handleCallDurationUpdate,
    handleUserPublished,
    handleUserLeft,
    handleUserUnpublished,
    handleRemoteVideoReady,
    // userInfo, // If userInfo is a prop, uncomment and pass it.
  ]);

  // 暴露给外部的方法
  useImperativeHandle(
    ref,
    () => ({
      showInvitation: (invitationInfo: InvitationInfo) => {
        setInvitation(invitationInfo);
        setCallStatus('ringing'); // 被叫：响铃中/被邀请中

        // 设置通话模式
        const currentCallMode = invitationInfo.type === 'group' ? 'group' : invitationInfo.type;
        setCallMode(currentCallMode);

        // 如果是群组视频通话，进入群组视频布局的预览模式
        if (invitationInfo.type === 'group') {
          setIsShowingPreview(true);
          setLocalVideo({
            id: 'local-preview',
            isLocalVideo: true,
            nickname: '我',
            muted: false,
            cameraEnabled: true,
            stream: undefined, // 这里应该是实际的本地视频流
          });
        } else if (invitationInfo.type === 'video') {
          // 1v1视频通话的预览模式
          setLocalVideo({
            id: 'local-preview',
            isLocalVideo: true,
            nickname: '我',
            muted: false,
            cameraEnabled: true,
            stream: undefined, // 这里应该是实际的本地视频流
          });
        }
      },
      hideInvitation: () => {
        setInvitation(null);
        setCallStatus('idle');
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode(propCallMode || 'video'); // 重置为初始模式
      },
      startCall: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
        setIsInCall(true);
        setCallStatus('connected'); // 已接通/通话中
        setIsShowingPreview(false);
        setLocalVideo(null);
        // 设置通话模式：优先使用 prop，否则从邀请信息推断
        if (propCallMode) {
          setCallMode(propCallMode);
        } else if (invitation) {
          setCallMode(invitation.type === 'audio' ? 'audio' : invitation.type);
        }
        setInvitation(null);
        onCallStartRef.current?.(callVideos);
      },
      endCall: () => {
        setVideos([]);
        setIsInCall(false);
        setCallStatus('idle'); // 空闲
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode(propCallMode || 'video'); // 重置为初始模式
        onCallEndRef.current?.();
      },
      updateVideos: (callVideos: VideoWindowProps[]) => {
        setVideos(callVideos);
      },
      // 新增方法：主叫发起呼叫
      startCalling: () => {
        setCallStatus('calling'); // 主叫：呼叫中
      },
      isInCall: () => isInCall,
      hasInvitation: () => !!invitation,
      getCurrentInvitation: () => invitation,
      getCallStatus: () => callStatus,
      // 新增方法：显示预览界面
      showPreview: (callModeToSet?: 'video' | 'audio' | 'group') => {
        setIsShowingPreview(true);
        if (callModeToSet) {
          setCallMode(callModeToSet);
        }
      },
      // 新增方法：主动发起多人通话
      startGroupCall: async (groupId: string, callType: 'video' | 'audio' = 'video') => {
        console.log('🚀 startGroupCall 调用，当前webimConnection:', webimConnection);
        console.log('🚀 startGroupCall 调用，当前userInfoProvider:', !!userInfoProvider);

        setIsInitiatingGroupCall(true);
        setGroupCallType(callType);
        setCallMode('group');
        setSelectedNewMembers([]);
        setGroupId(groupId);

        // 获取当前最新的 webimConnection（避免闭包问题）
        const currentWebimConnection = webimConnection;
        const currentUserInfoProvider = userInfoProvider;

        console.log('🔍 startGroupCall中使用的连接对象:', {
          原始webimConnection: webimConnection,
          当前webimConnection: currentWebimConnection,
          是否相同: webimConnection === currentWebimConnection,
          连接对象类型: typeof currentWebimConnection,
          有listGroupMembers: !!(
            currentWebimConnection && typeof currentWebimConnection.listGroupMembers === 'function'
          ),
        });

        // 如果提供了webimConnection和userInfoProvider，直接获取当前群组的成员
        if (currentWebimConnection && currentUserInfoProvider) {
          setIsLoadingGroupMembers(true);

          // 🔧 使用封装的方法获取群成员
          const formattedMembers = await fetchGroupMembers(groupId, 'startGroupCall');
          setWebimGroupMembers(formattedMembers);
          setIsLoadingGroupMembers(false);
        } else {
          // 没有配置IM连接和provider，清空群成员数据
          setWebimGroupMembers([]);
        }

        setIsUserSelectVisible(true);
      },

      // 真实通话相关方法
      startRealCall: async (options: {
        to: string;
        callType: 'video' | 'audio';
        groupId?: string;
        groupName?: string;
        members?: string[];
      }) => {
        if (callServiceRef.current && webimConnection) {
          // 设置通话模式
          const currentCallMode =
            options.members && options.members.length > 1 ? 'group' : options.callType;
          setCallMode(currentCallMode);

          // 🔧 设置主叫目标信息，用于Header显示
          if (currentCallMode === 'group') {
            // 群组通话：设置群组信息
            let finalGroupName = options.groupName || options.groupId || '群组通话';
            let finalGroupAvatar: string | undefined;

            // 尝试使用groupInfoProvider获取更详细的群组信息
            if (options.groupId && groupInfoProvider) {
              try {
                const groupInfos = await Promise.resolve(groupInfoProvider([options.groupId]));
                const groupInfo = groupInfos.find(info => info.groupId === options.groupId);
                if (groupInfo) {
                  finalGroupName = groupInfo.groupName || finalGroupName;
                  finalGroupAvatar = groupInfo.groupAvatar;
                }
              } catch (error) {
                console.warn('获取群组信息失败:', error);
              }
            }

            setCallerTargetInfo({
              targetGroupId: options.groupId,
              targetGroupName: finalGroupName,
              targetGroupAvatar: finalGroupAvatar,
            });
          } else {
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

            // 🔧 修复：主叫方发起1v1通话时，设置被叫方用户信息到CallService
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
          }

          // 群组视频通话：发起方不进入预览模式，直接进入群组视频布局
          if (currentCallMode === 'group') {
            setCallStatus('calling'); // 主叫：呼叫中
            setIsInCall(true); // 直接进入通话状态

            // 创建群组视频布局数据：发起方的视频 + 被邀请方的等待状态
            const groupVideos: VideoWindowProps[] = [
              {
                id: 'local',
                isLocalVideo: true,
                muted: false,
                cameraEnabled: options.callType === 'video',
                nickname: '我',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', // 临时使用默认头像，后续会通过 userInfoProvider 更新
              },
              // 为被邀请方创建等待状态的视频窗口
              ...(options.members?.map((member, index) => ({
                id: `remote-${member}`, // 使用与CallService一致的ID格式
                muted: false,
                cameraEnabled: false, // 初始状态显示头像，等待连接
                nickname: member,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member}`,
                isWaiting: true, // 标记为等待状态
              })) || []),
            ];

            setVideos(groupVideos);
          } else {
            // 1v1通话：发起方进入预览模式
            setIsShowingPreview(true);
            setCallStatus('calling'); // 主叫：呼叫中

            // 如果是视频通话，设置本地视频预览
            if (options.callType === 'video') {
              setLocalVideo({
                id: 'local-preview',
                isLocalVideo: true,
                nickname: '我',
                muted: false,
                cameraEnabled: true,
                stream: undefined, // 实际的本地视频流由 CallService 创建
              });
            }
          }

          // 使用WebIM.conn.getUniqueId()生成唯一的callId
          const callId = generateRandomChannel(10);

          // 生成随机channel
          const channel = generateRandomChannel(8);

          const callTypeEnum =
            options.callType === 'video'
              ? options.members && options.members.length > 1
                ? CALL_TYPE.VIDEO_MULTI
                : CALL_TYPE.VIDEO_1V1
              : options.members && options.members.length > 1
              ? CALL_TYPE.AUDIO_MULTI
              : CALL_TYPE.AUDIO_1V1;

          callServiceRef.current.startCall({
            callId,
            channel,
            chatType: 'singleChat',
            callType: callTypeEnum,
            to: options.to,
            groupId: options.groupId,
            groupName: options.groupName,
            members: options.members,
          });
        }
      },

      answerRealCall: async (result: boolean) => {
        if (callServiceRef.current && invitation) {
          // 🔧 新增：被叫方接受1v1通话邀请时，设置主叫方用户信息用于Header显示
          if (invitation.type === 'video' || invitation.type === 'audio') {
            console.log('🎯 被叫方接受1v1通话，设置主叫方用户信息...');

            // 从invitation中获取主叫方信息
            const callerUserId = invitation.id; // invitation.id是主叫方的userId
            const callerNickname = invitation.callerName || callerUserId;
            const callerAvatar = invitation.callerAvatar;

            console.log('📝 被叫方获取到主叫方信息:', {
              userId: callerUserId,
              nickname: callerNickname,
              avatar: callerAvatar,
            });

            // 设置主叫方用户信息到CallService
            const callerUserInfo = {
              [callerUserId]: {
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

          // 🔧 新增：被邀请方接受群组通话邀请时，获取群成员信息确保nickname正确显示
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

            if (groupId && webimConnection && userInfoProvider) {
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
                有webimConnection: !!webimConnection,
                有userInfoProvider: !!userInfoProvider,
                邀请信息: invitation,
              });
            }
          }

          callServiceRef.current.answerCall(result);
        }
      },

      hangupRealCall: (reason?: string) => {
        if (callServiceRef.current) {
          callServiceRef.current.hangup(reason);
        }
      },

      setUserInfo: (userInfo: { [key: string]: any }) => {
        if (callServiceRef.current) {
          callServiceRef.current.setUserInfo(userInfo);
        }
      },

      // 音视频控制方法
      toggleMute: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.toggleMute();
        }
        return false;
      },

      toggleCamera: () => {
        if (callServiceRef.current) {
          return callServiceRef.current.toggleCamera();
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

      addParticipants: async (newMembers: string[]) => {
        if (callServiceRef.current) {
          return await callServiceRef.current.addParticipants(newMembers);
        }
        return false;
      },
    }),
    [
      invitation,
      isInCall,
      callStatus,
      webimConnection,
      userInfoProvider,
      groupInfoProvider,
      enableRealCall,
    ],
  );

  // 邀请通知 key
  const invitationNotificationKey = React.useMemo(() => 'callkit-invitation', []);

  // 使用 ref 存储最新的回调函数和 API，避免无限循环
  const onInvitationAcceptRef = useRef(onInvitationAccept);
  const onInvitationRejectRef = useRef(onInvitationReject);
  const onCallStartRef = useRef(onCallStart);
  const onCallEndRef = useRef(onCallEnd);
  const notificationApiRef = useRef(notificationApi);

  // 更新回调函数的引用
  React.useEffect(() => {
    onInvitationAcceptRef.current = onInvitationAccept;
    onInvitationRejectRef.current = onInvitationReject;
    onCallStartRef.current = onCallStart;
    onCallEndRef.current = onCallEnd;
    notificationApiRef.current = notificationApi;
  }, [onInvitationAccept, onInvitationReject, onCallStart, onCallEnd, notificationApi]);

  // 监听 propCallMode 变化
  React.useEffect(() => {
    if (propCallMode) {
      setCallMode(propCallMode);
    }
  }, [propCallMode]);

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

          if (webimConnection && userInfoProvider) {
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
              有webimConnection: !!webimConnection,
              有userInfoProvider: !!userInfoProvider,
              邀请groupId: invitationData.groupId,
            });
          }
        }

        // 如果是多人视频通话，需要先创建本地视频轨道
        if (currentCallMode === 'group' && enableRealCall && callServiceRef.current) {
          try {
            console.log('多人视频通话：直接接听，开始创建本地视频轨道');
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } catch (error) {
            console.error('多人视频通话：创建本地视频轨道失败:', error);
          }
        }

        setCallStatus('connected'); // 接听后进入通话状态
        setIsInCall(true);
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);
        onInvitationAcceptRef.current?.(invitationData);
      };

      const handleReject = (invitationData: any) => {
        notificationApiRef.current.destroy(invitationNotificationKey);
        setCallStatus('idle'); // 拒绝后回到空闲状态
        setInvitation(null);
        setIsShowingPreview(false);
        setLocalVideo(null);
        setCallMode(propCallMode || 'video'); // 重置为初始模式
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
        console.log('设置通话模式为:', currentCallMode, '原始type:', invitation.type);

        // 🔧 新增：被邀请方点击通知进入预览时，获取群成员信息确保nickname正确显示
        if (currentCallMode === 'group' && invitation.groupId) {
          console.log('🎯 被邀请方进入群组通话预览，开始获取群成员信息...');

          if (webimConnection && userInfoProvider) {
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
              有webimConnection: !!webimConnection,
              有userInfoProvider: !!userInfoProvider,
              邀请groupId: invitation.groupId,
            });
          }
        }

        // 如果是多人视频通话，创建本地视频轨道
        if (currentCallMode === 'group' && enableRealCall && callServiceRef.current) {
          try {
            console.log('多人视频通话：点击invitation，开始创建本地视频轨道');
            await callServiceRef.current.createLocalVideoTrackForGroupCall();
          } catch (error) {
            console.error('多人视频通话：创建本地视频轨道失败:', error);
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
            />
          </div>
        ),
        closable: false,
        duration: 0,
        icon: null,
        style: {
          background: '#000',
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

  // 获取实际的布局模式
  const actualLayoutMode = useMemo(() => {
    return isMinimized ? LayoutMode.MINIMIZED : layoutMode;
  }, [isMinimized, layoutMode]);

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
    console.log('🎥 视频显示计算:', {
      原始视频数量: videos.length,
      最大视频限制: maxVideos,
      最终显示数量: result.length,
      视频列表: videos.map(v => `${v.id}(${v.isLocalVideo ? '本地' : '远程'})`),
    });
    return result;
  }, [videos, maxVideos]);

  // 布局选项
  const layoutOptions: LayoutOptions = React.useMemo(
    () => ({
      aspectRatio,
      gap,
      headerHeight: 60,
      controlsHeight: showControls ? 60 : 0,
      maxVideos,
    }),
    [aspectRatio, gap, showControls, maxVideos],
  );

  // 容器样式
  const containerStyle = React.useMemo(() => {
    if (managedPosition) {
      // 内置位置管理：合并内部状态和用户样式
      return {
        position: 'absolute' as const,
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
      ? { width: 108, height: 192 } // 1v1视频模式使用视频窗口尺寸
      : minimizedSize; // 其他模式使用默认尺寸
  }, [callMode, minimizedSize]);

  // 处理最小化切换
  const handleMinimizedToggle = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

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
          const targetCenterX = safeTargetX + actualMinimizedSize.width / 2;
          const targetCenterY = safeTargetY + actualMinimizedSize.height / 2;

          // 计算最终位置（保持中心点对齐）
          const finalX = targetCenterX - actualMinimizedSize.width / 2;
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
              if (enableRealCall && callServiceRef.current) {
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

      // 判断是否应该显示视频（而不是头像）
      const shouldShowVideo =
        video.videoElement || video.stream || (video.cameraEnabled && !video.isWaiting); // 摄像头开启且非等待状态时显示video元素

      // 🔧 调试：输出详细的视频显示判断信息
      if (!video.isLocalVideo) {
        console.log(`📹 视频显示判断 ${video.id}:`, {
          videoElement: !!video.videoElement,
          stream: !!video.stream,
          cameraEnabled: video.cameraEnabled,
          isWaiting: video.isWaiting,
          shouldShowVideo: shouldShowVideo,
          nickname: video.nickname,
        });
      }
      console.log('------>video', video);
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
                <video
                  className={`${prefixCls}-video`}
                  data-video-id={video.id}
                  data-local={video.isLocalVideo}
                  muted={video.muted}
                  autoPlay
                  playsInline
                />
              ) : video.stream ? (
                <video
                  ref={ref => {
                    // 优化：只在stream变化时才设置srcObject，避免重复设置导致闪烁
                    if (ref && video.stream && ref.srcObject !== video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  className={`${prefixCls}-video`}
                  data-video-id={video.id}
                  data-local={video.isLocalVideo}
                  muted={video.muted}
                  autoPlay
                  playsInline
                />
              ) : (
                // 🔧 改进：当 stream 为空但需要显示视频时，尝试从 CallService 获取视频流
                <video
                  ref={ref => {
                    if (ref) {
                      // 🔧 使用更可靠的重复播放检测
                      const videoTrackId = ref.dataset.playingTrackId;
                      const videoUserId = video.isLocalVideo
                        ? 'local'
                        : video.id.replace('remote-', '');

                      // 尝试播放视频轨道
                      const playVideoTrack = async () => {
                        try {
                          // 获取CallService实例
                          const callService = (window as any).callService;
                          if (!callService) {
                            console.log('CallService不可用');
                            return;
                          }

                          let targetTrack = null;
                          let trackId = '';

                          if (
                            video.isLocalVideo &&
                            video.cameraEnabled &&
                            callService.rtc?.localVideoTrack
                          ) {
                            // 本地视频轨道
                            targetTrack = callService.rtc.localVideoTrack;
                            trackId = targetTrack?.getTrackId?.() || 'local-track';

                            // 检查是否已经在播放这个轨道
                            if (videoTrackId === trackId) {
                              console.log('本地视频轨道已经在播放，跳过:', trackId);
                              return;
                            }

                            console.log('🎬 通过 renderVideoWindow 播放本地视频轨道到:', ref);
                            await targetTrack.play(ref);
                            ref.dataset.playingTrackId = trackId;
                            ref.dataset.trackPlayed = 'true';
                            console.log('✅ 本地视频轨道播放成功');
                          } else if (!video.isLocalVideo && video.cameraEnabled) {
                            // 🔧 远程视频轨道 - 使用新的Map方式获取
                            targetTrack = callService.getRemoteVideoTrack?.(videoUserId);
                            trackId = targetTrack?.getTrackId?.() || '';

                            if (!targetTrack) {
                              console.log(`❌ 找不到用户 ${videoUserId} 的视频轨道`);
                              return;
                            }

                            // 检查是否已经在播放这个轨道
                            if (videoTrackId === trackId) {
                              console.log('远程视频轨道已经在播放，跳过:', trackId);
                              return;
                            }

                            console.log('🎬 通过 renderVideoWindow 播放远程视频轨道到:', ref);
                            console.log('远程视频轨道状态:', {
                              hasTrack: !!targetTrack,
                              trackId: trackId,
                              videoId: video.id,
                              userId: videoUserId,
                              isLocalVideo: video.isLocalVideo,
                            });

                            await targetTrack.play(ref);
                            ref.dataset.playingTrackId = trackId;
                            ref.dataset.trackPlayed = 'true';
                            console.log('✅ 远程视频轨道播放成功');
                          } else {
                            console.log('🚫 无法播放视频 - 检查条件:', {
                              isLocalVideo: video.isLocalVideo,
                              cameraEnabled: video.cameraEnabled,
                              hasCallService: !!callService,
                              hasRtc: !!callService?.rtc,
                              hasLocalVideoTrack: !!callService?.rtc?.localVideoTrack,
                              videoId: video.id,
                              userId: videoUserId,
                              shouldShowVideo: shouldShowVideo,
                              hasGetRemoteVideoTrack:
                                typeof callService.getRemoteVideoTrack === 'function',
                            });
                          }
                        } catch (error) {
                          console.warn('❌ 视频轨道播放失败:', error);
                          // 清除失败的标记，允许下次重试
                          ref.dataset.playingTrackId = '';
                          ref.dataset.trackPlayed = '';
                        }
                      };

                      // 延迟执行播放，确保DOM已经准备好
                      setTimeout(playVideoTrack, 100);
                    }
                  }}
                  className={`${prefixCls}-video`}
                  data-video-id={video.id}
                  data-local={video.isLocalVideo}
                  muted={video.muted}
                  autoPlay
                  playsInline
                />
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
                    {video.isWaiting && (
                      <div
                        className={`${prefixCls}-waiting-overlay`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'inherit',
                        }}
                      >
                        <div
                          className={`${prefixCls}-waiting-dots`}
                          style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0s',
                            }}
                          />
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0.16s',
                            }}
                          />
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0.32s',
                            }}
                          />
                        </div>
                      </div>
                    )}
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
                    <Icon type="PERSON_SINGLE_FILL" width="40%" height="40%" color="#ffffff" />
                    {/* 等待状态显示加载动画 */}
                    {video.isWaiting && (
                      <div
                        className={`${prefixCls}-waiting-overlay`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'inherit',
                        }}
                      >
                        <div
                          className={`${prefixCls}-waiting-dots`}
                          style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0s',
                            }}
                          />
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0.16s',
                            }}
                          />
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              animation: 'bounce 1.4s infinite ease-in-out both',
                              animationDelay: '0.32s',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 用户昵称和摄像头/麦克风状态指示器 - 根据窗口尺寸控制显示 */}
            {video.nickname && shouldShowNickname && (
              <div className={`${prefixCls}-video-info`}>
                <div className={`${prefixCls}-nickname`}>{video.nickname}</div>
                {(!video.cameraEnabled || video.muted) && (
                  <div className={`${prefixCls}-indicators`}>
                    {!video.cameraEnabled && (
                      <Icon type="VIDEO_CAMERA_SLASH" width={14} height={14} color="#F9FAFA" />
                    )}
                    {video.muted && <Icon type="MIC_OFF" width={14} height={14} color="#F9FAFA" />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    [prefixCls, callMode, onVideoClick],
  );

  // 处理预览模式下的接听
  const handlePreviewAccept = () => {
    setIsShowingPreview(false);
    setCallStatus('connected');
    setIsInCall(true);
    setLocalVideo(null);
    if (invitation) {
      onInvitationAcceptRef.current?.(invitation);
    }
  };

  // 处理预览模式下的拒绝
  const handlePreviewReject = () => {
    setIsShowingPreview(false);
    setCallStatus('idle');
    setInvitation(null);
    setLocalVideo(null);
    setCallMode(propCallMode || 'video'); // 重置为初始模式
    if (invitation) {
      onInvitationRejectRef.current?.(invitation);
    }

    if (callServiceRef.current) {
      // 被叫方拒绝邀请时，调用 answerCall(false) 发送 refuse 消息
      callServiceRef.current.answerCall(false);
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
      webimConnection &&
      userInfoProvider &&
      enableRealCall &&
      callServiceRef.current
    ) {
      console.log('🔍 被邀请方需要获取群成员，开始动态获取...');

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
        hasWebimConnection: !!webimConnection,
        hasuserInfoProvider: !!userInfoProvider,
        hasCallService: !!callServiceRef.current,
        enableRealCall,
        effectiveGroupMembersLength: effectiveGroupMembers.length,
      });
    }

    setIsUserSelectVisible(true);
    setSelectedNewMembers([]); // 重置选择
  };

  // 处理用户选择取消
  const handleUserSelectCancel = () => {
    setIsUserSelectVisible(false);
    setSelectedNewMembers([]);
    // 如果是发起群组通话的情况，重置相关状态
    if (isInitiatingGroupCall) {
      setIsInitiatingGroupCall(false);
    }
  };

  // 处理用户选择确认
  const handleUserSelectConfirm = async (selectedUsers: any[]) => {
    setIsUserSelectVisible(false);

    if (isInitiatingGroupCall) {
      // 发起群组通话的情况
      if (selectedUsers.length > 0) {
        if (enableRealCall && callServiceRef.current) {
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
          if (webimConnection?.user) {
            // 异步获取本地用户头像
            getLocalUserAvatar().then(avatarUrl => {
              userInfoMap[webimConnection.user] = {
                nickname: '我',
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

          // 群组视频通话：发起方直接进入群组视频布局，不进入预览模式
          setCallStatus('calling'); // 主叫：呼叫中
          setCallMode('group');
          setIsInCall(true); // 直接进入通话状态

          // 创建群组视频布局数据：发起方的视频 + 被邀请方的等待状态
          const groupVideos: VideoWindowProps[] = [
            {
              id: 'local',
              isLocalVideo: true,
              muted: false,
              cameraEnabled: groupCallType === 'video',
              nickname: '我',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', // 临时使用默认头像，后续会通过 userInfoProvider 更新
            },
            // 添加选中的成员，初始状态为等待连接（显示头像）
            ...selectedUsers.map((user, index) => ({
              id: `remote-${user.userId}`, // 使用与CallService一致的ID格式
              muted: false,
              cameraEnabled: false, // 初始状态显示头像，等待连接
              nickname: user.nickname,
              avatar:
                user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`,
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

          callServiceRef.current.startCall({
            callId: generateRandomChannel(10),
            channel: generateRandomChannel(8),
            chatType: 'groupChat',
            callType: groupCallType === 'video' ? 2 : 3, // VIDEO_MULTI = 2, AUDIO_MULTI = 3
            to: members, // 主要接收者
            groupId: groupId,
            groupName: finalGroupName, // 使用获取到的群组名称或默认值
            members,
          });
        } else {
          // 演示模式：创建模拟视频流数据
          const mockVideos: VideoWindowProps[] = [
            {
              id: 'local',
              isLocalVideo: true,
              muted: false,
              cameraEnabled: groupCallType === 'video',
              nickname: '我',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', // 临时使用默认头像，后续会通过 userInfoProvider 更新
            },
            // 添加选中的成员
            ...selectedUsers.map((user, index) => ({
              id: user.userId,
              muted: false,
              cameraEnabled: groupCallType === 'video' && Math.random() > 0.3, // 70% 概率开启摄像头
              nickname: user.nickname,
              avatar:
                user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`,
            })),
          ];

          // 开始通话
          setIsInCall(true);
          setCallStatus('connected');
          setVideos(mockVideos);

          // 调用回调
          onCallStartRef.current?.(mockVideos);
        }

        // 重置状态
        setIsInitiatingGroupCall(false);
        setSelectedNewMembers([]);
      } else {
        // 没有选择成员，重置状态
        setIsInitiatingGroupCall(false);
        setSelectedNewMembers([]);
      }
    } else {
      // 通话中添加参与者的情况
      const currentParticipantIds = displayVideos.map(video => {
        // 使用与currentParticipants相同的逻辑提取userId
        if (video.isLocalVideo) {
          return webimConnection?.user || 'local';
        } else if (video.id.startsWith('remote-')) {
          return video.id.replace('remote-', '');
        }
        return video.id;
      });

      console.log('🔍 当前参与者ID列表:', currentParticipantIds);
      console.log(
        '🔍 待选择的用户:',
        selectedUsers.map(u => u.userId),
      );

      const newMembers = selectedUsers.filter(user => !currentParticipantIds.includes(user.userId));

      console.log(
        '🔍 过滤后的新成员:',
        newMembers.map(u => u.userId),
      );

      if (newMembers.length > 0) {
        if (enableRealCall && callServiceRef.current) {
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
                avatar:
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`,
                isWaiting: true, // 标记为等待状态
              }));

              // 添加到现有视频列表中
              setVideos(prevVideos => [...prevVideos, ...newVideoWindows]);
            } else {
              console.error('邀请新成员失败');
            }
          });
        } else {
          // 演示模式：创建新的视频窗口并添加到状态中
          const newVideoWindows: VideoWindowProps[] = newMembers.map(user => ({
            id: `remote-${user.userId}`, // 使用一致的ID格式
            muted: false,
            cameraEnabled: Math.random() > 0.3, // 70% 概率开启摄像头（演示模式）
            nickname: user.nickname,
            avatar:
              user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`,
            isWaiting: false, // 演示模式不需要等待状态
          }));

          // 添加到现有视频列表中
          setVideos(prevVideos => [...prevVideos, ...newVideoWindows]);

          console.log(
            '📹 演示模式：添加新参与者到视频列表:',
            newVideoWindows.map(v => ({
              id: v.id,
              userId: v.id.replace('remote-', ''),
              nickname: v.nickname,
            })),
          );

          // 调用外部提供的邀请回调
          onAddParticipant?.(newMembers);
        }
      }

      setSelectedNewMembers([]);
    }
  };

  const getUserAvatar = React.useCallback(
    async (userId: string): Promise<string> => {
      if (!userInfoProvider) {
        // 如果没有配置 userInfoProvider，返回默认头像
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
      }

      try {
        const userInfos = await Promise.resolve(userInfoProvider([userId]));
        const userInfo = userInfos.find((info: any) => info.userId === userId);
        return userInfo?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
      } catch (error) {
        console.warn(`获取用户 ${userId} 头像失败:`, error);
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
      }
    },
    [userInfoProvider],
  );

  // 🔧 新增：获取本地用户头像的辅助函数
  const getLocalUserAvatar = React.useCallback(async (): Promise<string> => {
    if (!webimConnection?.user) {
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=me';
    }

    return await getUserAvatar(webimConnection.user);
  }, [webimConnection?.user, getUserAvatar]);

  // 处理用户选择变化
  const handleUserSelect = (user: any, users: any[]) => {
    setSelectedNewMembers(users);
  };

  // 控制按钮事件处理函数 - 整合真实通话功能
  const handleMuteToggle = React.useCallback(
    (newMuted: boolean) => {
      if (enableRealCall && callServiceRef.current) {
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
    [enableRealCall, onMuteToggle],
  );

  const handleCameraToggle = React.useCallback(
    (newCameraEnabled: boolean) => {
      if (enableRealCall && callServiceRef.current) {
        // 使用 CallService 的实际控制方法
        const actualCameraEnabled = callServiceRef.current.toggleCamera();
        // 更新内部状态
        setRealCallCameraEnabled(actualCameraEnabled);
        // 触发外部回调，传递实际状态
        onCameraToggle?.(actualCameraEnabled);
      } else {
        // 演示模式，直接调用外部回调
        onCameraToggle?.(newCameraEnabled);
      }
    },
    [enableRealCall, onCameraToggle],
  );

  const handleSpeakerToggle = React.useCallback(
    (newSpeakerEnabled: boolean) => {
      if (enableRealCall && callServiceRef.current) {
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
    [enableRealCall, onSpeakerToggle],
  );

  const handleScreenShareToggle = React.useCallback(
    (newScreenSharing: boolean) => {
      // 屏幕共享控制目前使用外部回调
      onScreenShareToggle?.(newScreenSharing);
    },
    [onScreenShareToggle],
  );

  const handleHangup = React.useCallback(() => {
    if (enableRealCall && callServiceRef.current) {
      // 使用 CallService 挂断真实通话
      // 🔧 在预览模式下，主叫方点击 "End" 按钮时，应该发送取消消息给对方
      const isInPreviewMode = isShowingPreview && callStatus === 'calling';
      callServiceRef.current.hangup('normal', isInPreviewMode);
    } else {
      // 演示模式，重置组件状态
      setVideos([]);
      setIsInCall(false);
      setCallStatus('idle');
      setIsShowingPreview(false);
      setLocalVideo(null);
      setInvitation(null);
      setCallMode(propCallMode || 'video'); // 重置为初始模式
    }
    // 触发外部回调
    onHangup?.();
  }, [enableRealCall, onHangup, isShowingPreview, callStatus]);

  // 计算当前通话中的成员，用于UserSelect的checkedUsers
  const currentParticipants = React.useMemo(() => {
    const result = displayVideos.map(video => {
      // 处理不同的video.id格式，提取真实的userId
      let userId = video.id;
      if (video.isLocalVideo) {
        // 本地视频：使用当前登录用户的ID（如果可以从webimConnection获取）
        userId = webimConnection?.user || 'local';
      } else if (video.id.startsWith('remote-')) {
        // 远程视频：从'remote-userId'格式中提取userId
        userId = video.id.replace('remote-', '');
      }

      return {
        userId: userId,
        nickname: video.nickname,
        avatarUrl: video.avatar,
      };
    });

    // 添加调试日志
    console.log('🎯 currentParticipants 计算结果:', {
      displayVideos数量: displayVideos.length,
      displayVideos详情: displayVideos.map(v => ({
        id: v.id,
        nickname: v.nickname,
        isLocalVideo: v.isLocalVideo,
      })),
      currentParticipants: result.map(p => ({
        userId: p.userId,
        nickname: p.nickname,
      })),
      当前用户ID: webimConnection?.user,
    });

    return result;
  }, [displayVideos, webimConnection?.user]);

  // 合并群成员数据：优先使用从IM SDK获取的数据，如果没有则使用传统的groupMembers
  const effectiveGroupMembers = React.useMemo(() => {
    if (webimGroupMembers.length > 0) {
      console.log('📋 使用从startGroupCall动态获取的群成员数据:', webimGroupMembers);
      return webimGroupMembers;
    }
    console.log('📋 使用传统的groupMembers数据:', groupMembers);
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
      else if (enableRealCall && callServiceRef.current) {
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
  }, [callMode, invitation, callerTargetInfo, enableRealCall, displayVideos]);

  // 缓存稳定的布局props，避免因callDuration更新导致的重新渲染
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
      muted: enableRealCall ? realCallMuted : muted,
      cameraEnabled: enableRealCall ? realCallCameraEnabled : cameraEnabled,
      speakerEnabled: enableRealCall ? realCallSpeakerEnabled : speakerEnabled,
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
      enableRealCall,
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
    ],
  );

  return (
    <>
      {/* 通知系统 */}
      {notificationContextHolder}

      {/* 用户选择弹窗 */}
      <UserSelect
        title={
          isLoadingGroupMembers
            ? '正在加载群成员...' // 显示加载状态
            : isInitiatingGroupCall
            ? `发起${groupCallType === 'video' ? '视频' : '语音'}群组通话`
            : userSelectTitle
        }
        open={isUserSelectVisible}
        onCancel={handleUserSelectCancel}
        onConfirm={handleUserSelectConfirm}
        enableMultipleSelection
        onUserSelect={handleUserSelect}
        users={effectiveGroupMembers}
        checkedUsers={isInitiatingGroupCall ? [] : currentParticipants}
        closable={true}
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
          <MemoizedFullLayoutManager {...stableLayoutProps} callDuration={callDuration} />
        </div>
      )}
    </>
  );
});

CallKit.displayName = 'CallKit';

export default CallKit;
