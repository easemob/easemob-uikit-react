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
import { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
export interface FileMessageProps extends BaseMessageProps {
  fileMessage: FileMessageType; // 从SDK收到的文件消息
  iconType?: IconProps['type'];
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  nickName?: string;
  type?: 'primary' | 'secondly';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
}

const FileMessage = (props: FileMessageProps) => {
  let {
    iconType = 'DOC',
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

  const { filename, file_length, from, reactions } = fileMessage;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-file', customizePrefixCls);
  let { bySelf } = fileMessage;
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
      })
      .catch(err => {
        return false;
      });
  };
  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(fileMessage);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(fileMessage);

    rootStore.messageStore.deleteMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
    );
  };

  const handleClickEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(fileMessage);

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
    let conversationId = getCvsIdFromMessage(fileMessage);
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
    let conversationId = getCvsIdFromMessage(fileMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: fileMessage.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            textMessage.mid || textMessage.id,
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
    let conversationId = getCvsIdFromMessage(fileMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
      fileMessage.isChatThread,
    );
  };

  let conversationId = getCvsIdFromMessage(fileMessage);
  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[fileMessage.chatType][conversationId]?.selectable;
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
    rootStore.messageStore.selectedMessage[fileMessage.chatType][conversationId]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[fileMessage.chatType][conversationId]?.selectedMessage;

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
  let _thread =
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
      info: fileMessage.chatThreadOverview as unknown as AgoraChat.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(fileMessage?.chatThreadOverview?.id || '');
  };

  return (
    <BaseMessage
      id={fileMessage.id}
      message={fileMessage}
      bubbleType={type}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      nickName={nickName}
      onReplyMessage={handleReplyMsg}
      onDeleteMessage={handleDeleteMsg}
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
