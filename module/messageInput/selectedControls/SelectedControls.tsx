import React, { useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import Icon from '../../../component/icon';
import { ConfigContext } from '../../../component/config/index';
import './style/style.scss';
import { RootContext } from '../../store/rootContext';
import { chatSDK, ChatSDK } from '../../SDK';
import { useTranslation } from 'react-i18next';
import Modal from '../../../component/modal';
import { CurrentConversation } from '../../store/ConversationStore';

export interface SelectedControlsProps {
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  onHide?: () => void;
  conversation?: CurrentConversation;
  onSendMessage?: (message: ChatSDK.CombineMsgBody) => void;
}

const SelectedControls = (props: SelectedControlsProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { t } = useTranslation();
  const {
    prefix: customizePrefixCls,
    onHide,
    conversation,
    onSendMessage,
    style = {},
    className,
  } = props;
  const prefixCls = getPrefixCls('selected-controls', customizePrefixCls);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const { addressStore } = rootStore;
  const themeMode = theme?.mode || 'light';

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const currentCVS = conversation ? conversation : rootStore.messageStore.currentCVS;
  const selectedMessages =
    rootStore.messageStore.selectedMessage[currentCVS.chatType as 'singleChat' | 'groupChat'][
      currentCVS.conversationId
    ]?.selectedMessage || [];

  const handleKeyDown = (event: { keyCode: number }) => {
    if (event.keyCode === 27) {
      // 27 是Esc键的键盘码
      close();
    }
  };
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, []);
  const close = () => {
    rootStore.messageStore.setSelectedMessage(currentCVS, {
      selectable: false,
      selectedMessage: [],
    });
    onHide && onHide();
  };

  const sendSelectedMsg = () => {
    let selectedMessages =
      rootStore.messageStore.selectedMessage[currentCVS.chatType as 'singleChat' | 'groupChat'][
        currentCVS.conversationId
      ].selectedMessage;
    if (selectedMessages.length == 0) {
      return;
    }
    //@ts-ignore
    selectedMessages = selectedMessages.sort((a: { time: number }, b: { time: number }) => {
      // @ts-ignore
      return a.time - b.time;
    });
    const summaryMsgs = selectedMessages.slice(0, 3);
    let summary = '';
    //@ts-ignore
    summaryMsgs.forEach((msg: { type: any; from: string | number; msg: string }) => {
      switch (msg.type) {
        case 'txt':
          summary =
            summary +
            (addressStore.appUsersInfo[msg.from]?.nickname || msg.from) +
            ': ' +
            msg.msg +
            '\n';
          break;
        case 'img':
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'image',
          )}/\n`;
          break;
        case 'audio':
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'audio',
          )}/\n`;
          break;
        case 'file':
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'file',
          )}/\n`;
          break;
        case 'video':
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'video',
          )}/\n`;
          break;
        case 'custom':
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'custom',
          )}/\n`;
          break;
        // @ts-ignore
        case 'combine':
          // @ts-ignore
          summary = `${summary}${addressStore.appUsersInfo[msg.from]?.nickname || msg.from}: /${t(
            'chatHistory',
          )}/\n`;
          break;
        default:
          break;
      }
    });
    //发送合并消息
    const option = {
      chatType: currentCVS.chatType,
      type: 'combine',
      to: currentCVS.conversationId,
      deliverOnlineOnly: false,
      compatibleText: 'the combine message',
      title: t('chatHistory'),
      summary: summary,
      messageList: selectedMessages,

      onFileUploadComplete: (data: any) => {
        (rootStore.messageStore.message.byId[msg.id] as ChatSDK.FileMsgBody).url = data.url;
        (rootStore.messageStore.message.byId[msg.id] as ChatSDK.FileMsgBody).secret = data.secret;
      },
    };
    // @ts-ignore
    const msg = chatSDK.message.create(option);
    onSendMessage?.(msg as ChatSDK.CombineMsgBody);
    return;
  };

  const iconClass = classNames(`${prefixCls}-iconBox`, {
    [`${prefixCls}-iconBox-disable`]: selectedMessages.length == 0,
  });

  const deleteSelectedMsg = () => {
    if (selectedMessages.length == 0) {
      return;
    }
    // TODO: limit msgIds length
    // @ts-ignore
    const msgIds = selectedMessages.map(msg => msg.mid || msg.id);

    rootStore.messageStore.deleteMessage(currentCVS, msgIds);
    setModalOpen(false);
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: currentCVS.chatType,
        conversationId: currentCVS.conversationId,
      },
      {
        selectable: false,
        selectedMessage: [],
      },
    );
  };

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={classString} style={{ ...style }}>
        <div className={`${prefixCls}-content`}>
          <div className={`${prefixCls}-content-left`}>
            <div className={`${prefixCls}-iconBox`} onClick={close}>
              <Icon type="CLOSE_THIN" width={24} height={24}></Icon>
            </div>
          </div>
          <div className={`${prefixCls}-content-right`}>
            <div
              title={t('cancel') as string}
              className={iconClass}
              style={{ cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (selectedMessages.length > 0) {
                  setModalOpen(true);
                }
              }}
            >
              <Icon
                className={`${prefixCls}-content-delete`}
                type="DELETE"
                width={24}
                height={24}
              ></Icon>
            </div>
            <div
              title={t('forward') as string}
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
        title={t('batchDeletion')}
        okText={t('delete')}
        cancelText={t('cancel')}
        onCancel={() => {
          setModalOpen(false);
        }}
        onOk={deleteSelectedMsg}
      >
        <div className={`${prefixCls}-detail`}>{`${t('delete')} ${selectedMessages.length} ${t(
          'messages',
        )}`}</div>
      </Modal>
    </>
  );
};

export { SelectedControls };
