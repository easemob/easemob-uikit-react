import AgoraRTC, {
  type IAgoraRTCClient,
  type ILocalAudioTrack,
  type ILocalVideoTrack,
  type VideoEncoderConfigurationPreset,
} from 'agora-rtc-sdk-ng';

export interface CallMediaServiceOptions {
  encoderConfig?: VideoEncoderConfigurationPreset;
  createAudioTrack?: typeof AgoraRTC.createMicrophoneAudioTrack;
  createVideoTrack?: typeof AgoraRTC.createCameraVideoTrack;
}

/** Owns local microphone/camera track creation and safe disposal. */
export class CallMediaService {
  private readonly encoderConfig?: VideoEncoderConfigurationPreset;
  private readonly createAudioTrackFactory: typeof AgoraRTC.createMicrophoneAudioTrack;
  private readonly createVideoTrackFactory: typeof AgoraRTC.createCameraVideoTrack;

  constructor(options: CallMediaServiceOptions = {}) {
    this.encoderConfig = options.encoderConfig;
    this.createAudioTrackFactory = options.createAudioTrack ?? AgoraRTC.createMicrophoneAudioTrack;
    this.createVideoTrackFactory = options.createVideoTrack ?? AgoraRTC.createCameraVideoTrack;
  }

  createAudioTrack(): Promise<ILocalAudioTrack> {
    return this.createAudioTrackFactory();
  }

  createVideoTrack(cameraId?: string): Promise<ILocalVideoTrack> {
    return this.createVideoTrackFactory({
      ...(this.encoderConfig ? { encoderConfig: this.encoderConfig } : {}),
      ...(cameraId ? { cameraId } : {}),
    });
  }

  async publishAudio(client: IAgoraRTCClient, track: ILocalAudioTrack): Promise<void> {
    await client.publish([track]);
  }

  async publishVideo(client: IAgoraRTCClient, track: ILocalVideoTrack): Promise<void> {
    await client.publish([track]);
  }

  setTrackEnabled(track: ILocalAudioTrack | ILocalVideoTrack, enabled: boolean): Promise<void> {
    return track.setEnabled(enabled);
  }

  closeTrack(track: { close?: () => void; stop?: () => void } | null | undefined): void {
    if (!track) return;
    try {
      track.stop?.();
    } finally {
      track.close?.();
    }
  }

  closeTracks(
    tracks: ReadonlyArray<{ close?: () => void; stop?: () => void } | null | undefined>,
  ): void {
    tracks.forEach(track => this.closeTrack(track));
  }
}

export default CallMediaService;
