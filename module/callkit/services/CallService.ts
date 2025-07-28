import AgoraRTC from 'agora-rtc-sdk-ng';
import WebIM from 'easemob-websdk';
import { VideoWindowProps } from '../types/index';

// 通话状态枚举
export enum CALL_STATUS {
  IDLE = 0,
  INVITING = 1,
  ALERTING = 2,
  RECEIVED_CONFIRM_RING = 3,
  CONFIRM_RING = 4,
  CONFIRM_CALLEE = 5,
  IN_CALL = 6,
}

// 通话类型枚举
export enum CALL_TYPE {
  AUDIO_1V1 = 0,
  VIDEO_1V1 = 1,
  VIDEO_MULTI = 2,
  AUDIO_MULTI = 3,
}

// 通话信息接口
export interface CallInfo {
  callId: string;
  channel: string;
  token?: string;
  type: CALL_TYPE;
  callerDevId: string;
  calleeDevId?: string;
  callerIMName: string;
  calleeIMName?: string;
  groupId?: string;
  groupName?: string;
  invitedMembers?: string[];
  joinedMembers?: any[];
}

// 通话服务配置
export interface CallServiceConfig {
  connection: any; // WebIM connection
  onStateChange?: (state: any) => void;
  onCallStart?: (videos: VideoWindowProps[]) => void;
  onCallEnd?: (reason: string) => void;
  onInvitationReceived?: (invitation: any) => void;
  onCallDurationUpdate?: (duration: string) => void;
  onUserPublished?: (user: any, mediaType: string) => void;
  onUserLeft?: (user: any, reason: string) => void;
  onUserUnpublished?: (user: any, mediaType: string) => void;
  onRemoteVideoReady?: (videoInfo: VideoWindowProps) => void;
  onTalkingUsersChange?: (talkingUsers: string[]) => void; // 🔧 新增：说话用户变化回调
  userInfoProvider?: (
    userIds: string[],
  ) => Promise<Array<{ userId: string; nickname?: string; avatarUrl?: string }>>;
  groupInfoProvider?: (
    groupIds: string[],
  ) => Promise<Array<{ groupId: string; groupName?: string; groupAvatar?: string }>>;
  // 🔧 新增：音量指示器配置
  speakingVolumeThreshold?: number; // 说话指示器显示的音量阈值，范围1-100，默认60
}

export class CallService {
  private client: any;
  private rtc: any;
  private appId: string;
  private agoraUid: string;
  private connection: any;
  private accessToken?: string;
  private currentCallInfo: CallInfo | null = null;
  private callStatus: CALL_STATUS = CALL_STATUS.IDLE;
  private callDuration: string = '00:00';
  private timer: any = null;
  private intervalTimer: any = null;
  private joinedMembers: any[] = [];
  private invitedMembers: string[] = [];
  private userInfos: { [key: string]: any } = {};
  private localVideoStream: MediaStream | null = null; // 缓存本地视频流，避免重复创建

  // 🔧 新增：存储每个用户的视频轨道和音频轨道
  private remoteVideoTracks: Map<string, any> = new Map();
  private remoteAudioTracks: Map<string, any> = new Map();

  // 🔧 新增：存储等待播放的视频轨道
  private pendingVideoTracks: Map<string, any> = new Map();

  // 🔧 新增：通知视频元素已准备好的回调
  private onVideoElementReady?: (videoId: string) => void;

  // 回调函数
  private onStateChange?: (state: any) => void;
  private onCallStart?: (videos: VideoWindowProps[]) => void;
  private onCallEnd?: (reason: string) => void;
  private onInvitationReceived?: (invitation: any) => void;
  private onCallDurationUpdate?: (duration: string) => void;
  private onUserPublished?: (user: any, mediaType: string) => void;
  private onUserLeft?: (user: any, reason: string) => void;
  private onUserUnpublished?: (user: any, mediaType: string) => void;
  private onRemoteVideoReady?: (videoInfo: VideoWindowProps) => void;
  private onTalkingUsersChange?: (talkingUsers: string[]) => void; // 🔧 新增：说话用户变化回调
  private userInfoProvider?: (
    userIds: string[],
  ) => Promise<Array<{ userId: string; nickname?: string; avatarUrl?: string }>>;
  private groupInfoProvider?: (
    groupIds: string[],
  ) => Promise<Array<{ groupId: string; groupName?: string; groupAvatar?: string }>>;

  // 缓存的群组信息
  private cachedGroupInfos: { [key: string]: { groupName?: string; groupAvatar?: string } } = {};

  // 🔧 新增：音量指示器阈值
  private speakingVolumeThreshold: number = 60; // 默认阈值60

  constructor(config: CallServiceConfig) {
    this.connection = config.connection;
    this.onStateChange = config.onStateChange;
    this.onCallStart = config.onCallStart;
    this.onCallEnd = config.onCallEnd;
    this.onInvitationReceived = config.onInvitationReceived;
    this.onCallDurationUpdate = config.onCallDurationUpdate;
    this.onUserPublished = config.onUserPublished;
    this.onUserLeft = config.onUserLeft;
    this.onUserUnpublished = config.onUserUnpublished;
    this.onRemoteVideoReady = config.onRemoteVideoReady;
    this.onTalkingUsersChange = config.onTalkingUsersChange; // 🔧 新增：初始化说话用户变化回调
    this.userInfoProvider = config.userInfoProvider;
    this.groupInfoProvider = config.groupInfoProvider;
    // 🔧 新增：初始化音量阈值
    this.speakingVolumeThreshold = config.speakingVolumeThreshold ?? 60;

    // 从WebIM连接获取必要信息
    this.agoraUid = this.connection.user; // 使用userId作为agoraUid
    this.appId = this.connection.appKey || ''; // 使用appKey作为appId

    // 初始化 Agora RTC 客户端
    this.client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
    this.client.setClientRole('host');

    this.rtc = {
      client: this.client,
      localAudioTrack: null,
      localVideoTrack: null,
      remoteVideoTrack: null,
      remoteAudioTrack: null,
      remoteUser: null,
      timer: null,
    };

    // 设置全局引用
    (WebIM as any).rtc = this.rtc;
    (WebIM as any).conn = this.connection;
    console.log('WebIM.conn -->', this.connection);
    // 添加消息监听器
    this.addMessageListener();

    // 调试信息
    console.log('CallService initialized successfully', {
      appId: this.appId,
      agoraUid: this.agoraUid,
    });
  }

  // 移除setAccessToken方法，改为从连接获取
  async getAccessToken(): Promise<string> {
    try {
      const { app_id, rtc_token } = await this.connection.getRTCToken('*');
      this.appId = 'c8a78f1878ec4a0d92c6a16d18c8b498'; // app_id;
      return rtc_token;
    } catch (error) {
      console.error('Failed to get RTC token:', error);
      throw error;
    }
  }

  // 移除setUserIdMap方法，不再需要

