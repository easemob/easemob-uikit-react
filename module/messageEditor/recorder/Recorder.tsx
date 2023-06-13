import React, { useEffect, useRef, useState, useContext } from 'react';
import classNames from 'classnames';
import AC, { AgoraChat } from 'agora-chat';
import { useKeyPress } from 'ahooks';
import './style/style.scss';
import Button from '../../../component/button';
import Icon from '../../../component/icon';
import { ConfigContext } from '../../../component/config/index';
import HZRecorder from './recorderFun';
import { RootContext } from '../../store/rootContext';
export interface RecorderProps {
  prefix?: string;
  cancelBtnShape?: 'circle' | 'square';
  onShow?: () => void;
  onHide?: () => void;
  onSend?: (message: AgoraChat.MessageBody) => void;
}

let MediaStream: any;
let recorder: typeof HZRecorder;
let timer: number;
const Recorder: React.FC<RecorderProps> = (props: RecorderProps) => {
  const rootStore = useContext(RootContext).rootStore;
  const { messageStore, client } = rootStore;
  const { prefix: customizePrefixCls, onShow, onHide, onSend } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('recorder', customizePrefixCls);
  const classString = classNames(prefixCls);

  const [isRecording, setRecordingState] = useState(false);

  const [duration, setDuration] = useState(0);

  const setDurationInterval = () => {
    timer = window.setInterval(() => {
      setDuration(duration => duration + 1);
    }, 1000);
  };

  const startRecording = () => {
    HZRecorder.get((rec: typeof HZRecorder, val: any) => {
      recorder = rec;
      MediaStream = val;
      (rec as any).start();
    });
  };

  const stopRecording = () => {
    if (recorder) {
      (recorder as any).stop();
      // 重置说话时间

      // 获取语音二进制文件
      // let blob = recorder.getBlob();
      // const uri = {
      // 	//url: WebIM.utils.parseDownloadResponse.call(WebIM.conn, blob),
      // 	filename: 'audio-message.wav',
      // 	filetype: 'audio',
      // 	data: blob,
      // 	length: duration,
      // 	duration: duration,
      // };
      MediaStream.getTracks()[0].stop();
    } else {
      console.error('recorder is', recorder);
    }
  };

  const handleClick = (action: 'start' | 'stop') => {
    setRecordingState(action == 'start' ? true : false);
    if (action == 'start') {
      onShow && onShow();
      startRecording();
      setDurationInterval();
    } else {
      onHide && onHide();
      stopRecording();
      setDuration(0);
      clearInterval(timer);
    }
  };
  const { currentCVS } = messageStore;
  const sendAudio = () => {
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }
    if (recorder) {
      (recorder as any).stop();
      // 获取语音二进制文件
      let blob = (recorder as any).getBlob();
      const uri = {
        url: AC.utils.parseDownloadResponse.call(client, blob),
        filename: 'audio-message.wav',
        filetype: 'audio',
        data: blob,
        length: duration,
        duration: duration,
      };
      MediaStream.getTracks()[0].stop();

      const message = AC.message.create({
        type: 'audio',
        to: currentCVS.conversationId,
        chatType: currentCVS.chatType,
        file: uri,
        filename: '',
        length: duration,
      });
      messageStore.sendMessage(message);

      stopRecording();
      setDuration(0);
      clearInterval(timer);
      setRecordingState(false);
      onSend && onSend(message);
    }
  };

  const initNode = (
    <div className="icon-container">
      <Icon
        type="CIRCLE_WAVE"
        width={20}
        height={20}
        color="#fff"
        onClick={() => handleClick('start')}
      ></Icon>
    </div>
  );

  const liveNode = (
    <div className={`${prefixCls}-content`}>
      <div className={`${prefixCls}-content-left`}>
        <div className={`${prefixCls}-iconBox`}>
          <Icon
            type="DELETE"
            width={20}
            height={20}
            color="#fff"
            onClick={() => handleClick('stop')}
          ></Icon>
        </div>
        <div className={`${prefixCls}-time`}>
          <span>{duration + "''"}</span>
        </div>
      </div>
      <div className={`${prefixCls}-content-right`}>
        <span>Recording...</span>
        <div onClick={sendAudio} className={`${prefixCls}-send`}>
          <Icon type="AIR_PLANE" width={20} height={20} color="#fff"></Icon>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ width: isRecording ? '100%' : 'fit-content' }} className={classString}>
      {isRecording ? liveNode : initNode}
    </div>
  );
};

export { Recorder };
