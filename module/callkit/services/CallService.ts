import AgoraRTC, {
  IAgoraRTCError,
  IAgoraRTCRemoteUser,
  VideoEncoderConfigurationPreset,
} from 'agora-rtc-sdk-ng';
import type { CallKitRTCProvider, RTCTokenInfo, VideoWindowProps } from '../types/index';
import CallError from './CallError';
import { CallTimerService } from './CallTimerService';
import type { ChatSDK } from 'module/SDK';
import { CallErrorType, CallErrorCode } from './CallError';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';
import CallAudioService from '../audio/CallAudioService';
import { reaction } from 'mobx';
import type CallStore from '../store/CallStore';
import CallSignalingService from '../signaling/CallSignalingService';
import type {
  CallHandledOnOtherDevicePayload,
  CallInvitationReceivedPayload,
  CallParticipantsChangedPayload,
  CallEndedPayload,
  CallSnapshot,
  CallParticipant,
  CallType,
} from 'easemob-websdk';
import CallRtcService from '../rtc/CallRtcService';
import CallMediaService from '../rtc/CallMediaService';
import { diffParticipants, isTerminalParticipant } from '../signaling/participantDiff';
import i18n from 'i18next';
import {
  buildCallRecordExt,
  callTypeToRecordMediaType,
  formatCallRecordFinalText,
  resolveCallRecordContent,
  resolveCallRecordDurationMs,
  saveCallRecordPatch,
  toCallRecordEndReason,
  type CallRecordPatch,
} from '../../utils/callRecord';

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
  duration?: string; // Call duration, default 0
  state?: CALL_STATUS; // Call status, default idle
  callType?: CallType;
  mediaType?: 'voice' | 'video';
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
  TIMEOUT = 'timeout', // Server timeout
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
  rtcProvider?: CallKitRTCProvider;
  callSignaling: CallSignalingService;
  callStore?: CallStore;
  invitationTimeoutSeconds?: number;
  /** 通话记录发送成功后插入本地消息列表。失败不回调。 */
  onCallRecordMessage?: (message: ChatSDK.Message) => void;
  /** 只更新本地通话记录，不修改服务端消息。 */
  onCallRecordPatch?: (callId: string, patch: CallRecordPatch, content?: string) => void;
}

export class CallService {
  private client: any;
  private rtc: any;
  private appId: string;
  private agoraUid: string;
  private userId: string;
  private connection: any;
  private accessToken?: string | null;
  private rtcTokenChannelName: string = '';
  private joiningCall?: Promise<void>;
  private endingCall?: Promise<void>;
  private currentCallInfo: CallInfo | null = null;
  private callStatus: CALL_STATUS = CALL_STATUS.IDLE;
  private callTimer = new CallTimerService();
  private timer: any = null;
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

  // Ringtone manager
  private audioService: CallAudioService;

  // Track references being created, for handling race conditions
  private creatingVideoTrack: Promise<any> | null = null;
  private encoderConfig?: VideoEncoderConfigurationPreset;
  private creatingAudioTrack: Promise<any> | null = null;

  private enableMic: boolean = true;

  // RTC Token configuration
  private useRTCToken: boolean = true; // Default to true, use token validation
  private rtcProvider?: CallKitRTCProvider;
  private callSignaling: CallSignalingService;
  private callStore?: CallStore;
  private disposeCallStoreReactions?: () => void;
  private nativeEndRequested = false;
  private invitationTimeoutSeconds = 30;
  private outgoingTimeoutCheck?: ReturnType<typeof setTimeout>;
  private onCallRecordMessage?: (message: ChatSDK.Message) => void;
  private onCallRecordPatch?: (callId: string, patch: CallRecordPatch, content?: string) => void;
  private recordDurationTimer?: ReturnType<typeof setInterval>;
  private recordConnectedAtMs?: number;
  private recordContent = '';
  private recordMediaType: 0 | 1 | 2 = 0;
  private rtcService: CallRtcService;
  private mediaService: CallMediaService;
  private signalingParticipants: CallParticipant[] = [];

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
    // Initialize ringtone manager
    this.audioService = new CallAudioService({
      outgoingRingtoneSrc: config.outgoingRingtoneSrc,
      incomingRingtoneSrc: config.incomingRingtoneSrc,
      enableRingtone: config.enableRingtone ?? true,
      ringtoneVolume: config.ringtoneVolume ?? 0.8,
      ringtoneLoop: config.ringtoneLoop ?? true,
      onStart: config.onRingtoneStart,
      onEnd: config.onRingtoneEnd,
    });
    // Initialize RTC token configuration
    this.useRTCToken = config.useRTCToken ?? true;
    this.rtcProvider = config.rtcProvider;
    this.callSignaling = config.callSignaling;
    this.callStore = config.callStore;
    this.invitationTimeoutSeconds = config.invitationTimeoutSeconds ?? 30;
    this.onCallRecordMessage = config.onCallRecordMessage;
    this.onCallRecordPatch = config.onCallRecordPatch;

    // Get necessary information from WebIM connection
    this.agoraUid = '';
    this.appId = '';
    this.userId = this.getCurrentUserId();

    // Initialize Agora RTC client
    AgoraRTC.setLogLevel(4);
    this.rtcService = new CallRtcService({ onCreated: config.onRtcEngineCreated });
    this.client = this.rtcService.client;
    this.mediaService = new CallMediaService({ encoderConfig: this.encoderConfig });

    this.rtc = {
      client: this.client,
      localAudioTrack: null,
      localVideoTrack: null,
      remoteVideoTrack: null,
      remoteAudioTrack: null,
      remoteUser: null,
      timer: null,
    };

