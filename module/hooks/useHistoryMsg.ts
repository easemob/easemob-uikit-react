import {
	useCallback,
	useEffect,
	MutableRefObject,
	useContext,
	useState,
} from 'react';
import AC from 'agora-chat';
import { RootContext } from '../store/rootContext';
const useHistoryMessages = (cvs) => {
	const rootStore = useContext(RootContext).rootStore;

	const { client, messageStore, conversationStore } = rootStore;
	let [historyMsgs, setHistoryMsgs] = useState<any>([]);

	useEffect(() => {
		if (!cvs.conversationId) {
			console.warn('Invalid conversationId:', cvs);
			return setHistoryMsgs([]);
		}
		setHistoryMsgs(
			messageStore.message[cvs.chatType]?.[cvs.conversationId] || []
		);
		rootStore.loginState &&
			client
				.getHistoryMessages({
					targetId: cvs.conversationId,
					cursor: -1,
					pageSize: 50,
					chatType: cvs.chatType,
					searchDirection: 'up',
				})
				.then((res) => {
					console.log('历史消息', res);
					setHistoryMsgs(res.messages.reverse() || []);
				})
				.catch((err) => {
					console.log('获取历史消息失败', err);
				});
	}, [cvs]);
	return historyMsgs;
};

export { useHistoryMessages };
