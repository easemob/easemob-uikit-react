import React, { useState } from 'react';
import { Button } from '../../component/entry';
import { useNotification } from '../../component/notification';
import { Icon } from '../../component/icon/Icon';
import CallKit from '../../module/callkit/CallKit';
import { LayoutMode } from '../../module/callkit/types';

// 模拟视频数据
const mockVideos = [
  {
    id: 'local',
    isLocalVideo: true,
    muted: false,
    cameraEnabled: true,
    nickname: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  },
  {
    id: 'remote-user1',
    isLocalVideo: false,
    muted: false,
    cameraEnabled: true,
    nickname: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
  },
  {
    id: 'remote-user2',
    isLocalVideo: false,
    muted: false,
    cameraEnabled: true,
    nickname: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
  },
];

const SpeakerDemo: React.FC = () => {
  const [notificationApi, contextHolder] = useNotification();
  const [videos, setVideos] = useState(mockVideos);
  const [isInCall, setIsInCall] = useState(true);
  const [callDuration, setCallDuration] = useState('00:01:30');

  // 控制按钮状态
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // 控制按钮回调函数
  const handleMuteToggle = (newMuted: boolean) => {
    setMuted(newMuted);
    notificationApi.info({
      message: newMuted ? '麦克风已静音' : '麦克风已开启',
    });
  };

  const handleCameraToggle = (enabled: boolean) => {
    setCameraEnabled(enabled);
    notificationApi.info({
      message: enabled ? '摄像头已开启' : '摄像头已关闭',
    });
  };

  const handleSpeakerToggle = (enabled: boolean) => {
    setSpeakerEnabled(enabled);
    notificationApi.info({
      message: enabled ? '扬声器已开启' : '扬声器已关闭',
      description: enabled
        ? '所有远程音频轨道的音量已设置为 100%'
        : '所有远程音频轨道的音量已设置为 0%',
    });
  };

  const handleScreenShareToggle = (sharing: boolean) => {
    setScreenSharing(sharing);
    notificationApi.info({
      message: sharing ? '屏幕共享已开启' : '屏幕共享已关闭',
    });
  };

  const handleHangup = () => {
    setIsInCall(false);
    setVideos([]);
    notificationApi.info({
      message: '通话已结束',
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      {contextHolder}

      <h1>扬声器控制功能演示</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>功能说明</h3>
        <ul>
          <li>
            <strong>1v1 视频通话</strong>：关闭扬声器时，设置对方的音频轨道音量 =
            0，自己的音频轨道音量 = 0
          </li>
          <li>
            <strong>多人视频通话</strong>：关闭扬声器时，设置所有人的音频轨道音量 = 0
          </li>
          <li>
            <strong>开启扬声器</strong>：恢复所有音频轨道音量为 100%
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>当前状态</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <strong>通话状态:</strong> {isInCall ? '通话中' : '未通话'}
          </div>
          <div>
            <strong>通话时长:</strong> {callDuration}
          </div>
          <div>
            <strong>视频数量:</strong> {videos.length}
          </div>
          <div>
            <strong>扬声器状态:</strong> {speakerEnabled ? '开启' : '关闭'}
          </div>
        </div>
      </div>

      {/* 通话控制 */}
      {isInCall && (
        <div style={{ marginBottom: '20px' }}>
          <h3>通话控制</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button onClick={() => handleMuteToggle(!muted)}>
              <Icon type={muted ? 'MIC_OFF' : 'MIC_ON'} />
              {muted ? '取消静音' : '静音'}
            </Button>
            <Button onClick={() => handleCameraToggle(!cameraEnabled)}>
              <Icon type={cameraEnabled ? 'VIDEO_CAMERA' : 'VIDEO_CAMERA_SLASH'} />
              {cameraEnabled ? '关闭摄像头' : '开启摄像头'}
            </Button>
            <Button onClick={() => handleSpeakerToggle(!speakerEnabled)}>
              <Icon type={speakerEnabled ? 'SPEAKER_WAVE_2' : 'SPEAKER_X_MARK'} />
              {speakerEnabled ? '关闭扬声器' : '开启扬声器'}
            </Button>
            <Button onClick={() => handleScreenShareToggle(!screenSharing)}>
              <Icon type="ARROW_RIGHT_SQUARE_FILL" />
              {screenSharing ? '停止共享' : '屏幕共享'}
            </Button>
            <Button type="primary" onClick={handleHangup}>
              <Icon type="PHONE_PICK" />
              结束通话
            </Button>
          </div>
        </div>
      )}

      {/* CallKit 组件 */}
      {isInCall && (
        <CallKit
          // 基础配置
          videos={videos}
          layoutMode={LayoutMode.MULTI_PARTY}
          aspectRatio={16 / 9}
          gap={8}
          // 位置和大小管理
          managedPosition={true}
          initialPosition={{ left: 100, top: 100 }}
          initialSize={{ width: 800, height: 600 }}
          resizable={true}
          draggable={true}
          // 控制按钮
          showControls={true}
          muted={muted}
          cameraEnabled={cameraEnabled}
          speakerEnabled={speakerEnabled}
          screenSharing={screenSharing}
          // 事件回调
          onMuteToggle={handleMuteToggle}
          onCameraToggle={handleCameraToggle}
          onSpeakerToggle={handleSpeakerToggle}
          onScreenShareToggle={handleScreenShareToggle}
          onHangup={handleHangup}
          // 其他
          callDuration={callDuration}
        />
      )}

      {/* 使用说明 */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3>使用说明</h3>
        <ol>
          <li>点击"关闭扬声器"按钮，所有远程音频轨道的音量将被设置为 0</li>
          <li>点击"开启扬声器"按钮，所有远程音频轨道的音量将被恢复为 100%</li>
          <li>在真实通话环境中，这个功能会通过 CallService 的 toggleSpeaker() 方法实现</li>
          <li>支持 1v1 和多人视频通话场景</li>
        </ol>
      </div>
    </div>
  );
};

export default SpeakerDemo;
