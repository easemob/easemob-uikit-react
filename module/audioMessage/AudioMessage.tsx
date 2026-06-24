import React, { useContext, useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import BaseMessage, {
  BaseMessageProps,
  BaseMessageType,
  renderUserProfileProps,
} from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { AudioMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import { AudioPlayer } from './AudioPlayer';
import rootStore from '../store/index';
import { observer } from 'mobx-react-lite';
import { getCurrentUserId, getCvsIdFromMessage, getMessageId } from '../utils';
import type { ChatSDK } from '../SDK';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import { RootContext } from '../store/rootContext';

export interface AudioMessageProps extends Omit<BaseMessageProps, 'bubbleType'> {
  audioMessage: AudioMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  // nickName?: string;
  bubbleClass?: string;
  type?: 'primary' | 'secondly';
  // renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
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
    // renderUserProfile,
    // nickName,
    thread,
    onlyContent = false,
    bubbleClass,
    onClick,
    ...others
  } = props;

  const audioRef = useRef(null);
  const { body, file, from, status, reactions } = audioMessage;
  const messageTime = audioMessage.timestamp;
  const audioUrl = body.url;
  // const duration = body.length
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-audio', customizePrefixCls);
  const context = React.useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode;

  let { bySelf } = audioMessage;
  if (typeof bySelf == 'undefined') {
    bySelf = from == getCurrentUserId(rootStore.client);
  }
  const bubbleType = type ? type : bySelf ? 'primary' : 'secondly';

  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: getCvsIdFromMessage(audioMessage),
      conversationType: audioMessage.conversationType,
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

  const [sourceUrl, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!audioUrl) return;
    let objectUrl = '';
    rootStore.client.chatManager
      .downloadAttachment({ message: audioMessage as unknown as ChatSDK.Message })
      .then((result: ChatSDK.MessageAttachmentDownloadResult) => {
        const blob = new Blob([result.data], { type: result.mimeType || 'audio/mp3' });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        setUrl(audioUrl);
      });
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioMessage, audioUrl]);
  const playAudio = () => {
    const preventDefault = onClick && onClick(audioMessage);
    if (preventDefault === true) return;
    const audioElements = document.getElementsByTagName('audio');
    Array.from(audioElements).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0; // 重置进度
      }
    });
    setPlayStatus(true);
    setTimeout(() => {
      (audioRef as unknown as React.MutableRefObject<HTMLAudioElement>).current
        .play()
        .catch(err => {
          setPlayStatus(false);
        });
    }, 10);

    // 消息是发给自己的单聊消息，回复read ack， 引用、转发的消息、已经是read状态的消息，不发read ack
    const currentUserId = getCurrentUserId(rootStore.client);
    if (
      audioMessage.conversationType == 'singleChat' &&
      audioMessage.from != currentUserId &&
      audioMessage.status != 'read' &&
      !audioMessage.isChatThread &&
      audioMessage.to == currentUserId
    ) {
      rootStore.messageStore.sendReadAck(getMessageId(audioMessage), audioMessage.from);
    }
  };
  const handlePlayEnd = () => {
    setPlayStatus(false);
  };

  const duration = Number.isInteger(body.duration) ? body.duration : file?.duration || 0;
  const style = {
    width: `calc(${duration}% + 40px)`,
    maxWidth: `calc(100% - 128px)`,
  };

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(audioMessage as unknown as ChatSDK.Message);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: audioMessage.conversationType,
        conversationId: conversationId,
      },
      getMessageId(audioMessage),
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(getMessageId(audioMessage));
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(audioMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: audioMessage.conversationType,
        conversationId: conversationId,
      },
      getMessageId(audioMessage),
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: audioMessage.conversationType,
        conversationId: conversationId,
      },
      getMessageId(audioMessage),
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
              chatType: audioMessage.conversationType,
              conversationId: conversationId,
            },
            getMessageId(audioMessage),
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
    const conversationId = getCvsIdFromMessage(audioMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: audioMessage.conversationType,
        conversationId: conversationId,
      },
      getMessageId(audioMessage),
      audioMessage.isChatThread,
      true,
    );
  };

  const conversationId = getCvsIdFromMessage(audioMessage);
  const handleSelectMessage = () => {
    const selectable =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[audioMessage.conversationType][conversationId]
        ?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: audioMessage.conversationType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(audioMessage as unknown as ChatSDK.Message);
  };

  const select =
    // @ts-ignore
    rootStore.messageStore.selectedMessage[audioMessage.conversationType][conversationId]
      ?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[audioMessage.conversationType][conversationId]
        ?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(audioMessage);
    } else {
      changedList = checkedMessages.filter((item: ChatSDK.Message) => {
        return getMessageId(item) !== getMessageId(audioMessage);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: audioMessage.conversationType,
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
    audioMessage.conversationType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !audioMessage.chatThread &&
    !audioMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: audioMessage as unknown as ChatSDK.Message,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    const chatThreadId =
      (audioMessage.chatThreadOverview as Record<string, any> | undefined)?.chatThreadId ||
      (audioMessage.chatThreadOverview as Record<string, any> | undefined)?.id ||
      '';
    rootStore.threadStore.joinChatThread(chatThreadId);
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: audioMessage as unknown as ChatSDK.Message,
      info: audioMessage.chatThreadOverview as unknown as ChatSDK.ChatThreadSummary,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(chatThreadId);
  };
  const handlePauseAudio = () => {
    console.log('handlePauseAudio');
    setPlayStatus(false);
  };
  // 监听 audio 事件
  useEffect(() => {
    const audio = audioRef.current as unknown as HTMLAudioElement;
    if (!audio) return;

    // 暂停事件：结束播放动画
    const handlePause = () => {
      setPlayStatus(false);
      console.log('音频已暂停（主动停止或自然结束前的暂停）');
    };

    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('pause', handlePause); // 组件卸载时移除监听
    };
  }, []);
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
          id={getMessageId(audioMessage)}
          className={bubbleClass}
          direction={bySelf ? 'rtl' : 'ltr'}
          message={audioMessage as BaseMessageType}
          time={messageTime}
          // nickName={nickName}
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
          // renderUserProfile={renderUserProfile}
          onCreateThread={handleCreateThread}
          thread={_thread}
          chatThreadOverview={
            audioMessage.chatThreadOverview as unknown as ChatSDK.ChatThreadSummary
          }
          onClickThreadTitle={handleClickThreadTitle}
          bubbleStyle={style}
          {...others}
        >
          <div className={classString} onClick={playAudio} style={{ ...customStyle }}>
            <AudioPlayer play={isPlaying} reverse={bySelf} size={20}></AudioPlayer>
            <span className={`${prefixCls}-duration`}>{duration + '"' || 0}</span>
            <audio
              // src={typeof file.url == 'string' ? file.url : sourceUrl}
              src={sourceUrl ?? file?.url}
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
