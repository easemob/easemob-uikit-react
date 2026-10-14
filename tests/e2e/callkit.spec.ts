import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

interface Account {
  userId: string;
  token?: string;
  password?: string;
}

const callDebugLogs = new WeakMap<Page, string[]>();
const asrHealthURL = 'http://127.0.0.1:8765/health';
const fixedSpeechText = '你好，现在开始语音通话测试。';

const appKey = process.env.EASEMOB_APPKEY;
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175';
const caller: Account = {
  userId: process.env.EASEMOB_USERID ?? '',
  token: process.env.EASEMOB_TOKEN,
  password: process.env.EASEMOB_PASSWORD,
};
const callee: Account = {
  userId: process.env.EASEMOB_SECOND_USERID ?? '',
  token: process.env.EASEMOB_SECOND_TOKEN,
  password: process.env.EASEMOB_SECOND_PASSWORD,
};
const hasAccounts = Boolean(
  appKey &&
    caller.userId &&
    (caller.token || caller.password) &&
    callee.userId &&
    (callee.token || callee.password),
);

async function isAsrReady(): Promise<boolean> {
  try {
    const response = await fetch(asrHealthURL, { signal: AbortSignal.timeout(1500) });
    const health = (await response.json()) as { ok?: boolean; model?: string };
    return response.ok && health.ok === true && typeof health.model === 'string';
  } catch {
    return false;
  }
}

async function startAsrServer(): Promise<() => Promise<void>> {
  if (await isAsrReady()) return async () => undefined;

  const python = process.env.CALLKIT_ASR_PYTHON ?? '/tmp/callkit-asr-venv/bin/python';
  if (python.includes('/') && !existsSync(python)) {
    throw new Error(
      `找不到 ASR Python: ${python}；按 demo/callkit/audio-transcription-experiment.md 安装依赖，或设置 CALLKIT_ASR_PYTHON`,
    );
  }
  const server = spawn(python, ['-u', resolve('demo/callkit/asr-server.py')], {
    env: {
      ...process.env,
      CALLKIT_ASR_MODEL: 'base',
      HF_HOME: process.env.HF_HOME ?? '/tmp/callkit-hf',
      PYTHONDONTWRITEBYTECODE: '1',
    },
  });
  let output = '';
  let spawnError: Error | undefined;
  const collect = (chunk: Buffer) => {
    output = (output + chunk.toString()).slice(-4000);
  };
  server.stdout.on('data', collect);
  server.stderr.on('data', collect);
  server.on('error', error => {
    spawnError = error;
  });
  const stop = async () => {
    if (server.exitCode !== null || server.signalCode !== null) return;
    server.kill('SIGTERM');
    for (let attempt = 0; attempt < 25; attempt++) {
      if (server.exitCode !== null || server.signalCode !== null) return;
      await delay(200);
    }
    server.kill('SIGKILL');
  };
  try {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await isAsrReady()) return stop;
      if (spawnError || server.exitCode !== null || server.signalCode !== null) {
        throw new Error(`ASR 服务启动失败：${spawnError?.message ?? output}`);
      }
      await delay(1000);
    }
    throw new Error(`ASR 服务 120 秒内未就绪。输出：${output}`);
  } catch (error) {
    await stop();
    throw error;
  }
}

