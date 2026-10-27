import { expect, test, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { decodeMessagePush } from '../../../websdk2/src/protocol/call-signaling/codec';
import { inspectGatewayDelivery } from '../../../websdk2/src/protocol/sync-gateway/connect-codec';

type Account = { userId: string; token?: string; password?: string };
type Snapshot = {
  callId: string;
  callType: string;
  mediaType: string;
  lifecycle: string;
  endReason?: string;
  creatorUserId: string;
  createdAt: number;
  establishedAt?: number;
  endedAt?: number;
  conversationId?: string;
  ext?: string;
  participants: {
    userId: string;
    state: string;
    deviceUuid?: string;
    acceptedAt?: number;
    leftAt?: number;
  }[];
};
type SignalEvent = { name: string; payload: Record<string, any> };
type Result =
  | { ok: true; value: Snapshot }
  | { ok: false; error: { code?: number; message: string; details?: unknown } };
type Client = { context: BrowserContext; page: Page; account: Account };

async function closeClient(client: Client): Promise<void> {
  if (!client.page.isClosed()) {
    await client.page
      .evaluate(async () => (window as any).rootStore?.client?.logout())
      .catch(() => undefined);
  }
  await client.context.close().catch(() => undefined);
}

const appKey = process.env.EASEMOB_APPKEY;
const accounts: Record<'A' | 'B' | 'C' | 'D', Account> = {
  A: {
    userId: process.env.EASEMOB_USERID ?? '',
    token: process.env.EASEMOB_TOKEN,
    password: process.env.EASEMOB_PASSWORD,
  },
  B: {
    userId: process.env.EASEMOB_SECOND_USERID ?? '',
    token: process.env.EASEMOB_SECOND_TOKEN,
    password: process.env.EASEMOB_SECOND_PASSWORD,
  },
  C: {
    userId: process.env.EASEMOB_THIRD_USERID ?? '',
    token: process.env.EASEMOB_THIRD_TOKEN,
    password: process.env.EASEMOB_THIRD_PASSWORD,
  },
  D: {
    userId: process.env.EASEMOB_FOURTH_USERID ?? '',
    token: process.env.EASEMOB_FOURTH_TOKEN,
    password: process.env.EASEMOB_FOURTH_PASSWORD,
  },
};
const ready = (name: keyof typeof accounts) =>
  Boolean(accounts[name].userId && (accounts[name].token || accounts[name].password));
const two = Boolean(appKey && ready('A') && ready('B'));
const three = Boolean(two && ready('C'));
const four = Boolean(three && ready('D'));

async function login(browser: Browser, account: Account): Promise<Client> {
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
  });
  const page = await context.newPage();
  try {
    await page.goto('/demo/callkit/call-demo.html?useFixedDeviceId=false');
    if (process.env.EASEMOB_E2E_SERVICE_MODE === 'custom') {
      await page.getByRole('combobox').selectOption('custom');
      await page
        .getByPlaceholder('例如 https://a1.example.com')
        .fill(process.env.EASEMOB_REST_URL ?? '');
      await page
        .getByPlaceholder('例如 wss://im.example.com/websocket')
        .fill(process.env.EASEMOB_WS_URL ?? '');
    }
    await page.getByPlaceholder('输入App Key').fill(appKey!);
    await page.getByPlaceholder('输入用户ID,或群组 ID').fill(account.userId);
    if (account.token)
      await page.getByPlaceholder('输入 Token；填写后优先使用 Token 登录').fill(account.token);
    else await page.getByPlaceholder('未填写 Token 时，使用密码换取 Token').fill(account.password!);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(page.getByRole('button', { name: /^登出/ })).toBeVisible();
    expect(await page.evaluate(() => (window as any).rootStore.initConfig.isFixedDeviceId)).toBe(
      false,
    );
    // Provider connects signaling before CallKit mounts. Leave CallKit unmounted so
    // these cases exercise the SDK API without automatic ringing or RTC behavior.
    await page.waitForFunction(
      () => {
        const manager = (window as any).rootStore?.client?.callSignalingManager;
        return manager?.controller?.getState?.() === 'ready';
      },
      undefined,
      { timeout: 45_000 },
    );
    await page.evaluate(() => {
      const client = (window as any).rootStore.client;
      const manager = client.callSignalingManager;
      const events: SignalEvent[] = [];
      (window as any).__signalingEvents = events;
      (window as any).__connectionEvents = [];
      client.addEventHandler('playwright-connection', {
        onConnected: () => (window as any).__connectionEvents.push({ name: 'connected' }),
        onDisconnected: (error: any) =>
          (window as any).__connectionEvents.push({
            name: 'disconnected',
            code: error?.errorCode ?? error?.code,
            message: error?.message,
          }),
      });
      const record = (name: string) => (payload: Record<string, any>) =>
        events.push({ name, payload });
      manager.addEventHandler('playwright-signaling', {
        onInvitationReceived: record('invitation'),
        onParticipantsChanged: record('participants'),
        onParticipantsInvited: record('invited'),
        onHandledOnOtherDevice: record('otherDevice'),
        onCallEnded: record('ended'),
      });
    });
    // The Fusion handshake can finish before the route directory publishes this device.
    await page.waitForTimeout(1000);
    return { context, page, account };
  } catch (error) {
    await context.close().catch(() => undefined);
    throw error;
  }
}

async function command(client: Client, method: string, ...args: unknown[]): Promise<Result> {
  return client.page.evaluate(
    async ({ method, args }) => {
      const manager = (window as any).rootStore?.client?.callSignalingManager;
      try {
        const value = await manager[method](...args);
        return { ok: true, value };
      } catch (error) {
        const failure = error as { code?: number; message?: string; details?: unknown };
        return {
          ok: false,
          error: {
            code: failure.code,
            message: failure.message ?? String(error),
            details: failure.details,
          },
        };
      }
    },
    { method, args },
  );
}

async function success(client: Client, method: string, ...args: unknown[]): Promise<Snapshot> {
  const result = await command(client, method, ...args);
  expect(result, `${method}: ${JSON.stringify(result)}`).toMatchObject({ ok: true });
  return (result as Extract<Result, { ok: true }>).value;
}

async function waitForAvailableSnapshot(client: Client, callId: string): Promise<Snapshot> {
  let snapshot: Snapshot | undefined;
  await expect
    .poll(
      async () => {
        const result = await command(client, 'getCallSnapshot', callId);
        if (result.ok) snapshot = result.value;
        return result;
      },
      {
        message: `getCallSnapshot should become available after reconnect: ${callId}`,
        timeout: 45_000,
      },
    )
    .toMatchObject({ ok: true });
  return snapshot!;
}

function participant(snapshot: Snapshot, userId: string) {
  const found = snapshot.participants.find(item => item.userId === userId);
  expect(found, `missing participant ${userId}`).toBeDefined();
  return found!;
}

function expectAwaitingAnswer(snapshot: Snapshot, userId: string): void {
  const member = participant(snapshot, userId);
  expect(['pending', 'ringing']).toContain(member.state);
  expect(member.acceptedAt).toBeUndefined();
  if (member.state === 'pending') expect(member.deviceUuid ?? '').toBe('');
  else expect(member.deviceUuid).toBeTruthy();
}

function expectOpenSnapshot(snapshot: Snapshot, callId: string): void {
  expect(snapshot.callId).toBe(callId);
  expect(snapshot.callId).toMatch(/^[0-9a-f]{32}$/i);
  expect(snapshot.lifecycle).toBe('open');
  expect(snapshot.endReason).toBeUndefined();
  expect(snapshot.endedAt).toBeUndefined();
  expect(snapshot.createdAt).toBeGreaterThan(0);
  expect(new Set(snapshot.participants.map(item => item.userId)).size).toBe(
    snapshot.participants.length,
  );
}

function expectEndedSnapshot(snapshot: Snapshot, callId: string, reason: string): void {
  expect(snapshot.callId).toBe(callId);
  expect(snapshot.lifecycle).toBe('ended');
  expect(snapshot.endReason).toBe(reason);
  expect(snapshot.endedAt).toBeGreaterThanOrEqual(snapshot.createdAt);
}

async function expectSnapshotsConverged(clients: Client[], expected: Snapshot): Promise<void> {
  for (const client of clients) {
    const snapshot = await success(client, 'getCallSnapshot', expected.callId);
    expect(snapshot).toEqual(expected);
  }
}

async function events(client: Client): Promise<SignalEvent[]> {
  return client.page.evaluate(() => (window as any).__signalingEvents ?? []);
}

