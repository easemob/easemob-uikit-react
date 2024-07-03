import React, { useRef, useState, memo, useEffect, useContext } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { CustomMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import Mask from '../../component/modal/Mast';
import Modal from '../../component/modal';
import Icon from '../../component/icon';
import rootStore from '../store/index';
import { getCvsIdFromMessage } from '../utils';
import { observer } from 'mobx-react-lite';
import { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import Button from '../../component/button';
import { useTranslation } from 'react-i18next';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface UserCardMessageProps extends BaseMessageProps {
  customMessage: CustomMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  type?: 'primary' | 'secondly';
  onClick?: (url: string) => void;
  bubbleClass?: string;
  nickName?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onUserIdCopied?: (userId: string) => void;
}

const UserCardMessage = (props: UserCardMessageProps) => {
  const {
    customMessage: message,
    renderUserProfile,
    nickName,
    prefix,
    className,
    style,
    bubbleClass,
    thread,
    onUserIdCopied,
    ...others
  } = props;
  let { bySelf, from, reactions, status } = message;

  const { conversationStore, addressStore } = rootStore;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-card', prefix);
  const { t } = useTranslation();
  const userInfo = message.customExts;
  const { nickname, uid: userId, avatar } = userInfo;
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(message),
      conversationType: message.chatType as any,
    },
  });

  if (typeof bySelf == 'undefined') {
    bySelf = from === rootStore.client.context.userId;
  }
  let type = props.type;
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: !!type,
    },
    className,
  );

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(message);
  };
  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(message);

    rootStore.messageStore.deleteMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
    );
  };
  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(message.mid || message.id);
  };
  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(message);

    rootStore.messageStore.addReaction(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      emojiString,
    );
  };
  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.deleteReaction(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      emojiString,
    );
  };
  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(message);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: message.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            message.mid || message.id,
            emojiString,
          );
        }

        if (item.isAddedBySelf) {
          const index = item.userList.indexOf(rootStore.client.user);
          if (index > -1) {
            const findItem = item.userList.splice(index, 1)[0];
            item.userList.unshift(findItem);
          } else {
            item.userList.unshift(rootStore.client.user);
          }
        }
      }
    });
  };
  const handleRecallMessage = () => {
    const conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.recallMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      message.isChatThread,
      true,
    );
  };

  const handleSelectMessage = () => {
    const conversationId = getCvsIdFromMessage(message);
    const selectable =
      rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };
  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(message);
  };

  const conversationId = getCvsIdFromMessage(message);
  const select =
    rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(message);
    } else {
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == message.id || item.mid == message.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
  };
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: message,
    });
    rootStore.threadStore.setThreadVisible(true);
  };
  // @ts-ignore
  const _thread =
    // @ts-ignore
    message.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !message.chatThread &&
    !message.isChatThread;

  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(message.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: message,
      info: message.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(message?.chatThreadOverview?.id || '');
  };
  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = userId;
    // 添加到 DOM 元素中，方便调用 select 方法
    document.body.appendChild(textArea);
    // 选中文本
    textArea.select();
    // 执行复制命令
    document.execCommand('copy');
    // 删除临时元素
    document.body.removeChild(textArea);
    onUserIdCopied?.(userId);
  };

  // add contact
  const addContact = () => {
    setDisabled(true);
    addressStore.addContact(userId);
  };

  // start message
  const handleClickMessage = () => {
    conversationStore.addConversation({
      chatType: 'singleChat',
      conversationId: userId,
      name: nickname,
      lastMessage: {
        time: Date.now(),
        type: 'txt',
        msg: '',
        id: '',
        chatType: 'singleChat',
        to: userId,
      },
      unreadCount: 0,
    });
    conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: userId,
      name: nickname,
    });
  };

  const isContact = addressStore.contacts.some(item => item.userId === userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <div>
      <BaseMessage
        time={message.time}
        id={message.id}
        className={bubbleClass}
        message={message}
        bubbleType={type}
        direction={bySelf ? 'rtl' : 'ltr'}
        nickName={nickName}
        onReplyMessage={handleReplyMsg}
        onDeleteMessage={handleDeleteMsg}
        onPinMessage={handlePinMessage}
        reactionData={reactions}
        onAddReactionEmoji={handleClickEmoji}
        onDeleteReactionEmoji={handleDeleteEmoji}
        onShowReactionUserList={handleShowReactionUserList}
        onRecallMessage={handleRecallMessage}
        onSelectMessage={handleSelectMessage}
        onResendMessage={handleResendMessage}
        select={select}
        onMessageCheckChange={handleMsgCheckChange}
        renderUserProfile={renderUserProfile}
        onCreateThread={handleCreateThread}
        thread={_thread}
        chatThreadOverview={message.chatThreadOverview}
        onClickThreadTitle={handleClickThreadTitle}
        // bubbleStyle={{ padding: '0' }}
        status={status}
        {...others}
      >
        <div
          className={classString}
          style={style}
          onClick={() => {
            setModalVisible(true);
          }}
        >
          <div className={`${prefixCls}-info`}>
            <Avatar size={44} src={avatar}>
              {nickname}
            </Avatar>
            {nickname}
          </div>
          <div className={`${prefixCls}-tag`}>{t('contact')}</div>
        </div>
      </BaseMessage>

      <Modal
        title={null}
        open={modalVisible}
        footer={null}
        width={326}
        closable={false}
        onCancel={() => {
          setModalVisible(false);
        }}
      >
        <div className={`${prefixCls}-modal`}>
          <Avatar size={100} src={avatar}>
            {nickname}
          </Avatar>
          <div className={`${prefixCls}-modal-content`}>
            <div className={`${prefixCls}-content-name`}>{nickname}</div>
            <div className={`${prefixCls}-content-id`}>
              <div>{t('user')} ID:</div>
              {userId}
              <Icon type="DOC_ON_DOC" style={{ cursor: 'copy' }} onClick={handleCopy}></Icon>
            </div>
          </div>

          {isContact ? (
            <Button
              type="primary"
              className={`${prefixCls}-content-btn`}
              onClick={handleClickMessage}
            >
              <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
              {t('message')}
            </Button>
          ) : userId == rootStore.client.user ? null : (
            <Button
              type="primary"
              className={`${prefixCls}-content-btn`}
              onClick={addContact}
              disabled={disabled}
            >
              <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
              {t('addContact')}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default observer(UserCardMessage);
