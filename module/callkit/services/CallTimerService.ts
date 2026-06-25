/**
 * 通话计时器服务
 */
export class CallTimerService {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private seconds = 0;
  private _duration = '00:00:00';

  get duration(): string {
    return this._duration;
  }

  start(onUpdate?: (duration: string) => void): void {
    this.stop();
    this.seconds = 0;
    this.intervalTimer = setInterval(() => {
      this.seconds++;
      const hours = Math.floor(this.seconds / 3600);
      const minutes = Math.floor((this.seconds % 3600) / 60);
      const secs = this.seconds % 60;
      this._duration = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      onUpdate?.(this._duration);
    }, 1000);
  }

  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  reset(): void {
    this.stop();
    this.seconds = 0;
    this._duration = '00:00:00';
  }
}
