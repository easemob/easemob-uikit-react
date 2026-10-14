import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

type Account = { userId: string; token?: string; password?: string };
type Snapshot = {
  callId: string;
  kind: string;
  mediaType: string;
  lifecycle: string;
  endReason?: string;
  revision: string;
  establishedAt?: number;
  conversationId?: string;
  ext?: string;
  participants: { userId: string; state: string; deviceUuid?: string }[];
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
    await page.goto('/demo/callkit/call-demo.html');
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
      const manager = (window as any).rootStore.client.callSignalingManager;
      const events: SignalEvent[] = [];
      (window as any).__signalingEvents = events;
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

function participant(snapshot: Snapshot, userId: string) {
  const found = snapshot.participants.find(item => item.userId === userId);
  expect(found, `missing participant ${userId}`).toBeDefined();
  return found!;
}

async function events(client: Client): Promise<SignalEvent[]> {
  return client.page.evaluate(() => (window as any).__signalingEvents ?? []);
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
      result.value.kind === 'single'
        ? result.value.establishedAt
          ? 'terminateCall'
          : 'cancelCall'
        : result.value.establishedAt
        ? 'leaveCall'
        : 'cancelCall';
    await command(owner, method, callId).catch(() => undefined);
    if (result.value.kind === 'conference') {
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
  kind: 'single' | 'conference',
  mediaType: 'voice' | 'video',
  targets: string[],
  options: Record<string, unknown> = {},
) {
  const snapshot = await success(a, 'createCall', {
    kind,
    mediaType,
    targetUserIds: targets,
    ...options,
  });
  ids.push(snapshot.callId);
  expect(snapshot).toMatchObject({ kind, mediaType, lifecycle: 'open' });
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
          kind: 'single',
          mediaType,
        });
        await success(B, 'reportRinging', created.callId);
        await waitState(A, created.callId, B.account.userId, 'ringing');
        const accepted = await success(B, 'acceptCall', created.callId);
        expect(participant(accepted, B.account.userId).state).toBe('accepted');
        expect(accepted.establishedAt).toBeGreaterThan(0);
        const ended = await success(A, 'terminateCall', created.callId);
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
      expect((await success(B, 'terminateCall', call.callId)).endReason).toBe('hangup');
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
        const ended = await success(B, 'rejectCall', call.callId, { reason });
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
      await success(A, 'terminateCall', call.callId);
      const again = await command(A, 'terminateCall', call.callId);
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
      await success(A, 'terminateCall', call.callId);
      await B.context.setOffline(false);
      expect((await waitEvent(B, 'ended', call.callId)).payload.reason).toBe('hangup');
    });
  });

  test('F-02/F-10/F-11 server errors, RTC report and authoritative snapshot', async ({
    browser,
  }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const missing = await command(A, 'acceptCall', 'ffffffffffffffffffffffffffffffff');
      expect(missing).toMatchObject({ ok: false, error: { code: 1701 } });
      const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
      const reported = await success(A, 'reportRtcEvent', call.callId, {
        event: 1,
        targetUserId: B.account.userId,
      });
      expect(reported).toMatchObject({ callId: call.callId, lifecycle: 'open' });
      const synced = await success(A, 'getCallSnapshot', call.callId);
      expect(BigInt(synced.revision)).toBeGreaterThanOrEqual(BigInt(call.revision));
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
      const base = { kind: 'single', mediaType: 'voice', targetUserIds: [accounts.B.userId] };
      const invalid = [
        { ...base, targetUserIds: [accounts.B.userId, accounts.C.userId] },
        { ...base, kind: 'conference', targetUserIds: [] },
        { ...base, kind: undefined },
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
      expect(await command(B, 'leaveCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 110 },
      });
      expect(
        await command(A, 'inviteParticipants', call.callId, { userIds: [accounts.C.userId] }),
      ).toMatchObject({ ok: false, error: { code: 110 } });
      expect(await command(B, 'joinCall', call.callId)).toMatchObject({
        ok: false,
        error: { code: 110 },
      });
    });
  });

  test('B-07 a user already in a call cannot accept a second call', async ({ browser }) => {
    test.skip(!three, '需要 C 账号作为第二位主叫');
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const first = await create(A, ids, 'single', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', first.callId);
      await success(B, 'acceptCall', first.callId);
      const second = await command(C, 'createCall', {
        kind: 'single',
        mediaType: 'voice',
        targetUserIds: [B.account.userId],
      });
      if (second.ok) {
        const declined = await command(B, 'rejectCall', second.value.callId, { reason: 'busy' });
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
      expect(invitation.payload.kind).toBe('single');
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
      await success(A, 'terminateCall', call.callId);
      await B.page.waitForTimeout(1000);
      expect((await events(B)).length).toBe(priorEvents);
    });
  });
});

test.describe('multiple devices call signaling API', () => {
  test.skip(!two, '需要配置 A、B 两个真实账号，B 以两个浏览器上下文登录');

  test('C-01/C-02/C-05 both devices receive invite, only accepting device resumes', async ({
    browser,
  }) => {
    await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
      const B2 = await login(browser, accounts.B);
      try {
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
    ['declined', 'rejected', 'rejected'],
    ['busy', 'busy', 'busy'],
  ] as const) {
    test(`C-03/C-04 ${reason} on B1 notifies B2 and ends the call`, async ({ browser }) => {
      await withClients(browser, ['B', 'A'], async ({ A, B }, ids) => {
        const B2 = await login(browser, accounts.B);
        try {
          const call = await create(A, ids, 'single', 'voice', [B.account.userId]);
          await Promise.all([
            waitEvent(B, 'invitation', call.callId),
            waitEvent(B2, 'invitation', call.callId),
          ]);
          const ended = await success(B, 'rejectCall', call.callId, { reason });
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
      const result = await success(C, 'rejectCall', call.callId, { reason: 'declined' });
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
      await success(B, 'acceptCall', call.callId);
      const snapshot = await waitState(A, call.callId, C.account.userId, 'timeout');
      expect(snapshot.lifecycle).toBe('open');
    });
  });

  test('D-07/F-03 conference topology and nonparticipant are rejected', async ({ browser }) => {
    await withClients(browser, ['B', 'C', 'A'], async ({ A, B, C }, ids) => {
      const call = await create(A, ids, 'conference', 'voice', [B.account.userId]);
      await waitEvent(B, 'invitation', call.callId);
      await success(B, 'acceptCall', call.callId);
      expect(await command(A, 'terminateCall', call.callId)).toMatchObject({
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
      const result = await command(C, 'terminateCall', call.callId);
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
      expect(invited.payload.invitedUserIds).toContain(D.account.userId);
      expect(
        (await events(D)).filter(
          event => event.name === 'invited' && event.payload.callId === call.callId,
        ),
      ).toHaveLength(0);
    });
  });
});
