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
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getCustomParams,
  getMessageChatType,
  getMessageDisplayStatus,
  getMessageId,
  getMessageTime,
  getThreadId,
} from '../utils';
import { observer } from 'mobx-react-lite';
import type { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import Button from '../../component/button';
import { useTranslation } from 'react-i18next';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface UserCardMessageProps extends BaseMessageProps {
  customMessage: CustomMessageType | ChatSDK.Message; // 从SDK收到的自定义名片消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  type?: 'primary' | 'secondly';
  // onClick?: (url: string) => void;
  bubbleClass?: string;
  nickName?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onUserIdCopied?: (userId: string) => void;
}

let UserCardMessage = (props: UserCardMessageProps) => {
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
  const sdkMessage = message as ChatSDK.Message;
  const uiMessage = message as CustomMessageType & Record<string, any>;
  const conversationType = getMessageChatType(sdkMessage);
  if (!conversationType) return null;
  const messageId = getMessageId(sdkMessage);
  const messageTime = getMessageTime(sdkMessage);
  let { bySelf, from, reactions } = uiMessage;
  const status = getMessageDisplayStatus(sdkMessage);

  const { conversationStore, addressStore } = rootStore;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-card', prefix);
  const { t } = useTranslation();
  const userInfo = getCustomParams(sdkMessage) as Record<string, any>;
  const { nickname, uid: userId, avatar } = userInfo;
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(sdkMessage),
      conversationType,
    },
  });

  if (typeof bySelf == 'undefined') {
    bySelf = from === getCurrentUserId(rootStore.client);
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
    rootStore.messageStore.setRepliedMessage(sdkMessage);
  };
  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
    );
  };
  const handlePinMessage = () => {
    pinMessage(messageId);
  };
  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };
  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };
  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: conversationType,
              conversationId: conversationId,
            },
            messageId,
            emojiString,
          );
        }

        if (item.isAddedBySelf) {
          const currentUserId = getCurrentUserId(rootStore.client);
          const index = item.userList.indexOf(currentUserId);
          if (index > -1) {
            const findItem = item.userList.splice(index, 1)[0];
            item.userList.unshift(findItem);
          } else {
            item.userList.unshift(currentUserId);
          }
        }
      }
    });
  };
  const handleRecallMessage = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      uiMessage.isChatThread,
      true,
    );
  };

  const handleSelectMessage = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    const selectable =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };
  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(sdkMessage);
  };

  const conversationId = getCvsIdFromMessage(sdkMessage);
  const select =
    rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(sdkMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        return getMessageId(item) !== messageId;
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: conversationType,
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
      originalMessage: sdkMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };
  const _thread =
    conversationType == 'groupChat' && thread && !uiMessage.chatThread && !uiMessage.isChatThread;

  const handleClickThreadTitle = () => {
    const chatThreadId = getThreadId(uiMessage.chatThreadOverview);
    rootStore.threadStore.joinChatThread(chatThreadId);
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: sdkMessage,
      info: uiMessage.chatThreadOverview as any,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(chatThreadId);
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
        msgId: '',
        type: 'text',
        body: { content: '' },
        timestamp: Date.now(),
      },
      unreadCount: 0,
    });
    conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: userId,
      name: nickname,
    });

    setModalVisible(false);
  };

  const isContact = addressStore.contacts.some(item => item.userId === userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <div>
      <BaseMessage
        time={messageTime}
        id={messageId}
        className={bubbleClass}
        message={sdkMessage}
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
        chatThreadOverview={uiMessage.chatThreadOverview as any}
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
          ) : userId == getCurrentUserId(rootStore.client) ? null : (
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
UserCardMessage = observer(UserCardMessage);
// UserCardMessageOut.displayName = 'UserCardMessage';
// export default UserCardMessageOut;
export { UserCardMessage };
