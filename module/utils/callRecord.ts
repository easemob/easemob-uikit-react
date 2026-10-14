import i18n from 'i18next';
import { getTextContent } from './message';

/** 通话记录文本消息格式版本。存在该字段即表示这是通话记录，不是呼叫信令。 */
export const CALL_RECORD_VERSION = 1;

export const CALL_RECORD_MEDIA_TYPE = {
  singleAudio: 0,
  singleVideo: 1,
  groupCall: 2,
} as const;

export const CALL_RECORD_END_REASON = {
  ongoing: -1,
  hangup: 0,
  cancel: 1,
  remoteCancel: 2,
  refuse: 3,
  remoteRefuse: 4,
  busy: 5,
  noResponse: 6,
  remoteNoResponse: 7,
  handleOnOtherDevice: 8,
  abnormalEnd: 9,
} as const;

export interface CallRecordExt {
  ecukRecordVersion: number;
  ecukRecordCallId: string;
  ecukRecordMediaType: number;
  ecukRecordEndReason: number;
  ecukRecordDurationMs: number;
  ecukRecordFinal: boolean;
}

export interface CallRecordPatch {
  endReason: number;
  durationMs: number;
  final: boolean;
}

type RecordMessage = {
  msgServerId?: string;
  ext?: Record<string, any>;
  body?: { content?: string };
};

const INVITE_TEXT: Record<number, { key: string; fallback: string }> = {
  [CALL_RECORD_MEDIA_TYPE.singleAudio]: {
    key: 'callkit.invitation.audioCallDescription',
    fallback: '邀请您进行语音通话',
  },
  [CALL_RECORD_MEDIA_TYPE.singleVideo]: {
    key: 'callkit.invitation.videoCallDescription',
    fallback: '邀请您进行视频通话',
  },
  [CALL_RECORD_MEDIA_TYPE.groupCall]: {
    key: 'callkit.invitation.groupCallDescription',
    fallback: '邀请您进行群通话',
  },
};

const FINAL_TEXT_KEY: Record<number, string> = {
  [CALL_RECORD_END_REASON.hangup]: 'callkit.record.duration',
  [CALL_RECORD_END_REASON.cancel]: 'callkit.record.cancel',
  [CALL_RECORD_END_REASON.remoteCancel]: 'callkit.record.remoteCancel',
  [CALL_RECORD_END_REASON.refuse]: 'callkit.record.refuse',
  [CALL_RECORD_END_REASON.remoteRefuse]: 'callkit.record.remoteRefuse',
  [CALL_RECORD_END_REASON.busy]: 'callkit.record.busy',
  [CALL_RECORD_END_REASON.noResponse]: 'callkit.record.noResponse',
  [CALL_RECORD_END_REASON.remoteNoResponse]: 'callkit.record.remoteNoResponse',
  [CALL_RECORD_END_REASON.handleOnOtherDevice]: 'callkit.record.handleOnOtherDevice',
  [CALL_RECORD_END_REASON.abnormalEnd]: 'callkit.record.abnormalEnd',
};

const STORAGE_PREFIX = 'easemob.uikit.callRecord.v1';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export function callTypeToRecordMediaType(callType: number): 0 | 1 | 2 {
  if (callType === 0) return CALL_RECORD_MEDIA_TYPE.singleAudio;
  if (callType === 1) return CALL_RECORD_MEDIA_TYPE.singleVideo;
  return CALL_RECORD_MEDIA_TYPE.groupCall;
}

export function buildCallRecordExt(callId: string, mediaType: number): CallRecordExt {
  return {
    ecukRecordVersion: CALL_RECORD_VERSION,
    ecukRecordCallId: callId,
    ecukRecordMediaType: mediaType,
    ecukRecordEndReason: CALL_RECORD_END_REASON.ongoing,
    ecukRecordDurationMs: 0,
    ecukRecordFinal: false,
  };
}

export function defaultCallRecordContent(mediaType: number): string {
  const entry = INVITE_TEXT[mediaType] || INVITE_TEXT[CALL_RECORD_MEDIA_TYPE.groupCall];
  const translated = i18n.t(entry.key);
  if (!translated || translated === entry.key) return entry.fallback;
  return String(translated);
}

export function resolveCallRecordContent(msg: string | undefined, mediaType: number): string {
  const custom = msg?.trim();
  return custom || defaultCallRecordContent(mediaType);
}

export function isCallRecordExt(ext?: Record<string, any> | null): boolean {
  return ext?.ecukRecordVersion != null;
}

export function isLegacyRtcInvite(ext?: Record<string, any> | null): boolean {
  return ext?.msgType === 'rtcCallWithAgora';
}

export function isCallRecordMessage(message?: { ext?: Record<string, any> } | null): boolean {
  return isCallRecordExt(message?.ext) || isLegacyRtcInvite(message?.ext);
}

