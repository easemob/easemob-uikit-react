import { useCallback, useEffect, MutableRefObject, useContext } from 'react';
import AC, { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
import { useClient } from './useClient';
import { getStore } from '../store';
import { getCvsIdFromMessage } from '../utils';
const useEventHandler = () => {
  const rootStore = useContext(RootContext);
  const { messageStore } = rootStore.rootStore;
  const client = useClient();
  useEffect(() => {
    console.log('注册监听', client);
    client?.addEventHandler?.('message', {
      onTextMessage: message => {
        console.log('onTextMessage', message);
        messageStore.receiveMessage(message);
      },
      onImageMessage: message => {
        console.log('onImageMessage', message);
        messageStore.receiveMessage(message);
      },
      onFileMessage: message => {
        console.log('onFileMessage', message);
        messageStore.receiveMessage(message);
      },
      onAudioMessage: message => {
        console.log('onAudioMessage', message);
        messageStore.receiveMessage(message);
      },
      onVideoMessage: message => {
        console.log('onVideoMessage', message);
        messageStore.receiveMessage(message);
      },
      onLocationMessage: message => {
        console.log('onLocationMessage', message);
        messageStore.receiveMessage(message);
      },
      onCmdMessage: message => {
        console.log('onLocationMessage', message);
        messageStore.receiveMessage(message);
      },
      onCustomMessage: message => {
        console.log('onLocationMessage', message);
        messageStore.receiveMessage(message);
      },

      onReceivedMessage: message => {
        console.log('onReceivedMessage', message);
        messageStore.updateMessageStatus(message.mid, 'received');
        // messageStore.receiveMessage(message);
      },
      onDeliveredMessage: message => {
        console.log('onDeliveredMessage', message);
        // messageStore.receiveMessage(message);
        // messageStore.updateMessageStatus();
      },
      onReadMessage: message => {
        console.log('onReadMessage', message);
        // messageStore.receiveMessage(message);
        messageStore.updateMessageStatus(message.mid as string, 'read');
      },
      onChannelMessage: message => {
        console.log('onChannelMessage', message);
        // messageStore.receiveMessage(message);
      },

      onConnected: () => {
        console.log('登录成功 ********');
        rootStore.rootStore.setLoginState(true);
      },
      onDisconnected: () => {
        console.log('退出成功 *********');
        rootStore.rootStore.setLoginState(false);
      },

      onReactionChange: data => {
        const conversationId = getCvsIdFromMessage(data as unknown as AgoraChat.MessageBody);

        const cvs = {
          chatType: data.chatType,
          conversationId: conversationId,
        };
        rootStore.rootStore.messageStore.updateReactions(cvs, data.messageId, data.reactions);
      },
      onModifiedMessage: message => {
        getStore().messageStore.modifyLocalMessage(message.id, message);
      },
      onPresenceStatusChange: message => {
        const { addressStore } = rootStore.rootStore;
        message.length > 0 &&
          message.forEach(presenceInfo => {
            const appUserInfo = addressStore.appUsersInfo;
            if (appUserInfo[presenceInfo.userId]) {
              const detailList = presenceInfo.statusDetails;
              let isOnline = false;
              detailList.forEach(item => {
                if (item.status === 1) {
                  isOnline = true;
                }
              });
              appUserInfo[presenceInfo.userId].isOnline = isOnline;
              addressStore.setAppUserInfo({ ...appUserInfo });
            }
          });
      },
    });

    return () => {
      console.log('移除监听');
      client?.removeEventHandler?.('message');
    };
  }, [client]);
};

export { useEventHandler };
