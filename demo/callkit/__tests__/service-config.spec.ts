import { describe, expect, it } from 'vitest';
import { resolveCallDemoServiceConfig } from '../service-config';

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