function normalizeSpeech(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function matchingCharacters(expected: string, actual: string): number {
  const source = Array.from(normalizeSpeech(expected));
  const recognized = Array.from(normalizeSpeech(actual));
  const previous = new Array<number>(recognized.length + 1).fill(0);
  for (const character of source) {
    let diagonal = 0;
    for (let index = 1; index <= recognized.length; index++) {
      const above = previous[index];
      previous[index] =
        character === recognized[index - 1]
          ? diagonal + 1
          : Math.max(previous[index], previous[index - 1]);
      diagonal = above;
    }
  }
  return previous[recognized.length];
}

async function openDemo(
  browser: Browser,
  account: Account,
  testInfo: TestInfo,
  name: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL, permissions: ['camera', 'microphone'] });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const outputPath = testInfo.outputPath(`${name}-call-state.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify({ initialized: true }, null, 2));
  const logs: string[] = [];
  callDebugLogs.set(page, logs);
  page.on('console', message => {
    const value = message.text();
    if (value.includes('[call-debug]') || message.type() === 'error') {
      logs.push(value.slice(0, 1000));
      if (logs.length > 100) logs.shift();
    }
  });
  page.on('pageerror', error => {
    logs.push(`pageerror: ${error.message.slice(0, 1000)}`);
    if (logs.length > 100) logs.shift();
  });
  page.on('response', response => {
    if (response.status() === 504) {
      logs.push(`HTTP 504: ${response.url()}`);
      if (logs.length > 100) logs.shift();
    }
  });
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto('/demo/callkit/call-demo.html', {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      try {
        await page.getByPlaceholder('输入App Key').waitFor({ state: 'visible', timeout: 15_000 });
        break;
      } catch (error) {
        const viteLoadFailed = logs.some(log =>
          /HTTP 504|Failed to fetch dynamically imported module/.test(log),
        );
        if (attempt === 2 || !viteLoadFailed) {
          throw new Error(
            `CallKit demo 未加载登录表单：${String(error)}；页面日志：${logs.join(' | ')}`,
          );
        }
      }
    }
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
    if (account.token) {
      await page.getByPlaceholder('输入 Token；填写后优先使用 Token 登录').fill(account.token);
    } else {
      await page.getByPlaceholder('未填写 Token 时，使用密码换取 Token').fill(account.password!);
    }
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(page.getByRole('button', { name: /^登出/ })).toBeVisible();
    await page.getByRole('button', { name: '完成配置' }).click();
    // IM login, CallKit listener registration, and the Fusion gateway handshake
    // finish independently. The callee must be ready before the caller sends an invite.
    await page.waitForFunction(
      () => {
        const debugWindow = window as typeof window & {
          callService?: unknown;
          rootStore?: {
            client?: {
              callSignalingManager?: {
                eventHandlers?: Map<string, unknown>;
                controller?: { getState?: () => string };
              };
            };
          };
        };
        const manager = debugWindow.rootStore?.client?.callSignalingManager;
        return Boolean(
          debugWindow.callService &&
            manager?.eventHandlers?.size &&
            manager.controller?.getState?.() === 'ready',
        );
      },
      undefined,
      { timeout: 45_000 },
    );
    // Fusion replies to ConnectRequest before its asynchronous route reporter
    // has published this device to the owner directory. Allow that report to settle.
    await page.waitForTimeout(1000);
    return { context, page };
  } catch (error) {
    await attachCallState(testInfo, name, page).catch(() => undefined);
    await context.close();
    throw error;
  }
}

async function waitForParticipant(page: Page, userId: string, state: string): Promise<void> {
  await page.waitForFunction(
    ({ userId, state }) => {
      const store = (
        window as typeof window & {
          rootStore?: {
            callStore?: { snapshot?: { participants?: { userId: string; state: string }[] } };
          };
        }
      ).rootStore;
      return store?.callStore?.snapshot?.participants?.some(
        participant => participant.userId === userId && participant.state === state,
      );
    },
    { userId, state },
    { timeout: 45_000 },
  );
}

async function waitForCreatedCall(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const store = (
        window as typeof window & {
          rootStore?: { callStore?: { snapshot?: { callId?: string; lifecycle?: string } } };
        }
      ).rootStore;
      return Boolean(
        store?.callStore?.snapshot?.callId && store.callStore.snapshot.lifecycle === 'open',
      );
    },
    undefined,
    { timeout: 30_000 },
  );
}

async function attachCallState(testInfo: TestInfo, name: string, page: Page): Promise<void> {
  const outputPath = testInfo.outputPath(`${name}-call-state.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  // Write a file even when Playwright has already closed the browser at test timeout.
  await writeFile(
    outputPath,
    JSON.stringify({ pageClosed: page.isClosed(), logs: callDebugLogs.get(page) ?? [] }, null, 2),
  );
  if (page.isClosed()) return;
  const state = await page
    .evaluate(() => {
      const debugWindow = window as typeof window & {
        rootStore?: {
          client?: {
            callSignalingManager?: {
              eventHandlers?: Map<string, unknown>;
              seenInvites?: Map<string, string>;
              guard?: { getSlot?: () => unknown };
              controller?: { getState?: () => string };
            };
          };
          callStore?: {
            snapshot?: {
              callId?: string;
              kind?: string;
              lifecycle?: string;
              revision?: string;
              creatorUserId?: string;
              establishedAt?: number;
              participants?: { userId: string; state: string; deviceUuid?: string }[];
            };
            invitation?: { callId?: string };
          };
        };
        callService?: {
          getCallStatus?: () => number;
          getCurrentCallInfo?: () => { callId?: string } | null;
        };
      };
      const snapshot = debugWindow.rootStore?.callStore?.snapshot;
      const signaling = debugWindow.rootStore?.client?.callSignalingManager;
      const service = debugWindow.callService as typeof debugWindow.callService & {
        client?: {
          connectionState?: string;
          localTracks?: { trackMediaType?: string; enabled?: boolean }[];
          remoteUsers?: {
            uid: string | number;
            hasVideo?: boolean;
            hasAudio?: boolean;
            videoTrack?: unknown;
          }[];
        };
        remoteVideoTracks?: Map<string, unknown>;
      };
      return {
        snapshot: snapshot
          ? {
              callId: snapshot.callId,
              kind: snapshot.kind,
              lifecycle: snapshot.lifecycle,
              revision: snapshot.revision,
              creatorUserId: snapshot.creatorUserId,
              establishedAt: snapshot.establishedAt,
              participants: snapshot.participants?.map(({ userId, state, deviceUuid }) => ({
                userId,
                state,
                deviceUuid,
              })),
            }
          : null,
        invitationCallId: debugWindow.rootStore?.callStore?.invitation?.callId ?? null,
        listenerReady: Boolean(debugWindow.callService),
        signalingHandlerCount: signaling?.eventHandlers?.size ?? null,
        seenInvites: Array.from(signaling?.seenInvites?.entries() ?? []),
        signalingSlot: signaling?.guard?.getSlot?.() ?? null,
        signalingHandshakeState: signaling?.controller?.getState?.() ?? null,
        sessionDevice:
          (signaling as typeof signaling & { sessionDevice?: string })?.sessionDevice ?? null,
        serviceStatus: debugWindow.callService?.getCallStatus?.() ?? null,
        serviceCallId: debugWindow.callService?.getCurrentCallInfo?.()?.callId ?? null,
        rtc: {
          connectionState: service?.client?.connectionState ?? null,
          localTracks:
            service?.client?.localTracks?.map(track => ({
              mediaType: track.trackMediaType,
              enabled: track.enabled,
            })) ?? [],
          remoteUsers:
            service?.client?.remoteUsers?.map(user => ({
              uid: String(user.uid),
              hasVideo: user.hasVideo,
              hasAudio: user.hasAudio,
              hasVideoTrack: Boolean(user.videoTrack),
            })) ?? [],
          cachedVideoUsers: Array.from(service?.remoteVideoTracks?.keys() ?? []),
          videoElements: Array.from(document.querySelectorAll('video')).map(video => ({
            videoId: video.closest('[data-video-id]')?.getAttribute('data-video-id') ?? null,
            width: video.videoWidth,
            streamTracks:
              (video.srcObject as MediaStream | null)?.getTracks().map(track => ({
                kind: track.kind,
                readyState: track.readyState,
              })) ?? [],
          })),
        },
        invitationVisible: Boolean(document.querySelector('.cui-callkit-invitation-accept-btn')),
        visibleErrors: Array.from(document.querySelectorAll('[role="alert"]'))
          .map(element => element.textContent?.trim())
          .filter(Boolean),
      };
    })
    .catch(error => ({ captureError: String(error) }));
  await writeFile(
    outputPath,
    JSON.stringify({ ...state, logs: callDebugLogs.get(page) ?? [] }, null, 2),
  );
  await page
    .screenshot({ path: testInfo.outputPath(`${name}-screenshot.png`), timeout: 3000 })
    .catch(() => undefined);
}