async function installCallPushTrace(client: Client): Promise<void> {
  await client.page.evaluate(() => {
    const manager = (window as any).rootStore.client.callSignalingManager;
    const trace: { frames: number[][]; decoded: Record<string, unknown>[] } = {
      frames: [],
      decoded: [],
    };
    (window as any).__callPushTrace = trace;
    const originalFrame = manager.onGatewayFrame.bind(manager);
    manager.onGatewayFrame = (bytes: Uint8Array) => {
      trace.frames.push(Array.from(bytes));
      return originalFrame(bytes);
    };
    const originalConsume = manager.consumePush.bind(manager);
    manager.consumePush = (body: Record<string, unknown>) => {
      trace.decoded.push({
        type: body.type,
        callId: body.callId,
        handleType: body.handleType,
        reason: body.reason,
      });
      return originalConsume(body);
    };
  });
}

async function attachCallPushTrace(
  info: TestInfo,
  label: string,
  client: Client,
  callId: string | undefined,
): Promise<void> {
  const trace = await client.page.evaluate(id => {
    const manager = (window as any).rootStore.client.callSignalingManager;
    return {
      ...(window as any).__callPushTrace,
      events: ((window as any).__signalingEvents ?? [])
        .filter((event: SignalEvent) => event.payload.callId === id)
        .map((event: SignalEvent) => ({
          name: event.name,
          callId: event.payload.callId,
          handleType: event.payload.handleType,
          reason: event.payload.reason,
        })),
      device: manager.sessionDevice,
      slot: manager.guard.getSlot(),
      ready: manager.controller?.getState?.(),
    };
  }, callId);
  const frames = trace.frames.map((raw: number[]) => {
    const bytes = Uint8Array.from(raw);
    const inspection = inspectGatewayDelivery(bytes);
    if (inspection?.type !== 24) return { type: inspection?.type ?? null };
    try {
      const push = decodeMessagePush(bytes);
      return {
        type: inspection.type,
        msgId: push?.msgId,
        channelId: push?.channelId,
        bodies: push?.bodies.map(body => ({
          type: body.type,
          callId: body.callId,
          handleType: body.type === 'handledOnOtherDevice' ? body.handleType : undefined,
          reason: body.type === 'callEnded' ? body.reason : undefined,
        })),
        byteLength: bytes.length,
      };
    } catch (error) {
      return { type: inspection.type, byteLength: bytes.length, decodeError: String(error) };
    }
  });
  console.log('call push trace', JSON.stringify({ label, callId, ...trace, frames }));
  await info.attach(`${label}-call-push-trace.json`, {
    body: Buffer.from(JSON.stringify({ callId, ...trace, frames }, null, 2)),
    contentType: 'application/json',
  });
}

