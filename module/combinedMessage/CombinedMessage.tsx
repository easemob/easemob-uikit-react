import React, { ReactNode, useState, useContext } from 'react';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import type { ChatSDK } from '../SDK';
import rootStore from '../store/index';
import {
  getCurrentUserId,
  getCustomEvent,
  getCvsIdFromMessage,
  getMessageChatType,
  getMessageId,
  getMessageTime,
  getThreadId,
} from '../utils';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Modal from '../../component/modal';
import { TextMessage } from '../textMessage';
import ImageMessage from '../imageMessage';
import FileMessage from '../fileMessage';
import AudioMessage from '../audioMessage';
import UserCardMessage from '../userCardMessage';
import VideoMessage from '../videoMessage';
import { observer } from 'mobx-react-lite';
import Loading from '../../component/loading';
import { useTranslation } from 'react-i18next';
import { RootContext } from '../store/rootContext';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import type {
  AudioMessageType,
  ImageMessageType,
  TextMessageType,
  FileMessageType,
  CustomMessageType,
  VideoMessageType,
} from '../types/messageType';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface CombinedMessageProps extends BaseMessageProps {
  prefix?: string;
  className?: string;
  // @ts-ignore
  combinedMessage: ChatSDK.CombineMsgBody & {
    bySelf?: boolean;
    messages?: (BaseMessageType & { bySelf: boolean })[];
    messageList?: (BaseMessageType & { bySelf?: boolean })[];
  };
  style?: React.CSSProperties;
  nickName?: string;
  type?: 'primary' | 'secondly';
  bubbleClass?: string;
  // @ts-ignore
  onShowDetail?: (msg: ChatSDK.CombineMsgBody) => void;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  showSummary?: boolean; // whether show summary
  onlyContent?: boolean; // only show message content
}

