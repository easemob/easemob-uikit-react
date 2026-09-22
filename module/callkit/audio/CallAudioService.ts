import { RingtoneManager } from '../utils/ringtoneManager';

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

  dispose(): void {
    this.ringtone.destroy();
  }
}

export default CallAudioService;
