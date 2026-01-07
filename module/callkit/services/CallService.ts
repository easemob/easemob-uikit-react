import AgoraRTC, {
  IAgoraRTCError,
  IAgoraRTCRemoteUser,
  VideoEncoderConfigurationPreset,
} from 'agora-rtc-sdk-ng';
import WebIM from 'easemob-websdk';
import { VideoWindowProps } from '../types/index';
import CallError from './CallError';
import { ChatSDK } from 'module/SDK';
import { CallErrorType, CallErrorCode } from './CallError';
import { e } from 'vitest/dist/index-5aad25c1';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';

// Call status enum
export enum CALL_STATUS {
  IDLE = 0,
  INVITING = 1,
  ALERTING = 2,
  CONFIRM_RING = 3,
  RECEIVED_CONFIRM_RING = 4,
  ANSWER_CALL = 5,
  CONFIRM_CALLEE = 6,
  IN_CALL = 7,
}

// Call type enum
export enum CALL_TYPE {
  AUDIO_1V1 = 0,
  VIDEO_1V1 = 1,
  VIDEO_MULTI = 2,
  AUDIO_MULTI = 3,
}

// Call info interface
export interface CallInfo {
  callId: string; // Call ID
  channel: string; // channelName
  token?: string; // Internal use
  type: CALL_TYPE; // Call type
  callerDevId: string; // Caller device ID (optional)
  calleeDevId?: string; // Callee device ID (optional)
  callerUserId: string; // Caller user ID
  calleeUserId?: string; // Callee user ID (optional)
  groupId?: string;
  groupName?: string;
  groupAvatar?: string;
  invitedMembers?: string[]; // Internal use
  joinedMembers?: any[]; // Internal use
  inviteMessageId?: string; // Invitation message ID
  duration?: string; // Call duration, default 0
  state?: CALL_STATUS; // Call status, default idle
}

// Hangup reason enum
export enum HANGUP_REASON {
  HANGUP = 'hangup', // Hang up call
  CANCEL = 'cancel', // Cancel call
  REMOTE_CANCEL = 'remoteCancel', // Remote cancel call
  REFUSE = 'refuse', // Refuse call
  REMOTE_REFUSE = 'remoteRefuse', // Remote refuse call
  BUSY = 'busy', // Busy
  NO_RESPONSE = 'noResponse', // No response (timeout)
  REMOTE_NO_RESPONSE = 'remoteNoResponse', // Remote no response
  HANDLE_ON_OTHER_DEVICE = 'handleOnOtherDevice', // Handled on other device
  ABNORMAL_END = 'abnormalEnd', // Abnormal end
}

// Call service configuration
export interface CallServiceConfig {
  connection: any; // WebIM connection
  onCallStart?: (videos: VideoWindowProps[]) => void;
  onCallEnd?: (reason: string, callInfo: CallInfo) => void;
  onInvitationReceived?: (invitation: any) => void;
  onCallDurationUpdate?: (duration: string) => void;
  onUserPublished?: (user: any) => void;
  // onUserLeft?: (user: any, reason: string) => void;
  onUserUnpublished?: (user: any, mediaType: string) => void;
  onRemoteVideoReady?: (videoInfo: VideoWindowProps) => void;
  onNetworkQualityChange?: (
    networkQuality: Record<
      string,
      { uplinkNetworkQuality: number; downlinkNetworkQuality: number }
    >,
  ) => void;
  onTalkingUsersChange?: (talkingUsers: string[]) => void; // Callback for talking users change
  userInfoProvider?: (
    userIds: string[],
  ) => Promise<Array<{ userId: string; nickname?: string; avatarUrl?: string }>>;
  groupInfoProvider?: (
    groupIds: string[],
  ) => Promise<Array<{ groupId: string; groupName?: string; groupAvatar?: string }>>;
  // Volume indicator configuration
  speakingVolumeThreshold?: number; // Volume threshold for speaking indicator, range 1-100, default 60
  // Ringtone configuration
  outgoingRingtoneSrc?: string; // Outgoing call ringtone audio file path
  incomingRingtoneSrc?: string; // Incoming call ringtone audio file path
  enableRingtone?: boolean; // Enable ringtone, default true
  ringtoneVolume?: number; // Ringtone volume, range 0-1, default 0.8
  ringtoneLoop?: boolean; // Loop ringtone, default true

  onCallError?: (error: CallError) => void;
  onReceivedCall?: (callType: 'video' | 'audio' | 'group', userId: string, ext?: any) => void;
  onRemoteUserJoined?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  onRemoteUserLeft?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  onRtcEngineCreated?: (rtc: any) => void;
  // Callback when invited user is removed (refused, cancelled, etc.)
  onInvitedUserRemoved?: (userId: string, reason: 'refused' | 'cancelled' | 'timeout') => void;
  encoderConfig?: VideoEncoderConfigurationPreset;
  // Ringtone callbacks
  onRingtoneStart?: (type: 'outgoing' | 'incoming') => void;
  onRingtoneEnd?: (type: 'outgoing' | 'incoming') => void;
  // RTC Token configuration
  useRTCToken?: boolean; // Whether to use RTC Token for validation, default true; when false, token will be null in join channel
}

export class CallService {
  private client: any;
  private rtc: any;
  private appId: string;
  private agoraUid: number;
  private userId: string;
  private connection: any;
  private accessToken?: string | null;
  private currentCallInfo: CallInfo | null = null;
  private callStatus: CALL_STATUS = CALL_STATUS.IDLE;
  private callDuration: string = '00:00';
  private timer: any = null;
  private intervalTimer: any = null;
  private joinedMembers: any[] = [];
  private invitedMembers: string[] = [];
  private userInfos: { [key: string]: any } = {};
  private localVideoStream: MediaStream | null = null; // Cache local video stream to avoid duplicate creation
  private currentCameraDeviceId: string | null = null; // 🔧 保存当前使用的摄像头设备ID

  // Track if user has entered preview stage (to distinguish direct answer vs post-preview answer)
  private hasEnteredPreview: boolean = false;

  // Prevent duplicate answerCall calls
  private isAnswering: boolean = false;

  // Store video and audio tracks for each user
  private remoteVideoTracks: Map<string, any> = new Map();
  private remoteAudioTracks: Map<string, any> = new Map();
  // Cache remote user video streams to avoid duplicate creation
  private remoteVideoStreams: Map<string, MediaStream> = new Map();

  // Store pending video tracks waiting to play
  private pendingVideoTracks: Map<string, any> = new Map();

  // Callback when video element is ready
  private onVideoElementReady?: (videoId: string) => void;

  // Callback functions
  private onCallStart?: (videos: VideoWindowProps[]) => void;
  private onCallEnd?: (reason: string, callInfo: CallInfo) => void;
  private onInvitationReceived?: (invitation: any) => void;
  private onCallDurationUpdate?: (duration: string) => void;
  private onUserPublished?: (user: any) => void;
  // private onUserLeft?: (user: any, reason: string) => void;
  private onUserUnpublished?: (user: any, mediaType: string) => void;
  private onRemoteVideoReady?: (videoInfo: VideoWindowProps) => void;
  private onNetworkQualityChange?: (
    networkQuality: Record<
      string,
      { uplinkNetworkQuality: number; downlinkNetworkQuality: number }
    >,
  ) => void;
  private onTalkingUsersChange?: (talkingUsers: string[]) => void; // Callback for talking users change
  private onInvitedUserRemoved?: (
    userId: string,
    reason: 'refused' | 'cancelled' | 'timeout',
  ) => void; // Callback when invited user is removed
  private userInfoProvider?: (
    userIds: string[],
  ) => Promise<Array<{ userId: string; nickname?: string; avatarUrl?: string }>>;
  private groupInfoProvider?: (
    groupIds: string[],
  ) => Promise<Array<{ groupId: string; groupName?: string; groupAvatar?: string }>>;
  private onReceivedCall?: (
    callType: 'video' | 'audio' | 'group',
    userId: string,
    ext?: any,
  ) => void;
  private onRemoteUserJoined?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  private onRemoteUserLeft?: (userId: string, callType: 'video' | 'audio' | 'group') => void;
  private onRtcEngineCreated?: (rtc: any) => void;

  private onCallError?: (error: CallError) => void;
  // Ringtone callbacks
  private onRingtoneStart?: (type: 'outgoing' | 'incoming') => void;
  private onRingtoneEnd?: (type: 'outgoing' | 'incoming') => void;
  // Cached group information
  private cachedGroupInfos: { [key: string]: { groupName?: string; groupAvatar?: string } } = {};

  // Volume indicator threshold
  private speakingVolumeThreshold: number = 60; // Default threshold 60

  // Ringtone related private variables
  private outgoingRingtoneAudio: HTMLAudioElement | null = null; // Outgoing call ringtone audio object
  private incomingRingtoneAudio: HTMLAudioElement | null = null; // Incoming call ringtone audio object
  private outgoingRingtoneSrc?: string; // Outgoing call ringtone resource path
  private incomingRingtoneSrc?: string; // Incoming call ringtone resource path
  private enableRingtone: boolean = true; // Enable ringtone
  private ringtoneVolume: number = 0.8; // Ringtone volume
  private ringtoneLoop: boolean = true; // Loop ringtone
  private isRingtonePlaying: boolean = false; // Ringtone playing status
  private currentRingtoneType: 'outgoing' | 'incoming' | null = null; // Current playing ringtone type

  // Track references being created, for handling race conditions
  private creatingVideoTrack: Promise<any> | null = null;
  private encoderConfig?: VideoEncoderConfigurationPreset;
  private creatingAudioTrack: Promise<any> | null = null;

  private UIdToUserIdMap: Map<string, string> = new Map();

  private enableMic: boolean = true;

  // RTC Token configuration
  private useRTCToken: boolean = true; // Default to true, use token validation

  constructor(config: CallServiceConfig) {
    this.connection = config.connection;
    this.onCallStart = config.onCallStart;
    this.onCallEnd = config.onCallEnd;
    this.onInvitationReceived = config.onInvitationReceived;
    this.onCallDurationUpdate = config.onCallDurationUpdate;
    this.onUserPublished = config.onUserPublished;
    this.onUserUnpublished = config.onUserUnpublished;
    this.onRemoteVideoReady = config.onRemoteVideoReady;
    this.onNetworkQualityChange = config.onNetworkQualityChange;
    this.onTalkingUsersChange = config.onTalkingUsersChange; // Initialize talking users change callback
    this.onInvitedUserRemoved = config.onInvitedUserRemoved; // Initialize invited user removed callback
    this.userInfoProvider = config.userInfoProvider;
    this.groupInfoProvider = config.groupInfoProvider;
    this.onCallError = config.onCallError;
    this.onReceivedCall = config.onReceivedCall;
    this.onRemoteUserJoined = config.onRemoteUserJoined;
    this.onRemoteUserLeft = config.onRemoteUserLeft;
    this.onRtcEngineCreated = config.onRtcEngineCreated;
    this.onRingtoneStart = config.onRingtoneStart;
    this.onRingtoneEnd = config.onRingtoneEnd;
    this.encoderConfig = config.encoderConfig ?? '720p';
    // Initialize volume threshold
    this.speakingVolumeThreshold = config.speakingVolumeThreshold ?? 60;
    // Initialize ringtone configuration
    this.outgoingRingtoneSrc = config.outgoingRingtoneSrc;
    this.incomingRingtoneSrc = config.incomingRingtoneSrc;
    this.enableRingtone = config.enableRingtone ?? true;
    this.ringtoneVolume = config.ringtoneVolume ?? 0.8;
    this.ringtoneLoop = config.ringtoneLoop ?? true;
    // Initialize RTC token configuration
    this.useRTCToken = config.useRTCToken ?? true;

    // Get necessary information from WebIM connection
    this.agoraUid = 0;
    this.appId = '';
    this.userId = this.connection.user;

    // Initialize Agora RTC client
    AgoraRTC.setLogLevel(4);
    this.client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
    this.onRtcEngineCreated?.(this.client);
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

    // Set global references
    (WebIM as any).rtc = this.rtc;
    (WebIM as any).conn = this.connection;
    // Add message listener
    this.addMessageListener();

    // Delay ringtone initialization to ensure other resources are initialized
    setTimeout(() => {
      this.initRingtone();
    }, 100);
  }

  setUIdToUserIdMap(uid: string, userId: string) {
    this.UIdToUserIdMap.set(uid, userId);
  }

  // Remove setAccessToken method, get from connection instead
  async getAccessToken(): Promise<string | null> {
    try {
      const res = await this.connection.getRTCToken('*');
      this.appId = res.data.appId;
      const uid = res.data.RTCUId;
      this.UIdToUserIdMap.set(uid, this.connection.user);
      this.agoraUid = uid;
      return res.data.RTCToken;
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
      return null;
    }
  }

  // Remove setUserIdMap method, no longer needed

