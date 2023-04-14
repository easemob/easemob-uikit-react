import {
	useCallback,
	useEffect,
	MutableRefObject,
	useContext,
	useState,
} from 'react';
import AC from 'agora-chat';
import { RootContext } from '../store/rootContext';
import type { ServerCvs } from '../conversation/ConversationList';
const useConversation = () => {
	const rootStore = useContext(RootContext).rootStore;

	const { client } = rootStore;

	let [cvsData, setCvsData] = useState<ServerCvs>([]);
	useEffect(() => {
		console.log('开始获取会话列表', rootStore.loginState);
		rootStore.loginState &&
			client
				.getConversationlist()
				.then((res) => {
					console.log('会话列表 ******', res);
					setCvsData(res.data.channel_infos || []);
				})
				.catch((err) => {
					console.log('获取会话列表失败 ******', err);
				});
	}, [rootStore.loginState]);
	return cvsData;
};

export { useConversation };
