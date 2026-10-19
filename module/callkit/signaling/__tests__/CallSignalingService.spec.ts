import CallSignalingService from '../CallSignalingService';
import CallStore from '../../store/CallStore';
import type { CallSnapshot } from 'easemob-websdk';

const result: CallSnapshot = {
  callId: '0123456789abcdef0123456789abcdef',
  callType: 'single',
  mediaType: 'voice',
  lifecycle: 'open',
  creatorUserId: 'alice',
  participants: [{ userId: 'bob', state: 'pending' }],

  createdAt: 1,
};

describe('offline conference leave recovery', () => {
  let service: CallSignalingService;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    service?.stop();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const advance = async (ms: number) => {
    for (let index = 0; index < 20; index++) {
      await Promise.resolve();
      vi.advanceTimersByTime(ms / 20);
    }
  };

  const setup = () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const manager = {
      addEventHandler: vi.fn(),
      removeEventHandler: vi.fn(),
      leaveCall: vi.fn().mockResolvedValue(result),
    };
    const client = {
      callSignalingManager: manager,
      getCurrentUserId: vi.fn().mockReturnValue('bob'),
      addEventHandler: vi.fn(),
      removeEventHandler: vi.fn(),
    };
    const store = new CallStore();
    service = new CallSignalingService(client as any, store);
    service.start();
    service.deferLeaveCall(result.callId);
    expect(manager.leaveCall).not.toHaveBeenCalled();
    return { online, manager, client, store };
  };

  it('retries after reconnect readiness failure without restoring the ended call UI', async () => {
    const { online, manager, store } = setup();
    manager.leaveCall.mockRejectedValueOnce({ code: 1701, details: { stage: 'socket_connect' } });
    const nextCall = { ...result, callId: 'new-call' };
    store.setSnapshot(nextCall);
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    await advance(0);
    expect(manager.leaveCall).toHaveBeenCalledTimes(1);
    await advance(2000);
    expect(manager.leaveCall).toHaveBeenCalledTimes(2);
    expect(manager.leaveCall).toHaveBeenLastCalledWith(result.callId);
    expect(store.snapshot).toBe(nextCall);
    await advance(10_000);
    expect(manager.leaveCall).toHaveBeenCalledTimes(2);
  });

  it.each(['stop', 'account-change'])('discards pending leave on %s', async change => {
    const { online, manager, client } = setup();
    if (change === 'stop') service.stop();
    else client.getCurrentUserId.mockReturnValue('another-user');
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await advance(10_000);
    expect(manager.leaveCall).not.toHaveBeenCalled();
  });

  it('does not retry a call that the server reports as already ended', async () => {
    const { online, manager } = setup();
    manager.leaveCall.mockRejectedValueOnce({ code: 1706, details: { operation: 'leaveCall' } });
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await advance(10_000);
    expect(manager.leaveCall).toHaveBeenCalledTimes(1);
  });
});

