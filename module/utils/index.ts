import { ChatType } from '../types/messageType';

export function getConversationTime(time: number) {
	if (!time) return '';
	// ['Fri', 'Jun', '10', '2022', '14:16:28', 'GMT+0800', '(中国标准时间)']
	//    0       1      2      3       4
	const localTimeList = new Date().toString().split(' ');
	const MsgTimeList = new Date(time).toString().split(' ');
	if (localTimeList[3] === MsgTimeList[3]) {
		if (localTimeList[1] === MsgTimeList[1]) {
			if (localTimeList[0] === MsgTimeList[0]) {
				if (localTimeList[2] === MsgTimeList[2]) {
					return MsgTimeList[4].substr(0, 5);
				}
			} else {
				if (Number(localTimeList[0]) - Number(MsgTimeList[0]) === 1) {
					return 'Yday';
				} else {
					return MsgTimeList[0];
				}
			}
		} else {
			return MsgTimeList[1];
		}
	} else {
		return MsgTimeList[1];
	}
}

export function parseChannel(channelId: string): {
	chatType: ChatType;
	conversationId: string;
} {
	const reg = /_(\S*)@/;
	const chatType = channelId.includes('@conference')
		? 'groupChat'
		: 'singleChat';
	const conversationId = channelId.match(reg)?.[1] || '';
	return {
		chatType,
		conversationId,
	};
}
