import { chatSDK, ChatSDK } from '../SDK';

const useSDK = () => {
  return {
    ChatSDK: chatSDK,
    ChatSDKType: ChatSDK,
  };
};

export { useSDK };
