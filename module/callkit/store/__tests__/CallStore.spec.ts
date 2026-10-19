import CallStore from '../CallStore';
import type { CallSnapshot } from 'easemob-websdk';

const snapshot = (state: 'pending' | 'accepted'): CallSnapshot => ({
  callId: '0123456789abcdef0123456789abcdef',
  callType: 'single',
  mediaType: 'voice',
  lifecycle: 'open',
  creatorUserId: 'alice',
  participants: [{ userId: 'bob', state }],
  createdAt: 1,
});

describe('CallStore', () => {
  it('accepts authoritative SDK snapshots without protocol revisions', () => {
    const store = new CallStore();
    store.setSnapshot(snapshot('pending'));
    store.setSnapshot(snapshot('accepted'));

    expect(store.snapshot?.participants[0].state).toBe('accepted');
    expect(store.snapshot).not.toHaveProperty('revision');
  });

  it('merges participant events only for the active call', () => {
    const store = new CallStore();
    store.setSnapshot(snapshot('pending'));
    store.setParticipants({
      callId: 'ffffffffffffffffffffffffffffffff',

      participants: [{ userId: 'bob', state: 'accepted' }],
    });

    expect(store.snapshot?.participants[0].state).toBe('pending');
    store.setParticipants({
      callId: snapshot('pending').callId,

      participants: [{ userId: 'bob', state: 'accepted' }],
    });
    expect(store.snapshot?.participants[0].state).toBe('accepted');
  });
});
