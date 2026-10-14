import { afterEach, describe, expect, it } from 'vitest';
import {
  CALL_RECORD_END_REASON,
  applyStoredCallRecord,
  buildCallRecordExt,
  defaultCallRecordContent,
  formatCallRecordFinalText,
  formatDurationMs,
  getCallRecordIcon,
  getCallRecordShownText,
  recoverUnfinishedCallRecords,
  resolveCallRecordContent,
  resolveCallRecordDurationMs,
  saveCallRecordPatch,
  toCallRecordEndReason,
} from '../callRecord';

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'callkit.record.duration') return `通话时长 ${options?.duration}`;
  if (key === 'callkit.record.cancel') return '已取消';
  if (key === 'callkit.record.ended') return '通话已结束';
  return key;
};

describe('call record message', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('builds the initial ext and keeps a custom invite text', () => {
    expect(buildCallRecordExt('call-1', 1)).toEqual({
      ecukRecordVersion: 1,
      ecukRecordCallId: 'call-1',
      ecukRecordMediaType: 1,
      ecukRecordEndReason: -1,
      ecukRecordDurationMs: 0,
      ecukRecordFinal: false,
    });
    expect(resolveCallRecordContent('  自定义邀请  ', 1)).toBe('自定义邀请');
    expect(resolveCallRecordContent('  ', 0)).toBe(defaultCallRecordContent(0));
  });

  it('maps end reasons and prefers signaling timestamps for duration', () => {
    expect(toCallRecordEndReason('cancel', { wasConnected: false, isCaller: true })).toBe(
      CALL_RECORD_END_REASON.cancel,
    );
    expect(toCallRecordEndReason('timeout', { wasConnected: false, isCaller: true })).toBe(
      CALL_RECORD_END_REASON.remoteNoResponse,
    );
    expect(toCallRecordEndReason('timeout', { wasConnected: false, isCaller: false })).toBe(
      CALL_RECORD_END_REASON.noResponse,
    );
    expect(toCallRecordEndReason('timeout', { wasConnected: true, isCaller: true })).toBe(
      CALL_RECORD_END_REASON.abnormalEnd,
    );
    expect(
      resolveCallRecordDurationMs({
        wasConnected: true,
        connectedAtMs: 1_000,
        now: 9_000,
        acceptedAt: 2_000,
        leftAt: 5_000,
      }),
    ).toBe(3_000);
    expect(resolveCallRecordDurationMs({ wasConnected: false, connectedAtMs: 1_000 })).toBe(0);
    expect(formatDurationMs(3_000)).toBe('00:00:03');
  });

  it('shows the invite text before the record is final and the result afterward', () => {
    const message = {
      ext: buildCallRecordExt('call-1', 0),
      body: { content: '邀请您进行语音通话' },
    };
    expect(getCallRecordShownText(message, t)).toBeUndefined();
    expect(getCallRecordIcon(message)).toBe('PHONE_PICK');

    message.ext.ecukRecordFinal = true;
    message.ext.ecukRecordEndReason = CALL_RECORD_END_REASON.hangup;
    message.ext.ecukRecordDurationMs = 65_000;
    expect(getCallRecordShownText(message, t)).toBe('通话时长 00:01:05');
    expect(getCallRecordIcon(message)).toBe('PHONE_HANG');
    expect(
      formatCallRecordFinalText({ ecukRecordEndReason: CALL_RECORD_END_REASON.cancel }, t),
    ).toBe('已取消');
  });

  it('marks an unfinished local record as abnormal the next time it is read', () => {
    saveCallRecordPatch('alice', 'call-1', { endReason: -1, durationMs: 12_000, final: false });
    expect(recoverUnfinishedCallRecords('alice')).toEqual(['call-1']);
    const message = {
      ext: buildCallRecordExt('call-1', 1),
      body: { content: '邀请您进行视频通话' },
    };
    applyStoredCallRecord(message, 'alice', t);
    expect(message.ext.ecukRecordFinal).toBe(true);
    expect(message.ext.ecukRecordEndReason).toBe(CALL_RECORD_END_REASON.abnormalEnd);
    expect(message.ext.ecukRecordDurationMs).toBe(12_000);
    expect(message.body.content).toBe('callkit.record.abnormalEnd');
  });
});
