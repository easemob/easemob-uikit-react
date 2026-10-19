import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatClient } from '../../../module/SDK';
import RealCallDemo from '../call-demo';
import { CallService } from '../../../module/callkit/services/CallService';
import { CALL_DEMO_LOGIN_STORAGE_KEY } from '../login-storage';
import rootStore from '../../../module/store';

describe('Call demo IM session', () => {
  beforeEach(() => {
    window.localStorage.removeItem(CALL_DEMO_LOGIN_STORAGE_KEY);
    window.location.href = 'http://localhost:5174/?userId=alice&token=demo-token';
  });
  afterEach(() => {
    cleanup();
    window.localStorage.removeItem(CALL_DEMO_LOGIN_STORAGE_KEY);
    vi.restoreAllMocks();
    window.location.href = 'http://localhost:5174/';
  });

  it('waits for IM login and logs out the SDK before allowing a second login', async () => {
    let finishLogin!: () => void;
    const login = vi.spyOn(ChatClient.prototype, 'login').mockImplementation(
      () => new Promise<void>(resolve => { finishLogin = resolve; }),
    );
    let finishLogout!: () => void;
    const logout = vi.spyOn(ChatClient.prototype, 'logout').mockImplementation(
      () => new Promise<void>(resolve => { finishLogout = resolve; }),
    );
    render(<RealCallDemo />);
    await waitFor(() => expect(login).toHaveBeenCalledOnce());
    expect(screen.queryByText('CallKit 通话演示')).toBeNull();
    await act(async () => { finishLogin(); });
    expect(screen.getByText('CallKit 通话演示')).toBeTruthy();

    fireEvent.click(screen.getByText('登出'));
    expect(logout).toHaveBeenCalledOnce();
    expect(screen.queryByText('登录')).toBeNull();
    await act(async () => { finishLogout(); });
    fireEvent.click(screen.getByText('登录'));
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('CallKit 通话演示')).toBeNull();
    await act(async () => { finishLogin(); });
    expect(screen.getByText('CallKit 通话演示')).toBeTruthy();
  });

  it('returns to the login form when IM login fails', async () => {
    vi.spyOn(ChatClient.prototype, 'login').mockRejectedValue(new Error('IM authentication failed'));
    render(<RealCallDemo />);
    await waitFor(() => expect(screen.getByText('IM 登录失败')).toBeTruthy());
    expect(screen.getByText('登录')).toBeTruthy();
    expect(screen.queryByText('登出')).toBeNull();
  });

  it('saves custom inputs only after IM login succeeds and prefills without auto-login', async () => {
    // 此处验证表单存储，复用已有客户端，避免 SDK 单例限制不同的测试服务配置。
    vi.spyOn(ChatClient, 'init').mockReturnValue(rootStore.client);
    const saved = {
      serviceMode: 'custom', appKey: 'demo#app', restUrl: 'https://rest.example.com',
      msyncUrl: 'wss://msync.example.com/websocket', userId: 'alice',
      token: 'demo-token', password: 'demo-password', rtcAppId: 'a'.repeat(32),
    };
    window.location.href = `http://localhost:5174/?${new URLSearchParams(saved)}`;
    let finishLogin!: () => void;
    const login = vi.spyOn(ChatClient.prototype, 'login').mockImplementation(
      () => new Promise<void>(resolve => { finishLogin = resolve; }),
    );
    render(<RealCallDemo />);
    await waitFor(() => expect(login).toHaveBeenCalledOnce());
    expect(window.localStorage.getItem(CALL_DEMO_LOGIN_STORAGE_KEY)).toBeNull();
    await act(async () => { finishLogin(); });
    expect(JSON.parse(window.localStorage.getItem(CALL_DEMO_LOGIN_STORAGE_KEY)!)).toEqual(saved);

    cleanup();
    window.location.href = 'http://localhost:5174/';
    render(<RealCallDemo />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('custom');
    for (const value of [saved.appKey, saved.restUrl, saved.msyncUrl, saved.userId,
      saved.token, saved.password, saved.rtcAppId]) {
      expect(screen.getByDisplayValue(value)).toBeTruthy();
    }
    expect(screen.getByText('登录')).toBeTruthy();
    expect(login).toHaveBeenCalledOnce();
  });

  it('keeps the previous custom login when a URL-specified account fails to log in', async () => {
    vi.spyOn(ChatClient, 'init').mockReturnValue(rootStore.client);
    const previous = JSON.stringify({
      serviceMode: 'custom', appKey: 'demo#app', restUrl: 'https://rest.example.com',
      msyncUrl: 'wss://msync.example.com/websocket', userId: 'bob',
      token: 'previous-token', password: 'previous-password', rtcAppId: 'a'.repeat(32),
    });
    window.localStorage.setItem(CALL_DEMO_LOGIN_STORAGE_KEY, previous);
    window.location.href = 'http://localhost:5174/?userId=alice&token=invalid-token';
    const login = vi.spyOn(ChatClient.prototype, 'login').mockRejectedValue(new Error('invalid token'));
    render(<RealCallDemo />);
    await waitFor(() => expect(screen.getByText('IM 登录失败')).toBeTruthy());
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ userId: 'alice', token: 'invalid-token' }));
    expect(window.localStorage.getItem(CALL_DEMO_LOGIN_STORAGE_KEY)).toBe(previous);
    expect((screen.getByPlaceholderText('未填写 Token 时，使用密码换取 Token') as HTMLInputElement).value).toBe('');
  });

  it('uses IM SDK RTC credentials when App ID is blank and enables conference invitations', async () => {
    vi.spyOn(ChatClient.prototype, 'login').mockResolvedValue(undefined);
    vi.spyOn(ChatClient.prototype, 'getCurrentUserId').mockReturnValue('alice');
    vi.spyOn(CallService.prototype, 'startCall').mockImplementation(async function (this: CallService) {
      expect((this as any).rtcProvider).toBeUndefined();
      expect((this as any).useRTCToken).toBe(true);
      (this as any).onCallStart?.([{ id: 'local', isLocalVideo: true, cameraEnabled: false }]);
      return {
        callId: 'conference', callType: 'conference', mediaType: 'video', lifecycle: 'open',

        participants: [{ userId: 'alice', state: 'accepted' }],
      };
    });
    const invite = vi.spyOn(CallService.prototype, 'addParticipants').mockResolvedValue(true);
    render(<RealCallDemo />);
    await waitFor(() => expect(screen.getByText('登出')).toBeTruthy());
    fireEvent.click(screen.getByText('完成配置'));
    const input = screen.getByPlaceholderText('例如 david, emma') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('例如 alice, bob, charlie'), { target: { value: 'bob' } });
    fireEvent.click(screen.getByRole('button', { name: '发起多人视频通话' }));
    await waitFor(() => expect(input.disabled).toBe(false));
    fireEvent.change(input, { target: { value: 'charlie, david' } });
    const button = screen.getByText('邀请加入当前通话') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(invite).toHaveBeenCalledWith(['charlie', 'david']));
    await waitFor(() => expect(input.value).toBe(''));
  });
});
