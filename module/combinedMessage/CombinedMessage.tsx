import React, { ReactNode, useState, useContext } from 'react';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { AgoraChat } from 'agora-chat';
import rootStore from '../store/index';
import { getCvsIdFromMessage } from '../utils';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Modal from '../../component/modal';
import TextMessage from '../textMessage';
import ImageMessage from '../imageMessage';
import FileMessage from '../fileMessage';
import AudioMessage from '../audioMessage';
import { observer } from 'mobx-react-lite';
import Loading from '../../component/loading';
import { useTranslation } from 'react-i18next';
import { RootContext } from '../store/rootContext';
export interface CombinedMessageProps extends BaseMessageProps {
  prefix?: string;
  className?: string;
  // @ts-ignore
  combinedMessage: AgoraChat.CombineMsgBody;
  style?: React.CSSProperties;
  nickName?: string;
  type?: 'primary' | 'secondly';
  bubbleClass?: string;
  // @ts-ignore
  onShowDetail?: (msg: AgoraChat.CombineMsgBody) => void;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  showSummary?: boolean; // whether show summary
  onlyContent?: boolean; // only show message content
}

const CombinedMessage = (props: CombinedMessageProps) => {
  let {
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
    ...others
  } = props;
  //   combinedMessage = comMsg;
  let { bySelf, time, from, reactions, title, summary } = combinedMessage;

  if (typeof bySelf == 'undefined') {
    bySelf = from == rootStore.client.context.userId;
  }
  let type = props.type;
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { onError } = context;
  const handleReplyMsg = () => {
    // TODO: reply message add combine type
    rootStore.messageStore.setRepliedMessage(combinedMessage);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: combinedMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      combinedMessage.mid || combinedMessage.id,
    );
  };

  let repliedMsg: undefined | AgoraChat.MessageBody;
  if (combinedMessage.ext?.msgQuote) {
    repliedMsg = combinedMessage;
  }

  const handleClickEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.addReaction(
      {
        chatType: combinedMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      combinedMessage.mid || combinedMessage.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: combinedMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      combinedMessage.mid || combinedMessage.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(combinedMessage);
    reactions?.forEach(
      (item: { reaction: string; count: number; userList: string[]; isAddedBySelf: boolean }) => {
        if (item.reaction === emojiString) {
          if (item.count > 3 && item.userList.length <= 3) {
            rootStore.messageStore.getReactionUserList(
              {
                chatType: combinedMessage.chatType,
                conversationId: conversationId,
              },
              // @ts-ignore
              combinedMessage.mid || combinedMessage.id,
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
      },
    );
  };

  const handleRecallMessage = () => {
    let conversationId = getCvsIdFromMessage(combinedMessage);
    rootStore.messageStore
      .recallMessage(
        {
          chatType: combinedMessage.chatType,
          conversationId: conversationId,
        },
        // @ts-ignore
        combinedMessage.mid || combinedMessage.id,
        combinedMessage.isChatThread,
      )
      ?.catch(err => {
        onError?.(err);
      });
  };
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-combine', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-secondly`]: type == 'secondly',
      [`${prefixCls}-primary`]: type == 'primary',
    },
    className,
  );

  const [detailContent, setDetailContent] = useState<ReactNode>(
    <Loading size={48} visible={true} />,
  );

  const createDetailContent = (data: AgoraChat.MessageType[]) => {
    let node = data.map(msg => {
      let content;

      switch (msg?.type) {
        case 'txt':
          content = (
            <TextMessage
              select={false}
              customAction={{ visible: false }}
              reaction={false}
              key={msg.id}
              bubbleType="none"
              textMessage={msg}
              direction="ltr"
              thread={false}
              renderUserProfile={renderUserProfile}
            />
          );
          break;
        case 'img':
          content = (
            <ImageMessage
              select={false}
              imageMessage={msg}
              direction="ltr"
              key={msg.id}
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
            />
          );
          break;
        case 'file':
          content = (
            <FileMessage
              select={false}
              key={msg.id}
              fileMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
            />
          );
          break;
        case 'audio':
          content = (
            <AudioMessage
              select={false}
              key={msg.id}
              audioMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
            />
          );
          break;
        case 'combine':
          content = (
            <CombinedMessage
              select={false}
              key={msg.id}
              combinedMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
              thread={false}
              renderUserProfile={renderUserProfile}
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
    setModalOpen(true);
    if (combinedMessage.messages) {
      createDetailContent(combinedMessage.messages);
      return;
    }
    rootStore.client
      .downloadAndParseCombineMessage({
        url: combinedMessage.url,
        secret: combinedMessage.secret,
      })
      .then((data: AgoraChat.MessageType[]) => {
        combinedMessage.messages = data;
        createDetailContent(data);
      })
      .catch(() => {
        setDetailContent(<div>download message failed</div>);
      });
  };
  const [modalOpen, setModalOpen] = useState(false);

  let conversationId = getCvsIdFromMessage(combinedMessage);
  const handleSelectMessage = () => {
    const selectable =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[combinedMessage.chatType][conversationId]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: combinedMessage.chatType,
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
    rootStore.messageStore.selectedMessage[combinedMessage.chatType][conversationId]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      // @ts-ignore
      rootStore.messageStore.selectedMessage[combinedMessage.chatType][conversationId]
        ?.selectedMessage;

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
        chatType: combinedMessage.chatType,
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
    combinedMessage.chatType == 'groupChat' &&
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
    rootStore.threadStore.joinChatThread(combinedMessage.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: combinedMessage,
      info: combinedMessage.chatThreadOverview as unknown as AgoraChat.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(combinedMessage?.chatThreadOverview?.id || '');
  };

  return (
    <>
      {!onlyContent ? (
        <BaseMessage
          id={combinedMessage.id}
          message={combinedMessage}
          direction={bySelf ? 'rtl' : 'ltr'}
          time={time}
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

export default observer(CombinedMessage);
