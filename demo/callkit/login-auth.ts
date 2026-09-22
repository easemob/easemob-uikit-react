export interface PasswordTokenExchangeOptions {
  appKey: string;
  userId: string;
  password: string;
  restBaseUrl: string;
  fetchImpl?: typeof fetch;
}

interface TokenExchangeResponse {
  access_token?: unknown;
  token?: unknown;
}

const parseAppKey = (appKey: string): { orgName: string; appName: string } => {
  const [orgName, appName, ...rest] = appKey.trim().split('#');
  if (!orgName || !appName || rest.length > 0) {
    throw new Error('App Key 格式错误，应为 org#app');
  }
  return { orgName, appName };
};

export const exchangePasswordForToken = async (
  options: PasswordTokenExchangeOptions,
): Promise<string> => {
  const { orgName, appName } = parseAppKey(options.appKey);
  const url = `${options.restBaseUrl.replace(/\/+$/, '')}/${orgName}/${appName}/token`;
  const response = await (options.fetchImpl ?? fetch)(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'password',
      username: options.userId.trim(),
      password: options.password,
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail.trim()
        ? `密码换取 token 失败: HTTP ${response.status} ${detail.trim()}`
        : `密码换取 token 失败: HTTP ${response.status}`,
    );
  }

  const payload = (await response.json()) as TokenExchangeResponse;
  const token =
    typeof payload.access_token === 'string'
      ? payload.access_token.trim()
      : typeof payload.token === 'string'
      ? payload.token.trim()
      : '';
  if (!token) throw new Error('密码换取 token 失败: 响应中缺少 token');
  return token;
};
