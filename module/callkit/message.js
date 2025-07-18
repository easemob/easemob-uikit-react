import { WebIM, callManager } from './callManager'
import './utils'
import store from '../redux';
import { updateConfr, setCallStatus, CALLSTATUS } from '../redux/reducer'
const manager = {}

export const sendTextMsg = (chatType, to, message, ext) => {
    let option = {
        chatType: chatType,
        type: "txt",
        to: to,
        msg: message,
        ext: ext
    };

    let msg = WebIM.message.create(option);
    WebIM.conn.send(msg);

    if (ext.type === 0 || ext.type === 1) {
        const { dispatch } = store
        WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
        WebIM.rtc.timer = setTimeout(() => {
            console.warn('caller timeout')
            callManager.hangup('timeout', true)
            dispatch(setCallStatus(CALLSTATUS.idle))
        }, 30000)
    }
}

export const sendCMDMsg = (chatType, to, message, ext) => {
    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);
    msg.set({
        to: to,
        action: 'rtcCall',
        ext: ext,
        success: function (id, serverMsgId) {
            dispatch(setCallStatus(CALLSTATUS.alerting))
        },
        fail: function (e) {
            console.warn("callee send alert fail", msg);
        }
    });

    WebIM.conn.send(msg.body);
}

// callee
export const sendAlerting = (to, calleeDevId, callId) => {
    const { getState, dispatch } = store
    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);
    if (!to) {
        console.error('to is undefined when send alerting.')
        return;
    }
    msg.set({
        to: to,
        action: 'rtcCall',
        ext: {
            action: 'alert',
            calleeDevId: WebIM.conn.context.jid.clientResource,
            callerDevId: calleeDevId,
            callId: callId,
            ts: Date.now(),
            msgType: 'rtcCallWithAgora'
        },
        success: function (id, serverMsgId) {
            dispatch(setCallStatus(CALLSTATUS.alerting))
        },
        fail: function (e) {
            console.warn("callee send alert fail", msg);
        }
    });

    WebIM.conn.send(msg.body);
    WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
    WebIM.rtc.timer = setTimeout(() => {
        console.warn('callee timeout')
        callManager.hangup('timeout')
        dispatch(setCallStatus(CALLSTATUS.idle))
    }, 30000)
}

// caller
const confirmRing = (to, calleeDevId, callerDevId, callId) => {
    const { getState, dispatch } = store
    let confr = getState().confr
    let currentCallId = confr.callId
    let status = true
    if (callId !== currentCallId) {
        console.warn('not current call', callId, currentCallId)
        status = false
    }

    if (getState().callStatus > CALLSTATUS.receivedConfirmRing && ![2, 3].includes(confr.type)) { //in call
        console.warn('caller is busy', confr)
        status = false
    }
    // if (confr.calleeDevId && confr.calleeDevId != calleeDevId){
    // 	console.warn('calleeDevId is different')
    // 	status = false
    // }

    if (callerDevId !== WebIM.conn.context.jid.clientResource) {
        console.warn('caller device is different')
        return
    }

    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);
    msg.set({
        to: to,
        action: 'rtcCall',
        ext: {
            action: 'confirmRing',
            status: status,
            callerDevId: WebIM.conn.context.jid.clientResource,
            calleeDevId: calleeDevId,
            callId: callId,
            ts: Date.now(),
            msgType: 'rtcCallWithAgora'
        },
        success: function (id, serverMsgId) {
            if (status) {
                if (getState().callStatus < CALLSTATUS.confirmRing) {
                    dispatch(setCallStatus(CALLSTATUS.confirmRing))
                }
            }
        },
        fail: function (e) {
            console.warn("caller send confirmRing fail", msg);
        }
    });
    WebIM.conn.send(msg.body);
}

// callee
export const answerCall = (result, info) => {
    const { getState, dispatch } = store
    info = info || {}
    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);
    let currentCallId = info.currentCallId || getState().confr.callId
    let callerDevId = info.callerDevId || getState().confr.callerDevId
    let to = info.to || getState().confr.callerIMName
    msg.set({
        to: to,
        action: 'rtcCall',
        ext: {
            action: 'answerCall',
            result: result, // busy/accept/refuse
            callerDevId: callerDevId,
            calleeDevId: WebIM.conn.context.jid.clientResource,
            callId: currentCallId,
            ts: Date.now(),
            msgType: 'rtcCallWithAgora'
        },
        success: function (id, serverMsgId) {
        },
        fail: function (e) {
            console.warn("callee send answerCall fail", msg);
        }
    });
    WebIM.conn.send(msg.body);
}