async function waitEvent(
  client: Client,
  name: string,
  callId: string,
  predicate?: (event: SignalEvent) => boolean,
): Promise<SignalEvent> {
  let found: SignalEvent | undefined;
  await expect
    .poll(
      async () => {
        found = (await events(client)).find(
          event =>
            event.name === name &&
            event.payload.callId === callId &&
            (!predicate || predicate(event)),
        );
        return Boolean(found);
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return found!;
}

async function waitState(
  client: Client,
  callId: string,
  userId: string,
  state: string,
): Promise<Snapshot> {
  let snapshot: Snapshot | undefined;
  await expect
    .poll(
      async () => {
        const result = await command(client, 'getCallSnapshot', callId);
        if (result.ok) snapshot = result.value;
        return snapshot?.participants.find(item => item.userId === userId)?.state;
      },
      { timeout: 30_000, intervals: [500, 1000, 2000] },
    )
    .toBe(state);
  return snapshot!;
}

async function cleanup(clients: Client[], callIds: string[]): Promise<void> {
  for (const callId of callIds) {
    const owner = clients.find(client => client.account.userId === accounts.A.userId);
    if (!owner || owner.page.isClosed()) continue;
    const result = await command(owner, 'getCallSnapshot', callId).catch(() => null);
    if (!result?.ok || result.value.lifecycle !== 'open') continue;
    const method =
      result.value.callType === 'single'
        ? result.value.establishedAt
          ? 'hangup'
          : 'cancelCall'
        : result.value.establishedAt
        ? 'leaveCall'
        : 'cancelCall';
    await command(owner, method, callId).catch(() => undefined);
    if (result.value.callType === 'conference') {
      for (const client of clients.filter(client => client !== owner)) {
        if (
          !client.page.isClosed() &&
          result.value.participants.some(
            p => p.userId === client.account.userId && p.state === 'accepted',
          )
        ) {
          await command(client, 'leaveCall', callId).catch(() => undefined);
        }
      }
    }
  }
  await Promise.allSettled(clients.map(closeClient));
}

async function withClients(
  browser: Browser,
  names: (keyof typeof accounts)[],
  run: (clients: Record<string, Client>, callIds: string[]) => Promise<void>,
) {
  const clients: Client[] = [];
  const byName: Record<string, Client> = {};
  const callIds: string[] = [];
  try {
    for (const name of names) {
      const client = await login(browser, accounts[name]);
      clients.push(client);
      byName[name] = client;
    }
    await run(byName, callIds);
  } finally {
    await cleanup(clients, callIds);
  }
}

async function create(
  a: Client,
  ids: string[],
  callType: 'single' | 'conference',
  mediaType: 'voice' | 'video',
  targets: string[],
  options: Record<string, unknown> = {},
) {
  const snapshot = await success(a, 'createCall', {
    callType,
    mediaType,
    targetUserIds: targets,
    ...options,
  });
  ids.push(snapshot.callId);
  expect(snapshot).toMatchObject({ callType, mediaType, lifecycle: 'open' });
  return snapshot;
}

test.describe('real call signaling API', () => {
  test.skip(!two, '需要配置 EASEMOB_APPKEY 和 A、B 两个真实账号');

  for (const mediaType of ['voice', 'video'] as const) {
    test(`A-01/A-02 ${mediaType} ringing, accept and terminate`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const created = await create(A, ids, 'single', mediaType, [B.account.userId]);
        expect(participant(created, A.account.userId).state).toBe('accepted');
        expect(participant(created, B.account.userId).state).toBe('pending');
        expect((await waitEvent(B, 'invitation', created.callId)).payload).toMatchObject({
          callType: 'single',
          mediaType,
        });
        await success(B, 'reportRinging', created.callId);
        await waitState(A, created.callId, B.account.userId, 'ringing');
        const accepted = await success(B, 'acceptCall', created.callId);
        expect(participant(accepted, B.account.userId).state).toBe('accepted');
        expect(accepted.establishedAt).toBeGreaterThan(0);
        const ended = await success(A, 'hangup', created.callId);
        expect(ended).toMatchObject({ lifecycle: 'ended', endReason: 'hangup' });
        expect((await waitEvent(B, 'ended', created.callId)).payload.reason).toBe('hangup');
      });
    });
  }

  test('A-03/A-04 callee can accept without ringing and terminate', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      expect(participant(await success(B, 'acceptCall', call.callId), B.account.userId).state).toBe(
        'accepted',
      );
      expect((await success(B, 'hangup', call.callId)).endReason).toBe('hangup');
      expect((await waitEvent(A, 'ended', call.callId)).payload.reason).toBe('hangup');
    });
  });

  test('A-06 conversationId and ext reach callee', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const conversationId = `e2e-${Date.now()}`;
      const ext = '{"source":"playwright"}';
      const call = await create(A, ids, 'single', 'voice', [B.account.userId], {
        conversationId,
        ext,
      });
      expect(call).toMatchObject({ conversationId, ext });
      expect((await waitEvent(B, 'invitation', call.callId)).payload).toMatchObject({
        conversationId,
        ext,
      });
      const [aSnapshot, bSnapshot] = await Promise.all([
        success(A, 'getCallSnapshot', call.callId),
        success(B, 'getCallSnapshot', call.callId),
      ]);
      expect(aSnapshot).toMatchObject({ conversationId, ext });
      expect(bSnapshot).toMatchObject({ conversationId, ext });
      expect(bSnapshot).toEqual(aSnapshot);
    });
  });

  test('B-01 caller cancellation', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      const ended = await success(A, 'cancelCall', call.callId);
      expect(ended).toMatchObject({ lifecycle: 'ended', endReason: 'canceled' });
      expect(participant(ended, B.account.userId).state).toBe('canceled');
      expect((await waitEvent(B, 'ended', call.callId)).payload.reason).toBe('canceled');
    });
  });

  for (const [reason, endReason, state] of [
    ['declined', 'rejected', 'rejected'],
    ['busy', 'busy', 'busy'],
  ] as const) {
    test(`B-02/B-03 callee rejects with ${reason}`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await waitEvent(B, 'invitation', call.callId);
        const ended = await success(B, 'rejectCall', call.callId, reason);
        expect(ended).toMatchObject({ lifecycle: 'ended', endReason });
        expect(participant(ended, B.account.userId).state).toBe(state);
        expect((await waitEvent(A, 'ended', call.callId)).payload.reason).toBe(endReason);
      });
    });
  }

  test('B-04 unanswered single call times out', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId], {
        timeoutSeconds: 5,
      });
      await waitEvent(B, 'invitation', call.callId);
      expect((await waitEvent(A, 'ended', call.callId)).payload.reason).toBe('timeout');
      const ended = await success(A, 'getCallSnapshot', call.callId);
      expect(ended).toMatchObject({ lifecycle: 'ended', endReason: 'timeout' });
      expect(participant(ended, B.account.userId).state).toBe('timeout');
    });
  });

  test('B-05/B-06 cancel after accept and command after end', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      const cancel = await command(A, 'cancelCall', call.callId);
      expect(cancel.ok).toBe(false);
      expect((await success(A, 'getCallSnapshot', call.callId)).lifecycle).toBe('open');
      await success(A, 'hangup', call.callId);
      const again = await command(A, 'hangup', call.callId);
      // The server checks the actor's participant state (now hanguped) before
      // returning a terminal-call code, so a repeated terminate returns 1707.
      expect(again).toMatchObject({ ok: false, error: { code: 1707 } });
      await waitEvent(B, 'ended', call.callId);
      expect(
        (await events(B)).filter(
          event => event.name === 'ended' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(1);
    });
  });

  test('E-04/E-05 reconnect keeps open call, then converges on remote hangup', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      await B.context.setOffline(true);
      try {
        await B.page.waitForFunction(
          () =>
            !(window as any).rootStore?.client
              ?.getSharedSyncWebSocketSession?.()
              ?.isGatewayHandshakeReady?.(),
          undefined,
          { timeout: 20_000 },
        );
      } finally {
        await B.context.setOffline(false);
      }
      await B.page.waitForFunction(
        () =>
          (window as any).rootStore?.client
            ?.getSharedSyncWebSocketSession?.()
            ?.isGatewayHandshakeReady?.() === true,
        undefined,
        { timeout: 45_000 },
      );
      expect((await success(B, 'getCallSnapshot', call.callId)).lifecycle).toBe('open');
      expect(
        (await events(B)).filter(
          event => event.name === 'ended' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(0);
      await B.context.setOffline(true);
      await success(A, 'hangup', call.callId);
      await B.context.setOffline(false);
      expect((await waitEvent(B, 'ended', call.callId)).payload.reason).toBe('hangup');
    });
  });

  test('F-02/F-11 server errors and authoritative snapshot', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const missing = await command(A, 'acceptCall', 'ffffffffffffffffffffffffffffffff');
      expect(missing).toMatchObject({ ok: false, error: { code: 1701 } });
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      const synced = await success(A, 'getCallSnapshot', call.callId);
      expect(synced).toMatchObject({ callId: call.callId, callType: 'single', lifecycle: 'open' });
      expect(synced).not.toHaveProperty('revision');
    });
  });

  test('F-01/F-04/F-05/F-07/F-08/F-09 local input validation', async ({ browser }) => {
    await withClients(browser, ['A'], async ({ A }, ids) => {
      for (const callId of ['abc', 'a'.repeat(31), 'a'.repeat(33)]) {
        expect(await command(A, 'acceptCall', callId)).toMatchObject({
          ok: false,
          error: { code: 110 },
        });
      }
      const base = { callType: 'single', mediaType: 'voice', targetUserIds: [accounts.B.userId] };
      const invalid = [
        { ...base, targetUserIds: [accounts.B.userId, accounts.C.userId] },
        { ...base, callType: 'conference', targetUserIds: [] },
        { ...base, callType: undefined },
        { ...base, mediaType: undefined },
        { ...base, timeoutSeconds: 0 },
        { ...base, timeoutSeconds: -1 },
        { ...base, timeoutSeconds: 4294967296 },
        { ...base, ext: '中'.repeat(683) }, // UTF-8 bytes > 2048
      ];
      for (const request of invalid) {
        expect(
          await command(A, 'createCall', request),
          JSON.stringify(request).slice(0, 150),
        ).toMatchObject({ ok: false, error: { code: 110 } });
      }
      const oneSecond = await create(A, ids, 'single', 'voice', [accounts.B.userId], {
        timeoutSeconds: 1,
      });
      await success(A, 'cancelCall', oneSecond.callId).catch(() => undefined);
      const maximum = await create(A, ids, 'single', 'voice', [accounts.B.userId], {
        timeoutSeconds: 4294967295,
      });
      await success(A, 'cancelCall', maximum.callId);
    });
  });

  test('D-08 single call cannot leave or invite', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      const before = await success(A, 'getCallSnapshot', call.callId);
      expect(await command(B, 'leaveCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 110 },
      });
      expect(await success(A, 'getCallSnapshot', call.callId)).toEqual(before);
      expect(
        await command(A, 'inviteParticipants', call.callId, { userIds: [accounts.C.userId] }),
      ).toMatchObject({ ok: false, error: { code: 1707 } });
      expect(await success(A, 'getCallSnapshot', call.callId)).toEqual(before);
      expect(await command(B, 'joinCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 1707 },
      });
      expect(await success(A, 'getCallSnapshot', call.callId)).toEqual(before);
    });
  });

  test('B-07 a user already in a call cannot accept a second call', async ({ browser }) => {
    test.skip(!three, '需要 C 账号作为第二位主叫');
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const first = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', first.callId);
      await success(B, 'acceptCall', first.callId);
      const second = await command(C, 'createCall', {
        callType: 'single',
        mediaType: 'voice',
        targetUserIds: [B.account.userId],
      });
      if (second.ok) {
        const declined = await command(B, 'rejectCall', second.value.callId, 'busy');
        if (declined.ok) expect(declined.value.endReason).toBe('busy');
        else expect(declined.error.code).toBeDefined();
        const remaining = await command(C, 'getCallSnapshot', second.value.callId);
        if (remaining.ok && remaining.value.lifecycle === 'open')
          await command(C, 'cancelCall', second.value.callId);
      } else {
        expect(second.error.code).toBe(1704);
      }
      expect((await success(A, 'getCallSnapshot', first.callId)).lifecycle).toBe('open');
    });
  });

  test('E-01 offline callee receives a still-open invitation on login', async ({ browser }) => {
    const A = await login(browser, accounts.A);
    const clients = [A];
    const ids: string[] = [];
    try {
      const call = await create(A, ids, 'single', 'voice', [accounts.B.userId], {
        timeoutSeconds: 60,
      });
      const B = await login(browser, accounts.B);
      clients.push(B);
      const invitation = await waitEvent(B, 'invitation', call.callId);
      expect(invitation.payload.callType).toBe('single');
    } finally {
      await cleanup(clients, ids);
    }
  });

  for (const situation of ['timeout', 'canceled'] as const) {
    test(`E-02/E-03 offline ${situation} invitation does not ring on login`, async ({
      browser,
    }) => {
      const A = await login(browser, accounts.A);
      const clients = [A];
      const ids: string[] = [];
      try {
        const call = await create(A, ids, 'single', 'voice', [accounts.B.userId], {
          timeoutSeconds: situation === 'timeout' ? 5 : 60,
        });
        if (situation === 'canceled') await success(A, 'cancelCall', call.callId);
        else
          await expect
            .poll(async () => (await success(A, 'getCallSnapshot', call.callId)).lifecycle, {
              timeout: 15_000,
            })
            .toBe('ended');
        const B = await login(browser, accounts.B);
        clients.push(B);
        await B.page.waitForTimeout(2000);
        expect(
          (await events(B)).filter(
            event => event.name === 'invitation' && event.payload.callId === call.callId,
          ),
        ).toHaveLength(0);
        const visible = await B.page.evaluate(
          () => (window as any).rootStore?.callStore?.invitation?.callId,
        );
        expect(visible).not.toBe(call.callId);
      } finally {
        await cleanup(clients, ids);
      }
    });
  }

  test('E-08/E-09 logout clears local call and rejects further calls', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      await B.page.evaluate(async () => (window as any).rootStore.client.logout());
      const state = await B.page.evaluate(callId => {
        const manager = (window as any).rootStore.client.callSignalingManager;
        return {
          localSnapshot: manager.store.get(callId) ?? null,
          slot: manager.guard.getSlot() ?? null,
        };
      }, call.callId);
      expect(state.localSnapshot).toBeNull();
      expect(state?.slot).toBeFalsy();
      expect(await command(B, 'getCallSnapshot', call.callId)).toMatchObject({
        ok: false,
        error: { code: 201 },
      });
      expect(await command(B, 'acceptCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 201 },
      });
      const priorEvents = (await events(B)).length;
      await success(A, 'hangup', call.callId);
      await B.page.waitForTimeout(1000);
      expect((await events(B)).length).toBe(priorEvents);
    });
  });
});

