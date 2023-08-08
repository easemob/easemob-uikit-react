import React, { ReactNode, useState } from 'react';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
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
}

const comMsg = {
  id: '1174219449960499156',
  type: 'combine',
  chatType: 'singleChat',
  to: 'zd5',
  from: 'wy1',
  ext: {},
  time: 1690959070333,
  onlineState: 3,
  title: '聊天记录',
  summary: 'zd5: asd\nzd2: 123123\nzd2: hello\n',
  url: 'http://a41-cn.easemob.com/41117440/383391/chatfiles/9a9dfad0-3293-11ee-a1e2-db9c4d0f779d?em-redirect=true&share-secret=mp4h4DKTEe67L5_Rd94q0LWToKOcGbHs9xUX08eDSrLEivgt',
  secret: 'mp4h4DKTEe67L5_Rd94q0LWToKOcGbHs9xUX08eDSrLEivgt',
  file_length: 189,
  filename: '426005469894',
  compatibleText: '版本过低',
  combineLevel: 0,
  bySelf: false,
};
const CombinedMessage = (props: CombinedMessageProps) => {
  let {
    combinedMessage,
    style,
    nickName,
    bubbleClass,
    prefix: customizePrefixCls,
    className,
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
  const handleReplyMsg = () => {
    // TODO: reply message add combine type
    rootStore.messageStore.setRepliedMessage(combinedMessage);
  };

  const handleDeleteMsg = () => {
    rootStore.messageStore.deleteMessage(
      {
        chatType: combinedMessage.chatType,
        conversationId: combinedMessage.to,
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
    console.log('添加Reaction', emojiString);
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
    rootStore.messageStore.recallMessage(
      {
        chatType: combinedMessage.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      combinedMessage.mid || combinedMessage.id,
    );
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

      switch (msg.type) {
        case 'txt':
          content = (
            <TextMessage
              customAction={{ visible: false }}
              reaction={false}
              key={msg.id}
              bubbleType="none"
              textMessage={msg}
              direction="ltr"
            />
          );
          break;
        case 'img':
          content = (
            <ImageMessage
              imageMessage={msg}
              direction="ltr"
              key={msg.id}
              reaction={false}
              customAction={{ visible: false }}
            />
          );
          break;
        case 'file':
          content = (
            <FileMessage
              key={msg.id}
              fileMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
            />
          );
          break;
        case 'audio':
          content = (
            <AudioMessage
              key={msg.id}
              audioMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
            />
          );
          break;
        case 'combine':
          content = (
            <CombinedMessage
              key={msg.id}
              combinedMessage={msg}
              direction="ltr"
              type="secondly"
              reaction={false}
              customAction={{ visible: false }}
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
    console.log('combinedMessage ---', combinedMessage);
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
        console.log(data);
        combinedMessage.messages = data;
        createDetailContent(data);
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
    console.log('设置', rootStore.messageStore);
  };

  console.log('*****', combinedMessage);
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
    console.log('设置', rootStore.messageStore);
  };
  return (
    <>
      <BaseMessage
        id={combinedMessage.id}
        message={combinedMessage}
        direction={bySelf ? 'rtl' : 'ltr'}
        style={style}
        time={time}
        nickName={nickName || from}
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
        //   onTranslateMessage={handleTranslateMessage}

        onSelectMessage={handleSelectMessage}
        select={select}
        onMessageCheckChange={handleMsgCheckChange}
        {...others}
      >
        <div className={classString}>
          <div className={`${prefixCls}-title`} onClick={showCombinedMsgs}>
            <Icon className={`${prefixCls}-icon`} type="TIME" width={20} height={20}></Icon>
            <p>{title}</p>
            <Icon className={`${prefixCls}-icon`} type="ARROW_RIGHT" width={20} height={20}></Icon>
          </div>
          <span className={`${prefixCls}-line`}></span>
          <div className={`${prefixCls}-content`}>{summary}</div>
        </div>
      </BaseMessage>
      <Modal
        open={modalOpen}
        title={t('module.chatHistory')}
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
