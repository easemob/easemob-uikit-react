import type { CallSignalingManager } from 'easemob-websdk/managers/call-signaling';
import type {
  CallEndedPayload,
  CallHandledOnOtherDevicePayload,
  CallInvitationReceivedPayload,
  CallParticipantsChangedPayload,
  CallSnapshot,
  CreateCallRequest,
  InviteParticipantsParams,
  JoinCallParams,
  RejectCallParams,
} from 'easemob-websdk';
import CallStore from '../store/CallStore';
import { logger } from '../utils/logger';

export interface CallSignalingServiceClient {
  readonly callSignalingManager: CallSignalingManager;
  getCurrentUserId?: () => string | null;
  addEventHandler?: (id: string, handlers: { onConnected: () => void }) => void;
  removeEventHandler?: (id: string) => void;
}

export interface CallSignalingServiceOptions {
  eventHandlerId?: string;
  onInvitationReceived?: (payload: CallInvitationReceivedPayload) => void;
  onParticipantsChanged?: (payload: CallParticipantsChangedPayload) => void;
  onHandledOnOtherDevice?: (payload: CallHandledOnOtherDevicePayload) => void;
  onCallEnded?: (payload: CallEndedPayload) => void;
}

let eventHandlerSequence = 0;

/** UIKit adapter for the SDK-native Fusion call signaling manager. */
export class CallSignalingService {
  private readonly client: CallSignalingServiceClient;
  private readonly store: CallStore;
  private readonly options: CallSignalingServiceOptions;
  private readonly eventHandlerId: string;
  private started = false;
  private lastCallId?: string;
  private readonly pendingLeaves = new Map<string, string | null | undefined>();
  private leaveRetryTimer?: ReturnType<typeof setTimeout>;
  private flushingLeaves = false;
  private readonly onOnline = (): void => {
    void this.flushPendingLeaves();
  };

  constructor(
    client: CallSignalingServiceClient,
    store: CallStore,
    options: CallSignalingServiceOptions = {},
  ) {
    this.client = client;
    this.store = store;
    this.options = options;
    this.lastCallId = store.snapshot?.callId ?? store.invitation?.callId;
    eventHandlerSequence += 1;
    this.eventHandlerId = options.eventHandlerId ?? `easemob-uikit-callkit-${eventHandlerSequence}`;
  }

  start(): void {
    if (this.started) {
      logger.log('[call-debug] signaling adapter start skipped', {
        eventHandlerId: this.eventHandlerId,
      });
      return;
    }
    logger.log('[call-debug] signaling adapter start', {
      eventHandlerId: this.eventHandlerId,
    });
    this.client.callSignalingManager.addEventHandler(this.eventHandlerId, {
      onInvitationReceived: payload => {
        this.lastCallId = payload.callId;
        logger.log('[call-debug] signaling adapter received invitation', {
          eventHandlerId: this.eventHandlerId,
          callId: payload.callId,
          callType: payload.callType,
          mediaType: payload.mediaType,
        });
        this.store.setInvitation(payload);
        logger.log('[call-debug] signaling adapter stored invitation', {
          eventHandlerId: this.eventHandlerId,
          callId: this.store.invitation?.callId,
        });
        this.options.onInvitationReceived?.(payload);
      },
      onParticipantsChanged: payload => {
        this.store.setParticipants(payload);
        this.options.onParticipantsChanged?.(payload);
      },
      onHandledOnOtherDevice: payload => {
        this.store.setHandledOnOtherDevice(payload);
        this.options.onHandledOnOtherDevice?.(payload);
      },
      onCallEnded: payload => {
        this.store.setEnded(payload);
        this.options.onCallEnded?.(payload);
      },
    });
    this.started = true;
    this.client.addEventHandler?.(this.eventHandlerId, { onConnected: this.onOnline });
    if (typeof window !== 'undefined') window.addEventListener('online', this.onOnline);
  }

  stop(): void {
    if (!this.started) {
      logger.log('[call-debug] signaling adapter stop skipped', {
        eventHandlerId: this.eventHandlerId,
      });
      return;
    }
    logger.log('[call-debug] signaling adapter stop', {
      eventHandlerId: this.eventHandlerId,
    });
    this.client.callSignalingManager.removeEventHandler(this.eventHandlerId);
    this.started = false;
    this.client.removeEventHandler?.(this.eventHandlerId);
    if (typeof window !== 'undefined') window.removeEventListener('online', this.onOnline);
    if (this.leaveRetryTimer) clearTimeout(this.leaveRetryTimer);
    this.leaveRetryTimer = undefined;
    this.pendingLeaves.clear();
  }

