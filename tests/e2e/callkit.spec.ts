import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
  type WebSocketRoute,
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
const third: Account = {
  userId: process.env.EASEMOB_THIRD_USERID ?? '',
  token: process.env.EASEMOB_THIRD_TOKEN,
  password: process.env.EASEMOB_THIRD_PASSWORD,
};
const fourth: Account = {
  userId: process.env.EASEMOB_FOURTH_USERID ?? '',
  token: process.env.EASEMOB_FOURTH_TOKEN,
  password: process.env.EASEMOB_FOURTH_PASSWORD,
};
const hasAccount = (account: Account): boolean =>
  Boolean(account.userId && (account.token || account.password));
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

  const python = process.env.CALLKIT_ASR_PYTHON ?? resolve('.local/callkit/venv/bin/python');
  if (python.includes('/') && !existsSync(python)) {
    throw new Error(
      `找不到 ASR Python: ${python}；按 demo/callkit/audio-transcription-experiment.md 安装依赖，或设置 CALLKIT_ASR_PYTHON`,
    );
  }
  const server = spawn(python, ['-u', resolve('demo/callkit/asr-server.py')], {
    env: {
      ...process.env,
      CALLKIT_ASR_MODEL: process.env.CALLKIT_ASR_MODEL ?? 'base',
      HF_HOME: process.env.HF_HOME ?? resolve('.local/callkit/hf'),
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
  fusionFault?: FusionFault,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL, permissions: ['camera', 'microphone'] });
  const page = await context.newPage();
  if (fusionFault) await fusionFault.install(page);
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
    if (process.env.EASEMOB_RTC_APP_ID?.trim()) {
      await page
        .getByPlaceholder('留空时由 IM SDK 自动获取')
        .fill(process.env.EASEMOB_RTC_APP_ID.trim());
    }
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
              callType?: string;
              lifecycle?: string;

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
              callType: snapshot.callType,
              lifecycle: snapshot.lifecycle,

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
                    callType: string;
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
            snapshot.callType === 'conference' &&
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

async function sampleRemoteVideo(page: Page, userId: string) {
  return page.evaluate(id => {
    // Read decoded pixels only from the receiver's remote video, never the source canvas.
    const video = Array.from(document.querySelectorAll('video')).find(
      element =>
        element.closest('[data-video-id]')?.getAttribute('data-video-id') === `remote-${id}`,
    );
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(80, 45, 160, 90);
    const counts = { red: 0, green: 0, blue: 0, black: 0 };
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index],
        g = data[index + 1],
        b = data[index + 2];
      if (r > 100 && r > g * 1.5 && r > b * 1.5) counts.red++;
      if (g > 100 && g > r * 1.5 && g > b * 1.5) counts.green++;
      if (b > 100 && b > r * 1.5 && b > g * 1.5) counts.blue++;
      if (r < 40 && g < 40 && b < 40) counts.black++;
    }
    const pixels = data.length / 4;
    return {
      ratios: {
        red: counts.red / pixels,
        green: counts.green / pixels,
        blue: counts.blue / pixels,
        black: counts.black / pixels,
      },
      width: video.videoWidth,
      height: video.videoHeight,
      png: canvas.toDataURL('image/png').split(',')[1],
    };
  }, userId);
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

test.describe('CallKit video content', () => {
  test.skip(!hasAccounts, '需要配置 EASEMOB_APPKEY 和 A、B 两个真实账号');

  test('callee receives changing color frames through an RTC video call', async ({
    browser,
  }, testInfo) => {
    const a = await test.step('主叫登录 CallKit demo', () =>
      openDemo(browser, caller, testInfo, 'caller'));
    let b: DemoClient | undefined;
    let latest: Awaited<ReturnType<typeof sampleRemoteVideo>> = null;
    const observations: unknown[] = [];
    try {
      const peer = await test.step('被叫登录 CallKit demo', () =>
        openDemo(browser, callee, testInfo, 'callee'));
      b = peer;
      const callId = await test.step('建立真实视频通话并确认双方发布音视频', async () => {
        const id = await inviteVideo(a, peer, callee.userId);
        await acceptVideo(a, peer, caller.userId, callee.userId);
        return id;
      });
      const localVideoId = () =>
        a.page.evaluate(() => {
          const client = (
            window as typeof window & {
              callService?: {
                client?: {
                  localTracks: {
                    trackMediaType: string;
                    getMediaStreamTrack(): MediaStreamTrack;
                  }[];
                };
              };
            }
          ).callService?.client;
          const track = client?.localTracks
            .find(item => item.trackMediaType === 'video')
            ?.getMediaStreamTrack();
          return track?.readyState === 'live' ? track.id : null;
        });
      const originalTrackId = await localVideoId();
      expect(originalTrackId).toBeTruthy();
      await a.page.getByRole('button', { name: '开始发送测试视频', exact: true }).click();
      await expect(a.page.getByLabel('视频测试状态')).toHaveText('正在发送黑色测试画面');

      const phases = [
        ['black', null],
        ['red', '红色'],
        ['green', '绿色'],
        ['blue', '蓝色'],
        ['red', '红色'],
      ] as const;
      for (const [index, [color, label]] of phases.entries()) {
        await test.step(`远端视频第 ${index + 1} 帧阶段：${
          label ?? '黑色基线'
        }占比超过 80%`, async () => {
          if (label)
            await a.page.getByRole('button', { name: `发送${label}画面`, exact: true }).click();
          await expect
            .poll(
              async () => {
                latest = await sampleRemoteVideo(peer.page, caller.userId);
                return latest?.ratios[color] ?? 0;
              },
              {
                timeout: 20_000,
                intervals: [100, 250, 500],
                message: `接收端远端视频应收到${color}画面`,
              },
            )
            .toBeGreaterThan(0.8);
          const frame = latest!;
          observations.push({
            phase: index + 1,
            expected: color,
            ratios: frame.ratios,
            width: frame.width,
            height: frame.height,
          });
          await testInfo.attach(`remote-frame-${index + 1}-${color}.png`, {
            body: Buffer.from(frame.png, 'base64'),
            contentType: 'image/png',
          });
        });
      }
      await test.step('停止测试视频，恢复原摄像头', async () => {
        await a.page.getByRole('button', { name: '停止测试视频', exact: true }).click();
        await expect(a.page.getByLabel('视频测试状态')).toHaveText('测试视频已停止，已恢复摄像头');
        await expect.poll(localVideoId).toBe(originalTrackId);
      });
      await test.step('挂断并确认双方媒体及服务端通话清理', async () => {
        await a.page.getByRole('button', { name: '结束通话', exact: true }).click();
        await Promise.all([expectCallIdle(a.page), expectCallIdle(peer.page)]);
        await expectServerCallEnded(a.page, callId);
      });
    } catch (error) {
      await Promise.allSettled([
        attachCallState(testInfo, 'caller', a.page),
        b && attachCallState(testInfo, 'callee', b.page),
      ]);
      // latest 在 test.step 回调中更新；显式保留类型，避免 catch 中被错误收窄为 null。
      const failedFrame = latest as Awaited<ReturnType<typeof sampleRemoteVideo>>;
      if (failedFrame)
        await testInfo.attach('last-remote-frame.png', {
          body: Buffer.from(failedFrame.png, 'base64'),
          contentType: 'image/png',
        });
      throw error;
    } finally {
      await testInfo.attach('rtc-video-colors.json', {
        body: Buffer.from(JSON.stringify({ threshold: 0.8, observations }, null, 2)),
        contentType: 'application/json',
      });
      if (b && !a.page.isClosed()) {
        const stop = a.page.getByRole('button', { name: '停止测试视频', exact: true });
        if (await stop.isEnabled().catch(() => false)) await stop.click().catch(() => undefined);
      }
      await Promise.allSettled([endCallIfPresent(a.page), b && endCallIfPresent(b.page)]);
      await Promise.allSettled([a.context.close(), b?.context.close()]);
    }
  });
});

