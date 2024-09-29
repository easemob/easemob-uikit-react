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
  const context = React.useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode;

  let { bySelf } = audioMessage;
  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  const bubbleType = type ? type : bySelf ? 'primary' : 'secondly';

  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(audioMessage),
      conversationType: audioMessage.chatType,
    },
  });
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${bubbleType}`]: !!bubbleType,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [sourceUrl, setUrl] = useState('');
  useEffect(() => {
    if (!audioMessage.url) return;
    const options = {
      url: audioMessage.url as string,
      headers: {
        Accept: 'audio/mp3',
      },
      onFileDownloadComplete: function (response: any) {
        const objectUrl = chatSDK.utils.parseDownloadResponse.call(rootStore.client, response);
        console.log('下载文件成功', objectUrl);
        setUrl(objectUrl);
      },
      onFileDownloadError: function () {},
    };
    chatSDK.utils.download.call(rootStore.client, options);
  }, [audioMessage.url]);
  const playAudio = () => {
    setPlayStatus(true);
    console.log('audioRef', audioRef.current);
    (audioRef as unknown as React.MutableRefObject<HTMLAudioElement>).current.play().catch(err => {
      console.error('err', err);
      setPlayStatus(false);
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

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(audioMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(audioMessage);
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
    const conversationId = getCvsIdFromMessage(audioMessage);

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
    const conversationId = getCvsIdFromMessage(audioMessage);
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
    const conversationId = getCvsIdFromMessage(audioMessage);
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
    const conversationId = getCvsIdFromMessage(audioMessage);
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

  const conversationId = getCvsIdFromMessage(audioMessage);
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
  const _thread =
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
            src={sourceUrl}
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
              // src={typeof file.url == 'string' ? file.url : sourceUrl}
              src={sourceUrl ?? file.url}
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

const AudioMessageOut = observer(AudioMessage);
AudioMessageOut.displayName = 'AudioMessage';
export default AudioMessageOut;
