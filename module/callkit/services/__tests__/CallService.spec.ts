import { vi } from 'vitest';
import { CallService, CALL_STATUS, CALL_TYPE, HANGUP_REASON } from '../CallService';
import { CALL_RTC_EVENT } from '../../signaling/CallSignalingService';
import type { CallKitRTCProvider } from '../../types';
import CallStore from '../../store/CallStore';
import type { CallSnapshot } from 'easemob-websdk';

const createService = (userId = 'alice', useRTCToken = false, callStore?: CallStore) => {
  const getUserIdsWithRTCUids = vi.fn();
  const rtcProvider: CallKitRTCProvider = {
    getRTCTokenInfo: vi.fn().mockResolvedValue({ appId: 'app', rtcToken: '' }),
    getUserIdsWithRTCUids,
  };
  const onRemoteUserJoined = vi.fn();
  const onRemoteUserLeft = vi.fn();
  const onTalkingUsersChange = vi.fn();
  const onNetworkQualityChange = vi.fn();
  const onInvitationReceived = vi.fn();
  const onCallEnd = vi.fn();
  const onCallStart = vi.fn();
  const onCallError = vi.fn();
  const onRemoteVideoReady = vi.fn();
  const callSignaling = {
    start: vi.fn(),
    reportRinging: vi.fn(),
    acceptCall: vi.fn(),
    joinCall: vi.fn(),
    cancelCall: vi.fn(),
    rejectCall: vi.fn(),
    leaveCall: vi.fn(),
    terminateCall: vi.fn(),
    createCall: vi.fn(),
    syncCall: vi.fn(),
    inviteParticipants: vi.fn(),
  };
  const userInfoProvider = vi.fn(async (ids: string[]) => ids.map(id => ({ userId: id })));
  const connection = { getCurrentUserId: () => userId, getUserIdsWithRTCUids: vi.fn() };
  const service = new CallService({
    connection,
    callSignaling: callSignaling as any,
    callStore,
    rtcProvider,
    useRTCToken,
    userInfoProvider,
    onRemoteUserJoined,
    onRemoteUserLeft,
    onTalkingUsersChange,
    onNetworkQualityChange,
    onInvitationReceived,
    onCallEnd,
    onCallStart,
    onCallError,
    onRemoteVideoReady,
  });
  // Model an accepted audio call without involving IM signaling in RTC tests.
  (service as any).currentCallInfo = { channel: 'call', type: CALL_TYPE.AUDIO_1V1 };
  const client = {
    connectionState: 'DISCONNECTED',
    join: vi.fn().mockResolvedValue(userId),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    enableAudioVolumeIndicator: vi.fn(),
    getRemoteNetworkQuality: vi.fn().mockReturnValue({ bob: { uplinkNetworkQuality: 1 } }),
  };
  Object.assign(service, {
    client,
    rtcService: {
      join: (options: any) =>
        client.join(options.appId, options.channel, options.token, options.uid),
      publish: vi.fn(),
      unpublish: vi.fn(),
      leave: vi.fn(),
      subscribe: vi.fn(),
    },
    mediaService: {
      createAudioTrack: vi.fn().mockResolvedValue({}),
      createVideoTrack: vi.fn().mockResolvedValue({ enabled: true }),
      closeTrack: vi.fn(),
    },
    audioService: {
      resetSpeaker: vi.fn(),
      addRemoteTrack: vi.fn(),
      removeRemoteTrack: vi.fn(),
      play: vi.fn(),
      stop: vi.fn(),
      clearRemoteTracks: vi.fn(),
    },
  });
  return {
    service,
    client,
    connection,
    rtcProvider,
    getUserIdsWithRTCUids,
    userInfoProvider,
    onRemoteUserJoined,
    onRemoteUserLeft,
    onTalkingUsersChange,
    onNetworkQualityChange,
    onInvitationReceived,
    onCallEnd,
    onCallStart,
    onCallError,
    onRemoteVideoReady,
    callSignaling,
  };
};

