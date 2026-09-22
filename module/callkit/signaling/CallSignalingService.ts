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

export interface CallSignalingServiceClient {
  readonly callSignalingManager: CallSignalingManager;
}

export interface CallSignalingServiceOptions {
  onInvitationReceived?: (payload: CallInvitationReceivedPayload) => void;
  onParticipantsChanged?: (payload: CallParticipantsChangedPayload) => void;
  onHandledOnOtherDevice?: (payload: CallHandledOnOtherDevicePayload) => void;
  onCallEnded?: (payload: CallEndedPayload) => void;
}

/** UIKit adapter for the SDK-native Fusion call signaling manager. */
export class CallSignalingService {
  private readonly client: CallSignalingServiceClient;
  private readonly store: CallStore;
  private readonly options: CallSignalingServiceOptions;
  private started = false;

  constructor(
    client: CallSignalingServiceClient,
    store: CallStore,
    options: CallSignalingServiceOptions = {},
  ) {
    this.client = client;
    this.store = store;
    this.options = options;
  }

  start(): void {
    if (this.started) return;
    this.client.callSignalingManager.addEventHandler('easemob-uikit-callkit', {
      onInvitationReceived: payload => {
        this.store.setInvitation(payload);
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
  }

  stop(): void {
    if (!this.started) return;
    this.client.callSignalingManager.removeEventHandler('easemob-uikit-callkit');
    this.started = false;
  }

  createCall(request: CreateCallRequest): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.createCall(request));
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

  terminateCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.terminateCall(callId));
  }

  syncCall(callId: string): Promise<CallSnapshot> {
    return this.capture(this.client.callSignalingManager.syncCall(callId));
  }

  private async capture(request: Promise<CallSnapshot>): Promise<CallSnapshot> {
    const snapshot = await request;
    this.store.setSnapshot(snapshot);
    return snapshot;
  }
}

export default CallSignalingService;
