import CallKit from 'chat-callkit';
import { chatSDK } from '../SDK';
const AgoraRTC = CallKit.getAgoraRTC?.();

const useSDK = () => {
  return {
    AgoraRTC,
    ChatSDK: chatSDK,
  };
};

export { useSDK };
