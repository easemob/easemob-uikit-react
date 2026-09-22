import CallStore from '../CallStore';
import type { CallSnapshot } from 'easemob-websdk';

const snapshot = (revision: string, state: 'pending' | 'accepted'): CallSnapshot => ({
  callId: '0123456789abcdef0123456789abcdef',
  kind: 'single',
  mediaType: 'voice',
  lifecycle: 'open',
  creatorUserId: 'alice',
  participants: [{ userId: 'bob', state }],
  revision,
  createdAt: 1,
});

describe('CallStore', () => {
  it('ignores an older server snapshot revision', () => {
    const store = new CallStore();
    store.setSnapshot(snapshot('10', 'accepted'));
    store.setSnapshot(snapshot('9', 'pending'));

    expect(store.snapshot?.revision).toBe('10');
    expect(store.snapshot?.participants[0].state).toBe('accepted');
  });

  it('merges participant events only for the active call', () => {
    const store = new CallStore();
    store.setSnapshot(snapshot('1', 'pending'));
    store.setParticipants({
      callId: 'ffffffffffffffffffffffffffffffff',
      revision: '2',
      participants: [{ userId: 'bob', state: 'accepted' }],
    });
    expect(store.snapshot?.revision).toBe('1');

    store.setParticipants({
      callId: snapshot('1', 'pending').callId,
      revision: '2',
      participants: [{ userId: 'bob', state: 'accepted' }],
    });
    expect(store.snapshot?.participants[0].state).toBe('accepted');
  });
});
