import React, { useContext, useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { AudioMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import { AudioPlayer } from './AudioPlayer';
import rootStore from '../store/index';
import { observer } from 'mobx-react-lite';
import { getCvsIdFromMessage } from '../utils';
import { chatSDK, ChatSDK } from '../SDK';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import { RootContext } from '../store/rootContext';

export interface AudioMessageProps extends Omit<BaseMessageProps, 'bubbleType'> {
  audioMessage: AudioMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  nickName?: string;
  bubbleClass?: string;
  type?: 'primary' | 'secondly';
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onlyContent?: boolean;
}

const AudioMessage = (props: AudioMessageProps) => {
  const [isPlaying, setPlayStatus] = useState(false);
  const {
    audioMessage,
    style: customStyle,
    prefix: customizePrefixCls,
    className,
    type,
    renderUserProfile,
    nickName,
    thread,
    onlyContent = false,
    bubbleClass,
    ...others
  } = props;

  const audioRef = useRef(null);
  const {
    url,
    file_length,
    length,
    file,
    time: messageTime,
    from,
    status,
    reactions,
  } = audioMessage;
  // const duration = body.length
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-audio', customizePrefixCls);
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(audioMessage),
      conversationType: audioMessage.chatType as any,
    },
  });
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: !!type,
    },
    className,
  );

  const [sourceUrl, setUrl] = useState('');
  useEffect(() => {
    let options = {
      url: audioMessage.url as string,
      headers: {
        Accept: 'audio/mp3',
      },
      onFileDownloadComplete: function (response: any) {
        let objectUrl = chatSDK.utils.parseDownloadResponse.call(rootStore.client, response);
        setUrl(objectUrl);
      },
      onFileDownloadError: function () {},
    };
    chatSDK.utils.download.call(rootStore.client, options);
  }, [audioMessage.url]);
  const playAudio = () => {
    setPlayStatus(true);
    (audioRef as unknown as React.MutableRefObject<HTMLAudioElement>).current
      .play()
      .then(res => {
        // console.log(res);
      })
      .catch(err => {
        // console.error('err', err);
      });

    // 消息是发给自己的单聊消息，回复read ack， 引用、转发的消息、已经是read状态的消息，不发read ack
    if (
      audioMessage.chatType == 'singleChat' &&
      audioMessage.from != rootStore.client.context.userId &&
      audioMessage.status != 'read' &&
      !audioMessage.isChatThread &&
      audioMessage.to == rootStore.client.context.userId
    ) {
      rootStore.messageStore.sendReadAck(audioMessage.id, audioMessage.from);
    }
  };
  const handlePlayEnd = () => {
    setPlayStatus(false);
  };

  const duration = Number.isInteger(length) ? length : file.duration || 0;
  const style = {
    width: `calc(${duration}% + 40px)`,
    maxWidth: `calc(100% - 128px)`,
  };
  let { bySelf } = audioMessage;
  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  const bubbleType = type ? type : bySelf ? 'primary' : 'secondly';
  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(audioMessage);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: audioMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      audioMessage.mid || audioMessage.id,
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(audioMessage.mid || audioMessage.id);
  };

  const handleClickEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(audioMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: audioMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      audioMessage.mid || audioMessage.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: audioMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      audioMessage.mid || audioMessage.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(audioMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: audioMessage.chatType,
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
    let conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: audioMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      audioMessage.mid || audioMessage.id,
      audioMessage.isChatThread,
      true,
    );
  };

  let conversationId = getCvsIdFromMessage(audioMessage);
  const handleSelectMessage = () => {
    const selectable =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[audioMessage.chatType][conversationId]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: audioMessage.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(audioMessage);
  };

  const select =
    // @ts-ignore
    rootStore.messageStore.selectedMessage[audioMessage.chatType][conversationId]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[audioMessage.chatType][conversationId]
        ?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(audioMessage);
    } else {
      changedList = checkedMessages.filter((item: { id: string }) => {
        // @ts-ignore
        return !(item.id == audioMessage.id || item.mid == audioMessage.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: audioMessage.chatType,
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
    audioMessage.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !audioMessage.chatThread &&
    !audioMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: audioMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(audioMessage.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: audioMessage,
      info: audioMessage.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(audioMessage?.chatThreadOverview?.id || '');
  };
  return (
    <>
      {onlyContent ? (
        <div className={classString} onClick={playAudio} style={{ ...customStyle, width: '100%' }}>
          <AudioPlayer play={isPlaying} reverse={bySelf} size={20}></AudioPlayer>
          <span className={`${prefixCls}-duration`}>{duration + '"' || 0}</span>
          <audio
            src={typeof file.url == 'string' ? file.url : sourceUrl}
            ref={audioRef}
            onEnded={handlePlayEnd}
            onError={handlePlayEnd}
            onStalled={handlePlayEnd}
          />
        </div>
      ) : (
        <BaseMessage
          id={audioMessage.id}
          className={bubbleClass}
          direction={bySelf ? 'rtl' : 'ltr'}
          message={audioMessage}
          time={messageTime}
          nickName={nickName}
          status={status}
          bubbleType={bubbleType}
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
          chatThreadOverview={audioMessage.chatThreadOverview}
          onClickThreadTitle={handleClickThreadTitle}
          bubbleStyle={style}
          {...others}
        >
          <div className={classString} onClick={playAudio} style={{ ...customStyle }}>
            <AudioPlayer play={isPlaying} reverse={bySelf} size={20}></AudioPlayer>
            <span className={`${prefixCls}-duration`}>{duration + '"' || 0}</span>
            <audio
              src={typeof file.url == 'string' ? file.url : sourceUrl}
              ref={audioRef}
              onEnded={handlePlayEnd}
              onError={handlePlayEnd}
              onStalled={handlePlayEnd}
            />
          </div>
        </BaseMessage>
      )}
    </>
  );
};

export default observer(AudioMessage);