describe('CallService IM userId as RTC UID', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it.each(['alice', '00123'])('joins with the exact IM string ID %s', async userId => {
    const { service, client, rtcProvider } = createService(userId);
    await service.joinCall();
    expect(rtcProvider.getRTCTokenInfo).toHaveBeenCalledWith({ channelName: 'call', userId });
    expect(client.join).toHaveBeenCalledWith('app', 'call', null, userId);
  });

  it('uses an account token and ignores the deprecated numeric UID', async () => {
    const { service, client, rtcProvider } = createService('alice', true);
    vi.mocked(rtcProvider.getRTCTokenInfo!).mockResolvedValue({
      appId: 'app',
      rtcToken: 'account-token',
      rtcUid: 1001,
    });
    await service.joinCall();
    expect(client.join).toHaveBeenCalledWith('app', 'call', 'account-token', 'alice');
  });

  it('requires a token when token validation is enabled', async () => {
    const { service, client } = createService('alice', true);
    vi.spyOn(service, 'hangup').mockResolvedValue(undefined);
    await service.joinCall();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('uses IM credentials with the same string userId when no provider is configured', async () => {
    const { service, client, connection } = createService('00123');
    Object.assign(service, { rtcProvider: undefined });
    Object.assign(connection, {
      getRTCTokenInfo: vi.fn().mockResolvedValue({ appId: 'app', rtcToken: '', rtcUid: 123 }),
    });
    await service.joinCall();
    expect(client.join).toHaveBeenCalledWith('app', 'call', null, '00123');
  });

  it('uses remote IM IDs for user info, callbacks, tracks and volume without mapping', async () => {
    const fixture = createService();
    const { service, client } = fixture;
    vi.spyOn(service, 'hangup').mockResolvedValue(undefined);
    await service.joinCall();
    const listener = (name: string) =>
      client.on.mock.calls.find((args: any[]) => args[0] === name)![1];
    const remote = { uid: 'bob', hasAudio: true, audioTrack: { play: vi.fn() } };
    await listener('user-joined')(remote);
    await listener('user-published')(remote, 'audio');
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    expect(fixture.userInfoProvider).toHaveBeenCalledWith(['bob']);
    expect(fixture.onRemoteUserJoined).toHaveBeenCalledWith('bob', 'group');
    expect(service.getRemoteAudioTrack('bob')).toBe(remote.audioTrack);
    listener('volume-indicator')([{ uid: 'bob', level: 100 }]);
    expect(fixture.onTalkingUsersChange).toHaveBeenCalledWith(['bob']);
    listener('network-quality')({ uplinkNetworkQuality: 2 });
    expect(fixture.onNetworkQualityChange).toHaveBeenCalledWith({
      bob: { uplinkNetworkQuality: 1 },
      alice: { uplinkNetworkQuality: 2 },
    });
    listener('user-left')(remote);
    expect(fixture.onRemoteUserLeft).toHaveBeenCalledWith('bob', expect.anything());
    expect(service.getRemoteAudioTrack('bob')).toBeNull();
    expect(fixture.getUserIdsWithRTCUids).not.toHaveBeenCalled();
    expect(fixture.connection.getUserIdsWithRTCUids).not.toHaveBeenCalled();
  });
});

describe('conference video after a participant rejoins', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('keeps an already subscribed video when signaling marks the participant accepted', () => {
    const { service, client, onRemoteVideoReady } = createService();
    const stream = {} as MediaStream;
    const videoTrack = {
      getMediaStream: () => stream,
      getMediaStreamTrack: () => ({ readyState: 'live' }),
    };
    Object.assign(client, {
      remoteUsers: [{ uid: 'bob', hasVideo: true, videoTrack }],
    });
    Object.assign(service, {
      currentCallInfo: { callId: 'call', type: CALL_TYPE.VIDEO_MULTI },
      callStatus: CALL_STATUS.IN_CALL,
    });
    (service as any).remoteVideoTracks.set('bob', videoTrack);
    (service as any).emitAcceptedParticipant({ userId: 'bob', state: 'accepted' });
    expect(onRemoteVideoReady).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'remote-bob', cameraEnabled: true, stream }),
    );
  });

  it('subscribes to an existing Agora video if the publication event was missed', async () => {
    const { service, client, onRemoteVideoReady } = createService();
    const stream = {} as MediaStream;
    const videoTrack = {
      getMediaStream: () => stream,
      getMediaStreamTrack: () => ({ readyState: 'live' }),
    };
    Object.assign(client, {
      remoteUsers: [{ uid: 'bob', hasVideo: true, videoTrack }],
    });
    Object.assign(service, {
      currentCallInfo: { callId: 'call', type: CALL_TYPE.VIDEO_MULTI },
      callStatus: CALL_STATUS.IN_CALL,
    });
    (service as any).emitAcceptedParticipant({ userId: 'bob', state: 'accepted' });
    vi.advanceTimersByTime(1500);
    await Promise.resolve();
    await Promise.resolve();
    expect((service as any).rtcService.subscribe).toHaveBeenCalledWith(
      (client as any).remoteUsers[0],
      'video',
    );
    expect(onRemoteVideoReady).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'remote-bob', cameraEnabled: true, stream }),
    );
  });

  it('drops the old stream when signaling reports that a participant left', () => {
    const { service } = createService();
    Object.assign(service, {
      currentCallInfo: { callId: 'call', type: CALL_TYPE.VIDEO_MULTI },
      callStatus: CALL_STATUS.IN_CALL,
    });
    (service as any).remoteVideoTracks.set('bob', { stop: vi.fn() });
    (service as any).remoteVideoStreams.set('bob', {});
    (service as any).pendingVideoTracks.set('remote-bob', {});
    (service as any).emitTerminalParticipant({ userId: 'bob', state: 'left' });
    expect((service as any).remoteVideoTracks.has('bob')).toBe(false);
    expect((service as any).remoteVideoStreams.has('bob')).toBe(false);
    expect((service as any).pendingVideoTracks.has('remote-bob')).toBe(false);
  });
});

