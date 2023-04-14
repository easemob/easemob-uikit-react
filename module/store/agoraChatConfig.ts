import AC, { AgoraChat } from 'agora-chat';

const client = new AC.connection({
	appKey: 'easemob#easeim',
});
//appKey: '41117440#383391', // 海外demo
export default client;