  // 设置用户信息
  setUserInfo(userInfo: { [key: string]: any }) {
    this.userInfos = { ...this.userInfos, ...userInfo };

    // 如果正在通话中且有本地视频轨道，更新本地视频信息显示
    if (this.callStatus === CALL_STATUS.IN_CALL && this.rtc.localVideoTrack) {
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: this.isMuted(),
        cameraEnabled: this.isCameraEnabled(),
        nickname: this.userInfos[this.agoraUid]?.nickname || '我',
        avatar: this.userInfos[this.agoraUid]?.avatarUrl, // 使用更新后的头像
        stream: this.isCameraEnabled()
          ? new MediaStream([this.rtc.localVideoTrack.getMediaStreamTrack()])
          : undefined,
      };

      // 通知UI更新本地视频状态
      this.onRemoteVideoReady?.(localVideoInfo);

      console.log('用户信息已更新，本地视频显示已同步:', {
        nickname: localVideoInfo.nickname,
        avatar: localVideoInfo.avatar,
        cameraEnabled: localVideoInfo.cameraEnabled,
      });
    }
  }

  // 获取当前通话状态
  getCallStatus(): CALL_STATUS {
    return this.callStatus;
  }

  // 获取当前通话信息
  getCurrentCallInfo(): CallInfo | null {
    return this.currentCallInfo;
  }

  // 发起通话
  async startCall(options: {
    callId: string;
    channel: string;
    chatType: string;
    callType: CALL_TYPE;
    to: string | string[];
    message?: string;
    groupId?: string;
    groupName?: string;
    members?: string[]; // 多人通话时的成员列表
  }) {
    const {
      callId,
      channel,
      chatType,
      callType,
      to,
      message = '',
      groupId,
      groupName,
      members = [],
    } = options;

    // 自动获取access token
    this.accessToken = await this.getAccessToken();
    console.log('startCall this.accessToken -->', this.accessToken);
    // 创建通话信息
    this.currentCallInfo = {
      callId,
      channel,
      type: callType,
      callerDevId: this.connection.clientResource || 'web',
      calleeDevId: '',
      callerIMName: this.agoraUid, // 使用agoraUid作为IM名称
      calleeIMName: callType === CALL_TYPE.VIDEO_MULTI ? groupId : (to as string),
      groupId,
      groupName,
      invitedMembers: members,
      joinedMembers: [],
    };

    // 更新状态
    this.callStatus = CALL_STATUS.INVITING;
    this.invitedMembers = members;

    // 如果是1v1视频通话，创建本地视频轨道供预览使用（主叫方）
    // 群组视频通话发起方不需要预览模式，直接进入群组视频布局
    if (callType === CALL_TYPE.VIDEO_1V1) {
      try {
        console.log('主叫方创建预览模式的本地视频轨道');
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        this.rtc.localVideoTrack = localVideoTrack;

        // 创建本地视频信息供预览模式使用
        const localVideoInfo: VideoWindowProps = {
          id: 'local-preview', // 预览模式使用特殊的 ID
          isLocalVideo: true,
          muted: false,
          cameraEnabled: true,
          nickname: this.userInfos[this.agoraUid]?.nickname || '我',
          avatar: this.userInfos[this.agoraUid]?.avatarUrl,
          stream: undefined, // 不使用 stream，使用 track.play() 方法播放
        };

        // 通知UI显示预览模式的本地视频
        this.onRemoteVideoReady?.(localVideoInfo);

        console.log('主叫方预览模式本地视频轨道创建成功');
      } catch (error) {
        console.error('主叫方创建预览模式本地视频轨道失败:', error);
      }
    } else if (callType === CALL_TYPE.VIDEO_MULTI) {
      // 群组视频通话：发起方直接创建本地视频轨道用于通话
      try {
        console.log('群组视频通话：发起方创建本地视频轨道');
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        this.rtc.localVideoTrack = localVideoTrack;

        // 延迟播放本地视频，确保UI已经准备好
        setTimeout(() => {
          this.playLocalVideo();
        }, 500);

        console.log('群组视频通话：发起方本地视频轨道创建成功');
      } catch (error) {
        console.error('群组视频通话：发起方创建本地视频轨道失败:', error);
      }
    }

    // 发送邀请消息
    if (chatType === 'singleChat') {
      await this.sendInvitationMessage(to, this.currentCallInfo);
    } else if (chatType === 'groupChat' && groupId) {
      // 多人通话，向组发送邀请
      await this.sendInvitationMessage(members, this.currentCallInfo);
    }

    // 通知状态变化
    this.onStateChange?.({
      status: this.callStatus,
      callInfo: this.currentCallInfo,
    });

    console.log('Call started:', this.currentCallInfo);
  }

  // 发送邀请消息
  private async sendInvitationMessage(to: string | string[], callInfo: CallInfo) {
    const inviteExt: any = {
      action: 'invite',
      channelName: callInfo.channel,
      type: callInfo.type,
      callerDevId: callInfo.callerDevId,
      callId: callInfo.callId,
      ts: Date.now(),
      msgType: 'rtcCallWithAgora',
      callerIMName: callInfo.callerIMName,
      calleeIMName: callInfo.type === CALL_TYPE.VIDEO_MULTI ? callInfo.groupId : to,
      chatType: callInfo.type,
      em_push_ext: {
        type: 'call',
        custom: {
          callId: callInfo.callId,
        },
      },
      em_apns_ext: {
        em_push_type: 'voip',
      },
    };

    // 获取邀请人（自己）的用户信息
    try {
      if (this.userInfoProvider) {
        console.log('🔍 获取邀请人用户信息:', this.agoraUid);
        const userInfos = await this.userInfoProvider([this.agoraUid]);
        const myInfo = userInfos.find(user => user.userId === this.agoraUid);

        if (myInfo) {
          console.log('✅ 成功获取邀请人信息:', myInfo);
          inviteExt.ease_chat_uikit_user_info = {
            nickname: myInfo.nickname,
            avatarURL: myInfo.avatarUrl,
          };
        } else {
          console.warn('⚠️ 未找到邀请人用户信息');
        }
      } else {
        console.warn('⚠️ userInfoProvider 未配置，无法获取邀请人信息');
      }
    } catch (error) {
      console.error('❌ 获取邀请人信息失败:', error);
    }

    // 如果是群组通话，添加群组信息
    if (callInfo.groupId) {
      let groupAvatar: string | undefined;

      // 先尝试从缓存获取群组头像
      const cachedGroupInfo = this.cachedGroupInfos[callInfo.groupId];
      if (cachedGroupInfo?.groupAvatar) {
        groupAvatar = cachedGroupInfo.groupAvatar;
        console.log('✅ 使用缓存的群组头像:', { groupId: callInfo.groupId, groupAvatar });
      } else if (this.groupInfoProvider) {
        // 如果缓存中没有，尝试获取群组信息
        try {
          console.log('🔍 获取群组信息:', callInfo.groupId);
          const groupInfos = await this.groupInfoProvider([callInfo.groupId]);
          const groupInfo = groupInfos.find(info => info.groupId === callInfo.groupId);

          if (groupInfo) {
            console.log('✅ 成功获取群组信息:', groupInfo);
            groupAvatar = groupInfo.groupAvatar;

            // 缓存群组信息
            this.cachedGroupInfos[callInfo.groupId] = {
              groupName: groupInfo.groupName || callInfo.groupName,
              groupAvatar: groupInfo.groupAvatar,
            };
            console.log('📝 已缓存群组信息:', {
              groupId: callInfo.groupId,
              cached: this.cachedGroupInfos[callInfo.groupId],
            });
          } else {
            console.warn('⚠️ 未找到群组信息');
          }
        } catch (error) {
          console.error('❌ 获取群组信息失败:', error);
        }
      } else {
        console.warn('⚠️ groupInfoProvider 未配置，无法获取群组头像');
      }

      inviteExt.ext = {
        groupId: callInfo.groupId,
        groupName: callInfo.groupName,
        groupAvatar: groupAvatar, // 添加群组头像
      };
    }

    // 发送文本消息
    const option: any = {
      chatType: callInfo.type === CALL_TYPE.VIDEO_MULTI ? 'groupChat' : 'singleChat',
      type: 'txt',
      to: to,
      msg: '',
      ext: inviteExt,
    };
    if (callInfo.type === CALL_TYPE.VIDEO_MULTI) {
      option.to = callInfo.groupId;
      option.receiverList = to;
    }

    const msg = WebIM.message.create(option);
    this.connection
      .send(msg)
      .then((res: any) => {
        console.log('sendInvitationMessage res -->', res);
      })
      .catch((err: any) => {
        console.log('sendInvitationMessage err -->', err);
      });
  }

  // 接听通话
  async answerCall(result: boolean) {
    if (!this.currentCallInfo) return;

    if (result) {
      // 接听通话 - 发送accept消息
      this.sendAnswerCallMessage('accept');
      this.callStatus = CALL_STATUS.ALERTING;
      // 发送响铃消息
      //   this.sendAlertingMessage();
    } else {
      // 拒绝通话
      this.sendAnswerCallMessage('refuse');
      this.callStatus = CALL_STATUS.IDLE;
      this.currentCallInfo = null;
      this.cleanupPreviewMode(); // 拒绝通话时清理预览模式
    }
  }

  // 发送响铃消息
  private sendAlertingMessage() {
    if (!this.currentCallInfo) return;

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: this.currentCallInfo.callerIMName,
      action: 'rtcCall',
      ext: {
        action: 'alert',
        calleeDevId: this.connection.context.jid.clientResource,
        callerDevId: this.currentCallInfo.callerDevId,
        callId: this.currentCallInfo.callId,
        ts: Date.now(),
        msgType: 'rtcCallWithAgora',
      },
    });

    this.connection.send(msg);

    // 设置超时处理
    this.timer = setTimeout(() => {
      console.warn('callee timeout');
      this.hangup('timeout');
    }, 30000);
  }

  // 发送应答消息
  private sendAnswerCallMessage(
    result: 'accept' | 'refuse' | 'busy',
    targetCallInfo?: {
      callerIMName: string;
      callerDevId: string;
      callId: string;
    },
  ) {
    // 🔧 修复：支持指定目标信息，如果没有指定则使用当前通话信息
    const callInfo = targetCallInfo || this.currentCallInfo;
    console.log('sendAnswerCallMessage result -->', result, callInfo);

    if (!callInfo) {
      console.warn('没有可用的通话信息，无法发送应答消息');
      return;
    }

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: callInfo.callerIMName,
      action: 'rtcCall',
      ext: {
        action: 'answerCall',
        result: result,
        callerDevId: callInfo.callerDevId,
        calleeDevId: this.connection.context.jid.clientResource,
        callId: callInfo.callId,
        ts: Date.now(),
        msgType: 'rtcCallWithAgora',
      },
    });
    console.log('sendAnswerCallMessage msg -->', msg);
    this.connection.send(msg);
  }

  // 加入通话
  async joinCall() {
    console.log('joinCall this.currentCallInfo -->', this.currentCallInfo);
    if (!this.currentCallInfo) {
      console.error('No current call info');
      return;
    }

    // 防止重复加入通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      console.log('已经在通话中，跳过重复加入操作');
      return;
    }

    if (!this.accessToken) {
      // 如果没有token，重新获取
      this.accessToken = await this.getAccessToken();
    }

    // 重要：先添加RTC事件监听器，再加入频道
    // 这样才能捕获到主叫方已经在频道中发布的流
    this.addAgoraRTCListeners();

    let uid;
    try {
      // 加入 Agora 频道 - 使用Number类型的agoraUid，参考原始代码
      console.log(
        'joinCall this.appId -->',
        this.appId,
        this.currentCallInfo.channel,
        this.accessToken,
        this.agoraUid,
      );
      uid = await this.client.join(
        this.appId,
        this.currentCallInfo.channel,
        this.accessToken,
        this.agoraUid,
      );

      console.log('成功加入频道:', uid);

      // 🔧 新增：启用音量监听（只在多人通话中启用）
      if (
        this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
      ) {
        console.log('🔊 启用音量监听');
        this.client.enableAudioVolumeIndicator();
      }
    } catch (error) {
      console.error('Failed to join channel:', error);
      this.hangup('join channel failed');
      return;
    }

    // 创建本地音频轨道
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.rtc.localAudioTrack = localAudioTrack;
    const config: any[] = [localAudioTrack];
    const videos: VideoWindowProps[] = [];

    // 根据通话类型处理
    if (
      this.currentCallInfo.type === CALL_TYPE.AUDIO_1V1 ||
      this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
    ) {
      // 音频通话
      try {
        await this.client.publish(config);
        console.log('音频通话成功');
      } catch (error) {
        console.error('Failed to publish audio:', error);
        this.hangup('invalid operation');
        return;
      }
    } else {
      // 视频通话
      let localVideoTrack = this.rtc.localVideoTrack;

      // 如果没有本地视频轨道，创建新的
      if (!localVideoTrack) {
        console.log('创建新的本地视频轨道');
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        this.rtc.localVideoTrack = localVideoTrack;
      } else {
        console.log('复用已有的本地视频轨道');
      }

      config.push(localVideoTrack);

      try {
        await this.client.publish(config);
      } catch (error) {
        console.error('Failed to publish video:', error);
        this.hangup('invalid operation');
        return;
      }

      // 创建本地视频对象供UI显示
      const localVideoInfo = {
        id: 'local',
        isLocalVideo: true,
        muted: this.isMuted(), // 🔧 修复：使用实际的静音状态而不是硬编码false
        cameraEnabled: true,
        nickname: this.userInfos[this.agoraUid]?.nickname || '我',
        avatar: this.userInfos[this.agoraUid]?.avatarUrl,
        // 不使用stream，而是使用track.play()方法
        stream: undefined,
      };
      videos.push(localVideoInfo);

      // 通知UI本地视频状态变化（从预览模式转到通话模式）
      this.onRemoteVideoReady?.(localVideoInfo);

      // 延迟播放本地视频，使用我们的 playLocalVideo 方法
      setTimeout(() => {
        this.playLocalVideo();
      }, 500);
    }

    // 更新状态
    this.callStatus = CALL_STATUS.IN_CALL;
    this.startCallTimer();

    // 🔧 确保通话开始时扬声器状态为开启
    this.speakerEnabled = true;

    // 🔧 修复：被叫方主动检查并订阅已在频道中的远程用户流
    if (
      (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI) &&
      videos.length === 1 // 只有自己的视频
    ) {
      console.log('🎯 多人通话被叫方初始化，检查并订阅已在频道中的用户流');

      // 延迟检查远程用户，给 Agora SDK 一点时间同步远程用户列表
      const checkAndSubscribeRemoteUsers = async () => {
        console.log('🔍 检查远程用户列表:', {
          remoteUsersCount: this.client.remoteUsers?.length || 0,
          remoteUsers:
            this.client.remoteUsers?.map((u: any) => ({
              uid: u.uid,
              hasAudio: u.hasAudio,
              hasVideo: u.hasVideo,
            })) || [],
        });

        if (this.client.remoteUsers && this.client.remoteUsers.length > 0) {
          console.log('📋 发现已有远程用户，主动订阅其流:');

          // 🔧 主动订阅每个远程用户的流
          for (const remoteUser of this.client.remoteUsers) {
            console.log(`🔄 处理远程用户 ${remoteUser.uid}:`, {
              hasAudio: remoteUser.hasAudio,
              hasVideo: remoteUser.hasVideo,
            });

            try {
              // 订阅音频流
              if (remoteUser.hasAudio && remoteUser.audioTrack) {
                await this.client.subscribe(remoteUser, 'audio');
                console.log(`🎤 成功订阅用户 ${remoteUser.uid} 的音频流`);

                // 存储音频轨道
                this.remoteAudioTracks.set(remoteUser.uid, remoteUser.audioTrack);
                // 播放音频
                remoteUser.audioTrack.play();
              }

              // 订阅视频流
              if (remoteUser.hasVideo && remoteUser.videoTrack) {
                await this.client.subscribe(remoteUser, 'video');
                console.log(`🎬 成功订阅用户 ${remoteUser.uid} 的视频流`);

                // 存储视频轨道
                this.remoteVideoTracks.set(remoteUser.uid, remoteUser.videoTrack);

                // 创建远程视频信息
                const remoteVideoInfo: VideoWindowProps = {
                  id: `remote-${remoteUser.uid}`,
                  isLocalVideo: false,
                  muted: !remoteUser.hasAudio, // 基于实际音频状态
                  cameraEnabled: true, // 有视频流说明摄像头开启
                  nickname: this.userInfos[remoteUser.uid]?.nickname || remoteUser.uid,
                  avatar: this.userInfos[remoteUser.uid]?.avatarUrl,
                  stream: undefined,
                  isWaiting: false, // 实际流已就绪，不再等待
                };

                console.log('📺 创建已存在用户的远程视频信息:', {
                  视频ID: remoteVideoInfo.id,
                  用户ID: remoteUser.uid,
                  昵称: remoteVideoInfo.nickname,
                  摄像头状态: remoteVideoInfo.cameraEnabled,
                  静音状态: remoteVideoInfo.muted,
                });

                // 添加到videos数组
                videos.push(remoteVideoInfo);

                // 通知UI更新
                this.onRemoteVideoReady?.(remoteVideoInfo);

                // 延迟播放远程视频，增加延迟确保DOM元素已渲染
                setTimeout(() => {
                  this.playRemoteVideoToExistingElements(remoteUser.videoTrack, remoteUser.uid);
                }, 2000);
              } else {
                // 没有视频流，但有音频流，创建音频用户信息
                const remoteVideoInfo: VideoWindowProps = {
                  id: `remote-${remoteUser.uid}`,
                  isLocalVideo: false,
                  muted: !remoteUser.hasAudio,
                  cameraEnabled: false, // 没有视频流，显示头像
                  nickname: this.userInfos[remoteUser.uid]?.nickname || remoteUser.uid,
                  avatar: this.userInfos[remoteUser.uid]?.avatarUrl,
                  stream: undefined,
                  isWaiting: false,
                };

                console.log('🎙️ 创建纯音频用户信息:', {
                  视频ID: remoteVideoInfo.id,
                  用户ID: remoteUser.uid,
                  昵称: remoteVideoInfo.nickname,
                });

                videos.push(remoteVideoInfo);
                this.onRemoteVideoReady?.(remoteVideoInfo);
              }

              // 更新加入的成员列表
              this.updateJoinedMember(remoteUser, 'audio', remoteUser.hasAudio);
              if (remoteUser.hasVideo) {
                this.updateJoinedMember(remoteUser, 'video', true);
              }
            } catch (error) {
              console.error(`❌ 订阅用户 ${remoteUser.uid} 的流失败:`, error);
            }
          }

          console.log('🎉 完成远程用户流订阅，总视频数量:', videos.length);
        } else {
          console.log('💭 暂未发现远程用户');
        }

        // 最终调用 onCallStart
        this.onCallStart?.(videos);
      };

      // 延迟执行，确保 Agora SDK 有足够时间同步远程用户信息
      setTimeout(checkAndSubscribeRemoteUsers, 1000);
    } else {
      // 非多人通话或已有多个视频，直接调用onCallStart
      this.onCallStart?.(videos);
    }

    // 通知状态变化
    this.onStateChange?.({
      status: this.callStatus,
      callInfo: this.currentCallInfo,
    });

    console.log('Successfully joined call:', uid);
  }

  // 挂断通话
  async hangup(reason: string = 'normal', isCancel: boolean = false) {
    // 清理定时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    // 关闭音视频轨道
    if (this.rtc.localAudioTrack) {
      this.rtc.localAudioTrack.close();
      this.rtc.localAudioTrack = null;
    }
    if (this.rtc.localVideoTrack) {
      this.rtc.localVideoTrack.close();
      this.rtc.localVideoTrack = null;
    }

    // 🔧 清理所有远程音视频轨道
    this.remoteVideoTracks.forEach((track, userId) => {
      try {
        track.stop();
        console.log(`清理用户 ${userId} 的视频轨道`);
      } catch (error) {
        console.warn(`清理用户 ${userId} 视频轨道失败:`, error);
      }
    });
    this.remoteVideoTracks.clear();

    this.remoteAudioTracks.forEach((track, userId) => {
      try {
        track.stop();
        console.log(`清理用户 ${userId} 的音频轨道`);
      } catch (error) {
        console.warn(`清理用户 ${userId} 音频轨道失败:`, error);
      }
    });
    this.remoteAudioTracks.clear();

    // 清理旧的远程音视频轨道引用（向后兼容）
    if (this.rtc.remoteAudioTrack) {
      this.rtc.remoteAudioTrack.stop();
      this.rtc.remoteAudioTrack = null;
    }
    if (this.rtc.remoteVideoTrack) {
      this.rtc.remoteVideoTrack.stop();
      this.rtc.remoteVideoTrack = null;
    }
    this.rtc.remoteUser = null;

    // 发送取消消息
    if (isCancel && this.currentCallInfo) {
      if (
        this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
      ) {
        // 多人通话：向所有邀请的成员发送取消消息
        this.invitedMembers.forEach(member => {
          this.sendCancelMessage(member);
        });
      } else {
        // 一对一通话
        this.sendCancelMessage(this.currentCallInfo.calleeIMName);
      }
    }

    // 移除 Agora RTC 事件监听器
    if (this.client) {
      this.client.removeAllListeners();

      // 如果已经加入了频道，先离开频道
      if (this.callStatus === CALL_STATUS.IN_CALL) {
        await this.client.leave();
      }
    }

    // 触发回调
    this.onCallEnd?.(reason);
    this.onStateChange?.({
      type: 'hangup',
      reason: reason,
      callInfo: {
        ...this.currentCallInfo,
        duration: this.callDuration,
      },
    });

    // 重置状态
    this.callStatus = CALL_STATUS.IDLE;
    this.currentCallInfo = null;
    this.callDuration = '00:00';
    this.joinedMembers = [];
    this.invitedMembers = [];
    // 清理本地视频流缓存
    this.localVideoStream = null;
    // 🔧 重置扬声器状态为默认开启
    this.speakerEnabled = true;

    console.log('通话已挂断，原因:', reason);
  }

  // 发送取消消息
  private sendCancelMessage(to?: string) {
    if (!this.currentCallInfo || !to) return;
    console.log('---->sendCancelMessage', this.currentCallInfo, to);
    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: to,
      action: 'rtcCall',
      ext: {
        action: 'cancelCall',
        callerDevId: this.currentCallInfo.callerDevId,
        callId: this.currentCallInfo.callId,
        ts: Date.now(),
        msgType: 'rtcCallWithAgora',
      },
    });

    this.connection.send(msg);
  }

  // 开始通话计时
  private startCallTimer() {
    let seconds = 0;
    this.intervalTimer = setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      this.callDuration = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      this.onCallDurationUpdate?.(this.callDuration);
    }, 1000);
  }

  // 添加 Agora RTC 事件监听器
  private addAgoraRTCListeners() {
    // 监听远程用户发布流
    this.client.on('user-published', async (user: any, mediaType: string) => {
      console.log('📡 收到 user-published 事件:', {
        用户ID: user.uid,
        媒体类型: mediaType,
        当前通话状态: this.callStatus,
        当前成员数量: this.joinedMembers.length,
      });

      // 触发回调
      this.onUserPublished?.(user, mediaType);

      try {
        // 订阅远程用户流
        await this.client.subscribe(user, mediaType);

        // 获取用户ID映射
        const userId = user.uid; // 这里可能需要从 uid2userids 映射获取真实的 userId

        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          // 🔧 修改：将视频轨道存储到用户专用的Map中
          this.remoteVideoTracks.set(user.uid, remoteVideoTrack);

          // 保持向后兼容（为了兼容可能存在的旧代码）
          this.rtc.remoteVideoTrack = remoteVideoTrack;
          this.rtc.remoteUser = user;

          console.log('🎬 远程视频轨道已保存到Map:', {
            hasVideoTrack: !!remoteVideoTrack,
            userId: user.uid,
            trackId: remoteVideoTrack?.getTrackId?.(),
            totalVideoTracks: this.remoteVideoTracks.size,
          });

          // 🔧 获取远程视频流
          const remoteVideoStream = this.getRemoteVideoStream(user.uid);
          console.log('🎬 获取远程视频流结果:', {
            用户ID: user.uid,
            视频轨道存在: !!this.remoteVideoTracks.get(user.uid),
            视频流存在: !!remoteVideoStream,
            轨道ID: remoteVideoTrack?.getTrackId?.(),
          });

          // 创建远程视频信息
          const remoteVideoInfo: VideoWindowProps = {
            id: `remote-${user.uid}`,
            isLocalVideo: false,
            muted: this.getRemoteUserMutedStatus(user.uid), // 获取当前音频状态
            cameraEnabled: true, // 摄像头开启
            nickname: this.userInfos[userId]?.nickname || userId,
            avatar: this.userInfos[userId]?.avatarUrl,
            // 🔧 修复：设置正确的视频流，用于最小化窗口显示
            stream: remoteVideoStream,
            isWaiting: false, // 明确设置不在等待状态，用于替换等待窗口
          };

          console.log('📺 创建远程视频信息:', {
            视频ID: remoteVideoInfo.id,
            用户ID: userId,
            昵称: remoteVideoInfo.nickname,
            摄像头状态: remoteVideoInfo.cameraEnabled,
            静音状态: remoteVideoInfo.muted,
            用户信息: this.userInfos[userId],
            是否替换等待窗口: remoteVideoInfo.isWaiting === false,
          });

          // 通知有新的远程视频流
          console.log('🔔 调用 onRemoteVideoReady 通知UI，可能替换等待窗口');
          console.log('🔔 发送给UI的完整视频信息:', {
            id: remoteVideoInfo.id,
            cameraEnabled: remoteVideoInfo.cameraEnabled,
            isWaiting: remoteVideoInfo.isWaiting,
            muted: remoteVideoInfo.muted,
            nickname: remoteVideoInfo.nickname,
            stream: !!remoteVideoInfo.stream,
          });
          this.onRemoteVideoReady?.(remoteVideoInfo);

          // 🔧 改进：使用事件驱动的方式等待视频元素准备好
          const videoId = `remote-${user.uid}`;
          this.pendingVideoTracks.set(videoId, remoteVideoTrack);

          // 等待视频元素准备好，最多等待10秒
          this.waitForVideoElement(videoId, remoteVideoTrack, 10000);

          console.log('远程用户开启了摄像头，切换到视频显示:', userId);
        }

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          // 🔧 修改：将音频轨道存储到用户专用的Map中
          this.remoteAudioTracks.set(user.uid, remoteAudioTrack);

          // 保持向后兼容
          this.rtc.remoteAudioTrack = remoteAudioTrack;
          this.rtc.remoteUser = user;

          // 🔧 新增：根据当前扬声器状态设置新音频轨道的音量
          if (remoteAudioTrack && remoteAudioTrack.setVolume) {
            const volume = this.speakerEnabled ? 100 : 0;
            remoteAudioTrack.setVolume(volume);
            console.log(
              `🔧 新用户 ${user.uid} 音频轨道音量设置为: ${volume} (扬声器状态: ${
                this.speakerEnabled ? '开启' : '关闭'
              })`,
            );
          }

          // 播放远程音频
          remoteAudioTrack.play();

          console.log('🎤 远程音频轨道已保存到Map:', {
            hasAudioTrack: !!remoteAudioTrack,
            userId: user.uid,
            totalAudioTracks: this.remoteAudioTracks.size,
            speakerEnabled: this.speakerEnabled,
          });

          // 🔧 1v1视频通话特殊处理：当只是音频状态变化时，不触发onRemoteVideoReady以避免闪动
          const is1v1VideoCall = this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1;
          const isExistingUser = this.joinedMembers.some(member => member.uid === user.uid);

          if (is1v1VideoCall && isExistingUser) {
            console.log(
              '🔇 1v1视频通话：检测到现有用户的音频状态变化，跳过onRemoteVideoReady调用以避免闪动:',
              {
                用户ID: user.uid,
                媒体类型: mediaType,
              },
            );
            // 只更新成员状态，不触发UI更新
            this.updateJoinedMember(user, mediaType, true);
            console.log('更新成员状态 - 开启媒体流:', { uid: user.uid, mediaType, enabled: true });
            return;
          }

          // 🔧 修复：在音频事件中，智能判断摄像头状态
          // 如果用户已经有视频轨道，说明摄像头开启；否则检查成员状态
          const hasVideoTrack = this.remoteVideoTracks.has(user.uid);
          const memberCameraStatus = this.getRemoteUserCameraStatus(user.uid);
          const cameraEnabled = hasVideoTrack || memberCameraStatus;

          console.log('🎤 音频事件中判断摄像头状态:', {
            用户ID: user.uid,
            有视频轨道: hasVideoTrack,
            成员摄像头状态: memberCameraStatus,
            最终摄像头状态: cameraEnabled,
          });

          // 创建更新后的视频信息（开启麦克风状态）
          const updatedVideoInfo: VideoWindowProps = {
            id: `remote-${user.uid}`,
            isLocalVideo: false,
            muted: false, // 麦克风开启
            cameraEnabled: cameraEnabled,
            nickname: this.userInfos[userId]?.nickname || userId,
            avatar: this.userInfos[userId]?.avatarUrl,
            // 保持当前的视频流状态
            stream: cameraEnabled ? this.getRemoteVideoStream(user.uid) : undefined,
            isWaiting: false, // 明确设置不在等待状态
          };

          console.log('🎤 更新音频状态，通知UI:', {
            视频ID: updatedVideoInfo.id,
            用户ID: userId,
            麦克风状态: '开启',
            摄像头状态: updatedVideoInfo.cameraEnabled,
          });

          // 通知UI更新远程视频状态
          this.onRemoteVideoReady?.(updatedVideoInfo);

          console.log('远程用户开启了麦克风:', userId);
        }

        // 更新加入的成员列表
        this.updateJoinedMember(user, mediaType, true);

        console.log('Updated joinedMembers:', this.joinedMembers);
      } catch (error) {
        console.error('Failed to subscribe to remote user:', error);
      }
    });

    // 监听远程用户离开
    this.client.on('user-left', (user: any, reason: string) => {
      console.log('user-left:', user, reason);

      // 触发回调
      this.onUserLeft?.(user, reason);

      // 🔧 清理离开用户的所有媒体轨道
      const videoTrack = this.remoteVideoTracks.get(user.uid);
      const audioTrack = this.remoteAudioTracks.get(user.uid);

      if (videoTrack) {
        try {
          videoTrack.stop();
          console.log(`🎬 清理用户 ${user.uid} 的视频轨道`);
        } catch (error) {
          console.warn(`清理用户 ${user.uid} 视频轨道失败:`, error);
        }
        this.remoteVideoTracks.delete(user.uid);
      }

      if (audioTrack) {
        try {
          audioTrack.stop();
          console.log(`🎤 清理用户 ${user.uid} 的音频轨道`);
        } catch (error) {
          console.warn(`清理用户 ${user.uid} 音频轨道失败:`, error);
        }
        this.remoteAudioTracks.delete(user.uid);
      }

      // 移除离开的用户
      this.joinedMembers = this.joinedMembers.filter(member => member.uid !== user.uid);

      // 如果是1v1通话，远程用户离开则挂断
      if (
        this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1 ||
        this.currentCallInfo?.type === CALL_TYPE.AUDIO_1V1
      ) {
        this.hangup('user-left');
      } else if (
        this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo?.type === CALL_TYPE.AUDIO_MULTI
      ) {
        // 多人通话：通知UI移除离开用户的视频窗口
        const removedVideoInfo: VideoWindowProps = {
          id: `remote-${user.uid}`,
          isLocalVideo: false,
          muted: true,
          cameraEnabled: false,
          nickname: this.userInfos[user.uid]?.nickname || user.uid,
          avatar: this.userInfos[user.uid]?.avatarUrl,
          stream: undefined,
          // 添加特殊标记表示用户已离开
          removed: true,
        };

        // 通知UI移除视频窗口
        this.onRemoteVideoReady?.(removedVideoInfo);
        console.log('多人通话：通知UI移除离开用户的视频窗口:', user.uid);
      }
    });

    // 监听远程用户停止发布流
    this.client.on('user-unpublished', (user: any, mediaType: string) => {
      console.log('user-unpublished:', user, mediaType);

      // 触发回调
      this.onUserUnpublished?.(user, mediaType);

      const userId = user.uid;

      if (mediaType === 'video') {
        // 停止视频播放
        if (user.videoTrack) {
          user.videoTrack.stop();
        }

        // 🔧 从Map中清理用户的视频轨道
        this.remoteVideoTracks.delete(user.uid);

        // 清理远程视频轨道引用
        if (this.rtc.remoteVideoTrack && this.rtc.remoteUser?.uid === user.uid) {
          this.rtc.remoteVideoTrack = null;
        }
        console.log('---->this.userInfos', this.userInfos);
        // 创建更新后的视频信息（关闭摄像头，显示头像）
        const updatedVideoInfo: VideoWindowProps = {
          id: `remote-${user.uid}`,
          isLocalVideo: false,
          muted: this.getRemoteUserMutedStatus(user.uid), // 获取当前音频状态
          cameraEnabled: false, // 摄像头关闭
          nickname: this.userInfos[userId]?.nickname || userId,
          avatar: this.userInfos[userId]?.avatarUrl,
          // 移除stream，这样UI会显示头像
          stream: undefined,
          isWaiting: false, // 明确设置不在等待状态
        };

        // 通知UI更新远程视频状态
        this.onRemoteVideoReady?.(updatedVideoInfo);

        console.log('远程用户关闭了摄像头，切换到头像显示:', {
          userId,
          nickname: this.userInfos[userId]?.nickname,
          hasAvatar: !!this.userInfos[userId]?.avatarUrl,
        });
      }

      if (mediaType === 'audio') {
        // 停止音频播放
        if (user.audioTrack) {
          user.audioTrack.stop();
        }

        // 🔧 从Map中清理用户的音频轨道
        this.remoteAudioTracks.delete(user.uid);

        // 清理远程音频轨道引用
        if (this.rtc.remoteAudioTrack && this.rtc.remoteUser?.uid === user.uid) {
          this.rtc.remoteAudioTrack = null;
        }

        // 🔧 1v1视频通话特殊处理：当只是音频状态变化时，不触发onRemoteVideoReady以避免闪动
        const is1v1VideoCall = this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1;
        const isExistingUser = this.joinedMembers.some(member => member.uid === user.uid);

        if (is1v1VideoCall && isExistingUser) {
          console.log(
            '🔇 1v1视频通话：检测到现有用户的音频状态变化，跳过onRemoteVideoReady调用以避免闪动:',
            {
              用户ID: user.uid,
              媒体类型: mediaType,
            },
          );
          // 只更新成员状态，不触发UI更新
          this.updateJoinedMember(user, mediaType, false);
          console.log('更新成员状态 - 关闭媒体流:', { uid: user.uid, mediaType, enabled: false });
          return;
        }

        // 🔧 修复：在音频停止事件中，智能判断摄像头状态
        const hasVideoTrack = this.remoteVideoTracks.has(user.uid);
        const memberCameraStatus = this.getRemoteUserCameraStatus(user.uid);
        const cameraEnabled = hasVideoTrack || memberCameraStatus;

        console.log('🎤 音频停止事件中判断摄像头状态:', {
          用户ID: user.uid,
          有视频轨道: hasVideoTrack,
          成员摄像头状态: memberCameraStatus,
          最终摄像头状态: cameraEnabled,
        });

        // 创建更新后的视频信息（关闭麦克风状态）
        const updatedVideoInfo: VideoWindowProps = {
          id: `remote-${user.uid}`,
          isLocalVideo: false,
          muted: true, // 麦克风关闭
          cameraEnabled: cameraEnabled,
          nickname: this.userInfos[userId]?.nickname || userId,
          avatar: this.userInfos[userId]?.avatarUrl,
          // 保持当前的视频流状态
          stream: cameraEnabled ? this.getRemoteVideoStream(user.uid) : undefined,
          isWaiting: false, // 明确设置不在等待状态
        };

        // 通知UI更新远程视频状态
        this.onRemoteVideoReady?.(updatedVideoInfo);

        console.log('远程用户关闭了麦克风:', userId);
      }

      // 更新成员状态
      this.updateJoinedMember(user, mediaType, false);
      console.log('更新成员状态 - 关闭媒体流:', { uid: user.uid, mediaType, enabled: false });
    });

    // 🔧 新增：监听谁在说话
    this.client.on('volume-indicator', (volumes: any[]) => {
      console.log('🔊 音量指示器事件:', volumes);

      // 🔧 修复：使用配置的音量阈值而不是硬编码的60
      const talkingUsers = volumes
        .filter(volume => volume.level > this.speakingVolumeThreshold)
        .map(volume => volume.uid);

      // 🔧 新增：检查本地用户是否在说话
      const localTalkingUsers = [...talkingUsers];
      if (this.isMuted()) {
        // 如果本地用户静音，从说话列表中移除
        const localIndex = localTalkingUsers.indexOf(this.agoraUid);
        if (localIndex > -1) {
          localTalkingUsers.splice(localIndex, 1);
        }
      }

      console.log(
        '🎤 正在说话的用户:',
        localTalkingUsers,
        '本地用户ID:',
        this.agoraUid,
        '音量阈值:',
        this.speakingVolumeThreshold,
      );

      // 通知UI更新说话状态
      this.onTalkingUsersChange?.(localTalkingUsers);
    });
  }

  // 添加消息监听器
  private addMessageListener() {
    console.log('addMessageListener this.connection -->', this.connection);
    this.connection.addEventHandler('callkit', {
      onTextMessage: (message: any) => {
        console.log('onTextMessage message -->', message);
        // if (message.chatType !== 'singleChat') return;

        if (message.ext && message.ext.action === 'invite') {
          this.handleInvitationMessage(message);
        }
      },

      onCmdMessage: (message: any) => {
        console.log('onCmdMessage message -->', message);
        if (message.action === 'rtcCall') {
          this.handleSignalMessage(message);
        }
      },
    });
  }

  // 处理邀请消息
  private async handleInvitationMessage(message: any) {
    if (message.from === this.connection.context.jid.name) {
      return; // 忽略自己发送的消息
    }

    const ext = message.ext;

    // 检查是否忙线
    if (this.callStatus > CALL_STATUS.IDLE) {
      // 🔧 修复：发送 busy 消息给新的邀请人，而不是当前通话的人
      const newInvitationInfo = {
        callerIMName: ext.callerIMName,
        callerDevId: ext.callerDevId,
        callId: ext.callId,
      };
      console.log('当前正在通话中，发送 busy 消息给新的邀请人:', newInvitationInfo);
      this.sendAnswerCallMessage('busy', newInvitationInfo);
      return;
    }

    // 创建通话信息
    this.currentCallInfo = {
      callId: ext.callId,
      channel: ext.channelName,
      type: ext.type,
      callerDevId: ext.callerDevId,
      callerIMName: ext.callerIMName,
      calleeIMName: ext.type === CALL_TYPE.VIDEO_MULTI ? ext.groupId : message.to,
      groupId: ext.ext?.groupId,
      groupName: ext.ext?.groupName,
    };

    this.callStatus = CALL_STATUS.ALERTING;

    // 如果是1v1视频通话邀请，创建本地视频轨道供预览使用
    // 多人视频通话被叫方不需要预览模式，与发起方保持一致
    if (ext.type === CALL_TYPE.VIDEO_1V1) {
      try {
        console.log('被叫方创建预览模式的本地视频轨道');
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        this.rtc.localVideoTrack = localVideoTrack;

        // 创建本地视频信息供预览模式使用
        const localVideoInfo: VideoWindowProps = {
          id: 'local-preview', // 预览模式使用特殊的 ID
          isLocalVideo: true,
          muted: false,
          cameraEnabled: true,
          nickname: this.userInfos[this.agoraUid]?.nickname || '我',
          avatar: this.userInfos[this.agoraUid]?.avatarUrl,
          stream: undefined, // 不使用 stream，使用 track.play() 方法播放
        };

        // 通知UI显示预览模式的本地视频
        this.onRemoteVideoReady?.(localVideoInfo);

        console.log('被叫方预览模式本地视频轨道创建成功');
      } catch (error) {
        console.error('被叫方创建预览模式本地视频轨道失败:', error);
      }
    } else if (ext.type === CALL_TYPE.VIDEO_MULTI) {
      // 多人视频通话：被叫方不在收到邀请时创建视频轨道
      // 等待用户点击invitation后再创建
      console.log('多人视频通话：被叫方收到邀请，等待用户点击invitation后创建视频轨道');
    }

    // 从 ease_chat_uikit_user_info 中提取邀请人信息
    const callerUserInfo = ext.ease_chat_uikit_user_info;
    const callerName = callerUserInfo?.nickname || message.from;
    const callerAvatar = callerUserInfo?.avatarURL;

    console.log('📨 收到邀请消息，邀请人信息:', {
      from: message.from,
      callerName,
      callerAvatar,
      userInfo: callerUserInfo,
    });

    // 🔧 修复：将被叫方收到邀请时，设置主叫方用户信息到CallService
    if (callerName || callerAvatar) {
      const callerUserInfoMap = {
        [message.from]: {
          nickname: callerName,
          avatarUrl: callerAvatar,
        },
      };
      this.setUserInfo(callerUserInfoMap);
      console.log('📝 被叫方收到邀请时，已设置主叫方用户信息到CallService:', {
        userId: message.from,
        nickname: callerName,
        avatar: callerAvatar,
      });
    }

    // 处理群组信息（如果是群组通话）
    const groupName = ext.ext?.groupName;
    const groupAvatar = ext.ext?.groupAvatar;

    // 如果是群组通话，缓存群组信息
    if (ext.ext?.groupId) {
      const groupId = ext.ext.groupId;

      console.log('📨 收到群组邀请消息，群组信息:', {
        groupId,
        groupName,
        groupAvatar,
      });

      // 缓存群组信息，供后续使用
      if (groupName || groupAvatar) {
        this.cachedGroupInfos[groupId] = {
          groupName: groupName,
          groupAvatar: groupAvatar,
        };
        console.log('📝 已缓存接收到的群组信息:', {
          groupId,
          cached: this.cachedGroupInfos[groupId],
        });
      }
    }

    // 触发邀请接收回调
    this.onInvitationReceived?.({
      id: ext.callId, // InvitationInfo 需要 id 字段
      callId: ext.callId,
      from: message.from,
      type: this.convertCallTypeToString(ext.type), // 转换枚举值为字符串
      channel: ext.channelName,
      callerDevId: ext.callerDevId,
      callerName: callerName, // 邀请人昵称
      callerAvatar: callerAvatar, // 邀请人头像
      groupId: ext.ext?.groupId,
      groupName: groupName, // 群组名称
      groupAvatar: groupAvatar, // 群组头像
      timestamp: ext.ts || Date.now(), // 邀请时间戳
    });
  }

  // 处理信令消息
  private handleSignalMessage(message: any) {
    const ext = message.ext;
    console.log('---->cmd ext', ext);
    switch (ext.action) {
      case 'alert':
        this.handleAlertMessage(message);
        break;
      case 'confirmRing':
        this.handleConfirmRingMessage(message);
        break;
      case 'answerCall':
        this.handleAnswerCallMessage(message);
        break;
      case 'confirmCallee':
        this.handleConfirmCalleeMessage(message);
        break;
      case 'cancelCall':
        this.handleCancelCallMessage(message);
        break;
      default:
        console.warn(`unexpected action ${ext.action}`);
        break;
    }
  }

  // 处理响铃消息
  private handleAlertMessage(message: any) {
    const ext = message.ext;
    this.sendConfirmRingMessage(message.from, ext.calleeDevId, ext.callerDevId, ext.callId);
  }

  // 发送确认响铃消息
  private sendConfirmRingMessage(
    to: string,
    calleeDevId: string,
    callerDevId: string,
    callId: string,
  ) {
    if (!this.currentCallInfo) return;

    let status = true;
    if (callId !== this.currentCallInfo.callId) {
      console.warn('not current call', callId, this.currentCallInfo.callId);
      status = false;
    }

    if (this.callStatus > CALL_STATUS.RECEIVED_CONFIRM_RING) {
      console.warn('caller is busy');
      status = false;
    }

    if (callerDevId !== this.connection.context.jid.clientResource) {
      console.warn('caller device is different');
      return;
    }

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: to,
      action: 'rtcCall',
      ext: {
        action: 'confirmRing',
        status: status,
        callerDevId: this.connection.context.jid.clientResource,
        calleeDevId: calleeDevId,
        callId: callId,
        ts: Date.now(),
        msgType: 'rtcCallWithAgora',
      },
    });

    this.connection.send(msg);
  }

  // 处理确认响铃消息
  private handleConfirmRingMessage(message: any) {
    const ext = message.ext;

    if (ext.calleeDevId !== this.connection.context.jid.clientResource) {
      console.log('handleConfirmRingMessage ext.calleeDevId -->', ext.calleeDevId);
      return; // 多端情况下的其他设备消息
    }

    if (!ext.status && this.callStatus < CALL_STATUS.RECEIVED_CONFIRM_RING) {
      console.warn('The invitation has expired');
      this.hangup('invitation has expired');
      return;
    }

    this.callStatus = CALL_STATUS.RECEIVED_CONFIRM_RING;
  }

  // 处理应答消息
  private handleAnswerCallMessage(message: any) {
    const ext = message.ext;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 🔧 修复：如果当前正在通话中，不应该因为其他消息而挂断当前通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      console.log('当前正在通话中，忽略 answerCall 消息，不挂断当前通话');
      return;
    }

    if (ext.callerDevId !== this.connection.context.jid.clientResource) {
      if (message.from === this.connection.context.jid.name) {
        // 其他设备处理了
        const reason =
          ext.result === 'accept' ? 'accepted on other devices' : 'refused on other devices';
        console.log('其他设备处理了通话，挂断当前通话');
        this.hangup(reason);
        return;
      }
      return;
    }

    if (ext.result !== 'accept') {
      const reason = ext.result === 'busy' ? 'busy' : 'refused';
      this.sendConfirmCalleeMessage(message.from, ext.calleeDevId, ext.result);

      // 🔧 修复：多人通话中，单个用户拒绝不应该挂断整个通话
      if (
        this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo?.type === CALL_TYPE.AUDIO_MULTI
      ) {
        // 多人通话：只记录拒绝状态，不挂断通话
        console.log(`多人通话中用户 ${message.from} 拒绝了通话 (${reason})，继续等待其他用户响应`);

        // 从邀请列表中移除拒绝的用户
        this.invitedMembers = this.invitedMembers.filter(member => member !== message.from);

        // 触发状态变化回调，通知UI用户拒绝状态
        this.onStateChange?.({
          type: 'user_declined',
          userId: message.from,
          reason: reason,
          callInfo: this.currentCallInfo,
        });
      } else {
        // 一对一通话：保持原有逻辑，拒绝则挂断
        console.log('一对一通话被拒绝，挂断通话');
        this.hangup(reason);
      }
    } else {
      console.log('收到接受通话的消息，发送确认消息');
      this.sendConfirmCalleeMessage(message.from, ext.calleeDevId, ext.result);
    }
  }

  // 发送确认被叫方消息
  private sendConfirmCalleeMessage(to: string, calleeDevId: string, result: string) {
    if (!this.currentCallInfo) return;

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: to,
      action: 'rtcCall',
      ext: {
        action: 'confirmCallee',
        result: result,
        callerDevId: this.connection.context.jid.clientResource,
        calleeDevId: calleeDevId,
        callId: this.currentCallInfo.callId,
        ts: Date.now(),
        msgType: 'rtcCallWithAgora',
      },
    });

    this.connection.send(msg);

    if (result === 'accept') {
      // 主叫方接受后，自动加入通话（如果还没有加入的话）
      if (this.callStatus !== CALL_STATUS.IN_CALL) {
        this.callStatus = CALL_STATUS.CONFIRM_CALLEE;
        this.joinCall();
      } else {
        console.log('已经在通话中，跳过重复加入频道操作');
      }
    }
  }

  // 处理确认被叫方消息
  private handleConfirmCalleeMessage(message: any) {
    const ext = message.ext;

    // 🔧 修复：如果当前正在通话中，不应该因为其他消息而挂断当前通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      console.log('当前正在通话中，忽略 confirmCallee 消息，不挂断当前通话');
      return;
    }

    if (ext.calleeDevId !== this.connection.context.jid.clientResource) {
      console.log('收到其他设备的 confirmCallee 消息，挂断当前通话');
      this.hangup('processed on other devices');
      return;
    }

    if (ext.result !== 'accept') {
      console.log('收到拒绝或忙线的 confirmCallee 消息，挂断通话');
      this.hangup(ext.result);
      return;
    }

    // 被叫方确认后，自动加入通话
    this.callStatus = CALL_STATUS.CONFIRM_CALLEE;
    this.joinCall();
  }

  // 处理取消消息
  private handleCancelCallMessage(message: any) {
    if (message.from === this.connection.context.jid.name) {
      return; // 忽略自己发送的消息
    }

    // 🔧 修复：如果当前正在通话中，不应该挂断当前通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      console.log('当前正在通话中，忽略 cancelCall 消息，不挂断当前通话');
      return;
    }

    if (this.currentCallInfo && message.from === this.currentCallInfo.callerIMName) {
      console.log('收到 cancelCall 消息，挂断通话');
      this.hangup('cancel');
    }
  }

  // 切换静音状态
  toggleMute(): boolean {
    if (
      this.callStatus < CALL_STATUS.CONFIRM_RING ||
      this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING
    ) {
      console.warn('not joined the call yet');
      return false;
    }

    if (!this.rtc.localAudioTrack) {
      console.warn('本地音频轨道不存在');
      return false;
    }

    const currentEnabled = this.rtc.localAudioTrack.enabled;
    const newEnabled = !currentEnabled;

    // 直接设置轨道的启用状态，不触发UI更新
    this.rtc.localAudioTrack.setEnabled && this.rtc.localAudioTrack.setEnabled(newEnabled);

    console.log('麦克风状态:', newEnabled ? '开启' : '关闭');

    // 🔧 新增：通知UI更新本地视频状态
    const localVideoInfo: VideoWindowProps = {
      id: 'local',
      isLocalVideo: true,
      muted: !newEnabled, // 返回muted状态（与enabled相反）
      cameraEnabled: this.isCameraEnabled(),
      nickname: this.userInfos[this.agoraUid]?.nickname || '我',
      avatar: this.userInfos[this.agoraUid]?.avatarUrl || undefined,
      stream: undefined,
    };

    this.onRemoteVideoReady?.(localVideoInfo);

    console.log('本地视频静音状态已更新:', {
      muted: localVideoInfo.muted,
      nickname: localVideoInfo.nickname,
      hasAvatar: !!localVideoInfo.avatar,
    });

    return !newEnabled; // 返回muted状态（与enabled相反）
  }

  // 切换摄像头状态
  toggleCamera(): boolean {
    if (
      this.callStatus < CALL_STATUS.CONFIRM_RING ||
      this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING
    ) {
      console.warn('not joined the call yet');
      return false;
    }

    if (!this.rtc.localVideoTrack) {
      console.warn('本地视频轨道不存在');
      return false;
    }

    const currentEnabled = this.rtc.localVideoTrack.enabled;
    const newEnabled = !currentEnabled;

    // 直接设置轨道的启用状态，不创建新的流
    this.rtc.localVideoTrack.setEnabled && this.rtc.localVideoTrack.setEnabled(newEnabled);

    console.log('摄像头状态:', newEnabled ? '开启' : '关闭');

    // 如果摄像头开启，播放本地视频
    if (newEnabled) {
      setTimeout(() => {
        this.playLocalVideo();
      }, 100);
    }

    // 通知UI更新本地视频状态
    const localVideoInfo: VideoWindowProps = {
      id: 'local',
      isLocalVideo: true,
      muted: this.isMuted(),
      cameraEnabled: newEnabled,
      nickname: this.userInfos[this.agoraUid]?.nickname || '我',
      avatar: this.userInfos[this.agoraUid]?.avatarUrl || undefined, // 确保有值或为undefined
      // 不使用stream，因为我们用track.play()直接播放
      stream: undefined,
    };

    this.onRemoteVideoReady?.(localVideoInfo);

    console.log('本地视频状态已更新:', {
      cameraEnabled: newEnabled,
      muted: localVideoInfo.muted,
      nickname: localVideoInfo.nickname,
      hasAvatar: !!localVideoInfo.avatar,
    });

    return newEnabled;
  }

  // 🔧 新增：扬声器状态管理
  private speakerEnabled: boolean = true; // 内部扬声器状态

  // 🔧 新增：切换扬声器状态
  toggleSpeaker(): boolean {
    if (
      this.callStatus < CALL_STATUS.CONFIRM_RING ||
      this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING
    ) {
      console.warn('not joined the call yet');
      return false;
    }

    // 切换内部扬声器状态
    this.speakerEnabled = !this.speakerEnabled;
    const newSpeakerEnabled = this.speakerEnabled;

    console.log(
      '扬声器状态切换:',
      !newSpeakerEnabled ? '开启' : '关闭',
      '->',
      newSpeakerEnabled ? '开启' : '关闭',
    );

    // 控制所有远程音频轨道的音量
    this.remoteAudioTracks.forEach((audioTrack, userId) => {
      if (audioTrack && audioTrack.setVolume) {
        const volume = newSpeakerEnabled ? 100 : 0;
        audioTrack.setVolume(volume);
        console.log(`用户 ${userId} 音频轨道音量设置为:`, volume);
      }
    });

    // 注意：不应该控制本地音频轨道的音量，因为这会静音自己的声音
    // 扬声器控制只影响远程音频轨道的播放音量

    console.log('扬声器状态:', newSpeakerEnabled ? '开启' : '关闭');

    return newSpeakerEnabled;
  }

  // 🔧 新增：获取当前扬声器状态
  isSpeakerEnabled(): boolean {
    return this.speakerEnabled;
  }

  // 🔧 新增：设置扬声器音量
  setSpeakerVolume(volume: number): void {
    if (volume < 0 || volume > 100) {
      console.warn('音量值必须在 0-100 之间');
      return;
    }

    console.log('设置扬声器音量为:', volume);

    // 设置所有远程音频轨道的音量
    this.remoteAudioTracks.forEach((audioTrack, userId) => {
      if (audioTrack && audioTrack.setVolume) {
        audioTrack.setVolume(volume);
        console.log(`用户 ${userId} 音频轨道音量设置为:`, volume);
      }
    });

    // 注意：不应该控制本地音频轨道的音量，因为这会静音自己的声音
    // 扬声器控制只影响远程音频轨道的播放音量
  }

  // 获取当前静音状态
  isMuted(): boolean {
    return this.rtc.localAudioTrack ? !this.rtc.localAudioTrack.enabled : false;
  }

  // 获取当前摄像头状态
  isCameraEnabled(): boolean {
    return this.rtc.localVideoTrack ? this.rtc.localVideoTrack.enabled : false;
  }

  // 获取加入的成员列表
  getJoinedMembers(): any[] {
    return [...this.joinedMembers];
  }

  // 刷新本地视频状态显示
  refreshLocalVideoStatus() {
    if (this.callStatus === CALL_STATUS.IN_CALL && this.rtc.localVideoTrack) {
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: this.isMuted(),
        cameraEnabled: this.isCameraEnabled(),
        nickname: this.userInfos[this.agoraUid]?.nickname || '我',
        avatar: this.userInfos[this.agoraUid]?.avatarUrl,
        stream: this.isCameraEnabled() ? this.getOrCreateLocalVideoStream() : undefined,
      };

      // 通知UI更新本地视频状态
      this.onRemoteVideoReady?.(localVideoInfo);

      // 如果摄像头开启，尝试播放本地视频
      if (this.isCameraEnabled()) {
        this.playLocalVideo();
      }

      console.log('本地视频状态已刷新:', {
        cameraEnabled: localVideoInfo.cameraEnabled,
        muted: localVideoInfo.muted,
        hasAvatar: !!localVideoInfo.avatar,
      });
    }
  }

  // 手动播放本地视频（供外部调用）
  playLocalVideoManually() {
    console.log('手动触发本地视频播放');
    this.playLocalVideo();
  }

  // 为多人视频通话创建本地视频轨道（供UI调用）
  async createLocalVideoTrackForGroupCall(): Promise<boolean> {
    if (!this.currentCallInfo || this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI) {
      console.warn('不是多人视频通话，无法创建本地视频轨道');
      return false;
    }

    if (this.rtc.localVideoTrack) {
      console.log('本地视频轨道已存在');
      return true;
    }

    try {
      console.log('多人视频通话：点击invitation后创建本地视频轨道');
      const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      this.rtc.localVideoTrack = localVideoTrack;

      // 创建本地视频信息供UI显示
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: false,
        cameraEnabled: true,
        nickname: this.userInfos[this.agoraUid]?.nickname || '我',
        avatar: this.userInfos[this.agoraUid]?.avatarUrl,
        stream: undefined, // 不使用 stream，等待手动播放
      };

      // 通知UI显示本地视频
      this.onRemoteVideoReady?.(localVideoInfo);

      // 延迟播放本地视频，确保UI已经准备好
      setTimeout(() => {
        this.playLocalVideo();
      }, 500);

      console.log('多人视频通话：点击invitation后本地视频轨道创建成功');
      return true;
    } catch (error) {
      console.error('多人视频通话：点击invitation后创建本地视频轨道失败:', error);
      return false;
    }
  }

  // 处理从最小化恢复时重新播放本地视频
  onRestoreFromMinimized() {
    console.log('从最小化恢复，检查是否需要重新播放本地视频');

    // 如果正在通话中且有本地视频轨道且摄像头开启，重新播放视频
    if (
      this.callStatus === CALL_STATUS.IN_CALL &&
      this.rtc.localVideoTrack &&
      this.rtc.localVideoTrack.enabled
    ) {
      console.log('检测到本地视频轨道开启，延迟重新播放视频');

      // 使用延迟确保DOM元素已经重新渲染
      setTimeout(() => {
        this.playLocalVideo();
      }, 300); // 等待动画完成和DOM更新

      // 额外的保险措施：再次尝试播放
      setTimeout(() => {
        this.playLocalVideo();
      }, 600);
    }
  }

  // 播放本地视频的通用方法
  private playLocalVideo() {
    if (!this.rtc.localVideoTrack || !this.rtc.localVideoTrack.enabled) {
      console.log('本地视频轨道不存在或未启用');
      return;
    }

    // 使用较长的延迟确保DOM更新完成
    setTimeout(() => {
      let played = false;

      // 尝试多种可能的元素选择器
      const selectors = [
        // 尝试找到所有可能的video元素
        '.cui-callkit-window-local video',
        '.cui-callkit-pip-video video',
        '.cui-callkit-main-video video',
        '.cui-callkit-video video',
        '[data-video-id="local"]',
        '#local-player',
        'video[data-local="true"]',
        // 最后尝试找到任何video元素
        'video',
      ];

      // 先打印所有存在的video元素，用于调试
      const allVideos = document.querySelectorAll('video');
      console.log('页面上所有的video元素:', allVideos);

      for (const selector of selectors) {
        const videoElement = document.querySelector(selector) as HTMLVideoElement;
        console.log(`尝试选择器 ${selector}:`, videoElement);

        if (videoElement) {
          try {
            console.log(`尝试播放本地视频到: ${selector}`, videoElement);
            this.rtc.localVideoTrack.play(videoElement);
            played = true;
            console.log('本地视频播放成功');
            break;
          } catch (error) {
            console.warn(`播放到 ${selector} 失败:`, error);
          }
        }
      }

      // 如果所有元素都没找到，不再尝试字符串ID播放
      if (!played) {
        console.error('无法找到合适的video元素播放本地视频');
      }
    }, 200); // 增加延迟时间到200ms
  }

  // 获取或创建本地视频流（避免重复创建导致视频闪烁）
  private getOrCreateLocalVideoStream(): MediaStream | undefined {
    if (!this.rtc.localVideoTrack) {
      return undefined;
    }

    // 如果已有缓存的流，检查轨道是否仍然有效
    if (this.localVideoStream) {
      const tracks = this.localVideoStream.getVideoTracks();
      if (tracks.length > 0 && tracks[0] === this.rtc.localVideoTrack.getMediaStreamTrack()) {
        // 轨道仍然有效，复用现有流
        return this.localVideoStream;
      } else {
        // 轨道已变化，清除旧流
        this.localVideoStream = null;
      }
    }

    // 创建新的流并缓存
    this.localVideoStream = new MediaStream([this.rtc.localVideoTrack.getMediaStreamTrack()]);
    return this.localVideoStream;
  }

  // 获取远程用户的静音状态
  private getRemoteUserMutedStatus(uid: string): boolean {
    const member = this.joinedMembers.find(member => member.uid === uid);
    return member ? !member.audioEnabled : false;
  }

  // 获取远程用户的摄像头状态
  private getRemoteUserCameraStatus(uid: string): boolean {
    const member = this.joinedMembers.find(member => member.uid === uid);
    if (member) {
      return member.videoEnabled;
    }

    // 🔧 修复：为新用户提供合理的默认值
    // 在多人视频通话中，假设新用户的摄像头是开启的
    if (
      this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ||
      this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1
    ) {
      console.log(`📹 新用户 ${uid} 的摄像头状态未知，在视频通话中默认为开启`);
      return true;
    }

    return false;
  }

  // 获取远程用户的视频流
  // 🔧 改进：从远程视频轨道中获取 MediaStream
  private getRemoteVideoStream(uid: string): MediaStream | undefined {
    const videoTrack = this.remoteVideoTracks.get(uid);
    console.log(`🎬 尝试获取用户 ${uid} 的视频流:`, {
      hasVideoTrack: !!videoTrack,
      videoTrackType: videoTrack?.constructor?.name,
      hasGetMediaStream: !!videoTrack?.getMediaStream,
      hasGetTrackId: !!videoTrack?.getTrackId,
      videoTrackKeys: videoTrack ? Object.keys(videoTrack) : [],
    });

    if (videoTrack) {
      // 尝试方法1：getMediaStream
      if (videoTrack.getMediaStream && typeof videoTrack.getMediaStream === 'function') {
        try {
          const mediaStream = videoTrack.getMediaStream();
          console.log(`🎬 方法1成功：从轨道获取 MediaStream: ${uid}`, {
            hasMediaStream: !!mediaStream,
            trackId: videoTrack.getTrackId?.(),
          });
          return mediaStream;
        } catch (error) {
          console.warn(`🎬 方法1失败：从轨道获取 MediaStream 失败: ${uid}`, error);
        }
      }

      // 尝试方法2：直接访问 mediaStream 属性
      if (videoTrack.mediaStream) {
        console.log(`🎬 方法2成功：从轨道 mediaStream 属性获取: ${uid}`, {
          hasMediaStream: !!videoTrack.mediaStream,
        });
        return videoTrack.mediaStream;
      }

      // 尝试方法3：从轨道创建 MediaStream
      if (videoTrack.getTrackId) {
        try {
          // 创建一个新的 MediaStream，包含视频轨道
          const mediaStream = new MediaStream([videoTrack]);
          console.log(`🎬 方法3成功：创建新的 MediaStream: ${uid}`, {
            hasMediaStream: !!mediaStream,
            trackId: videoTrack.getTrackId?.(),
          });
          return mediaStream;
        } catch (error) {
          console.warn(`🎬 方法3失败：创建 MediaStream 失败: ${uid}`, error);
        }
      }

      // 尝试方法4：检查是否有 _mediaStream 属性
      if (videoTrack._mediaStream) {
        console.log(`🎬 方法4成功：从轨道 _mediaStream 属性获取: ${uid}`, {
          hasMediaStream: !!videoTrack._mediaStream,
        });
        return videoTrack._mediaStream;
      }

      // 尝试方法5：检查是否有 stream 属性
      if (videoTrack.stream) {
        console.log(`🎬 方法5成功：从轨道 stream 属性获取: ${uid}`, {
          hasMediaStream: !!videoTrack.stream,
        });
        return videoTrack.stream;
      }

      // 尝试方法6：使用 Agora 的 getMediaStreamTrack 方法
      if (videoTrack.getMediaStreamTrack && typeof videoTrack.getMediaStreamTrack === 'function') {
        try {
          const mediaStreamTrack = videoTrack.getMediaStreamTrack();
          const mediaStream = new MediaStream([mediaStreamTrack]);
          console.log(`🎬 方法6成功：从 getMediaStreamTrack 创建 MediaStream: ${uid}`, {
            hasMediaStream: !!mediaStream,
            trackId: videoTrack.getTrackId?.(),
          });
          return mediaStream;
        } catch (error) {
          console.warn(`🎬 方法6失败：从 getMediaStreamTrack 创建 MediaStream 失败: ${uid}`, error);
        }
      }
    }

    // 回退到旧的方式（从 joinedMembers 中查找）
    const member = this.joinedMembers.find(member => member.uid === uid);
    if (member && member.stream) {
      console.log(`🎬 回退方法成功：从 joinedMembers 获取: ${uid}`);
      return member.stream;
    }

    console.log(`🎬 所有方法都失败：未找到用户 ${uid} 的视频流`, {
      hasVideoTrack: !!this.remoteVideoTracks.get(uid),
      joinedMembersCount: this.joinedMembers.length,
    });

    return undefined;
  }

  // 添加参与者到当前通话
  async addParticipants(newMembers: string[]) {
    if (!this.currentCallInfo) {
      console.error('无法添加参与者：当前没有进行中的通话');
      return false;
    }

    if (this.callStatus !== CALL_STATUS.IN_CALL) {
      console.error('无法添加参与者：当前不在通话中');
      return false;
    }

    // 只能在多人通话中添加参与者
    if (
      this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI &&
      this.currentCallInfo.type !== CALL_TYPE.AUDIO_MULTI
    ) {
      console.error('无法添加参与者：当前不是多人通话');
      return false;
    }

    if (newMembers.length === 0) {
      console.warn('没有新成员需要添加');
      return false;
    }

    try {
      // 更新邀请成员列表
      this.invitedMembers = [...this.invitedMembers, ...newMembers];

      // 更新通话信息
      if (this.currentCallInfo.invitedMembers) {
        this.currentCallInfo.invitedMembers = [
          ...this.currentCallInfo.invitedMembers,
          ...newMembers,
        ];
      } else {
        this.currentCallInfo.invitedMembers = newMembers;
      }

      // 向新成员发送邀请消息
      await this.sendInvitationMessage(newMembers, this.currentCallInfo);

      console.log('成功向新成员发送邀请:', {
        newMembers,
        currentCallInfo: this.currentCallInfo,
        totalInvitedMembers: this.invitedMembers.length,
      });

      return true;
    } catch (error) {
      console.error('添加参与者失败:', error);
      return false;
    }
  }

  // 🔧 新增：取消对指定用户的邀请
  async cancelInvitation(userId: string) {
    if (!this.currentCallInfo) {
      console.error('无法取消邀请：当前没有进行中的通话');
      return false;
    }

    if (this.callStatus !== CALL_STATUS.IN_CALL) {
      console.error('无法取消邀请：当前不在通话中');
      return false;
    }

    // 只能在多人通话中取消邀请
    if (
      this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI &&
      this.currentCallInfo.type !== CALL_TYPE.AUDIO_MULTI
    ) {
      console.error('无法取消邀请：当前不是多人通话');
      return false;
    }

    try {
      // 从邀请成员列表中移除
      this.invitedMembers = this.invitedMembers.filter(member => member !== userId);

      // 更新通话信息
      if (this.currentCallInfo.invitedMembers) {
        this.currentCallInfo.invitedMembers = this.currentCallInfo.invitedMembers.filter(
          member => member !== userId,
        );
      }

      // 发送取消邀请消息
      await this.sendCancelMessage(userId);

      console.log('成功取消用户邀请:', {
        userId,
        remainingInvitedMembers: this.invitedMembers,
      });

      return true;
    } catch (error) {
      console.error('取消邀请失败:', error);
      return false;
    }
  }

  // 更新加入的成员列表
  private updateJoinedMember(user: any, mediaType: string, enabled: boolean) {
    const userId = user.uid;
    const memberInfo = {
      userId: userId,
      uid: user.uid,
      mediaType: mediaType,
      videoEnabled: false,
      audioEnabled: false,
    };

    // 检查是否已存在该成员
    const existingMemberIndex = this.joinedMembers.findIndex(member => member.uid === user.uid);
    if (existingMemberIndex >= 0) {
      // 更新现有成员的媒体状态
      if (mediaType === 'video') {
        this.joinedMembers[existingMemberIndex].videoEnabled = enabled;
      } else if (mediaType === 'audio') {
        this.joinedMembers[existingMemberIndex].audioEnabled = enabled;
      }
    } else {
      // 添加新成员
      if (mediaType === 'video') {
        memberInfo.videoEnabled = enabled;
      } else if (mediaType === 'audio') {
        memberInfo.audioEnabled = enabled;
      }
      this.joinedMembers.push(memberInfo);
    }
  }

  // 将 CALL_TYPE 枚举值转换为字符串
  private convertCallTypeToString(callType: CALL_TYPE): 'video' | 'audio' | 'group' {
    switch (callType) {
      case CALL_TYPE.VIDEO_1V1:
        return 'video';
      case CALL_TYPE.AUDIO_1V1:
        return 'audio';
      case CALL_TYPE.VIDEO_MULTI:
      case CALL_TYPE.AUDIO_MULTI:
        return 'group';
      default:
        return 'video';
    }
  }

  // 尝试播放远程视频到对应用户的video元素
  private playRemoteVideoToExistingElements(remoteVideoTrack: any, userId: string) {
    // 🔧 改进：智能重试播放视频的逻辑
    const tryPlayVideo = (attempt: number = 1, maxAttempts: number = 8) => {
      // 首先尝试精确匹配用户ID的选择器
      const targetSelector = `[data-video-id="remote-${userId}"] video, [data-video-id="remote-${userId}"].cui-callkit-video`;
      let targetElement = document.querySelector(targetSelector) as HTMLVideoElement;

      // 如果没找到，尝试其他可能的选择器
      if (!targetElement) {
        const fallbackSelectors = [
          `.cui-callkit-window:not(.cui-callkit-window-local) .cui-callkit-video`,
          `.cui-callkit-video:not([data-local="true"])`,
          `video:not([data-local="true"])`,
        ];

        for (const selector of fallbackSelectors) {
          const elements = document.querySelectorAll(selector);
          // 找到未被使用的video元素
          for (const element of elements) {
            const videoEl = element as HTMLVideoElement;
            if (!videoEl.dataset.playedTrackId || videoEl.dataset.playedTrackId === '') {
              targetElement = videoEl;
              break;
            }
          }
          if (targetElement) break;
        }
      }

      console.log(`🎮 播放远程视频轨道 (尝试 ${attempt}/${maxAttempts}):`, {
        用户ID: userId,
        轨道ID: remoteVideoTrack?.getTrackId?.(),
        找到目标元素: !!targetElement,
        目标选择器: targetSelector,
        当前页面所有video元素: document.querySelectorAll('video').length,
        当前页面所有cui_callkit_video元素: document.querySelectorAll('.cui-callkit-video').length,
        等待中的轨道数量: this.pendingVideoTracks.size,
      });

      if (!targetElement) {
        if (attempt < maxAttempts) {
          // 🔧 改进：使用指数退避策略，避免频繁重试
          const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
          console.log(
            `❌ 第 ${attempt} 次未找到用户 ${userId} 对应的video元素，${delay}ms后重试...`,
          );
          setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), delay);
          return;
        } else {
          console.warn(`❌ 重试 ${maxAttempts} 次后仍未找到用户 ${userId} 对应的video元素`);
          // 🔧 改进：将轨道存储到等待队列中，等待UI通知
          const videoId = `remote-${userId}`;
          this.pendingVideoTracks.set(videoId, remoteVideoTrack);
          console.log(`📦 将轨道存储到等待队列: ${videoId}`);
          return;
        }
      }

      // 检查是否已经播放过这个轨道
      const trackId = remoteVideoTrack?.getTrackId?.();
      if (targetElement.dataset.playedTrackId === trackId) {
        console.log(`✅ 视频元素已经在播放轨道 ${trackId}，跳过`);
        return;
      }

      // 播放视频轨道到目标元素
      if (remoteVideoTrack && typeof remoteVideoTrack.play === 'function') {
        try {
          console.log(`🎬 开始播放用户 ${userId} 的视频轨道到元素:`, targetElement);
          const playResult = remoteVideoTrack.play(targetElement);

          // 标记元素已被使用
          targetElement.dataset.playedTrackId = trackId;
          targetElement.dataset.userId = userId;

          if (playResult && typeof playResult.then === 'function') {
            playResult
              .then(() => {
                console.log(`✅ 成功播放用户 ${userId} 的视频轨道`);
              })
              .catch((error: any) => {
                console.warn(`❌ 播放用户 ${userId} 的视频轨道失败:`, error);
                // 清除失败的标记
                targetElement.dataset.playedTrackId = '';

                // 如果播放失败且还有重试机会，重试播放
                if (attempt < maxAttempts) {
                  console.log(`🔄 播放失败，2秒后重试...`);
                  setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), 2000);
                }
              });
          } else {
            console.log(`✅ 用户 ${userId} 的视频轨道播放完成 (同步模式)`);
          }
        } catch (error) {
          console.error(`❌ 播放用户 ${userId} 的视频轨道时发生错误:`, error);
          targetElement.dataset.playedTrackId = '';

          // 如果播放失败且还有重试机会，重试播放
          if (attempt < maxAttempts) {
            console.log(`🔄 播放异常，2秒后重试...`);
            setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), 2000);
          }
        }
      } else {
        console.warn(`❌ 用户 ${userId} 的视频轨道不可用`);
      }
    };

    // 开始重试播放
    tryPlayVideo();
  }

  // 🔧 新增：获取指定用户的视频轨道
  getRemoteVideoTrack(userId: string): any {
    return this.remoteVideoTracks.get(userId);
  }

  // 🔧 新增：获取指定用户的音频轨道
  getRemoteAudioTrack(userId: string): any {
    return this.remoteAudioTracks.get(userId);
  }

  // 🔧 新增：获取所有远程视频轨道信息（用于调试）
  getAllRemoteVideoTracks(): Map<string, any> {
    return new Map(this.remoteVideoTracks);
  }

  // 清理预览模式的状态和资源
  cleanupPreviewMode() {
    console.log('清理预览模式');

    // 如果是预览模式创建的本地视频轨道，且还没有进入正式通话，清理它
    if (this.callStatus === CALL_STATUS.ALERTING && this.rtc.localVideoTrack) {
      console.log('清理预览模式的本地视频轨道');
      this.rtc.localVideoTrack.close();
      this.rtc.localVideoTrack = null;
    }

    // 清理本地视频流缓存
    this.localVideoStream = null;

    // 🔧 重置扬声器状态为默认开启
    this.speakerEnabled = true;

    // 通知UI清理本地视频显示
    // 根据通话类型使用不同的ID
    const videoId =
      this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ? 'local' : 'local-preview';
    this.onRemoteVideoReady?.({
      id: videoId,
      isLocalVideo: true,
      muted: false,
      cameraEnabled: false,
      nickname: this.userInfos[this.agoraUid]?.nickname || '我',
      avatar: this.userInfos[this.agoraUid]?.avatarUrl,
      stream: undefined,
    });
  }

  // 获取缓存的群组信息
  getCachedGroupInfo(groupId: string): { groupName?: string; groupAvatar?: string } | null {
    return this.cachedGroupInfos[groupId] || null;
  }

  // 设置群组信息缓存
  setCachedGroupInfo(groupId: string, groupInfo: { groupName?: string; groupAvatar?: string }) {
    this.cachedGroupInfos[groupId] = groupInfo;
    console.log('📝 手动设置群组信息缓存:', { groupId, groupInfo });
  }

  // 销毁服务
  destroy() {
    this.hangup('destroy');
    this.connection.removeEventHandler('callkit');
    // 清理本地视频流缓存
    this.localVideoStream = null;
    // 清理群组信息缓存
    this.cachedGroupInfos = {};
  }

  // 🔧 新增：设置视频元素准备好回调
  setVideoElementReadyCallback(callback: (videoId: string) => void) {
    this.onVideoElementReady = callback;
  }

  // 🔧 新增：通知视频元素已准备好
  notifyVideoElementReady(videoId: string) {
    console.log(`🎯 收到视频元素准备好通知: ${videoId}`);

    // 检查是否有等待播放的视频轨道
    const pendingTrack = this.pendingVideoTracks.get(videoId);
    if (pendingTrack) {
      console.log(`🎬 找到等待播放的视频轨道，开始播放: ${videoId}`);
      this.pendingVideoTracks.delete(videoId);
      this.playRemoteVideoToExistingElements(pendingTrack, videoId.replace('remote-', ''));
    }
  }

  // 🔧 新增：等待视频元素准备好
  private waitForVideoElement(videoId: string, track: any, maxWaitTime: number = 10000) {
    console.log(`⏳ 等待视频元素准备好: ${videoId}`);

    const startTime = Date.now();
    const checkElement = () => {
      const targetSelector = `[data-video-id="${videoId}"] video, [data-video-id="${videoId}"].cui-callkit-video`;
      const targetElement = document.querySelector(targetSelector) as HTMLVideoElement;

      if (targetElement) {
        console.log(`✅ 视频元素已准备好: ${videoId}`);
        this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
        return;
      }

      // 检查是否超时
      if (Date.now() - startTime > maxWaitTime) {
        console.warn(`⏰ 等待视频元素超时: ${videoId}`);
        // 回退到原来的重试机制
        this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
        return;
      }

      // 继续等待
      setTimeout(checkElement, 100);
    };

    checkElement();
  }
}
