import React, { useRef, useState, memo, useEffect, useContext, useCallback } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps, renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { ImageMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import Mask from '../../component/modal/Mast';
import Modal from '../../component/modal';
import rootStore from '../store/index';
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getMessageChatType,
  getMessageId,
  getMessageTime,
  getThreadId,
} from '../utils';
import { observer } from 'mobx-react-lite';
import type { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import defaultImg from '../assets/img_xmark.png';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import { getCachedImageUrl, fetchAndCacheImage } from './imageCache';
// @ts-ignore - react-photo-view 需要先安装: pnpm install react-photo-view
import { PhotoSlider } from 'react-photo-view';
// @ts-ignore
import 'react-photo-view/dist/react-photo-view.css';
export interface ImageMessageProps extends BaseMessageProps {
  imageMessage: ImageMessageType | ChatSDK.Message; // 从SDK收到的图片消息
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  bubbleClass?: string;
  type?: 'primary' | 'secondly';
  onClickImage?: (url: string) => void;
  nickName?: string;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
  /** 自定义图片预览组件，用于替换默认的预览弹窗 */
  renderImagePreview?: (props: {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
    message: ChatSDK.Message;
  }) => React.ReactNode;
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
    onClick,
    renderImagePreview,
    ...others
  } = props;
  const sdkMessage = message as ChatSDK.Message;
  const uiMessage = message as ImageMessageType & Record<string, any>;
  const body = sdkMessage.body as Record<string, any>;
  const conversationType = getMessageChatType(sdkMessage);
  if (!conversationType) return null;
  const messageId = getMessageId(sdkMessage);
  const messageTime = getMessageTime(sdkMessage);
  const originalImageUrl =
    body.originalImageUrl ||
    body.bigImageUrl ||
    body.url ||
    uiMessage.url ||
    uiMessage.file?.url ||
    body.localUrl ||
    '';
  const thumbnailUrl = body.thumbnailUrl || uiMessage.thumb || originalImageUrl;
  const imageWidth = body.width ?? uiMessage.width ?? 0;
  const imageHeight = body.height ?? uiMessage.height ?? 0;
  const filename = body.filename || uiMessage.file?.filename || '';
  let type = props.type;
  let { bySelf, from, reactions, status } = uiMessage;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-img', prefix);
  const context = useContext(RootContext);
  const conversationId = getCvsIdFromMessage(sdkMessage);
  const { theme } = context;
  const { pinMessage } = usePinnedMessage({
    conversation: {
      conversationId: conversationId,
      conversationType,
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

  const [previewImageUrl, setPreviewImageUrl] = useState(originalImageUrl || thumbnailUrl);
  const [previewVisible, setPreviewVisible] = useState(false);

  const canvasDataURL = (path: string, obj: { quality: number }, callback?: () => void) => {
    const img = new Image();
    img.src = getCachedImageUrl(path) || path;
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
    if (onClick) {
      const preventDefault = onClick(sdkMessage);
      if (preventDefault === true) return;
    }
    setPreviewVisible(true);
    canvasDataURL(url, { quality: 1 });
    onClickImage?.(url);
  };
  const renderImgUrl = bySelf ? originalImageUrl || thumbnailUrl : thumbnailUrl || originalImageUrl;

  const [imgUrl, setImgUrl] = useState(getCachedImageUrl(renderImgUrl) || renderImgUrl);

  useEffect(() => {
    if (!renderImgUrl) return;
    const cached = getCachedImageUrl(renderImgUrl);
    if (cached) {
      setImgUrl(cached);
      return;
    }
    let cancelled = false;
    fetchAndCacheImage(renderImgUrl)
      .then(blobUrl => {
        if (!cancelled) setImgUrl(blobUrl);
      })
      .catch(() => {
        // fetch 失败时保留原始 URL，让浏览器正常加载
      });
    return () => {
      cancelled = true;
    };
  }, [renderImgUrl]);
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
    bySelf = sdkMessage.from === getCurrentUserId(rootStore.client);
  }

  const handleReplyMsg = () => {
    rootStore.messageStore.setRepliedMessage(sdkMessage);
  };

  const handleDeleteMsg = () => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.deleteMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
    );
  };

  const handlePinMessage = () => {
    pinMessage(messageId);
  };

  const handleClickEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);

    rootStore.messageStore.addReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };

  const handleDeleteEmoji = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.deleteReaction(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      emojiString,
    );
  };

  const handleShowReactionUserList = (emojiString: string) => {
    const conversationId = getCvsIdFromMessage(sdkMessage);
    reactions?.forEach(item => {
      if (item.reaction === emojiString) {
        if (item.count > 3 && item.userList.length <= 3) {
          rootStore.messageStore.getReactionUserList(
            {
              chatType: conversationType,
              conversationId: conversationId,
            },
            messageId,
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
    const conversationId = getCvsIdFromMessage(sdkMessage);
    rootStore.messageStore.recallMessage(
      {
        chatType: conversationType,
        conversationId: conversationId,
      },
      messageId,
      uiMessage.isChatThread,
      true,
    );
  };

  const handleSelectMessage = () => {
    const selectable =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectable;
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
    rootStore.messageStore.sendMessage(sdkMessage);
  };

  const select =
    rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
      conversationId
    ]?.selectable;

  const handleMsgCheckChange = (checked: boolean) => {
    const checkedMessages =
      rootStore.messageStore.selectedMessage[conversationType as 'singleChat' | 'groupChat'][
        conversationId
      ]?.selectedMessage;

    let changedList = checkedMessages;
    if (checked) {
      changedList.push(sdkMessage);
    } else {
      changedList = checkedMessages.filter(item => {
        return getMessageId(item) !== messageId;
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

  const _thread =
    conversationType == 'groupChat' && thread && !uiMessage.chatThread && !uiMessage.isChatThread;

  // open thread panel to create thread
  const handleCreateThread = () => {
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: true,
      originalMessage: sdkMessage,
    });
    rootStore.threadStore.setThreadVisible(true);
  };

  // join the thread
  const handleClickThreadTitle = () => {
    const chatThreadId = getThreadId(uiMessage.chatThreadOverview);
    rootStore.threadStore.joinChatThread(chatThreadId);
    rootStore.threadStore.setCurrentThread({
      visible: true,
      creating: false,
      originalMessage: sdkMessage,
      info: uiMessage.chatThreadOverview as any,
    });
    rootStore.threadStore.setThreadVisible(true);

    rootStore.threadStore.getChatThreadDetail(chatThreadId);
  };
  if (!type) {
    type = bySelf ? 'primary' : 'secondly';
  }

  // const classSting = classNames('message-image-content', className);
  const imgRef = useRef<HTMLImageElement>(null);
  let msgHeight = imageHeight;
  if (imageWidth && imageHeight && imageWidth > 300) {
    msgHeight = (imageHeight * 300) / imageWidth;
  }
  return (
    <div>
      <BaseMessage
        id={messageId}
        className={bubbleClass}
        message={sdkMessage}
        time={messageTime}
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
        chatThreadOverview={uiMessage.chatThreadOverview as any}
        onClickThreadTitle={handleClickThreadTitle}
        bubbleStyle={{
          padding: 0,
          background: uiMessage.chatThreadOverview ? undefined : 'transparent',
        }}
        shape={shape}
        status={status}
        {...others}
      >
        <div className={classString} style={style}>
          {/* {img.current} */}
          <img
            ref={imgRef}
            width={imageWidth == 0 ? '' : imageWidth}
            height={msgHeight == 0 ? '' : msgHeight}
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
            alt={filename}
            onClick={() => handleClickImg(originalImageUrl || renderImgUrl)}
            {...imgProps}
          />
        </div>
      </BaseMessage>
      {renderImagePreview
        ? renderImagePreview({
            visible: previewVisible,
            imageUrl: originalImageUrl || previewImageUrl || '',
            onClose: () => setPreviewVisible(false),
            message: sdkMessage,
          })
        : previewVisible && (
            <ImagePreview
              visible={previewVisible}
              previewImageUrl={originalImageUrl || ''}
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
    // @ts-ignore - PhotoSlider 来自 react-photo-view
    <PhotoSlider
      images={[{ src: previewImageUrl, key: previewImageUrl }]}
      visible={visible}
      onClose={() => onCancel?.()}
      index={0}
      loop={false}
      // 自定义工具栏，添加放大、缩小、旋转功能
      toolbarRender={({ onScale, scale, rotate, onRotate }: any) => {
        return (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* 放大按钮 */}
            <button onClick={() => onScale(scale + 0.5)} style={toolbarButtonStyle} title="放大">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
              </svg>
            </button>

            {/* 缩小按钮 */}
            <button onClick={() => onScale(scale - 0.5)} style={toolbarButtonStyle} title="缩小">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                <path d="M7 9h5v1H7z" />
              </svg>
            </button>

            {/* 旋转按钮 */}
            <button onClick={() => onRotate(rotate + 90)} style={toolbarButtonStyle} title="旋转">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z" />
              </svg>
            </button>

            {/* 显示当前缩放比例 */}
            <span
              style={{
                color: 'white',
                fontSize: '14px',
                minWidth: '60px',
                textAlign: 'center',
              }}
            >
              {Math.round(scale * 100)}%
            </span>
          </div>
        );
      }}
    />
  );
};

// 工具栏按钮样式
const toolbarButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  outline: 'none',
};

export default observer(ImageMessage);
