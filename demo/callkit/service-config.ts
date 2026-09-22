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