async function expectInCall(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: '结束通话' })).toBeVisible();
}

async function expectServerCallEnded(page: Page, callId: string): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async id => {
          const debugWindow = window as typeof window & {
            rootStore?: {
              client?: {
                callSignalingManager?: {
                  getCallSnapshot?: (callId: string) => Promise<{ lifecycle?: string }>;
                };
              };
            };
          };
          return (await debugWindow.rootStore?.client?.callSignalingManager?.getCallSnapshot?.(id))
            ?.lifecycle;
        }, callId),
      { timeout: 15_000 },
    )
    .toBe('ended');
}

async function endCallIfPresent(page: Page): Promise<void> {
  if (page.isClosed()) return;
  const button = page.getByRole('button', { name: '结束通话' });
  if (await button.isVisible().catch(() => false)) {
    const handled = await page
      .evaluate(async () => {
        const service = (
          window as typeof window & {
            callService?: { hangup?: () => Promise<void> };
          }
        ).callService;
        if (!service?.hangup) return false;
        await service.hangup();
        return true;
      })
      .catch(() => false);
    if (!handled) await button.click({ timeout: 2000 }).catch(() => undefined);
  }
}

async function cancelUnestablishedConference(testInfo: TestInfo, page: Page): Promise<void> {
  const result = page.isClosed()
    ? { pageClosed: true }
    : await page
        .evaluate(async () => {
          const debugWindow = window as typeof window & {
            rootStore?: {
              callStore?: {
                snapshot?: {
                  callId?: string;
                };
              };
              client?: {
                callSignalingManager?: {
                  getCallSnapshot?: (callId: string) => Promise<{
                    callId: string;
                    kind: string;
                    lifecycle: string;
                    establishedAt?: number;
                  }>;
                  cancelCall?: (callId: string) => Promise<{ lifecycle?: string }>;
                };
              };
            };
          };
          const callId = debugWindow.rootStore?.callStore?.snapshot?.callId;
          const manager = debugWindow.rootStore?.client?.callSignalingManager;
          const snapshot = callId ? await manager?.getCallSnapshot?.(callId) : null;
          if (
            snapshot?.callId &&
            snapshot.kind === 'conference' &&
            snapshot.lifecycle === 'open' &&
            !snapshot.establishedAt
          ) {
            const ended = await manager?.cancelCall?.(snapshot.callId);
            return {
              attempted: true,
              callId: snapshot.callId,
              lifecycle: ended?.lifecycle ?? null,
            };
          }
          return {
            attempted: false,
            callId: snapshot?.callId ?? callId ?? null,
            lifecycle: snapshot?.lifecycle ?? null,
            establishedAt: snapshot?.establishedAt ?? null,
          };
        })
        .catch(error => ({ cleanupError: String(error) }));
  await writeFile(testInfo.outputPath('caller-cleanup.json'), JSON.stringify(result, null, 2));
}

