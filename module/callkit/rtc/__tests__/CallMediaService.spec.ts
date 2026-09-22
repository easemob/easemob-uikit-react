import type { ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { CallMediaService } from '../CallMediaService';

describe('CallMediaService', () => {
  it('creates tracks with the configured encoder and selected camera', async () => {
    const audioTrack = {} as ILocalAudioTrack;
    const videoTrack = {} as ILocalVideoTrack;
    const createAudioTrack = vi.fn().mockResolvedValue(audioTrack);
    const createVideoTrack = vi.fn().mockResolvedValue(videoTrack);
    const service = new CallMediaService({
      encoderConfig: '720p',
      createAudioTrack,
      createVideoTrack,
    });

    await expect(service.createAudioTrack()).resolves.toBe(audioTrack);
    await expect(service.createVideoTrack('camera-1')).resolves.toBe(videoTrack);
    expect(createVideoTrack).toHaveBeenCalledWith({
      encoderConfig: '720p',
      cameraId: 'camera-1',
    });
  });

  it('stops and closes tracks safely', () => {
    const track = { stop: vi.fn(), close: vi.fn() };
    const service = new CallMediaService();

    service.closeTrack(track);

    expect(track.stop).toHaveBeenCalledOnce();
    expect(track.close).toHaveBeenCalledOnce();
  });
});
