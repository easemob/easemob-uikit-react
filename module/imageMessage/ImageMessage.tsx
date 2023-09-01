import React, { useRef, useState, memo, useEffect, useContext } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { ImageMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import Mask from '../../component/modal/Mast';
import Modal from '../../component/modal';
import rootStore from '../store/index';
import { getCvsIdFromMessage } from '../utils';
import { observer } from 'mobx-react-lite';
import { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
export interface ImageMessageProps extends BaseMessageProps {
  imageMessage: ImageMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  onClickImage?: (url: string) => void;
  nickName?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
}

let ImageMessage = (props: ImageMessageProps) => {
  const {
    imageMessage: message,
    shape,
    style,
    onClickImage,
    renderUserProfile,
    thread,
    nickName,
    ...others
  } = props;

  let { bySelf, from, reactions } = message;
  const [previewImageUrl, setPreviewImageUrl] = useState(message?.file?.url || message.thumb);
  const [previewVisible, setPreviewVisible] = useState(false);
  const context = useContext(RootContext);
  const { onError } = context;

  const canvasDataURL = (path: string, obj: { quality: number }, callback?: () => void) => {
    var img = new Image();
    img.src = path;
    img.setAttribute('crossOrigin', 'Anonymous');
    img.onload = function () {
      var that: HTMLImageElement = this as any as HTMLImageElement;
      // 默认按比例压缩
      var w = that.width,
        h = that.height,
        scale = w / h;
      // w = obj.width || w;
      // h = obj.height || w / scale;
      var quality = 1; // 默认图片质量为0.7
      //生成canvas
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      // 创建属性节点
      var anw = document.createAttribute('width');
      anw.nodeValue = w.toString();
      var anh = document.createAttribute('height');
      anh.nodeValue = h.toString();
      canvas.setAttributeNode(anw);
      canvas.setAttributeNode(anh);
      ctx!.drawImage(that, 0, 0, w, h);
      // 图像质量
      if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
        quality = obj.quality;
      }
      // quality值越小，所绘制出的图像越模糊
      var base64 = canvas.toDataURL('image/jpeg', quality);
      setPreviewImageUrl(base64);
      // setBigImgUrl(base64);
      // setLoadingFlag(false);
      // 回调函数返回base64的值
      // callback(base64);
    };
  };
  const handleClickImg = (url: string) => {
    setPreviewVisible(true);
    canvasDataURL(url, { quality: 1 });
    onClickImage?.(url);
  };

  let renderImgUrl = bySelf ? message?.file?.url : (message.thumb as string);

  const img = useRef(
    <img
      // width={75}
      // height={75}
      src={renderImgUrl}
      alt={message.file?.filename}
      onClick={() => handleClickImg(message.url || renderImgUrl)}
    />,
  );
  if (typeof bySelf == 'undefined') {
    bySelf = message.from === rootStore.client.context.userId;
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(message);
  };

  const handleDeleteMsg = () => {
    let conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.deleteMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
    );
  };

  const handleClickEmoji = (emojiString: string) => {
    console.log('添加Reaction', emojiString);
    let conversationId = getCvsIdFromMessage(message);

    rootStore.messageStore.addReaction(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.deleteReaction(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    let conversationId = getCvsIdFromMessage(message);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: message.chatType,
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
    let conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore
      .recallMessage(
        {
          chatType: message.chatType,
          conversationId: conversationId,
        },
        // @ts-ignore
        message.mid || message.id,
        message.isChatThread,
      )
      ?.catch(err => {
        onError?.(err);
      });
  };

  let conversationId = getCvsIdFromMessage(message);
  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[message.chatType][conversationId]?.selectable;
    if (selectable) return; // has shown checkbox

    rootStore.messageStore.setSelectedMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: [],
      },
    );
    console.log('设置', rootStore.messageStore);
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(message);
  };

  const select =
    rootStore.messageStore.selectedMessage[message.chatType][conversationId]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[message.chatType][conversationId]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(message);
    } else {
      changedList = checkedMessages.filter(item => {
        // @ts-ignore
        return !(item.id == message.id || item.mid == message.id);
      });
    }
    rootStore.messageStore.setSelectedMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      {
        selectable: true,
        selectedMessage: changedList,
      },
    );
    console.log('设置', rootStore.messageStore);
  };

  // @ts-ignore
  let _thread =
    // @ts-ignore
    message.chatType == 'groupChat' &&
    thread &&
    // @ts-ignore
    !message.chatThread &&
    !message.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: message,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    rootStore.threadStore.joinChatThread(message.chatThreadOverview?.id || '');
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: message,
      info: message.chatThreadOverview as unknown as AgoraChat.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(message?.chatThreadOverview?.id || '');
  };

  return (
    <div style={style}>
      <BaseMessage
        id={message.id}
        message={message}
        // bubbleType="none"
        direction={bySelf ? 'rtl' : 'ltr'}
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
        select={select}
        onMessageCheckChange={handleMsgCheckChange}
        renderUserProfile={renderUserProfile}
        onCreateThread={handleCreateThread}
        thread={_thread}
        chatThreadOverview={message.chatThreadOverview}
        onClickThreadTitle={handleClickThreadTitle}
        bubbleStyle={{ padding: '0' }}
        {...others}
      >
        <div className="message-image-content">{img.current}</div>
      </BaseMessage>
      {previewVisible && (
        <ImagePreview
          visible={previewVisible}
          previewImageUrl={message.url}
          onCancel={() => {
            setPreviewVisible(false);
          }}
        ></ImagePreview>
      )}
    </div>
  );
};

export interface ImagePreviewProps {
  visible: boolean;
  previewImageUrl: string;
  alt?: string;
  onCancel?: () => void;
}
export const ImagePreview = (props: ImagePreviewProps) => {
  const { visible, previewImageUrl, alt, onCancel } = props;

  return (
    <>
      <Mask prefixCls="" visible={true}></Mask>
      <Modal
        open={visible}
        closable={true}
        footer=""
        wrapClassName="message-image-preview-wrap"
        width="70%"
        style={{ overflow: 'hidden', height: '70%' }}
        maskClosable={true}
        onCancel={() => {
          onCancel?.();
        }}
      >
        <img
          className="message-image-big"
          src={previewImageUrl}
          alt={alt}
          // onClick={() => handleClickImg(message?.file?.url)}
        />
      </Modal>
    </>
  );
};

export default observer(ImageMessage);
