import CallSignalingService from '../CallSignalingService';
import CallStore from '../../store/CallStore';
import type { CallSnapshot } from 'easemob-websdk';

const result: CallSnapshot = {
  callId: '0123456789abcdef0123456789abcdef',
  kind: 'single',
  mediaType: 'voice',
  lifecycle: 'open',
  creatorUserId: 'alice',
  participants: [{ userId: 'bob', state: 'pending' }],
  revision: '1',
  createdAt: 1,
};

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
      kind: 'single',
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

    await service.createCall({ kind: 'single', mediaType: 'voice', targetUserIds: ['bob'] });

    expect(manager.createCall).toHaveBeenCalledWith({
      kind: 'single',
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
      kind: 'single',
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
    const request = { kind: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
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
      const request = { kind: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
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
      const request = { kind: 'single', mediaType: 'voice', targetUserIds: ['bob'] } as const;
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
