import { RingtoneManager } from '../utils/ringtoneManager';
import type { IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

export interface CallAudioServiceOptions {
  outgoingRingtoneSrc?: string;
  incomingRingtoneSrc?: string;
  enableRingtone?: boolean;
  ringtoneVolume?: number;
  ringtoneLoop?: boolean;
  onStart?: (type: 'outgoing' | 'incoming') => void;
  onEnd?: (type: 'outgoing' | 'incoming') => void;
}

/** Owns all non-RTC call audio such as incoming and outgoing ringtones. */
export class CallAudioService {
  private readonly ringtone: RingtoneManager;
  private readonly remoteTracks = new Map<string, IRemoteAudioTrack>();
  private speakerEnabled = true;
  private speakerVolume = 100;

  constructor(options: CallAudioServiceOptions) {
    this.ringtone = new RingtoneManager(options);
  }

  play(type: 'outgoing' | 'incoming'): void {
    this.ringtone.playRingtone(type);
  }

  stop(): void {
    this.ringtone.stopRingtone();
  }

  setConfig(options: Omit<CallAudioServiceOptions, 'onStart' | 'onEnd'>): void {
    this.ringtone.setConfig(options);
  }

  addRemoteTrack(userId: string, track: IRemoteAudioTrack): void {
    this.remoteTracks.set(userId, track);
    this.applyRemoteVolume(track);
  }

  removeRemoteTrack(userId: string): void {
    this.remoteTracks.delete(userId);
  }

  toggleSpeaker(): boolean {
    this.speakerEnabled = !this.speakerEnabled;
    this.applyRemoteVolumes();
    return this.speakerEnabled;
  }

  isSpeakerEnabled(): boolean {
    return this.speakerEnabled;
  }

  setSpeakerVolume(volume: number): boolean {
    if (!Number.isFinite(volume) || volume < 0 || volume > 100) return false;
    this.speakerVolume = volume;
    this.applyRemoteVolumes();
    return true;
  }

  resetSpeaker(): void {
    this.speakerEnabled = true;
    this.speakerVolume = 100;
    this.applyRemoteVolumes();
  }

  clearRemoteTracks(): void {
    this.remoteTracks.clear();
  }

  dispose(): void {
    this.clearRemoteTracks();
    this.ringtone.destroy();
  }

  private applyRemoteVolumes(): void {
    this.remoteTracks.forEach(track => this.applyRemoteVolume(track));
  }

  private applyRemoteVolume(track: IRemoteAudioTrack): void {
    track.setVolume(this.speakerEnabled ? this.speakerVolume : 0);
  }
}

export default CallAudioService;
