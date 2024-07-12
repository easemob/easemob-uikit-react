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
import { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import defaultImg from '../assets/img_xmark.png';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface ImageMessageProps extends BaseMessageProps {
  imageMessage: ImageMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  bubbleClass?: string;
  type?: 'primary' | 'secondly';
  onClickImage?: (url: string) => void;
  nickName?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

const ImageMessage = (props: ImageMessageProps) => {
  const {
    imageMessage: message,
    style,
    onClickImage,
    renderUserProfile,
    thread,
    nickName,
    className,
    shape,
    prefix,
    bubbleClass,
    imgProps,
    ...others
  } = props;
  let type = props.type;
  let { bySelf, from, reactions, status } = message;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-img', prefix);
  const context = useContext(RootContext);
  const conversationId = getCvsIdFromMessage(message);
  const { theme } = context;
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType: message.chatType as any,
    },
  });
  let bubbleShape = shape;
  if (theme?.bubbleShape) {
    bubbleShape = theme?.bubbleShape;
  }

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${bubbleShape}`]: !!bubbleShape,
    },
    className,
  );

  const [previewImageUrl, setPreviewImageUrl] = useState(
    message.url || message?.file?.url || message.thumb,
  );
  const [previewVisible, setPreviewVisible] = useState(false);

  const canvasDataURL = (path: string, obj: { quality: number }, callback?: () => void) => {
    const img = new Image();
    img.src = path;
    img.setAttribute('crossOrigin', 'Anonymous');
    img.onload = function () {
      const that: HTMLImageElement = this as any as HTMLImageElement;
      // 默认按比例压缩
      const w = that.width,
        h = that.height,
        scale = w / h;
      // w = obj.width || w;
      // h = obj.height || w / scale;
      let quality = 1; // 默认图片质量为0.7
      //生成canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // 创建属性节点
      const anw = document.createAttribute('width');
      anw.nodeValue = w.toString();
      const anh = document.createAttribute('height');
      anh.nodeValue = h.toString();
      canvas.setAttributeNode(anw);
      canvas.setAttributeNode(anh);
      ctx!.drawImage(that, 0, 0, w, h);
      // 图像质量
      if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
        quality = obj.quality;
      }
      // quality值越小，所绘制出的图像越模糊
      const base64 = canvas.toDataURL('image/jpeg', quality);
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
  const renderImgUrl = bySelf ? message.url || message?.file?.url : (message.thumb as string);

  const [imgUrl, setImgUrl] = useState(renderImgUrl);
  // const img = useRef(
  //   <img
  //     // width={75}
  //     // height={75}
  //     onError={e => {
  //       img.current.src = 'https://img.yzcdn.cn/vant/cat.jpeg';
  //       setImgUrl('https://img.yzcdn.cn/vant/cat.jpeg');
  //     }}
  //     src={imgUrl}
  //     alt={message.file?.filename}
  //     onClick={() => handleClickImg(message.url || renderImgUrl)}
  //   />,
  // );
  if (typeof bySelf == 'undefined') {
    bySelf = message.from === rootStore.client.context.userId;
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(message);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.deleteMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
    );
  };

  const handlePinMessage = () => {
    //@ts-ignore
    pinMessage(message.mid || message.id);
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(message);

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
    const conversationId = getCvsIdFromMessage(message);
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
    const conversationId = getCvsIdFromMessage(message);
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
    const conversationId = getCvsIdFromMessage(message);
    rootStore.messageStore.recallMessage(
      {
        chatType: message.chatType,
        conversationId: conversationId,
      },
      // @ts-ignore
      message.mid || message.id,
      message.isChatThread,
      true,
    );
  };

  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
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
  };

  const handleResendMessage = () => {
    rootStore.messageStore.sendMessage(message);
  };

  const select =
    rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[message.chatType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

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
  };

  // @ts-ignore
  const _thread =
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
      info: message.chatThreadOverview as unknown as ChatSDK.ThreadChangeInfo,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(message?.chatThreadOverview?.id || '');
  };
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }

  // const classSting = classNames('message-image-content', className);
  const imgRef = useRef<HTMLImageElement>(null);
  return (
    <div>
      <BaseMessage
        id={message.id}
        className={bubbleClass}
        message={message}
        time={message.time}
        bubbleType={type}
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
        onPinMessage={handlePinMessage}
        select={select}
        onMessageCheckChange={handleMsgCheckChange}
        renderUserProfile={renderUserProfile}
        onCreateThread={handleCreateThread}
        thread={_thread}
        chatThreadOverview={message.chatThreadOverview}
        onClickThreadTitle={handleClickThreadTitle}
        bubbleStyle={{
          padding: 0,
          background: message.chatThreadOverview ? undefined : 'transparent',
        }}
        shape={shape}
        status={status}
        {...others}
      >
        <div className={classString} style={style}>
          {/* {img.current} */}
          <img
            ref={imgRef}
            // width={75}
            // height={75}
            onError={function () {
              //@ts-ignore
              setImgUrl(defaultImg);
              if (imgRef.current) {
                imgRef.current.style.padding = '22px 34px';
                imgRef.current.style.border = '1px solid #e5e5e5';
                imgRef.current.style.backgroundColor = '#E3E6E8';
              }
            }}
            src={imgUrl}
            alt={message.file?.filename}
            onClick={() => handleClickImg(message.url || renderImgUrl)}
            {...imgProps}
          />
        </div>
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
