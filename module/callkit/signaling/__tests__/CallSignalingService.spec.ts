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
});