type DemoClient = Awaited<ReturnType<typeof openDemo>>;

async function expectCallIdle(page: Page): Promise<void> {
  await expect(page.locator('.cui-callkit-invitation-accept-btn')).toBeHidden();
  await expect(page.getByRole('button', { name: '结束通话', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: '发起视频通话', exact: true })).toBeEnabled();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const service = (
            window as typeof window & {
              callService?: {
                getCallStatus(): number;
                getCurrentCallInfo(): unknown;
                client?: { connectionState: string; localTracks: unknown[] };
                rtc?: { localAudioTrack?: unknown; localVideoTrack?: unknown };
              };
            }
          ).callService;
          return Boolean(
            service &&
              service.getCallStatus() === 0 &&
              !service.getCurrentCallInfo() &&
              !service.rtc?.localAudioTrack &&
              !service.rtc?.localVideoTrack &&
              (!service.client ||
                (service.client.connectionState === 'DISCONNECTED' &&
                  service.client.localTracks.length === 0)),
          );
        }),
      { timeout: 30_000, message: '通话恢复空闲，RTC 退出并清理本地音视频轨道' },
    )
    .toBe(true);
}

async function inviteVideo(from: DemoClient, to: DemoClient, userId: string): Promise<string> {
  await from.page.getByPlaceholder('输入目标用户ID').fill(userId);
  await from.page.getByRole('button', { name: '发起视频通话', exact: true }).click();
  await waitForCreatedCall(from.page);
  await expect(to.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
  return from.page.evaluate(
    () =>
      (
        window as typeof window & {
          rootStore: { callStore: { snapshot: { callId: string } } };
        }
      ).rootStore.callStore.snapshot.callId,
  );
}

async function acceptVideo(a: DemoClient, b: DemoClient, aId: string, bId: string): Promise<void> {
  await b.page.locator('.cui-callkit-invitation-accept-btn').click();
  await Promise.all([expectInCall(a.page), expectInCall(b.page)]);
  await Promise.all([
    waitForParticipant(a.page, bId, 'accepted'),
    expectLiveVideo(a.page, `remote-${bId}`),
    expectLiveVideo(b.page, `remote-${aId}`),
  ]);
  for (const client of [a, b]) {
    await expect
      .poll(
        () =>
          client.page.evaluate(() => {
            const service = (
              window as typeof window & {
                callService?: {
                  getCallStatus(): number;
                  client?: { connectionState: string; localTracks: { trackMediaType: string }[] };
                };
              }
            ).callService;
            return Boolean(
              service?.getCallStatus() === 7 &&
                service.client?.connectionState === 'CONNECTED' &&
                ['audio', 'video'].every(callType =>
                  service.client?.localTracks.some(track => track.trackMediaType === callType),
                ),
            );
          }),
        { timeout: 30_000, message: '双方 RTC 已连接并发布音频、视频轨道' },
      )
      .toBe(true);
  }
}

async function attachDemoScreenshots(
  testInfo: TestInfo,
  stage: string,
  a: DemoClient,
  b: DemoClient,
) {
  for (const [name, client] of [
    ['caller', a],
    ['callee', b],
  ] as const) {
    await testInfo.attach(`${stage}-${name}`, {
      body: await client.page.screenshot(),
      contentType: 'image/png',
    });
  }
}

test.describe('CallKit presentation @demo', () => {
  test.skip(!hasAccounts, '需要配置 EASEMOB_APPKEY 和 A、B 两个真实账号');

  for (const scenario of ['主叫取消', '被叫拒绝', '接通挂断'] as const) {
    test(`${scenario}后再次视频呼叫成功`, async ({ browser }, testInfo) => {
      const a = await test.step('主叫登录并等待信令就绪', () =>
        openDemo(browser, caller, testInfo, 'caller'));
      let b: DemoClient | undefined;
      try {
        const peer = await test.step('被叫登录并等待信令就绪', () =>
          openDemo(browser, callee, testInfo, 'callee'));
        b = peer;
        const firstCallId = await test.step('A 发起视频邀请，B 显示来电', async () => {
          const id = await inviteVideo(a, peer, callee.userId);
          await attachDemoScreenshots(testInfo, 'invitation', a, peer);
          return id;
        });
        await test.step(scenario, async () => {
          if (scenario === '主叫取消') {
            await a.page.locator('.cui-call-controls-button-hangup').click();
          } else if (scenario === '被叫拒绝') {
            await peer.page.locator('.cui-callkit-invitation-reject-btn').click();
          } else {
            await acceptVideo(a, peer, caller.userId, callee.userId);
            await attachDemoScreenshots(testInfo, 'first-connected', a, peer);
            await peer.page.getByRole('button', { name: '结束通话', exact: true }).click();
          }
        });
        await test.step('双方界面恢复空闲，媒体资源清理，服务端通话结束', async () => {
          await Promise.all([expectCallIdle(a.page), expectCallIdle(peer.page)]);
          await expectServerCallEnded(a.page, firstCallId);
        });
        // Keep both pages logged in: a fresh browser would conceal stale call state.
        // Reverse caller/callee after a completed call to exercise both roles.
        const reverse = scenario === '接通挂断';
        const from = reverse ? peer : a;
        const to = reverse ? a : peer;
        const fromId = reverse ? callee.userId : caller.userId;
        const toId = reverse ? caller.userId : callee.userId;
        const nextCallId = await test.step('保持登录再次呼叫，双方接通并显示远端视频', async () => {
          const id = await inviteVideo(from, to, toId);
          expect(id, '再次呼叫应创建新的通话').not.toBe(firstCallId);
          await acceptVideo(from, to, fromId, toId);
          await attachDemoScreenshots(testInfo, 'recall-connected', a, peer);
          return id;
        });
        await test.step('挂断第二通，确认双方恢复可呼叫状态', async () => {
          await from.page.getByRole('button', { name: '结束通话', exact: true }).click();
          await Promise.all([expectCallIdle(a.page), expectCallIdle(peer.page)]);
          await expectServerCallEnded(from.page, nextCallId);
          await attachDemoScreenshots(testInfo, 'finished', a, peer);
        });
      } catch (error) {
        await Promise.allSettled([
          attachCallState(testInfo, 'caller', a.page),
          b && attachCallState(testInfo, 'callee', b.page),
        ]);
        throw error;
      } finally {
        // Also clean up ringing calls, which do not expose the demo's in-call button.
        for (const client of [a, b]) {
          if (!client || client.page.isClosed()) continue;
          await client.page
            .evaluate(async () => {
              const service = (
                window as typeof window & {
                  callService?: { getCurrentCallInfo(): unknown; hangup(): Promise<void> };
                }
              ).callService;
              if (service?.getCurrentCallInfo()) await service.hangup();
            })
            .catch(() => undefined);
        }
        await Promise.allSettled([a.context.close(), b?.context.close()]);
      }
    });
  }
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
      await expectCallIdle(b.page);
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

/** 只切断 Fusion 实际连接；正常帧透传真实服务器，不伪造响应，也不声称切断了 RTC UDP。 */
class FusionFault {
  private blocked = false;
  private readonly connections = new Set<WebSocketRoute>();

  async install(page: Page): Promise<void> {
    await page.routeWebSocket(
      url => url.pathname === '/ws',
      socket => {
        if (this.blocked) {
          void socket.close({ code: 1013, reason: 'E2E temporary signaling outage' });
          return;
        }
        socket.connectToServer();
        this.connections.add(socket);
      },
    );
  }

  async disconnect(): Promise<void> {
    this.blocked = true;
    expect(
      this.connections.size,
      '必须先连接过真实 Fusion，避免断网模拟未命中而假通过',
    ).toBeGreaterThan(0);
    await Promise.all(
      Array.from(this.connections, socket =>
        socket.close({ code: 1012, reason: 'E2E signaling interruption' }).catch(() => undefined),
      ),
    );
    this.connections.clear();
  }

  restore(): void {
    this.blocked = false;
  }
}

type ConferenceRole = 'A' | 'B' | 'C' | 'D';
type ConferencePeer = DemoClient & { account: Account };
interface ConferenceHarness {
  peers: Map<ConferenceRole, ConferencePeer>;
  fault: FusionFault;
  callId?: string;
}

/** 多人断言同时核对信令、RTC 订阅和实际播放帧，不能仅凭“通话中”文案判定通过。 */
async function expectConference(peers: ConferencePeer[], callId: string): Promise<void> {
  for (const peer of peers) {
    const remoteIds = peers.filter(other => other !== peer).map(other => other.account.userId);
    await expectInCall(peer.page);
    for (const id of remoteIds) await waitForParticipant(peer.page, id, 'accepted');
    await expect
      .poll(
        () =>
          peer.page.evaluate(
            ({ callId, remoteIds }) => {
              const service = (
                window as typeof window & {
                  callService?: {
                    getCurrentCallInfo(): { callId: string } | null;
                    getCallStatus(): number;
                    client?: {
                      connectionState: string;
                      localTracks: { trackMediaType: string }[];
                      remoteUsers: {
                        uid: string | number;
                        hasAudio: boolean;
                        hasVideo: boolean;
                        audioTrack?: unknown;
                        videoTrack?: unknown;
                      }[];
                    };
                  };
                }
              ).callService;
              const rtc = service?.client;
              return Boolean(
                service?.getCurrentCallInfo()?.callId === callId &&
                  service.getCallStatus() === 7 &&
                  rtc?.connectionState === 'CONNECTED' &&
                  ['audio', 'video'].every(
                    kind =>
                      rtc.localTracks.filter(track => track.trackMediaType === kind).length === 1,
                  ) &&
                  rtc.remoteUsers.length === remoteIds.length &&
                  remoteIds.every(id =>
                    rtc.remoteUsers.some(
                      user =>
                        String(user.uid) === id &&
                        user.hasAudio &&
                        user.hasVideo &&
                        user.audioTrack &&
                        user.videoTrack,
                    ),
                  ),
              );
            },
            { callId, remoteIds },
          ),
        { timeout: 45_000, message: '会议 ID 一致，音视频双向订阅，无重复发布或幽灵成员' },
      )
      .toBe(true);
    for (const id of remoteIds) await expectVideoAdvancing(peer.page, id);
  }
}

async function expectVideoAdvancing(page: Page, userId: string): Promise<void> {
  const frames = () =>
    page.locator(`[data-video-id="remote-${userId}"] video`).evaluateAll(elements =>
      elements.reduce((max, element) => {
        const video = element as HTMLVideoElement;
        return video.readyState >= 2 && video.videoWidth > 0
          ? Math.max(max, video.getVideoPlaybackQuality().totalVideoFrames)
          : max;
      }, -1),
    );
  const before = await frames();
  await expect
    .poll(frames, { timeout: 30_000, message: `远端 ${userId} 必须持续解码新视频帧` })
    .toBeGreaterThan(Math.max(0, before));
}

type VideoColor = 'red' | 'green' | 'blue';
const videoColorLabels: Record<VideoColor, string> = { red: '红色', green: '绿色', blue: '蓝色' };

/** 只替换本端摄像头输入，视频仍由真实 RTC 发布、传输、订阅并解码。 */
async function sendConferenceColor(peer: ConferencePeer, color: VideoColor): Promise<void> {
  const start = peer.page.getByRole('button', { name: '开始发送测试视频', exact: true });
  if (await start.isEnabled()) {
    await start.click();
    await expect(peer.page.getByLabel('视频测试状态')).toHaveText('正在发送黑色测试画面');
  }
  await peer.page
    .getByRole('button', { name: `发送${videoColorLabels[color]}画面`, exact: true })
    .click();
  await expect(peer.page.getByLabel('视频测试状态')).toHaveText(
    `正在发送${videoColorLabels[color]}测试画面`,
  );
}

/** 从指定接收者的远端 video 取像素；不能用发送 canvas 或整页截图代替媒体断言。 */
async function expectConferenceColor(
  receiver: ConferencePeer,
  sender: ConferencePeer,
  color: VideoColor,
  info: TestInfo,
  stage: string,
): Promise<void> {
  let latest: Awaited<ReturnType<typeof sampleRemoteVideo>> = null;
  const name = `${stage}-${sender.account.userId}-to-${receiver.account.userId}`;
  try {
    await expect
      .poll(
        async () => {
          latest = await sampleRemoteVideo(receiver.page, sender.account.userId);
          return latest?.ratios[color] ?? 0;
        },
        { timeout: 30_000, intervals: [100, 250, 500], message: `${name} 应收到${color}新画面` },
      )
      .toBeGreaterThan(0.8);
    await expectVideoAdvancing(receiver.page, sender.account.userId);
  } finally {
    const frame = latest as Awaited<ReturnType<typeof sampleRemoteVideo>>;
    await info.attach(`${name}.json`, {
      body: JSON.stringify({
        sender: sender.account.userId,
        receiver: receiver.account.userId,
        expectedColor: color,
        threshold: 0.8,
        observedAt: Date.now(),
        frame: frame && { width: frame.width, height: frame.height, ratios: frame.ratios },
      }),
      contentType: 'application/json',
    });
    if (frame) {
      await info.attach(`${name}.png`, {
        body: Buffer.from(frame.png, 'base64'),
        contentType: 'image/png',
      });
    }
  }
}

/** 每轮三人的颜色互不相同，逐一验证六条接收链路，轮换颜色排除冻结帧和串流。 */
async function expectConferenceColorMatrix(
  peers: ConferencePeer[],
  colors: VideoColor[],
  info: TestInfo,
  stage: string,
): Promise<void> {
  expect(colors).toHaveLength(peers.length);
  expect(new Set(colors).size).toBe(peers.length);
  for (const [index, peer] of peers.entries()) await sendConferenceColor(peer, colors[index]);
  for (const [index, sender] of peers.entries()) {
    for (const receiver of peers) {
      if (receiver !== sender) {
        await expectConferenceColor(receiver, sender, colors[index], info, stage);
      }
    }
  }
}

async function startConference(
  harness: ConferenceHarness,
  invitees: ConferenceRole[],
): Promise<string> {
  const a = harness.peers.get('A')!;
  await a.page
    .getByRole('textbox', { name: '多人通话成员 userId' })
    .fill(invitees.map(role => harness.peers.get(role)!.account.userId).join(','));
  await a.page.getByRole('button', { name: '发起多人视频通话', exact: true }).click();
  await waitForCreatedCall(a.page);
  const callId = await a.page.evaluate(
    () =>
      (
        window as typeof window & {
          rootStore: { callStore: { snapshot: { callId: string } } };
        }
      ).rootStore.callStore.snapshot.callId,
  );
  harness.callId = callId;
  return callId;
}

async function acceptConference(peer: ConferencePeer): Promise<void> {
  await peer.page.locator('.cui-callkit-invitation-accept-btn').click();
  await expectInCall(peer.page);
}

async function addConferencePeer(from: ConferencePeer, to: ConferencePeer): Promise<void> {
  await from.page.getByRole('textbox', { name: '追加邀请 userId' }).fill(to.account.userId);
  await from.page.getByRole('button', { name: '邀请加入当前通话', exact: true }).click();
  await expect(to.page.locator('.cui-callkit-invitation-accept-btn')).toBeVisible();
}

async function joinThree(
  harness: ConferenceHarness,
): Promise<[ConferencePeer, ConferencePeer, ConferencePeer]> {
  const a = harness.peers.get('A')!;
  const b = harness.peers.get('B')!;
  const c = harness.peers.get('C')!;
  const id = await test.step('A 一次邀请 B、C，三人接通视频会议', () =>
    startConference(harness, ['B', 'C']));
  await acceptConference(b);
  await acceptConference(c);
  await expectConference([a, b, c], id);
  return [a, b, c];
}

async function conferenceEvidence(
  harness: ConferenceHarness,
  info: TestInfo,
  stage: string,
): Promise<void> {
  for (const [role, peer] of harness.peers) {
    if (peer.page.isClosed()) continue;
    await info.attach(`${stage}-${role}.png`, {
      body: await peer.page.screenshot(),
      contentType: 'image/png',
    });
  }
}

async function signalingConnection(peer: ConferencePeer) {
  return peer.page.evaluate(() => {
    const session = (
      window as typeof window & {
        rootStore: {
          client: {
            getSharedSyncWebSocketSession(): {
              generation: number;
              isGatewayHandshakeReady(): boolean;
            };
          };
        };
      }
    ).rootStore.client.getSharedSyncWebSocketSession();
    return { generation: session.generation, ready: session.isGatewayHandshakeReady() };
  });
}

const conferenceTest = test.extend<{ conference: ConferenceHarness }>({
  conference: [
    async ({ browser }, use, info) => {
      const harness: ConferenceHarness = { peers: new Map(), fault: new FusionFault() };
      test.skip(info.title.includes('@four') && !hasAccount(fourth), '需要额外配置 D 账号');
      const accounts: [ConferenceRole, Account][] = [
        ['A', caller],
        ['B', callee],
        ['C', third],
      ];
      if (info.title.includes('@four')) accounts.push(['D', fourth]);
      expect(
        new Set(accounts.map(([, account]) => account.userId)).size,
        '多人通话账号不能重复',
      ).toBe(accounts.length);
      try {
        for (const [role, account] of accounts) {
          const client = await test.step(`${role} 登录 CallKit，等待 IM 与信令连接就绪`, () =>
            openDemo(
              browser,
              account,
              info,
              `conference-${role}`,
              role === 'B' && info.title.includes('CK-M08') ? harness.fault : undefined,
            ));
          harness.peers.set(role, { ...client, account });
        }
        await use(harness);
      } finally {
        harness.fault.restore();
        // 先保存各端状态再清理；清理时恢复网络、逐一离会，防止污染共用账号的下一条用例。
        for (const [role, peer] of harness.peers) {
          await attachCallState(info, `conference-${role}`, peer.page).catch(() => undefined);
        }
        const cleanupErrors: unknown[] = [];
        try {
          for (const peer of harness.peers.values()) {
            if (peer.page.isClosed()) continue;
            try {
              await peer.context.setOffline(false);
              await peer.page.evaluate(async () => {
                const service = (
                  window as typeof window & {
                    callService?: { getCurrentCallInfo(): unknown; hangup(): Promise<void> };
                  }
                ).callService;
                if (service?.getCurrentCallInfo()) await service.hangup();
              });
            } catch (error) {
              // 一端清理失败也要继续清理其他端；最终仍上报失败，不将清理错误当作通过。
              cleanupErrors.push(error);
            }
          }
          if (harness.callId && harness.peers.has('A')) {
            await expectServerCallEnded(harness.peers.get('A')!.page, harness.callId);
          }
        } catch (error) {
          cleanupErrors.push(error);
        } finally {
          await Promise.allSettled(
            Array.from(harness.peers.values(), peer => peer.context.close()),
          );
        }
        if (cleanupErrors.length) {
          await info.attach('conference-cleanup-error', {
            body: cleanupErrors.map(String).join('\n'),
            contentType: 'text/plain',
          });
          if (info.status === info.expectedStatus) throw cleanupErrors[0];
        }
      }
    },
    { timeout: 120_000 },
  ],
});

conferenceTest.describe('CallKit 多人真实音视频 @conference', () => {
  conferenceTest.skip(!hasAccounts || !hasAccount(third), '需要 A、B、C 三个不同的真实 IM 账号');
  conferenceTest.beforeEach(async ({}, info) => {
    info.annotations.push({ type: '用例编号', description: info.title.match(/CK-M\d+/)![0] });
    info.annotations.push({
      type: '覆盖层',
      description: 'CallKit UI + 真实 IM/Fusion + 真实 Agora RTC；虚拟音视频输入',
    });
  });

  // CK-M01：最基本的三人完整链路，验证各端均收到另外两人的真实音视频，并在最后一人离开后结束会议。
  conferenceTest(
    'CK-M01 三人同时受邀入会，双向音视频正常并依次离会',
    async ({ conference }, info) => {
      await joinThree(conference);
      await conferenceEvidence(conference, info, '三人视频接通');
    },
  );

  // CK-M02：A 邀请 B，B 再邀请 C，C 再邀请 D；验证普通成员也能邀请，四端始终属于同一会议。
  conferenceTest(
    'CK-M02 成员接力邀请，从两人扩展为四人视频会议 @four',
    async ({ conference }, info) => {
      conferenceTest.skip(!hasAccount(fourth), '需要额外配置 D 账号');
      const [a, b, c, d] = ['A', 'B', 'C', 'D'].map(
        role => conference.peers.get(role as ConferenceRole)!,
      );
      const id = await test.step('A 邀请 B 并接通', () => startConference(conference, ['B']));
      await acceptConference(b);
      await expectConference([a, b], id);
      await test.step('B 邀请 C，C 接听', async () => {
        await addConferencePeer(b, c);
        await acceptConference(c);
      });
      await expectConference([a, b, c], id);
      await test.step('C 邀请 D，D 接听', async () => {
        await addConferencePeer(c, d);
        await acceptConference(d);
      });
      await expectConference([a, b, c, d], id);
      await conferenceEvidence(conference, info, '四人接力入会');
    },
  );

  // CK-M03：多人会议发起人退出不应等同结束整场；其他两人的远端视频必须继续产生新帧。
  conferenceTest('CK-M03 发起人先离会，其他成员继续视频通话', async ({ conference }, info) => {
    const [a, b, c] = await joinThree(conference);
    await test.step('A 离会，B、C 留在原会议', async () => {
      await a.page.getByRole('button', { name: '结束通话', exact: true }).click();
      await expectCallIdle(a.page);
      await waitForParticipant(b.page, a.account.userId, 'left');
      await waitForParticipant(c.page, a.account.userId, 'left');
      await expectConference([b, c], conference.callId!);
    });
    await conferenceEvidence(conference, info, '发起人离会后');
  });

  // CK-M04：普通成员离会只清理自己的资源；留会成员再次邀请该账号，原页面无需刷新即可重新发布视频。
  conferenceTest(
    'CK-M04 普通成员离会后重新受邀加入，不残留重复轨道',
    async ({ conference }, info) => {
      const [a, b, c] = await joinThree(conference);
      await test.step('C 主动退出，A、B 保持通话', async () => {
        await c.page.getByRole('button', { name: '结束通话', exact: true }).click();
        await expectCallIdle(c.page);
        await waitForParticipant(a.page, c.account.userId, 'left');
        await expectConference([a, b], conference.callId!);
      });
      await test.step('B 重新邀请 C，保持原会议 ID 和登录页面', async () => {
        await addConferencePeer(b, c);
        await acceptConference(c);
        await expectConference([a, b, c], conference.callId!);
      });
      await conferenceEvidence(conference, info, '离会重新加入');
    },
  );

  // CK-M05：追加邀请被拒绝不能打断当前会议；换一个邀请人重邀后，应能正常接听。
  conferenceTest(
    'CK-M05 追加邀请被拒绝后，由另一成员再次邀请并接通',
    async ({ conference }, info) => {
      const [a, b, c] = ['A', 'B', 'C'].map(role => conference.peers.get(role as ConferenceRole)!);
      const id = await startConference(conference, ['B']);
      await acceptConference(b);
      await expectConference([a, b], id);
      await test.step('A 邀请 C，C 拒绝，A、B 通话不受影响', async () => {
        await addConferencePeer(a, c);
        await c.page.locator('.cui-callkit-invitation-reject-btn').click();
        await expectCallIdle(c.page);
        await waitForParticipant(a.page, c.account.userId, 'rejected');
        await expectConference([a, b], id);
      });
      await test.step('B 再次邀请 C 并接通', async () => {
        await addConferencePeer(b, c);
        await acceptConference(c);
      });
      await expectConference([a, b, c], id);
      await conferenceEvidence(conference, info, '拒绝后重新入会');
    },
  );

  // CK-M06：操作 CallKit 自身麦克风按钮，不能使用 demo 仅修改提示文字的模拟控制按钮。
  conferenceTest(
    'CK-M06 成员静音再恢复，远端音频状态同步且视频不中断',
    async ({ conference }, info) => {
      const [a, b, c] = await joinThree(conference);
      await test.step('B 关闭麦克风，A、C 检测音频停止，视频继续', async () => {
        await b.page
          .locator('.cui-call-controls')
          .getByRole('button', { name: /^(静音|Mute)$/ })
          .click();
        for (const peer of [a, c]) {
          await expectRemotePublication(peer.page, b.account.userId, 'audio', false);
          await expectVideoAdvancing(peer.page, b.account.userId);
        }
      });
      await test.step('B 开启麦克风，A、C 恢复订阅音频', async () => {
        await b.page
          .locator('.cui-call-controls')
          .getByRole('button', { name: /^(取消静音|Unmute)$/ })
          .click();
        await expectConference([a, b, c], conference.callId!);
      });
      await conferenceEvidence(conference, info, '静音恢复');
    },
  );

  // CK-M07：关摄像头不能误退会或关闭音频；重新开启后，两位远端都必须收到新的视频帧。
  conferenceTest(
    'CK-M07 成员关闭再开启摄像头，音频保持且画面恢复',
    async ({ conference }, info) => {
      const [a, b, c] = await joinThree(conference);
      await test.step('C 关闭摄像头，A、B 保持接收 C 的音频', async () => {
        await c.page
          .locator('.cui-call-controls')
          .getByRole('button', { name: /^(关闭摄像头|Turn off camera)$/ })
          .click();
        for (const peer of [a, b]) {
          await expectRemotePublication(peer.page, c.account.userId, 'video', false);
          await expectRemotePublication(peer.page, c.account.userId, 'audio', true);
        }
      });
      await test.step('C 重新打开摄像头，三人视频恢复', async () => {
        await c.page
          .locator('.cui-call-controls')
          .getByRole('button', { name: /^(开启摄像头|Turn on camera)$/ })
          .click();
        await expectConference([a, b, c], conference.callId!);
      });
      await conferenceEvidence(conference, info, '摄像头重新开启');
    },
  );

  // CK-M08：仅注入 Fusion 信令断链，不调用离会，也不模拟服务端事件；验证重连后仍在原会议且媒体不重复发布。
  conferenceTest(
    'CK-M08 成员信令短暂断线后恢复，原会议及音视频保持 @fault',
    async ({ conference }, info) => {
      const [a, b, c] = await joinThree(conference);
      await expectConferenceColorMatrix([a, b, c], ['red', 'green', 'blue'], info, '信令断线前');
      const before = await signalingConnection(b);
      try {
        await test.step('切断 B 的 Fusion，确认连接确实失效，其他成员继续通话', async () => {
          await conference.fault.disconnect();
          await expect.poll(async () => (await signalingConnection(b)).ready).toBe(false);
          // 明确的 3 秒故障注入窗口；恢复后使用状态与视频新帧轮询，不依赖固定重连耗时。
          await delay(3000);
          await expectVideoAdvancing(a.page, c.account.userId);
          await expectVideoAdvancing(c.page, a.account.userId);
        });
        await test.step('恢复网络，验证新连接握手成功且仍在原会议', async () => {
          conference.fault.restore();
          await expect
            .poll(() => signalingConnection(b), { timeout: 90_000 })
            .toMatchObject({ ready: true });
          expect((await signalingConnection(b)).generation).toBeGreaterThan(before.generation);
          await expectConference([a, b, c], conference.callId!);
          await expectConferenceColorMatrix(
            [a, b, c],
            ['green', 'blue', 'red'],
            info,
            '信令恢复后新画面',
          );
        });
        await info.attach('信令断线恢复.json', {
          body: JSON.stringify({
            before,
            after: await signalingConnection(b),
            callId: conference.callId,
          }),
          contentType: 'application/json',
        });
        await conferenceEvidence(conference, info, '信令断线恢复后');
      } finally {
        conference.fault.restore();
      }
    },
  );

  // CK-M09：真正崩溃 C 的渲染进程，不发送 leaveCall，不手工触发 user-left；等待真实 RTC 离线通知与媒体清理。
  // RTC 清理不等同信令 participant 自动 left；服务端快照单独记录，避免把两种结果混作“自动离会成功”。
  conferenceTest(
    'CK-M09 成员异常掉线后 RTC 自动清理远端媒体，其他成员继续通话 @fault',
    async ({ conference, browser }, info) => {
      conferenceTest.setTimeout(240_000);
      const [a, b, c] = await joinThree(conference);
      const events = await a.page.evaluate(() => {
        const state = window as typeof window & {
          callService: {
            client: {
              on(
                event: 'user-left',
                callback: (user: { uid: string | number }, reason: string) => void,
              ): void;
            };
          };
          __conferenceDepartures?: { userId: string; reason: string; at: number }[];
        };
        state.__conferenceDepartures = [];
        state.callService.client.on('user-left', (user, reason) =>
          state.__conferenceDepartures!.push({ userId: String(user.uid), reason, at: Date.now() }),
        );
        return { startedAt: Date.now() };
      });
      let faultStartedAt = 0;
      try {
        await test.step('C 渲染进程崩溃，模拟无法主动离会的持续掉线', async () => {
          const cdp = await c.context.newCDPSession(c.page);
          const crashed = c.page.waitForEvent('crash');
          faultStartedAt = Date.now();
          void cdp.send('Page.crash').catch(() => undefined);
          await crashed;
          // 崩溃页面不能再截图或 evaluate；上下文关闭不调用 CallKit 的 hangup。
          await c.context.close();
        });
        await test.step('等待真实 RTC 离线回调，A、B 自动清理 C 的视频与音频', async () => {
          await expect
            .poll(
              () =>
                a.page.evaluate(
                  id =>
                    (
                      window as typeof window & {
                        __conferenceDepartures?: { userId: string; reason: string }[];
                      }
                    ).__conferenceDepartures?.some(
                      event => event.userId === id && event.reason === 'ServerTimeOut',
                    ),
                  c.account.userId,
                ),
              { timeout: 120_000 },
            )
            .toBe(true);
          await expectConference([a, b], conference.callId!);
          for (const peer of [a, b]) {
            await expect(
              peer.page.locator(`[data-video-id="remote-${c.account.userId}"]`),
            ).toHaveCount(0);
          }
        });
        const server = await a.page.evaluate(
          async id =>
            (
              window as typeof window & {
                rootStore: {
                  client: {
                    callSignalingManager: { getCallSnapshot(id: string): Promise<unknown> };
                  };
                };
              }
            ).rootStore.client.callSignalingManager.getCallSnapshot(id),
          conference.callId!,
        );
        const departures = await a.page.evaluate(
          () =>
            (
              window as typeof window & {
                __conferenceDepartures?: { userId: string; reason: string; at: number }[];
              }
            ).__conferenceDepartures ?? [],
        );
        await info.attach('异常掉线检测.json', {
          body: JSON.stringify(
            {
              ...events,
              faultStartedAt,
              rtcDetectionElapsedMs: departures.find(event => event.userId === c.account.userId)
                ? departures.find(event => event.userId === c.account.userId)!.at - faultStartedAt
                : null,
              observedAt: Date.now(),
              rtcDepartures: departures,
              serverSnapshot: server,
              note: '验证 RTC 离线和媒体清理；信令是否自动 left 请查看 serverSnapshot，不作等价推断。',
            },
            null,
            2,
          ),
          contentType: 'application/json',
        });
        await conferenceEvidence(conference, info, '异常成员移除后');
      } finally {
        // 若网关未自动把 C 标记 left，用真实账号重新登录后补发离会，仅用于清理，不能算进自动离线检测结果。
        if (c.page.isClosed()) {
          const replacement = await openDemo(browser, c.account, info, 'conference-C-cleanup');
          conference.peers.set('C', { ...replacement, account: c.account });
          await replacement.page.evaluate(async callId => {
            const manager = (
              window as typeof window & {
                rootStore: {
                  client: {
                    callSignalingManager: {
                      getCallSnapshot(id: string): Promise<{
                        lifecycle: string;
                        participants: { userId: string; state: string }[];
                      }>;
                      leaveCall(id: string): Promise<unknown>;
                    };
                  };
                };
              }
            ).rootStore.client.callSignalingManager;
            const snapshot = await manager.getCallSnapshot(callId);
            if (snapshot.lifecycle === 'open') await manager.leaveCall(callId);
          }, conference.callId!);
        }
      }
    },
  );

  // CK-M10：三人各发不同颜色的动态视频，并轮换三轮；每个人都要实际收到其他两人的正确新画面。
  // 同时检查六条接收链路的像素和解码帧增长，发现黑屏、冻结帧、错绑用户或视频串流。
  conferenceTest(
    'CK-M10 三人分别发送动态视频，各端收到每位成员的正确画面 @content',
    async ({ conference }, info) => {
      const peers = await joinThree(conference);
      const rounds: VideoColor[][] = [
        ['red', 'green', 'blue'],
        ['green', 'blue', 'red'],
        ['blue', 'red', 'green'],
      ];
      for (const [index, colors] of rounds.entries()) {
        await test.step(`第 ${index + 1} 轮轮换三人颜色，逐一校验六条真实 RTC 视频链路`, () =>
          expectConferenceColorMatrix(peers, colors, info, `多人画面第${index + 1}轮`));
      }
      await conferenceEvidence(conference, info, '三人真实视频内容验证');
    },
  );

  // CK-M11：暂停 B 的视频 RTP 编码发送，确认远端确实收不到新画面，再恢复同一发送器。
  // 这是媒体发送中断，不等同整机断网；不调用离会/重入、不伪造远端回调、不重新发布视频。
  conferenceTest(
    'CK-M11 成员视频 RTP 发送中断后恢复，其他成员收到正确的新画面 @fault @content',
    async ({ conference }, info) => {
      const [a, b, c] = await joinThree(conference);
      await expectConferenceColorMatrix([a, b, c], ['red', 'green', 'blue'], info, '媒体中断前');
      const observations: unknown[] = [];
      const setVideoSending = (active: boolean) =>
        b.page.evaluate(async enabled => {
          const service = (
            window as typeof window & {
              callService: {
                client: {
                  localTracks: {
                    trackMediaType: string;
                    getRTCRtpTransceiver(): RTCRtpTransceiver | undefined;
                  }[];
                };
              };
            }
          ).callService;
          const sender = service.client.localTracks
            .find(track => track.trackMediaType === 'video')
            ?.getRTCRtpTransceiver()?.sender;
          if (!sender) throw new Error('未找到当前已发布视频的真实 RTP 发送器');
          const parameters = sender.getParameters();
          if (!parameters.encodings.length)
            throw new Error('视频 RTP 编码参数为空，无法注入媒体中断');
          for (const encoding of parameters.encodings) encoding.active = enabled;
          await sender.setParameters(parameters);
          return sender.getParameters().encodings.map(encoding => encoding.active);
        }, active);
      try {
        await test.step('暂停 B 视频 RTP 发送，确认 A、C 收不到新颜色，其他链路仍正常', async () => {
          expect(await setVideoSending(false)).toEqual([false]);
          // 排空已发送的包，再改变源画面；不能仅凭设置成功就认为故障生效。
          await delay(2000);
          await sendConferenceColor(b, 'red');
          await sendConferenceColor(a, 'blue');
          const until = Date.now() + 3000;
          while (Date.now() < until) {
            for (const receiver of [a, c]) {
              const frame = await sampleRemoteVideo(receiver.page, b.account.userId);
              observations.push({
                at: Date.now(),
                receiver: receiver.account.userId,
                ratios: frame?.ratios,
              });
              expect(frame, '断流时保留最后一个已解码画面').not.toBeNull();
              expect(
                frame!.ratios.green,
                'B 源已变红但远端仍为绿色，证明新视频确实未传递',
              ).toBeGreaterThan(0.8);
            }
            await delay(250);
          }
          await expectConferenceColor(c, a, 'blue', info, '其他成员视频保持正常');
          await expectConferenceColor(b, a, 'blue', info, '故障成员仍正常接收视频');
        });
        await test.step('恢复同一视频 RTP 发送器，不重新入会，两端收到断流期间产生的新红色画面', async () => {
          expect(await setVideoSending(true)).toEqual([true]);
          await expectConference([a, b, c], conference.callId!);
          await expectConferenceColor(a, b, 'red', info, '视频发送恢复后');
          await expectConferenceColor(c, b, 'red', info, '视频发送恢复后');
        });
        await test.step('恢复后再次轮换所有成员画面，排除冻结帧或用户串流', async () => {
          await expectConferenceColorMatrix(
            [a, b, c],
            ['green', 'blue', 'red'],
            info,
            '媒体恢复后再次换色',
          );
        });
        await conferenceEvidence(conference, info, '视频RTP发送恢复后');
      } finally {
        try {
          await setVideoSending(true);
        } finally {
          await info.attach('视频RTP发送中断观测.json', {
            body: JSON.stringify(
              {
                fault: 'RTCRtpSender encoding.active=false',
                scope: '仅 B 视频上行；不代表设备完整断网或 RTC 自动重连',
                observations,
              },
              null,
              2,
            ),
            contentType: 'application/json',
          });
        }
      }
    },
  );
});

async function expectRemotePublication(
  page: Page,
  userId: string,
  media: 'audio' | 'video',
  published: boolean,
): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ userId, media }) => {
            const service = (
              window as typeof window & {
                callService?: {
                  client?: {
                    remoteUsers: { uid: string | number; hasAudio: boolean; hasVideo: boolean }[];
                  };
                };
              }
            ).callService;
            const user = service?.client?.remoteUsers.find(item => String(item.uid) === userId);
            return user ? (media === 'audio' ? user.hasAudio : user.hasVideo) : null;
          },
          { userId, media },
        ),
      { message: `远端 ${userId} 的 ${media} 发布状态应为 ${published}` },
    )
    .toBe(published);
}