// caller
const confirmCallee = (to, calleeDevId, result) => {
    const { getState, dispatch } = store
    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);

    let confr = getState().confr
    let currentCallId = confr.callId

    if (!confr.calleeDevId && ![2, 3].includes(confr.type)) {
        dispatch(updateConfr({
            to: confr.confrName,
            ext: {
                channelName: confr.channel,
                token: confr.token,
                type: confr.type,
                callerDevId: confr.callerDevId,
                calleeDevId: calleeDevId,
                callId: confr.callId,
                calleeIMName: confr.calleeIMName,
                callerIMName: confr.callerIMName
            }
        }))
    } else if (confr.calleeDevId != calleeDevId && ![2, 3].includes(confr.type)) {
        result = 'refuse'
    }

    msg.set({
        to: to,
        action: 'rtcCall',
        ext: {
            action: 'confirmCallee',
            result: result || 'accept', // busy/accept/refuse
            callerDevId: WebIM.conn.context.jid.clientResource,
            calleeDevId: calleeDevId,
            callId: currentCallId,
            ts: Date.now(),
            msgType: 'rtcCallWithAgora'
        },
        success: function (id, serverMsgId) {
            if (result == 'accept') {
                dispatch(setCallStatus(CALLSTATUS.confirmCallee))
            }
        },
        fail: function (e) {
            console.warn("caller send confirmCallee fail", msg)
        }
    });
    WebIM.conn.send(msg.body);
}

export const cancelCall = (to) => {
    const { getState } = store
    var id = WebIM.conn.getUniqueId();
    var msg = new WebIM.message('cmd', id);
    let callerDevId = getState().confr.callerDevId
    let user = to || getState().confr.calleeIMName
    let currentCallId = getState().confr.callId
    if (!user) {
        console.warn('send cancelCall fail, to is undefined')
        return
    }
    msg.set({
        to: user,
        action: 'rtcCall',
        ext: {
            action: 'cancelCall',
            callerDevId: callerDevId,
            callId: currentCallId,
            ts: Date.now(),
            msgType: 'rtcCallWithAgora'
        },
        success: function (id, serverMsgId) {
            //dispatch(setCallStatus(CALLSTATUS.idle))
        },
        fail: function (e) {
            console.warn("caller send canlcel fail", msg);
        }
    });
    WebIM.conn.send(msg.body);
}

