import { action, makeObservable, observable } from 'mobx';
import type {
  CallEndedPayload,
  CallHandledOnOtherDevicePayload,
  CallInvitationReceivedPayload,
  CallParticipantsChangedPayload,
  CallSnapshot,
} from 'easemob-websdk';

export interface CallStoreState {
  snapshot: CallSnapshot | null;
  invitation: CallInvitationReceivedPayload | null;
  handledOnOtherDevice: CallHandledOnOtherDevicePayload | null;
  ended: CallEndedPayload | null;
}

/** Native call-signaling state shared by Provider and CallKit. */
export class CallStore {
  snapshot: CallSnapshot | null = null;
  invitation: CallInvitationReceivedPayload | null = null;
  handledOnOtherDevice: CallHandledOnOtherDevicePayload | null = null;
  ended: CallEndedPayload | null = null;

  constructor() {
    makeObservable(this, {
      snapshot: observable.ref,
      invitation: observable.ref,
      handledOnOtherDevice: observable.ref,
      ended: observable.ref,
      setInvitation: action,
      setSnapshot: action,
      setHandledOnOtherDevice: action,
      setEnded: action,
      clear: action,
    });
  }

  setInvitation(payload: CallInvitationReceivedPayload): void {
    this.invitation = payload;
    this.ended = null;
    this.handledOnOtherDevice = null;
  }

  setSnapshot(snapshot: CallSnapshot): void {
    if (this.snapshot && this.snapshot.callId === snapshot.callId) {
      if (BigInt(snapshot.revision) < BigInt(this.snapshot.revision)) return;
    }
    this.snapshot = snapshot;
  }

  setParticipants(payload: CallParticipantsChangedPayload): void {
    if (!this.snapshot || this.snapshot.callId !== payload.callId) return;
    this.setSnapshot({
      ...this.snapshot,
      participants: payload.participants,
      revision: payload.revision,
    });
  }

  setHandledOnOtherDevice(payload: CallHandledOnOtherDevicePayload): void {
    this.handledOnOtherDevice = payload;
  }

  setEnded(payload: CallEndedPayload): void {
    this.ended = payload;
  }

  clear(): void {
    this.snapshot = null;
    this.invitation = null;
    this.handledOnOtherDevice = null;
    this.ended = null;
  }
}

export default CallStore;