    this.installNativeCallSignaling();
    // Provider 会提前监听以接收登录阶段的离线邀请；CallService 同时持有独立监听，
    // 确保组件挂载后不依赖 Provider effect 的生命周期转发事件。
    this.callSignaling.start();
    logger.log('[call-debug] CallService signaling ready', {
      userId: this.userId,
      hasCallStore: Boolean(this.callStore),
      callStatus: this.callStatus,
    });
  }

  private installNativeCallSignaling(): void {
    if (!this.callStore) return;
    const handleInvitation = (payload: CallInvitationReceivedPayload | null): void => {
      logger.log('[call-debug] CallService store invitation reaction', {
        callId: payload?.callId,
        callStatus: this.callStatus,
        currentCallId: this.currentCallInfo?.callId,
      });
      if (payload) void this.handleNativeInvitation(payload);
    };
    const handleParticipants = (snapshot: CallSnapshot | null): void => {
      if (snapshot && snapshot.callId === this.currentCallInfo?.callId) {
        this.handleNativeParticipants(snapshot);
      }
    };
    const handleEnded = (ended: CallEndedPayload | null): void => {
      if (ended && ended.callId === this.currentCallInfo?.callId) {
        this.nativeEndRequested = true;
        void this.hangup(ended.reason);
      }
    };
    const handleOtherDevice = (payload: CallHandledOnOtherDevicePayload | null): void => {
      if (payload && payload.callId === this.currentCallInfo?.callId) {
        this.nativeEndRequested = true;
        void this.hangup(HANGUP_REASON.HANDLE_ON_OTHER_DEVICE);
      }
    };
    this.disposeCallStoreReactions = reaction(
      () => this.callStore?.invitation ?? null,
      handleInvitation,
      { fireImmediately: true },
    );
    const disposeParticipants = reaction(
      () => this.callStore?.snapshot ?? null,
      handleParticipants,
    );
    const disposeEnded = reaction(() => this.callStore?.ended ?? null, handleEnded);
    const disposeOtherDevice = reaction(
      () => this.callStore?.handledOnOtherDevice ?? null,
      handleOtherDevice,
    );
    const previousDispose = this.disposeCallStoreReactions;
    this.disposeCallStoreReactions = () => {
      previousDispose?.();
      disposeParticipants();
      disposeEnded();
      disposeOtherDevice();
    };
  }

  private clearOutgoingTimeoutCheck(): void {
    if (this.outgoingTimeoutCheck) clearTimeout(this.outgoingTimeoutCheck);
    this.outgoingTimeoutCheck = undefined;
  }

  private scheduleOutgoingTimeoutCheck(callId: string, delayMs: number): void {
    this.clearOutgoingTimeoutCheck();
    this.outgoingTimeoutCheck = setTimeout(async () => {
      this.outgoingTimeoutCheck = undefined;
      if (this.currentCallInfo?.callId !== callId || this.callStatus !== CALL_STATUS.INVITING)
        return;
      try {
        const snapshot = await this.callSignaling.syncCall(callId);
        if (this.currentCallInfo?.callId !== callId || this.callStatus !== CALL_STATUS.INVITING)
          return;
        logger.log('[call-debug] outgoing timeout snapshot', {
          callId,
          lifecycle: snapshot.lifecycle,
          endReason: snapshot.endReason,
        });
        if (snapshot.lifecycle === 'ended') {
          this.nativeEndRequested = true;
          await this.hangup(snapshot.endReason || HANGUP_REASON.TIMEOUT);
          return;
        }
        if (
          snapshot.participants.some(
            member => member.userId !== this.getCurrentUserId() && member.state === 'accepted',
          )
        ) {
          return;
        }
      } catch (error) {
        logWarn('Failed to check outgoing call timeout; will retry', error);
      }
      if (this.currentCallInfo?.callId === callId && this.callStatus === CALL_STATUS.INVITING) {
        this.scheduleOutgoingTimeoutCheck(callId, 5000);
      }
    }, delayMs);
  }

  private async handleNativeInvitation(payload: CallInvitationReceivedPayload): Promise<void> {
    logger.log('[call-debug] CallService handle invitation enter', {
      callId: payload.callId,
      callStatus: this.callStatus,
      currentCallId: this.currentCallInfo?.callId,
      callType: payload.callType,
      mediaType: payload.mediaType,
    });
    if (this.endingCall) {
      // A conference can invite the same user again while the previous local call is
      // still cleaning up. Let that cleanup finish before claiming the new invitation.
      await this.endingCall.catch(error => {
        logWarn('Previous call cleanup failed before handling invitation', error);
      });
      if (this.callStore && this.callStore.invitation !== payload) {
        // The previous call cleanup clears the store. Restore the latest invitation
        // so its reaction handles it after the old call has become idle.
        if (this.callStore.invitation) return;
        this.callStore.setInvitation(payload);
        return;
      }
    }
    if (payload.callId === this.currentCallInfo?.callId) {
      logger.log('[call-debug] CallService invitation ignored as duplicate', {
        callId: payload.callId,
      });
      return;
    }
    if (this.callStatus !== CALL_STATUS.IDLE) {
      logger.log('[call-debug] CallService invitation rejected as busy', {
        callId: payload.callId,
        callStatus: this.callStatus,
        currentCallId: this.currentCallInfo?.callId,
      });
      try {
        await this.callSignaling.rejectCall(payload.callId, 'busy');
      } catch (error) {
        logWarn('Failed to reject native call while busy', error);
      }
      return;
    }
    const type =
      payload.mediaType === 'video'
        ? payload.callType === 'conference'
          ? CALL_TYPE.VIDEO_MULTI
          : CALL_TYPE.VIDEO_1V1
        : payload.callType === 'conference'
        ? CALL_TYPE.AUDIO_MULTI
        : CALL_TYPE.AUDIO_1V1;
    this.currentCallInfo = {
      callId: payload.callId,
      channel: payload.callId,
      type,
      callType: payload.callType,
      mediaType: payload.mediaType,
      callerDevId: '',
      callerUserId: payload.inviter.userId,
      calleeUserId: this.getCurrentUserId(),
      groupId: payload.conversationId,
      invitedMembers: [],
      joinedMembers: [],
    };
    this.callStatus = CALL_STATUS.ALERTING;
    this.setUserInfo({
      [payload.inviter.userId]: {
        nickname: payload.inviter.nickname,
        avatarUrl: payload.inviter.avatarUrl,
      },
    });
    this.onReceivedCall?.(this.convertCallTypeToString(type), payload.inviter.userId, payload.ext);
    this.onInvitationReceived?.({
      id: payload.callId,
      callId: payload.callId,
      from: payload.inviter.userId,
      type: this.convertCallTypeToString(type),
      channel: payload.callId,
      callerUserId: payload.inviter.userId,
      callerName: payload.inviter.nickname || payload.inviter.userId,
      callerAvatar: payload.inviter.avatarUrl,
      groupId: payload.conversationId,
      timestamp: Date.now(),
    });
    logger.log('[call-debug] CallService invitation callback dispatched', {
      callId: payload.callId,
      callStatus: this.callStatus,
      hasCallback: Boolean(this.onInvitationReceived),
    });
    await this.callSignaling.reportRinging(payload.callId);
    logger.log('[call-debug] CallService ringing reported', {
      callId: payload.callId,
    });
    this.audioService.play('incoming');
  }

  private handleNativeParticipants(snapshot: CallSnapshot): void {
    const self = snapshot.participants.find(item => item.userId === this.getCurrentUserId());
    if (self && !['pending', 'ringing', 'accepted'].includes(self.state) && this.currentCallInfo) {
      logger.log('[call-debug] CallService local participant finished', {
        callId: snapshot.callId,
        participantState: self.state,
      });
      this.nativeEndRequested = true;
      void this.hangup(self.state === 'timeout' ? HANGUP_REASON.TIMEOUT : self.state);
      return;
    }
    const changes = diffParticipants(this.signalingParticipants, snapshot.participants);
    this.signalingParticipants = [...snapshot.participants];
    const accepted = snapshot.participants.filter(item => item.state === 'accepted');
    changes.waiting.forEach(item => this.emitWaitingParticipant(item));
    changes.accepted.forEach(item => this.emitAcceptedParticipant(item));
    changes.terminal.forEach(item => this.emitTerminalParticipant(item));
    changes.removed.forEach(item => this.emitRemovedParticipant(item));

    const previousJoinedByUserId = new Map(
      this.joinedMembers.map(member => [member.userId || String(member.uid), member]),
    );
    this.joinedMembers = accepted.map(
      item => previousJoinedByUserId.get(item.userId) ?? { userId: item.userId, uid: item.userId },
    );
    this.invitedMembers = snapshot.participants
      .filter(item => item.state === 'pending' || item.state === 'ringing')
      .map(item => item.userId);
    if (this.currentCallInfo) {
      this.currentCallInfo.invitedMembers = [...this.invitedMembers];
      this.currentCallInfo.joinedMembers = [...this.joinedMembers];
    }
    // 主叫等待对端接听后入会。被叫只能由 answerCall 在用户接听后入会，
    // reportRinging 的快照中主叫已是 accepted，不能据此替被叫自动接听。
    if (
      snapshot.lifecycle === 'open' &&
      !this.nativeEndRequested &&
      this.currentCallInfo?.callType === 'single' &&
      this.currentCallInfo.callerUserId === this.getCurrentUserId() &&
      this.callStatus === CALL_STATUS.INVITING &&
      accepted.some(item => item.userId !== this.getCurrentUserId())
    ) {
      this.audioService.stop();
      void this.joinCall();
    }
  }

  private emitWaitingParticipant(participant: CallParticipant): void {
    if (participant.userId === this.getCurrentUserId()) return;
    this.onRemoteVideoReady?.(this.createParticipantVideo(participant.userId, { isWaiting: true }));
  }

  private emitAcceptedParticipant(participant: CallParticipant): void {
    if (participant.userId === this.getCurrentUserId()) return;
    this.onRemoteUserJoined?.(
      participant.userId,
      this.convertCallTypeToString(this.currentCallInfo!.type),
    );
    const currentRemote = this.client?.remoteUsers?.find(
      (user: IAgoraRTCRemoteUser) => this.toUidKey(user.uid) === participant.userId,
    );
    const currentTrack = this.remoteVideoTracks.get(participant.userId);
    const stream =
      currentRemote?.hasVideo && currentRemote.videoTrack === currentTrack
        ? this.getRemoteVideoStream(participant.userId)
        : undefined;
    this.onRemoteVideoReady?.({
      ...this.createParticipantVideo(participant.userId, { isWaiting: false }),
      muted: !this.remoteAudioTracks.has(participant.userId),
      cameraEnabled: Boolean(stream),
      stream,
    });
    if (this.currentCallInfo?.type === CALL_TYPE.VIDEO_MULTI) {
      this.recoverAcceptedParticipantVideo(participant.userId, this.currentCallInfo.callId);
    }
  }

  private recoverAcceptedParticipantVideo(userId: string, callId: string): void {
    // A participant can be accepted before Agora reports a new publication. In
    // particular, the same UID can leave and rejoin while the caller stays in
    // the channel. Check the remote user list after the normal event has had a
    // chance to arrive, so a missed publication cannot leave an avatar forever.
    let recovered = false;
    let subscribing = false;
    for (const delay of [1500, 4000, 8000]) {
      setTimeout(async () => {
        if (
          recovered ||
          subscribing ||
          this.currentCallInfo?.callId !== callId ||
          this.callStatus !== CALL_STATUS.IN_CALL
        ) {
          return;
        }
        const remoteUser = this.client?.remoteUsers?.find(
          (user: IAgoraRTCRemoteUser) => this.toUidKey(user.uid) === userId,
        );
        const existingTrack = this.remoteVideoTracks.get(userId);
        const mediaTrack = existingTrack?.getMediaStreamTrack?.();
        if (
          remoteUser?.hasVideo &&
          existingTrack &&
          remoteUser.videoTrack === existingTrack &&
          mediaTrack?.readyState !== 'ended'
        ) {
          const stream = this.getRemoteVideoStream(userId);
          if (stream) {
            recovered = true;
            this.onRemoteVideoReady?.({
              ...this.createParticipantVideo(userId, { isWaiting: false }),
              muted: !this.remoteAudioTracks.has(userId),
              cameraEnabled: true,
              stream,
            });
            return;
          }
        }
        if (!remoteUser?.hasVideo) return;
        try {
          subscribing = true;
          await this.rtcService.subscribe(remoteUser, 'video');
          const videoTrack = remoteUser.videoTrack;
          if (!videoTrack || this.currentCallInfo?.callId !== callId) return;
          this.remoteVideoStreams.delete(userId);
          this.remoteVideoTracks.set(userId, videoTrack);
          const stream = this.getRemoteVideoStream(userId);
          if (stream) recovered = true;
          this.onRemoteVideoReady?.({
            ...this.createParticipantVideo(userId, { isWaiting: false }),
            muted: !this.remoteAudioTracks.has(userId),
            cameraEnabled: true,
            stream,
          });
          if (!stream) this.playRemoteVideoToExistingElements(videoTrack, userId);
        } catch (error) {
          logWarn(`Failed to recover remote video for ${userId}`, error);
        } finally {
          subscribing = false;
        }
      }, delay);
    }
  }

  private emitTerminalParticipant(participant: CallParticipant): void {
    if (participant.userId === this.getCurrentUserId()) return;
    this.remoteVideoTracks.delete(participant.userId);
    this.remoteVideoStreams.delete(participant.userId);
    this.pendingVideoTracks.delete(`remote-${participant.userId}`);
    if (participant.state === 'left' || participant.state === 'hanguped') {
      this.onRemoteUserLeft?.(
        participant.userId,
        this.convertCallTypeToString(this.currentCallInfo!.type),
      );
    } else {
      const reason =
        participant.state === 'rejected' || participant.state === 'busy'
          ? 'refused'
          : participant.state === 'canceled'
          ? 'cancelled'
          : 'timeout';
      this.onInvitedUserRemoved?.(participant.userId, reason);
    }
    this.onRemoteVideoReady?.(this.createParticipantVideo(participant.userId, { removed: true }));
  }

  private emitRemovedParticipant(participant: CallParticipant): void {
    if (participant.userId === this.getCurrentUserId() || isTerminalParticipant(participant))
      return;
    if (participant.state === 'accepted') {
      this.onRemoteUserLeft?.(
        participant.userId,
        this.convertCallTypeToString(this.currentCallInfo!.type),
      );
    } else {
      this.onInvitedUserRemoved?.(participant.userId, 'cancelled');
    }
    this.onRemoteVideoReady?.(this.createParticipantVideo(participant.userId, { removed: true }));
  }

  private createParticipantVideo(
    userId: string,
    state: Pick<VideoWindowProps, 'isWaiting' | 'removed'>,
  ): VideoWindowProps {
    return {
      id: `remote-${userId}`,
      isLocalVideo: false,
      muted: Boolean(state.removed),
      cameraEnabled: false,
      nickname: this.userInfos[userId]?.nickname || userId,
      avatar: this.userInfos[userId]?.avatarUrl,
      ...state,
    };
  }

  private toUidKey(uid: string | number): string {
    return String(uid);
  }

  private getCurrentUserId(): string {
    return this.connection.getCurrentUserId?.() || this.connection.user || '';
  }

  private getClientResource(): string {
    return this.connection.getClientResource?.() || 'web';
  }

  async getAccessToken(
    channelName: string = this.currentCallInfo?.channel || '*',
  ): Promise<string | null> {
    this.appId = '';
    this.agoraUid = '';
    this.rtcTokenChannelName = '';

    try {
      let tokenInfo: RTCTokenInfo | null | undefined;
      let source: 'provider' | 'IM SDK';

      if (this.rtcProvider?.getRTCTokenInfo) {
        source = 'provider';
        logDebug('Getting RTC token info from provider', { channelName });
        tokenInfo = await this.rtcProvider.getRTCTokenInfo({
          channelName,
          userId: this.getCurrentUserId(),
        });
      } else if (typeof this.connection?.getRTCTokenInfo === 'function') {
        source = 'IM SDK';
        logDebug('Getting RTC token info from IM SDK', { channelName });
        tokenInfo = await this.connection.getRTCTokenInfo({ channelName });
      } else {
        logWarn(
          'Unable to get RTC token info: neither rtcProvider.getRTCTokenInfo nor the IM SDK method is available',
          { channelName },
        );
        return null;
      }

      if (!tokenInfo || typeof tokenInfo !== 'object') {
        logWarn(`${source} getRTCTokenInfo returned no data`, { channelName, result: tokenInfo });
        return null;
      }

      const uid = this.getCurrentUserId();
      if (!tokenInfo.appId || !uid) {
        logWarn(`${source} getRTCTokenInfo returned invalid appId or current IM userId`, {
          channelName,
          tokenInfo,
        });
        return null;
      }

      if (this.useRTCToken && !tokenInfo.rtcToken) {
        logWarn(
          `${source} getRTCTokenInfo returned no rtcToken while token validation is enabled`,
          {
            channelName,
            tokenInfo,
          },
        );
        return null;
      }

      this.appId = tokenInfo.appId;
      this.agoraUid = uid;
      this.rtcTokenChannelName = channelName;
      logDebug(`Got valid RTC token info from ${source}`, {
        channelName,
        rtcUid: uid,
        hasToken: Boolean(tokenInfo.rtcToken),
      });
      return tokenInfo.rtcToken || null;
    } catch (error: any) {
      logWarn('Failed to get RTC token info', { channelName, error });
      this.onCallError?.({
        errorType: CallErrorType.CHAT,
        code: error.type,
        message: error.message,
      });
      return null;
    }
  }

  private hasValidRTCJoinInfo(channelName: string = this.currentCallInfo?.channel || ''): boolean {
    return (
      Boolean(this.appId) &&
      Boolean(this.agoraUid) &&
      this.agoraUid === this.getCurrentUserId() &&
      (!this.useRTCToken || (Boolean(this.accessToken) && this.rtcTokenChannelName === channelName))
    );
  }

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

  getCachedUserInfo(userId: string) {
    return this.userInfos[userId];
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
    msg?: string;
    callId?: string;
    channel?: string;
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
    if (this.endingCall) await this.endingCall;
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
    const isConference = callType === CALL_TYPE.VIDEO_MULTI || callType === CALL_TYPE.AUDIO_MULTI;
    const requestedCallId = callId || `legacy-call-${Date.now()}`;
    const requestedChannel = channel || requestedCallId;
    const nativeCallType = isConference ? 'conference' : 'single';
    const mediaType =
      callType === CALL_TYPE.VIDEO_1V1 || callType === CALL_TYPE.VIDEO_MULTI ? 'video' : 'voice';
    const nativeSnapshot = await this.callSignaling.createCall({
      callType: nativeCallType,
      mediaType,
      targetUserIds: Array.isArray(to) ? to : [to],
      timeoutSeconds: this.invitationTimeoutSeconds,
      pushContent: options.msg,
      conversationId: groupId,
      ext: options.ext ? JSON.stringify(options.ext) : undefined,
    });
    const resolvedCallId = nativeSnapshot.callId;
    // Create call information
    this.currentCallInfo = {
      callId: resolvedCallId,
      channel: nativeSnapshot.callId,
      type: callType,
      callerDevId: this.getClientResource() || 'web',
      calleeDevId: '',
      callerUserId: this.getCurrentUserId(),
      calleeUserId: callType === CALL_TYPE.VIDEO_MULTI ? groupId : (to as string),
      groupId,
      groupName,
      groupAvatar,
      invitedMembers: members,
      joinedMembers: [],
      callType: nativeCallType,
      mediaType,
    };

    // Update status
    this.callStatus = CALL_STATUS.INVITING;
    this.invitedMembers = members;
    this.recordMediaType = callTypeToRecordMediaType(callType);
    this.recordContent = resolveCallRecordContent(options.msg, this.recordMediaType);
    void this.sendCallRecordMessages(this.recordTargets(options.groupId, to));
    if (!isConference) {
      this.scheduleOutgoingTimeoutCheck(
        resolvedCallId,
        this.invitationTimeoutSeconds * 1000 + 1000,
      );
    }

    // Play outgoing call ringtone (when initiating call)
    this.audioService.play('outgoing');

    // If 1v1 video call, create local video track for preview (caller)
    // Group video call initiator does not need preview mode, go directly to group video layout
    if (callType === CALL_TYPE.VIDEO_1V1) {
      // Mark user has entered preview stage (caller)
      this.hasEnteredPreview = true;
      try {
        // Record track Promise being created for race condition handling
        this.creatingVideoTrack = this.mediaService.createVideoTrack();
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
        logWarn('Local camera unavailable, continue the video call with camera disabled:', error);
        this.creatingVideoTrack = null; // Clear creating reference

        // Ensure cleanup of potentially acquired resources even if creation fails
        if (error && typeof error === 'object' && 'track' in error) {
          try {
            (error as any).track.close();
          } catch (cleanupError) {
            logError('Failed to cleanup leaked track:', cleanupError);
          }
        }

        // 没有摄像头或摄像头不可用时仍允许发起视频呼叫，后续入会只发布音频轨道。
        // 同步通知 UI，避免预览窗口继续显示为“摄像头已开启”。
        this.onRemoteVideoReady?.({
          id: 'local',
          isLocalVideo: true,
          muted: false,
          cameraEnabled: false,
          nickname: this.userInfos[this.userId]?.nickname || 'Me',
          avatar: this.userInfos[this.userId]?.avatarUrl,
          stream: undefined,
        });
      }
    } else if (callType === CALL_TYPE.VIDEO_MULTI) {
      // Group video call: caller handles audio and video tracks
      try {
        // Create audio track (if not already created)
        if (!this.rtc.localAudioTrack) {
          const localAudioTrack = await this.mediaService.createAudioTrack();
          this.rtc.localAudioTrack = localAudioTrack;
        }
        await this.createLocalVideoTrackForGroupCall();

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

    this.callStore?.setSnapshot(nativeSnapshot);
    if (nativeCallType === 'conference') {
      await this.joinCall();
    }
    return nativeSnapshot;
  }

  async answerCall(result: boolean) {
    logger.log('[call-debug] CallService answer requested', {
      accept: result,
      callId: this.currentCallInfo?.callId,
      callStatus: this.callStatus,
      isAnswering: this.isAnswering,
      nativeEndRequested: this.nativeEndRequested,
      endingCall: Boolean(this.endingCall),
    });
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
      this.audioService.stop();

      const callId = this.currentCallInfo.callId;
      if (result) {
        // 接听邀请统一用 acceptCall；joinCall 用于主动加入已有的多人通话。
        await this.callSignaling.acceptCall(callId);
        this.callStatus = CALL_STATUS.ANSWER_CALL;
        await this.joinCall();
      } else {
        let rejectError: unknown;
        try {
          await this.callSignaling.rejectCall(callId, 'declined');
          this.nativeEndRequested = true;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.toLowerCase().includes('call invalid state')) {
            logWarn('Call was already ended while rejecting; continue local cleanup', {
              callId,
              message,
            });
          } else {
            rejectError = error;
          }
        }

        try {
          await this.cleanupPreviewMode();
        } finally {
          await this.hangup(HANGUP_REASON.REFUSE);
        }

        if (rejectError) {
          throw rejectError;
        }
      }
    } catch (error) {
      logError('answerCall failed:', error);
      logger.warn('[call-debug] CallService answer failed state', {
        accept: result,
        callId: this.currentCallInfo?.callId,
        callStatus: this.callStatus,
        nativeEndRequested: this.nativeEndRequested,
        code: (error as { code?: number })?.code,
        details: (error as { details?: unknown })?.details,
      });
      if (result && this.currentCallInfo) {
        try {
          const snapshot = await this.callSignaling.syncCall(this.currentCallInfo.callId);
          const participant = snapshot.participants.find(
            item => item.userId === this.getCurrentUserId(),
          );
          logger.warn('[call-debug] answer failed server snapshot', {
            callId: snapshot.callId,
            callType: snapshot.callType,
            mediaType: snapshot.mediaType,
            lifecycle: snapshot.lifecycle,
            endReason: snapshot.endReason,
            participantState: participant?.state,
            participantDevice: participant?.deviceUuid,
            participant,
          });
        } catch (syncError) {
          logWarn('Failed to query call state after answer failure', syncError);
        }
      }
      throw error;
    } finally {
      // The operation has completed; a new invitation may already be answerable.
      this.isAnswering = false;
    }
  }

  async joinCall() {
    if (this.joiningCall) return this.joiningCall;
    const request = this.performJoinCall();
    this.joiningCall = request;
    try {
      await request;
    } finally {
      if (this.joiningCall === request) this.joiningCall = undefined;
    }
  }

  private async performJoinCall() {
    if (!this.currentCallInfo) {
      logError('No current call info');
      return;
    }

    if (this.callStatus === CALL_STATUS.IN_CALL) {
      return;
    }

    if (!this.hasValidRTCJoinInfo(this.currentCallInfo.channel)) {
      // RTC 入会信息不完整时重新获取
      this.accessToken = await this.getAccessToken(this.currentCallInfo.channel);
    }

    if (!this.hasValidRTCJoinInfo(this.currentCallInfo.channel)) {
      logError('Cannot join channel because valid RTC token info is unavailable', {
        channel: this.currentCallInfo.channel,
      });
      this.onCallError?.({
        errorType: CallErrorType.CALLKIT,
        code: CallErrorCode.CALL_PARAM_ERROR,
        message: 'Valid RTC token info is unavailable',
      });
      this.hangup(HANGUP_REASON.ABNORMAL_END);
      return;
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

    // A previous call may have ended while Agora was reconnecting. Leave its
    // channel before publishing tracks for this new call.
    if (
      this.client &&
      (this.client.connectionState !== 'DISCONNECTED' || this.client.localTracks?.length)
    ) {
      try {
        await this.rtcService.leave();
      } catch (error) {
        logError('Failed to leave previous RTC channel before joining:', error);
        this.onCallError?.({ errorType: CallErrorType.RTC, ...(error as IAgoraRTCError) });
        void this.hangup(HANGUP_REASON.ABNORMAL_END);
        return;
      }
    }

    // 🔧 检查客户端连接状态 - 修复：同时检查CONNECTING和CONNECTED状态
    const isClientConnectedOrConnecting =
      this.client &&
      (this.client.connectionState === 'CONNECTED' || this.client.connectionState === 'CONNECTING');

    let uid;

    // 只有在未连接且未连接中时才执行join操作
    if (!isClientConnectedOrConnecting) {
      try {
        try {
          uid = await this.rtcService.join({
            appId: this.appId,
            channel: this.currentCallInfo.channel,
            token: tokenToUse ?? null,
            uid: this.agoraUid,
          });
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
        localAudioTrack = await this.mediaService.createAudioTrack();
        this.rtc.localAudioTrack = localAudioTrack;
      } catch (error) {
        logError('Failed to create local audio track:', error);
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
        await this.rtcService.publish(config);
      } catch (error) {
        this.onCallError?.({
          errorType: CallErrorType.RTC,
          ...(error as IAgoraRTCError),
        });
        logError('Failed to publish audio:', error);
        this.hangup(HANGUP_REASON.ABNORMAL_END);
        return;
      }
    } else {
      // 视频通话

      if (this.currentCallInfo.type === CALL_TYPE.VIDEO_MULTI) {
        if (!this.rtc.localVideoTrack) await this.createLocalVideoTrackForGroupCall();
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
          await this.rtcService.publish(config); // 发布音频轨道和可能的视频轨道
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          logError('Failed to publish tracks for group call:', error);
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
              localVideoTrack = await this.mediaService.createVideoTrack();
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
          await this.rtcService.publish(config);
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
    this.recordConnectedAtMs = Date.now();
    this.startRecordDurationUpdates();
    this.callTimer.start(this.onCallDurationUpdate);

    // 确保通话开始时扬声器状态为开启
    this.audioService.resetSpeaker();

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
                  await this.rtcService.subscribe(remoteUser, 'audio');
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
                this.audioService.addRemoteTrack(String(remoteUser.uid), remoteUser.audioTrack);
                // 播放音频
                remoteUser.audioTrack.play();
              }

              // 订阅视频流
              if (remoteUser.hasVideo && remoteUser.videoTrack) {
                try {
                  await this.rtcService.subscribe(remoteUser, 'video');
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
      };

      // 延迟执行，确保 Agora SDK 有足够时间同步远程用户信息
      // setTimeout(checkAndSubscribeRemoteUsers, 1000);
    }

    // 入会和发布成功即通知 UI，不等待其他成员或远程流。
    this.onCallStart?.(videos);
    logDebug('Successfully joined call:', uid);
  }

  private stopRecordDurationUpdates() {
    if (this.recordDurationTimer) {
      clearInterval(this.recordDurationTimer);
      this.recordDurationTimer = undefined;
    }
  }

  private startRecordDurationUpdates() {
    this.stopRecordDurationUpdates();
    this.recordDurationTimer = setInterval(() => {
      if (!this.currentCallInfo || this.callStatus !== CALL_STATUS.IN_CALL) return;
      const durationMs = this.recordConnectedAtMs ? Date.now() - this.recordConnectedAtMs : 0;
      this.publishCallRecordPatch(this.currentCallInfo.callId, {
        endReason: -1,
        durationMs,
        final: false,
      });
    }, 5000);
  }

  private publishCallRecordPatch(callId: string, patch: CallRecordPatch, content?: string) {
    saveCallRecordPatch(this.getCurrentUserId(), callId, patch);
    this.onCallRecordPatch?.(callId, patch, content);
  }

  private finalizeCallRecord(reason: string) {
    this.stopRecordDurationUpdates();
    const callInfo = this.currentCallInfo;
    if (!callInfo) return;
    const wasConnected = this.callStatus === CALL_STATUS.IN_CALL;
    const snapshot =
      this.callStore?.snapshot?.callId === callInfo.callId ? this.callStore.snapshot : undefined;
    const self = snapshot?.participants.find(item => item.userId === this.getCurrentUserId());
    const durationMs = resolveCallRecordDurationMs({
      wasConnected,
      connectedAtMs: this.recordConnectedAtMs,
      acceptedAt: self?.acceptedAt,
      leftAt: self?.leftAt,
      establishedAt: snapshot?.establishedAt,
      endedAt: snapshot?.endedAt,
    });
    const endReason = toCallRecordEndReason(reason, {
      wasConnected,
      isCaller: callInfo.callerUserId === this.getCurrentUserId(),
    });
    const patch = { endReason, durationMs, final: true as const };
    this.publishCallRecordPatch(
      callInfo.callId,
      patch,
      formatCallRecordFinalText(
        {
          ecukRecordEndReason: endReason,
          ecukRecordDurationMs: durationMs,
        },
        i18n.t.bind(i18n),
      ),
    );
    this.recordConnectedAtMs = undefined;
  }

  private recordTargets(groupId: string | undefined, to: string | string[]) {
    if (this.recordMediaType === 2 && groupId) {
      return [{ conversationId: groupId, conversationType: 'groupChat' as const }];
    }
    return (Array.isArray(to) ? to : [to])
      .filter(Boolean)
      .map(conversationId => ({ conversationId, conversationType: 'singleChat' as const }));
  }

  private async sendCallRecordMessages(
    targets: Array<{ conversationId: string; conversationType: 'singleChat' | 'groupChat' }>,
  ) {
    const callId = this.currentCallInfo?.callId;
    const chatManager = this.connection?.chatManager;
    if (
      !callId ||
      !targets.length ||
      !chatManager?.createTextMessage ||
      !chatManager?.sendMessage
    ) {
      logger.log('[call-record] skip invite text message', {
        callId,
        targetCount: targets.length,
        hasChatManager: Boolean(chatManager),
        hasCreateTextMessage: Boolean(chatManager?.createTextMessage),
        hasSendMessage: Boolean(chatManager?.sendMessage),
      });
      return;
    }
    logger.log('[call-record] sending invite text message after createCall', {
      callId,
      content: this.recordContent,
      targets,
    });
    const ext = buildCallRecordExt(callId, this.recordMediaType);
    for (const target of targets) {
      try {
        const message = chatManager.createTextMessage({
          conversationId: target.conversationId,
          conversationType: target.conversationType,
          content: this.recordContent,
          ext: { ...ext },
        });
        const sent = (await chatManager.sendMessage(message)) || message;
        if (!sent.direct) sent.direct = 'SEND';
        saveCallRecordPatch(this.getCurrentUserId(), callId, {
          endReason: -1,
          durationMs: 0,
          final: false,
        });
        this.onCallRecordMessage?.(sent);
        logger.log('[call-record] invite text message sent', {
          callId,
          conversationId: target.conversationId,
          conversationType: target.conversationType,
          content: this.recordContent,
          msgLocalId: sent.msgLocalId,
          msgServerId: sent.msgServerId,
        });
      } catch (error) {
        logger.log('[call-record] invite text message send failed', {
          callId,
          conversationId: target.conversationId,
          conversationType: target.conversationType,
          error,
        });
      }
    }
  }

  // 挂断通话
  async hangup(reason: string = HANGUP_REASON.HANGUP, isCancel: boolean = false) {
    this.clearOutgoingTimeoutCheck();
    if (this.endingCall) return this.endingCall;
    const recordReason = reason;
    const endReason =
      reason === HANGUP_REASON.NO_RESPONSE || reason === HANGUP_REASON.REMOTE_NO_RESPONSE
        ? HANGUP_REASON.TIMEOUT
        : reason;
    const request = this.performHangup(endReason, isCancel, recordReason);
    this.endingCall = request;
    try {
      await request;
    } finally {
      if (this.endingCall === request) this.endingCall = undefined;
    }
  }

  private async performHangup(reason: string, isCancel: boolean, recordReason = reason) {
    const endingCallId = this.currentCallInfo?.callId;
    this.finalizeCallRecord(recordReason);
    logDebug('hangup method called:', { reason, isCancel, callStatus: this.callStatus });

    const nativeCall = this.callSignaling && this.currentCallInfo;
    if (nativeCall && !this.nativeEndRequested) {
      this.nativeEndRequested = true;
      try {
        const callId = nativeCall.callId;
        const isUnansweredOutgoing =
          nativeCall.callType === 'single' &&
          nativeCall.callerUserId === this.getCurrentUserId() &&
          this.callStatus === CALL_STATUS.INVITING;
        const snapshot = this.callStore?.snapshot;
        const hasAcceptedInvitee = snapshot?.participants.some(
          participant =>
            participant.userId !== nativeCall.callerUserId &&
            (participant.state === 'accepted' ||
              participant.state === 'left' ||
              participant.state === 'hanguped' ||
              participant.acceptedAt !== undefined),
        );
        const isUnestablishedConference =
          nativeCall.callType === 'conference' &&
          nativeCall.callerUserId === this.getCurrentUserId() &&
          snapshot?.callId === callId &&
          !snapshot.establishedAt &&
          !hasAcceptedInvitee;
        if (reason === HANGUP_REASON.TIMEOUT) {
          // 超时由服务端结束；本地计时先到时仅查询快照，不发送取消、拒绝或结束请求。
          await this.callSignaling.syncCall(callId);
        } else if (
          isCancel ||
          isUnansweredOutgoing ||
          isUnestablishedConference ||
          reason === HANGUP_REASON.CANCEL ||
          reason === HANGUP_REASON.REMOTE_CANCEL
        ) {
          await this.callSignaling?.cancelCall(callId);
        } else if (this.callStatus === CALL_STATUS.ALERTING) {
          await this.callSignaling?.rejectCall(callId, 'declined');
        } else if (nativeCall.callType === 'conference') {
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            this.callSignaling.deferLeaveCall(callId);
          } else {
            await this.callSignaling?.leaveCall(callId);
          }
        } else {
          await this.callSignaling?.hangup(callId);
        }
      } catch (error) {
        this.nativeEndRequested = false;
        logWarn('Native call termination failed', error);
      }
    }

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
    this.audioService.stop();

    // 清理定时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callTimer.stop();

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
          await this.rtcService.unpublish(tracksToUnpublish);
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
            await this.rtcService.unpublish(tracksToSafeUnpublish);
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
      if (this.currentCallInfo && this.currentCallInfo.callId !== endingCallId) return;
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
    this.audioService.clearRemoteTracks();

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

    // Leave also while Agora is reconnecting so its published tracks do not
    // remain attached to this client when the next invitation is accepted.
    if (this.client) {
      try {
        await this.rtcService.leave();
      } catch (error) {
        logError('leave error:', error);
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
      this.currentCallInfo!.duration = this.callTimer.duration;
      try {
        this.onCallEnd?.(reason, this.currentCallInfo as CallInfo);
      } catch (error) {
        logError('onCallEnd error:', error);
      }
    }

    // 🔧 彻底重置所有状态
    this.callStatus = CALL_STATUS.IDLE;
    this.currentCallInfo = null;
    this.nativeEndRequested = false;
    this.callTimer.reset();
    this.joinedMembers = [];
    this.invitedMembers = [];
    // 清理本地视频流缓存
    this.localVideoStream = null;
    // 🔧 重置扬声器状态为默认开启
    this.audioService.resetSpeaker();
    // 🔧 重置preview状态标记
    this.hasEnteredPreview = false;
    // 🔧 重置正在创建的轨道引用
    this.creatingVideoTrack = null;
    this.creatingAudioTrack = null;

    this.enableMic = true;
    this.audioService.resetSpeaker();

    // 🔧 清理等待播放的视频轨道
    this.pendingVideoTracks.clear();
    this.callStore?.clear();
    this.signalingParticipants = [];
    logger.log('[call-debug] CallService local cleanup complete', {
      endingCallId,
      callStatus: this.callStatus,
      currentCallId: undefined,
      nativeEndRequested: this.nativeEndRequested,
    });

    // 🔧 强制等待确保所有异步清理完成
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private addAgoraRTCListeners() {
    // 监听用户加入
    this.client.on('user-joined', async (user: IAgoraRTCRemoteUser) => {
      logDebug('---->user-joined', user);
      this.updateJoinedMember(user, '', true);
      // 触发回调, 清楚邀请定时器

      // RTC UID 直接使用 IM userId
      const userId = this.toUidKey(user.uid);
      // 触发回调, 清楚邀请定时器
      this.onUserPublished?.(userId);
      this.onRemoteUserJoined?.(userId, 'group');

      const uidKey = this.toUidKey(user.uid);
      const hasAudioTrack = this.remoteAudioTracks.has(uidKey);
      const nickname = userId ? this.userInfos[userId]?.nickname : undefined;
      if (!nickname && userId && this.userInfoProvider) {
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
          await this.rtcService.subscribe(user, mediaType as 'audio' | 'video');
        } catch (error) {
          this.onCallError?.({
            errorType: CallErrorType.RTC,
            ...(error as IAgoraRTCError),
          });
          throw error;
        }

        // RTC UID 直接使用 IM userId
        const userId = this.toUidKey(user.uid);
        // this.onRemoteUserJoined?.(userId, mediaType as 'video' | 'audio' | 'group');

        // 触发回调, 清楚邀请定时器
        this.onUserPublished?.(userId);
        const uidKey = this.toUidKey(user.uid);
        setTimeout(async () => {
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
            // 🔧 修改：将视频轨道存储到用户专用的Map中
            this.remoteVideoTracks.set(uidKey, remoteVideoTrack);

            // 保持向后兼容（为了兼容可能存在的旧代码）
            this.rtc.remoteVideoTrack = remoteVideoTrack;
            this.rtc.remoteUser = user;

            // 🔧 获取远程视频流
            const remoteVideoStream = this.getRemoteVideoStream(uidKey);
            // logDebug('🎬 获取远程视频流结果:', {
            //   用户ID: user.uid,
            //   视频轨道存在: !!this.remoteVideoTracks.get(user.uid),
            //   视频流存在: !!remoteVideoStream,
            //   轨道ID: remoteVideoTrack?.getTrackId?.(),
            // });

            // 创建远程视频信息
            // 🔧 修复：根据音频轨道状态判断静音状态，而不是依赖 joinedMembers
            const hasAudioTrack = this.remoteAudioTracks.has(uidKey);
            const nickname = userId ? this.userInfos[userId]?.nickname : undefined;
            if (!nickname && userId && this.userInfoProvider) {
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
            this.remoteAudioTracks.set(uidKey, remoteAudioTrack);
            this.audioService.addRemoteTrack(uidKey, remoteAudioTrack);

            // 保持向后兼容
            this.rtc.remoteAudioTrack = remoteAudioTrack;
            this.rtc.remoteUser = user;

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
            const hasVideoTrack = this.remoteVideoTracks.has(uidKey);
            const memberCameraStatus = this.getRemoteUserCameraStatus(userId);
            const cameraEnabled = hasVideoTrack || memberCameraStatus;
            logDebug('---->cameraEnabled', hasVideoTrack, memberCameraStatus, cameraEnabled);
            // 创建更新后的视频信息（音频发布时，用户取消静音了）
            const nickname = userId ? this.userInfos[userId]?.nickname : undefined;
            if (!nickname && userId && this.userInfoProvider) {
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
              stream: cameraEnabled ? this.getRemoteVideoStream(uidKey) : undefined,
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
      const userId = this.toUidKey(user.uid);
      const uidKey = this.toUidKey(user.uid);

      // 🔧 清理离开用户的所有媒体轨道（使用 uid 作为 key）
      const videoTrack = this.remoteVideoTracks.get(uidKey);
      const audioTrack = this.remoteAudioTracks.get(uidKey);

      if (videoTrack) {
        try {
          videoTrack.stop();
        } catch (error) {
          logWarn(`stop video track error:`, error);
        }
        this.remoteVideoTracks.delete(uidKey);
      }
      this.remoteVideoStreams.delete(uidKey);
      this.pendingVideoTracks.delete(`remote-${uidKey}`);

      if (audioTrack) {
        try {
          audioTrack.stop();
        } catch (error) {
          logWarn(`stop audio track error:`, error);
        }
        this.remoteAudioTracks.delete(uidKey);
        this.audioService.removeRemoteTrack(uidKey);
      }

      // 移除离开的用户
      this.joinedMembers = this.joinedMembers.filter(member => member.uid !== user.uid);

      this.handleUserLeft(userId, reason);
    });

    // 监听远程用户停止发布流
    this.client.on('user-unpublished', (user: any, mediaType: string) => {
      // 触发回调
      this.onUserUnpublished?.(user, mediaType);

      const userId = this.toUidKey(user.uid);
      const uidKey = this.toUidKey(user.uid);

      if (mediaType === 'video') {
        // 停止视频播放
        if (user.videoTrack) {
          user.videoTrack.stop();
        }

        // 🔧 从Map中清理用户的视频轨道（使用 uid 作为 key）
        this.remoteVideoTracks.delete(uidKey);
        // 🔧 清理缓存的视频流
        this.remoteVideoStreams.delete(uidKey);

        // 清理远程视频轨道引用
        if (this.rtc.remoteVideoTrack && this.rtc.remoteUser?.uid === user.uid) {
          this.rtc.remoteVideoTrack = null;
        }
        // 创建更新后的视频信息（关闭摄像头，显示头像）
        // 🔧 修复：根据音频轨道状态判断静音状态，而不是依赖 joinedMembers
        const hasAudioTrack = this.remoteAudioTracks.has(uidKey);
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
        this.remoteAudioTracks.delete(uidKey);
        this.audioService.removeRemoteTrack(uidKey);
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
        const hasVideoTrack = this.remoteVideoTracks.has(uidKey);
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
        .map(volume => this.toUidKey(volume.uid));

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
      // 远端 UID 已是 IM userId。
      const others2 = { ...others, [this.userId]: quality };
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
    } else if (this.enableMic) {
      this.rtc.localAudioTrack = await this.mediaService.createAudioTrack();
      if (this.callStatus == CALL_STATUS.IN_CALL) {
        await this.rtcService.publish([this.rtc.localAudioTrack]);
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
    return this.enableMic; // 返回麦克风是否开启
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
        const localVideoTrack = await this.mediaService.createVideoTrack(trackConfig.cameraId);
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
          await this.rtcService.publish([localVideoTrack]);
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
            newVideoTrack = await this.mediaService.createVideoTrack(trackConfig.cameraId);
          } catch (error) {
            // 🔧 修复：如果使用保存的设备ID创建失败，尝试不使用设备ID（可能是设备已移除）
            if (this.currentCameraDeviceId && trackConfig.cameraId) {
              logWarn(
                'toggleCamera: failed to create track with saved device ID, trying without device ID:',
                error,
              );
              delete trackConfig.cameraId;
              newVideoTrack = await this.mediaService.createVideoTrack();
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

          await this.rtcService.publish([this.rtc.localVideoTrack]);
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
            await this.rtcService.unpublish([this.rtc.localVideoTrack]);
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
        const localVideoTrack = await this.mediaService.createVideoTrack(trackConfig.cameraId);
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

    const newSpeakerEnabled = this.audioService.toggleSpeaker();
    logDebug('Speaker status:', newSpeakerEnabled ? 'enabled' : 'disabled');
    return newSpeakerEnabled;
  }

  // 🔧 新增：获取当前扬声器状态
  isSpeakerEnabled(): boolean {
    return this.audioService.isSpeakerEnabled();
  }

  // 🔧 新增：设置扬声器音量
  setSpeakerVolume(volume: number): void {
    if (!this.audioService.setSpeakerVolume(volume)) {
      logWarn('Volume value must be between 0-100');
      return;
    }

    logDebug('Set speaker volume to:', volume);
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
      const localVideoTrack = await this.mediaService.createVideoTrack();
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

  // 创建群组视频轨道并更新本地预览；入会时发布该轨道。
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

    const callId = this.currentCallInfo.callId;
    if (!this.rtc.localVideoTrack) {
      try {
        this.creatingVideoTrack ??= this.mediaService.createVideoTrack();
        const track = await this.creatingVideoTrack;
        if (this.currentCallInfo?.callId !== callId) {
          this.mediaService.closeTrack(track);
          return false;
        }
        this.rtc.localVideoTrack = track;
      } catch (error) {
        logWarn('Group camera unavailable, continue with audio only:', error);
        this.onCallError?.({ errorType: CallErrorType.RTC, ...(error as IAgoraRTCError) });
        return false;
      } finally {
        this.creatingVideoTrack = null;
      }
    }
    const cameraEnabled = Boolean(this.rtc.localVideoTrack.enabled);
    this.onRemoteVideoReady?.({
      id: 'local',
      isLocalVideo: true,
      muted: this.isMuted(),
      cameraEnabled,
      nickname: this.userInfos[this.userId]?.nickname || this.userId,
      avatar: this.userInfos[this.userId]?.avatarUrl,
      stream: cameraEnabled ? this.getOrCreateLocalVideoStream() : undefined,
    });
    return cameraEnabled;
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
      await this.callSignaling.inviteParticipants(this.currentCallInfo.callId, {
        userIds: newMembers,
        timeoutSeconds: this.invitationTimeoutSeconds,
      });
      this.invitedMembers = [...new Set([...this.invitedMembers, ...newMembers])];
      if (!this.currentCallInfo.groupId) {
        void this.sendCallRecordMessages(
          newMembers.filter(Boolean).map(conversationId => ({
            conversationId,
            conversationType: 'singleChat' as const,
          })),
        );
      }
      if (this.currentCallInfo.invitedMembers) {
        this.currentCallInfo.invitedMembers = [
          ...new Set([...this.currentCallInfo.invitedMembers, ...newMembers]),
        ];
      } else {
        this.currentCallInfo.invitedMembers = newMembers;
      }
      return true;
    } catch (error) {
      logError('add participants failed:', error);
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

  // RTC 轨道以 IM userId 为键，无需 UID 映射。
  getRemoteVideoTrack(userId: string): any {
    return this.remoteVideoTracks.get(userId) ?? null;
  }

  getRemoteAudioTrack(userId: string): any {
    return this.remoteAudioTracks.get(userId) ?? null;
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
      this.client?.connectionState === 'CONNECTED' &&
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
          await this.rtcService.unpublish(tracksToUnpublish);
          logDebug('Clean up preview mode: local tracks unpublished');
        }

        // 尝试离开频道
        try {
          await this.rtcService.leave();
          logDebug('Clean up preview mode: left RTC channel');
        } catch (error) {
          logDebug('Clean up preview mode: failed to leave channel (may not have joined):', error);
        }
      } catch (error) {
        logError('clean up preview mode: failed to unpublish tracks:', error);
      }
    }

    // 🔧 安全清理：确保轨道在关闭前被取消发布（不受callStatus限制）
    if (
      this.client?.connectionState === 'CONNECTED' &&
      (this.rtc.localAudioTrack || this.rtc.localVideoTrack)
    ) {
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
          await this.rtcService.unpublish(tracksToSafeUnpublish);
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
    this.audioService.resetSpeaker();

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
    this.clearOutgoingTimeoutCheck();
    logger.log('[call-debug] CallService destroy', {
      isInitializing,
      callStatus: this.callStatus,
      currentCallId: this.currentCallInfo?.callId,
    });
    this.callSignaling.stop();
    this.disposeCallStoreReactions?.();
    this.disposeCallStoreReactions = undefined;
    // 🔧 修复：组件初始化时不调用hangup，避免触发麦克风权限请求
    if (!isInitializing) {
      // this.hangup(HANGUP_REASON.HANGUP);
    } else {
      // 🔧 初始化时的清理：只做必要的清理，不调用hangup
      logDebug('Component initialization cleanup, skip hangup call');

      // 清理本地视频流缓存
      this.localVideoStream = null;

      // 清理群组信息缓存
      this.cachedGroupInfos = {};

      // 清理远程轨道映射
      this.remoteVideoTracks.clear();
      this.remoteAudioTracks.clear();
      this.audioService.clearRemoteTracks();

      // 清理等待播放的轨道
      this.pendingVideoTracks.clear();

      // 重置状态
      this.callStatus = CALL_STATUS.IDLE;
      this.currentCallInfo = null;
      this.callTimer.reset();
      this.joinedMembers = [];
      this.invitedMembers = [];
      this.signalingParticipants = [];

      this.enableMic = true;
      this.audioService.resetSpeaker();
      // 清理RTC引用
      if (this.rtc.localAudioTrack) {
        try {
          this.mediaService.closeTrack(this.rtc.localAudioTrack);
        } catch (error) {
          logWarn('clean up local audio track failed:', error);
        }
        this.rtc.localAudioTrack = null;
      }

      if (this.rtc.localVideoTrack) {
        try {
          this.mediaService.closeTrack(this.rtc.localVideoTrack);
        } catch (error) {
          logWarn('clean up local video track failed:', error);
        }
        this.rtc.localVideoTrack = null;
      }

      // 清理远程轨道引用
      this.rtc.remoteAudioTrack = null;
      this.rtc.remoteVideoTrack = null;
      this.rtc.remoteUser = null;

      this.audioService.dispose();
      void this.rtcService.dispose();

      return; // 🔧 初始化时直接返回，不执行后续的hangup逻辑
    }

    // 最后的媒体轨道清理（不检查权限，避免初始化时请求麦克风权限）
    this.checkAndCleanupAllMediaTracks(false);

    // 清理本地视频流缓存
    this.localVideoStream = null;
    // 清理群组信息缓存
    this.cachedGroupInfos = {};
    // 清理铃声
    this.audioService.dispose();
    void this.rtcService.dispose();
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

  // 设置铃声配置
  setRingtoneConfig(config: {
    outgoingRingtoneSrc?: string;
    incomingRingtoneSrc?: string;
    enableRingtone?: boolean;
    ringtoneVolume?: number;
    ringtoneLoop?: boolean;
  }) {
    this.audioService.setConfig(config);
  }
}
