import CallKit from 'chat-callkit';
import AgoraChat from 'agora-chat';
const AgoraRTC = CallKit.getAgoraRTC?.();

const useSDK = () => {
  return {
    AgoraRTC,
    AgoraChat,
  };
};

export { useSDK };
