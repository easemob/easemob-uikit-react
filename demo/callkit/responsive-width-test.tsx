import React, { useState, useEffect } from 'react';
import CallKit from '../../module/callkit/CallKit';
import type { VideoWindowProps } from '../../module/callkit/types';

const ResponsiveWidthTest: React.FC = () => {
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
      <h2>画中画视频响应式宽度测试</h2>
      <p>测试画中画视频宽度相对于容器宽度的响应式效果</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>
          当前容器尺寸: {containerSize.width} x {containerSize.height}
        </h3>
        <p>画中画视频宽度 = 容器宽度的15% (最小120px，最大200px)</p>
        <p>当前画中画宽度: {Math.max(120, Math.min(200, containerSize.width * 0.15))}px</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>响应式规则:</h3>
        <ul>
          <li>
            <strong>桌面端:</strong> clamp(120px, 15%, 200px)
          </li>
          <li>
            <strong>移动端:</strong> clamp(100px, 20%, 150px)
          </li>
          <li>
            <strong>小屏幕:</strong> 固定100px
          </li>
          <li>
            <strong>高度:</strong> 根据视频流分辨率动态计算
          </li>
        </ul>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>测试步骤:</h3>
        <ol>
          <li>调整CallKit容器的大小（拖拽右下角）</li>
          <li>观察右上角画中画视频的宽度变化</li>
          <li>验证宽度是否始终为容器宽度的15%</li>
          <li>测试最小宽度限制（120px）</li>
          <li>测试最大宽度限制（200px）</li>
          <li>在不同屏幕尺寸下测试移动端适配</li>
        </ol>
      </div>

      <div style={{ border: '1px solid #orange', padding: '10px', backgroundColor: '#fff8f0' }}>
        <h3>改进说明:</h3>
        <ul>
          <li>
            <strong>从vw改为%:</strong> 从视口宽度改为容器宽度，更符合resize场景
          </li>
          <li>
            <strong>更好的适配:</strong> 当用户调整CallKit大小时，画中画视频会相应调整
          </li>
          <li>
            <strong>保持比例:</strong> 画中画视频始终占据容器宽度的固定比例
          </li>
          <li>
            <strong>限制范围:</strong> 确保画中画视频不会过大或过小
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
        <h3>CSS代码对比:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
          }}
        >
          {`// 改进前：相对于视口宽度
width: clamp(120px, 15vw, 200px);

// 改进后：相对于容器宽度
width: clamp(120px, 15%, 200px);

// 优势：
// 1. 当用户调整CallKit容器大小时，画中画视频会相应调整
// 2. 更符合组件的实际使用场景
// 3. 提供更好的用户体验`}
        </pre>
      </div>
    </div>
  );
};

export default ResponsiveWidthTest;
