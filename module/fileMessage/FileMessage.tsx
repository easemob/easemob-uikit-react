import React, { useContext } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import Icon, { IconProps } from '../../component/icon';
import './style/style.scss';
import type { FileMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import download from '../utils/download';
import rootStore from '../store/index';
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getMessageChatType,
  getMessageId,
  getMessageTime,
  getThreadId,
} from '../utils';
import { observer } from 'mobx-react-lite';
import type { ChatSDK } from '../SDK';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface FileMessageProps extends BaseMessageProps {
  fileMessage: FileMessageType | ChatSDK.Message; // 从SDK收到的文件消息
  iconType?: IconProps['type'];
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  bubbleClass?: string;
  nickName?: string;
  type?: 'primary' | 'secondly';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
}

const FileMessage = (props: FileMessageProps) => {
  let {
    iconType = 'DOC',
    bubbleClass,
    fileMessage,
    shape,
    prefix: customizePrefixCls,
    style,
    type,
    className,
    nickName,
    renderUserProfile,
    thread,
    onClick,
    ...baseMsgProps
  } = props;

  const sdkMessage = fileMessage as ChatSDK.Message;
  const uiMessage = fileMessage as FileMessageType & Record<string, any>;
  const body = sdkMessage.body as Record<string, any>;
  const conversationType = getMessageChatType(sdkMessage);
  if (!conversationType) return null;
  const filename = body.filename || uiMessage.filename || '';
  const fileLength = body.fileLength || body.fileSize || uiMessage.file_length || 0;
  const fileUrl = body.url || uiMessage.url || '';
  const { from, reactions, status } = uiMessage;
  const messageId = getMessageId(sdkMessage);
  const messageTime = getMessageTime(sdkMessage);
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-file', customizePrefixCls);
  let { bySelf } = uiMessage;
  const conversationId = getCvsIdFromMessage(sdkMessage);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType,
    },
  });
  if (typeof bySelf == 'undefined') {
    bySelf = fileMessage.from === getCurrentUserId(rootStore.client);
  }
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: !!type,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const handleClick = () => {
    const preventDefault = onClick && onClick(sdkMessage);
    if (preventDefault === true) return;
    fetch(fileUrl)
      .then(res => {
        return res.blob();
      })
      .then(blob => {
        download(blob, filename);

        // 消息是发给自己的单聊消息，回复read ack， 引用、转发的消息、已经是read状态的消息，不发read ack
        if (
          conversationType == 'singleChat' &&
          sdkMessage.from != getCurrentUserId(rootStore.client) &&
          uiMessage.status != 'read' &&
          !uiMessage.isChatThread &&
          sdkMessage.to == getCurrentUserId(rootStore.client)
        ) {
          rootStore.messageStore.sendReadAck(messageId, sdkMessage.from || '');
        }
      })
      .catch(err => {
        return false;
      });
  };
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

  const select =
    rootStore.messageStore &&
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

  const _thread =
    conversationType == 'groupChat' && thread && !uiMessage.chatThread && !uiMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: sdkMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
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

  return (
    <BaseMessage
      id={messageId}
      className={bubbleClass}
      message={sdkMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      time={messageTime}
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
      renderUserProfile={renderUserProfile}
      select={select}
      onMessageCheckChange={handleMsgCheckChange}
      onCreateThread={handleCreateThread}
      thread={_thread}
      chatThreadOverview={uiMessage.chatThreadOverview as any}
      onClickThreadTitle={handleClickThreadTitle}
      status={status}
      {...baseMsgProps}
    >
      <div className={classString} style={style}>
        <div className={`${prefixCls}-info`}>
          <span onClick={handleClick}>{filename}</span>
          <span>{(fileLength / 1024).toFixed(2)}kb</span>
        </div>
        <div className={`${prefixCls}-icon`}>
          <Icon type={iconType} height="32px" width="32px" color="#ACB4B9"></Icon>
        </div>
      </div>
    </BaseMessage>
  );
};
const FileMessageOut = observer(FileMessage);
FileMessageOut.displayName = 'FileMessage';
export default FileMessageOut;