const CombinedMessage = (props: CombinedMessageProps) => {
  const {
    combinedMessage,
    style,
    nickName,
    bubbleClass,
    prefix: customizePrefixCls,
    className,
    renderUserProfile,
    thread,
    showSummary = true,
    onlyContent = false,
    onClick,
    ...others
  } = props;
  //   combinedMessage = comMsg;
  let { bySelf, from, reactions, title, summary } = combinedMessage;
  const messageTime = getMessageTime(combinedMessage);
  const conversationId = getCvsIdFromMessage(combinedMessage);
  const conversationType = getMessageChatType(combinedMessage) || 'singleChat';
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType,
    },
  });
  if (typeof bySelf == 'undefined') {
    bySelf = from == getCurrentUserId(rootStore.client);
  }
  let type = props.type;
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }
  const { t } = useTranslation();
  const handleReplyMsg = () => {
    // TODO: reply message add combine type
    rootStore.messageStore.setRepliedMessage(combinedMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      getMessageId(combinedMessage),
    );
  };

  let repliedMsg: undefined | BaseMessageType;
  if (combinedMessage.ext?.msgQuote) {
    repliedMsg = combinedMessage as BaseMessageType;
  }

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.addReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      getMessageId(combinedMessage),
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      getMessageId(combinedMessage),
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(combinedMessage);
    reactions?.forEach(
      (item: { reaction: string; count: number; userList: string[]; isAddedBySelf?: boolean }) => {
        if (item.reaction === emojiString) {
          if (item.count > 3 && item.userList.length <= 3) {
            rootStore.messageStore.getReactionUserList(
              {
                chatType: conversationType,
                conversationId: conversationId,
              },
              getMessageId(combinedMessage),
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
      },
    );
  };

  const handleRecallMessage = () => {
    const conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      getMessageId(combinedMessage),
      combinedMessage.isChatThread,
      true,
    );
  };
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-combine', customizePrefixCls);
  const context = useContext(RootContext);
  const { theme, features } = context;
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-secondly`]: type == 'secondly',
      [`${prefixCls}-primary`]: type == 'primary',
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [detailContent, setDetailContent] = useState<ReactNode>(
    <Loading size={48} visible={true} />,
  );

  const createDetailContent = (data: (BaseMessageType & { bySelf: boolean })[]) => {
    const node = data.map(msg => {
      let content;
      msg.bySelf = false;
      switch (msg?.type) {
        case 'txt':
          content = (
            <TextMessage
              select={false}
              customAction={{ visible: false }}
              reaction={false}
              key={getMessageId(msg)}
              bubbleType="none"
              textMessage={msg as TextMessageType}
              direction="ltr"
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;
        case 'img':
          content = (
            <ImageMessage
              select={false}
              imageMessage={msg as ImageMessageType}
              direction="ltr"
              key={getMessageId(msg)}
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;
        case 'file':
          content = (
            <FileMessage
              select={false}
              key={getMessageId(msg)}
              fileMessage={msg as FileMessageType}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;
        case 'audio':
          content = (
            <AudioMessage
              select={false}
              key={getMessageId(msg)}
              audioMessage={msg as AudioMessageType}
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              direction="ltr"
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;
        case 'video':
          content = (
            <VideoMessage
              select={false}
              key={getMessageId(msg)}
              videoMessage={msg as unknown as VideoMessageType}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;
        case 'custom':
          if (getCustomEvent(msg) == 'userCard') {
            content = (
              <UserCardMessage
                select={false}
                key={getMessageId(msg)}
                customMessage={msg as CustomMessageType}
                direction="ltr"
                type="secondly"
                reaction={false}
                customAction={{ visible: false }}
                thread={false}
                renderUserProfile={renderUserProfile}
                showNicknamesForAllMessages={true}
              />
            );
          } else {
            content = (
              <TextMessage
                select={false}
                key={getMessageId(msg)}
                bubbleType="none"
                textMessage={msg as unknown as TextMessageType}
                direction="ltr"
                thread={false}
                renderUserProfile={renderUserProfile}
                showNicknamesForAllMessages={true}
              >
                {t('customMessage') as string}
              </TextMessage>
            );
          }
          break;
        case 'combine':
          content = (
            <CombinedMessage
              select={false}
              key={getMessageId(msg)}
              combinedMessage={msg as CombinedMessageProps['combinedMessage']}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
              showNicknamesForAllMessages={true}
            />
          );
          break;

        default:
          content = null;
          break;
      }

      return content;
    });
    setDetailContent(node);
  };

  const showCombinedMsgs = () => {
    const preventDefault = onClick?.(combinedMessage);
    if (preventDefault === true) {
      return;
    }
    setModalOpen(true);
    if (combinedMessage.messages || combinedMessage.messageList) {
      createDetailContent(combinedMessage.messages || combinedMessage.messageList || []);
      return;
    }
    // 从服务器下载并解析合并消息
    rootStore.client.chatManager
      .downloadAndParseCombineMessage({ message: combinedMessage as unknown as ChatSDK.Message })
      .then((msgs: readonly any[]) => {
        createDetailContent(msgs as any);
      })
      .catch(() => {
        setDetailContent(<div style={{ padding: 20, textAlign: 'center' }}>Failed to load</div>);
      });
  };
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectMessage = () => {
    const selectable =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[conversationType][conversationId]?.selectable;
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
    rootStore.messageStore.sendMessage(combinedMessage);
  };

  const select =
    // @ts-ignore
    rootStore.messageStore.selectedMessage[conversationType][conversationId]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[conversationType][conversationId]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(combinedMessage);
    } else {
      // @ts-ignore
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == combinedMessage.id || item.mid == combinedMessage.id);
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

  // @ts-ignore
  const _thread =
    // @ts-ignore
    conversationType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !combinedMessage.chatThread &&
    !combinedMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: combinedMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    const chatThreadId = getThreadId(combinedMessage.chatThreadOverview);
    rootStore.threadStore.joinChatThread(chatThreadId);
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: combinedMessage,
      info: combinedMessage.chatThreadOverview as any,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(chatThreadId);
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(getMessageId(combinedMessage));
  };

  return (
    <>
      {!onlyContent ? (
        <BaseMessage
          id={getMessageId(combinedMessage)}
          message={combinedMessage}
          direction={bySelf ? 'rtl' : 'ltr'}
          time={messageTime}
          nickName={nickName}
          bubbleType={type}
          className={bubbleClass}
          onReplyMessage={handleReplyMsg}
          onDeleteMessage={handleDeleteMsg}
          repliedMessage={repliedMsg}
          reactionData={reactions}
          onAddReactionEmoji={handleClickEmoji}
          onDeleteReactionEmoji={handleDeleteEmoji}
          onShowReactionUserList={handleShowReactionUserList}
          onRecallMessage={handleRecallMessage}
          renderUserProfile={renderUserProfile}
          //   onTranslateMessage={handleTranslateMessage}

          onSelectMessage={handleSelectMessage}
          onResendMessage={handleResendMessage}
          select={select}
          onMessageCheckChange={handleMsgCheckChange}
          onCreateThread={handleCreateThread}
          thread={_thread}
          chatThreadOverview={combinedMessage.chatThreadOverview}
          onClickThreadTitle={handleClickThreadTitle}
          onPinMessage={handlePinMessage}
          {...others}
        >
          <div className={classString} style={style}>
            <div className={`${prefixCls}-title`} onClick={showCombinedMsgs}>
              <Icon className={`${prefixCls}-icon`} type="TIME" width={20} height={20}></Icon>
              <p>{title}</p>
              {showSummary && (
                <Icon
                  className={`${prefixCls}-icon`}
                  type="ARROW_RIGHT"
                  width={20}
                  height={20}
                ></Icon>
              )}
            </div>
            {showSummary && (
              <>
                <span className={`${prefixCls}-line`}></span>
                <div className={`${prefixCls}-content`}>{summary}</div>
              </>
            )}
          </div>
        </BaseMessage>
      ) : (
        <div className={classString} style={style}>
          <div className={`${prefixCls}-title`} onClick={showCombinedMsgs}>
            <Icon className={`${prefixCls}-icon`} type="TIME" width={20} height={20}></Icon>
            <p>{title}</p>
            {showSummary && (
              <Icon
                className={`${prefixCls}-icon`}
                type="ARROW_RIGHT"
                width={20}
                height={20}
              ></Icon>
            )}
          </div>
          {showSummary && (
            <>
              <span className={`${prefixCls}-line`}></span>
              <div className={`${prefixCls}-content`}>{summary}</div>
            </>
          )}
        </div>
      )}
      <Modal
        open={modalOpen}
        title={t('chatHistory')}
        footer=""
        onCancel={() => {
          setModalOpen(false);
        }}
      >
        <div className={`${prefixCls}-detail`}>{detailContent}</div>
      </Modal>
    </>
  );
};
const CombinedMessageOut = observer(CombinedMessage);
CombinedMessageOut.displayName = 'CombinedMessage';
export default CombinedMessageOut;
