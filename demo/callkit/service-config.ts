export type CallDemoServiceMode = 'proxy' | 'custom';

export interface CallDemoServiceConfig {
  restUrl: string;
  msyncUrl: string;
}

export interface ResolveCallDemoServiceConfigOptions {
  mode: CallDemoServiceMode;
  origin: string;
  restUrl: string;
  msyncUrl: string;
}

// SDK 5 derives the Fusion endpoint from the REST authority, ignoring its path.
export const deriveCallDemoFusionUrl = (restUrl: string): string => {
  try {
    const url = new URL('/ws', restUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString();
  } catch {
    return '';
  }
};

export const resolveCallDemoServiceConfig = (
  options: ResolveCallDemoServiceConfigOptions,
): CallDemoServiceConfig => {
  if (options.mode === 'custom') {
    return {
      restUrl: options.restUrl.trim().replace(/\/+$/, ''),
      msyncUrl: options.msyncUrl.trim().replace(/\/+$/, ''),
    };
  }

  const httpOrigin = options.origin.replace(/\/+$/, '');
  const wsOrigin = httpOrigin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return {
    restUrl: `${httpOrigin}/rest`,
    msyncUrl: `${wsOrigin}/websocket`,
  };
};