describe('outgoing single call timeout reconciliation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const pendingCall: CallSnapshot = {
    callId: 'outgoing',
    kind: 'single',
    mediaType: 'voice',
    lifecycle: 'open',
    creatorUserId: 'alice',
    revision: '2',
    createdAt: 1,
    participants: [
      { userId: 'alice', state: 'accepted' },
      { userId: 'bob', state: 'pending' },
    ],
  };

  it('closes the caller page after the server times out even without a push', async () => {
    const { service, callSignaling } = createService();
    callSignaling.createCall.mockResolvedValue(pendingCall);
    callSignaling.syncCall.mockResolvedValue({
      ...pendingCall,
      lifecycle: 'ended',
      endReason: 'timeout',
      revision: '3',
      participants: [pendingCall.participants[0], { userId: 'bob', state: 'timeout' }],
    });
    const hangup = vi.spyOn(service, 'hangup').mockResolvedValue(undefined);
    await service.startCall({
      to: 'bob',
      msg: '',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    vi.advanceTimersByTime(31_000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(callSignaling.syncCall).toHaveBeenCalledWith('outgoing');
    expect(hangup).toHaveBeenCalledWith('timeout');
    expect(callSignaling.cancelCall).not.toHaveBeenCalled();
  });

  it('keeps an accepted call without further timeout checks', async () => {
    const { service, callSignaling } = createService();
    callSignaling.createCall.mockResolvedValue(pendingCall);
    callSignaling.syncCall.mockResolvedValue({
      ...pendingCall,
      revision: '3',
      participants: [pendingCall.participants[0], { userId: 'bob', state: 'accepted' }],
    });
    const hangup = vi.spyOn(service, 'hangup').mockResolvedValue(undefined);
    await service.startCall({
      to: 'bob',
      msg: '',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    vi.advanceTimersByTime(31_000);
    await Promise.resolve();
    vi.advanceTimersByTime(10_000);
    expect(callSignaling.syncCall).toHaveBeenCalledTimes(1);
    expect(hangup).not.toHaveBeenCalled();
  });

  it('ignores an old timeout check after a different call becomes current', async () => {
    const { service, callSignaling } = createService();
    callSignaling.createCall.mockResolvedValue(pendingCall);
    await service.startCall({
      to: 'bob',
      msg: '',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    Object.assign(service, { currentCallInfo: { callId: 'next-call', kind: 'single' } });
    vi.advanceTimersByTime(31_000);
    expect(callSignaling.syncCall).not.toHaveBeenCalled();
  });
});

describe('CallService incoming call lifecycle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const snapshot = (kind: 'single' | 'conference', accepted = false): CallSnapshot => ({
    callId: 'incoming',
    kind,
    mediaType: 'voice',
    lifecycle: 'open',
    creatorUserId: 'alice',
    revision: accepted ? '2' : '1',
    createdAt: 1,
    participants: [
      { userId: 'alice', state: 'accepted' },
      { userId: 'bob', state: accepted ? 'accepted' : 'ringing' },
    ],
  });

  it('accepts a new invitation for the same conference after the previous hangup finishes', async () => {
    const store = new CallStore();
    const { service, callSignaling, onInvitationReceived } = createService('bob', false, store);
    let finishHangup!: () => void;
    const endingCall = new Promise<void>(resolve => {
      finishHangup = resolve;
    });
    Object.assign(service, {
      currentCallInfo: { callId: 'incoming', kind: 'conference' },
      callStatus: CALL_STATUS.IN_CALL,
      endingCall,
    });
    callSignaling.reportRinging.mockResolvedValue(snapshot('conference'));
    callSignaling.acceptCall.mockResolvedValue(snapshot('conference', true));
    const invitation = {
      callId: 'incoming',
      kind: 'conference' as const,
      mediaType: 'voice' as const,
      inviter: { userId: 'alice' },
    };

    store.setInvitation(invitation);
    expect(onInvitationReceived).not.toHaveBeenCalled();

    // The previous hangup clears the store before the new invitation is handled.
    store.clear();
    Object.assign(service, {
      currentCallInfo: null,
      callStatus: CALL_STATUS.IDLE,
      endingCall: undefined,
    });
    finishHangup();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(onInvitationReceived).toHaveBeenCalledOnce();

    expect(store.invitation).toEqual(invitation);
    await service.answerCall(true);
    expect(callSignaling.acceptCall).toHaveBeenCalledWith('incoming');
  });

  it.each(['single', 'conference'] as const)(
    'keeps a %s incoming call ringing until the callee accepts',
    async kind => {
      const store = new CallStore();
      const fixture = createService('bob', false, store);
      const { service, client, callSignaling, rtcProvider, onInvitationReceived } = fixture;
      Object.assign(service, { currentCallInfo: null, callStatus: CALL_STATUS.IDLE });
      callSignaling.reportRinging.mockImplementation(async () => {
        store.setSnapshot(snapshot(kind));
        return store.snapshot;
      });
      const accept = async () => {
        store.setSnapshot(snapshot(kind, true));
        return store.snapshot;
      };
      callSignaling.acceptCall.mockImplementation(accept);
      callSignaling.joinCall.mockImplementation(accept);

      store.setInvitation({
        callId: 'incoming',
        kind,
        mediaType: 'voice',
        inviter: { userId: 'alice' },
      });
      // Flush the async reportRinging response and the invitation continuation.
      for (let i = 0; i < 5; i++) await Promise.resolve();

      expect(onInvitationReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'incoming',
          callerUserId: 'alice',
        }),
      );
      expect((service as any).callStatus).toBe(CALL_STATUS.ALERTING);
      expect((service as any).audioService.play).toHaveBeenCalledWith('incoming');
      expect(rtcProvider.getRTCTokenInfo).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
      expect((service as any).mediaService.createAudioTrack).not.toHaveBeenCalled();

      await service.answerCall(true);
      expect(callSignaling.acceptCall).toHaveBeenCalledWith('incoming');
      expect(callSignaling.joinCall).not.toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledOnce();
      expect(client.join).toHaveBeenCalledWith('app', 'incoming', null, 'bob');
    },
  );

  it('does not enter RTC or report connected when accepting fails', async () => {
    const { service, client, callSignaling } = createService('bob');
    Object.assign(service, {
      currentCallInfo: {
        callId: 'incoming',
        channel: 'incoming',
        kind: 'conference',
        type: CALL_TYPE.VIDEO_MULTI,
      },
      callStatus: CALL_STATUS.ALERTING,
    });
    const error = new Error('call invalid state');
    callSignaling.acceptCall.mockRejectedValue(error);
    callSignaling.syncCall.mockResolvedValue(snapshot('conference'));
    await expect(service.answerCall(true)).rejects.toBe(error);
    expect(client.join).not.toHaveBeenCalled();
    expect(service.getCallStatus()).toBe(CALL_STATUS.ALERTING);
    expect(callSignaling.syncCall).toHaveBeenCalledWith('incoming');
  });

  it('cleans up a timed out self without ending the ongoing conference', async () => {
    const store = new CallStore();
    const { service, callSignaling } = createService('bob', false, store);
    Object.assign(service, {
      currentCallInfo: {
        callId: 'incoming',
        channel: 'incoming',
        kind: 'conference',
        type: CALL_TYPE.VIDEO_MULTI,
      },
      callStatus: CALL_STATUS.ALERTING,
    });
    const hangup = vi.spyOn(service, 'hangup').mockResolvedValue(undefined);
    store.setSnapshot({
      ...snapshot('conference'),
      revision: '3',
      participants: [
        { userId: 'alice', state: 'accepted' },
        { userId: 'bob', state: 'timeout' },
      ],
    });
    expect(hangup).toHaveBeenCalledWith(HANGUP_REASON.TIMEOUT);
    expect((service as any).nativeEndRequested).toBe(true);
    expect(callSignaling.cancelCall).not.toHaveBeenCalled();
    expect(callSignaling.leaveCall).not.toHaveBeenCalled();
    expect(callSignaling.rejectCall).not.toHaveBeenCalled();
  });

  it('closes preview tracks without unpublishing before RTC join', async () => {
    const { service } = createService('bob');
    const videoTrack = { enabled: true, close: vi.fn() };
    Object.assign(service, { callStatus: CALL_STATUS.ALERTING });
    (service as any).rtc.localVideoTrack = videoTrack;
    await service.cleanupPreviewMode();
    expect((service as any).rtcService.unpublish).not.toHaveBeenCalled();
    expect((service as any).rtcService.leave).not.toHaveBeenCalled();
    expect(videoTrack.close).toHaveBeenCalledOnce();
  });

  it.each(['caller', 'callee'] as const)(
    'publishes camera and microphone for a conference %s',
    async role => {
      const { service, callSignaling, onRemoteVideoReady, onCallStart } = createService(
        role === 'caller' ? 'alice' : 'bob',
      );
      const stream = {} as MediaStream;
      vi.spyOn(service as any, 'getOrCreateLocalVideoStream').mockReturnValue(stream);
      if (role === 'caller') {
        callSignaling.createCall.mockResolvedValue({
          ...snapshot('conference'),
          mediaType: 'video',
        });
        await service.startCall({
          to: ['bob'],
          members: ['bob'],
          msg: 'join',
          chatType: 'groupChat',
          callType: CALL_TYPE.VIDEO_MULTI,
        });
      } else {
        Object.assign(service, {
          currentCallInfo: {
            callId: 'incoming',
            channel: 'incoming',
            kind: 'conference',
            type: CALL_TYPE.VIDEO_MULTI,
          },
          callStatus: CALL_STATUS.ALERTING,
        });
        await service.answerCall(true);
        expect(callSignaling.acceptCall).toHaveBeenCalledWith('incoming');
        expect(callSignaling.joinCall).not.toHaveBeenCalled();
      }
      expect((service as any).mediaService.createVideoTrack).toHaveBeenCalledOnce();
      expect((service as any).rtcService.publish).toHaveBeenCalledWith([
        (service as any).rtc.localAudioTrack,
        (service as any).rtc.localVideoTrack,
      ]);
      expect(onRemoteVideoReady).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'local',
          cameraEnabled: true,
          stream,
        }),
      );
      expect(service.getCallStatus()).toBe(CALL_STATUS.IN_CALL);
      expect(onCallStart).toHaveBeenCalledOnce();
      expect(onCallStart).toHaveBeenCalledWith([expect.objectContaining({ id: 'local' })]);
      await expect(service.addParticipants(['charlie'])).resolves.toBe(true);
      expect(callSignaling.inviteParticipants).toHaveBeenCalledWith('incoming', {
        userIds: ['charlie'],
        timeoutSeconds: 30,
      });
    },
  );

  it('continues a conference with audio when the camera is unavailable', async () => {
    const { service, onCallError } = createService('bob');
    Object.assign(service, {
      currentCallInfo: {
        callId: 'incoming',
        channel: 'incoming',
        kind: 'conference',
        type: CALL_TYPE.VIDEO_MULTI,
      },
      callStatus: CALL_STATUS.ALERTING,
    });
    (service as any).mediaService.createVideoTrack.mockRejectedValue(
      new Error('camera unavailable'),
    );
    await service.answerCall(true);
    expect((service as any).rtcService.publish).toHaveBeenCalledWith([
      (service as any).rtc.localAudioTrack,
    ]);
    expect(onCallError).toHaveBeenCalled();
    expect(service.getCallStatus()).toBe(CALL_STATUS.IN_CALL);
  });

  it('only auto joins the caller after the peer accepts', async () => {
    const store = new CallStore();
    const { service } = createService('alice', false, store);
    Object.assign(service, {
      currentCallInfo: {
        callId: 'incoming',
        channel: 'incoming',
        kind: 'single',
        callerUserId: 'alice',
        type: CALL_TYPE.AUDIO_1V1,
      },
      callStatus: CALL_STATUS.INVITING,
    });
    const join = vi.spyOn(service, 'joinCall').mockResolvedValue(undefined);
    store.setSnapshot(snapshot('single'));
    expect(join).not.toHaveBeenCalled();
    store.setSnapshot(snapshot('single', true));
    expect(join).toHaveBeenCalledOnce();
  });

  it('joins RTC once when multiple updates request joining concurrently', async () => {
    const { service, client, rtcProvider } = createService();
    let resolveToken!: (info: { appId: string; rtcToken: string }) => void;
    vi.mocked(rtcProvider.getRTCTokenInfo!).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveToken = resolve;
        }),
    );
    const first = service.joinCall();
    const second = service.joinCall();
    resolveToken({ appId: 'app', rtcToken: '' });
    await Promise.all([first, second]);
    expect(client.join).toHaveBeenCalledOnce();
  });

  it('leaves a stale RTC channel before publishing for a new invitation', async () => {
    const { service, client } = createService('bob');
    Object.assign(service, {
      currentCallInfo: {
        callId: 'next-call',
        channel: 'next-call',
        kind: 'conference',
        type: CALL_TYPE.AUDIO_MULTI,
      },
      callStatus: CALL_STATUS.ALERTING,
    });
    Object.assign(client, {
      connectionState: 'RECONNECTING',
      localTracks: [{ trackMediaType: 'video' }],
    });
    const rtcService = (service as any).rtcService;
    rtcService.leave.mockImplementation(async () => {
      Object.assign(client, { connectionState: 'DISCONNECTED', localTracks: [] });
    });

    await service.joinCall();

    expect(rtcService.leave).toHaveBeenCalledOnce();
    expect(client.join).toHaveBeenCalledOnce();
    expect(rtcService.leave.mock.invocationCallOrder[0]).toBeLessThan(
      client.join.mock.invocationCallOrder[0],
    );
    expect(rtcService.publish).toHaveBeenCalledOnce();
  });

  it('leaves the RTC channel when hanging up during Agora reconnection', async () => {
    const { service, client, callSignaling } = createService('bob');
    Object.assign(service, {
      currentCallInfo: {
        callId: 'old-call',
        channel: 'old-call',
        kind: 'conference',
        type: CALL_TYPE.VIDEO_MULTI,
      },
      callStatus: CALL_STATUS.IN_CALL,
    });
    Object.assign(client, { connectionState: 'RECONNECTING' });
    vi.spyOn(service as any, 'checkAndCleanupAllMediaTracks').mockResolvedValue(undefined);

    const hangup = service.hangup();
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(100);
    }
    await hangup;

    expect(callSignaling.leaveCall).toHaveBeenCalledWith('old-call');
    expect((service as any).rtcService.leave).toHaveBeenCalledOnce();
  });

  it.each([
    ['before another member accepts', undefined, false, 'cancelCall', 'leaveCall'],
    ['after another member accepts', 2, false, 'leaveCall', 'cancelCall'],
    [
      'after a member leaves with a stale establishment timestamp',
      undefined,
      true,
      'leaveCall',
      'cancelCall',
    ],
  ] as const)(
    'ends a conference %s with %s',
    async (_phase, establishedAt, memberLeft, operation, other) => {
      const store = new CallStore();
      const call = snapshot('conference');
      store.setSnapshot({
        ...call,
        establishedAt,
        participants: memberLeft
          ? [
              { userId: 'alice', state: 'accepted' },
              { userId: 'bob', state: 'left', acceptedAt: 2 },
            ]
          : call.participants,
      });
      const { service, callSignaling } = createService('alice', false, store);
      Object.assign(service, {
        currentCallInfo: {
          callId: 'incoming',
          channel: 'incoming',
          kind: 'conference',
          callerUserId: 'alice',
          type: CALL_TYPE.AUDIO_MULTI,
        },
        callStatus: CALL_STATUS.IN_CALL,
      });
      vi.spyOn(service as any, 'checkAndCleanupAllMediaTracks').mockResolvedValue(undefined);

      const hangup = service.hangup();
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await hangup;

      expect(callSignaling[operation]).toHaveBeenCalledWith('incoming');
      expect(callSignaling[other]).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['alice', CALL_STATUS.INVITING, HANGUP_REASON.NO_RESPONSE, 'syncCall'],
    ['alice', CALL_STATUS.INVITING, HANGUP_REASON.TIMEOUT, 'syncCall'],
    ['alice', CALL_STATUS.INVITING, HANGUP_REASON.ABNORMAL_END, 'cancelCall'],
    ['bob', CALL_STATUS.ALERTING, HANGUP_REASON.NO_RESPONSE, 'syncCall'],
    ['alice', CALL_STATUS.IN_CALL, HANGUP_REASON.ABNORMAL_END, 'terminateCall'],
  ] as const)(
    'releases the native slot when %s ends in state %s',
    async (userId, status, reason, operation) => {
      const { service, callSignaling, onCallEnd } = createService(userId);
      Object.assign(service, {
        currentCallInfo: {
          callId: 'old-call',
          channel: 'old-call',
          kind: 'single',
          callerUserId: 'alice',
          type: CALL_TYPE.AUDIO_1V1,
        },
        callStatus: status,
      });
      vi.spyOn(service as any, 'checkAndCleanupAllMediaTracks').mockResolvedValue(undefined);
      const first = service.hangup(reason);
      const duplicate = service.hangup(reason);
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await Promise.all([first, duplicate]);
      expect(callSignaling[operation]).toHaveBeenCalledOnce();
      expect(callSignaling[operation].mock.calls[0][0]).toBe('old-call');
      expect(service.getCallStatus()).toBe(CALL_STATUS.IDLE);
      expect(service.getCurrentCallInfo()).toBeNull();
      if (operation === 'syncCall') {
        expect(callSignaling.cancelCall).not.toHaveBeenCalled();
        expect(callSignaling.rejectCall).not.toHaveBeenCalled();
        expect(callSignaling.terminateCall).not.toHaveBeenCalled();
        expect(onCallEnd).toHaveBeenCalledWith('timeout', expect.anything());
      }
    },
  );

  it('preserves a server timeout event without sending a cancellation or query', async () => {
    const store = new CallStore();
    const { service, callSignaling, onCallEnd } = createService('alice', false, store);
    Object.assign(service, {
      currentCallInfo: {
        callId: 'old-call',
        channel: 'old-call',
        kind: 'single',
        callerUserId: 'alice',
        type: CALL_TYPE.AUDIO_1V1,
      },
      callStatus: CALL_STATUS.INVITING,
    });
    vi.spyOn(service as any, 'checkAndCleanupAllMediaTracks').mockResolvedValue(undefined);
    store.setEnded({ callId: 'old-call', reason: 'timeout' });
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(100);
    }
    expect(onCallEnd).toHaveBeenCalledWith('timeout', expect.anything());
    expect(callSignaling.syncCall).not.toHaveBeenCalled();
    expect(callSignaling.cancelCall).not.toHaveBeenCalled();
    expect(callSignaling.rejectCall).not.toHaveBeenCalled();
    expect(callSignaling.terminateCall).not.toHaveBeenCalled();
  });

  it('waits for old call cleanup before creating another call', async () => {
    const { service, callSignaling } = createService('alice');
    Object.assign(service, {
      currentCallInfo: {
        callId: 'old-call',
        channel: 'old-call',
        kind: 'single',
        callerUserId: 'alice',
        type: CALL_TYPE.AUDIO_1V1,
      },
      callStatus: CALL_STATUS.INVITING,
    });
    vi.spyOn(service as any, 'checkAndCleanupAllMediaTracks').mockResolvedValue(undefined);
    callSignaling.createCall.mockResolvedValue(snapshot('single'));
    const ending = service.hangup(HANGUP_REASON.NO_RESPONSE);
    const starting = service.startCall({
      to: 'bob',
      msg: '',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    expect(callSignaling.createCall).not.toHaveBeenCalled();
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(100);
    }
    await ending;
    expect(await starting).toEqual(snapshot('single'));
    expect(service.getCurrentCallInfo()?.callId).toBe('incoming');
    expect(service.getCallStatus()).toBe(CALL_STATUS.INVITING);
  });

  it('sends a call record text message with the record ext', async () => {
    const { service, connection, callSignaling } = createService('alice');
    const onCallRecordMessage = vi.fn();
    const createTextMessage = vi.fn(option => ({ ...option, type: 'text', msgLocalId: 'local-1' }));
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({
        type: 'text',
        msgLocalId: 'local-1',
        msgServerId: 'server-1',
        conversationId: 'bob',
        conversationType: 'singleChat',
        direct: 'SEND',
      })
      .mockRejectedValueOnce(new Error('network'));
    Object.assign(connection, { chatManager: { createTextMessage, sendMessage } });
    Object.assign(service, { onCallRecordMessage });
    callSignaling.createCall.mockResolvedValue(snapshot('single'));

    await service.startCall({
      to: 'bob',
      msg: '邀请您进行语音通话',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(createTextMessage).toHaveBeenCalledWith({
      conversationId: 'bob',
      conversationType: 'singleChat',
      content: '邀请您进行语音通话',
      ext: {
        ecukRecordVersion: 1,
        ecukRecordCallId: 'incoming',
        ecukRecordMediaType: 0,
        ecukRecordEndReason: -1,
        ecukRecordDurationMs: 0,
        ecukRecordFinal: false,
      },
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(onCallRecordMessage).toHaveBeenCalledWith(
      expect.objectContaining({ msgServerId: 'server-1' }),
    );
  });

  it('does not retry a call record message when sending fails', async () => {
    const { service, connection, callSignaling } = createService('alice');
    const onCallRecordMessage = vi.fn();
    const createTextMessage = vi.fn(option => ({ ...option, type: 'text', msgLocalId: 'local-1' }));
    const sendMessage = vi.fn().mockRejectedValue(new Error('network'));
    Object.assign(connection, { chatManager: { createTextMessage, sendMessage } });
    Object.assign(service, { onCallRecordMessage });
    callSignaling.createCall.mockResolvedValue(snapshot('single'));

    await service.startCall({
      to: 'bob',
      msg: '邀请您进行语音通话',
      chatType: 'singleChat',
      callType: CALL_TYPE.AUDIO_1V1,
    });
    for (let i = 0; i < 5; i++) await Promise.resolve();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(onCallRecordMessage).not.toHaveBeenCalled();
  });

  it('creates a conference for explicit users without an IM group and invites more users', async () => {
    const { service, callSignaling, onCallStart } = createService('alice');
    callSignaling.createCall.mockResolvedValue({
      ...snapshot('conference'),
      participants: [
        { userId: 'alice', state: 'accepted' },
        { userId: 'bob', state: 'pending' },
      ],
    });
    await service.startCall({
      to: ['bob', 'charlie'],
      members: ['bob', 'charlie'],
      msg: 'join',
      chatType: 'groupChat',
      callType: CALL_TYPE.AUDIO_MULTI,
    });
    expect(callSignaling.createCall).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'conference',
        mediaType: 'voice',
        targetUserIds: ['bob', 'charlie'],
        conversationId: undefined,
      }),
    );
    expect(service.getCallStatus()).toBe(CALL_STATUS.IN_CALL);
    expect(onCallStart).toHaveBeenCalledOnce();
    await expect(service.addParticipants(['david', 'emma'])).resolves.toBe(true);
    expect(callSignaling.inviteParticipants).toHaveBeenCalledWith('incoming', {
      userIds: ['david', 'emma'],
      timeoutSeconds: 30,
    });
  });

  it('reports microphone, camera and camera-switch RTC events', async () => {
    const { service, callSignaling } = createService('alice');
    const reportRtcEvent = vi.fn().mockResolvedValue(undefined);
    Object.assign(callSignaling, { reportRtcEvent });
    Object.assign(service, {
      currentCallInfo: { callId: 'incoming' },
      callStatus: CALL_STATUS.INVITING,
      rtc: {
        localAudioTrack: { enabled: true, setEnabled: vi.fn() },
        localVideoTrack: {
          enabled: true,
          close: vi.fn(),
          getMediaStreamTrack: () => ({ stop: vi.fn() }),
        },
      },
    });

    const openedVideoTrack = {
      enabled: true,
      close: vi.fn(),
      setDevice: vi.fn().mockResolvedValue(undefined),
      getMediaStreamTrack: () => ({ getSettings: () => ({ deviceId: 'camera-1' }), stop: vi.fn() }),
    };
    (service as any).mediaService.createVideoTrack.mockResolvedValue(openedVideoTrack);

    await expect(service.toggleMute()).resolves.toBe(false);
    await expect(service.toggleMute()).resolves.toBe(true);
    await expect(service.toggleCamera()).resolves.toBe(false);
    await expect(service.toggleCamera()).resolves.toBe(true);
    await expect(service.flipCamera('camera-2')).resolves.toBe(true);

    expect(reportRtcEvent.mock.calls.map(([, params]) => params.event)).toEqual([
      CALL_RTC_EVENT.microphoneOff,
      CALL_RTC_EVENT.microphoneOn,
      CALL_RTC_EVENT.cameraOff,
      CALL_RTC_EVENT.cameraOn,
      CALL_RTC_EVENT.switchCamera,
    ]);
    expect(reportRtcEvent).toHaveBeenCalledWith('incoming', { event: CALL_RTC_EVENT.switchCamera });
  });

  it('does not add users to a single call', async () => {
    const { service, callSignaling } = createService();
    await expect(service.addParticipants(['bob'])).resolves.toBe(false);
    expect(callSignaling.inviteParticipants).not.toHaveBeenCalled();
  });
});
