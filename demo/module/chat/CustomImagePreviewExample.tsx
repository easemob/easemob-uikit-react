/**
 * 自定义图片预览组件示例
 * 
 * 演示如何使用 renderImagePreview 替换默认的图片预览组件
 * 支持放大、缩小、旋转等功能
 */

import React, { useState } from 'react';
import { MessageList } from '../../../module/chat/MessageList';
import { ImageMessageType } from '../../../module/types/messageType';

// ===========================
// 示例 1: 使用第三方图片预览库（推荐）
// ===========================

// 假设使用 react-image-viewer 或类似的库
// npm install react-image-viewer --save

// 简化版的图片查看器组件（实际项目中建议使用成熟的第三方库）
const AdvancedImageViewer: React.FC<{
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}> = ({ visible, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!visible) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      {/* 工具栏 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 10000,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={handleZoomIn} style={buttonStyle}>
          放大 +
        </button>
        <button onClick={handleZoomOut} style={buttonStyle}>
          缩小 -
        </button>
        <button onClick={handleRotate} style={buttonStyle}>
          旋转 ↻
        </button>
        <button onClick={handleReset} style={buttonStyle}>
          重置
        </button>
        <button onClick={onClose} style={buttonStyle}>
          关闭 ✕
        </button>
      </div>

      {/* 图片显示区域 */}
      <div
        style={{
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="preview"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          crossOrigin="anonymous"
        />
      </div>

      {/* 显示当前缩放比例 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '8px 16px',
          borderRadius: '4px',
        }}
      >
        缩放: {(scale * 100).toFixed(0)}% | 旋转: {rotation}°
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.9)',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#333',
};

// 使用自定义预览组件
export function CustomImagePreviewExample1() {
  return (
    <MessageList
      customRenderers={{
        img: ctx => {
          const message = ctx.message as ImageMessageType;
          return (
            <div>
              {/* 使用自定义的图片预览组件 */}
              <img
                src={message.url || message.thumb}
                alt="message"
                style={{ maxWidth: '300px', cursor: 'pointer' }}
              />
            </div>
          );
        },
      }}
      messageProps={{
        // 注意：需要在外层传入 renderImagePreview
        // 但是当前的 customRenderers 不支持直接传递
        // 所以我们需要另一种方式
      }}
    />
  );
}

// ===========================
// 示例 2: 通过 Chat 组件传递自定义预览
// ===========================

import Chat from '../../../module/chat/Chat';

export function CustomImagePreviewExample2() {
  return (
    <Chat
      messageProps={{
        // 为所有图片消息提供自定义预览组件
        renderImagePreview: ({ visible, imageUrl, onClose, message }) => {
          return (
            <AdvancedImageViewer
              visible={visible}
              imageUrl={imageUrl}
              onClose={onClose}
            />
          );
        },
      }}
    />
  );
}

// ===========================
// 示例 3: 使用第三方库 (react-image-lightbox)
// ===========================

// npm install react-image-lightbox --save
// import Lightbox from 'react-image-lightbox';
// import 'react-image-lightbox/style.css';

/*
export function CustomImagePreviewExample3() {
  return (
    <Chat
      messageProps={{
        renderImagePreview: ({ visible, imageUrl, onClose }) => {
          if (!visible) return null;
          
          return (
            <Lightbox
              mainSrc={imageUrl}
              onCloseRequest={onClose}
              imageTitle="图片预览"
              toolbarButtons={[
                <button key="download" onClick={() => {
                  // 下载图片
                  const a = document.createElement('a');
                  a.href = imageUrl;
                  a.download = 'image.jpg';
                  a.click();
                }}>
                  下载
                </button>
              ]}
            />
          );
        },
      }}
    />
  );
}
*/

// ===========================
// 示例 4: 使用 react-photo-view (推荐)
// ===========================

// npm install react-photo-view --save
// import { PhotoProvider, PhotoView } from 'react-photo-view';
// import 'react-photo-view/dist/react-photo-view.css';

/*
export function CustomImagePreviewExample4() {
  return (
    <PhotoProvider>
      <Chat
        messageProps={{
          // 直接使用 PhotoView 的能力
          renderImagePreview: ({ visible, imageUrl, onClose }) => {
            if (!visible) return null;
            
            return (
              <PhotoView src={imageUrl}>
                <img 
                  src={imageUrl} 
                  alt="preview" 
                  style={{ display: 'none' }} // 隐藏原始图片
                />
              </PhotoView>
            );
          },
        }}
      />
    </PhotoProvider>
  );
}
*/

// ===========================
// 示例 5: 完整的自定义图片查看器（支持手势）
// ===========================

const FullFeaturedImageViewer: React.FC<{
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  message: ImageMessageType;
}> = ({ visible, imageUrl, onClose, message }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!visible) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(prev + delta, 5)));
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = message.file?.filename || 'image.jpg';
    a.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        cursor: scale > 1 ? 'move' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
        }}
        onClick={e => e.stopPropagation()}
      >
        <ToolButton onClick={handleZoomIn} title="放大">
          🔍+
        </ToolButton>
        <ToolButton onClick={handleZoomOut} title="缩小">
          🔍-
        </ToolButton>
        <ToolButton onClick={handleRotate} title="旋转">
          ↻
        </ToolButton>
        <ToolButton onClick={handleReset} title="重置">
          ⟲
        </ToolButton>
        <ToolButton onClick={handleDownload} title="下载">
          ⬇
        </ToolButton>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }} />
        <ToolButton onClick={onClose} title="关闭">
          ✕
        </ToolButton>
      </div>

      {/* 图片显示区域 */}
      <div
        style={{
          maxWidth: '90%',
          maxHeight: '90%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt="preview"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            maxWidth: scale <= 1 ? '100%' : 'none',
            maxHeight: scale <= 1 ? '100%' : 'none',
            objectFit: 'contain',
            userSelect: 'none',
          }}
          crossOrigin="anonymous"
          draggable={false}
        />
      </div>

      {/* 底部信息栏 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 20px',
          borderRadius: '6px',
          display: 'flex',
          gap: '20px',
          fontSize: '14px',
        }}
      >
        <span>缩放: {(scale * 100).toFixed(0)}%</span>
        <span>旋转: {rotation}°</span>
        {message.file?.filename && <span>文件: {message.file.filename}</span>}
      </div>

      {/* 使用提示 */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          color: 'rgba(255, 255, 255, 0.7)',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: '1.6',
        }}
      >
        <div>💡 使用提示：</div>
        <div>• 滚轮缩放</div>
        <div>• 拖拽移动（放大后）</div>
        <div>• ESC 关闭</div>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
    }}
  >
    {children}
  </button>
);

export function CustomImagePreviewExample5() {
  return (
    <Chat
      messageProps={{
        renderImagePreview: props => {
          return <FullFeaturedImageViewer {...props} />;
        },
      }}
    />
  );
}

// ===========================
// 导出所有示例
// ===========================

export {
  AdvancedImageViewer,
  FullFeaturedImageViewer,
};

