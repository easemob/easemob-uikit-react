import { AgoraRTCErrorCode } from 'agora-rtc-sdk-ng';

export enum CallErrorCode {
  // 通话状态错误
  CALL_STATE_ERROR,
  // 通话参数错误
  CALL_PARAM_ERROR,
  // 信令错误
  CALL_SIGNALING_ERROR,
}

export enum CallErrorType {
  CALLKIT = 'callkit',
  RTC = 'rtc',
  CHAT = 'chat',
}

class CallError {
  errorType: CallErrorType;
  code: CallErrorCode | AgoraRTCErrorCode | number;
  message: string;
  data?: any;

  constructor(
    code: CallErrorCode,
    message: string,
    data?: any,
    errorType: CallErrorType = CallErrorType.CALLKIT,
  ) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.errorType = errorType;
  }

  static create(code: CallErrorCode, message: string, data?: any) {
    return new CallError(code, message, data);
  }
}

export { CallError };
export default CallError;
