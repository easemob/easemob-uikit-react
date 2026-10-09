import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ILocalTrack,
  type UID,
} from 'agora-rtc-sdk-ng';

export interface CallRtcServiceOptions {
  mode?: 'live' | 'rtc';
  codec?: 'vp8' | 'h264' | 'vp9';
  onCreated?: (client: IAgoraRTCClient) => void;
  createClient?: typeof AgoraRTC.createClient;
}

export interface JoinRtcChannelOptions {
  appId: string;
  channel: string;
  token: string | null;
  uid?: UID | null;
}

/** Owns the Agora client lifecycle. CallService owns call policy and event translation. */
export class CallRtcService {
  readonly client: IAgoraRTCClient;
  private destroyed = false;

  constructor(options: CallRtcServiceOptions = {}) {
    this.client = (options.createClient ?? AgoraRTC.createClient)({
      mode: options.mode ?? 'live',
      codec: options.codec ?? 'h264',
    });
    this.client.setClientRole('host');
    options.onCreated?.(this.client);
  }

  async leave(): Promise<void> {
    if (this.client.connectionState !== 'DISCONNECTED' || this.client.localTracks?.length) {
      await this.client.leave();
    }
  }

  async join(options: JoinRtcChannelOptions): Promise<UID> {
    return this.client.join(options.appId, options.channel, options.token, options.uid ?? null);
  }

  async publish(tracks: ILocalTrack | ILocalTrack[]): Promise<void> {
    await this.client.publish(tracks);
  }

  async unpublish(tracks?: ILocalTrack | ILocalTrack[]): Promise<void> {
    await this.client.unpublish(tracks);
  }

  async subscribe(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video'): Promise<void> {
    await this.client.subscribe(user, mediaType);
  }

  async dispose(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    try {
      await this.leave();
    } finally {
      this.client.removeAllListeners();
    }
  }
}

export default CallRtcService;
