import React, { useEffect, useRef, useState, useContext } from 'react';
import classNames from 'classnames';
import { chatSDK, ChatSDK } from '../../SDK';
import './style/style.scss';
import Icon from '../../../component/icon';
import { ConfigContext } from '../../../component/config/index';
import HZRecorder from './recorderFun';
import { RootContext } from '../../store/rootContext';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from '../../store/ConversationStore';
export interface RecorderProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties; // container style
  iconStyle?: React.CSSProperties; // icon style
  liveContentStyle?: React.CSSProperties; // live content style
  cancelBtnShape?: 'circle' | 'square';
  onShow?: () => void;
  onHide?: () => void;
  onSend?: (message: ChatSDK.MessageBody) => void;
  conversation?: CurrentConversation;
  onBeforeSendMessage?: (message: ChatSDK.MessageBody) => Promise<CurrentConversation | void>;
  isChatThread?: boolean;
}

let MediaStream: any;
let recorder: typeof HZRecorder;
let timer: number;
const Recorder: React.FC<RecorderProps> = (props: RecorderProps) => {
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { t } = useTranslation();
  const { messageStore, client } = rootStore;
  const {
    prefix: customizePrefixCls,
    onShow,
    onHide,
    onSend,
    conversation,
    onBeforeSendMessage,
    isChatThread = false,
    style = {},
    iconStyle = {},
    liveContentStyle = {},
    className,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('recorder', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [isRecording, setRecordingState] = useState(false);

  const [duration, setDuration] = useState(0);

  const setDurationInterval = () => {
    timer = window.setInterval(() => {
      setDuration(duration => duration + 1);
    }, 1000);
  };

  useEffect(() => {
    if (duration >= 60) {
      sendAudio();
    }
  }, [duration]);

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
      // console.error('recorder is', recorder);
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
  const currentCVS = conversation ? conversation : messageStore.currentCVS;

  useEffect(() => {
    if (recorder) {
      (recorder as any).stop();
    }
    setRecordingState(false);
    onHide && onHide();
    stopRecording();
    setDuration(0);
    clearInterval(timer);
  }, [currentCVS]);

  const _sendMessage = (message: ChatSDK.MessageBody) => {
    messageStore.sendMessage(message);

    stopRecording();
    setDuration(0);
    clearInterval(timer);
    setRecordingState(false);
    onSend && onSend(message);
  };
  const sendAudio = () => {
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      // return;
    }
    if (recorder) {
      (recorder as any).stop();
      // 获取语音二进制文件
      let blob = (recorder as any).getBlob();
      const uri = {
        url: chatSDK.utils.parseDownloadResponse.call(client, blob),
        filename: 'audio-message.wav',
        filetype: 'audio',
        data: blob,
        length: duration,
        duration: duration,
      };
      MediaStream.getTracks()[0].stop();

      const message = chatSDK.message.create({
        type: 'audio',
        to: currentCVS.conversationId,
        chatType: currentCVS.chatType,
        file: uri,
        filename: '',
        length: duration,
        isChatThread,
      });

      if (onBeforeSendMessage) {
        onBeforeSendMessage(message).then(cvs => {
          if (cvs) {
            message.to = cvs.conversationId;
            // @ts-ignore
            message.chatType = cvs.chatType;
          }

          _sendMessage(message);
        });
      } else {
        _sendMessage(message);
      }
    }
  };

  const initNode = (
    <div className={`${prefixCls}-iconBox`} style={{ ...iconStyle }} title={t('record') as string}>
      <Icon
        type="CIRCLE_WAVE"
        width={24}
        height={24}
        color="#fff"
        onClick={() => handleClick('start')}
      ></Icon>
    </div>
  );

  const liveNode = (
    <div className={`${prefixCls}-content`} style={{ ...liveContentStyle }}>
      <div className={`${prefixCls}-content-left`}>
        <div className={`${prefixCls}-iconBox`} title={t(`cancel`) as string}>
          <Icon
            type="DELETE"
            width={24}
            height={24}
            onClick={() => handleClick('stop')}
            color={'#919BA1'}
          ></Icon>
        </div>
        <div className={`${prefixCls}-time`}>
          <span>{duration + "''"}</span>
        </div>
      </div>
      <div className={`${prefixCls}-content-right`}>
        <span>{t('recording')}...</span>
        <div onClick={sendAudio} className={`${prefixCls}-send`} title={t(`send`) as string}>
          <Icon type="AIR_PLANE" width={24} height={24} color="#fff"></Icon>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ width: isRecording ? '100%' : 'fit-content', ...style }} className={classString}>
      {isRecording ? liveNode : initNode}
    </div>
  );
};

export { Recorder };
