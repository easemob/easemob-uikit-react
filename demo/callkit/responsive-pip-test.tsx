import React, { useState } from 'react';
import CallKit from '../../module/callkit/CallKit';
import type { VideoWindowProps } from '../../module/callkit/types';

const ResponsivePipTest: React.FC = () => {
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // 模拟视频数据
  const videos: VideoWindowProps[] = [
    {
      id: 'local',
      isLocalVideo: true,
      nickname: '我',
      muted: false,
      cameraEnabled: true,
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
      <h2>响应式画中画视频测试</h2>
      <p>测试1v1视频模式下小窗口的响应式效果</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>
          当前容器尺寸: {containerSize.width} x {containerSize.height}
        </h3>
        <p>小窗口尺寸会根据容器大小自动调整，但保持最小尺寸限制</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>响应式规则:</h3>
        <ul>
          <li>
            <strong>桌面端:</strong> 宽度 15vw（最小120px，最大200px）
          </li>
          <li>
            <strong>移动端:</strong> 宽度 20vw（最小100px，最大150px）
          </li>
          <li>
            <strong>小屏幕:</strong> 固定 100px x 56px
          </li>
          <li>
            <strong>高度:</strong> 保持16:9比例
          </li>
          <li>
            <strong>视频填充:</strong> object-fit: cover 确保视频正确填充
          </li>
        </ul>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>测试说明:</h3>
        <ol>
          <li>调整浏览器窗口大小，观察小窗口的响应式变化</li>
          <li>小窗口会保持最小尺寸（120px x 67px）</li>
          <li>视频内容会正确填充容器，保持比例</li>
          <li>在不同屏幕尺寸下测试效果</li>
        </ol>
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

      <div style={{ border: '1px solid #orange', padding: '10px', backgroundColor: '#fff8f0' }}>
        <h3>关键CSS代码:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {`// 响应式画中画视频样式
.#{$callkit-prefix-cls}-pip-video {
  width: clamp(120px, 15vw, 200px);
  height: clamp(67px, 8.4vw, 112px);
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 480px) {
    width: 100px;
    height: 56px;
  }
}`}
        </pre>
      </div>
    </div>
  );
};

export default ResponsivePipTest;
