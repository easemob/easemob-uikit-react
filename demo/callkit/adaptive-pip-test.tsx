import React, { useState, useEffect } from 'react';
import CallKit from '../../module/callkit/CallKit';
import type { VideoWindowProps } from '../../module/callkit/types';

const AdaptivePipTest: React.FC = () => {
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
      <h2>自适应画中画视频测试</h2>
      <p>测试根据视频流实际分辨率动态调整画中画视频尺寸</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>
          当前容器尺寸: {containerSize.width} x {containerSize.height}
        </h3>
        <p>画中画视频会根据本地视频流的实际分辨率自动调整高度</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>自适应规则:</h3>
        <ul>
          <li>
            <strong>检测分辨率:</strong> 自动检测本地视频流的实际分辨率
          </li>
          <li>
            <strong>计算比例:</strong> 根据视频流的宽高比计算画中画高度
          </li>
          <li>
            <strong>限制范围:</strong> 高度限制在67px-200px之间
          </li>
          <li>
            <strong>响应式宽度:</strong> 宽度使用clamp(120px, 15vw, 200px)
          </li>
          <li>
            <strong>视频填充:</strong> object-fit: cover 确保视频正确填充
          </li>
        </ul>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>测试说明:</h3>
        <ol>
          <li>允许摄像头权限，获取本地视频流</li>
          <li>观察画中画视频是否根据摄像头分辨率调整</li>
          <li>手机等竖向摄像头会显示更高的画中画窗口</li>
          <li>电脑等横向摄像头会显示较宽的画中画窗口</li>
          <li>调整浏览器窗口大小，观察响应式效果</li>
        </ol>
      </div>

      <div style={{ border: '1px solid #orange', padding: '10px', backgroundColor: '#fff8f0' }}>
        <h3>技术实现:</h3>
        <ul>
          <li>
            <strong>useVideoAspectRatio Hook:</strong> 检测视频流分辨率
          </li>
          <li>
            <strong>动态样式计算:</strong> 根据宽高比计算高度
          </li>
          <li>
            <strong>CSS移除固定高度:</strong> 让JavaScript完全控制高度
          </li>
          <li>
            <strong>响应式宽度:</strong> 保持CSS clamp的响应式宽度
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
          {`// Hook检测视频分辨率
const { aspectRatio } = useVideoAspectRatio(localVideo?.stream);

// 动态计算高度
const pipVideoStyle = {
  height: \`\${Math.max(67, Math.min(200, 200 / aspectRatio))}px\`
};

// 应用动态样式
<div className="pip-video" style={pipVideoStyle}>
  {renderVideoWindow(localVideo, 1)}
</div>`}
        </pre>
      </div>
    </div>
  );
};

export default AdaptivePipTest;
