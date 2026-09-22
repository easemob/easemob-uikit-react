import type { CallParticipant } from 'easemob-websdk';

export type ParticipantTerminalState =
  | 'rejected'
  | 'busy'
  | 'timeout'
  | 'canceled'
  | 'left'
  | 'hanguped';

export interface ParticipantDiff {
  added: ReadonlyArray<CallParticipant>;
  changed: ReadonlyArray<{ previous: CallParticipant; current: CallParticipant }>;
  removed: ReadonlyArray<CallParticipant>;
  waiting: ReadonlyArray<CallParticipant>;
  accepted: ReadonlyArray<CallParticipant>;
  terminal: ReadonlyArray<CallParticipant>;
}

const terminalStates = new Set<ParticipantTerminalState>([
  'rejected',
  'busy',
  'timeout',
  'canceled',
  'left',
  'hanguped',
]);

export function diffParticipants(
  previous: ReadonlyArray<CallParticipant>,
  current: ReadonlyArray<CallParticipant>,
): ParticipantDiff {
  const previousById = new Map(previous.map(item => [item.userId, item]));
  const currentById = new Map(current.map(item => [item.userId, item]));
  const added: CallParticipant[] = [];
  const changed: Array<{ previous: CallParticipant; current: CallParticipant }> = [];
  const waiting: CallParticipant[] = [];
  const accepted: CallParticipant[] = [];
  const terminal: CallParticipant[] = [];

  current.forEach(item => {
    const before = previousById.get(item.userId);
    if (!before) {
      added.push(item);
    } else if (
      before.state !== item.state ||
      before.deviceUuid !== item.deviceUuid ||
      before.acceptedAt !== item.acceptedAt ||
      before.leftAt !== item.leftAt
    ) {
      changed.push({ previous: before, current: item });
    }
    if (
      (item.state === 'pending' || item.state === 'ringing') &&
      (!before || before.state !== item.state)
    ) {
      waiting.push(item);
    }
    if (item.state === 'accepted' && before?.state !== 'accepted') accepted.push(item);
    if (
      terminalStates.has(item.state as ParticipantTerminalState) &&
      before?.state !== item.state
    ) {
      terminal.push(item);
    }
  });

  return {
    added,
    changed,
    removed: previous.filter(item => !currentById.has(item.userId)),
    waiting,
    accepted,
    terminal,
  };
}

export function isTerminalParticipant(participant: CallParticipant): boolean {
  return terminalStates.has(participant.state as ParticipantTerminalState);
}
