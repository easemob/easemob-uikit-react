import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { CallRtcService } from '../CallRtcService';

const createClient = (connectionState: IAgoraRTCClient['connectionState'] = 'DISCONNECTED') =>
  ({
    connectionState,
    setClientRole: vi.fn(),
    join: vi.fn().mockResolvedValue(1001),
    leave: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    unpublish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn(),
  } as unknown as IAgoraRTCClient);

describe('CallRtcService', () => {
  it('owns client creation and channel operations', async () => {
    const client = createClient();
    const service = new CallRtcService({ createClient: vi.fn(() => client) });

    await expect(
      service.join({ appId: 'app', channel: 'call', token: null, uid: 1001 }),
    ).resolves.toBe(1001);
    expect(client.setClientRole).toHaveBeenCalledWith('host');
    expect(client.join).toHaveBeenCalledWith('app', 'call', null, 1001);
  });

  it('disposes connected clients idempotently', async () => {
    const client = createClient('CONNECTED');
    const service = new CallRtcService({ createClient: vi.fn(() => client) });

    await service.dispose();
    await service.dispose();

    expect(client.leave).toHaveBeenCalledOnce();
    expect(client.removeAllListeners).toHaveBeenCalledOnce();
  });

  it('passes IM userId strings to Agora without numeric conversion', async () => {
    const client = createClient();
    vi.mocked(client.join).mockResolvedValue('00123');
    const service = new CallRtcService({ createClient: vi.fn(() => client) });

    await expect(
      service.join({ appId: 'app', channel: 'call', token: null, uid: '00123' }),
    ).resolves.toBe('00123');
    expect(client.join).toHaveBeenCalledWith('app', 'call', null, '00123');
  });
});
