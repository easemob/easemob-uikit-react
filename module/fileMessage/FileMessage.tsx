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
import { getCvsIdFromMessage } from '../utils';
import { observer } from 'mobx-react-lite';
import { ChatSDK } from '../SDK';
import { RootContext } from '../store/rootContext';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface FileMessageProps extends BaseMessageProps {
  fileMessage: FileMessageType; // 从SDK收到的文件消息
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
    ...baseMsgProps
  } = props;

  const { filename, file_length, from, reactions, status } = fileMessage;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-file', customizePrefixCls);
  let { bySelf } = fileMessage;
  const conversationId = getCvsIdFromMessage(fileMessage);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType: fileMessage.chatType,
    },
  });
  if (typeof bySelf == 'undefined') {
    bySelf = fileMessage.from === rootStore.client.context.userId;
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
    fetch(fileMessage.url)
      .then(res => {
        return res.blob();
      })
      .then(blob => {
        download(blob, filename);

        // 消息是发给自己的单聊消息，回复read ack， 引用、转发的消息、已经是read状态的消息，不发read ack
        if (
          fileMessage.chatType == 'singleChat' &&
          fileMessage.from != rootStore.client.context.userId &&
          // @ts-ignore
          fileMessage.status != 'read' &&
          !fileMessage.isChatThread &&
          fileMessage.to == rootStore.client.context.userId
        ) {
          rootStore.messageStore.sendReadAck(fileMessage.id, fileMessage.from || '');
        }
      })
      .catch(err => {
        return false;
      });
  };
  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(fileMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(fileMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(fileMessage.mid || fileMessage.id);
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(fileMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(fileMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(fileMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: fileMessage.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            fileMessage.mid || fileMessage.id,
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
    const conversationId = getCvsIdFromMessage(fileMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
      fileMessage.isChatThread,
      true,
    );
  };

  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[fileMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(fileMessage);
  };

  const select =
    rootStore.messageStore.selectedMessage[fileMessage.chatType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[fileMessage.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(fileMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == fileMessage.id || item.mid == fileMessage.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
  };

  // @ts-ignore
  const _thread =
    // @ts-ignore
    fileMessage.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !fileMessage.chatThread &&
    !fileMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: fileMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(fileMessage.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: fileMessage,
      info: fileMessage.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(fileMessage?.chatThreadOverview?.id || '');
  };

  return (
    <BaseMessage
      id={fileMessage.id}
      className={bubbleClass}
      message={fileMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      time={fileMessage.time}
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
      chatThreadOverview={fileMessage.chatThreadOverview}
      onClickThreadTitle={handleClickThreadTitle}
      status={status}
      {...baseMsgProps}
    >
      <div className={classString} style={style}>
        <div className={`${prefixCls}-info`}>
          <span onClick={handleClick}>{filename}</span>
          <span>{(file_length / 1024).toFixed(2)}kb</span>
        </div>
        <div className={`${prefixCls}-icon`}>
          <Icon type={iconType} height="32px" width="32px" color="#ACB4B9"></Icon>
        </div>
      </div>
    </BaseMessage>
  );
};

export default observer(FileMessage);