test.describe('客户规范：一对一快照与终态', () => {
  test.skip(!two, '需要配置 A、B 两个真实账号');

  for (const mediaType of ['voice', 'video'] as const) {
    test(`1V1-02 ${mediaType} 振铃不改变主叫拨出状态`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, 'single', mediaType, [B.account.userId]);
        await waitEvent(B, 'invitation', call.callId);
        expectOpenSnapshot(call, call.callId);
        expect(participant(call, A.account.userId)).toMatchObject({ state: 'accepted' });
        expect(participant(call, B.account.userId)).toMatchObject({ state: 'pending' });
        expect(participant(call, B.account.userId).acceptedAt).toBeUndefined();
        expect(call.establishedAt).toBeUndefined();

        const ring = await success(B, 'reportRinging', call.callId);
        expectOpenSnapshot(ring, call.callId);
        expect(participant(ring, B.account.userId).state).toBe('ringing');
        expect(participant(ring, B.account.userId).acceptedAt).toBeUndefined();
        expect(participant(ring, A.account.userId)).toEqual(participant(call, A.account.userId));
        expect(ring.createdAt).toBe(call.createdAt);
        expect(ring.establishedAt).toBeUndefined();
        await expectSnapshotsConverged([A, B], ring);
      });
    });

    test(`1V1-04 ${mediaType} 不振铃也能直接接听`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, 'single', mediaType, [B.account.userId]);
        await waitEvent(B, 'invitation', call.callId);
        const accepted = await success(B, 'acceptCall', call.callId);
        expectOpenSnapshot(accepted, call.callId);
        expect(accepted.createdAt).toBe(call.createdAt);
        expect(participant(accepted, B.account.userId).state).toBe('accepted');
        expect(participant(accepted, B.account.userId).deviceUuid).toBeTruthy();
        expect(participant(accepted, B.account.userId).acceptedAt).toBeGreaterThan(0);
        expect(accepted.establishedAt).toBe(participant(accepted, B.account.userId).acceptedAt);
        expect(accepted.endedAt).toBeUndefined();
        await expectSnapshotsConverged([A, B], accepted);
      });
    });
  }

  test('1V1-06 空闲被叫主动报忙，以忙线结束而不是拒绝', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      const ended = await success(B, 'rejectCall', call.callId, 'busy');
      expectEndedSnapshot(ended, call.callId, 'busy');
      expect(participant(ended, B.account.userId).state).toBe('busy');
      expect(participant(ended, B.account.userId).acceptedAt).toBeUndefined();
      expect(ended.establishedAt).toBeUndefined();
      await expectSnapshotsConverged([A, B], ended);
    });
  });

  test('1V1-06 已占线的被叫不进入第二通，第一通保持进行中', async ({ browser }) => {
    test.skip(!three, '需要 C 账号作为第二位主叫');
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const first = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', first.callId);
      const accepted = await success(B, 'acceptCall', first.callId);
      const firstDevice = participant(accepted, B.account.userId).deviceUuid;
      const second = await command(C, 'createCall', {
        callType: 'single',
        mediaType: 'voice',
        targetUserIds: [B.account.userId],
      });
      if (second.ok) {
        ids.push(second.value.callId);
        const ended =
          second.value.lifecycle === 'ended'
            ? second.value
            : await success(B, 'rejectCall', second.value.callId, 'busy');
        expectEndedSnapshot(ended, second.value.callId, 'busy');
        expect(participant(ended, B.account.userId).state).toBe('busy');
        expect(participant(ended, B.account.userId).acceptedAt).toBeUndefined();
        await expectSnapshotsConverged([B, C], ended);
      } else {
        expect(second.error.code).toBe(1704);
      }
      const ongoing = await success(B, 'getCallSnapshot', first.callId);
      expectOpenSnapshot(ongoing, first.callId);
      expect(participant(ongoing, B.account.userId).state).toBe('accepted');
      expect(participant(ongoing, B.account.userId).deviceUuid).toBe(firstDevice);
      expect(ongoing.establishedAt).toBe(accepted.establishedAt);
    });
  });

  for (const ringFirst of [false, true]) {
    test(`1V1-07 ${ringFirst ? '已振铃' : '待接听'}时取消`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await waitEvent(B, 'invitation', call.callId);
        if (ringFirst) await success(B, 'reportRinging', call.callId);
        const ended = await success(A, 'cancelCall', call.callId);
        expectEndedSnapshot(ended, call.callId, 'canceled');
        expect(participant(ended, B.account.userId).state).toBe('canceled');
        expect(participant(ended, B.account.userId).acceptedAt).toBeUndefined();
        expect(ended.establishedAt).toBeUndefined();
        expect(participant(ended, A.account.userId).leftAt).toBe(ended.endedAt);
        await expectSnapshotsConverged([A, B], ended);
        const next = await create(A, ids, 'single', 'voice', [B.account.userId]);
        expect(next.callId).not.toBe(call.callId);
      });
    });
  }

  test('1V1-08 无人接听超时后服务端结束并可立即再拨', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId], {
        timeoutSeconds: 5,
      });
      await waitEvent(B, 'invitation', call.callId);
      const ended = await waitState(A, call.callId, B.account.userId, 'timeout');
      expectEndedSnapshot(ended, call.callId, 'timeout');
      expect(participant(ended, B.account.userId).acceptedAt).toBeUndefined();
      expect(ended.establishedAt).toBeUndefined();
      await expectSnapshotsConverged([A, B], ended);
      const next = await create(A, ids, 'single', 'voice', [B.account.userId]);
      expect(next.callId).not.toBe(call.callId);
    });
  });

  for (const mediaType of ['voice', 'video'] as const) {
    for (const hangupBy of ['A', 'B'] as const) {
      test(`1V1-09 ${mediaType} 接通后由 ${hangupBy} 挂断`, async ({ browser }) => {
        await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
          const call = await create(A, ids, 'single', mediaType, [B.account.userId]);
          await waitEvent(B, 'invitation', call.callId);
          const accepted = await success(B, 'acceptCall', call.callId);
          const ended = await success(hangupBy === 'A' ? A : B, 'hangup', call.callId);
          expectEndedSnapshot(ended, call.callId, 'hangup');
          expect(ended.createdAt).toBe(call.createdAt);
          expect(ended.establishedAt).toBe(accepted.establishedAt);
          expect(
            participant(ended, hangupBy === 'A' ? A.account.userId : B.account.userId).state,
          ).toBe('hanguped');
          const other = hangupBy === 'A' ? B.account.userId : A.account.userId;
          expect(participant(ended, other).leftAt).toBe(ended.endedAt);
          await expectSnapshotsConverged([A, B], ended);
        });
      });
    }
  }
});