export const addListener = () => {
    const { getState, dispatch } = store
    WebIM.conn.addEventHandler('message', {
        onTextMessage: (message) => {
            if (message.chatType !== 'singleChat') return;
            const state = getState()
            const { conf, callStatus } = state
            let { from, to } = message
            if (message.ext && message.ext.action === 'invite') {
                if (message.from == WebIM.conn.context.jid.name) {
                    return // msg from other device
                }
                if (message.chatType == 'singleChat') {
                    if (callStatus > CALLSTATUS.idle) { // busy
                        answerCall('busy', { currentCallId: message.ext.callId, callerDevId: message.ext.callerDevId, to: from })
                    } else {
                        message.ext.calleeIMName = message.to;
                        message.ext.callerIMName = message.from;
                        dispatch(updateConfr(message))
                        dispatch(setCallStatus(CALLSTATUS.alerting))
                    }
                } else {
                    const msgInfo = message.ext
                    if (callStatus > CALLSTATUS.idle) {
                        if (msgInfo.callId == conf.callId) {
                            dispatch(setCallStatus(CALLSTATUS.alerting))
                        } else {
                            answerCall('busy', { currentCallId: msgInfo.callId, callerDevId: msgInfo.callerDevId, to: from })
                        }
                    }

                    msgInfo.calleeIMName = WebIM.conn.context.jid.name;
                    msgInfo.callerIMName = from;
                    dispatch(updateConfr({
                        from,
                        to,
                        ext: msgInfo
                    }))

                    dispatch(setCallStatus(CALLSTATUS.alerting))
                }
            }
        },

        onCmdMessage: msg => {
            if (msg.action === "rtcCall") {
                let msgInfo = msg.ext
                let deviceId = '';
                let callerDevId = ''
                let callId = '';
                let callVideo = store.getState();
                switch (msgInfo.action) {
                    case "invite":
                        return;
                        if (msg.from == WebIM.conn.context.jid.name) {
                            return // invite msg send by myself on another device
                        }
                        const state = getState()
                        const { conf, callStatus } = state
                        let { from, to } = msg
                        if (callStatus > CALLSTATUS.idle) {
                            if (msgInfo.callId == conf.callId) {
                                dispatch(setCallStatus(CALLSTATUS.alerting))
                            } else {
                                answerCall('busy', { currentCallId: msgInfo.callId, callerDevId: msgInfo.callerDevId, to: from })
                            }
                        }

                        msgInfo.calleeIMName = WebIM.conn.context.jid.name;
                        msgInfo.callerIMName = from;
                        dispatch(updateConfr({
                            from,
                            to,
                            ext: msgInfo
                        }))

                        dispatch(setCallStatus(CALLSTATUS.alerting))
                        break;
                    case "alert":
                        deviceId = msgInfo.calleeDevId
                        callerDevId = msgInfo.callerDevId
                        callId = msgInfo.callId
                        confirmRing(msg.from, deviceId, callerDevId, callId)
                        break;
                    case "confirmRing":
                        if (msgInfo.calleeDevId != WebIM.conn.context.jid.clientResource) {
                            return // Multi-terminal case A message on the other end (calling a call from another device) caller
                        }

                        if (!msgInfo.status && callVideo.callStatus < CALLSTATUS.receivedConfirmRing) {
                            console.warn('The invitation has expired', msgInfo)
                            dispatch(setCallStatus(CALLSTATUS.idle))
                            callManager.hangup('invitation has expired')
                            WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                            return
                        }
                        deviceId = msgInfo.calleeDevId
                        dispatch(setCallStatus(CALLSTATUS.receivedConfirmRing))
                        // answerCall(msg.from, deviceId)
                        // WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                        break;
                    case "answerCall":
                        WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                        deviceId = msgInfo.calleeDevId
                        if (msgInfo.callerDevId != WebIM.conn.context.jid.clientResource) {
                            if (msg.from == WebIM.conn.context.jid.name) {
                                if (msgInfo.result === 'accept') {
                                    callManager.hangup('accepted on other devices')
                                } else if (msgInfo.result === 'refuse') {
                                    callManager.hangup('refused on other devices')
                                }
                                dispatch(setCallStatus(CALLSTATUS.idle))
                                WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                                return console.warn('processed on other devices')
                            }
                            return // 多端情况另一端的消息 （被叫 在其他设备处理）
                        }
                        if (msgInfo.result !== 'accept') {
                            if (msgInfo.result === 'busy') {
                                console.warn('target is busy')
                            } else if (msgInfo.result === 'refuse') {
                                console.error('the target has refused')
                            }

                            if (![2, 3].includes(callVideo.confr.type)) { // 1v1 hang up，multi don't hang up
                                confirmCallee(msg.from, deviceId, msgInfo.result)
                                dispatch(setCallStatus(CALLSTATUS.idle))
                                let reason = msgInfo.result == 'busy' ? 'busy' : 'refused'
                                callManager.hangup(reason)
                            } else {
                                confirmCallee(msg.from, deviceId, 'refuse')
                            }
                        } else {
                            confirmCallee(msg.from, deviceId, msgInfo.result)
                        }
                        break;
                    case "confirmCallee":
                        if (msgInfo.calleeDevId != WebIM.conn.context.jid.clientResource && callVideo.callStatus !== 7) {
                            callManager.hangup('processed on other devices')
                            dispatch(setCallStatus(CALLSTATUS.idle))
                            WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                            return
                        }
                        if (msg.ext.result != 'accept' && callVideo.callStatus !== 7) {
                            // Hang up when busy Refuse is received during a call
                            if (callVideo.callStatus !== 0) {
                                callManager.hangup(msg.ext.result)
                                dispatch(setCallStatus(CALLSTATUS.idle))
                            }

                            WebIM.rtc.timer && clearTimeout(WebIM.rtc.timer)
                            return
                        }
                        dispatch(setCallStatus(CALLSTATUS.confirmCallee))
                        break;
                    case "cancelCall":
                        if (msg.from == WebIM.conn.context.jid.name) {
                            return // msg from other device
                        }
                        if (msg.from == callVideo.confr.callerIMName) {
                            callManager.hangup('cancel')
                            dispatch(setCallStatus(CALLSTATUS.idle))
                        }
                        break;
                    default:
                        console.warn(`unexpected action ${msg.action}`)
                        break;
                }
            }
        }
    })
}
manager.sendAlerting = sendAlerting
