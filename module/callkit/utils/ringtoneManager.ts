import { logWarn, logError } from './logger';

/**
 * 铃声管理器
 */
export class RingtoneManager {
  private outgoingRingtoneAudio: HTMLAudioElement | null = null;
  private incomingRingtoneAudio: HTMLAudioElement | null = null;
  private outgoingRingtoneSrc?: string;
  private incomingRingtoneSrc?: string;
  private enableRingtone: boolean = true;
  private ringtoneVolume: number = 0.8;
  private ringtoneLoop: boolean = true;
  private isRingtonePlaying: boolean = false;
  private currentRingtoneType: 'outgoing' | 'incoming' | null = null;

  constructor(config?: {
    outgoingRingtoneSrc?: string;
    incomingRingtoneSrc?: string;
    enableRingtone?: boolean;
    ringtoneVolume?: number;
    ringtoneLoop?: boolean;
  }) {
    if (config) {
      this.setConfig(config);
    }
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 初始化外呼铃声
    if (this.outgoingRingtoneSrc) {
      this.outgoingRingtoneAudio = new Audio(this.outgoingRingtoneSrc);
      this.outgoingRingtoneAudio.volume = this.ringtoneVolume;
      this.outgoingRingtoneAudio.loop = this.ringtoneLoop;
      this.outgoingRingtoneAudio.preload = 'auto';
    }

    // 初始化来电铃声
    if (this.incomingRingtoneSrc) {
      this.incomingRingtoneAudio = new Audio(this.incomingRingtoneSrc);
      this.incomingRingtoneAudio.volume = this.ringtoneVolume;
      this.incomingRingtoneAudio.loop = this.ringtoneLoop;
      this.incomingRingtoneAudio.preload = 'auto';
    }
  }

  async playRingtone(type: 'outgoing' | 'incoming'): Promise<void> {
    if (!this.enableRingtone) return;

    // 先停止当前播放的铃声
    this.stopRingtone();

    const audioElement =
      type === 'outgoing' ? this.outgoingRingtoneAudio : this.incomingRingtoneAudio;

    if (!audioElement) {
      logWarn(`${type === 'outgoing' ? '外呼' : '来电'}铃声音频未配置`);
      return;
    }

    try {
      // 重置音频到开始位置
      audioElement.currentTime = 0;
      audioElement.volume = this.ringtoneVolume;
      audioElement.loop = this.ringtoneLoop;

      // 播放铃声
      await audioElement.play();
      this.isRingtonePlaying = true;
      this.currentRingtoneType = type;
    } catch (error) {
      logError(`播放${type === 'outgoing' ? '外呼' : '来电'}铃声失败:`, error);
    }
  }

  stopRingtone(): void {
    if (!this.isRingtonePlaying) return;

    // 停止外呼铃声
    if (this.outgoingRingtoneAudio && !this.outgoingRingtoneAudio.paused) {
      this.outgoingRingtoneAudio.pause();
      this.outgoingRingtoneAudio.currentTime = 0;
    }

    // 停止来电铃声
    if (this.incomingRingtoneAudio && !this.incomingRingtoneAudio.paused) {
      this.incomingRingtoneAudio.pause();
      this.incomingRingtoneAudio.currentTime = 0;
    }

    this.isRingtonePlaying = false;
    this.currentRingtoneType = null;
  }

  setConfig(config: {
    outgoingRingtoneSrc?: string;
    incomingRingtoneSrc?: string;
    enableRingtone?: boolean;
    ringtoneVolume?: number;
    ringtoneLoop?: boolean;
  }): void {
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

    // 重新初始化音频对象
    this.init();
  }

  destroy(): void {
    this.stopRingtone();
    this.outgoingRingtoneAudio = null;
    this.incomingRingtoneAudio = null;
  }

  get isPlaying(): boolean {
    return this.isRingtonePlaying;
  }

  get currentType(): 'outgoing' | 'incoming' | null {
    return this.currentRingtoneType;
  }
}