test.describe('multiple devices call signaling API', () => {
  test.skip(!two, '需要配置 A、B 两个真实账号，B 以两个浏览器上下文登录');

  test('C-01/C-02/C-05 both devices receive invite, only accepting device resumes', async ({
    browser,
  }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const firstResource = await B.page.evaluate(() =>
        (window as any).rootStore.client.getClientResource(),
      );
      const B2 = await login(browser, accounts.B);
      try {
        const devices = await Promise.all(
          [B, B2].map(client =>
            client.page.evaluate(() => {
              const state = (window as any).rootStore;
              return {
                connected: state.loginState,
                ready: state.client.callSignalingManager.controller?.getState?.() === 'ready',
                resource: state.client.getClientResource(),
                sessionDevice: state.client.callSignalingManager.sessionDevice,
                isFixedDeviceId: state.initConfig.isFixedDeviceId,
                connectionEvents: (window as any).__connectionEvents,
              };
            }),
          ),
        );
        expect(
          devices,
          `B1 resource before B2=${firstResource}; after=${JSON.stringify(devices)}`,
        ).toMatchObject([
          { connected: true, ready: true, isFixedDeviceId: false },
          { connected: true, ready: true, isFixedDeviceId: false },
        ]);
        expect(devices[0].resource).not.toBe(devices[1].resource);
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const accepted = await success(B, 'acceptCall', call.callId);
        expect(participant(accepted, B.account.userId).state).toBe('accepted');
        expect((await waitEvent(B2, 'otherDevice', call.callId)).payload.handleType).toBe(
          'accepted',
        );
        const device = await B.page.evaluate(
          () => (window as any).rootStore.client.callSignalingManager.sessionDevice,
        );
        expect(
          participant(
            await waitState(A, call.callId, B.account.userId, 'accepted'),
            B.account.userId,
          ).deviceUuid,
        ).toBe(device);
        await B2.context.setOffline(true);
        await B2.page.waitForTimeout(1500);
        await B2.context.setOffline(false);
        await B2.page.waitForFunction(
          () =>
            (window as any).rootStore?.client?.callSignalingManager?.controller?.getState?.() ===
            'ready',
          undefined,
          { timeout: 45_000 },
        );
        expect((await success(A, 'getCallSnapshot', call.callId)).lifecycle).toBe('open');
        expect(
          await B2.page.evaluate(() =>
            (window as any).rootStore.client.callSignalingManager.guard.getSlot(),
          ),
        ).toBeFalsy();
      } finally {
        await B2.context.setOffline(false).catch(() => undefined);
        await closeClient(B2);
      }
    });
  });

  for (const [reason, handleType, endReason] of [
    ['declined', 'declined', 'rejected'],
    ['busy', 'busy', 'busy'],
  ] as const) {
    test(`C-03/C-04 ${reason} on B1 notifies B2 and ends the call`, async ({ browser }, info) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const B2 = await login(browser, accounts.B);
        let callId: string | undefined;
        try {
          await installCallPushTrace(B2);
          const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
          callId = call.callId;
          await Promise.all([
            waitEvent(B, 'invitation', call.callId),
            waitEvent(B2, 'invitation', call.callId),
          ]);
          const ended = await success(B, 'rejectCall', call.callId, reason);
          expect(ended).toMatchObject({ lifecycle: 'ended', endReason });
          const [handled, callerEnded, otherDeviceEnded] = await Promise.all([
            waitEvent(B2, 'otherDevice', call.callId),
            waitEvent(A, 'ended', call.callId),
            waitEvent(B2, 'ended', call.callId),
          ]);
          expect(handled.payload.handleType).toBe(handleType);
          expect(callerEnded.payload.reason).toBe(endReason);
          expect(otherDeviceEnded.payload.reason).toBe(endReason);
        } finally {
          await attachCallPushTrace(info, 'B2', B2, callId);
          await closeClient(B2);
        }
      });
    });
  }

  test('C-06 simultaneous accept has one winning device', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const responses = await Promise.all([
          command(B, 'acceptCall', call.callId),
          command(B2, 'acceptCall', call.callId),
        ]);
        expect(responses.filter(response => response.ok)).toHaveLength(1);
        expect(responses.filter(response => !response.ok)).toHaveLength(1);
        expect(
          participant(await success(A, 'getCallSnapshot', call.callId), B.account.userId)
            .deviceUuid,
        ).toBeTruthy();
      } finally {
        await closeClient(B2);
      }
    });
  });
});

test.describe('客户规范：多设备有效设备权限', () => {
  test.skip(!two, '需要 A、B 两个真实账号，B 登录两个浏览器上下文');

  test('MD-05 一台已接听后另一台不能再次接听', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const accepted = await success(B2, 'acceptCall', call.callId);
        const device = participant(accepted, B.account.userId).deviceUuid;
        expect(device).toBeTruthy();
        const attempt = await command(B, 'acceptCall', call.callId);
        expect(attempt.ok).toBe(false);
        const after = await success(A, 'getCallSnapshot', call.callId);
        expectOpenSnapshot(after, call.callId);
        expect(after.participants.filter(item => item.userId === B.account.userId)).toHaveLength(1);
        expect(participant(after, B.account.userId)).toMatchObject({
          state: 'accepted',
          deviceUuid: device,
        });
        expect(participant(after, B.account.userId).acceptedAt).toBe(
          participant(accepted, B.account.userId).acceptedAt,
        );
      } finally {
        await closeClient(B2);
      }
    });
  });

  test('MD-06 非有效设备不能加入或离开会议', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      let callId: string | undefined;
      try {
        const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
        callId = call.callId;
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const accepted = await success(B2, 'acceptCall', call.callId);
        const device = participant(accepted, B.account.userId).deviceUuid;
        for (const method of ['joinCall', 'leaveCall']) {
          expect((await command(B, method, call.callId)).ok).toBe(false);
          const after = await success(A, 'getCallSnapshot', call.callId);
          expectOpenSnapshot(after, call.callId);
          expect(participant(after, B.account.userId)).toMatchObject({
            state: 'accepted',
            deviceUuid: device,
          });
          expect(after).toEqual(accepted);
        }
      } finally {
        // B2 is outside withClients cleanup; release its accepted conference seat before logout.
        if (callId) await command(B2, 'leaveCall', callId).catch(() => undefined);
        await closeClient(B2);
      }
    });
  });

  test('MD-06 非有效设备不能挂断一对一', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const accepted = await success(B2, 'acceptCall', call.callId);
        expect((await command(B, 'hangup', call.callId)).ok).toBe(false);
        expect(await success(A, 'getCallSnapshot', call.callId)).toEqual(accepted);
      } finally {
        await closeClient(B2);
      }
    });
  });

  test('MD-07 一台已占线，另一台不能接入第二通', async ({ browser }) => {
    test.skip(!three, '需要 C 账号作为第二位主叫');
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        const first = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', first.callId),
          waitEvent(B2, 'invitation', first.callId),
        ]);
        const accepted = await success(B, 'acceptCall', first.callId);
        const firstDevice = participant(accepted, B.account.userId).deviceUuid;
        const second = await command(C, 'createCall', {
          callType: 'single',
          mediaType: 'voice',
          targetUserIds: [B.account.userId],
        });
        if (second.ok) {
          ids.push(second.value.callId);
          if (second.value.lifecycle === 'open') {
            expect((await command(B2, 'acceptCall', second.value.callId)).ok).toBe(false);
          }
          const busy =
            second.value.lifecycle === 'ended'
              ? second.value
              : await success(B2, 'rejectCall', second.value.callId, 'busy');
          expectEndedSnapshot(busy, second.value.callId, 'busy');
          expect(participant(busy, B.account.userId).acceptedAt).toBeUndefined();
        } else {
          expect(second.error.code).toBe(1704);
          expect((await events(B2)).filter(event => event.name === 'invitation')).toHaveLength(1);
        }
        const ongoing = await success(A, 'getCallSnapshot', first.callId);
        expectOpenSnapshot(ongoing, first.callId);
        expect(participant(ongoing, B.account.userId)).toMatchObject({
          state: 'accepted',
          deviceUuid: firstDevice,
        });
      } finally {
        await closeClient(B2);
      }
    });
  });

  test('MD-08 断线后只有原有效设备能恢复同一通', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(B2, 'invitation', call.callId),
        ]);
        const accepted = await success(B2, 'acceptCall', call.callId);
        const device = participant(accepted, B.account.userId).deviceUuid;
        await Promise.all([B.context.setOffline(true), B2.context.setOffline(true)]);
        await Promise.all([B.context.setOffline(false), B2.context.setOffline(false)]);
        for (const client of [B, B2]) {
          await client.page.waitForFunction(
            () =>
              (window as any).rootStore?.client?.callSignalingManager?.controller?.getState?.() ===
              'ready',
            undefined,
            { timeout: 45_000 },
          );
        }
        const resumed = await waitForAvailableSnapshot(B2, call.callId);
        expectOpenSnapshot(resumed, call.callId);
        expect(participant(resumed, B.account.userId)).toMatchObject({
          state: 'accepted',
          deviceUuid: device,
        });
        expect(participant(resumed, B.account.userId).acceptedAt).toBe(
          participant(accepted, B.account.userId).acceptedAt,
        );
        expect(resumed.establishedAt).toBe(accepted.establishedAt);
        expect(
          await B.page.evaluate(() =>
            (window as any).rootStore.client.callSignalingManager.guard.getSlot(),
          ),
        ).toBeFalsy();
      } finally {
        await Promise.allSettled([B.context.setOffline(false), B2.context.setOffline(false)]);
        await closeClient(B2);
      }
    });
  });
});

