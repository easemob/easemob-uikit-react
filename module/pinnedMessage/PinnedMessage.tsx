import React, { useState, useEffect, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { ChatSDK } from '../SDK';
import { useTranslation } from 'react-i18next';
import Header from '../header';
import CombinedMessage, { CombinedMessageProps } from '../combinedMessage';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import TextMessage from '../textMessage';
import ImageMessage from '../imageMessage';
import FileMessage from '../fileMessage';
import AudioMessage from '../audioMessage';
import UserCardMessage from '../userCardMessage';
import VideoMessage from '../videoMessage';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import Icon from '../../component/icon';
import Modal from '../../component/modal';
import { eventHandler } from '../../eventHandler';
import type {
  AudioMessageType,
  ImageMessageType,
  TextMessageType,
  FileMessageType,
  CustomMessageType,
  VideoMessageType,
  ChatType,
} from '../types/messageType';
import { getConversationTime, getMsgSenderNickname } from '../utils/index';
export interface PinnedMessageProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}

const RenderMessage = (props: {
  message: BaseMessageType & { bySelf: boolean };
  bubbleClass?: string;
}) => {
  const { t } = useTranslation();
  const { message, bubbleClass } = props;
  let msg = {
    ...message,
    id: `pin-${message.id}`,
  };
  msg.bySelf = false;
  let content = null;
  switch (msg?.type) {
    case 'txt':
      content = (
        <TextMessage
          showAvatar={false}
          showMessageInfo={false}
          showEditedTag={false}
          showTranslation={false}
          status="default"
          bubbleClass={bubbleClass}
          select={false}
          customAction={{ visible: false }}
          reaction={false}
          messageStatus={false}
          key={msg.id}
          bubbleType="none"
          textMessage={msg as TextMessageType}
          direction="ltr"
          style={{ display: 'block' }}
          thread={false}
        />
      );
      break;
    case 'img':
      content = (
        <ImageMessage
          showAvatar={false}
          showMessageInfo={false}
          bubbleClass={bubbleClass}
          select={false}
          status="default"
          imageMessage={msg as ImageMessageType}
          direction="ltr"
          bubbleStyle={{ padding: 0 }}
          key={msg.id}
          reaction={false}
          customAction={{ visible: false }}
          thread={false}
        />
      );
      break;
    case 'file':
      content = (
        <FileMessage
          showAvatar={false}
          showMessageInfo={false}
          bubbleClass={bubbleClass}
          select={false}
          status="default"
          key={msg.id}
          fileMessage={msg as FileMessageType}
          direction="ltr"
          type="secondly"
          reaction={false}
          customAction={{ visible: false }}
          thread={false}
        />
      );
      break;
    case 'audio':
      content = (
        <AudioMessage
          showAvatar={false}
          showMessageInfo={false}
          bubbleClass={bubbleClass}
          select={false}
          status="default"
          key={msg.id}
          audioMessage={msg as AudioMessageType}
          type="secondly"
          reaction={false}
          customAction={{ visible: false }}
          direction="ltr"
          thread={false}
        />
      );
      break;
    case 'video':
      content = (
        <VideoMessage
          showAvatar={false}
          showMessageInfo={false}
          bubbleClass={bubbleClass}
          select={false}
          key={msg.id}
          status="default"
          videoMessage={msg as VideoMessageType & ChatSDK.VideoMsgBody}
          direction="ltr"
          type="secondly"
          reaction={false}
          customAction={{ visible: false }}
          thread={false}
        />
      );
      break;
    case 'custom':
      if (msg.customEvent == 'userCard') {
        content = (
          <UserCardMessage
            showAvatar={false}
            showMessageInfo={false}
            bubbleClass={bubbleClass}
            select={false}
            status="default"
            key={msg.id}
            customMessage={msg as CustomMessageType}
            direction="ltr"
            type="secondly"
            reaction={false}
            customAction={{ visible: false }}
            thread={false}
          />
        );
      } else {
        content = (
          <TextMessage
            showAvatar={false}
            bubbleClass={bubbleClass}
            showMessageInfo={false}
            select={false}
            status="default"
            key={msg.id}
            bubbleType="none"
            textMessage={msg as unknown as TextMessageType}
            direction="ltr"
            thread={false}
          >
            {t('customMessage') as string}
          </TextMessage>
        );
      }
      break;
    case 'combine':
      content = (
        <CombinedMessage
          showAvatar={false}
          showMessageInfo={false}
          status="default"
          bubbleClass={bubbleClass}
          select={false}
          key={msg.id}
          combinedMessage={msg as CombinedMessageProps['combinedMessage']}
          direction="ltr"
          type="secondly"
          reaction={false}
          customAction={{ visible: false }}
          thread={false}
        />
      );
      break;

    default:
      content = null;
      break;
  }

  return content;
};

