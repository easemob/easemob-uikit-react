import AgoraRTC from 'agora-rtc-sdk-ng';
import WebIM from 'agora-chat';
import store from '../redux';
import {
	updateConfr,
	setCallStatus,
	CALLSTATUS,
	setCallDuration,
	changeWinSize,
	updateJoinedMembers,
	setUidToUserId,
	setUserInfos,
	updateInvitedMembers,
} from '../redux/reducer';
import { sendTextMsg, addListener, cancelCall, sendAlerting } from './message';
import { formatTime } from './utils';

const client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
client.setClientRole('host');

class Manager {
	constructor(params) {
		if (params) {
			this.init(params);
		}

		this.client = client;
		this.props = {};
		this.callId = '';
		WebIM.rtc = this.rtc = {
			client,
			localAudioTrack: null,
			localVideoTrack: null,
			timer: null,
		};
	}

	init(appId, agoraUid, connection) {
		this.appId = appId;
		this.agoraUid = agoraUid;
		WebIM.conn = connection;
		addListener();
	}

	setCallKitProps(props) {
		this.props = props;
	}

	changeState(state) {
		this.props.onStateChange && this.props.onStateChange(state);
	}

	setToken(accessToken) {
		this.accessToken = accessToken;
	}

	setUserIdMap(idMap) {
		const { getState, dispatch } = store;
		dispatch(setUidToUserId(idMap));
	}

	setUserInfo(userInfo) {
		const { getState, dispatch } = store;
		const state = getState();
		dispatch(
			setUserInfos({
				...state.userInfo,
				...userInfo,
			})
		);
	}

	answerCall(result, accessToken) {
		const { getState, dispatch } = store;
		const state = getState();
		const { confr } = state;
		if (result) {
			this.accessToken = accessToken;
			sendAlerting(confr.callerIMName, confr.callerDevId, confr.callId);
		} else {
			const { dispatch } = store;
			dispatch(setCallStatus(CALLSTATUS.idle));
		}
	}

	startCall(options) {
		const { getState, dispatch } = store;
		const state = getState();
		let {
			callId,
			channel,
			chatType,
			callType,
			to,
			message,
			groupId,
			groupName,
			accessToken,
			agoraUid,
		} = options;
		this.accessToken = accessToken;
		if (agoraUid) {
			this.agoraUid = agoraUid;
		}
		if (state.confr.callId && state.callStatus > 0) {
			channel = state.confr.channel;
			callId = state.confr.callId;
			callType = state.confr.type;
		}
		let confInfo = {
			action: 'invite',
			channelName: channel,
			type: callType, //0 1v1 audio，1 1v1 video，2 multi video 3 multi audio
			callerDevId: WebIM.conn.context.jid.clientResource,
			callId: callId,
			ts: Date.now(),
			msgType: 'rtcCallWithAgora',
			callerIMName: WebIM.conn.context.jid.name,
			// for ios push
			chatType: callType,
			em_push_ext: {
				type: 'call',
				custom: {
					callId: callId,
				},
			},
			em_apns_ext: {
				em_push_type: 'voip',
			},
		};

		let msgExt = {
			channelName: channel,
			token: null,
			type: callType,
			callerDevId: WebIM.conn.context.jid.clientResource,
			callId: callId,
			calleeIMName: to,
			callerIMName: WebIM.conn.context.jid.name,
		};
		this.callId = callId;

		dispatch(
			updateConfr({
				ext: msgExt,
				to: to,
				from: WebIM.conn.context.jid.name,
			})
		);
		if (state.callStatus < CALLSTATUS.inviting) {
			dispatch(setCallStatus(CALLSTATUS.inviting));
		}

		if (callType === 2 || callType === 3) {
			confInfo.ext = {
				groupId: groupId,
				groupName: groupName,
			};
			msgExt.ext = {
				groupId: groupId,
				groupName: groupName,
			};
			let invitedMembers = state.invitedMembers;
			if (!invitedMembers.includes(to)) {
				dispatch(updateInvitedMembers([...invitedMembers, to]));
			}
		}
		if (chatType === 'groupChat') {
			// confInfo.ext = {
			// 	groupId: groupId,
			// 	groupName: groupName
			// }
			// msgExt.ext = {
			// 	groupId: groupId,
			// 	groupName: groupName
			// }
			// let invitedMembers = state.invitedMembers
			// dispatch(updateInvitedMembers([...invitedMembers, to]))
			// // sendCMDMsg(chatType, to, message, confInfo)
			// sendTextMsg(chatType, to, message, confInfo);
		} else {
			sendTextMsg(chatType, to, message, confInfo);
		}
	}