describe('CallSignalingService', () => {
  it('registers before login and stores incoming invitations', () => {
    let handlers: Record<string, (payload: any) => void> = {};
    const manager = {
      addEventHandler: vi.fn((_id, next) => {
        handlers = next;
      }),
      removeEventHandler: vi.fn(),
    };
    const store = new CallStore();
    const service = new CallSignalingService({ callSignalingManager: manager } as any, store);

    service.start();
    handlers.onInvitationReceived({
      callId: result.callId,
      inviter: { userId: 'alice' },
      callType: 'single',
      mediaType: 'voice',
    });

    expect(store.invitation?.inviter.userId).toBe('alice');
    expect(manager.addEventHandler).toHaveBeenCalledTimes(1);
  });

  it('maps createCall and stores the returned snapshot', async () => {
    const manager = {
      createCall: vi.fn().mockResolvedValue(result),
      addEventHandler: vi.fn(),
      removeEventHandler: vi.fn(),
    };
    const store = new CallStore();
    const service = new CallSignalingService({ callSignalingManager: manager } as any, store);

    await service.createCall({ callType: 'single', mediaType: 'voice', targetUserIds: ['bob'] });

    expect(manager.createCall).toHaveBeenCalledWith({
      callType: 'single',
      mediaType: 'voice',
      targetUserIds: ['bob'],
    });
    expect(store.snapshot).toBe(result);
  });

  it('uses independent event handlers for Provider and CallService lifecycles', () => {
    const handlers = new Map<string, Record<string, (payload: any) => void>>();
    const manager = {
      addEventHandler: vi.fn((id, next) => {
        handlers.set(id, next);
      }),
      removeEventHandler: vi.fn(id => {
        handlers.delete(id);
      }),
    };
    const store = new CallStore();
    const providerService = new CallSignalingService(
      { callSignalingManager: manager } as any,
      store,
    );
    const callService = new CallSignalingService({ callSignalingManager: manager } as any, store);

    providerService.start();
    callService.start();
    expect(handlers.size).toBe(2);

    callService.stop();
    expect(handlers.size).toBe(1);

    const remainingHandler = [...handlers.values()][0];
    remainingHandler.onInvitationReceived({
      callId: result.callId,
      inviter: { userId: 'alice' },
      callType: 'single',
      mediaType: 'voice',
    });
    expect(store.invitation?.callId).toBe(result.callId);
  });

  it('recovers an ended SDK slot after UIKit clears its active state', async () => {
    const manager = {
      createCall: vi.fn().mockResolvedValue(result),
      getCallSnapshot: vi.fn().mockResolvedValue({ ...result, lifecycle: 'ended' }),
    };
    const store = new CallStore();
    const service = new CallSignalingService({ callSignalingManager: manager } as any, store);
    const request = { callType: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
    await service.createCall({ ...request, targetUserIds: ['bob'] });
    store.clear();
    const next = { ...result, callId: 'ffffffffffffffffffffffffffffffff' };
    manager.createCall
      .mockRejectedValueOnce({
        details: { rule: 'busy', operation: 'createCall' },
      })
      .mockResolvedValueOnce(next);

    await expect(service.createCall({ ...request, targetUserIds: ['bob'] })).resolves.toBe(next);
    expect(manager.getCallSnapshot).toHaveBeenCalledWith(result.callId);
    expect(manager.createCall).toHaveBeenCalledTimes(3);
    expect(store.snapshot?.callId).toBe(next.callId);
  });

  it.each(['open', 'network-error'])(
    'does not retry creation or end another call when recovery returns %s',
    async state => {
      const manager = {
        createCall: vi.fn().mockResolvedValue(result),
        getCallSnapshot: vi.fn(),
      };
      const service = new CallSignalingService(
        { callSignalingManager: manager } as any,
        new CallStore(),
      );
      const request = { callType: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
      await service.createCall({ ...request, targetUserIds: ['bob'] });
      const busy = { details: { rule: 'busy', operation: 'createCall' } };
      manager.createCall.mockRejectedValueOnce(busy);
      if (state === 'open') manager.getCallSnapshot.mockResolvedValue(result);
      else manager.getCallSnapshot.mockRejectedValue(new Error('network error'));

      await expect(service.createCall({ ...request, targetUserIds: ['bob'] })).rejects.toBe(busy);
      expect(manager.createCall).toHaveBeenCalledTimes(2);
    },
  );

  it('uses the public SDK snapshot API', async () => {
    const manager = { getCallSnapshot: vi.fn().mockResolvedValue(result) };
    const service = new CallSignalingService(
      { callSignalingManager: manager } as any,
      new CallStore(),
    );
    await service.syncCall(result.callId);
    expect(manager.getCallSnapshot).toHaveBeenCalledWith(result.callId);
  });

  it.each([1701, 1706])(
    'retries once when the SDK confirms old call is gone with code %s',
    async code => {
      const manager = {
        createCall: vi.fn().mockResolvedValue(result),
        getCallSnapshot: vi.fn().mockRejectedValue({ code }),
      };
      const service = new CallSignalingService(
        { callSignalingManager: manager } as any,
        new CallStore(),
      );
      const request = { callType: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
      await service.createCall({ ...request, targetUserIds: ['bob'] });
      manager.createCall.mockRejectedValueOnce({
        details: { rule: 'busy', operation: 'createCall' },
      });
      await expect(service.createCall({ ...request, targetUserIds: ['bob'] })).resolves.toBe(
        result,
      );
      expect(manager.createCall).toHaveBeenCalledTimes(3);
    },
  );
});