export function toCallRecordEndReason(
  reason: string,
  context: { wasConnected: boolean; isCaller: boolean },
): number {
  switch (reason) {
    case 'hangup':
      return CALL_RECORD_END_REASON.hangup;
    case 'cancel':
      return CALL_RECORD_END_REASON.cancel;
    case 'remoteCancel':
      return CALL_RECORD_END_REASON.remoteCancel;
    case 'refuse':
      return CALL_RECORD_END_REASON.refuse;
    case 'remoteRefuse':
      return CALL_RECORD_END_REASON.remoteRefuse;
    case 'busy':
      return CALL_RECORD_END_REASON.busy;
    case 'noResponse':
      return CALL_RECORD_END_REASON.noResponse;
    case 'remoteNoResponse':
      return CALL_RECORD_END_REASON.remoteNoResponse;
    case 'handleOnOtherDevice':
      return CALL_RECORD_END_REASON.handleOnOtherDevice;
    case 'abnormalEnd':
      return CALL_RECORD_END_REASON.abnormalEnd;
    case 'timeout':
      if (context.wasConnected) return CALL_RECORD_END_REASON.abnormalEnd;
      return context.isCaller
        ? CALL_RECORD_END_REASON.remoteNoResponse
        : CALL_RECORD_END_REASON.noResponse;
    default:
      return CALL_RECORD_END_REASON.abnormalEnd;
  }
}

export function resolveCallRecordDurationMs(input: {
  wasConnected: boolean;
  connectedAtMs?: number;
  now?: number;
  acceptedAt?: number;
  leftAt?: number;
  establishedAt?: number;
  endedAt?: number;
}): number {
  if (!input.wasConnected) return 0;
  const started = input.acceptedAt || input.establishedAt;
  const ended = input.leftAt || input.endedAt;
  if (started && ended && ended >= started) return ended - started;
  if (input.connectedAtMs) {
    return Math.max(0, (input.now ?? Date.now()) - input.connectedAtMs);
  }
  return 0;
}

export function formatDurationMs(durationMs: number): string {
  const total = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

export function formatCallRecordFinalText(
  ext: Record<string, any> | undefined,
  t: Translate,
): string {
  const reason = Number(ext?.ecukRecordEndReason);
  if (reason === CALL_RECORD_END_REASON.hangup) {
    return t('callkit.record.duration', {
      duration: formatDurationMs(Number(ext?.ecukRecordDurationMs) || 0),
    });
  }
  return t(FINAL_TEXT_KEY[reason] || 'callkit.record.ended');
}

/** 新通话记录在结束后展示结果文案；未结束时返回 undefined，沿用消息正文。 */
export function getCallRecordShownText(
  message: RecordMessage | undefined,
  t: Translate,
): string | undefined {
  const ext = message?.ext;
  if (isCallRecordExt(ext)) {
    if (ext?.ecukRecordFinal) return formatCallRecordFinalText(ext, t);
    return undefined;
  }
  if (isLegacyRtcInvite(ext) && !message?.msgServerId && ext?.rtcIsEnd == undefined) {
    return t('callkit.record.ended');
  }
  return undefined;
}

export function getGroupCallRecordNoticeText(message: RecordMessage, t: Translate): string {
  const ext = message.ext;
  if (isCallRecordExt(ext)) {
    if (ext?.ecukRecordFinal) return formatCallRecordFinalText(ext, t);
    return getTextContent(message as never);
  }
  if (ext?.rtcIsEnd || (!message.msgServerId && ext?.rtcIsEnd == undefined)) {
    return t('callkit.record.ended');
  }
  return getTextContent(message as never);
}

export function getCallRecordIcon(
  message?: RecordMessage | null,
): 'PHONE_HANG' | 'VIDEO_CAMERA' | 'PHONE_PICK' {
  const ext = message?.ext;
  const mediaType = ext?.ecukRecordMediaType ?? ext?.type;
  const ended = isCallRecordExt(ext)
    ? ext?.ecukRecordFinal === true
    : Boolean(ext?.rtcIsEnd || !message?.msgServerId);
  if (!ended) return 'PHONE_PICK';
  return mediaType === 0 ? 'PHONE_HANG' : 'VIDEO_CAMERA';
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId || 'anonymous'}`;
}

function readStoredRecords(userId: string): Record<string, CallRecordPatch> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CallRecordPatch>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredRecords(userId: string, records: Record<string, CallRecordPatch>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(records));
  } catch {
    // 本地记录写失败不影响通话本身。
  }
}

export function saveCallRecordPatch(userId: string, callId: string, patch: CallRecordPatch) {
  if (!callId) return;
  const records = readStoredRecords(userId);
  records[callId] = patch;
  writeStoredRecords(userId, records);
}

export function getStoredCallRecord(userId: string, callId: string): CallRecordPatch | undefined {
  return readStoredRecords(userId)[callId];
}

/** 下次进入时，把仍未结束的本地记录标成异常结束，并保留最后一次写入的时长。 */
export function recoverUnfinishedCallRecords(userId: string): string[] {
  const records = readStoredRecords(userId);
  const recovered: string[] = [];
  Object.entries(records).forEach(([callId, patch]) => {
    if (patch?.final) return;
    records[callId] = {
      endReason: CALL_RECORD_END_REASON.abnormalEnd,
      durationMs: Number(patch?.durationMs) || 0,
      final: true,
    };
    recovered.push(callId);
  });
  if (recovered.length) writeStoredRecords(userId, records);
  return recovered;
}

export function applyStoredCallRecord<T extends RecordMessage>(
  message: T,
  userId: string,
  t?: Translate,
): T {
  const callId = message.ext?.ecukRecordCallId;
  if (!isCallRecordExt(message.ext) || !callId) return message;
  const stored = getStoredCallRecord(userId, String(callId));
  if (!stored) return message;
  message.ext = {
    ...message.ext,
    ecukRecordEndReason: stored.endReason,
    ecukRecordDurationMs: stored.durationMs,
    ecukRecordFinal: stored.final,
  };
  if (stored.final && message.body && t) {
    message.body = {
      ...message.body,
      content: formatCallRecordFinalText(message.ext, t),
    };
  }
  return message;
}
