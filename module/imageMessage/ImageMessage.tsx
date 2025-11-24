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
// @ts-ignore - react-photo-view 需要先安装: pnpm install react-photo-view
import { PhotoSlider } from 'react-photo-view';
// @ts-ignore
import 'react-photo-view/dist/react-photo-view.css';
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
  /** 自定义图片预览组件，用于替换默认的预览弹窗 */
  renderImagePreview?: (props: {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
    message: ImageMessageType;
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
      conversationType: message.chatType,
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
    if (onClick) {
      const preventDefault = onClick(message);
      if (preventDefault === true) return;
    }
    setPreviewVisible(true);
    canvasDataURL(url, { quality: 1 });
    onClickImage?.(url);
  };
  const renderImgUrl = bySelf
    ? message.url || message?.file?.url
    : (message.thumb as string) || message.url;

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
  let msgHeight = message.height;
  if (message.width && message.height && message.width > 300) {
    msgHeight = (message.height * 300) / message.width;
  }
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
            width={message.width == 0 ? '' : message.width}
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
            alt={message.file?.filename}
            onClick={() => handleClickImg(message.url || renderImgUrl)}
            crossOrigin="anonymous"
            {...imgProps}
          />
        </div>
      </BaseMessage>
      {renderImagePreview
        ? renderImagePreview({
            visible: previewVisible,
            imageUrl: message.url || previewImageUrl || '',
            onClose: () => setPreviewVisible(false),
            message: message,
          })
        : previewVisible && (
            <ImagePreview
              visible={previewVisible}
              previewImageUrl={message.url || ''}
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
