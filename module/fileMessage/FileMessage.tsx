import React from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import Icon, { IconProps } from '../../component/icon';
import './style/style.scss';
import type { FileMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import download from '../utils/download';
import rootStore from '../store/index';
import { getCvsIdFromMessage } from '../utils';

export interface FileMessageProps extends BaseMessageProps {
  fileMessage: FileMessageType; // 从SDK收到的文件消息
  iconType?: IconProps['type'];
  prefix?: string;
  className?: string;
  nickName?: string;
  type?: 'primary' | 'secondly';
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
    rootStore.messageStore.deleteMessage(
      {
        chatType: fileMessage.chatType,
        conversationId: fileMessage.to,
      },
      // @ts-ignore
      fileMessage.mid || fileMessage.id,
    );
  };

  const handleClickEmoji = (emojiString: string) => {
    console.log('添加Reaction', emojiString);
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
  return (
    <BaseMessage
      id={fileMessage.id}
      bubbleType={type}
      style={style}
      direction={bySelf ? 'rtl' : 'ltr'}
      shape={shape}
      nickName={nickName || from}
      onReplyMessage={handleReplyMsg}
      onDeleteMessage={handleDeleteMsg}
      reactionData={reactions}
      onAddReactionEmoji={handleClickEmoji}
      onDeleteReactionEmoji={handleDeleteEmoji}
      onShowReactionUserList={handleShowReactionUserList}
      {...baseMsgProps}
    >
      <div className={classString}>
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

export { FileMessage };
