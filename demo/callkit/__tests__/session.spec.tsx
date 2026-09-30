import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatClient } from '../../../module/SDK';
import RealCallDemo from '../call-demo';
import { CallService } from '../../../module/callkit/services/CallService';

describe('Call demo IM session', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:5174/?userId=alice&token=demo-token';
  });
  afterEach(() => {
    cleanup();
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

  it('enables the invite controls after joining a conference and submits entered users', async () => {
    vi.spyOn(ChatClient.prototype, 'login').mockResolvedValue(undefined);
    vi.spyOn(ChatClient.prototype, 'getCurrentUserId').mockReturnValue('alice');
    vi.spyOn(CallService.prototype, 'startCall').mockImplementation(async function (this: CallService) {
      (this as any).onCallStart?.([{ id: 'local', isLocalVideo: true, cameraEnabled: false }]);
      return {
        callId: 'conference', kind: 'conference', mediaType: 'video', lifecycle: 'open',
        revision: '1', createdAt: 1, creatorUserId: 'alice',
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