test.describe('conference signaling API', () => {
  test.skip(!three, '需要额外配置 C 账号');

  test('D-01/D-03/D-04 accept, leave, rejoin and last member leaves', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      await success(B, 'acceptCall', call.callId);
      await success(C, 'acceptCall', call.callId);
      await waitState(A, call.callId, C.account.userId, 'accepted');
      const left = await success(C, 'leaveCall', call.callId);
      expect(left.lifecycle).toBe('open');
      expect(participant(left, C.account.userId).state).toBe('left');
      expect(participant(await success(C, 'joinCall', call.callId), C.account.userId).state).toBe(
        'accepted',
      );
      await success(B, 'leaveCall', call.callId);
      await success(C, 'leaveCall', call.callId);
      const ended = await success(A, 'leaveCall', call.callId);
      expect(ended).toMatchObject({ lifecycle: 'ended', endReason: 'lastLeft' });
    });
  });

  test('D-05 conference rejection does not end accepted participants', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      await success(B, 'acceptCall', call.callId);
      const result = await success(C, 'rejectCall', call.callId, 'declined');
      expect(result.lifecycle).toBe('open');
      expect(participant(result, C.account.userId).state).toBe('rejected');
      expect(participant(result, B.account.userId).state).toBe('accepted');
    });
  });

  test('D-06 conference invite timeout keeps meeting open', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(
        A,
        ids,
        'conference',
        'voice',
        [B.account.userId, C.account.userId],
        { timeoutSeconds: 5 },
      );
      await waitEvent(B, 'invitation', call.callId);
      const accepted = await success(B, 'acceptCall', call.callId);
      const snapshot = await waitState(A, call.callId, C.account.userId, 'timeout');
      expectOpenSnapshot(snapshot, call.callId);
      expect(snapshot.establishedAt).toBe(accepted.establishedAt);
      expect(participant(snapshot, C.account.userId).acceptedAt).toBeUndefined();
      expect(participant(snapshot, A.account.userId)).toEqual(
        participant(accepted, A.account.userId),
      );
      expect(participant(snapshot, B.account.userId)).toEqual(
        participant(accepted, B.account.userId),
      );
      await expectSnapshotsConverged([A, B, C], snapshot);
    });
  });

  test('D-07/F-03 conference topology and nonparticipant are rejected', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      expect(await command(A, 'hangup', call.callId)).toMatchObject({
        ok: false,
        error: { code: 110 },
      });
      expect(await command(C, 'acceptCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 1702 },
      });
      expect((await success(A, 'getCallSnapshot', call.callId)).lifecycle).toBe('open');
    });
  });

  test('F-06 duplicate conference targets are deduplicated', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        B.account.userId,
        C.account.userId,
      ]);
      expect(call.participants.filter(item => item.userId === B.account.userId)).toHaveLength(1);
    });
  });

  test('D-09 without cached topology, the server rejects an invalid terminate', async ({
    browser,
  }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      const result = await command(C, 'hangup', call.callId);
      expect(result.ok).toBe(false);
      expect((result as Extract<Result, { ok: false }>).error.code).not.toBe(110);
      expect((await success(A, 'getCallSnapshot', call.callId)).lifecycle).toBe('open');
    });
  });
});

