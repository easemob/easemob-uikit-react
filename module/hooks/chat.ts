import { useCallback, useEffect, MutableRefObject, useContext } from 'react';
import AC from 'agora-chat';
import { RootContext } from '../store/rootContext';
import { useClient } from './useClient';
const useEventHandler = () => {
	const rootStore = useContext(RootContext);
	const { messageStore } = rootStore.rootStore;
	const client = useClient();
	useEffect(() => {
		console.log('注册监听', client);
		client?.addEventHandler?.('message', {
			onTextMessage: (message) => {
				console.log('onTextMessage', message);
				messageStore.receiveMessage(message);
			},
			onImageMessage: (message) => {
				console.log('onImageMessage', message);
				messageStore.receiveMessage(message);
			},
			onFileMessage: (message) => {
				console.log('onFileMessage', message);
				messageStore.receiveMessage(message);
			},
			onAudioMessage: (message) => {
				console.log('onAudioMessage', message);
				messageStore.receiveMessage(message);
			},
			onVideoMessage: (message) => {
				console.log('onVideoMessage', message);
				messageStore.receiveMessage(message);
			},
			onLocationMessage: (message) => {
				console.log('onLocationMessage', message);
				messageStore.receiveMessage(message);
			},
			onCmdMessage: (message) => {
				console.log('onLocationMessage', message);
				messageStore.receiveMessage(message);
			},
			onCustomMessage: (message) => {
				console.log('onLocationMessage', message);
				messageStore.receiveMessage(message);
			},

			onReceivedMessage: (message) => {
				console.log('onReceivedMessage', message);
				messageStore.updateMessageStatus(message.mid, 'received');
				// messageStore.receiveMessage(message);
			},
			onDeliveredMessage: (message) => {
				console.log('onDeliveredMessage', message);
				// messageStore.receiveMessage(message);
				messageStore.updateMessageStatus();
			},
			onReadMessage: (message) => {
				console.log('onReadMessage', message);
				// messageStore.receiveMessage(message);
				messageStore.updateMessageStatus(message.mid, 'read');
			},
			onChannelMessage: (message) => {
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
		});

		return () => {
			console.log('移除监听');
			client?.removeEventHandler?.('message');
		};
	}, [client]);
};

export { useEventHandler };
