import React, { useState, useEffect } from 'react';
import CallKit from '../../module/callkit/CallKit';
import type { VideoWindowProps } from '../../module/callkit/types';

const VideoSwapTest: React.FC = () => {
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // 获取本地摄像头流
  useEffect(() => {
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        setLocalStream(stream);
        console.log('📹 获取到本地视频流:', stream);
      } catch (error) {
        console.error('获取本地视频流失败:', error);
      }
    };

    getLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 模拟视频数据
  const videos: VideoWindowProps[] = [
    {
      id: 'local',
      isLocalVideo: true,
      nickname: '我',
      muted: false,
      cameraEnabled: true,
      stream: localStream || undefined,
    },
    {
      id: 'remote-1',
      isLocalVideo: false,
      nickname: '用户A',
      muted: false,
      cameraEnabled: true,
    },
  ];

  const handleResize = (width: number, height: number) => {
    setContainerSize({ width, height });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>1v1视频位置互换测试</h2>
      <p>测试点击视频窗口时本地视频和远程视频位置互换功能</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>
          当前容器尺寸: {containerSize.width} x {containerSize.height}
        </h3>
        <p>点击任意视频窗口（大窗口或小窗口）可以互换位置</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>功能说明:</h3>
        <ul>
          <li>
            <strong>初始状态:</strong> 远程视频在主窗口，本地视频在右上角小窗口
          </li>
          <li>
            <strong>点击大窗口:</strong> 本地视频和远程视频位置互换
          </li>
          <li>
            <strong>点击小窗口:</strong> 同样实现位置互换
          </li>
          <li>
            <strong>Header信息:</strong> 根据当前主视频显示相应的用户信息
          </li>
          <li>
            <strong>自适应高度:</strong> 小窗口高度根据视频流分辨率自动调整
          </li>
          <li>
            <strong>响应式宽度:</strong> 小窗口宽度使用容器宽度的15%，随容器大小调整
          </li>
        </ul>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>测试步骤:</h3>
        <ol>
          <li>允许摄像头权限，获取本地视频流</li>
          <li>观察初始状态：远程视频在主窗口，本地视频在小窗口</li>
          <li>点击主窗口，观察视频位置互换</li>
          <li>点击小窗口，观察视频位置再次互换</li>
          <li>观察Header信息是否随主视频变化</li>
          <li>观察小窗口高度是否根据视频分辨率自适应</li>
        </ol>
      </div>

      <div style={{ border: '1px solid #orange', padding: '10px', backgroundColor: '#fff8f0' }}>
        <h3>技术实现:</h3>
        <ul>
          <li>
            <strong>状态管理:</strong> isLocalVideoMain 控制当前主视频
          </li>
          <li>
            <strong>点击处理:</strong> handleVideoClick 切换视频位置
          </li>
          <li>
            <strong>条件渲染:</strong> 根据状态决定哪个视频显示在主窗口
          </li>
          <li>
            <strong>Header同步:</strong> 根据主视频显示相应用户信息
          </li>
          <li>
            <strong>事件传递:</strong> 使用React.cloneElement传递点击事件
          </li>
          <li>
            <strong>响应式设计:</strong> 小窗口宽度相对于容器宽度，支持容器resize
          </li>
        </ul>
      </div>

      <div
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          border: '2px solid #1890ff',
          margin: '20px 0',
          position: 'relative',
        }}
      >
        <CallKit
          callMode="video"
          showControls={true}
          onResize={handleResize}
          resizable={true}
          minWidth={400}
          minHeight={300}
          maxWidth={1200}
          maxHeight={800}
          style={{ width: '100%', height: '100%' }}
          onCallStart={videos => console.log('通话开始:', videos)}
        />
      </div>

      <div style={{ border: '1px solid #purple', padding: '10px', backgroundColor: '#f8f0ff' }}>
        <h3>关键代码:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
          }}
        >
          {`// 状态管理
const [isLocalVideoMain, setIsLocalVideoMain] = useState(false);

// 点击处理
const handleVideoClick = (videoId: string) => {
  setIsLocalVideoMain(prev => !prev);
};

// 条件渲染主视频
{isLocalVideoMain ? (
  <div className="main-video">
    {renderVideoWindow(localVideo, 0)}
  </div>
) : (
  <div className="main-video">
    {renderVideoWindow(remoteVideo, 0)}
  </div>
)}

// Header信息同步
const headerInfo = isLocalVideoMain ? {
  content: localVideo?.nickname || '我',
  avatar: localVideo?.avatar,
} : {
  content: remoteVideo?.nickname || '用户',
  avatar: remoteVideo?.avatar,
};

// CSS响应式宽度
.pip-video {
  width: clamp(120px, 15%, 200px); // 相对于容器宽度
  height: 动态计算; // 根据视频流分辨率
}`}
        </pre>
      </div>
    </div>
  );
};

export default VideoSwapTest;