async function probeOfflineInvitation(testInfo: TestInfo, page: Page): Promise<void> {
  const result = page.isClosed()
    ? { pageClosed: true }
    : await page
        .evaluate(async () => {
          const debugWindow = window as typeof window & {
            rootStore?: {
              callStore?: { invitation?: { callId?: string } };
              client?: { callSignalingManager?: { fetchOfflineCall?: () => Promise<void> } };
            };
          };
          const manager = debugWindow.rootStore?.client?.callSignalingManager;
          await manager?.fetchOfflineCall?.();
          return {
            invitationCallId: debugWindow.rootStore?.callStore?.invitation?.callId ?? null,
            invitationVisible: Boolean(
              document.querySelector('.cui-callkit-invitation-accept-btn'),
            ),
          };
        })
        .catch(error => ({ probeError: String(error) }));
  await writeFile(
    testInfo.outputPath('callee-offline-probe.json'),
    JSON.stringify({ ...result, logTail: callDebugLogs.get(page)?.slice(-20) ?? [] }, null, 2),
  );
}

async function expectLiveVideo(page: Page, videoId: string): Promise<void> {
  await expect
    .poll(
      async () => {
        return page
          .locator(`[data-video-id="${videoId}"] video, video[data-video-id="${videoId}"]`)
          .evaluateAll(elements =>
            elements.some(element => {
              const video = element as HTMLVideoElement;
              const stream = video.srcObject as MediaStream | null;
              return (
                video.videoWidth > 0 ||
                Boolean(stream?.getVideoTracks().some(track => track.readyState === 'live'))
              );
            }),
          );
      },
      { timeout: 45_000 },
    )
    .toBe(true);
}

test('Chromium virtual camera and microphone provide live media', async ({ page }) => {
  await page.goto('/demo/callkit/call-demo.html');
  await expect(page.getByPlaceholder('输入App Key')).toBeVisible();
  const media = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      return {
        audio: stream.getAudioTracks().some(track => track.readyState === 'live'),
        video: stream.getVideoTracks().some(track => track.readyState === 'live'),
        width: video.videoWidth,
      };
    } finally {
      stream.getTracks().forEach(track => track.stop());
    }
  });
  expect(media).toMatchObject({ audio: true, video: true });
  expect(media.width).toBeGreaterThan(0);
});

