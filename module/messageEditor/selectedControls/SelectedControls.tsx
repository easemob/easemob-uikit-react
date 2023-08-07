import React, { useContext, useState } from 'react';
import classNames from 'classnames';
import Icon from '../../../component/icon';
import { ConfigContext } from '../../../component/config/index';
import './style/style.scss';
import { RootContext } from '../../store/rootContext';
import AgoraChat from 'agora-chat';
import { useTranslation } from 'react-i18next';
import Modal from '../../../component/modal';
export interface SelectedControlsProps {
  prefix?: string;
  onHide?: () => void;
}

const SelectedControls = (props: SelectedControlsProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { t } = useTranslation();
  const { prefix: customizePrefixCls, onHide } = props;
  const prefixCls = getPrefixCls('selected-controls', customizePrefixCls);
  const rootStore = useContext(RootContext).rootStore;
  const classString = classNames(prefixCls);
  const { currentCVS } = rootStore.messageStore;
  const selectedMessages =
    rootStore.messageStore.selectedMessage[currentCVS.chatType][currentCVS.conversationId]
      ?.selectedMessage || [];

  const close = () => {
    rootStore.messageStore.setSelectedMessage(currentCVS, {
      selectable: false,
      selectedMessage: [],
    });
    onHide && onHide();
  };

  const sendSelectedMsg = () => {
    let selectedMessages =
      rootStore.messageStore.selectedMessage[currentCVS.chatType][currentCVS.conversationId]
        .selectedMessage;

    selectedMessages = selectedMessages.sort((a, b) => {
      return a.time - b.time;
    });
    const summaryMsgs = selectedMessages.slice(0, 3);
    let summary = '';
    summaryMsgs.forEach(msg => {
      switch (msg.type) {
        case 'txt':
          summary = summary + msg.from + ': ' + msg.msg + '\n';
          break;
        case 'img':
          summary = `${summary}${msg.from}: /${t('module.image')}/\n`;
          break;
        case 'audio':
          summary = `${summary}${msg.from}: /${t('module.audio')}/\n`;
          break;
        case 'file':
          summary = `${summary}${msg.from}: /${t('module.file')}/\n`;
          break;
        case 'video':
          summary = `${summary}${msg.from}: /${t('module.video')}/\n`;
          break;
        case 'custom':
          summary = `${summary}${msg.from}: /${t('module.custom')}/\n`;
          break;
        // @ts-ignore
        case 'combine':
          // @ts-ignore
          summary = `${summary}${msg.from}: /${t('module.custom')}/\n`;
          break;
        default:
          break;
      }
    });
    //发送合并消息
    let option = {
      chatType: currentCVS.chatType,
      type: 'combine',
      to: currentCVS.conversationId,
      deliverOnlineOnly: false,
      compatibleText: 'the combine message',
      title: t('module.chatHistory'),
      summary: summary,
      messageList: selectedMessages,
      onFileUploadComplete: (data: any) => {
        console.log('data', data);
      },
    };
    console.log(option);
    // @ts-ignore
    let msg = AgoraChat.message.create(option);
    rootStore.client
      .send(msg)
      .then((res: any) => {
        console.log('发送成功', res, msg);
      })
      .catch((err: any) => {
        console.log('发送失败', err);
      });
  };

  const iconClass = classNames(`${prefixCls}-iconBox`, {
    [`${prefixCls}-iconBox-disable`]: selectedMessages.length == 0,
  });

  const deleteSelectedMsg = () => {
    // TODO: limit msgIds length
    const msgIds = selectedMessages.map(msg => msg.mid || msg.id);

    rootStore.messageStore.deleteMessage(currentCVS, msgIds);
    setModalOpen(false);
  };

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={classString}>
        <div className={`${prefixCls}-content`}>
          <div className={`${prefixCls}-content-left`}>
            <div className={`${prefixCls}-iconBox`} onClick={close}>
              <Icon type="CLOSE_THIN" width={24} height={24}></Icon>
            </div>
          </div>
          <div className={`${prefixCls}-content-right`}>
            <div
              className={iconClass}
              style={{ cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                setModalOpen(true);
              }}
            >
              <Icon type="DELETE" width={24} height={24}></Icon>
            </div>
            <div
              className={iconClass}
              style={{ cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={sendSelectedMsg}
            >
              <Icon type="FORWARD_LIST" width={24} height={24}></Icon>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={t('module.batchDeletion')}
        okText={t('module.delete')}
        cancelText={t('module.cancel')}
        onCancel={() => {
          setModalOpen(false);
        }}
        onOk={deleteSelectedMsg}
      >
        <div className={`${prefixCls}-detail`}>{`${t('module.delete')} ${
          selectedMessages.length
        } ${t('module.messages')}`}</div>
      </Modal>
    </>
  );
};

export { SelectedControls };
