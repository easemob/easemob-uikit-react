import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { useNotification } from '../../component/notification';
import Button from '../../component/button';
import CallKit from '../../module/callkit/CallKit';
import {
  VideoWindowProps,
  InvitationInfo,
  LayoutMode,
  CallKitRef,
  CallKitRTCProvider,
} from '../../module/callkit/types';
import { Icon } from '../../component/icon/Icon';
import Input from '../../component/input';
import '../../component/style/index.scss';
import Provider from '../../module/store/Provider';
import rootStore from '../../module/store/index';
import { eventHandler } from '../../eventHandler';
import outgoingRingtone from './拨打电话.mp3';
import incomingRingtone from './接听电话.mp3';
import { exchangePasswordForToken } from './login-auth';
import { readCustomLogin, saveCustomLogin, type CallDemoLoginForm } from './login-storage';
import {
  deriveCallDemoFusionUrl,
  resolveCallDemoServiceConfig,
  type CallDemoServiceMode,
} from './service-config';
import AudioTranscriptionExperiment from './AudioTranscriptionExperiment';
import VideoColorExperiment from './VideoColorExperiment';
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

const DEFAULT_REST_URL = 'https://a1-hsb.easemob.com';
const DEFAULT_MSYNC_URL = 'wss://im-api-new-hsb.easemob.com/websocket';

// URL 参数优先，其次回填上次成功登录的自定义服务配置。
const getInitialLoginForm = (): CallDemoLoginForm => {
  const urlParams = new URLSearchParams(window.location.search);
  const form: CallDemoLoginForm = readCustomLogin() || {
    userId: '',
    token: '',
    password: '',
    appKey: 'easemob#dutest01',
    serviceMode: 'proxy',
    restUrl: DEFAULT_REST_URL,
    msyncUrl: DEFAULT_MSYNC_URL,
    rtcAppId: '',
  };
  // URL 指定账号时，不混用另一个已保存账号的凭证。
  if (['userId', 'token', 'password'].some(key => urlParams.has(key))) {
    form.userId = urlParams.get('userId') || '';
    form.token = urlParams.get('token') || '';
    form.password = urlParams.get('password') || '';
  }
  for (const key of ['appKey', 'restUrl', 'msyncUrl', 'rtcAppId'] as const) {
    if (urlParams.has(key)) form[key] = urlParams.get(key) || '';
  }
  if (urlParams.has('serviceMode')) {
    form.serviceMode = urlParams.get('serviceMode') === 'custom' ? 'custom' : 'proxy';
  }
  return form;
};

// 设置全局rootStore引用
(window as any).rootStore = rootStore;