test.describe('conference invitation signaling API', () => {
  test.skip(!four, '需要额外配置 D 账号');

  test('D-02 invited member receives invitation, current members receive invited event', async ({
    browser,
  }) => {
    await withClients(browser, ['B', 'C', 'D', 'A'], async ({ A, B, C, D }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      await success(B, 'acceptCall', call.callId);
      await success(C, 'acceptCall', call.callId);
      await success(A, 'inviteParticipants', call.callId, { userIds: [D.account.userId] });
      await waitEvent(D, 'invitation', call.callId);
      const invited = await waitEvent(B, 'invited', call.callId);
      expect(invited.payload.inviteeIds).toContain(D.account.userId);
      expect(
        (await events(D)).filter(
          event => event.name === 'invited' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(0);
    });
  });
});

test.describe('客户规范：会议快照与邀请', () => {
  test.skip(!three, '需要 A、B、C 三个真实账号');

  for (const mediaType of ['voice', 'video'] as const) {
    test(`CONF-01 ${mediaType} 创建会议并通知两名被邀请人`, async ({ browser }) => {
      await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
        const call = await create(A, ids, 'conference', mediaType, [
          B.account.userId,
          C.account.userId,
        ]);
        expectOpenSnapshot(call, call.callId);
        expect(call.creatorUserId).toBe(A.account.userId);
        expect(call.establishedAt).toBeUndefined();
        expect(participant(call, A.account.userId).state).toBe('accepted');
        for (const invited of [B, C]) {
          expect(participant(call, invited.account.userId).state).toBe('pending');
          expect(participant(call, invited.account.userId).acceptedAt).toBeUndefined();
          expect((await waitEvent(invited, 'invitation', call.callId)).payload).toMatchObject({
            callType: 'conference',
            mediaType,
          });
        }
        const afterInvitations = await success(A, 'getCallSnapshot', call.callId);
        expectOpenSnapshot(afterInvitations, call.callId);
        expect(afterInvitations.establishedAt).toBeUndefined();
        expect(participant(afterInvitations, A.account.userId)).toEqual(
          participant(call, A.account.userId),
        );
        for (const invited of [B, C]) {
          expectAwaitingAnswer(afterInvitations, invited.account.userId);
        }
        await expectSnapshotsConverged([A, B, C], afterInvitations);
      });
    });
  }

  test('CONF-02 第一位成员接听，另一位仍待接听且会议不结束', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      const first = await success(B, 'acceptCall', call.callId);
      expectOpenSnapshot(first, call.callId);
      expect(participant(first, B.account.userId).state).toBe('accepted');
      expect(participant(first, B.account.userId).deviceUuid).toBeTruthy();
      expect(first.establishedAt).toBe(participant(first, B.account.userId).acceptedAt);
      expectAwaitingAnswer(first, C.account.userId);
      expect(participant(first, A.account.userId).acceptedAt).toBe(
        participant(call, A.account.userId).acceptedAt,
      );
      await expectSnapshotsConverged([A, B, C], first);
      for (const client of [A, B, C]) {
        expect(
          (await events(client)).filter(
            event => event.name === 'ended' && event.payload.callId === call.callId,
          ),
        ).toHaveLength(0);
      }
    });
  });

  test('CONF-03 后续成员接听不改首次接通时间', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      const first = await success(B, 'acceptCall', call.callId);
      const second = await success(C, 'acceptCall', call.callId);
      expectOpenSnapshot(second, call.callId);
      expect(second.establishedAt).toBe(first.establishedAt);
      expect(participant(second, B.account.userId).acceptedAt).toBe(
        participant(first, B.account.userId).acceptedAt,
      );
      expect(participant(second, C.account.userId).acceptedAt).toBeGreaterThanOrEqual(
        participant(first, B.account.userId).acceptedAt!,
      );
      expect(participant(second, C.account.userId).deviceUuid).toBeTruthy();
      await expectSnapshotsConverged([A, B, C], second);
    });
  });

  for (const inviterName of ['A', 'B'] as const) {
    test(`CONF-${inviterName === 'A' ? '04' : '05'} ${inviterName} 在会中邀请新人并接通`, async ({
      browser,
    }) => {
      test.skip(!four, '需要 D 账号验证原有成员和新成员');
      await withClients(browser, ['B', 'C', 'D', 'A'], async ({ A, B, C, D }, ids) => {
        const call = await create(A, ids, 'conference', 'voice', [
          B.account.userId,
          C.account.userId,
        ]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(C, 'invitation', call.callId),
        ]);
        await success(B, 'acceptCall', call.callId);
        const before = await success(C, 'acceptCall', call.callId);
        const inviter = inviterName === 'A' ? A : B;
        const invited = await success(inviter, 'inviteParticipants', call.callId, {
          userIds: [D.account.userId],
        });
        expectOpenSnapshot(invited, call.callId);
        expect(invited.establishedAt).toBe(before.establishedAt);
        expect(participant(invited, D.account.userId).state).toBe('pending');
        expect(participant(invited, D.account.userId).acceptedAt).toBeUndefined();
        expect(participant(invited, A.account.userId)).toEqual(
          participant(before, A.account.userId),
        );
        expect(participant(invited, B.account.userId)).toEqual(
          participant(before, B.account.userId),
        );
        const invitation = await waitEvent(D, 'invitation', call.callId);
        expect(invitation.payload.inviter.userId).toBe(inviter.account.userId);
        for (const existing of [A, B, C].filter(client => client !== inviter)) {
          const notice = await waitEvent(existing, 'invited', call.callId);
          expect(notice.payload.inviteeIds).toContain(D.account.userId);
          expect(notice.payload.inviter.userId).toBe(inviter.account.userId);
        }
        const joined = await success(D, 'acceptCall', call.callId);
        expectOpenSnapshot(joined, call.callId);
        expect(participant(joined, D.account.userId).state).toBe('accepted');
        expect(participant(joined, D.account.userId).deviceUuid).toBeTruthy();
        expect(joined.establishedAt).toBe(before.establishedAt);
        await expectSnapshotsConverged([A, B, C, D], joined);
      });
    });
  }

  test('CONF-10 被邀请人报忙不结束已接通的会议', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      const before = await success(B, 'acceptCall', call.callId);
      const busy = await success(C, 'rejectCall', call.callId, 'busy');
      expectOpenSnapshot(busy, call.callId);
      expect(participant(busy, C.account.userId).state).toBe('busy');
      expect(participant(busy, C.account.userId).acceptedAt).toBeUndefined();
      expect(participant(busy, A.account.userId)).toEqual(participant(before, A.account.userId));
      expect(participant(busy, B.account.userId)).toEqual(participant(before, B.account.userId));
      expect(busy.establishedAt).toBe(before.establishedAt);
      await expectSnapshotsConverged([A, B, C], busy);
    });
  });

  test('CONF-11 超时后由另一名会中成员再次邀请并接通', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      const accepted = await success(B, 'acceptCall', call.callId);
      const invited = await success(B, 'inviteParticipants', call.callId, {
        userIds: [C.account.userId],
        timeoutSeconds: 5,
      });
      expectOpenSnapshot(invited, call.callId);
      await waitEvent(C, 'invitation', call.callId);
      const timedOut = await waitState(A, call.callId, C.account.userId, 'timeout');
      expectOpenSnapshot(timedOut, call.callId);
      expect(timedOut.establishedAt).toBe(accepted.establishedAt);
      expect(participant(timedOut, C.account.userId).acceptedAt).toBeUndefined();
      const priorInvitations = (await events(C)).filter(
        event => event.name === 'invitation' && event.payload.callId === call.callId,
      ).length;
      const reinvited = await success(A, 'inviteParticipants', call.callId, {
        userIds: [C.account.userId],
      });
      expectOpenSnapshot(reinvited, call.callId);
      await expect
        .poll(
          async () =>
            (
              await events(C)
            ).filter(event => event.name === 'invitation' && event.payload.callId === call.callId)
              .length,
        )
        .toBe(priorInvitations + 1);
      const joined = await success(C, 'acceptCall', call.callId);
      expectOpenSnapshot(joined, call.callId);
      expect(participant(joined, C.account.userId).state).toBe('accepted');
      expect(joined.establishedAt).toBe(accepted.establishedAt);
      await expectSnapshotsConverged([A, B, C], joined);
    });
  });

  for (const alreadyAccepted of [false, true]) {
    test(`CONF-13 重复邀请${alreadyAccepted ? '已在会中' : '待接听'}成员不产生第二通`, async ({
      browser,
    }) => {
      await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
        const call = await create(A, ids, 'conference', 'voice', [
          B.account.userId,
          C.account.userId,
        ]);
        await Promise.all([
          waitEvent(B, 'invitation', call.callId),
          waitEvent(C, 'invitation', call.callId),
        ]);
        await success(B, 'acceptCall', call.callId);
        if (alreadyAccepted) await success(C, 'acceptCall', call.callId);
        const before = await success(A, 'getCallSnapshot', call.callId);
        const invitationsBefore = (await events(C)).filter(
          event => event.name === 'invitation' && event.payload.callId === call.callId,
        ).length;
        const attempt = await command(B, 'inviteParticipants', call.callId, {
          userIds: [C.account.userId],
        });
        if (attempt.ok) expect(attempt.value.callId).toBe(call.callId);
        else expect(attempt.error.code).toBeDefined();
        const after = await success(A, 'getCallSnapshot', call.callId);
        expectOpenSnapshot(after, call.callId);
        expect(after.participants.filter(item => item.userId === C.account.userId)).toHaveLength(1);
        expect(after.participants).toHaveLength(before.participants.length);
        expect(participant(after, C.account.userId).state).toBe(
          participant(before, C.account.userId).state,
        );
        expect(
          (await events(C)).filter(
            event => event.name === 'invitation' && event.payload.callId === call.callId,
          ),
        ).toHaveLength(invitationsBefore);
      });
    });
  }

  test('CONF-14 最后一名在会成员离开后结束，从未接听者无时间', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      await success(B, 'acceptCall', call.callId);
      await success(C, 'rejectCall', call.callId, 'declined');
      await success(B, 'leaveCall', call.callId);
      const ended = await success(A, 'leaveCall', call.callId);
      expectEndedSnapshot(ended, call.callId, 'lastLeft');
      expect(participant(ended, A.account.userId).state).toBe('left');
      expect(participant(ended, C.account.userId).acceptedAt).toBeUndefined();
      expect(participant(ended, C.account.userId).leftAt).toBeUndefined();
      await expectSnapshotsConverged([A, B, C], ended);
      const next = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      expect(next.callId).not.toBe(call.callId);
    });
  });

  test('CONF-15 会议不能使用一对一挂断，失败后快照不变', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      const before = await success(A, 'getCallSnapshot', call.callId);
      const attempt = await command(B, 'hangup', call.callId);
      expect(attempt).toMatchObject({ ok: false, error: { code: 110 } });
      expect(await success(A, 'getCallSnapshot', call.callId)).toEqual(before);
      expect(await success(B, 'getCallSnapshot', call.callId)).toEqual(before);
    });
  });
});

test.describe('客户规范：离线邀请', () => {
  test.skip(!two, '需要 A、B 两个真实账号');

  test('OFF-03 离线期间另一设备已处理，恢复后不能再补来电', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
        await B.context.setOffline(true);
        await B.page.waitForFunction(
          () =>
            !(window as any).rootStore?.client
              ?.getSharedSyncWebSocketSession?.()
              ?.isGatewayHandshakeReady?.(),
          undefined,
          { timeout: 20_000 },
        );
        const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
        await waitEvent(B2, 'invitation', call.callId);
        const ended = await success(B2, 'rejectCall', call.callId, 'declined');
        expectEndedSnapshot(ended, call.callId, 'rejected');
        await B.context.setOffline(false);
        await B.page.waitForFunction(
          () =>
            (window as any).rootStore?.client?.callSignalingManager?.controller?.getState?.() ===
            'ready',
          undefined,
          { timeout: 45_000 },
        );
        expect(await waitForAvailableSnapshot(B, call.callId)).toEqual(ended);
        expect(
          (await events(B)).filter(
            event => event.name === 'invitation' && event.payload.callId === call.callId,
          ),
        ).toHaveLength(0);
      } finally {
        await B.context.setOffline(false).catch(() => undefined);
        await closeClient(B2);
      }
    });
  });

  test('OFF-04 已收到的邀请在重连后不能再次派发', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId], {
        timeoutSeconds: 60,
      });
      await waitEvent(B, 'invitation', call.callId);
      const before = await success(B, 'getCallSnapshot', call.callId);
      expect(
        (await events(B)).filter(
          event => event.name === 'invitation' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(1);
      try {
        await B.context.setOffline(true);
        await B.page.waitForFunction(
          () =>
            !(window as any).rootStore?.client
              ?.getSharedSyncWebSocketSession?.()
              ?.isGatewayHandshakeReady?.(),
          undefined,
          { timeout: 20_000 },
        );
      } finally {
        await B.context.setOffline(false);
      }
      const after = await waitForAvailableSnapshot(B, call.callId);
      expect(after).toEqual(before);
      expect(
        (await events(B)).filter(
          event => event.name === 'invitation' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(1);
    });
  });
});