	async join() {
		const { getState, dispatch } = store;
		let state = getState();
		if (
			state.callStatus === CALLSTATUS.confirmCallee ||
			state.callStatus === CALLSTATUS.idle
		) {
			return;
		}
		let { confr } = state;
		const username = WebIM.conn.context.userId;
		let uid;
		try {
			uid = await client.join(
				this.appId,
				confr.channel,
				this.accessToken,
				Number(this.agoraUid)
			);
		} catch (e) {
			this.hangup('join channel failed');
		}

		const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
		this.rtc.localAudioTrack = localAudioTrack;
		let config = [localAudioTrack];

		let displayedName = username;
		if (state.uid2userId[uid]) {
			displayedName = state.uid2userId[uid];
		} else if (state.uid2userId[username]) {
			displayedName = state.uid2userId[username];
		}
		if (confr.type === 0 || confr.type === 3) {
			try {
				await client.publish(config);
			} catch (e) {
				this.hangup('invalid operation');
			}
			dispatch(
				updateJoinedMembers({
					videoElm: null,
					name: displayedName,
					type: 'audio',
					value: uid,
					action: 'add',
					audio: true,
					video: false,
					isSelf: true,
				})
			);
		} else {
			const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
			config.push(localVideoTrack);
			this.rtc.localVideoTrack = localVideoTrack;
			try {
				await client.publish(config);
			} catch (e) {
				this.hangup('invalid operation');
			}

			let videoElm = confr.type === 2 ? 'video' + uid : 'local-player';
			dispatch(
				updateJoinedMembers({
					videoElm: videoElm,
					name: displayedName,
					type: 'video',
					value: uid,
					action: 'add',
					audio: true,
					video: true,
					isSelf: true,
				})
			);
			setTimeout(() => {
				localVideoTrack.play(videoElm);
			}, 500);
		}
		this.startTime();
	}

	startTime() {
		const { dispatch } = store;
		let hour = 0,
			minute = 0,
			second = 0;
		this.rtc.intervalTimer && clearInterval(WebIM.rtc.intervalTimer);
		let timerId = setInterval(() => {
			second += 1;
			if (second === 60) {
				second = 0;
				minute += 1;
				if (minute === 60) {
					minute = 0;
					hour += 1;
					if (hour == 24) {
						hour = 0;
					}
				}
			}
			let time = formatTime(hour, minute, second);
			dispatch(setCallDuration(time));
		}, 1000);
		this.rtc.intervalTimer = timerId;
	}

	async hangup(reason, isCancel) {
		this.rtc.localAudioTrack && this.rtc.localAudioTrack.close();
		this.rtc.localVideoTrack && this.rtc.localVideoTrack.close();
		this.rtc.intervalTimer && clearInterval(this.rtc.intervalTimer);
		const { getState, dispatch } = store;
		const state = getState();
		const { confr } = state;
		if (isCancel && confr.callerIMName == WebIM.conn.context.jid.name) {
			if (confr.type == 2 || confr.type == 3) {
				state.invitedMembers.forEach((member) => {
					cancelCall(member);
				});
			} else {
				cancelCall();
			}
		}

		this.props.onStateChange &&
			this.props.onStateChange({
				type: 'hangup',
				reason: reason,
				callInfo: {
					...state.confr,
					duration: state.callDuration,
					groupId: state.groupId,
					groupName: state.groupName,
				},
			});
		this.callId = '';
		this.rtc.client && (await this.rtc.client.leave());
		dispatch(setCallStatus(CALLSTATUS.idle));
		dispatch(setCallDuration('00:00'));
		dispatch(changeWinSize('normal'));
		dispatch(updateJoinedMembers([]));
		dispatch(setUidToUserId({}));
		dispatch(updateInvitedMembers([]));
		dispatch(
			updateConfr({
				to: '',
				ext: {},
			})
		);
		dispatch(setUserInfos({}));
	}
}

export const callManager = new Manager();

export { client, WebIM, AgoraRTC };