const PinnedMessage = (props: PinnedMessageProps) => {
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { prefix, className, style = {} } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('pinned-messages', prefix);
  const { t } = useTranslation();
  const { conversationStore } = rootStore;
  const currentCvs = conversationStore.currentCvs;
  const [visible, setVisible] = useState<boolean>(false);
  const [unPinMessageId, setUnpinMessageId] = useState<string>('');
  const { list, cursor, getPinnedMessages, hide, unpinMessage } = usePinnedMessage({
    conversation: {
      conversationType: currentCvs.chatType as Exclude<ChatType, 'singleChat'>,
      conversationId: currentCvs.conversationId,
    },
    pageSize: 50,
  });

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const handleClickClose = () => {
    hide();
  };

  const scrollToMsg = (messageId: string) => {
    const localMsg = rootStore.messageStore.message.byId[messageId];
    if (localMsg) messageId = localMsg.id;
    const anchorElement = document.getElementById(messageId);
    if (!anchorElement) {
      const MESSAGE_NOT_FOUND = 51;
      eventHandler.dispatchError('jumpToPinnedMessage', {
        type: MESSAGE_NOT_FOUND,
        message: 'The pinned message does not exist',
      });
      return;
    }
    anchorElement?.scrollIntoView({ behavior: 'smooth' });
    anchorElement?.classList.add('reply-message-twinkle');
    eventHandler.dispatchSuccess('jumpToPinnedMessage');
    setTimeout(() => {
      anchorElement?.classList.remove('reply-message-twinkle');
    }, 1500);
  };

  useEffect(() => {
    if (currentCvs.chatType === 'singleChat') {
      hide();
      return;
    }
    if (cursor !== null) {
      getPinnedMessages();
    }
  }, [cursor, currentCvs]);

  return (
    <div className={classString} style={{ ...style }}>
      <Header
        className={`${prefixCls}-header`}
        avatar={<></>}
        content={`${list.length || ''} ${t('Pinned Messages')}`}
        close
        onClickClose={handleClickClose}
      />
      <div className={`${prefixCls}-wrap`}>
        {list.length > 0 ? (
          list.map(item => {
            return (
              <div className={`${prefixCls}-item-wrap`} key={item.message.id}>
                <div className={`${prefixCls}-info-wrap`}>
                  <div className={`${prefixCls}-info`}>{`${getMsgSenderNickname({
                    ...item.message,
                    from: item.operatorId,
                  } as BaseMessageType)} ${t("pinned")} ${getMsgSenderNickname(
                    item.message as BaseMessageType,
                  )}${t("'s message")}`}</div>
                  <div className={`${prefixCls}-time`}>{getConversationTime(item.pinTime)}</div>
                </div>
                <div className={`${prefixCls}-opt-wrap`}>
                  <RenderMessage
                    bubbleClass={`${prefixCls}-message-bubble`}
                    message={item.message as any}
                  />
                  <div className={`${prefixCls}-opt`}>
                    <span title={t('Jump to pinned message') as string}>
                      <Icon
                        type="ARROW_TO"
                        className={`${prefixCls}-opt-icon`}
                        style={{ marginRight: '4px' }}
                        onClick={() => {
                          scrollToMsg(item.message.id);
                        }}
                      ></Icon>
                    </span>
                    <span title={t('remove') as string}>
                      <Icon
                        type="UNPIN"
                        onClick={() => {
                          setUnpinMessageId(item.message.id);
                          setVisible(true);
                        }}
                        className={`${prefixCls}-opt-icon`}
                      ></Icon>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Icon className={`${prefixCls}-empty`} type="EMPTY"></Icon>
        )}
      </div>
      <Modal
        title={t('Remove pin message')}
        open={visible}
        onCancel={() => {
          setUnpinMessageId('');
          setVisible(false);
        }}
        onOk={() => {
          unpinMessage(unPinMessageId);
          setVisible(false);
        }}
      >
        <div>{`${t('Confirm to remove pin message ?')}`}</div>
      </Modal>
    </div>
  );
};

export default observer(PinnedMessage);