test.describe.serial('CallKit real IM and RTC', () => {
  test.skip(!hasAccounts, '需要设置 EASEMOB_APPKEY、两位用户 ID 以及各自的 Token 或密码');

  test('two users join and end a conference audio call', async ({ browser }, testInfo) => {
    const a = await openDemo(browser, caller, testInfo, 'caller');
    let b: Awaited<ReturnType<typeof openDemo>>;
    try {
      b = await openDemo(browser, callee, testInfo, 'callee');
    } catch (error) {
      await a.context.close().catch(() => undefined);
      throw error;
    }
    try {
      await a.page.getByRole('textbox', { name: '多人通话成员 userId' }).fill(callee.userId);
      await a.page.getByRole('button', { name: '发起多人语音通话' }).click();
      await waitForCreatedCall(a.page);
      await expect(b.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
      await b.page.locator('.cui-callkit-invitation-accept-btn').click();
      await expectInCall(a.page);
      await expectInCall(b.page);
      await waitForParticipant(a.page, callee.userId, 'accepted');
      await b.page.getByRole('button', { name: '结束通话' }).click();
      await waitForParticipant(a.page, callee.userId, 'left');
      const callId = await a.page.evaluate(() => {
        return (
          window as typeof window & {
            rootStore?: { callStore?: { snapshot?: { callId?: string } } };
          }
        ).rootStore?.callStore?.snapshot?.callId;
      });
      expect(callId).toBeTruthy();
      await endCallIfPresent(a.page);
      await expectServerCallEnded(a.page, callId!);
    } catch (error) {
      await Promise.allSettled([
        attachCallState(testInfo, 'caller', a.page),
        attachCallState(testInfo, 'callee', b.page),
      ]);
      await probeOfflineInvitation(testInfo, b.page).catch(() => undefined);
      throw error;
    } finally {
      await cancelUnestablishedConference(testInfo, a.page).catch(() => undefined);
      await Promise.all([endCallIfPresent(a.page), endCallIfPresent(b.page)]);
      await Promise.allSettled([a.context.close(), b.context.close()]);
    }
  });

  test('callee transcribes speech sent through an RTC audio call', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000);
    const stopAsrServer = await test.step('启动本地 ASR 服务', startAsrServer);
    let a: Awaited<ReturnType<typeof openDemo>> | undefined;
    let b: Awaited<ReturnType<typeof openDemo>> | undefined;
    try {
      a = await test.step('主叫登录 CallKit demo', () =>
        openDemo(browser, caller, testInfo, 'caller'));
      b = await test.step('被叫登录 CallKit demo', () =>
        openDemo(browser, callee, testInfo, 'callee'));
      await a.page.getByPlaceholder('输入目标用户ID').fill(callee.userId);
      await a.page.getByRole('button', { name: '发起语音通话', exact: true }).click();
      await waitForCreatedCall(a.page);
      await expect(b.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
      await b.page.locator('.cui-callkit-invitation-accept-btn').click();
      await expectInCall(a.page);
      await expectInCall(b.page);
      await waitForParticipant(a.page, callee.userId, 'accepted');
      await b.page.waitForFunction(
        () => {
          const service = (
            window as typeof window & {
              callService?: {
                client?: {
                  remoteUsers?: { audioTrack?: { getMediaStreamTrack(): MediaStreamTrack } }[];
                };
              };
            }
          ).callService;
          return service?.client?.remoteUsers?.some(user => {
            try {
              return user.audioTrack?.getMediaStreamTrack().readyState === 'live';
            } catch {
              return false;
            }
          });
        },
        undefined,
        { timeout: 45_000 },
      );

      await b.page.getByRole('button', { name: '开始录制远端语音' }).click();
      await expect(b.page.getByRole('button', { name: '停止并识别' })).toBeEnabled();
      await a.page.getByRole('button', { name: '播放固定语音到通话' }).click();
      await expect(a.page.getByRole('status')).toContainText('固定语音播放完毕', {
        timeout: 30_000,
      });
      await expect(a.page.getByRole('button', { name: '播放固定语音到通话' })).toBeEnabled();
      await b.page.waitForTimeout(1000);
      await b.page.getByRole('button', { name: '停止并识别' }).click();
      const receivedAudio = b.page.locator('audio[aria-label="接收到的远端录音"]');
      await expect(receivedAudio).toBeVisible();
      const receivedWav = await receivedAudio.evaluate(async element => {
        const response = await fetch((element as HTMLAudioElement).src);
        return Array.from(new Uint8Array(await response.arrayBuffer()));
      });
      expect(receivedWav.length, '被叫录制的远端音频文件大小').toBeGreaterThan(44_100);
      await testInfo.attach('callee-remote-audio.wav', {
        body: Buffer.from(receivedWav),
        contentType: 'audio/wav',
      });
      await expect(b.page.getByText(/^识别结果：/)).toBeVisible({ timeout: 90_000 });

      const transcript = (await b.page.getByText(/^识别结果：/).innerText()).replace(
        /^识别结果：/,
        '',
      );
      const matched = matchingCharacters(fixedSpeechText, transcript);
      await testInfo.attach('rtc-transcription.json', {
        body: Buffer.from(
          JSON.stringify({ source: fixedSpeechText, transcript, matched }, null, 2),
        ),
        contentType: 'application/json',
      });
      expect(
        matched,
        `远端识别文字“${transcript}”与原文“${fixedSpeechText}”的顺序重合字数`,
      ).toBeGreaterThanOrEqual(7);
    } catch (error) {
      await Promise.allSettled([
        a && attachCallState(testInfo, 'caller', a.page),
        b && attachCallState(testInfo, 'callee', b.page),
      ]);
      throw error;
    } finally {
      if (a) await cancelUnestablishedConference(testInfo, a.page).catch(() => undefined);
      await Promise.allSettled([a && endCallIfPresent(a.page), b && endCallIfPresent(b.page)]);
      await Promise.allSettled([a?.context.close(), b?.context.close()]);
      await stopAsrServer();
    }
  });

  test('video call survives offline hangup and manual reinvitation without duplicate tracks', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(240_000);
    const a = await openDemo(browser, caller, testInfo, 'caller');
    let b: Awaited<ReturnType<typeof openDemo>>;
    try {
      b = await openDemo(browser, callee, testInfo, 'callee');
    } catch (error) {
      await a.context.close().catch(() => undefined);
      throw error;
    }
    const rtcErrors: string[] = [];
    b.page.on('console', message => {
      if (/CAN_NOT_PUBLISH_MULTIPLE_VIDEO_TRACKS/.test(message.text()))
        rtcErrors.push(message.text());
    });
    try {
      await a.page.getByRole('textbox', { name: '多人通话成员 userId' }).fill(callee.userId);
      await a.page.getByRole('button', { name: '发起多人视频通话' }).click();
      await waitForCreatedCall(a.page);
      await expect(b.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
      await b.page.locator('.cui-callkit-invitation-accept-btn').click();
      await expectInCall(a.page);
      await expectInCall(b.page);
      await expectLiveVideo(a.page, `remote-${callee.userId}`);

      await b.context.setOffline(true);
      await b.page.getByRole('button', { name: '结束通话' }).click();
      await b.context.setOffline(false);
      await waitForParticipant(a.page, callee.userId, 'left');

      await a.page.getByRole('textbox', { name: '追加邀请 userId' }).fill(callee.userId);
      await a.page.getByRole('button', { name: '邀请加入当前通话' }).click();
      await expect(b.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
      await b.page.locator('.cui-callkit-invitation-accept-btn').click();
      await waitForParticipant(a.page, callee.userId, 'accepted');
      await expectInCall(b.page);
      await expectLiveVideo(a.page, `remote-${callee.userId}`);
      expect(rtcErrors).toEqual([]);
    } catch (error) {
      await Promise.allSettled([
        attachCallState(testInfo, 'caller', a.page),
        attachCallState(testInfo, 'callee', b.page),
      ]);
      throw error;
    } finally {
      await b.context.setOffline(false).catch(() => undefined);
      await cancelUnestablishedConference(testInfo, a.page).catch(() => undefined);
      await Promise.all([endCallIfPresent(a.page), endCallIfPresent(b.page)]);
      await Promise.allSettled([a.context.close(), b.context.close()]);
    }
  });
});
