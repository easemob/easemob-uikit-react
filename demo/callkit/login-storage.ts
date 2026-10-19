import type { CallDemoServiceMode } from './service-config';

export const CALL_DEMO_LOGIN_STORAGE_KEY = 'easemob.callkit.demo.custom-login.v1';

export interface CallDemoLoginForm {
  appKey: string;
  restUrl: string;
  msyncUrl: string;
  userId: string;
  token: string;
  password: string;
  rtcAppId: string;
  serviceMode: CallDemoServiceMode;
}

export function readCustomLogin(): CallDemoLoginForm | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CALL_DEMO_LOGIN_STORAGE_KEY) || 'null');
    const fields = ['appKey', 'restUrl', 'msyncUrl', 'userId', 'token', 'password', 'rtcAppId'];
    if (saved?.serviceMode !== 'custom' || !fields.every(field => typeof saved[field] === 'string')) {
      return null;
    }
    return saved as CallDemoLoginForm;
  } catch {
    return null;
  }
}

export function saveCustomLogin(form: CallDemoLoginForm): void {
  if (form.serviceMode !== 'custom') return;
  try {
    window.localStorage.setItem(CALL_DEMO_LOGIN_STORAGE_KEY, JSON.stringify(form));
  } catch {
    // 浏览器禁用存储或空间不足时，仍然允许正常登录。
  }
}
