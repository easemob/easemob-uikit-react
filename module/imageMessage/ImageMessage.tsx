import React, { useRef, useState, memo, useEffect } from 'react';
import classNames from 'classnames';
import BaseMessage, { BaseMessageProps } from '../baseMessage';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import type { ImageMessageType } from '../types/messageType';
import Avatar from '../../src/avatar';
import Mask from '../../src/modal/Mast';
import Modal from '../../src/modal';
import rootStore from '../store/index';
export interface ImageMessageProps extends BaseMessageProps {
  imageMessage: ImageMessageType; // 从SDK收到的文件消息
  prefix?: string;
  style?: React.CSSProperties;
  onClickImage?: (url: string) => void;
}

let ImageMessage = (props: ImageMessageProps) => {
  const { imageMessage: message, shape, style, onClickImage } = props;

  let { bySelf, from } = message;
  const [previewImageUrl, setPreviewImageUrl] = useState(message.file.url || message.thumb);
  const [previewVisible, setPreviewVisible] = useState(false);
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

  let renderImgUrl = bySelf ? message.file.url : (message.thumb as string);

  const img = useRef(
    <img
      width={75}
      height={75}
      src={renderImgUrl}
      alt={message.file?.filename}
      onClick={() => handleClickImg(message.url || renderImgUrl)}
    />,
  );
  if (typeof bySelf == 'undefined') {
    bySelf = message.from === rootStore.client.context.userId;
  }
  return (
    <div style={style}>
      <BaseMessage bubbleType="none" direction={bySelf ? 'rtl' : 'ltr'} nickName={from}>
        <div className="message-image-content">{img.current}</div>
      </BaseMessage>
      {/* <Mask prefixCls="" visible={true}></Mask>
			<Modal
				open={previewVisible}
				closable={true}
				footer=""
				wrapClassName="message-image-preview-wrap"
				width="70%"
				style={{ overflow: 'hidden', height: '70%' }}
				maskClosable={true}
				onCancel={() => setPreviewVisible(false)}
			>
				<img
					className="message-image-big"
					src={previewImageUrl}
					alt={message.file.filename}
					// onClick={() => handleClickImg(message.file.url)}
				/>
			</Modal> */}
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
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    setPreviewVisible(visible);
  }, [visible]);

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
          // onClick={() => handleClickImg(message.file.url)}
        />
      </Modal>
    </>
  );
};
export default memo(ImageMessage);