  /** Keep an offline conference hangup until this same login can notify the server. */
  deferLeaveCall(callId: string): void {
    if (!this.started) return;
    this.pendingLeaves.set(callId, this.client.getCurrentUserId?.());
    logger.log('[call-debug] deferred conference leave queued', { callId });
    void this.flushPendingLeaves();
  }

  private async flushPendingLeaves(): Promise<void> {
    if (!this.started || this.flushingLeaves || !this.pendingLeaves.size) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (this.leaveRetryTimer) clearTimeout(this.leaveRetryTimer);
    this.leaveRetryTimer = undefined;
    this.flushingLeaves = true;
    try {
      for (const [callId, userId] of this.pendingLeaves) {
        if (!this.started) break;
        if (this.client.getCurrentUserId?.() !== userId) {
          logger.log('[call-debug] deferred conference leave discarded after account change', {
            callId,
          });
          this.pendingLeaves.delete(callId);
          continue;
        }
        try {
          // Do not capture this old snapshot: local hangup has already cleared the UI,
          // and a different call may now own the store.
          await this.client.callSignalingManager.leaveCall(callId);
          this.pendingLeaves.delete(callId);
          logger.log('[call-debug] deferred conference leave completed', { callId });
        } catch (error) {
          const { code, details } = (error ?? {}) as {
            code?: number;
            details?: { stage?: string; operation?: string };
          };
          // Business failures are terminal; transport/readiness failures can recover.
          // Code 1701 is also used by socket failures, so the code alone is ambiguous.
          if (
            details?.operation === 'leaveCall' &&
            !details.stage &&
            code !== undefined &&
            code >= 1700 &&
            code < 1800
          ) {
            this.pendingLeaves.delete(callId);
          }
          logger.warn('[call-debug] deferred conference leave failed', { callId, code });
        }
      }
    } finally {
      this.flushingLeaves = false;
      if (this.started && this.pendingLeaves.size) {
        this.leaveRetryTimer = setTimeout(() => {
          this.leaveRetryTimer = undefined;
          void this.flushPendingLeaves();
        }, 2000);
      }
    }
  }

  async createCall(request: CreateCallRequest): Promise<CallSnapshot> {
    try {
      return await this.capture(this.client.callSignalingManager.createCall(request));
    } catch (error) {
      const details = (error as { details?: { rule?: string; operation?: string } })?.details;
      if (details?.rule !== 'busy' || details.operation !== 'createCall' || !this.lastCallId) {
        throw error;
      }
      // SDK 的公开快照查询会释放已结束通话的本地占位。仅重试已确认结束的通话。
      let ended = false;
      try {
        const snapshot = await this.client.callSignalingManager.getCallSnapshot(this.lastCallId);
        ended = snapshot.lifecycle === 'ended';
      } catch (syncError) {
        // SDK 遇到 CALL_NOT_FOUND / CALL_ENDED 业务码也会释放本地占位。
        const code = (syncError as { code?: number })?.code;
        ended = code === 1701 || code === 1706;
      }
      if (!ended) throw error;
      return this.capture(this.client.callSignalingManager.createCall(request));
    }
  }

  reportRinging(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.reportRinging(callId));
  }

  acceptCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.acceptCall(callId));
  }

  rejectCall(callId: string, params?: RejectCallParams): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.rejectCall(callId, params));
  }

  cancelCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.cancelCall(callId));
  }

  inviteParticipants(callId: string, params: InviteParticipantsParams): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.inviteParticipants(callId, params));
  }

  joinCall(callId: string, params?: JoinCallParams): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.joinCall(callId, params));
  }

  leaveCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.leaveCall(callId));
  }

  hangup(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.hangup(callId));
  }

  syncCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.getCallSnapshot(callId));
  }

  private async capture(request: Promise<CallSnapshot>): Promise<CallSnapshot> {
    const snapshot = await request;
    this.lastCallId = snapshot.callId;
    this.store.setSnapshot(snapshot);
    return snapshot;
  }
}

export default CallSignalingService;
