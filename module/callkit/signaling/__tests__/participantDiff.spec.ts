import { diffParticipants } from '../participantDiff';
import type { CallParticipant } from 'easemob-websdk';

const participant = (userId: string, state: CallParticipant['state']): CallParticipant => ({
  userId,
  state,
});

describe('diffParticipants', () => {
  it('detects accepted, terminal, added and removed participants', () => {
    const result = diffParticipants(
      [participant('a', 'pending'), participant('b', 'accepted'), participant('gone', 'pending')],
      [participant('a', 'accepted'), participant('b', 'left'), participant('new', 'ringing')],
    );

    expect(result.accepted.map(item => item.userId)).toEqual(['a']);
    expect(result.terminal.map(item => item.userId)).toEqual(['b']);
    expect(result.added.map(item => item.userId)).toEqual(['new']);
    expect(result.waiting.map(item => item.userId)).toEqual(['new']);
    expect(result.removed.map(item => item.userId)).toEqual(['gone']);
  });

  it('detects waiting transitions and metadata-only changes without repeating accepted', () => {
    const result = diffParticipants(
      [
        participant('waiting', 'pending'),
        { ...participant('accepted', 'accepted'), deviceUuid: 'device-1', acceptedAt: 1 },
      ],
      [
        participant('waiting', 'ringing'),
        { ...participant('accepted', 'accepted'), deviceUuid: 'device-2', acceptedAt: 2 },
      ],
    );

    expect(result.waiting.map(item => item.userId)).toEqual(['waiting']);
    expect(result.changed.map(item => item.current.userId)).toEqual(['waiting', 'accepted']);
    expect(result.accepted).toEqual([]);
  });
});