const RealCallDemo: React.FC = () => {
  const demoParams = new URLSearchParams(window.location.search);
  const deviceId = demoParams.get('deviceId') || undefined;
  const isFixedDeviceId = demoParams.get('useFixedDeviceId') !== 'false';
  const [notification, contextHolder] = useNotification();
  const callKitRef = useRef<CallKitRef>(null);
  const [experimentRtcClient, setExperimentRtcClient] = useState<IAgoraRTCClient | null>(null);

  // 登录相关状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const loginPendingRef = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginForm, setLoginForm] = useState<CallDemoLoginForm>(getInitialLoginForm);
  const pendingLoginFormRef = useRef<CallDemoLoginForm | null>(null);
  const [authToken, setAuthToken] = useState('');
  const rtcProvider = useMemo<CallKitRTCProvider | undefined>(
    () =>
      loginForm.rtcAppId.trim()
        ? {
            getRTCTokenInfo: async () => ({
              appId: loginForm.rtcAppId.trim(),
              rtcToken: '',
            }),
          }
        : undefined,
    [loginForm.rtcAppId],
  );
  const serviceConfig = resolveCallDemoServiceConfig({
    mode: loginForm.serviceMode,
    origin: window.location.origin,
    restUrl: loginForm.restUrl,
    msyncUrl: loginForm.msyncUrl,
  });

  // 通话状态
  const [isInCall, setIsInCall] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00:00');

  // 控制状态
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // 配置状态
  const [targetUser, setTargetUser] = useState('');
  const [groupUserIds, setGroupUserIds] = useState('');
  const [additionalUserIds, setAdditionalUserIds] = useState('');
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [isStartingGroupCall, setIsStartingGroupCall] = useState(false);
  const [isInvitingParticipants, setIsInvitingParticipants] = useState(false);
  const invitingParticipantsRef = useRef(false);
  const additionalUsersInputRef = useRef<HTMLInputElement>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // 背景选择状态
  const [selectedBackground, setSelectedBackground] = useState(0);

  // 🔧 新增：CallKit尺寸状态管理
  const [callKitSize, setCallKitSize] = useState({ width: 800, height: 600 });
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'grid' | 'main'>('grid');

  // 预设背景图片
  const backgroundOptions = [
    {
      id: 0,
      name: '默认背景',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&sat=-100',
      thumbnail:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&sat=-100',
    },
    {
      id: 1,
      name: '城市夜景',
      url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&h=800&fit=crop',
      thumbnail:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&h=150&fit=crop',
    },
    {
      id: 2,
      name: '自然风景',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&sat=50',
      thumbnail:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&sat=50',
    },
    {
      id: 3,
      name: '抽象渐变',
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=150&fit=crop',
    },
    {
      id: 4,
      name: '科技感',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
      thumbnail:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=150&fit=crop',
    },
    {
      id: 5,
      name: '简约纯色',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=800&fit=crop',
      thumbnail:
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&h=150&fit=crop',
    },
  ];

  // 处理背景切换
  const handleBackgroundChange = (backgroundId: number) => {
    setSelectedBackground(backgroundId);
    notification.info({
      message: `已切换到：${backgroundOptions[backgroundId].name}`,
    });
  };

  // Provider 的 open 事件在 SDK login 完成后触发，拿到 token 尚不代表登录成功。
  useEffect(() => {
    const handlerId = 'call-demo-login';
    eventHandler.addEventHandler(handlerId, {
      onError: () => {},
      open: {
        success: () => {
          if (!loginPendingRef.current) return;
          if (pendingLoginFormRef.current) saveCustomLogin(pendingLoginFormRef.current);
          pendingLoginFormRef.current = null;
          loginPendingRef.current = false;
          setIsLogging(false);
          setIsLoggedIn(true);
          notification.success({ message: 'IM 登录成功' });
        },
        error: error => {
          if (!loginPendingRef.current) return;
          pendingLoginFormRef.current = null;
          loginPendingRef.current = false;
          setIsLogging(false);
          setIsLoggedIn(false);
          setAuthToken('');
          notification.error({
            message: 'IM 登录失败',
            description: error instanceof Error ? error.message : String(error),
          });
        },
      },
    });
    return () => eventHandler.removeEventHandler(handlerId);
  }, [notification]);

  // 检查是否有URL参数，如果有则自动尝试登录
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('userId') && (urlParams.get('token') || urlParams.get('password'))) {
      void handleLogin();
    }
  }, []);

  // 处理登录
  const handleLogin = async () => {
    if (loginPendingRef.current) return;
    const userId = loginForm.userId.trim();
    const token = loginForm.token.trim();
    const password = loginForm.password.trim();
    const appKey = loginForm.appKey.trim();
    const { restUrl, msyncUrl } = serviceConfig;
    if (!userId || (!token && !password) || !appKey) {
      notification.error({
        message: '请填写完整的登录信息',
        description: 'App Key、用户 ID，以及 Token 或密码均为必填项',
      });
      return;
    }
    if (!restUrl || !msyncUrl) {
      notification.error({
        message: '请填写完整的服务地址',
        description: '自定义服务直连需要同时填写 REST 和 MSync WebSocket 地址',
      });
      return;
    }

    if (!/^https?:\/\//.test(restUrl) || !/^wss?:\/\//.test(msyncUrl)) {
      notification.error({
        message: '服务地址格式错误',
        description: 'REST 使用 http:// 或 https://，MSync 使用 ws:// 或 wss://',
      });
      return;
    }
    if (loginForm.rtcAppId.trim() && !/^[a-f\d]{32}$/i.test(loginForm.rtcAppId.trim())) {
      notification.error({ message: '请填写有效的 RTC App ID（32 位十六进制字符）' });
      return;
    }

    loginPendingRef.current = true;
    pendingLoginFormRef.current = { ...loginForm };
    setIsLogging(true);
    try {
      const resolvedToken = token
        ? token
        : await exchangePasswordForToken({
            appKey,
            userId,
            password,
            restBaseUrl: restUrl,
          });
      setAuthToken(resolvedToken);
    } catch (error) {
      loginPendingRef.current = false;
      pendingLoginFormRef.current = null;
      setIsLogging(false);
      console.error('Login failed:', error);
      notification.error({
        message: '登录失败',
        description: error instanceof Error ? error.message : '请检查您的登录信息是否正确',
      });
    }
  };

  // 处理登出
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await rootStore.client.logout();
      rootStore.setLoginState(false);
      rootStore.clear();
      setIsLoggedIn(false);
      setAuthToken('');
      setIsConfigured(false);
      setTargetUser('');
      setIsInCall(false);
      setHasInvitation(false);
      setIsGroupCall(false);
      setAdditionalUserIds('');
      notification.info({ message: '已登出' });
    } catch (error) {
      notification.error({
        message: '登出失败',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 更新URL参数
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (loginForm.userId) params.set('userId', loginForm.userId);
    if (loginForm.token) params.set('token', loginForm.token);
    else if (loginForm.password) params.set('password', loginForm.password);
    if (loginForm.appKey) params.set('appKey', loginForm.appKey);
    params.set('serviceMode', loginForm.serviceMode);
    params.set('rtcAppId', loginForm.rtcAppId.trim());
    if (loginForm.serviceMode === 'custom') {
      if (loginForm.restUrl) params.set('restUrl', loginForm.restUrl);
      if (loginForm.msyncUrl) params.set('msyncUrl', loginForm.msyncUrl);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  // 模拟群组成员数据
  const mockGroupMembers = [
    {
      userId: 'user1',
      nickname: '张三',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    {
      userId: 'user2',
      nickname: '李四',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
    {
      userId: 'user3',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'lxm',
      nickname: '李小明',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'zd1',
      nickname: '张东1',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'zd2',
      nickname: '张东2',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    {
      userId: 'xu1',
      nickname: '徐成普1',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
    {
      userId: 'user8',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user9',
      nickname: '张三',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    {
      userId: 'user10',
      nickname: '李四',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
    {
      userId: 'user11',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user12',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user13',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user14',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user15',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user16',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user17',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
  ];

  // 模拟通话时长计时器
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  // 开始计时
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(
        2,
        '0',
      )}:${String(seconds % 60).padStart(2, '0')}`;
      setCallDuration(formattedTime);
    }, 1000);
  }, []);

  // 停止计时
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    setCallDuration('00:00:00');
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 配置完成
  const handleConfigSubmit = () => {
    // 设置用户信息
    callKitRef.current?.setUserInfo({
      demo_user: {
        nickname: '演示用户',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      },
    });

    setIsConfigured(true);
    notification.success({
      message: '配置完成，现在可以进行真实通话了',
    });

    // 访问令牌已自动从WebIM连接获取
  };

  // 发起视频通话
  const handleStartVideoCall = async () => {
    if (!targetUser) {
      notification.error({
        message: '请输入目标用户',
      });
      return;
    }

    const call = await callKitRef.current?.startSingleCall({
      to: targetUser,
      callType: 'video',
      msg: '邀请你进行视频通话',
    });

    if (!call) return;
    notification.info({
      message: '正在发起视频通话...',
    });
  };

  // 发起语音通话
  const handleStartAudioCall = async () => {
    if (!targetUser) {
      notification.error({
        message: '请输入目标用户',
      });
      return;
    }

    const call = await callKitRef.current?.startSingleCall({
      to: targetUser,
      callType: 'audio',
      msg: '邀请你进行语音通话',
    });

    if (!call) return;
    notification.info({
      message: '正在发起语音通话...',
    });
  };

  // 发起群组通话
  const parseUserIds = (value: string) =>
    [...new Set(value.split(/[\s,，;；]+/).filter(Boolean))].filter(
      userId => userId !== loginForm.userId,
    );

  const handleStartGroupCall = async (callType: 'video' | 'audio') => {
    const userIds = parseUserIds(groupUserIds);
    if (!userIds.length) {
      notification.error({ message: '请至少填写一个其他用户的 IM userId' });
      return;
    }
    setIsStartingGroupCall(true);
    setIsGroupCall(true);
    try {
      const call = await callKitRef.current?.startGroupCall({
        userIds,
        callType,
        msg: `邀请加入多人${callType === 'video' ? '视频' : '语音'}通话`,
      });
      if (!call) {
        setIsGroupCall(false);
        return;
      }
      notification.success({ message: `已向 ${userIds.length} 位用户发出通话邀请` });
    } catch (error) {
      setIsGroupCall(false);
      notification.error({ message: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsStartingGroupCall(false);
    }
  };

  const handleInviteParticipants = async () => {
    if (invitingParticipantsRef.current) return;
    const joinedIds = new Set(
      (callKitRef.current?.getJoinedMembers() || []).map(member =>
        String(member.userId || member.uid),
      ),
    );
    const userIds = parseUserIds(additionalUserIds).filter(userId => !joinedIds.has(userId));
    if (!userIds.length) {
      notification.error({ message: '请填写尚未加入通话的其他用户的 IM userId' });
      return;
    }
    invitingParticipantsRef.current = true;
    setIsInvitingParticipants(true);
    try {
      const invited = await callKitRef.current?.addParticipants(userIds);
      if (!invited) {
        notification.error({ message: '邀请失败，请确认多人通话仍在进行且用户 ID 正确' });
        return;
      }
      setAdditionalUserIds('');
      notification.success({ message: `已向 ${userIds.length} 位用户追加邀请` });
    } catch (error) {
      notification.error({ message: error instanceof Error ? error.message : String(error) });
    } finally {
      invitingParticipantsRef.current = false;
      setIsInvitingParticipants(false);
    }
  };

  // 接听邀请
  const handleAcceptInvitation = (invitationData: InvitationInfo) => {
    console.log('接听邀请:', invitationData);
    setHasInvitation(false);
    setIsInCall(true);
    setIsGroupCall(invitationData.type === 'group');
    startTimer();

    notification.success({
      message: `已接听${invitationData.type === 'video' ? '视频' : '语音'}通话`,
    });
  };

  // 拒绝邀请
  const handleRejectInvitation = (invitationData: InvitationInfo) => {
    console.log('拒绝邀请:', invitationData);
    setHasInvitation(false);

    notification.info({
      message: '已拒绝通话邀请',
    });
  };

  // 结束通话
  const handleHangup = () => {
    setIsInCall(false);
    stopTimer();
    callKitRef.current?.exitCall();
    // notification.error({
    //   message: '挂断成功',
    // });
  };

  // 切换静音
  const handleMuteToggle = (newMuted: boolean) => {
    setMuted(newMuted);
    notification.info({
      message: newMuted ? '麦克风已静音' : '麦克风已开启',
    });
  };

  // 切换摄像头
  const handleCameraToggle = (enabled: boolean) => {
    setCameraEnabled(enabled);
    notification.info({
      message: enabled ? '摄像头已开启' : '摄像头已关闭',
    });
  };

  // 切换扬声器
  const handleSpeakerToggle = (enabled: boolean) => {
    setSpeakerEnabled(enabled);
    notification.info({
      message: enabled ? '扬声器已开启' : '扬声器已关闭',
    });
  };

  // 切换屏幕共享
  const handleScreenShareToggle = (sharing: boolean) => {
    setScreenSharing(sharing);
    notification.info({
      message: sharing ? '屏幕共享已开启' : '屏幕共享已关闭',
    });
  };

  // 处理通话开始
  const handleCallStart = (videos: VideoWindowProps[]) => {
    console.log('通话开始:', videos);
    setIsInCall(true);
    setHasInvitation(false);
    startTimer();
    notification.success({
      message: `通话已开始，共${videos.length}位参与者`,
    });
  };

  // 处理通话结束
  const handleCallEnd = () => {
    console.log('通话结束');
    setIsInCall(false);
    setHasInvitation(false);
    setIsGroupCall(false);
    setAdditionalUserIds('');
    stopTimer();
    notification.info({
      message: '通话已结束',
    });
  };

  // 🔧 新增：处理布局模式切换
  const handleLayoutModeChange = (layoutMode: 'grid' | 'main') => {
    console.log('布局模式切换:', layoutMode);
    setCurrentLayoutMode(layoutMode);

    if (layoutMode === 'main') {
      // 切换到主视频模式时，调整为竖屏尺寸
      const newSize = { width: 600, height: 800 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }

      notification.info({
        message: '已切换到主视频模式',
        description: '调整为竖屏显示',
      });
    } else {
      // 切换到网格模式时，恢复正常尺寸
      const newSize = { width: 800, height: 600 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }

      notification.info({
        message: '已切换到网格模式',
        description: '恢复正常显示',
      });
    }
  };

  // 示例：模拟批量用户信息provider
  const mockGroupMemberProvider = async (userIds: string[]) => {
    // 模拟异步获取用户信息的过程
    await new Promise(resolve => setTimeout(resolve, 200));

    // 模拟不同用户的信息
    const userInfoMap: Record<string, any> = {
      user1: {
        userId: 'user1',
        nickname: '张三',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      },
      user2: {
        userId: 'user2',
        nickname: '李四',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
      },
      user3: {
        userId: 'user3',
        nickname: '王五',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
      },
    };
    console.log('userInfoMap-->', userInfoMap[userIds[0]]);
    // 批量返回用户信息
    return userIds.map(
      userId =>
        userInfoMap[userId] || {
          userId,
          nickname: userId,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        },
    );
  };

  // 如果未登录，显示登录界面
  if (!authToken) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {contextHolder}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>CallKit 通话演示</h1>
          <p>请先登录以开始使用通话功能</p>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3>登录信息</h3>
          <div style={{ marginBottom: '15px' }}>
            <label>服务环境:</label>
            <select
              value={loginForm.serviceMode}
              onChange={event =>
                setLoginForm({
                  ...loginForm,
                  serviceMode: event.target.value as CallDemoServiceMode,
                })
              }
              style={{ width: '100%', height: '40px', marginTop: '6px', padding: '0 10px' }}
            >
              <option value="proxy">本地代理（调试环境）</option>
              <option value="custom">自定义服务（直连，可用于正式环境）</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>App Key:</label>
            <Input
              value={loginForm.appKey}
              onChange={e => setLoginForm({ ...loginForm, appKey: e.target.value })}
              placeholder="输入App Key"
            />
          </div>
          {loginForm.serviceMode === 'custom' ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label>REST 地址:</label>
                <Input
                  value={loginForm.restUrl}
                  onChange={e => setLoginForm({ ...loginForm, restUrl: e.target.value })}
                  placeholder="例如 https://a1.example.com"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>MSync WebSocket 地址:</label>
                <Input
                  value={loginForm.msyncUrl}
                  onChange={e => setLoginForm({ ...loginForm, msyncUrl: e.target.value })}
                  placeholder="例如 wss://im.example.com/websocket"
                />
              </div>
              <div style={{ marginBottom: '15px', fontSize: '12px', lineHeight: 1.8 }}>
                <div>浏览器直接访问服务，不经过本地 forward 或 Vite 的 IM 代理。</div>
                <div>
                  Fusion 信令地址：
                  {deriveCallDemoFusionUrl(serviceConfig.restUrl) || '请填写有效的 REST 地址'}
                </div>
                <div>
                  Fusion 由 SDK 根据 REST 域名派生，服务端需支持此 /ws 入口；REST
                  需允许页面跨域访问。
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                marginBottom: '15px',
                padding: '10px',
                background: '#e6f7ff',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: 1.8,
              }}
            >
              <div>REST: {serviceConfig.restUrl}</div>
              <div>MSync: {serviceConfig.msyncUrl}</div>
              <div>Fusion: 由 SDK 通过同源 /ws 连接</div>
            </div>
          )}
          <div style={{ marginBottom: '15px' }}>
            <label>RTC App ID（选填）:</label>
            <Input
              value={loginForm.rtcAppId}
              onChange={e => setLoginForm({ ...loginForm, rtcAppId: e.target.value })}
              placeholder="留空时由 IM SDK 自动获取"
            />
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              留空时通过 IM SDK 获取 RTC App ID 和 Token。填写时双方使用同一个 RTC 项目，并使用无
              RTC Token 模式。
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>用户ID:</label>
            <Input
              value={loginForm.userId}
              onChange={e => setLoginForm({ ...loginForm, userId: e.target.value })}
              placeholder="输入用户ID,或群组 ID"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Token:</label>
            <Input
              value={loginForm.token}
              onChange={e => setLoginForm({ ...loginForm, token: e.target.value })}
              placeholder="输入 Token；填写后优先使用 Token 登录"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>密码:</label>
            <Input
              type="password"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="未填写 Token 时，使用密码换取 Token"
            />
          </div>
          <Button
            type="primary"
            onClick={handleLogin}
            disabled={isLogging}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {isLogging ? '登录中...' : '登录'}
          </Button>
          <Button onClick={updateUrlParams} style={{ width: '100%' }}>
            更新URL参数
          </Button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <h4>URL参数登录:</h4>
          <p>您也可以通过URL参数直接登录：</p>
          <code
            style={{ background: '#f1f1f1', padding: '5px', borderRadius: '3px', display: 'block' }}
          >
            ?userId=your_user_id&token=your_token&appKey=your_org%23your_app&serviceMode=proxy
          </code>
        </div>
      </div>
    );
  }

  // 先挂载 Provider 建立 IM 连接，登录成功后再挂载 CallKit。
  return (
    <Provider
      initConfig={{
        appKey: loginForm.appKey,
        deviceId,
        isFixedDeviceId,
        userId: loginForm.userId,
        token: authToken,
        useUserInfo: true,
        maxMessages: 100,
        isHttpDNS: false,
        msyncUrl: serviceConfig.msyncUrl,
        restUrl: serviceConfig.restUrl,
      }}
    >
      {!isLoggedIn ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          {contextHolder}
          正在连接 IM 服务，请稍候…
        </div>
      ) : (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {contextHolder}

          {/* 用户信息和登出 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '15px',
              background: '#e6f7ff',
              borderRadius: '8px',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>CallKit 通话演示</h2>
              <p style={{ margin: 0, color: '#666' }}>
                当前用户: {loginForm.userId} | App Key: {loginForm.appKey} | 服务:
                {loginForm.serviceMode === 'proxy' ? '本地代理' : '自定义服务直连'}
              </p>
            </div>
            <Button onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? '登出中…' : '登出'}
            </Button>
          </div>

          {/* 状态信息 */}
          <div style={{ marginBottom: '20px' }}>
            <h3>当前状态</h3>
            <ul>
              <li>通话状态: {isInCall ? '通话中' : '空闲'}</li>
              <li>邀请状态: {hasInvitation ? '有邀请' : '无邀请'}</li>
              <li>通话时长: {callDuration}</li>
              <li>配置状态: {isConfigured ? '已配置' : '未配置'}</li>
              <li>布局模式: {currentLayoutMode === 'main' ? '主视频模式' : '网格模式'}</li>
              <li>
                CallKit尺寸: {callKitSize.width} x {callKitSize.height}
              </li>
            </ul>
          </div>

          {/* 配置面板 */}
          {!isConfigured && (
            <div
              style={{
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
              }}
            >
              <h3>配置信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label>目标用户:</label>
                  <Input
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    placeholder="单人通话的目标 IM userId（多人通话可留空）"
                  />
                  <p style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
                    对方需登录同一个 IM 应用。多人通话在下方单独填写成员 userId。
                  </p>
                </div>
              </div>
              <Button type="primary" onClick={handleConfigSubmit} style={{ marginTop: '15px' }}>
                完成配置
              </Button>
            </div>
          )}

          {/* 背景选择面板 */}
          {isConfigured && (
            <div
              style={{
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: '#f0f8ff',
                borderRadius: '8px',
                border: '1px solid #b3d9ff',
              }}
            >
              <h3>背景选择</h3>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                选择通话界面的背景图片
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '15px',
                  maxWidth: '600px',
                }}
              >
                {backgroundOptions.map(option => (
                  <div
                    key={option.id}
                    style={{
                      cursor: 'pointer',
                      border:
                        selectedBackground === option.id
                          ? '3px solid #1890ff'
                          : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '8px',
                      backgroundColor: 'white',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                    onClick={() => handleBackgroundChange(option.id)}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={option.thumbnail}
                      alt={option.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginBottom: '8px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '12px',
                        color: selectedBackground === option.id ? '#1890ff' : '#666',
                        fontWeight: selectedBackground === option.id ? 'bold' : 'normal',
                      }}
                    >
                      {option.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 通话控制面板 */}
          {isConfigured && (
            <>
              <div
                style={{
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#e6f7ff',
                  borderRadius: '8px',
                }}
              >
                <h3>通话控制</h3>
                <div>
                  <label>目标用户:</label>
                  <Input
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    placeholder="输入目标用户ID"
                  />
                  <p style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
                    通话ID和频道名称将自动生成，无需手动配置
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>发起一对一通话</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    onClick={handleStartVideoCall}
                    disabled={hasInvitation || isInCall}
                  >
                    <Icon type="VIDEO_CAMERA" />
                    发起视频通话
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleStartAudioCall}
                    disabled={hasInvitation || isInCall}
                  >
                    <Icon type="MIC_ON" />
                    发起语音通话
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>发起多人通话</h3>
                <Input
                  aria-label="多人通话成员 userId"
                  value={groupUserIds}
                  onChange={e => setGroupUserIds(e.target.value)}
                  placeholder="例如 alice, bob, charlie"
                  disabled={isInCall || isStartingGroupCall}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <p>填写真实的 IM userId，用逗号、空格或分号分隔。无需填写群 ID。</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    onClick={() => handleStartGroupCall('video')}
                    disabled={hasInvitation || isInCall || isStartingGroupCall}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    <Icon type="VIDEO_CAMERA" />
                    发起多人视频通话
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleStartGroupCall('audio')}
                    disabled={hasInvitation || isInCall || isStartingGroupCall}
                  >
                    <Icon type="MIC_ON" />
                    发起多人语音通话
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>通话中继续邀请</h3>
                <Input
                  ref={additionalUsersInputRef}
                  aria-label="追加邀请 userId"
                  value={additionalUserIds}
                  onChange={e => setAdditionalUserIds(e.target.value)}
                  placeholder="例如 david, emma"
                  disabled={!isInCall || !isGroupCall || isInvitingParticipants}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <p>多人通话接通后，填写要追加邀请的 IM userId。对方收到来电后需点击接听。</p>
                <Button
                  type="primary"
                  onClick={handleInviteParticipants}
                  disabled={!isInCall || !isGroupCall || isInvitingParticipants}
                >
                  {isInvitingParticipants ? '正在邀请...' : '邀请加入当前通话'}
                </Button>
              </div>

              {/* 当前状态 */}
              <div style={{ marginBottom: '20px' }}>
                <h3>当前状态</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>邀请状态:</strong> {hasInvitation ? '有邀请' : '无邀请'}
                  </div>
                  <div>
                    <strong>通话状态:</strong> {isInCall ? '通话中' : '未通话'}
                  </div>
                  <div>
                    <strong>通话时长:</strong> {callDuration}
                  </div>
                </div>
              </div>

              {/* 通话控制按钮 */}
              {isInCall && (
                <div style={{ marginBottom: '20px' }}>
                  <h3>通话控制</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Button onClick={() => handleMuteToggle(!muted)}>
                      <Icon type={muted ? 'MIC_OFF' : 'MIC_ON'} />
                      {muted ? '取消静音' : '静音'}
                    </Button>
                    <Button onClick={() => handleCameraToggle(!cameraEnabled)}>
                      <Icon type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'} />
                      {cameraEnabled ? '关闭摄像头' : '开启摄像头'}
                    </Button>
                    <Button onClick={() => handleSpeakerToggle(!speakerEnabled)}>
                      <Icon type={speakerEnabled ? 'SPEAKER_WAVE_2' : 'SPEAKER_X_MARK'} />
                      {speakerEnabled ? '关闭扬声器' : '开启扬声器'}
                    </Button>
                    <Button onClick={() => handleScreenShareToggle(!screenSharing)}>
                      <Icon type="ARROW_RIGHT_SQUARE_FILL" />
                      {screenSharing ? '停止共享' : '屏幕共享'}
                    </Button>
                    <Button type="primary" onClick={handleHangup}>
                      <Icon type="PHONE_PICK" />
                      结束通话
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CallKit 组件 */}
          <AudioTranscriptionExperiment client={experimentRtcClient} isInCall={isInCall} />
          <VideoColorExperiment client={experimentRtcClient} isInCall={isInCall} />
          <CallKit
            ref={callKitRef}
            rtcProvider={rtcProvider}
            onRtcEngineCreated={setExperimentRtcClient}
            useRTCToken={!rtcProvider}
            // 基础配置
            layoutMode={LayoutMode.MULTI_PARTY}
            aspectRatio={1}
            gap={6}
            // 位置和大小管理
            managedPosition={true}
            initialPosition={{
              left: Math.max(0, (window.innerWidth - callKitSize.width) / 2),
              top: Math.max(0, (window.innerHeight - callKitSize.height) / 2),
            }}
            initialSize={callKitSize}
            resizable={true}
            draggable={true}
            // 邀请相关配置
            showInvitationAvatar={true}
            showInvitationTimer={true}
            autoRejectTime={30}
            // 控制按钮 去掉
            // showControls={true}
            // muted={muted}
            // cameraEnabled={cameraEnabled}
            // speakerEnabled={speakerEnabled}
            // screenSharing={screenSharing}
            // 事件回调
            // onMuteToggle={handleMuteToggle}
            // onCameraToggle={handleCameraToggle}
            // onSpeakerToggle={handleSpeakerToggle}
            // onScreenShareToggle={handleScreenShareToggle}
            // onHangup={handleHangup}
            onInvitationAccept={handleAcceptInvitation}
            onInvitationReject={handleRejectInvitation}
            onEndCallWithReason={handleCallEnd}
            onCallStart={handleCallStart}
            onReceivedCall={callType => {
              setHasInvitation(true);
              setIsGroupCall(callType === 'group');
            }}
            onAddParticipant={() => {
              additionalUsersInputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              additionalUsersInputRef.current?.focus();
            }}
            onCallError={error => notification.error({ message: error.message })}
            // 真实通话配置
            // enableRealCall={isConfigured}
            // 群组成员选择相关
            // groupMembers={mockGroupMembers}
            userSelectTitle="邀请群组成员" // 默认值
            // 其他
            // callDuration={callDuration}
            userInfoProvider={mockGroupMemberProvider}
            groupInfoProvider={async (groupIds: string[]) => {
              // 批量获取群组信息
              return [
                {
                  groupId: '286421473624065',
                  groupName: 'zd 测试多人通话',
                  groupAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
                },
              ];
            }}
            backgroundImage={backgroundOptions[selectedBackground].url}
            onLayoutModeChange={handleLayoutModeChange} // 默认值
            // 🔧 新增：音量指示器配置示例
            // speakingVolumeThreshold={30} // 设置音量阈值为30，比默认的60更敏感
            // onCallStart={videos => {
            //   console.log('通话开始:', videos);
            //   notification.success({
            //     message: '通话已开始',
            //     description: `共 ${videos.length} 个参与者`,
            //   });
            // }}
            outgoingRingtoneSrc={outgoingRingtone} // 铃声文件路径
            incomingRingtoneSrc={incomingRingtone} // 铃声文件路径
            // enableRingtone={true} // 启用铃声
            // ringtoneVolume={0.8} // 音量 80%
            // ringtoneLoop={true} // 循环播放
            // customIcons={{
            //   controls: {
            //     hangup: <div>123</div>,
            //     micOn: <div>micOn</div>,
            //     micOff: <div>micOff</div>,
            //     cameraOn: <div>cameraOn</div>,
            //     cameraOff: <div>cameraOff</div>,
            //     speakerOn: <div>speakerOn</div>,
            //     speakerOff: <div>speakerOff</div>,
            //     accept: <div>accept</div>,
            //     reject: <div>reject</div>,
            //     // screenShareOn: <div>screenShareOn</div>,
            //     // screenShareOff: <div>screenShareOff</div>,
            //   },
            //   header: {
            //     back: <div>back</div>,
            //     title: <div>title</div>,
            //     close: <div>close</div>,

            //     fullscreen: <div>fullscreen</div>,
            //     exitFullscreen: <div>exitFullscreen</div>,
            //     minimize: <div>minimize</div>,
            //     addParticipant: <div>addParticipant</div>,
            //   },
            // }}
          />
        </div>
      )}
    </Provider>
  );
};

export default RealCallDemo;

// 如果在浏览器环境中直接运行，渲染到指定容器
if (typeof window !== 'undefined') {
  import('react-dom/client').then(({ createRoot }) => {
    const container = document.getElementById('demo-root');
    if (container) {
      const root = createRoot(container);
      root.render(React.createElement(RealCallDemo));
    }
  });
}
