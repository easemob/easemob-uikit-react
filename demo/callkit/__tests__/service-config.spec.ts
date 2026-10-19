import { describe, expect, it } from 'vitest';
import { deriveCallDemoFusionUrl, resolveCallDemoServiceConfig } from '../service-config';

describe('deriveCallDemoFusionUrl', () => {
  it('从正式 REST 域名生成加密的 Fusion 地址，忽略 REST 路径', () => {
    expect(deriveCallDemoFusionUrl('https://rest.example.com/api/')).toBe(
      'wss://rest.example.com/ws',
    );
  });

  it('保留本地代理端口', () => {
    expect(deriveCallDemoFusionUrl('http://localhost:5174/rest')).toBe(
      'ws://localhost:5174/ws',
    );
  });

  it('输入无效时不展示错误的信令地址', () => {
    expect(deriveCallDemoFusionUrl('')).toBe('');
    expect(deriveCallDemoFusionUrl('wss://rest.example.com')).toBe('');
  });
});

describe('resolveCallDemoServiceConfig', () => {
  it('开发代理模式使用当前页面同源的 REST 和 MSync 地址', () => {
    expect(
      resolveCallDemoServiceConfig({
        mode: 'proxy',
        origin: 'http://localhost:5174',
        restUrl: '',
        msyncUrl: '',
      }),
    ).toEqual({
      restUrl: 'http://localhost:5174/rest',
      msyncUrl: 'ws://localhost:5174/websocket',
    });
  });

  it('HTTPS 页面使用 WSS 代理地址', () => {
    expect(
      resolveCallDemoServiceConfig({
        mode: 'proxy',
        origin: 'https://call.example.com/',
        restUrl: '',
        msyncUrl: '',
      }),
    ).toEqual({
      restUrl: 'https://call.example.com/rest',
      msyncUrl: 'wss://call.example.com/websocket',
    });
  });

  it('私有服务模式保留配置地址并移除尾部斜杠', () => {
    expect(
      resolveCallDemoServiceConfig({
        mode: 'custom',
        origin: 'http://localhost:5174',
        restUrl: 'https://rest.example.com/',
        msyncUrl: 'wss://msync.example.com/websocket/',
      }),
    ).toEqual({
      restUrl: 'https://rest.example.com',
      msyncUrl: 'wss://msync.example.com/websocket',
    });
  });
});