test.describe('客户规范：断线恢复', () => {
  test.skip(!two, '需要 A、B 两个真实账号');

  test('RC-01 有效设备重连后仍持有原通话及原时间', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      const accepted = await success(B, 'acceptCall', call.callId);
      const before = participant(accepted, B.account.userId);
      try {
        await B.context.setOffline(true);
        await B.page.waitForFunction(
          () =>
            !(window as any).rootStore?.client
              ?.getSharedSyncWebSocketSession?.()
              ?.isGatewayHandshakeReady?.(),
          undefined,
          { timeout: 20_000 },
        );
      } finally {
        await B.context.setOffline(false);
      }
      const resumed = await waitForAvailableSnapshot(B, call.callId);
      expectOpenSnapshot(resumed, call.callId);
      expect(resumed.createdAt).toBe(accepted.createdAt);
      expect(resumed.establishedAt).toBe(accepted.establishedAt);
      expect(participant(resumed, B.account.userId)).toEqual(before);
      await expectSnapshotsConverged([A, B], resumed);
    });
  });

  for (const reason of ['canceled', 'rejected', 'timeout'] as const) {
    test(`RC-02 断线期间通话因${reason}结束，恢复后按具体原因收敛`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, 'single', 'voice', [B.account.userId], {
          timeoutSeconds: reason === 'timeout' ? 5 : 60,
        });
        await waitEvent(B, 'invitation', call.callId);
        const disconnected = reason === 'rejected' ? A : B;
        try {
          await disconnected.context.setOffline(true);
          await disconnected.page.waitForFunction(
            () =>
              !(window as any).rootStore?.client
                ?.getSharedSyncWebSocketSession?.()
                ?.isGatewayHandshakeReady?.(),
            undefined,
            { timeout: 20_000 },
          );
          if (reason === 'canceled') await success(A, 'cancelCall', call.callId);
          if (reason === 'rejected') await success(B, 'rejectCall', call.callId, 'declined');
          if (reason === 'timeout') {
            await expect
              .poll(async () => (await success(A, 'getCallSnapshot', call.callId)).lifecycle, {
                timeout: 20_000,
              })
              .toBe('ended');
          }
        } finally {
          await disconnected.context.setOffline(false);
        }
        const ended = await waitForAvailableSnapshot(disconnected, call.callId);
        expectEndedSnapshot(ended, call.callId, reason);
        expect(ended.establishedAt).toBeUndefined();
        await expectSnapshotsConverged([A, B], ended);
      });
    });
  }
});

test.describe('客户规范：信令操作竞争', () => {
  test.skip(!two, '需要 A、B 两个真实账号');

  for (const callType of ['single', 'conference'] as const) {
    test(`RACE-02 ${callType} 接听与取消交错只有一种终态`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, callType, 'voice', [B.account.userId]);
        await waitEvent(B, 'invitation', call.callId);
        const [accept, cancel] = await Promise.all([
          command(B, 'acceptCall', call.callId),
          command(A, 'cancelCall', call.callId),
        ]);
        expect(Number(accept.ok) + Number(cancel.ok)).toBe(1);
        const final = await success(A, 'getCallSnapshot', call.callId);
        if (accept.ok) {
          expect(cancel.ok).toBe(false);
          expectOpenSnapshot(final, call.callId);
          expect(participant(final, B.account.userId).state).toBe('accepted');
          expect(final.establishedAt).toBe(participant(final, B.account.userId).acceptedAt);
        } else {
          expect(cancel.ok).toBe(true);
          expectEndedSnapshot(final, call.callId, 'canceled');
          expect(participant(final, B.account.userId).state).toBe('canceled');
          expect(participant(final, B.account.userId).acceptedAt).toBeUndefined();
        }
        await expectSnapshotsConverged([A, B], final);
        if (!accept.ok) {
          const next = await create(A, ids, callType, 'voice', [B.account.userId]);
          expect(next.callId).not.toBe(call.callId);
        }
      });
    });

    test(`RACE-03 ${callType} 接听与超时竞争只有一种终态`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const call = await create(A, ids, callType, 'voice', [B.account.userId], {
          timeoutSeconds: 1,
        });
        await waitEvent(B, 'invitation', call.callId);
        await B.page.waitForTimeout(700);
        const attempt = await command(B, 'acceptCall', call.callId);
        const final = await success(A, 'getCallSnapshot', call.callId);
        if (attempt.ok) {
          expectOpenSnapshot(final, call.callId);
          expect(participant(final, B.account.userId).state).toBe('accepted');
          expect(final.establishedAt).toBe(participant(final, B.account.userId).acceptedAt);
        } else {
          if (callType === 'single') expectEndedSnapshot(final, call.callId, 'timeout');
          else expectOpenSnapshot(final, call.callId);
          expect(participant(final, B.account.userId).state).toBe('timeout');
          expect(participant(final, B.account.userId).acceptedAt).toBeUndefined();
        }
        await expectSnapshotsConverged([A, B], final);
      });
    });
  }

  test('RACE-04 双方同时挂断，一对一仅结束一次且可再拨', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      const results = await Promise.all([
        command(A, 'hangup', call.callId),
        command(B, 'hangup', call.callId),
      ]);
      expect(results.some(result => result.ok)).toBe(true);
      const final = await success(A, 'getCallSnapshot', call.callId);
      expectEndedSnapshot(final, call.callId, 'hangup');
      await expectSnapshotsConverged([A, B], final);
      for (const client of [A, B]) {
        expect(
          (await events(client)).filter(
            event => event.name === 'ended' && event.payload.callId === call.callId,
          ),
        ).toHaveLength(1);
      }
      const next = await create(A, ids, 'single', 'voice', [B.account.userId]);
      expect(next.callId).not.toBe(call.callId);
    });
  });
});

test.describe('客户规范：弱网慢响应后的各端一致性', () => {
  test.skip(!three, '需要 A、B、C 三个真实账号');

  async function delayOwnResponse(client: Client, method: string): Promise<void> {
    await client.page.evaluate(name => {
      const manager = (window as any).rootStore.client.callSignalingManager;
      const original = manager[name].bind(manager);
      manager[name] = async (...args: unknown[]) => {
        const response = await original(...args);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return response;
      };
    }, method);
  }

  test('WN-07 接听响应慢于他端通知，最终快照一致', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await delayOwnResponse(B, 'acceptCall');
      const response = command(B, 'acceptCall', call.callId);
      await waitEvent(A, 'participants', call.callId, event =>
        event.payload.participants?.some(
          (item: { userId: string; state: string }) =>
            item.userId === B.account.userId && item.state === 'accepted',
        ),
      );
      expect((await response).ok).toBe(true);
      const final = await success(A, 'getCallSnapshot', call.callId);
      expectOpenSnapshot(final, call.callId);
      expect(participant(final, B.account.userId).state).toBe('accepted');
      await expectSnapshotsConverged([A, B], final);
    });
  });

  test('WN-07 拒绝响应慢于他端通知，最终结束原因一致', async ({ browser }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await delayOwnResponse(B, 'rejectCall');
      const response = command(B, 'rejectCall', call.callId, 'declined');
      expect((await waitEvent(A, 'ended', call.callId)).payload.reason).toBe('rejected');
      expect((await response).ok).toBe(true);
      const final = await success(A, 'getCallSnapshot', call.callId);
      expectEndedSnapshot(final, call.callId, 'rejected');
      await expectSnapshotsConverged([A, B], final);
    });
  });

  test('WN-07 离会响应慢于他端通知，会议成员最终一致', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [
        B.account.userId,
        C.account.userId,
      ]);
      await Promise.all([
        waitEvent(B, 'invitation', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      await Promise.all([
        success(B, 'acceptCall', call.callId),
        success(C, 'acceptCall', call.callId),
      ]);
      await delayOwnResponse(B, 'leaveCall');
      const response = command(B, 'leaveCall', call.callId);
      await waitEvent(A, 'participants', call.callId, event =>
        event.payload.participants?.some(
          (item: { userId: string; state: string }) =>
            item.userId === B.account.userId && item.state === 'left',
        ),
      );
      expect((await response).ok).toBe(true);
      const final = await success(A, 'getCallSnapshot', call.callId);
      expectOpenSnapshot(final, call.callId);
      expect(participant(final, B.account.userId).state).toBe('left');
      await expectSnapshotsConverged([A, B, C], final);
    });
  });

  test('WN-07 追加邀请响应慢于他端通知，成员最终一致', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      await delayOwnResponse(A, 'inviteParticipants');
      const response = command(A, 'inviteParticipants', call.callId, {
        userIds: [C.account.userId],
      });
      await Promise.all([
        waitEvent(B, 'invited', call.callId),
        waitEvent(C, 'invitation', call.callId),
      ]);
      expect((await response).ok).toBe(true);
      const final = await success(A, 'getCallSnapshot', call.callId);
      expectOpenSnapshot(final, call.callId);
      expectAwaitingAnswer(final, C.account.userId);
      await expectSnapshotsConverged([A, B, C], final);
    });
  });
});
