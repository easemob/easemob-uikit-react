import { exchangePasswordForToken } from '../login-auth';

describe('CallKit demo login auth', () => {
  it('exchanges password for token with the app key REST path', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'demo-token' }),
    });

    await expect(
      exchangePasswordForToken({
        appKey: 'org#app',
        userId: 'user-1',
        password: 'secret',
        restBaseUrl: 'https://example.test/',
        fetchImpl,
      }),
    ).resolves.toBe('demo-token');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/org/app/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid app keys before requesting', async () => {
    const fetchImpl = vi.fn();
    await expect(
      exchangePasswordForToken({
        appKey: 'invalid',
        userId: 'user-1',
        password: 'secret',
        restBaseUrl: 'https://example.test',
        fetchImpl,
      }),
    ).rejects.toThrow('App Key 格式错误');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