  // Set user information
  setUserInfo(userInfo: { [key: string]: any }) {
    this.userInfos = { ...this.userInfos, ...userInfo };

    // If in call and has local video track, update local video info display
    if (this.callStatus === CALL_STATUS.IN_CALL && this.rtc.localVideoTrack) {
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: this.isMuted(),
        cameraEnabled: this.isCameraEnabled(),
        nickname: this.userInfos[this.userId]?.nickname || 'Me',
        avatar: this.userInfos[this.userId]?.avatarUrl, // Use updated avatar
        stream: this.isCameraEnabled()
          ? new MediaStream([this.rtc.localVideoTrack.getMediaStreamTrack()])
          : undefined,
      };

      // Notify UI to update local video status
      this.onRemoteVideoReady?.(localVideoInfo);
    }
  }

  // Get current call status
  getCallStatus(): CALL_STATUS {
    return this.callStatus;
  }

  // Get current call information
  getCurrentCallInfo(): CallInfo | null {
    return this.currentCallInfo;
  }

  // Start call
  async startCall(options: {
    msg: string;
    callId: string;
    channel: string;
    chatType: string;
    callType: CALL_TYPE;
    to: string | string[];
    message?: string;
    groupId?: string;
    groupName?: string;
    groupAvatar?: string;
    members?: string[]; // Member list for multi-party calls
    ext?: Record<string, any>;
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
      groupAvatar,
      members = [],
    } = options;

    // Check if already in call
    if (this.callStatus !== CALL_STATUS.IDLE) {
      logError('startCall failed: not idle', this.callStatus);
      this.onCallError?.({
        errorType: CallErrorType.CALLKIT,
        code: CallErrorCode.CALL_STATE_ERROR,
        message: 'already in call',
      });
      return null;
    }
    // Auto get access token
    this.accessToken = await this.getAccessToken();
    // Create call information
    this.currentCallInfo = {
      callId,
      channel,
      type: callType,
      callerDevId: this.connection.context.jid.clientResource || 'web',
      calleeDevId: '',
      callerUserId: this.connection.user, // Use agoraUid as IM name
      calleeUserId: callType === CALL_TYPE.VIDEO_MULTI ? groupId : (to as string),
      groupId,
      groupName,
      groupAvatar,
      invitedMembers: members,
      joinedMembers: [],
    };

    // Update status
    this.callStatus = CALL_STATUS.INVITING;
    this.invitedMembers = members;

    // Play outgoing call ringtone (when initiating call)
    this.playRingtone('outgoing');

    // If 1v1 video call, create local video track for preview (caller)
    // Group video call initiator does not need preview mode, go directly to group video layout
    if (callType === CALL_TYPE.VIDEO_1V1) {
      // Mark user has entered preview stage (caller)
      this.hasEnteredPreview = true;
      try {
        // Record track Promise being created for race condition handling
        this.creatingVideoTrack = AgoraRTC.createCameraVideoTrack(
          this.encoderConfig ? { encoderConfig: this.encoderConfig } : undefined,
        );
        const localVideoTrack = await this.creatingVideoTrack;

        // Check status, if already hung up then immediately clean up resources
        if (!this.currentCallInfo) {
          try {
            // Get and stop underlying MediaStreamTrack
            const mediaStreamTrack = localVideoTrack.getMediaStreamTrack?.();
            if (mediaStreamTrack) {
              mediaStreamTrack.stop();
            }
            localVideoTrack.close();
          } catch (cleanupError) {
            logError('Error occurred while cleaning up leaked track:', cleanupError);
          }
          this.creatingVideoTrack = null;
          return null; // Early return, do not continue subsequent operations
        }

        this.rtc.localVideoTrack = localVideoTrack;
        this.creatingVideoTrack = null; // Clear creating reference

        // Create local video info for preview mode
        const localVideoInfo: VideoWindowProps = {
          id: 'local', // Use unified local video ID
          isLocalVideo: true,
          muted: false,
          cameraEnabled: true,
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl,
          stream: this.getOrCreateLocalVideoStream(), // Provide video stream to ensure UI can render
        };

        // Notify UI to display local video in preview mode
        this.onRemoteVideoReady?.(localVideoInfo);

        // Delay playing local video to ensure UI rendering is complete
        setTimeout(() => {
          // Check status again to avoid state changes during delay
          if (this.callStatus !== CALL_STATUS.IDLE) {
            this.playLocalVideo();
          }
        }, 500);
      } catch (error) {
        logError('Failed to create local video track:', error);
        this.creatingVideoTrack = null; // Clear creating reference

        // Ensure cleanup of potentially acquired resources even if creation fails
        if (error && typeof error === 'object' && 'track' in error) {
          try {
            (error as any).track.close();
          } catch (cleanupError) {
            logError('Failed to cleanup leaked track:', cleanupError);
          }
        }
      }
    } else if (callType === CALL_TYPE.VIDEO_MULTI) {
      // Group video call: caller handles audio and video tracks
      try {
        // Create audio track (if not already created)
        if (!this.rtc.localAudioTrack) {
          const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          this.rtc.localAudioTrack = localAudioTrack;
        }

        // Check if video track already exists (may be created in preview mode)
        const hasExistingVideoTrack = Boolean(
          this.rtc.localVideoTrack && this.rtc.localVideoTrack.enabled,
        );

        // Create local video info, maintain current camera status
        const localVideoInfo: VideoWindowProps = {
          id: 'local',
          isLocalVideo: true,
          muted: false,
          cameraEnabled: hasExistingVideoTrack, // Maintain camera status in preview mode
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl,
          stream: hasExistingVideoTrack ? this.getOrCreateLocalVideoStream() : undefined, // Provide video stream
        };

        // Notify UI to display local video window
        this.onRemoteVideoReady?.(localVideoInfo);

        if (hasExistingVideoTrack) {
          // 🔧 延迟播放本地视频，确保UI渲染完成
          setTimeout(() => {
            this.playLocalVideo();
          }, 500);
        }
      } catch (error) {
        logError('Failed to initialize tracks for group video call:', error);
      }
    }

    let msg = null;
    // Send invitation message
    if (chatType === 'singleChat') {
      msg = await this.sendInvitationMessage(to, this.currentCallInfo, options.ext, options.msg);
    } else if (chatType === 'groupChat' && groupId) {
      // Multi-party call, send invitation to group
      msg = await this.sendInvitationMessage(
        members,
        this.currentCallInfo,
        options.ext,
        options.msg,
      );
    }

    return msg;
  }

  // Send invitation message
  private async sendInvitationMessage(
    to: string | string[],
    callInfo: CallInfo,
    ext?: Record<string, any>,
    text?: string,
  ) {
    const inviteExt: any = {
      action: 'invite',
      channelName: callInfo.channel,
      type: callInfo.type,
      callerDevId: this.connection.context.jid.clientResource || 'web',
      callId: callInfo.callId,
      ts: Date.now(),
      msgType: 'rtcCallWithAgora',
      callerIMName: this.connection.user,
      calleeIMName: callInfo.type === CALL_TYPE.VIDEO_MULTI ? callInfo.groupId : to,
      chatType: callInfo.type,
      em_push_ext: {
        type: 'call',
        custom: {
          action: 'invite',
          channelName: callInfo.channel,
          type: callInfo.type,
          callerDevId: this.connection.context.jid.clientResource || 'web',
          callId: callInfo.callId,
          ts: Date.now(),
          msgType: 'rtcCallWithAgora',
          callerIMName: this.connection.user,
          calleeIMName: callInfo.type === CALL_TYPE.VIDEO_MULTI ? callInfo.groupId : to,
          callerNickname: this.userInfos[this.userId]?.nickname || this.connection.user,
          chatType: callInfo.type,
          ext: ext,
        },
      },
      em_apns_ext: {
        em_push_type: 'voip',
      },
      ext: ext,
    };

    // Get inviter (self) user information
    try {
      if (this.userInfoProvider) {
        logDebug('Getting inviter user info:', this.userId);
        const userInfos = await this.userInfoProvider([this.userId]);
        const myInfo = userInfos.find(user => user.userId === this.userId);

        if (myInfo) {
          logDebug('Successfully got inviter info:', myInfo);
          inviteExt.ease_chat_uikit_user_info = {
            nickname: myInfo.nickname,
            avatarURL: myInfo.avatarUrl,
          };
          inviteExt.em_push_ext.custom.callerNickname = myInfo.nickname;
          this.setUserInfo({
            [this.userId]: myInfo,
          });
        } else {
          logWarn('Inviter user info not found');
        }
      } else {
        logWarn('userInfoProvider not configured, cannot get inviter info');
      }
    } catch (error) {
      logError('Failed to fetch inviter info:', error);
    }

    // 如果是群组通话，添加群组信息
    if (callInfo.groupId) {
      let groupAvatar: string | undefined;

      // 先尝试从缓存获取群组头像
      const cachedGroupInfo = this.cachedGroupInfos[callInfo.groupId];
      if (cachedGroupInfo?.groupAvatar) {
        groupAvatar = this.currentCallInfo?.groupAvatar || cachedGroupInfo.groupAvatar;
        logDebug('Using cached group avatar:', { groupId: callInfo.groupId, groupAvatar });
      } else if (this.groupInfoProvider) {
        // 如果缓存中没有，尝试获取群组信息
        try {
          logDebug('Getting group info:', callInfo.groupId);
          const groupInfos = await this.groupInfoProvider([callInfo.groupId]);
          const groupInfo = groupInfos.find(info => info.groupId === callInfo.groupId);

          if (groupInfo) {
            logDebug('Successfully got group info:', groupInfo);
            groupAvatar = this.currentCallInfo?.groupAvatar || groupInfo.groupAvatar;

            // 缓存群组信息
            this.cachedGroupInfos[callInfo.groupId] = {
              groupName: groupInfo.groupName || callInfo.groupName,
              groupAvatar: groupInfo.groupAvatar,
            };
            logDebug('Cached group info:', {
              groupId: callInfo.groupId,
              cached: this.cachedGroupInfos[callInfo.groupId],
            });
          } else {
            logWarn('Group info not found');
          }
        } catch (error) {
          logError('Failed to fetch group info:', error);
        }
      } else {
        logWarn('groupInfoProvider not configured, cannot get group avatar');
      }

      inviteExt.callkitGroupInfo = {
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
      msg:
        text || (callInfo.type === CALL_TYPE.VIDEO_MULTI ? '邀请您进行群组通话' : '邀请您进行通话'),
      ext: inviteExt,
    };
    if (callInfo.type === CALL_TYPE.VIDEO_MULTI) {
      option.to = callInfo.groupId;
      option.receiverList = to;
    }
    if (callInfo.type !== CALL_TYPE.VIDEO_MULTI) {
      this.timer = setTimeout(() => {
        logDebug('Invitation timeout, auto hangup');
        this.hangup(HANGUP_REASON.REMOTE_NO_RESPONSE, true);
      }, 30000);
    }

    // TODO: 加状态判断
    try {
      const msg = WebIM.message.create(option);
      const res = await this.connection.send(msg);
      logDebug('Sending invitation message:', msg, res);
      (msg as any).mid = res.serverMsgId;
      this.currentCallInfo!.inviteMessageId = res.serverMsgId;
      this.currentCallInfo!.callerUserId = this.connection.user;
      this.currentCallInfo!.callId = inviteExt.callId;

      msg.from = this.connection.user;
      return msg as ChatSDK.TextMsgBody;
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
      this.currentCallInfo = null;
      return null;
    }
  }

  // 接听通话
  async answerCall(result: boolean) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.currentCallInfo) {
      return;
    }

    // 🔧 防止重复调用：如果正在处理中，直接返回
    if (this.isAnswering) {
      return;
    }

    this.isAnswering = true;

    try {
      // 🔧 停止铃声播放（接听或拒绝时）
      this.stopRingtone();

      if (result) {
        // 接听通话 - 发送accept消息
        this.sendAnswerCallMessage('accept');
        logDebug('Answer call message sent');
      } else {
        // 拒绝通话
        this.sendAnswerCallMessage('refuse');
        this.callStatus = CALL_STATUS.IDLE;
        await this.cleanupPreviewMode(); // 拒绝通话时清理预览模式
        logDebug('Answer call: refuse message sent and cleanup completed');
      }
    } catch (error) {
      logError('answerCall failed:', error);
      throw error;
    } finally {
      // 🔧 重置标记：在短暂延迟后重置，允许新的通话
      setTimeout(() => {
        this.isAnswering = false;
      }, 1000); // 1秒后重置标记
    }
  }

  // 发送响铃消息
  private sendAlertingMessage() {
    if (!this.currentCallInfo) return;

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: this.currentCallInfo.callerUserId,
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
    try {
      this.connection.send(msg);
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        ...(error as IAgoraRTCError),
        message: error.message,
      });
    }
    this.callStatus = CALL_STATUS.ALERTING;
    // 设置超时处理
    this.timer = setTimeout(() => {
      logWarn('callee timeout');
      this.hangup(HANGUP_REASON.REMOTE_NO_RESPONSE);
    }, 10000);
  }

  // 发送应答消息
  private sendAnswerCallMessage(
    result: 'accept' | 'refuse' | 'busy',
    targetCallInfo?: {
      callerUserId: string;
      callerDevId: string;
      callId: string;
    },
  ) {
    const callInfo = targetCallInfo || this.currentCallInfo;
    if (!callInfo) {
      return;
    }

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: 'singleChat',
      to: callInfo.callerUserId,
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
    logDebug('sendAnswerCallMessage msg -->', msg);
    try {
      this.connection.send(msg);
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
    }
    this.callStatus = CALL_STATUS.ANSWER_CALL;
  }

  // 加入通话
  async joinCall() {
    if (!this.currentCallInfo) {
      logError('No current call info');
      return;
    }

    if (this.callStatus === CALL_STATUS.IN_CALL) {
      return;
    }

    if (!this.accessToken) {
      // 如果没有token，重新获取
      this.accessToken = await this.getAccessToken();
    }

    // Determine the token to use based on useRTCToken configuration
    const tokenToUse = this.useRTCToken ? this.accessToken : null;

    // 🔧 强制移除旧的监听器（避免重复监听）
    if (this.client) {
      try {
        this.client.removeAllListeners();
      } catch (error) {
        logWarn('removeAllListeners error', error);
      }
    }

    // 重新添加事件监听器
    this.addAgoraRTCListeners();

    // 🔧 检查客户端连接状态 - 修复：同时检查CONNECTING和CONNECTED状态
    const isClientConnectedOrConnecting =
      this.client &&
      (this.client.connectionState === 'CONNECTED' || this.client.connectionState === 'CONNECTING');

    let uid;

    // 只有在未连接且未连接中时才执行join操作
    if (!isClientConnectedOrConnecting) {
      try {
        try {
          uid = await this.client.join(
            this.appId,
            this.currentCallInfo.channel,
            tokenToUse,
            this.agoraUid,
          );
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          throw error;
        }
        // Enable volume indicator only for multi-party calls
        if (
          this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
          this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
        ) {
          this.client.enableAudioVolumeIndicator();
        }
      } catch (error) {
        logError('Failed to join channel:', error);
        this.sendHangupMessage();
        this.hangup(HANGUP_REASON.ABNORMAL_END);
        return;
      }
    } else {
      // 🔧 修复：如果客户端正在连接中，需要等待连接完成
      if (this.client.connectionState === 'CONNECTING') {
        try {
          // 等待客户端连接状态变为CONNECTED，最多等待10秒
          const waitForConnection = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('等待客户端连接超时'));
            }, 10000);

            const checkConnection = () => {
              if (this.client.connectionState === 'CONNECTED') {
                clearTimeout(timeout);

                resolve();
              } else if (this.client.connectionState === 'DISCONNECTED') {
                clearTimeout(timeout);
                reject(new Error('Client connection failed'));
              } else {
                // 继续等待
                setTimeout(checkConnection, 100);
              }
            };

            checkConnection();
          });

          await waitForConnection;
        } catch (error) {
          logError('Failed to wait for client connection:', error);
          this.hangup(HANGUP_REASON.ABNORMAL_END);
          return;
        }
      }

      // 对于已连接的客户端，仍需要启用音量监听
      if (
        this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
      ) {
        logDebug('Enable audio volume indicator (skip join mode)');
        this.client.enableAudioVolumeIndicator();
      }
    }

    // 🔧 修复：检查是否已存在音频轨道，避免重复创建
    // let localAudioTrack = this.rtc.localAudioTrack;
    // if (!localAudioTrack) {
    //   logDebug('Creating new local audio track');
    //   try {
    //     localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    //     this.rtc.localAudioTrack = localAudioTrack;
    //   } catch (error) {
    //     logError('Failed to create local audio track:', error);
    //     this.sendHangupMessage();
    //     this.hangup(HANGUP_REASON.ABNORMAL_END);
    //     return;
    //   }
    // } else {
    //   logDebug('Reusing existing local audio track');
    // }
    // const config: any[] = [localAudioTrack];
    const videos: VideoWindowProps[] = [];

    let localVideoInfo;
    const config: any[] = [];
    let localAudioTrack = this.rtc.localAudioTrack;
    if (!localAudioTrack) {
      logDebug('Creating new local audio track');
      try {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        this.rtc.localAudioTrack = localAudioTrack;
      } catch (error) {
        logError('Failed to create local audio track:', error);
        this.sendHangupMessage();
        this.hangup(HANGUP_REASON.ABNORMAL_END);
        return;
      }
    }
    config.push(localAudioTrack);
    if (!this.enableMic) {
      if (this.rtc.localAudioTrack) {
        this.rtc.localAudioTrack.setEnabled(false);
      }
      // const mediaStreamTrack = this.rtc.localAudioTrack.getMediaStreamTrack?.();
      // if (mediaStreamTrack) {
      //   logDebug('Stop underlying MediaStreamTrack of disabled track:', mediaStreamTrack.id);
      //   mediaStreamTrack.setEnabled(false);
      // }
      // this.rtc.localAudioTrack.close();
      // this.rtc.localAudioTrack = null;
    }
    // 根据通话类型处理
    if (
      this.currentCallInfo.type === CALL_TYPE.AUDIO_1V1 ||
      this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
    ) {
      // 音频通话
      try {
        await this.client.publish(config);
      } catch (error) {
        this.onCallError?.({
          errorType: CallErrorType.RTC,
          ...(error as IAgoraRTCError),
        });
        logError('Failed to publish audio:', error);
        this.sendHangupMessage();
        this.hangup(HANGUP_REASON.ABNORMAL_END);
        return;
      }
    } else {
      // 视频通话

      if (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI) {
        // 群组视频通话：检查是否已有视频轨道（预览模式下可能已创建）
        const hasExistingVideoTrack = Boolean(
          this.rtc.localVideoTrack && this.rtc.localVideoTrack.enabled,
        );

        if (hasExistingVideoTrack) {
          // 如果已有启用的视频轨道，一起发布
          config.push(this.rtc.localVideoTrack);
        } else if (this.rtc.localVideoTrack && !this.rtc.localVideoTrack.enabled) {
          // 🔧 彻底清理禁用的视频轨道，释放摄像头硬件资源
          try {
            // 获取并停止底层MediaStreamTrack
            const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
            if (mediaStreamTrack) {
              logDebug('Stop underlying MediaStreamTrack of disabled track:', mediaStreamTrack.id);
              mediaStreamTrack.stop();
            }

            // 关闭Agora轨道
            this.rtc.localVideoTrack.close();

            // 清空引用
            this.rtc.localVideoTrack = null;

            // 🔧 清理视频流缓存
            if (this.localVideoStream) {
              logDebug('Clean up local video stream cache');
              this.localVideoStream = null;
            }

            logDebug('Disabled video track completely cleaned up, camera resources released');
          } catch (error) {
            logError('❌ 清理禁用视频轨道时发生错误:', error);
            // 即使出错也要清空引用
            this.rtc.localVideoTrack = null;
          }
        }

        try {
          await this.client.publish(config); // 发布音频轨道和可能的视频轨道
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          logError('Failed to publish tracks for group call:', error);
          this.sendHangupMessage();
          this.hangup(HANGUP_REASON.ABNORMAL_END);
          return;
        }

        // 🔧 重新检查实际的摄像头状态（可能在上面被清理了）
        const actualCameraEnabled = Boolean(
          this.rtc.localVideoTrack && this.rtc.localVideoTrack.enabled,
        );

        // 创建本地视频对象供UI显示
        localVideoInfo = {
          id: 'local',
          isLocalVideo: true,
          muted: this.isMuted(),
          cameraEnabled: actualCameraEnabled, // 🔧 使用实际的摄像头状态
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl,
          stream: actualCameraEnabled ? this.getOrCreateLocalVideoStream() : undefined, // 🔧 只有开启时才提供视频流
        };
        logDebug('Group video call: sending local video status to UI:', {
          cameraEnabled: localVideoInfo.cameraEnabled,
          hasStream: !!localVideoInfo.stream,
          hasVideoTrack: !!this.rtc.localVideoTrack,
          videoTrackEnabled: this.rtc.localVideoTrack?.enabled,
        });
        videos.push(localVideoInfo);

        if (actualCameraEnabled) {
          logDebug('Group video call: join channel, keep camera enabled in preview mode');
          // 🔧 延迟播放本地视频，确保UI渲染完成
          setTimeout(() => {
            this.playLocalVideo();
          }, 500);
        } else {
          logDebug('Group video call: join channel, camera remains off (caller or callee)');
        }
      } else {
        // 🔧 一对一视频通话：保持预览状态下的摄像头设置
        let localVideoTrack = this.rtc.localVideoTrack;

        // 🔧 检查预览时的摄像头状态：如果有视频轨道且已启用，则保持开启状态
        const hasExistingEnabledVideoTrack = localVideoTrack && localVideoTrack.enabled;

        // 🔧 智能创建视频轨道逻辑：区分直接接听和preview后接听
        if (!localVideoTrack) {
          if (this.hasEnteredPreview) {
            // 经过了preview但没有轨道 = 用户在preview时主动关闭了摄像头
            logDebug('1v1 video call: user actively closed camera in preview, keep closed state');
          } else {
            // 没有经过preview = 直接接听，创建默认开启的视频轨道
            logDebug('1v1 video call: direct answer, create default enabled video track');
            try {
              localVideoTrack = await AgoraRTC.createCameraVideoTrack(
                this.encoderConfig ? { encoderConfig: this.encoderConfig } : undefined,
              );
              this.rtc.localVideoTrack = localVideoTrack;
              logDebug('1v1 video call: default video track created successfully');
            } catch (error) {
              logError('1v1 video call: failed to create default video track:', error);
            }
          }
        }

        // 重新检查轨道状态
        const finalHasEnabledVideoTrack = Boolean(
          this.rtc.localVideoTrack && this.rtc.localVideoTrack.enabled,
        );

        logDebug('1v1 video call: final track status:', {
          hasEnteredPreview: this.hasEnteredPreview,
          hasTrack: !!this.rtc.localVideoTrack,
          trackEnabled: this.rtc.localVideoTrack?.enabled,
          willPublishVideo: finalHasEnabledVideoTrack,
        });

        // 🔧 只发布已启用的轨道，保持预览时的状态
        if (finalHasEnabledVideoTrack) {
          logDebug('1v1 video call: publish enabled video track');
          config.push(this.rtc.localVideoTrack);
        } else if (this.rtc.localVideoTrack && !this.rtc.localVideoTrack.enabled) {
          logDebug(
            '1v1 video call: found disabled video track, clean up to release camera resources',
          );

          // 🔧 彻底清理禁用的视频轨道，释放摄像头硬件资源
          try {
            // 获取并停止底层MediaStreamTrack
            const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
            if (mediaStreamTrack) {
              logDebug('Stop underlying MediaStreamTrack of disabled track:', mediaStreamTrack.id);
              mediaStreamTrack.stop();
            }

            // 关闭Agora轨道
            this.rtc.localVideoTrack.close();

            // 清空引用
            this.rtc.localVideoTrack = null;

            // 🔧 清理视频流缓存
            if (this.localVideoStream) {
              logDebug('Clean up local video stream cache');
              this.localVideoStream = null;
            }

            logDebug('Disabled video track completely cleaned up, camera resources released');
          } catch (error) {
            logError('❌ 清理禁用视频轨道时发生错误:', error);
            // 即使出错也要清空引用
            this.rtc.localVideoTrack = null;
          }
        } else if (!this.rtc.localVideoTrack) {
          logDebug('1v1 video call: no video track, publish audio only');
        }

        try {
          await this.client.publish(config);
          logDebug(
            '1v1 video call: successfully published tracks, camera status:',
            finalHasEnabledVideoTrack ? 'enabled' : 'disabled',
          );
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          logError('Failed to publish video:', error);
          this.hangup(HANGUP_REASON.ABNORMAL_END);
          return;
        }

        // 🔧 重新检查实际的摄像头状态（可能在上面被清理了）
        const actualCameraEnabled = Boolean(
          this.rtc.localVideoTrack && this.rtc.localVideoTrack.enabled,
        );
        // 🔧 创建本地视频对象供UI显示，保持实际摄像头状态
        localVideoInfo = {
          id: 'local',
          isLocalVideo: true,
          muted: this.isMuted(),
          cameraEnabled: actualCameraEnabled, // 🔧 使用实际的摄像头状态
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl,
          stream: actualCameraEnabled ? this.getOrCreateLocalVideoStream() : undefined, // 🔧 只有开启时才提供视频流
        };
        logDebug('1v1 video call: sending local video status to UI:', {
          cameraEnabled: localVideoInfo.cameraEnabled,
          hasStream: !!localVideoInfo.stream,
          hasVideoTrack: !!this.rtc.localVideoTrack,
          videoTrackEnabled: this.rtc.localVideoTrack?.enabled,
        });
        videos.push(localVideoInfo);

        // 🔧 只有摄像头开启时才播放本地视频
        if (actualCameraEnabled) {
          logDebug('1v1 video call: camera enabled, play local video');
          setTimeout(() => {
            this.playLocalVideo();
          }, 500);
        } else {
          logDebug('1v1 video call: camera disabled, do not play local video');
        }
      }

      // 通知UI本地视频状态变化（从预览模式转到通话模式）
      this.onRemoteVideoReady?.(localVideoInfo);
    }
    logDebug('Join call:', this.currentCallInfo, this.userInfos);
    // 更新状态
    this.callStatus = CALL_STATUS.IN_CALL;
    this.startCallTimer();

    // 确保通话开始时扬声器状态为开启
    this.speakerEnabled = true;

    // 被叫方主动检查并订阅已在频道中的远程用户流
    if (
      (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI) &&
      videos.length === 1 // 只有自己的视频
    ) {
      logDebug(
        'Multi-party call callee initialization, check and subscribe to existing users in channel',
      );

      // 延迟检查远程用户，给 Agora SDK 一点时间同步远程用户列表
      const checkAndSubscribeRemoteUsers = async () => {
        logDebug('Check remote user list:', {
          remoteUsersCount: this.client.remoteUsers?.length || 0,
          remoteUsers:
            this.client.remoteUsers?.map((u: any) => ({
              uid: u.uid,
              hasAudio: u.hasAudio,
              hasVideo: u.hasVideo,
            })) || [],
        });

        if (this.client.remoteUsers && this.client.remoteUsers.length > 0) {
          logDebug('Found existing remote users, actively subscribe to their streams:');

          // 🔧 主动订阅每个远程用户的流
          for (const remoteUser of this.client.remoteUsers) {
            logDebug(`Processing remote user ${remoteUser.uid}:`, {
              hasAudio: remoteUser.hasAudio,
              hasVideo: remoteUser.hasVideo,
            });

            try {
              // 订阅音频流
              if (remoteUser.hasAudio && remoteUser.audioTrack) {
                try {
                  await this.client.subscribe(remoteUser, 'audio');
                } catch (error) {
                  this.onCallError?.({
                    errorType: CallErrorType.RTC,
                    ...(error as IAgoraRTCError),
                  });
                  throw error;
                }
                logDebug(`Successfully subscribed to audio stream of user ${remoteUser.uid}`);

                // 存储音频轨道
                this.remoteAudioTracks.set(remoteUser.uid, remoteUser.audioTrack);
                // 播放音频
                remoteUser.audioTrack.play();
              }

              // 订阅视频流
              if (remoteUser.hasVideo && remoteUser.videoTrack) {
                try {
                  await this.client.subscribe(remoteUser, 'video');
                } catch (error) {
                  this.onCallError?.({
                    errorType: CallErrorType.RTC,
                    ...(error as IAgoraRTCError),
                  });
                  throw error;
                }
                logDebug(`Successfully subscribed to video stream of user ${remoteUser.uid}`);

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

                logDebug('Create remote video info for existing user:', {
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

                logDebug('Create audio-only user info:', {
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
              logError(`❌ 订阅用户 ${remoteUser.uid} 的流失败:`, error);
            }
          }

          logDebug('Completed remote user stream subscription, total video count:', videos.length);
        } else {
          logDebug('No remote users found yet');
        }

        // 最终调用 onCallStart
        this.onCallStart?.(videos);
      };

      // 延迟执行，确保 Agora SDK 有足够时间同步远程用户信息
      // setTimeout(checkAndSubscribeRemoteUsers, 1000);
    } else {
      // 非多人通话或已有多个视频，直接调用onCallStart
      this.onCallStart?.(videos);
    }

    logDebug('Successfully joined call:', uid);
  }

  // 挂断通话
  async hangup(reason: string = HANGUP_REASON.HANGUP, isCancel: boolean = false) {
    logDebug('hangup method called:', { reason, isCancel, callStatus: this.callStatus });

    // 🔧 修复：清理正在创建中的轨道（处理竞态条件）
    if (this.creatingVideoTrack) {
      logDebug('Found video track being created, waiting and cleaning up...');
      try {
        const creatingTrack = await this.creatingVideoTrack;
        if (creatingTrack) {
          const mediaStreamTrack = creatingTrack.getMediaStreamTrack?.();
          if (mediaStreamTrack) {
            mediaStreamTrack.stop();
            logDebug('Stopped MediaStreamTrack of video track being created:', mediaStreamTrack.id);
          }
          creatingTrack.close();
          logDebug('Closed video track being created');
        }
      } catch (error) {
        logError('Error occurred while cleaning up video track being created:', error);
      }
      this.creatingVideoTrack = null;
    }

    if (this.creatingAudioTrack) {
      logDebug('Found audio track being created, waiting and cleaning up...');
      try {
        const creatingTrack = await this.creatingAudioTrack;
        if (creatingTrack) {
          const mediaStreamTrack = creatingTrack.getMediaStreamTrack?.();
          if (mediaStreamTrack) {
            mediaStreamTrack.stop();
            logDebug('Stopped MediaStreamTrack of audio track being created:', mediaStreamTrack.id);
          }
          creatingTrack.close();
          logDebug('Closed audio track being created');
        }
      } catch (error) {
        logError('Error occurred while cleaning up audio track being created:', error);
      }
      this.creatingAudioTrack = null;
    }

    // 停止铃声播放（挂断时）
    this.stopRingtone();

    // 清理定时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    // 先取消发布，再关闭音视频轨道
    if (this.client && this.callStatus === CALL_STATUS.IN_CALL) {
      try {
        // 收集需要取消发布的轨道
        const tracksToUnpublish = [];
        if (this.rtc.localAudioTrack) {
          tracksToUnpublish.push(this.rtc.localAudioTrack);
        }
        if (this.rtc.localVideoTrack) {
          tracksToUnpublish.push(this.rtc.localVideoTrack);
        }

        // 取消发布所有本地轨道（只有在客户端连接时才取消发布）
        if (tracksToUnpublish.length > 0 && this.client.connectionState === 'CONNECTED') {
          await this.client.unpublish(tracksToUnpublish);
        }
      } catch (error) {
        logError('unpublish error:', error);
      }
    }

    if (this.client && (this.rtc.localAudioTrack || this.rtc.localVideoTrack)) {
      try {
        const tracksToSafeUnpublish = [];
        if (this.rtc.localAudioTrack) {
          tracksToSafeUnpublish.push(this.rtc.localAudioTrack);
        }
        if (this.rtc.localVideoTrack) {
          tracksToSafeUnpublish.push(this.rtc.localVideoTrack);
        }

        if (tracksToSafeUnpublish.length > 0) {
          // 🔧 修复：只有在客户端连接时才调用unpublish，避免"haven't joined yet"错误
          if (this.client.connectionState === 'CONNECTED') {
            await this.client.unpublish(tracksToSafeUnpublish);
          }
        }
      } catch (error) {
        logWarn('unpublish error:', error);
      }
    }

    // 关闭音视频轨道
    if (this.rtc.localAudioTrack) {
      try {
        // 获取并停止底层MediaStreamTrack，确保麦克风资源被释放
        const mediaStreamTrack = this.rtc.localAudioTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          if (mediaStreamTrack.readyState === 'live') {
            mediaStreamTrack.stop();
          }
        }

        // 关闭Agora轨道
        this.rtc.localAudioTrack.close();
        this.rtc.localAudioTrack = null;
      } catch (error) {
        logError('close local audio track error:', error);
        this.rtc.localAudioTrack = null;
      }
    }
    if (this.rtc.localVideoTrack) {
      try {
        // 获取轨道的MediaStream
        const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          mediaStreamTrack.stop();
        }

        // 关闭Agora轨道
        this.rtc.localVideoTrack.close();
        this.rtc.localVideoTrack = null;

        // 清理缓存的本地视频流
        if (this.localVideoStream) {
          this.localVideoStream.getTracks().forEach(track => {
            track.stop();
          });
          this.localVideoStream = null;
        }
      } catch (error) {
        logError('close local video track error:', error);
        this.rtc.localVideoTrack = null;
        this.localVideoStream = null;
      }
    }

    // 强制延迟，确保轨道完全停止
    await new Promise(resolve => setTimeout(resolve, 100));

    // 🔧 增强：确保没有遗漏的MediaStreamTrack（特别是快速挂断场景）
    try {
      await this.checkAndCleanupAllMediaTracks(true); // 🔧 通话结束时进行完整的权限检查
    } catch (error) {
      logError('checkAndCleanupAllMediaTracks error:', error);
    }

    // 🔧 额外检查：强制等待一段时间后再次检查，确保异步清理完成
    setTimeout(async () => {
      try {
        await this.checkAndCleanupAllMediaTracks(true); // 🔧 通话结束时进行完整的权限检查
      } catch (err) {
        logError('checkAndCleanupAllMediaTracks error:', err);
      }
    }, 500);

    // 清理所有远程音视频轨道
    this.remoteVideoTracks.forEach((track, userId) => {
      try {
        track.stop();
      } catch (error) {
        logError('Failed to stop remote video track:', error);
      }
    });
    this.remoteVideoTracks.clear();

    this.remoteAudioTracks.forEach((track, userId) => {
      try {
        track.stop();
      } catch (error) {
        logError('Failed to stop remote audio track:', error);
      }
    });
    this.remoteAudioTracks.clear();

    // 🔧 清理缓存的远程视频流
    this.remoteVideoStreams.clear();

    // 清理旧的远程音视频轨道引用（向后兼容）
    if (this.rtc.remoteAudioTrack) {
      try {
        this.rtc.remoteAudioTrack.stop();
      } catch (error) {
        logError('Failed to stop remote audio track:', error);
      }
      this.rtc.remoteAudioTrack = null;
    }
    if (this.rtc.remoteVideoTrack) {
      try {
        this.rtc.remoteVideoTrack.stop();
      } catch (error) {
        logError('Failed to stop remote video track:', error);
      }
      this.rtc.remoteVideoTrack = null;
    }
    this.rtc.remoteUser = null;

    // 发送取消消息
    if (isCancel && this.currentCallInfo) {
      reason = HANGUP_REASON.CANCEL;
      if (
        this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
      ) {
        // 🔧 调试：打印已加入的人和已邀请的人
        logDebug('Group call hangup debug info:', {
          已加入成员: this.joinedMembers.map(member => ({
            uid: member.uid,
            userId: this.UIdToUserIdMap.get(member.uid),
            nickname: member.nickname || '未知',
          })),
          已邀请成员: this.invitedMembers,
          当前通话信息: this.currentCallInfo,
        });

        // 🔧 优化：只向未加入的成员发送取消消息
        const joinedUserIds = this.joinedMembers
          .map(member => this.UIdToUserIdMap.get(member.uid))
          .filter(Boolean);

        logDebug('Joined user ID list:', joinedUserIds);

        const membersToCancel = this.invitedMembers.filter(
          member => !joinedUserIds.includes(member),
        );

        logDebug('Members to send cancel message to:', membersToCancel);

        // 多人通话：只向未加入的成员发送取消消息
        logDebug('---->sendCancelMessage3');
        this.sendCancelMessage(this.currentCallInfo.groupId || '', 'groupChat', membersToCancel);
      } else {
        // 一对一通话
        logDebug('---->sendCancelMessage4');
        this.sendCancelMessage(this.currentCallInfo.calleeUserId || '', 'singleChat');
      }
    }

    // 🔧 修复：检查客户端实际连接状态并离开频道
    if (this.client) {
      // 🔧 关键修复：无论callStatus如何，只要客户端已连接就需要离开频道
      if (
        this.client.connectionState === 'CONNECTED' ||
        this.client.connectionState === 'CONNECTING'
      ) {
        try {
          await this.client.leave();
        } catch (error) {
          logError('leave error:', error);
        }
      }

      // 移除 Agora RTC 事件监听器（在离开频道后）
      try {
        this.client.removeAllListeners();
      } catch (error) {
        logError('removeAllListeners error:', error);
      }

      // 强制等待客户端状态更新
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 触发回调
    if (this.currentCallInfo) {
      this.currentCallInfo!.duration = this.callDuration;
      try {
        this.onCallEnd?.(reason, this.currentCallInfo as CallInfo);
      } catch (error) {
        logError('onCallEnd error:', error);
      }
    }

    // 🔧 彻底重置所有状态
    this.callStatus = CALL_STATUS.IDLE;
    this.currentCallInfo = null;
    this.callDuration = '00:00';
    this.joinedMembers = [];
    this.invitedMembers = [];
    // 清理本地视频流缓存
    this.localVideoStream = null;
    // 🔧 重置扬声器状态为默认开启
    this.speakerEnabled = true;
    // 🔧 重置preview状态标记
    this.hasEnteredPreview = false;
    // 🔧 重置正在创建的轨道引用
    this.creatingVideoTrack = null;
    this.creatingAudioTrack = null;

    this.enableMic = true;
    this.speakerEnabled = true;

    // 🔧 清理 UID 映射表，确保第二次通话时重新建立映射
    this.UIdToUserIdMap.clear();

    // 🔧 清理等待播放的视频轨道
    this.pendingVideoTracks.clear();

    // 🔧 强制等待确保所有异步清理完成
    await new Promise(resolve => setTimeout(resolve, 200));

    // 🔧 最终检查：如果客户端仍然连接，强制重新创建客户端
    if (this.client && this.client.connectionState !== 'DISCONNECTED') {
      // logDebug('🔧 检测到客户端未完全断开，重新创建客户端...');
      try {
        // 销毁旧客户端
        if (this.client.destroy) {
          await this.client.destroy();
        }
      } catch (error) {
        logWarn('destroy error:', error);
      }

      // 重新创建客户端
      this.client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
      this.client.setClientRole('host');
    }
  }

  // 发送取消消息
  private sendCancelMessage(
    to: string,
    chatType: 'singleChat' | 'groupChat',
    receiverList?: string[],
  ) {
    logDebug('---->sendCancelMessage', this.currentCallInfo, to, receiverList);
    if (!this.currentCallInfo || !to) return;
    // 改成群通话发送群定向消息

    const msg = WebIM.message.create({
      type: 'cmd',
      chatType: chatType,
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
    if (receiverList) {
      (msg as any).receiverList = receiverList;
    }
    try {
      this.connection.send(msg);
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
    }
  }

  // 发送挂断的信令
  sendHangupMessage() {
    logDebug('---->sendHangupMessage', this.currentCallInfo);
    if (!this.currentCallInfo) return;
    // 群通话：发送群定向消息，给通话中的其他人，单人：发送单聊消息
    // const to = this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ? this.currentCallInfo.groupId : this.currentCallInfo.calleeUserId || '';
    let to = '';
    if (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI) {
      to = this.currentCallInfo.groupId || '';
    } else {
      if (this.currentCallInfo.calleeUserId && this.currentCallInfo.calleeUserId !== this.userId) {
        to = this.currentCallInfo.calleeUserId;
      } else {
        to = this.currentCallInfo.callerUserId;
      }
    }
    if (!to) return logWarn('---->sendHangupMessage to is empty');
    const options: any = {
      type: 'cmd',
      chatType: this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ? 'groupChat' : 'singleChat',
      to: to,
      action: 'rtcCall',
      ext: {
        action: 'leaveCall',
        callId: this.currentCallInfo.callId,
        msgType: 'rtcCallWithAgora',
      },
    };
    if (
      this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI ||
      this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI
    ) {
      options.receiverList = this.joinedMembers
        .filter(
          member =>
            this.UIdToUserIdMap.get(member.uid) !== this.userId &&
            this.UIdToUserIdMap.get(member.uid),
        )
        .map(member => this.UIdToUserIdMap.get(member.uid));
    }
    const msg = WebIM.message.create(options);
    this.connection
      .send(msg)
      .then(() => {
        logDebug('---->sendHangupMessage success');
      })
      .catch((error: any) => {
        this.onCallError?.({
          errorType: CallErrorType.CHAT,
          code: error.type,
          message: error.message,
        });
      });
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
    // 监听用户加入
    this.client.on('user-joined', async (user: IAgoraRTCRemoteUser) => {
      logDebug('---->user-joined', user);
      this.updateJoinedMember(user, '', true);
      // 触发回调, 清楚邀请定时器

      // 获取用户ID映射
      let userId = this.UIdToUserIdMap.get(user.uid.toString()) || '';
      if (!userId) {
        try {
          const res = await this.connection.getUserIdByRTCUIds([user.uid]);
          userId = res.data[user.uid];
          this.UIdToUserIdMap.set(user.uid.toString(), userId || '');
        } catch (error: any) {
          this.onCallError?.({
            errorType: CallErrorType.CHAT,
            code: error.type,
            message: error.message,
          });
        }
      }
      // 触发回调, 清楚邀请定时器
      this.onUserPublished?.(userId);
      this.onRemoteUserJoined?.(userId, 'group');

      const hasAudioTrack = this.remoteAudioTracks.has(user.uid.toString());
      const nickname = this.userInfos[userId]?.nickname;
      if (!nickname && this.userInfoProvider) {
        const userInfo = await this.userInfoProvider([userId]);
        if (userInfo) {
          logDebug('Successfully retrieved user info:', userInfo);
          this.setUserInfo({
            [userId]: userInfo[0],
          });
        } else {
          logError('获取用户信息失败', userId);
        }
      }
      logDebug('User info:', this.userInfos);
      const remoteVideoInfo: VideoWindowProps = {
        id: `remote-${userId}`,
        isLocalVideo: false,
        muted: !hasAudioTrack, // 🔧 修复：有音频轨道 = 未静音，无音频轨道 = 静音
        cameraEnabled: true, // 摄像头开启
        nickname: nickname || userId,
        avatar: this.userInfos[userId]?.avatarUrl,
        // 🔧 修复：设置正确的视频流，用于最小化窗口显示
        stream: undefined,
        isWaiting: false, // 明确设置不在等待状态，用于替换等待窗口
      };

      this.onRemoteVideoReady?.(remoteVideoInfo);
    });

    // 监听远程用户发布流
    this.client.on('user-published', async (user: any, mediaType: string) => {
      logDebug('Received user-published event:', {
        用户ID: user.uid,
        媒体类型: mediaType,
        当前通话状态: this.callStatus,
        当前成员数量: this.joinedMembers.length,
      });

      try {
        // 订阅远程用户流
        try {
          await this.client.subscribe(user, mediaType);
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          throw error;
        }

        // 获取用户ID映射

        let userId = this.UIdToUserIdMap.get(user.uid) || '';
        if (!userId) {
          try {
            const res = await this.connection.getUserIdByRTCUIds([user.uid]);
            userId = res.data[user.uid];
            this.UIdToUserIdMap.set(user.uid, userId || '');
          } catch (error: any) {
            this.onCallError?.({
              errorType: CallErrorType.CHAT,
              code: error.type,
              message: error.message,
            });
          }
        }
        // this.onRemoteUserJoined?.(userId, mediaType as 'video' | 'audio' | 'group');

        // 触发回调, 清楚邀请定时器
        this.onUserPublished?.(userId);
        setTimeout(async () => {
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
            // 🔧 修改：将视频轨道存储到用户专用的Map中
            this.remoteVideoTracks.set(user.uid, remoteVideoTrack);

            // 保持向后兼容（为了兼容可能存在的旧代码）
            this.rtc.remoteVideoTrack = remoteVideoTrack;
            this.rtc.remoteUser = user;

            // 🔧 获取远程视频流
            const remoteVideoStream = this.getRemoteVideoStream(user.uid);
            // logDebug('🎬 获取远程视频流结果:', {
            //   用户ID: user.uid,
            //   视频轨道存在: !!this.remoteVideoTracks.get(user.uid),
            //   视频流存在: !!remoteVideoStream,
            //   轨道ID: remoteVideoTrack?.getTrackId?.(),
            // });

            // 创建远程视频信息
            // 🔧 修复：根据音频轨道状态判断静音状态，而不是依赖 joinedMembers
            const hasAudioTrack = this.remoteAudioTracks.has(user.uid);
            const nickname = this.userInfos[userId]?.nickname;
            if (!nickname && this.userInfoProvider) {
              const userInfo = await this.userInfoProvider([userId]);
              if (userInfo) {
                logDebug('Successfully retrieved user info:', userInfo);
                this.setUserInfo({
                  [userId]: userInfo[0],
                });
              } else {
                logError('获取用户信息失败', userId);
              }
            }
            logDebug('User info:', this.userInfos);
            const remoteVideoInfo: VideoWindowProps = {
              id: `remote-${userId}`,
              isLocalVideo: false,
              muted: !hasAudioTrack, // 🔧 修复：有音频轨道 = 未静音，无音频轨道 = 静音
              cameraEnabled: true, // 摄像头开启
              nickname: nickname || userId,
              avatar: this.userInfos[userId]?.avatarUrl,
              // 🔧 修复：设置正确的视频流，用于最小化窗口显示
              stream: remoteVideoStream,
              isWaiting: false, // 明确设置不在等待状态，用于替换等待窗口
            };

            this.onRemoteVideoReady?.(remoteVideoInfo);

            // 🔧 改进：使用事件驱动的方式等待视频元素准备好
            const videoId = `remote-${userId}`;
            this.pendingVideoTracks.set(videoId, remoteVideoTrack);
            // 等待视频元素准备好，最多等待10秒
            this.waitForVideoElement(videoId, remoteVideoTrack, 10000);
          }

          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            // 🔧 修改：将音频轨道存储到用户专用的Map中（使用 uid 作为 key，保持与视频轨道一致）
            this.remoteAudioTracks.set(user.uid, remoteAudioTrack);

            // 保持向后兼容
            this.rtc.remoteAudioTrack = remoteAudioTrack;
            this.rtc.remoteUser = user;

            // 根据当前扬声器状态设置新音频轨道的音量
            if (remoteAudioTrack && remoteAudioTrack.setVolume) {
              const volume = this.speakerEnabled ? 100 : 0;
              remoteAudioTrack.setVolume(volume);
            }

            // 播放远程音频
            try {
              remoteAudioTrack.play();
            } catch (error) {
              logWarn('---->remoteAudioTrack.play error', error);
            }

            // 🔧 1v1视频通话特殊处理：当只是音频状态变化时，不触发onRemoteVideoReady以避免闪动
            const is1v1VideoCall = this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1;
            const isExistingUser = this.joinedMembers.some(member => member.uid === user.uid);
            logDebug('---->isExistingUser', this.joinedMembers, user);
            if (is1v1VideoCall && isExistingUser) {
              // 只更新成员状态，不触发UI更新
              this.updateJoinedMember(user, mediaType, true);
              // return;
            }

            // 🔧 修复：在音频事件中，智能判断摄像头状态
            // 如果用户已经有视频轨道，说明摄像头开启；否则检查成员状态
            const hasVideoTrack = this.remoteVideoTracks.has(user.uid);
            const memberCameraStatus = this.getRemoteUserCameraStatus(userId);
            const cameraEnabled = hasVideoTrack || memberCameraStatus;
            logDebug('---->cameraEnabled', hasVideoTrack, memberCameraStatus, cameraEnabled);
            // 创建更新后的视频信息（音频发布时，用户取消静音了）
            const nickname = this.userInfos[userId]?.nickname;
            if (!nickname && this.userInfoProvider) {
              const userInfo = await this.userInfoProvider([userId]);
              if (userInfo) {
                logDebug('Successfully retrieved user info:', userInfo);
                this.setUserInfo({
                  [userId]: userInfo[0],
                });
              } else {
                logError('获取用户信息失败', userId);
              }
            }
            logDebug('User info:', this.userInfos);
            const updatedVideoInfo: VideoWindowProps = {
              id: `remote-${userId}`,
              isLocalVideo: false,
              muted: false, // 🔧 修复：音频发布时，用户取消静音了
              cameraEnabled: cameraEnabled,
              // cameraEnabled: false, // 摄像头关闭
              nickname: this.userInfos[userId]?.nickname || userId,
              avatar: this.userInfos[userId]?.avatarUrl,
              // 保持当前的视频流状态
              stream: cameraEnabled ? this.getRemoteVideoStream(user.uid) : undefined,
              isWaiting: false, // 明确设置不在等待状态
            };
            logDebug('---->updatedVideoInfo user-published', updatedVideoInfo);

            // 通知UI更新远程视频状态
            this.onRemoteVideoReady?.(updatedVideoInfo);
          }
        }, 300);
        // 更新加入的成员列表
        this.updateJoinedMember(user, mediaType, true);
      } catch (error) {
        logError('Failed to subscribe to remote user:', error);
      }
    });

    // 监听远程用户离开
    this.client.on('user-left', (user: any, reason: string) => {
      logDebug('---->user-left', user, reason);
      const userId = this.UIdToUserIdMap.get(user.uid) || '';

      // 🔧 清理离开用户的所有媒体轨道（使用 uid 作为 key）
      const videoTrack = this.remoteVideoTracks.get(user.uid);
      const audioTrack = this.remoteAudioTracks.get(user.uid);

      if (videoTrack) {
        try {
          videoTrack.stop();
        } catch (error) {
          logWarn(`stop video track error:`, error);
        }
        this.remoteVideoTracks.delete(user.uid);
      }

      if (audioTrack) {
        try {
          audioTrack.stop();
        } catch (error) {
          logWarn(`stop audio track error:`, error);
        }
        this.remoteAudioTracks.delete(user.uid);
      }

      // 移除离开的用户
      this.joinedMembers = this.joinedMembers.filter(member => member.uid !== user.uid);

      this.handleUserLeft(userId, reason);
    });

    // 监听远程用户停止发布流
    this.client.on('user-unpublished', (user: any, mediaType: string) => {
      // 触发回调
      this.onUserUnpublished?.(user, mediaType);

      const userId = this.UIdToUserIdMap.get(user.uid) || '';

      if (mediaType === 'video') {
        // 停止视频播放
        if (user.videoTrack) {
          user.videoTrack.stop();
        }

        // 🔧 从Map中清理用户的视频轨道（使用 uid 作为 key）
        this.remoteVideoTracks.delete(user.uid);
        // 🔧 清理缓存的视频流
        this.remoteVideoStreams.delete(user.uid);

        // 清理远程视频轨道引用
        if (this.rtc.remoteVideoTrack && this.rtc.remoteUser?.uid === user.uid) {
          this.rtc.remoteVideoTrack = null;
        }
        // 创建更新后的视频信息（关闭摄像头，显示头像）
        // 🔧 修复：根据音频轨道状态判断静音状态，而不是依赖 joinedMembers
        const hasAudioTrack = this.remoteAudioTracks.has(user.uid);
        const updatedVideoInfo: VideoWindowProps = {
          id: `remote-${userId}`,
          isLocalVideo: false,
          muted: !hasAudioTrack, // 🔧 修复：有音频轨道 = 未静音，无音频轨道 = 静音
          cameraEnabled: false, // 摄像头关闭
          nickname: this.userInfos[userId]?.nickname || userId,
          avatar: this.userInfos[userId]?.avatarUrl,
          // 移除stream，这样UI会显示头像
          stream: undefined,
          isWaiting: false, // 明确设置不在等待状态
        };

        logDebug('---->updatedVideoInfo user-unpublished', updatedVideoInfo);

        // 通知UI更新远程视频状态
        this.onRemoteVideoReady?.(updatedVideoInfo);
      }

      if (mediaType === 'audio') {
        // 停止音频播放
        if (user.audioTrack) {
          user.audioTrack.stop();
        }

        // 🔧 从Map中清理用户的音频轨道
        this.remoteAudioTracks.delete(user.uid);
        // 🔧 注意：音频停止时不清理视频流缓存，因为用户可能只是静音

        // 清理远程音频轨道引用
        if (this.rtc.remoteAudioTrack && this.rtc.remoteUser?.uid === user.uid) {
          this.rtc.remoteAudioTrack = null;
        }

        // 🔧 1v1视频通话特殊处理：当只是音频状态变化时，不触发onRemoteVideoReady以避免闪动
        const is1v1VideoCall = this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1;
        const isExistingUser = this.joinedMembers.some(member => member.uid === user.uid);

        if (is1v1VideoCall && isExistingUser) {
          // 只更新成员状态，不触发UI更新
          this.updateJoinedMember(user, mediaType, false);
          return;
        }

        // 🔧 修复：在音频停止事件中，智能判断摄像头状态
        const hasVideoTrack = this.remoteVideoTracks.has(user.uid);
        const memberCameraStatus = this.getRemoteUserCameraStatus(userId);
        const cameraEnabled = hasVideoTrack || memberCameraStatus;

        // 创建更新后的视频信息（音频停止时，用户静音了）
        const updatedVideoInfo: VideoWindowProps = {
          id: `remote-${userId}`,
          isLocalVideo: false,
          muted: true, // 🔧 修复：音频停止时，用户静音了
          cameraEnabled: cameraEnabled,
          nickname: this.userInfos[userId]?.nickname || userId,
          avatar: this.userInfos[userId]?.avatarUrl,
          // 保持当前的视频流状态
          stream: cameraEnabled ? this.getRemoteVideoStream(user.uid) : undefined,
          isWaiting: false, // 明确设置不在等待状态
        };

        // 通知UI更新远程视频状态
        this.onRemoteVideoReady?.(updatedVideoInfo);
      }

      // 更新成员状态
      this.updateJoinedMember(user, mediaType, false);
    });

    // 🔧 新增：监听谁在说话
    this.client.on('volume-indicator', (volumes: any[]) => {
      const talkingUsers = volumes
        .filter(volume => volume.level > this.speakingVolumeThreshold)
        .map(volume => this.UIdToUserIdMap.get(volume.uid) || '');

      const localTalkingUsers = [...talkingUsers];
      if (this.isMuted()) {
        const localIndex = localTalkingUsers.indexOf(this.userId);
        if (localIndex > -1) {
          localTalkingUsers.splice(localIndex, 1);
        }
      }

      // 通知UI更新说话状态
      this.onTalkingUsersChange?.(localTalkingUsers);
    });

    // 监听自己网络质量
    this.client.on('network-quality', (quality: any) => {
      // 同时获取订阅的其他人的网络质量
      const others = this.client.getRemoteNetworkQuality(this.agoraUid);
      // others: {[uid]: {quality}} 转成 {[userId]: {quality}}
      const others2: any = Object.keys(others).reduce((acc: any, uid: string) => {
        const numericUid = parseInt(uid, 10);
        const userId = this.UIdToUserIdMap.get(numericUid as any);
        acc[userId || ''] = others[uid];
        return acc;
      }, {});
      others2[this.userId] = quality;
      this.onNetworkQualityChange?.(others2);
    });
  }

  private handleUserLeft(userId: string, reason: string) {
    logDebug('---->handleUserLeft', userId, reason);
    this.onRemoteUserLeft?.(
      userId,
      this.currentCallInfo?.type as unknown as 'video' | 'audio' | 'group',
    );

    this.invitedMembers = this.invitedMembers.filter(member => member !== userId);
    if (this.currentCallInfo) {
      this.currentCallInfo.invitedMembers = this.currentCallInfo.invitedMembers?.filter(
        member => member !== userId,
      );
    }

    // 如果是1v1通话，远程用户离开则挂断
    if (
      this.currentCallInfo?.type === CALL_TYPE.VIDEO_1V1 ||
      this.currentCallInfo?.type === CALL_TYPE.AUDIO_1V1
    ) {
      this.hangup(reason === 'ServerTimeOut' ? HANGUP_REASON.ABNORMAL_END : HANGUP_REASON.HANGUP);
    } else if (
      this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ||
      this.currentCallInfo?.type === CALL_TYPE.AUDIO_MULTI
    ) {
      // 多人通话：通知UI移除离开用户的视频窗口
      const removedVideoInfo: VideoWindowProps = {
        id: `remote-${userId}`,
        isLocalVideo: false,
        muted: true,
        cameraEnabled: false,
        nickname: this.userInfos[userId]?.nickname || userId,
        avatar: this.userInfos[userId]?.avatarUrl,
        stream: undefined,
        // 添加特殊标记表示用户已离开
        removed: true,
      };

      // 通知UI移除视频窗口
      this.onRemoteVideoReady?.(removedVideoInfo);
    }
  }
  // 添加消息监听器
  private addMessageListener() {
    this.connection?.addEventHandler?.('callkit', {
      onTextMessage: (message: any) => {
        logDebug('onTextMessage message -->', message);
        if (message.ext && message.ext.action === 'invite') {
          this.handleInvitationMessage(message);
        }
      },

      onCmdMessage: (message: any) => {
        logDebug('onCmdMessage message -->', message);
        if (message.action === 'rtcCall') {
          this.handleSignalMessage(message);
        }
      },

      onDisconnected: (e: any) => {
        if (e) {
          // 多端被踢下线
          if (e.type === '206') {
            // 其他错误码场景下不存在该字段
            // 当前设备挤下线的新登录设备的自定义扩展信息。
            logDebug('---->onDisconnected 206');
            this.hangup(HANGUP_REASON.ABNORMAL_END, true);
          }
        }
      },
    });
  }

  // 处理邀请消息
  private async handleInvitationMessage(message: any) {
    logDebug('---->handleInvitationMessage message', message);
    if (message.from === this.connection.context.jid.name) {
      return; // 忽略自己发送的消息
    }

    const ext = message.ext;

    // 检查是否忙线
    if (this.callStatus > CALL_STATUS.IDLE) {
      const newInvitationInfo = {
        callerUserId: message.from,
        callerDevId: ext.callerDevId,
        callId: ext.callId,
      };
      this.sendAnswerCallMessage('busy', newInvitationInfo);
      return;
    }

    // 创建通话信息
    this.currentCallInfo = {
      callId: ext.callId,
      channel: ext.channelName,
      type: ext.type,
      callerDevId: ext.callerDevId,
      callerUserId: ext.callerIMName || message.from,
      calleeUserId: ext.type === CALL_TYPE.VIDEO_MULTI ? ext.groupId : message.to,
      groupId: ext.callkitGroupInfo?.groupId,
      groupName: ext.callkitGroupInfo?.groupName,
      groupAvatar: ext.callkitGroupInfo?.groupAvatar,
      inviteMessageId: message.id,
    };

    // 获取主叫方信息
    const callerUserInfo = ext.ease_chat_uikit_user_info;
    const callerName = callerUserInfo?.nickname || message.from;
    const callerAvatar = callerUserInfo?.avatarURL;
    if (callerName || callerAvatar) {
      const callerUserInfoMap = {
        [message.from]: {
          nickname: callerName,
          avatarUrl: callerAvatar,
        },
      };
      this.setUserInfo(callerUserInfoMap);
    }

    // 如果是群组通话，缓存群组信息
    if (ext.callkitGroupInfo?.groupId) {
      const groupName = ext.callkitGroupInfo?.groupName;
      const groupAvatar = ext.callkitGroupInfo?.groupAvatar;
      const groupId = ext.callkitGroupInfo.groupId;
      // 缓存群组信息，供后续使用
      if (groupName || groupAvatar) {
        this.cachedGroupInfos[groupId] = {
          groupName: groupName,
          groupAvatar: groupAvatar,
        };
      }
    }

    this.onReceivedCall?.(ext.type, message.from, ext.ext);

    this.sendAlertingMessage();
    this.playRingtone('incoming');

    if (this.userInfoProvider) {
      // 被邀请方信息
      const userInfo = await this.userInfoProvider([message.to]);
      logDebug('Invited user info:', userInfo);
      if (userInfo) {
        this.setUserInfo({
          [message.to]: userInfo[0],
        });
      }
    }
  }

  // 处理信令消息
  private handleSignalMessage(message: any) {
    const ext = message.ext;
    logDebug('---->cmd ext', ext);
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
      case 'leaveCall':
        this.handleLeaveCallMessage(message);
        break;
      default:
        this.onCallError?.({
          errorType: CallErrorType.CALLKIT,
          code: CallErrorCode.CALL_SIGNALING_ERROR,
          message: `unexpected action ${ext.action}`,
        });
        break;
    }
  }

  private async handleAlertMessage(message: any) {
    const ext = message.ext;
    this.timer && clearTimeout(this.timer);
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
      logWarn('not current call', callId, this.currentCallInfo.callId);
      status = false;
    }

    if (
      this.callStatus > CALL_STATUS.RECEIVED_CONFIRM_RING &&
      this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI
    ) {
      status = false;
    }

    // 判断这个人如果已经在群通话中，或者已经不在邀请列表中，则status为false
    if (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI) {
      const joinedUserIds = this.joinedMembers.map(member => this.UIdToUserIdMap.get(member.uid));
      if (joinedUserIds.includes(to)) {
        logDebug('user already in group call');
        status = false;
      }
      logger.debug('currentCallInfo.invitedMembers', this.currentCallInfo.invitedMembers);
      if (!this.currentCallInfo.invitedMembers?.includes(to)) {
        logDebug('user has been removed from group call');
        status = false;
      }
    }

    if (callerDevId !== this.connection.context.jid.clientResource) {
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
    logDebug('---->sendConfirmRingMessage', msg);
    try {
      this.connection.send(msg);

      // 对方弹出邀请后，如果30秒内没有响应，则自动挂断
      if (this.currentCallInfo?.type !== CALL_TYPE.VIDEO_MULTI) {
        this.timer = setTimeout(() => {
          logDebug('Invitation timeout, auto hangup');
          this.hangup(HANGUP_REASON.REMOTE_NO_RESPONSE, true);
        }, 30000);
      }
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
    }
  }

  // 处理确认响铃消息
  private async handleConfirmRingMessage(message: any) {
    logDebug('---->handleConfirmRingMessage', message);
    const ext = message.ext;

    if (ext.calleeDevId !== this.connection.context.jid.clientResource) {
      return; // 多端情况下的其他设备消息
    }
    if (ext.callerDevId !== this.currentCallInfo?.callerDevId) {
      // 主叫有两个设备
      return; // 多端情况下的其他设备消息
    }

    this.timer && clearTimeout(this.timer);

    if (!ext.status || this.callStatus < CALL_STATUS.ALERTING) {
      logDebug('---->handleConfirmRingMessage 1');
      this.hangup(HANGUP_REASON.HANDLE_ON_OTHER_DEVICE);
      return;
    }
    if (this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING) {
      return;
    }
    this.callStatus = CALL_STATUS.RECEIVED_CONFIRM_RING;

    const callType = this.convertCallTypeToString(
      this.currentCallInfo?.type || CALL_TYPE.AUDIO_1V1,
    );
    const inviteInfo: any = {
      id: ext.callId, // InvitationInfo 需要 id 字段
      callId: ext.callId,
      from: message.from,
      type: callType, // 转换枚举值为字符串
      channel: ext.channelName,
      callerDevId: ext.callerDevId,
      callerUserId: message.from,
      callerName: this.userInfos[message.from]?.nickname, // 邀请人昵称
      callerAvatar: this.userInfos[message.from]?.avatarUrl, // 邀请人头像
      timestamp: ext.ts || Date.now(), // 邀请时间戳
    };
    inviteInfo.groupId = ext.groupId;
    inviteInfo.groupName = this.currentCallInfo?.groupName;
    inviteInfo.groupAvatar = this.currentCallInfo?.groupAvatar;

    logDebug('---->inviteInfo', inviteInfo, this.currentCallInfo);
    // 触发邀请接收回调
    this.onInvitationReceived?.(inviteInfo);
    this.timer = setTimeout(() => {
      // 群组通话进行中，再去邀请别人，超时不挂断
      if (this.callStatus !== CALL_STATUS.IN_CALL) {
        logDebug('---->hangup NO_RESPONSE', inviteInfo, this.callStatus);
        this.hangup(HANGUP_REASON.NO_RESPONSE);
      }
    }, 30000);
  }

  // 处理应答消息
  private handleAnswerCallMessage(message: any) {
    const ext = message.ext;
    if (ext.callId !== this.currentCallInfo?.callId) {
      logDebug(
        '---->handleAnswerCallMessage callId not match',
        ext.callId,
        this.currentCallInfo?.callId,
      );
      return;
    }

    this.stopRingtone();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 如果当前正在通话中，不应该因为其他消息而挂断当前通话
    if (
      this.callStatus === CALL_STATUS.IN_CALL &&
      this.currentCallInfo?.type !== CALL_TYPE.VIDEO_MULTI
    ) {
      return;
    }

    if (ext.callerDevId !== this.connection.context.jid.clientResource) {
      if (message.from === this.connection.context.jid.name) {
        // 其他设备处理了
        const reason =
          ext.result === 'accept' ? 'accepted on other devices' : 'refused on other devices';
        logDebug('---->handleAnswerCallMessage 2', reason);
        this.hangup(HANGUP_REASON.HANDLE_ON_OTHER_DEVICE);
        return;
      }
      return;
    }

    if (ext.result !== 'accept') {
      const reason = ext.result === 'busy' ? HANGUP_REASON.BUSY : HANGUP_REASON.REMOTE_REFUSE;
      this.sendConfirmCalleeMessage(message.from, ext.calleeDevId, ext.result);

      // 🔧 修复：多人通话中，单个用户拒绝不应该挂断整个通话
      if (
        this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ||
        this.currentCallInfo?.type === CALL_TYPE.AUDIO_MULTI
      ) {
        // 多人通话：只记录拒绝状态，不挂断通话
        // 从邀请列表中移除拒绝的用户
        this.invitedMembers = this.invitedMembers.filter(member => member !== message.from);
        this.currentCallInfo.invitedMembers = this.currentCallInfo.invitedMembers?.filter(
          member => member !== message.from,
        );

        // 群组通话，被叫拒绝后，立即从主叫的窗口中移除
        this.onInvitedUserRemoved?.(message.from, 'refused');
      } else {
        // 一对一通话 拒绝则挂断
        logDebug('---->handleAnswerCallMessage 3', reason);
        this.hangup(reason);
      }
    } else {
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

    try {
      this.connection.send(msg);
    } catch (error: any) {
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
    }

    if (result === 'accept') {
      // 主叫方接受后，自动加入通话（如果还没有加入的话）
      if (this.callStatus !== CALL_STATUS.IN_CALL) {
        this.callStatus = CALL_STATUS.CONFIRM_CALLEE;
        this.joinCall();
      }
    }
  }

  // 处理确认被叫方消息
  private handleConfirmCalleeMessage(message: any) {
    const ext = message.ext;

    // 🔧 修复：防止重复处理confirmCallee消息
    if (this.callStatus >= CALL_STATUS.CONFIRM_CALLEE) {
      return;
    }

    // 当前正在通话中，忽略 confirmCallee 消息，不挂断当前通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      return;
    }

    if (ext.callId !== this.currentCallInfo?.callId) {
      logDebug(
        '---->handleConfirmCalleeMessage callId not match',
        ext.callId,
        this.currentCallInfo?.callId,
      );
      return;
    }

    // 收到其他设备的 confirmCallee 消息，挂断当前通话
    if (ext.calleeDevId !== this.connection.context.jid.clientResource) {
      logDebug('---->handleConfirmCalleeMessage 2');
      this.hangup(HANGUP_REASON.HANDLE_ON_OTHER_DEVICE);
      return;
    }

    // 收到拒绝或忙线的 confirmCallee 消息，挂断通话
    if (ext.result !== 'accept') {
      const reason = ext.result === 'busy' ? HANGUP_REASON.BUSY : HANGUP_REASON.REFUSE;
      logDebug('---->handleConfirmCalleeMessage 3', reason);
      this.hangup(reason);
      return;
    }

    if (this.callStatus < CALL_STATUS.CONFIRM_CALLEE) {
      this.callStatus = CALL_STATUS.CONFIRM_CALLEE;
    }
    this.joinCall();
  }

  // 处理取消消息
  private handleCancelCallMessage(message: any) {
    if (message.from === this.connection.context.jid.name) {
      return; // 忽略自己发送的消息
    }

    // 🔧 修复：如果当前正在通话中，不应该挂断当前通话
    if (this.callStatus === CALL_STATUS.IN_CALL) {
      return;
    }

    if (this.currentCallInfo && message.from === this.currentCallInfo.callerUserId) {
      logDebug('---->handleCancelCallMessage 1');
      this.hangup(HANGUP_REASON.REMOTE_CANCEL);
    }
  }

  // 处理离开消息
  private handleLeaveCallMessage(message: any) {
    const ext = message.ext;
    if (ext.callId !== this.currentCallInfo?.callId) {
      return;
    }
    this.handleUserLeft(message.from, HANGUP_REASON.HANGUP);
  }

  // 切换麦克风状态
  async toggleMute(): Promise<boolean> {
    // if (
    //   this.callStatus < CALL_STATUS.CONFIRM_RING ||
    //   this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING
    // ) {
    //   logWarn('not joined the call yet');
    //   return false;
    // }
    this.enableMic = !this.enableMic;

    if (this.rtc.localAudioTrack) {
      const currentEnabled = this.rtc.localAudioTrack.enabled;

      // 直接设置轨道的启用状态，不触发UI更新
      this.rtc.localAudioTrack.setEnabled && this.rtc.localAudioTrack.setEnabled(this.enableMic);

      // 通知UI更新本地视频状态
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: !this.enableMic, // 返回muted状态（与enabled相反）
        cameraEnabled: this.isCameraEnabled(),
        nickname: this.userInfos[this.userId]?.nickname || '我',
        avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
        // 🔧 修复：mute 操作不应该影响视频流，使用现有的流
        stream: this.localVideoStream || undefined,
      };

      this.onRemoteVideoReady?.(localVideoInfo);
      if (!this.enableMic) {
        this.rtc.localAudioTrack = null;
      }
    } else if (this.enableMic) {
      this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      if (this.callStatus == CALL_STATUS.IN_CALL) {
        await this.client.publish([this.rtc.localAudioTrack]);
      }

      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: !this.enableMic, // 返回muted状态（与enabled相反）
        cameraEnabled: this.isCameraEnabled(),
        nickname: this.userInfos[this.userId]?.nickname || '我',
        avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
        // 🔧 修复：mute 操作不应该影响视频流，使用现有的流
        stream: this.localVideoStream || undefined,
      };
      this.onRemoteVideoReady?.(localVideoInfo);
    }

    return this.enableMic; // 返回muted状态（与enabled相反）
  }

  // 切换摄像头状态
  async toggleCamera(): Promise<boolean> {
    // 根据信令流程正确判断是否允许操作摄像头
    // - INVITING: 主叫方发起通话后的状态 ✅ 允许
    // - ALERTING: 被叫方收到邀请的状态 ✅ 允许
    // - 其他更高级状态 ✅ 允许
    if (this.callStatus < CALL_STATUS.INVITING) {
      logWarn('Call not started, cannot operate camera, callStatus:', this.callStatus);
      return false;
    }

    // 🔧 预览模式下的摄像头操作（适用于群通话主叫和被叫）
    // 包含所有预连接状态：INVITING, ALERTING, CONFIRM_RING, RECEIVED_CONFIRM_RING, ANSWER_CALL, CONFIRM_CALLEE
    const isPreviewMode = this.callStatus < CALL_STATUS.IN_CALL;
    if (isPreviewMode) {
      const statusName = this.callStatus === CALL_STATUS.INVITING ? '主叫预览模式' : '被叫预览模式';
      logDebug(
        `Detected ${statusName} (callStatus: ${this.callStatus}), using preview mode camera operation`,
      );
      return await this.toggleCameraInPreview();
    }

    // 如果没有本地视频轨道，创建一个新的
    if (!this.rtc.localVideoTrack) {
      logDebug('Local video track does not exist, creating new video track...');
      try {
        // 🔧 修复：安卓设备需要等待设备资源完全释放，特别是切换摄像头后关闭再打开的情况
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid && this.currentCameraDeviceId) {
          // 如果之前切换过摄像头，等待设备资源释放
          const waitTime = 200;
          logDebug(`toggleCamera: waiting ${waitTime}ms for Android device resource release`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // 🔧 修复：如果之前切换过摄像头，使用保存的设备ID创建轨道（安卓设备需要）
        const trackConfig: any = this.encoderConfig ? { encoderConfig: this.encoderConfig } : {};
        if (this.currentCameraDeviceId) {
          trackConfig.cameraId = this.currentCameraDeviceId;
          logDebug('toggleCamera: using saved device ID:', this.currentCameraDeviceId.slice(0, 8));
        }
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack(trackConfig);
        this.rtc.localVideoTrack = localVideoTrack;

        // 🔧 修复：保存当前使用的设备ID（如果之前没有保存过）
        if (!this.currentCameraDeviceId) {
          try {
            const mediaStreamTrack = localVideoTrack.getMediaStreamTrack();
            if (mediaStreamTrack) {
              const settings = mediaStreamTrack.getSettings();
              if (settings.deviceId) {
                this.currentCameraDeviceId = settings.deviceId;
                logDebug('toggleCamera: saved initial device ID:', settings.deviceId.slice(0, 8));
              }
            }
          } catch (e) {
            logWarn('toggleCamera: failed to get device ID:', e);
          }
        }

        // 确保新创建的轨道是启用状态
        if (!localVideoTrack.enabled) {
          localVideoTrack.setEnabled(true);
        }

        // 等待轨道状态稳定
        await new Promise(resolve => setTimeout(resolve, 100));

        // 验证轨道状态后发布
        if (localVideoTrack.enabled) {
          await this.client.publish([localVideoTrack]);
          logDebug('New video track created successfully and published to channel');
        } else {
          throw new Error('视频轨道创建后仍处于禁用状态');
        }

        // 播放本地视频
        setTimeout(() => {
          logDebug('toggleCamera (newly created): start playing local video');
          this.playLocalVideo();
        }, 100);
        // 通知UI更新本地视频状态（摄像头开启）
        const localVideoInfo: VideoWindowProps = {
          id: 'local',
          isLocalVideo: true,
          muted: this.isMuted(),
          cameraEnabled: true,
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
          stream: this.getOrCreateLocalVideoStream(), // 🔧 修复：提供视频流
        };

        this.onRemoteVideoReady?.(localVideoInfo);
        return true;
      } catch (error) {
        logError('创建本地视频轨道失败:', error);
        // 清理失败的轨道
        if (this.rtc.localVideoTrack) {
          try {
            this.rtc.localVideoTrack.close();
          } catch (e) {
            // 忽略清理错误
          }
          this.rtc.localVideoTrack = null;
        }
        this.onCallError?.({
          errorType: CallErrorType.RTC,
          ...(error as IAgoraRTCError),
        });
        return false;
      }
    }

    // 如果视频轨道已存在，检查其状态
    const currentEnabled = this.rtc.localVideoTrack.enabled;
    const newEnabled = !currentEnabled;

    // 检查轨道是否已发布到频道
    const publishedTracks = this.client.localTracks || [];
    const isVideoTrackPublished = publishedTracks.some(
      (track: any) => track.trackMediaType === 'video' && track === this.rtc.localVideoTrack,
    );

    // 如果摄像头开启
    if (newEnabled) {
      try {
        // 尝试启用现有轨道
        if (typeof this.rtc.localVideoTrack.setEnabled === 'function') {
          this.rtc.localVideoTrack.setEnabled(true);
          // 等待轨道状态更新完成
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 如果轨道仍然未启用，尝试重新创建轨道
        if (!this.rtc.localVideoTrack.enabled) {
          logDebug('setEnabled failed, trying to recreate video track...');

          // 先关闭现有轨道
          try {
            this.rtc.localVideoTrack.close();
          } catch (e) {
            logWarn('Failed to close old track:', e);
          }

          // 🔧 修复：安卓设备需要等待设备资源完全释放，特别是切换摄像头后关闭再打开的情况
          // 等待时间根据平台调整：安卓需要更长时间，iOS可以短一些
          const isAndroid = /Android/i.test(navigator.userAgent);
          const waitTime = isAndroid ? 300 : 100;
          logDebug(
            `toggleCamera: waiting ${waitTime}ms for device resource release (Android: ${isAndroid})`,
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // 创建新的视频轨道
          // 🔧 修复：如果之前切换过摄像头，使用保存的设备ID创建轨道（安卓设备需要）
          const trackConfig: any = this.encoderConfig ? { encoderConfig: this.encoderConfig } : {};
          if (this.currentCameraDeviceId) {
            trackConfig.cameraId = this.currentCameraDeviceId;
            logDebug(
              'toggleCamera: recreating track with saved device ID:',
              this.currentCameraDeviceId.slice(0, 8),
            );
          }
          let newVideoTrack;
          try {
            newVideoTrack = await AgoraRTC.createCameraVideoTrack(trackConfig);
          } catch (error) {
            // 🔧 修复：如果使用保存的设备ID创建失败，尝试不使用设备ID（可能是设备已移除）
            if (this.currentCameraDeviceId && trackConfig.cameraId) {
              logWarn(
                'toggleCamera: failed to create track with saved device ID, trying without device ID:',
                error,
              );
              delete trackConfig.cameraId;
              newVideoTrack = await AgoraRTC.createCameraVideoTrack(trackConfig);
              // 清除无效的设备ID
              this.currentCameraDeviceId = null;
            } else {
              throw error;
            }
          }
          this.rtc.localVideoTrack = newVideoTrack;

          // 🔧 修复：保存当前使用的设备ID
          try {
            const mediaStreamTrack = newVideoTrack.getMediaStreamTrack();
            if (mediaStreamTrack) {
              const settings = mediaStreamTrack.getSettings();
              if (settings.deviceId) {
                this.currentCameraDeviceId = settings.deviceId;
                logDebug(
                  'toggleCamera: saved device ID after recreation:',
                  settings.deviceId.slice(0, 8),
                );
              }
            }
          } catch (e) {
            logWarn('toggleCamera: failed to get device ID:', e);
          }

          // 如果新轨道也没启用，强制启用
          if (!newVideoTrack.enabled && typeof newVideoTrack.setEnabled === 'function') {
            newVideoTrack.setEnabled(true);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        // 最终检查轨道状态
        if (!this.rtc.localVideoTrack.enabled) {
          logError('所有尝试都失败，轨道仍然处于禁用状态');
          return false;
        }

        // 如果轨道未发布到频道，需要先发布
        if (!isVideoTrackPublished) {
          logDebug('Video track not published to channel, publishing...');

          // 发布前再次验证轨道状态
          if (!this.rtc.localVideoTrack.enabled) {
            throw new Error(
              `视频轨道处于禁用状态，无法发布。轨道ID: ${this.rtc.localVideoTrack.getTrackId()}`,
            );
          }

          await this.client.publish([this.rtc.localVideoTrack]);
          logDebug('Video track successfully published to channel');
        } else {
          logDebug('Video track already published to channel');
        }

        // 播放本地视频
        setTimeout(() => {
          logDebug('toggleCamera: start playing local video');
          this.playLocalVideo();
        }, 100);
      } catch (error) {
        logError('发布视频轨道失败:', error);
        // 如果发布失败，恢复轨道状态
        this.rtc.localVideoTrack.setEnabled && this.rtc.localVideoTrack.setEnabled(false);
        this.onCallError?.({
          errorType: CallErrorType.RTC,
          ...(error as IAgoraRTCError),
        });
        return false;
      }
    } else {
      // 摄像头关闭时，彻底停止轨道
      try {
        // 1. 先取消发布轨道（如果已发布）
        if (this.client && this.rtc.localVideoTrack) {
          const publishedTracks = this.client.localTracks || [];
          const isVideoTrackPublished = publishedTracks.some(
            (track: any) =>
              track && track.trackMediaType === 'video' && track === this.rtc.localVideoTrack,
          );

          if (isVideoTrackPublished) {
            await this.client.unpublish([this.rtc.localVideoTrack]);
          }
        }

        // 2. 获取并停止底层MediaStreamTrack
        const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          mediaStreamTrack.stop();
        }

        // 3. 关闭Agora轨道
        this.rtc.localVideoTrack.close();

        // 4. 清空引用
        this.rtc.localVideoTrack = null;

        // 🔧 修复：清除缓存的视频流
        this.localVideoStream = null;

        // 🔧 修复：安卓设备需要等待设备资源完全释放，延迟后再允许重新打开
        // 注意：这里不等待，而是在重新打开时处理，避免阻塞UI
      } catch (error) {
        logError('close local video track failed:', error);
        // 即使出错也要清空引用，防止状态不一致
        this.rtc.localVideoTrack = null;
      }
    }

    // 通知UI更新本地视频状态
    // 注意：如果摄像头被关闭，轨道已被销毁，实际状态是false
    const actualCameraEnabled = this.rtc.localVideoTrack ? newEnabled : false;
    const localVideoInfo: VideoWindowProps = {
      id: 'local',
      isLocalVideo: true,
      muted: this.isMuted(),
      cameraEnabled: actualCameraEnabled,
      nickname: this.userInfos[this.userId]?.nickname || '我',
      avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
      stream: actualCameraEnabled ? this.getOrCreateLocalVideoStream() : undefined, // 🔧 修复：只有开启时才提供视频流
    };

    this.onRemoteVideoReady?.(localVideoInfo);

    return actualCameraEnabled;
  }

  // 🔧 新增：预览模式下的摄像头操作
  private async toggleCameraInPreview(): Promise<boolean> {
    logDebug('Preview mode: start switching camera status');

    // 如果没有视频轨道，创建一个
    if (!this.rtc.localVideoTrack) {
      logDebug('Preview mode: create new video track');
      try {
        // 🔧 修复：如果之前切换过摄像头，使用保存的设备ID创建轨道（安卓设备需要）
        const trackConfig: any = this.encoderConfig ? { encoderConfig: this.encoderConfig } : {};
        if (this.currentCameraDeviceId) {
          trackConfig.cameraId = this.currentCameraDeviceId;
          logDebug('Preview mode: using saved device ID:', this.currentCameraDeviceId.slice(0, 8));
        }
        const localVideoTrack = await AgoraRTC.createCameraVideoTrack(trackConfig);
        this.rtc.localVideoTrack = localVideoTrack;

        // 🔧 修复：保存当前使用的设备ID（如果之前没有保存过）
        if (!this.currentCameraDeviceId) {
          try {
            const mediaStreamTrack = localVideoTrack.getMediaStreamTrack();
            if (mediaStreamTrack) {
              const settings = mediaStreamTrack.getSettings();
              if (settings.deviceId) {
                this.currentCameraDeviceId = settings.deviceId;
                logDebug('Preview mode: saved initial device ID:', settings.deviceId.slice(0, 8));
              }
            }
          } catch (e) {
            logWarn('Preview mode: failed to get device ID:', e);
          }
        }

        // 🔧 增加延迟时间，确保UI完全渲染完成后再播放视频
        setTimeout(() => {
          this.playLocalVideo();
        }, 500);

        // 通知UI更新状态
        const localVideoInfo: VideoWindowProps = {
          id: 'local', // 🔧 修改：使用与群通话一致的ID
          isLocalVideo: true,
          muted: this.isMuted(),
          cameraEnabled: true,
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
          stream: this.getOrCreateLocalVideoStream(), // 🔧 修改：提供视频流以确保video元素被渲染
        };

        this.onRemoteVideoReady?.(localVideoInfo);
        logDebug('Preview mode: camera enabled');
        return true;
      } catch (error) {
        logError('createCameraVideoTrack failed:', error);
        return false;
      }
    } else {
      // 有视频轨道，关闭它
      logDebug('Preview mode: close camera');
      try {
        // 获取并停止底层MediaStreamTrack
        const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          logDebug('Preview mode: stop underlying MediaStreamTrack:', mediaStreamTrack.id);
          mediaStreamTrack.stop();
        }

        // 关闭轨道
        this.rtc.localVideoTrack.close();
        this.rtc.localVideoTrack = null;

        // 通知UI更新状态
        const localVideoInfo: VideoWindowProps = {
          id: 'local', // 🔧 修改：使用与群通话一致的ID
          isLocalVideo: true,
          muted: this.isMuted(),
          cameraEnabled: false,
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
          stream: undefined, // 摄像头关闭时不提供流
        };

        this.onRemoteVideoReady?.(localVideoInfo);
        logDebug('Preview mode: camera disabled');
        return false;
      } catch (error) {
        logError('close camera failed:', error);
        return false;
      }
    }
  }

  // 🔧 新增：扬声器状态管理
  private speakerEnabled: boolean = true; // 内部扬声器状态

  // 切换扬声器状态
  toggleSpeaker(): boolean {
    // 没加入之前可以关闭扬声器
    // if (
    //   this.callStatus < CALL_STATUS.CONFIRM_RING ||
    //   this.callStatus === CALL_STATUS.RECEIVED_CONFIRM_RING
    // ) {
    //   logWarn('not joined the call yet');
    //   return false;
    // }

    // 切换内部扬声器状态
    this.speakerEnabled = !this.speakerEnabled;
    const newSpeakerEnabled = this.speakerEnabled;

    // 控制所有远程音频轨道的音量
    this.remoteAudioTracks.forEach((audioTrack, userId) => {
      if (audioTrack && audioTrack.setVolume) {
        const volume = newSpeakerEnabled ? 100 : 0;
        audioTrack.setVolume(volume);
        logDebug(`User ${userId} audio track volume set to:`, volume);
      }
    });

    // 注意：不应该控制本地音频轨道的音量，因为这会静音自己的声音
    // 扬声器控制只影响远程音频轨道的播放音量

    logDebug('Speaker status:', newSpeakerEnabled ? 'enabled' : 'disabled');

    return newSpeakerEnabled;
  }

  // 🔧 新增：获取当前扬声器状态
  isSpeakerEnabled(): boolean {
    return this.speakerEnabled;
  }

  // 🔧 新增：设置扬声器音量
  setSpeakerVolume(volume: number): void {
    if (volume < 0 || volume > 100) {
      logWarn('Volume value must be between 0-100');
      return;
    }

    logDebug('Set speaker volume to:', volume);

    // 设置所有远程音频轨道的音量
    this.remoteAudioTracks.forEach((audioTrack, userId) => {
      if (audioTrack && audioTrack.setVolume) {
        audioTrack.setVolume(volume);
        logDebug(`User ${userId} audio track volume set to:`, volume);
      }
    });

    // 注意：不应该控制本地音频轨道的音量，因为这会静音自己的声音
    // 扬声器控制只影响远程音频轨道的播放音量
  }

  // 获取当前静音状态
  isMuted(): boolean {
    return this.rtc.localAudioTrack ? !this.rtc.localAudioTrack.enabled : !this.enableMic;
  }

  // 获取当前摄像头状态
  isCameraEnabled(): boolean {
    return this.rtc.localVideoTrack ? this.rtc.localVideoTrack.enabled : false;
  }

  // 切换摄像头设备
  async flipCamera(deviceId: string): Promise<boolean> {
    if (!deviceId) {
      logWarn('flipCamera: deviceId is required');
      return false;
    }

    if (!this.rtc.localVideoTrack) {
      logWarn('flipCamera: no local video track available');
      return false;
    }

    if (!this.rtc.localVideoTrack.enabled) {
      logWarn('flipCamera: camera is not enabled');
      return false;
    }

    try {
      logDebug('flipCamera: switching camera to device:', deviceId.slice(0, 8));

      // 使用声网 SDK 的 setDevice 方法切换摄像头
      // 该方法支持在发布后调用
      await this.rtc.localVideoTrack.setDevice(deviceId);

      logDebug('flipCamera: camera switched successfully');

      // 🔧 修复：保存当前使用的设备ID，以便重新打开摄像头时使用
      this.currentCameraDeviceId = deviceId;

      // 🔧 修复：切换摄像头后，清除缓存的视频流，强制下次获取时创建新流
      this.localVideoStream = null;

      // 🔧 修复：重新通知 UI 更新本地视频信息，确保 stream 是新的
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: this.isMuted(),
        cameraEnabled: true,
        nickname: this.userInfos[this.userId]?.nickname || 'Me',
        avatar: this.userInfos[this.userId]?.avatarUrl || undefined,
        stream: this.getOrCreateLocalVideoStream(),
      };
      this.onRemoteVideoReady?.(localVideoInfo);

      logDebug('flipCamera: notified UI with new video stream');

      return true;
    } catch (error) {
      logError('flipCamera: failed to switch camera:', error);
      this.onCallError?.({
        errorType: CallErrorType.RTC,
        ...(error as IAgoraRTCError),
      });
      return false;
    }
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
        nickname: this.userInfos[this.userId]?.nickname || 'Me',
        avatar: this.userInfos[this.userId]?.avatarUrl,
        // 🔧 修复：使用现有的流，避免重新创建
        stream: this.localVideoStream || undefined,
      };

      this.onRemoteVideoReady?.(localVideoInfo);

      if (this.isCameraEnabled()) {
        this.playLocalVideo();
      }
    }
  }

  // 手动播放本地视频（供外部调用）
  playLocalVideoManually() {
    this.playLocalVideo();
  }

  // 为1v1视频通话创建预览状态的本地视频轨道
  async createLocalVideoTrackFor1v1Preview(): Promise<boolean> {
    if (!this.currentCallInfo || this.currentCallInfo.type !== CALL_TYPE.VIDEO_1V1) {
      logDebug('createLocalVideoTrackFor1v1Preview: not a 1v1 video call');
      return false;
    }

    // 🔧 标记用户已经进入了preview阶段
    this.hasEnteredPreview = true;
    logDebug('1v1 video call: start creating preview mode local video track');
    try {
      const localVideoTrack = await AgoraRTC.createCameraVideoTrack(
        this.encoderConfig ? { encoderConfig: this.encoderConfig } : undefined,
      );
      this.rtc.localVideoTrack = localVideoTrack;
      logDebug('1v1 video call: preview video track created successfully');

      // 创建本地视频信息供预览模式使用
      const localVideoInfo: VideoWindowProps = {
        id: 'local',
        isLocalVideo: true,
        muted: false,
        cameraEnabled: true,
        nickname: this.userInfos[this.userId]?.nickname || 'Me',
        avatar: this.userInfos[this.userId]?.avatarUrl,
        stream: this.getOrCreateLocalVideoStream(),
      };

      // 通知UI显示预览模式的本地视频
      this.onRemoteVideoReady?.(localVideoInfo);

      // 延迟播放本地视频，确保UI渲染完成
      setTimeout(() => {
        this.playLocalVideo();
      }, 800); // 增加延迟确保UI完全渲染完成

      return true;
    } catch (error) {
      logError('createLocalVideoTrackFor1v1Preview failed:', error);
      return false;
    }
  }

  // 为群组视频通话准备本地视频状态（供UI显示使用）
  async createLocalVideoTrackForGroupCall(): Promise<boolean> {
    // 🔧 修复：只处理群组视频通话，不处理1v1视频通话
    if (
      !this.currentCallInfo ||
      this.currentCallInfo.type === CALL_TYPE.AUDIO_1V1 ||
      this.currentCallInfo.type === CALL_TYPE.AUDIO_MULTI ||
      this.currentCallInfo.type === CALL_TYPE.VIDEO_1V1 // 🔧 新增：排除1v1视频通话
    ) {
      logDebug('createLocalVideoTrackForGroupCall: skip non-group video call', {
        callType: this.currentCallInfo?.type,
        reason: '此方法仅用于群组视频通话',
      });
      return false;
    }

    // 🔧 重要改动：群组通话默认不创建视频轨道，避免触发摄像头
    // 只有用户主动点击开启摄像头时才会在toggleCamera中创建轨道
    logDebug('Group call: prepare local video status (do not create actual track)');

    // 创建本地视频信息供UI显示（摄像头关闭状态）
    const localVideoInfo: VideoWindowProps = {
      id: 'local',
      isLocalVideo: true,
      muted: false,
      cameraEnabled: false, // 🔧 默认摄像头关闭，不创建轨道
      nickname: this.userInfos[this.userId]?.nickname || '我',
      avatar: this.userInfos[this.userId]?.avatarUrl,
      stream: undefined,
    };

    // 通知UI显示本地视频（关闭状态）
    this.onRemoteVideoReady?.(localVideoInfo);

    logDebug('Group call: local video status set to disabled, waiting for user to manually enable');
    return true;
  }

  // 处理从最小化恢复时重新播放本地视频
  onRestoreFromMinimized() {
    logDebug('Restore from minimized, check if need to replay local video');

    // 如果正在通话中且有本地视频轨道且摄像头开启，重新播放视频
    if (
      this.callStatus === CALL_STATUS.IN_CALL &&
      this.rtc.localVideoTrack &&
      this.rtc.localVideoTrack.enabled
    ) {
      logDebug('Detected local video track enabled, delay replay video');

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
      logDebug('Local video track does not exist or is not enabled');
      return;
    }

    // 使用较长的延迟确保DOM更新完成
    setTimeout(() => {
      let played = false;

      // 🔧 优化选择器顺序，优先匹配本地视频元素
      const selectors = [
        // 优先尝试精确匹配本地视频
        '[data-video-id="local"] video', // 群通话本地视频容器中的video元素
        'video[data-video-id="local"]', // 直接匹配本地video元素
        'video[data-local="true"]', // 标记为本地的video元素
        '[data-video-id="local"]', // 本地视频容器
        // 其他可能的选择器
        '.cui-callkit-window-local video',
        '.cui-callkit-pip-video video',
        '.cui-callkit-main-video video',
        '.cui-callkit-video video',
        '#local-player',
        // 最后尝试找到任何video元素
        'video',
      ];

      // 先打印所有存在的video元素，用于调试
      const allVideos = document.querySelectorAll('video');
      logDebug('All video elements on page:', allVideos);

      for (const selector of selectors) {
        const videoElement = document.querySelector(selector) as HTMLVideoElement;
        logDebug(`Try selector ${selector}:`, videoElement);

        if (videoElement) {
          try {
            logDebug(`Try to play local video to: ${selector}`, videoElement);
            this.rtc.localVideoTrack.play(videoElement);
            played = true;
            logDebug('Local video playback successful');
            break;
          } catch (error) {
            logWarn(`Failed to play to ${selector}:`, error);
          }
        }
      }

      // 如果所有元素都没找到，不再尝试字符串ID播放
      if (!played) {
        logError('cannot find video element to play local video');
      }
    }, 200); // 增加延迟时间到200ms
  }

  // 获取或创建本地视频流（避免重复创建导致视频闪烁）
  private getOrCreateLocalVideoStream(): MediaStream | undefined {
    if (!this.rtc.localVideoTrack) {
      logDebug('getOrCreateLocalVideoStream: no local video track');
      return undefined;
    }

    // 如果已有缓存的流，检查轨道是否仍然有效
    if (this.localVideoStream) {
      const tracks = this.localVideoStream.getVideoTracks();
      if (tracks.length > 0 && tracks[0] === this.rtc.localVideoTrack.getMediaStreamTrack()) {
        // 轨道仍然有效，复用现有流
        logDebug('getOrCreateLocalVideoStream: reuse existing video stream');
        return this.localVideoStream;
      } else {
        // 轨道已变化，清除旧流
        logDebug('getOrCreateLocalVideoStream: track changed, clear old stream');
        this.localVideoStream = null;
      }
    }

    // 创建新的流并缓存
    logDebug('getOrCreateLocalVideoStream: create new video stream');
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
      logDebug(`New user ${uid} camera status unknown, default to enabled in video call`);
      return true;
    }

    return false;
  }

  // 获取远程用户的视频流
  // 🔧 改进：从远程视频轨道中获取 MediaStream，使用缓存避免重复创建
  private getRemoteVideoStream(uid: string): MediaStream | undefined {
    // 🔧 首先检查缓存
    if (this.remoteVideoStreams.has(uid)) {
      const cachedStream = this.remoteVideoStreams.get(uid);
      logDebug(`Use cached video stream: ${uid}`, {
        streamId: cachedStream?.id,
      });
      return cachedStream;
    }

    const videoTrack = this.remoteVideoTracks.get(uid);
    logDebug('Get remote user video stream:', uid, videoTrack);
    if (videoTrack) {
      // 尝试方法1：getMediaStream
      if (videoTrack.getMediaStream && typeof videoTrack.getMediaStream === 'function') {
        try {
          const mediaStream = videoTrack.getMediaStream();
          // 🔧 缓存获取到的流
          this.remoteVideoStreams.set(uid, mediaStream);
          logDebug(`Method 1 success: get MediaStream from track: ${uid}`, {
            streamId: mediaStream?.id,
          });
          return mediaStream;
        } catch (error) {
          logWarn(`Method 1 failed: get MediaStream from track: ${uid}`, error);
        }
      }

      // 尝试方法2：直接访问 mediaStream 属性
      if (videoTrack.mediaStream) {
        // 🔧 缓存获取到的流
        this.remoteVideoStreams.set(uid, videoTrack.mediaStream);
        logDebug(`Method 2 success: get from track mediaStream property: ${uid}`, {
          hasMediaStream: !!videoTrack.mediaStream,
          streamId: videoTrack.mediaStream?.id,
        });
        return videoTrack.mediaStream;
      }

      // 尝试方法3：从轨道创建 MediaStream
      if (videoTrack.getTrackId) {
        try {
          // 创建一个新的 MediaStream，包含视频轨道
          const mediaStream = new MediaStream([videoTrack]);
          // 🔧 缓存新创建的流
          this.remoteVideoStreams.set(uid, mediaStream);
          logDebug(`Method 3 success: create new MediaStream: ${uid}`, {
            hasMediaStream: !!mediaStream,
            trackId: videoTrack.getTrackId?.(),
            streamId: mediaStream.id,
          });
          return mediaStream;
        } catch (error) {
          logWarn(`Method 3 failed: create MediaStream: ${uid}`, error);
        }
      }

      // 尝试方法4：检查是否有 _mediaStream 属性
      if (videoTrack._mediaStream) {
        // 🔧 缓存获取到的流
        this.remoteVideoStreams.set(uid, videoTrack._mediaStream);
        logDebug(`Method 4 success: get from track _mediaStream property: ${uid}`, {
          hasMediaStream: !!videoTrack._mediaStream,
          streamId: videoTrack._mediaStream?.id,
        });
        return videoTrack._mediaStream;
      }

      // 尝试方法5：检查是否有 stream 属性
      if (videoTrack.stream) {
        // 🔧 缓存获取到的流
        this.remoteVideoStreams.set(uid, videoTrack.stream);
        logDebug(`Method 5 success: get from track stream property: ${uid}`, {
          hasMediaStream: !!videoTrack.stream,
          streamId: videoTrack.stream?.id,
        });
        return videoTrack.stream;
      }

      // 尝试方法6：使用 Agora 的 getMediaStreamTrack 方法
      if (videoTrack.getMediaStreamTrack && typeof videoTrack.getMediaStreamTrack === 'function') {
        try {
          const mediaStreamTrack = videoTrack.getMediaStreamTrack();
          const mediaStream = new MediaStream([mediaStreamTrack]);
          // 🔧 缓存新创建的流
          this.remoteVideoStreams.set(uid, mediaStream);
          logDebug(`Method 6 success: create MediaStream from getMediaStreamTrack: ${uid}`, {
            hasMediaStream: !!mediaStream,
            trackId: videoTrack.getTrackId?.(),
            streamId: mediaStream.id,
          });
          return mediaStream;
        } catch (error) {
          logWarn(`Method 6 failed: create MediaStream from getMediaStreamTrack: ${uid}`, error);
        }
      }
    }

    // 回退到旧的方式（从 joinedMembers 中查找）
    const member = this.joinedMembers.find(member => member.uid === uid);
    if (member && member.stream) {
      // 🔧 缓存获取到的流
      this.remoteVideoStreams.set(uid, member.stream);
      logDebug(`Fallback method success: get from joinedMembers: ${uid}`, {
        streamId: member.stream?.id,
      });
      return member.stream;
    }

    logDebug(`All methods failed: video stream not found for user ${uid}`, {
      hasVideoTrack: !!this.remoteVideoTracks.get(uid),
      joinedMembersCount: this.joinedMembers.length,
    });

    return undefined;
  }

  // 添加参与者到当前通话
  async addParticipants(newMembers: string[]) {
    if (!this.currentCallInfo) {
      logError('cannot add participants: no ongoing call');
      return false;
    }

    // if (this.callStatus !== CALL_STATUS.IN_CALL) {
    //   logError('无法添加参与者：当前不在通话中');
    //   return false;
    // }

    // 只能在多人通话中添加参与者
    if (
      this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI &&
      this.currentCallInfo.type !== CALL_TYPE.AUDIO_MULTI
    ) {
      logError('cannot add participants: not a multi-party call');
      return false;
    }

    if (newMembers.length === 0) {
      logWarn('no new members to add');
      return false;
    }

    try {
      // 更新邀请成员列表, 去重
      this.invitedMembers = [...new Set([...this.invitedMembers, ...newMembers])];

      // 更新通话信息
      if (this.currentCallInfo.invitedMembers) {
        this.currentCallInfo.invitedMembers = [
          ...new Set([...this.currentCallInfo.invitedMembers, ...newMembers]),
        ];
      } else {
        this.currentCallInfo.invitedMembers = newMembers;
      }

      // 向新成员发送邀请消息
      await this.sendInvitationMessage(newMembers, this.currentCallInfo);

      logDebug('Successfully sent invitation to new members:', {
        newMembers,
        currentCallInfo: this.currentCallInfo,
        totalInvitedMembers: this.invitedMembers.length,
      });

      return true;
    } catch (error) {
      logError('add participants failed:', error);
      return false;
    }
  }

  // 群通话 被邀请人超时了， 发送取消
  async cancelInvitation(userId: string) {
    if (!this.currentCallInfo) {
      logError('cannot cancel invitation: no ongoing call');
      return false;
    }

    if (this.callStatus !== CALL_STATUS.IN_CALL) {
      logError('cannot cancel invitation: not in call');
      return false;
    }

    // 只能在多人通话中取消邀请
    if (
      this.currentCallInfo.type !== CALL_TYPE.VIDEO_MULTI &&
      this.currentCallInfo.type !== CALL_TYPE.AUDIO_MULTI
    ) {
      logError('cannot cancel invitation: not a multi-party call');
      return false;
    }

    try {
      // 从邀请成员列表中移除
      this.invitedMembers = this.invitedMembers.filter(member => member !== userId);

      // 🔧 新增：通知CallKit立即移除被取消的用户
      this.onInvitedUserRemoved?.(userId, 'cancelled');

      // 更新通话信息
      if (this.currentCallInfo.invitedMembers) {
        this.currentCallInfo.invitedMembers = this.currentCallInfo.invitedMembers.filter(
          member => member !== userId,
        );
      }

      // 发送取消邀请消息
      logDebug('---->sendCancelMessage1');
      await this.sendCancelMessage(this.currentCallInfo.groupId || '', 'groupChat', [userId]);

      return true;
    } catch (error) {
      logError('cancel invitation failed:', error);
      return false;
    }
  }

  // 取消群组通话，给每个人都发送 cancel 消息
  async cancelGroupCall() {
    if (!this.currentCallInfo) {
      logError('cannot cancel group call: no ongoing call');
      return false;
    }

    // 🔧 调试：打印已加入的人和已邀请的人
    logDebug('cancelGroupCall debug info:', {
      已加入成员: this.joinedMembers.map(member => ({
        uid: member.uid,
        userId: this.UIdToUserIdMap.get(member.uid),
        nickname: member.nickname || '未知',
        videoEnabled: member.videoEnabled,
        audioEnabled: member.audioEnabled,
      })),
      已邀请成员: this.currentCallInfo.invitedMembers,
      当前通话信息: {
        callId: this.currentCallInfo.callId,
        type: this.currentCallInfo.type,
        groupId: this.currentCallInfo.groupId,
      },
    });

    // 🔧 优化：只向未加入的成员发送取消消息
    const joinedUserIds = this.joinedMembers.map(member => this.UIdToUserIdMap.get(member.uid));

    logDebug('Joined user ID list:', joinedUserIds);

    const membersToCancel =
      this.currentCallInfo.invitedMembers?.filter(member => !joinedUserIds.includes(member)) || [];

    logDebug('Members to send cancel message to:', membersToCancel);

    // 获取所有成员
    const members = this.currentCallInfo.invitedMembers;
    if (membersToCancel.length > 0) {
      logDebug('---->sendCancelMessage2');
      await this.sendCancelMessage(
        this.currentCallInfo.groupId || '',
        'groupChat',
        membersToCancel,
      );
    }

    return true;
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

      logDebug(`Play remote video track (attempt ${attempt}/${maxAttempts}):`, {
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
          logDebug(
            `Attempt ${attempt} failed: video element not found for user ${userId}, retry in ${delay}ms...`,
          );
          setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), delay);
          return;
        } else {
          logWarn(
            `❌ Retry ${maxAttempts} times but still cannot find video element for user ${userId}`,
          );
          // 🔧 改进：将轨道存储到等待队列中，等待UI通知
          const videoId = `remote-${userId}`;
          this.pendingVideoTracks.set(videoId, remoteVideoTrack);
          logDebug(`Store track to waiting queue: ${videoId}`);
          return;
        }
      }

      // 检查是否已经播放过这个轨道
      const trackId = remoteVideoTrack?.getTrackId?.();
      if (targetElement.dataset.playedTrackId === trackId) {
        logDebug(`Video element already playing track ${trackId}, skip`);
        return;
      }

      // 播放视频轨道到目标元素
      if (remoteVideoTrack && typeof remoteVideoTrack.play === 'function') {
        try {
          logDebug(`Start playing user ${userId} video track to element:`, targetElement);
          const playResult = remoteVideoTrack.play(targetElement);

          // 标记元素已被使用
          targetElement.dataset.playedTrackId = trackId;
          targetElement.dataset.userId = userId;

          if (playResult && typeof playResult.then === 'function') {
            playResult
              .then(() => {
                logDebug(`Successfully played user ${userId} video track`);
              })
              .catch((error: any) => {
                logWarn(`❌ 播放用户 ${userId} 的视频轨道失败:`, error);
                // 清除失败的标记
                targetElement.dataset.playedTrackId = '';

                // 如果播放失败且还有重试机会，重试播放
                if (attempt < maxAttempts) {
                  logDebug(`Playback failed, retry in 2 seconds...`);
                  setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), 2000);
                }
              });
          } else {
            logDebug(`User ${userId} video track playback completed (sync mode)`);
          }
        } catch (error) {
          logError(`❌ Error playing video track for user ${userId}:`, error);
          targetElement.dataset.playedTrackId = '';

          // 如果播放失败且还有重试机会，重试播放
          if (attempt < maxAttempts) {
            logDebug(`Playback exception, retry in 2 seconds...`);
            setTimeout(() => tryPlayVideo(attempt + 1, maxAttempts), 2000);
          }
        }
      } else {
        logWarn(`❌ Video track for user ${userId} is not available`);
      }
    };

    // 开始重试播放
    tryPlayVideo();
  }

  // 🔧 新增：获取指定用户的视频轨道
  getRemoteVideoTrack(userId: string): any {
    // 首先尝试直接用 userId 查找（可能是 uid）
    let track = this.remoteVideoTracks.get(userId);
    if (track) {
      return track;
    }

    // 如果直接查找失败，通过 UIdToUserIdMap 反向查找对应的 uid
    for (const [uid, mappedUserId] of this.UIdToUserIdMap.entries()) {
      if (mappedUserId === userId) {
        track = this.remoteVideoTracks.get(uid);
        if (track) {
          logDebug(`Found user ${userId} video track through mapping, uid: ${uid}`);
          return track;
        }
      }
    }

    logDebug(`Video track not found for user ${userId}`, {
      直接查找: this.remoteVideoTracks.has(userId),
      UIdToUserIdMap: Array.from(this.UIdToUserIdMap.entries()),
      所有远程轨道: Array.from(this.remoteVideoTracks.entries()),
    });
    return null;
  }

  // 🔧 新增：获取指定用户的音频轨道
  getRemoteAudioTrack(userId: string): any {
    // 首先尝试直接用 userId 查找（可能是 uid）
    let track = this.remoteAudioTracks.get(userId);
    if (track) {
      return track;
    }

    // 如果直接查找失败，通过 UIdToUserIdMap 反向查找对应的 uid
    for (const [uid, mappedUserId] of this.UIdToUserIdMap.entries()) {
      if (mappedUserId === userId) {
        track = this.remoteAudioTracks.get(uid);
        if (track) {
          logDebug(`Found user ${userId} audio track through mapping, uid: ${uid}`);
          return track;
        }
      }
    }

    return null;
  }

  // 🔧 新增：获取所有远程视频轨道信息（用于调试）
  getAllRemoteVideoTracks(): Map<string, any> {
    return new Map(this.remoteVideoTracks);
  }

  // 清理预览模式的状态和资源
  async cleanupPreviewMode() {
    logDebug('Clean up preview mode');

    // 🔧 修复：完整清理预览模式下的所有轨道
    if (
      this.client &&
      (this.callStatus === CALL_STATUS.ALERTING || this.callStatus === CALL_STATUS.IN_CALL)
    ) {
      try {
        // 收集需要取消发布的轨道
        const tracksToUnpublish = [];
        if (this.rtc.localAudioTrack) {
          tracksToUnpublish.push(this.rtc.localAudioTrack);
        }
        if (this.rtc.localVideoTrack) {
          tracksToUnpublish.push(this.rtc.localVideoTrack);
        }

        // 取消发布所有本地轨道
        if (tracksToUnpublish.length > 0) {
          logDebug(
            'Clean up preview mode: unpublishing local tracks...',
            tracksToUnpublish.map(t => t.trackMediaType),
          );
          await this.client.unpublish(tracksToUnpublish);
          logDebug('Clean up preview mode: local tracks unpublished');
        }

        // 尝试离开频道
        try {
          await this.client.leave();
          logDebug('Clean up preview mode: left RTC channel');
        } catch (error) {
          logDebug('Clean up preview mode: failed to leave channel (may not have joined):', error);
        }
      } catch (error) {
        logError('clean up preview mode: failed to unpublish tracks:', error);
      }
    }

    // 🔧 安全清理：确保轨道在关闭前被取消发布（不受callStatus限制）
    if (this.client && (this.rtc.localAudioTrack || this.rtc.localVideoTrack)) {
      try {
        const tracksToSafeUnpublish = [];
        if (this.rtc.localAudioTrack) {
          tracksToSafeUnpublish.push(this.rtc.localAudioTrack);
        }
        if (this.rtc.localVideoTrack) {
          tracksToSafeUnpublish.push(this.rtc.localVideoTrack);
        }

        if (tracksToSafeUnpublish.length > 0) {
          logDebug(
            '🔧 Safe cleanup preview mode: unpublishing local tracks',
            tracksToSafeUnpublish.map(t => t.trackMediaType),
          );
          await this.client.unpublish(tracksToSafeUnpublish);
        }
      } catch (error) {
        logWarn('❌ Safe cleanup preview mode: failed to unpublish tracks (ignore):', error);
        // 忽略错误，继续关闭轨道
      }
    }

    // 关闭音视频轨道
    if (this.rtc.localAudioTrack) {
      logDebug('Clean up preview mode: close local audio track');

      // 🔧 修复：彻底停止音频轨道和相关MediaStreamTrack，释放麦克风资源
      try {
        // 获取并停止底层MediaStreamTrack，确保麦克风资源被释放
        const mediaStreamTrack = this.rtc.localAudioTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          logDebug(
            '🔧 Stop audio MediaStreamTrack in preview mode:',
            mediaStreamTrack.id,
            '状态:',
            mediaStreamTrack.readyState,
          );
          if (mediaStreamTrack.readyState === 'live') {
            mediaStreamTrack.stop();
            logDebug('Preview mode: microphone MediaStreamTrack stopped');
          }
        }

        // 关闭Agora轨道
        this.rtc.localAudioTrack.close();
        this.rtc.localAudioTrack = null;

        logDebug('Preview mode: local audio track completely closed and reference cleared');
      } catch (error) {
        logError('❌ Error closing audio track in preview mode:', error);
        // 即使出错也要清空引用
        this.rtc.localAudioTrack = null;
      }
    }
    if (this.rtc.localVideoTrack) {
      logDebug('Clean up preview mode: close local video track');

      // 🔧 彻底停止视频轨道和相关MediaStream
      try {
        // 获取轨道的MediaStream
        const mediaStreamTrack = this.rtc.localVideoTrack.getMediaStreamTrack?.();
        if (mediaStreamTrack) {
          logDebug('Stop underlying MediaStreamTrack in preview mode:', mediaStreamTrack.id);
          mediaStreamTrack.stop();
        }

        // 关闭Agora轨道
        this.rtc.localVideoTrack.close();
        this.rtc.localVideoTrack = null;

        logDebug('Preview mode: local video track completely closed');
      } catch (error) {
        logError('❌ Error closing video track in preview mode:', error);
        // 即使出错也要清空引用
        this.rtc.localVideoTrack = null;
      }
    }

    // 清理本地视频流缓存
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => {
        logDebug('Stop track in cached stream in preview mode:', track.id);
        track.stop();
      });
      this.localVideoStream = null;
    }

    // 🔧 重置扬声器状态为默认开启
    this.speakerEnabled = true;

    // 🔧 修复：只在实际有预览状态时才通知UI清理
    // 避免在不应该有预览的情况下发送错误的local-preview信息
    if (this.callStatus === CALL_STATUS.ALERTING || this.callStatus === CALL_STATUS.IN_CALL) {
      // 通知UI清理本地视频显示
      // 根据通话类型使用不同的ID
      const videoId =
        this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI ? 'local' : 'local-preview';
      this.onRemoteVideoReady?.({
        id: videoId,
        isLocalVideo: true,
        muted: false,
        cameraEnabled: false,
        nickname: this.userInfos[this.userId]?.nickname || 'Me',
        avatar: this.userInfos[this.userId]?.avatarUrl,
        stream: undefined,
      });
      logDebug('cleanupPreviewMode: notify UI to clean up local video display');
    } else {
      logDebug('cleanupPreviewMode: skip UI cleanup, current status not needed:', this.callStatus);
    }
  }

  // 获取缓存的群组信息
  getCachedGroupInfo(groupId: string): { groupName?: string; groupAvatar?: string } | null {
    return this.cachedGroupInfos[groupId] || null;
  }

  // 设置群组信息缓存
  setCachedGroupInfo(groupId: string, groupInfo: { groupName?: string; groupAvatar?: string }) {
    this.cachedGroupInfos[groupId] = groupInfo;
    logDebug('Manually set group info cache:', { groupId, groupInfo });
  }

  // 🔧 检查并清理所有可能遗漏的MediaStreamTrack
  private async checkAndCleanupAllMediaTracks(checkPermissions: boolean = true) {
    try {
      logDebug('Execute global media track check...');

      // 检查是否还有活跃的video元素
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, index) => {
        if (video.srcObject) {
          const mediaStream = video.srcObject as MediaStream;
          if (mediaStream && mediaStream.getTracks) {
            const tracks = mediaStream.getTracks();
            if (tracks.length > 0) {
              logDebug(
                `Found active track in video element ${index}, cleaning up:`,
                tracks.map(t => ({ id: t.id, kind: t.kind, readyState: t.readyState })),
              );
              tracks.forEach(track => {
                if (track.readyState === 'live') {
                  logDebug(`Stop active track: ${track.id} (${track.kind})`);
                  track.stop();
                }
              });
              video.srcObject = null;
            }
          }
        }
      });

      // 🔧 新增：检查并清理audio元素中的轨道
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio, index) => {
        if (audio.srcObject) {
          const mediaStream = audio.srcObject as MediaStream;
          if (mediaStream && mediaStream.getTracks) {
            const tracks = mediaStream.getTracks();
            if (tracks.length > 0) {
              logDebug(
                `Found active track in audio element ${index}, cleaning up:`,
                tracks.map(t => ({ id: t.id, kind: t.kind, readyState: t.readyState })),
              );
              tracks.forEach(track => {
                if (track.readyState === 'live') {
                  logDebug(`Stop active audio track: ${track.id} (${track.kind})`);
                  track.stop();
                }
              });
              audio.srcObject = null;
            }
          }
        }
      });

      // 🔧 移除权限检查部分，避免不必要的麦克风权限请求
      if (checkPermissions) {
        logDebug('Permission check disabled, only clean up existing media tracks');
      }

      logDebug('Global media track check completed');
    } catch (error) {
      logError('Global media track check failed:', error);
    }
  }

  // 销毁服务
  destroy(isInitializing: boolean = false) {
    // 🔧 修复：组件初始化时不调用hangup，避免触发麦克风权限请求
    if (!isInitializing) {
      // this.hangup(HANGUP_REASON.HANGUP);
    } else {
      // 🔧 初始化时的清理：只做必要的清理，不调用hangup
      logDebug('Component initialization cleanup, skip hangup call');

      // 清理事件处理器
      this.connection?.removeEventHandler?.('callkit');

      // 清理本地视频流缓存
      this.localVideoStream = null;

      // 清理群组信息缓存
      this.cachedGroupInfos = {};

      // 清理远程轨道映射
      this.remoteVideoTracks.clear();
      this.remoteAudioTracks.clear();

      // 清理UID映射
      this.UIdToUserIdMap.clear();

      // 清理等待播放的轨道
      this.pendingVideoTracks.clear();

      // 重置状态
      this.callStatus = CALL_STATUS.IDLE;
      this.currentCallInfo = null;
      this.callDuration = '00:00';
      this.joinedMembers = [];
      this.invitedMembers = [];

      this.enableMic = true;
      this.speakerEnabled = true;
      // 清理RTC引用
      if (this.rtc.localAudioTrack) {
        try {
          this.rtc.localAudioTrack.stop();
        } catch (error) {
          logWarn('clean up local audio track failed:', error);
        }
        this.rtc.localAudioTrack = null;
      }

      if (this.rtc.localVideoTrack) {
        try {
          this.rtc.localVideoTrack.stop();
        } catch (error) {
          logWarn('clean up local video track failed:', error);
        }
        this.rtc.localVideoTrack = null;
      }

      // 清理远程轨道引用
      this.rtc.remoteAudioTrack = null;
      this.rtc.remoteVideoTrack = null;
      this.rtc.remoteUser = null;

      return; // 🔧 初始化时直接返回，不执行后续的hangup逻辑
    }

    this.connection?.removeEventHandler?.('callkit');

    // 最后的媒体轨道清理（不检查权限，避免初始化时请求麦克风权限）
    this.checkAndCleanupAllMediaTracks(false);

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
    logDebug(`Received video element ready notification: ${videoId}`);

    // 检查是否有等待播放的视频轨道
    const pendingTrack = this.pendingVideoTracks.get(videoId);
    if (pendingTrack) {
      logDebug(`Found pending video track, start playing: ${videoId}`);
      this.pendingVideoTracks.delete(videoId);
      this.playRemoteVideoToExistingElements(pendingTrack, videoId.replace('remote-', ''));
    }
  }

  // 🔧 新增：等待视频元素准备好
  private waitForVideoElement(videoId: string, track: any, maxWaitTime: number = 10000) {
    logDebug(`Waiting for video element to be ready: ${videoId}`);

    const startTime = Date.now();
    const checkElement = () => {
      const targetSelector = `[data-video-id="${videoId}"] video, [data-video-id="${videoId}"].cui-callkit-video`;
      const targetElement = document.querySelector(targetSelector) as HTMLVideoElement;

      if (targetElement) {
        logDebug(`Video element is ready: ${videoId}`);
        this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
        return;
      }

      // 检查是否超时
      if (Date.now() - startTime > maxWaitTime) {
        logWarn(`⏰ Wait for video element timeout: ${videoId}`);
        // 回退到原来的重试机制
        this.playRemoteVideoToExistingElements(track, videoId.replace('remote-', ''));
        return;
      }

      // 继续等待
      setTimeout(checkElement, 100);
    };

    checkElement();
  }

  // 初始化铃声
  private initRingtone() {
    if (!this.enableRingtone) {
      logDebug('Ringtone feature not enabled');
      return;
    }

    // 初始化拨打电话铃声
    if (this.outgoingRingtoneSrc) {
      try {
        this.outgoingRingtoneAudio = new Audio(this.outgoingRingtoneSrc);
        this.outgoingRingtoneAudio.volume = this.ringtoneVolume;
        this.outgoingRingtoneAudio.loop = this.ringtoneLoop;
        this.outgoingRingtoneAudio.preload = 'auto';
        logDebug('Outgoing call ringtone initialized successfully:', this.outgoingRingtoneSrc);
      } catch (error) {
        logError('Initialize outgoing call ringtone failed:', error);
        this.outgoingRingtoneAudio = null;
      }
    }

    // 初始化接听电话铃声
    if (this.incomingRingtoneSrc) {
      try {
        this.incomingRingtoneAudio = new Audio(this.incomingRingtoneSrc);
        this.incomingRingtoneAudio.volume = this.ringtoneVolume;
        this.incomingRingtoneAudio.loop = this.ringtoneLoop;
        this.incomingRingtoneAudio.preload = 'auto';
        logDebug('Incoming call ringtone initialized successfully:', this.incomingRingtoneSrc);
      } catch (error) {
        logError('Initialize incoming call ringtone failed:', error);
        this.incomingRingtoneAudio = null;
      }
    }
  }

  // 播放铃声
  private async playRingtone(type: 'outgoing' | 'incoming') {
    if (!this.enableRingtone || this.isRingtonePlaying) {
      return;
    }

    const audioElement =
      type === 'outgoing' ? this.outgoingRingtoneAudio : this.incomingRingtoneAudio;

    if (!audioElement) {
      logDebug(
        `${type === 'outgoing' ? 'Outgoing call' : 'Incoming call'} ringtone not configured`,
      );
      return;
    }

    const audioElements = document.getElementsByTagName('audio');
    Array.from(audioElements).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0; // 重置进度
      }
    });

    try {
      this.isRingtonePlaying = true;
      this.currentRingtoneType = type;
      this.onRingtoneStart?.(type);
      audioElement.currentTime = 0; // 从头开始播放
      await audioElement.play();
    } catch (error) {
      this.isRingtonePlaying = false;
      this.currentRingtoneType = null;
    }
  }

  // 停止铃声
  private stopRingtone() {
    if (!this.isRingtonePlaying || !this.currentRingtoneType) {
      return;
    }

    try {
      const audioElement =
        this.currentRingtoneType === 'outgoing'
          ? this.outgoingRingtoneAudio
          : this.incomingRingtoneAudio;

      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      const lastType = this.currentRingtoneType;
      this.isRingtonePlaying = false;
      this.currentRingtoneType = null;
      if (lastType) {
        this.onRingtoneEnd?.(lastType);
      }
    } catch (error) {
      logError('Stop ringtone failed:', error);
    }
  }

  // 设置铃声配置
  setRingtoneConfig(config: {
    outgoingRingtoneSrc?: string;
    incomingRingtoneSrc?: string;
    enableRingtone?: boolean;
    ringtoneVolume?: number;
    ringtoneLoop?: boolean;
  }) {
    if (config.outgoingRingtoneSrc !== undefined) {
      this.outgoingRingtoneSrc = config.outgoingRingtoneSrc;
    }
    if (config.incomingRingtoneSrc !== undefined) {
      this.incomingRingtoneSrc = config.incomingRingtoneSrc;
    }
    if (config.enableRingtone !== undefined) {
      this.enableRingtone = config.enableRingtone;
    }
    if (config.ringtoneVolume !== undefined) {
      this.ringtoneVolume = Math.max(0, Math.min(1, config.ringtoneVolume));
    }
    if (config.ringtoneLoop !== undefined) {
      this.ringtoneLoop = config.ringtoneLoop;
    }

    // 重新初始化铃声
    this.stopRingtone();

    // 清理旧的音频对象
    if (this.outgoingRingtoneAudio) {
      this.outgoingRingtoneAudio = null;
    }
    if (this.incomingRingtoneAudio) {
      this.incomingRingtoneAudio = null;
    }

    this.initRingtone();
  }
}
