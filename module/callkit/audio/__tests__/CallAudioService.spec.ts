import { CallAudioService } from '../CallAudioService';
import type { IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

const createRemoteTrack = (): Pick<IRemoteAudioTrack, 'setVolume'> => ({
  setVolume: vi.fn(),
});

describe('CallAudioService', () => {
  it('applies speaker state and volume to current and newly added remote tracks', () => {
    const service = new CallAudioService({ enableRingtone: false });
    const first = createRemoteTrack();
    const second = createRemoteTrack();

    service.addRemoteTrack('first', first as IRemoteAudioTrack);
    expect(first.setVolume).toHaveBeenLastCalledWith(100);

    expect(service.toggleSpeaker()).toBe(false);
    expect(first.setVolume).toHaveBeenLastCalledWith(0);

    service.addRemoteTrack('second', second as IRemoteAudioTrack);
    expect(second.setVolume).toHaveBeenLastCalledWith(0);

    expect(service.toggleSpeaker()).toBe(true);
    service.setSpeakerVolume(35);
    expect(first.setVolume).toHaveBeenLastCalledWith(35);
    expect(second.setVolume).toHaveBeenLastCalledWith(35);
  });

  it('rejects invalid volume and stops controlling removed tracks', () => {
    const service = new CallAudioService({ enableRingtone: false });
    const track = createRemoteTrack();
    service.addRemoteTrack('remote', track as IRemoteAudioTrack);
    service.removeRemoteTrack('remote');

    expect(service.setSpeakerVolume(101)).toBe(false);
    service.toggleSpeaker();
    expect(track.setVolume).toHaveBeenCalledTimes(1);
  });
});
