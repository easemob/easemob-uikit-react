import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import VideoLayout from '../../module/callkit/VideoLayout';
import { useNotification } from '../../component/notification';
import { Button, Avatar } from '../../component/entry';
import { NetworkQuality } from '../../component/networkQuality';
import CallKit from '../../module/callkit/CallKit';
import { VideoWindowProps, InvitationInfo, LayoutMode } from '../../module/callkit/types';
import { Icon } from '../../component/icon/Icon';
import './index.scss';

const videos = [
  {
    id: 'local-video',
    nickname: 'You (Local)',
    isLocalVideo: true,
    muted: true,
    // 在实际使用中，这里会是真实的 MediaStream
    stream: undefined,
  },
  {
    id: 'remote-video-121',
    nickname: 'Alice',
    muted: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  },
  // {
  //   id: 'remote-video-122',
  //   nickname: 'Bob',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  // },
  // {
  //   id: 'remote-video-123',
  //   nickname: 'Charlie',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
  // },
  // {
  //   id: 'remote-video-124',
  //   nickname: 'David',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
  // },
  // {
  //   id: 'remote-video-125',
  //   nickname: 'Emma',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
  // },
  // {
  //   id: 'remote-video-126',
  //   nickname: 'Frank',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank',
  // },
  // {
  //   id: 'remote-video-127',
  //   nickname: 'Grace',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
  // },
  // {
  //   id: 'remote-video-128',
  //   nickname: 'Henry',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry',
  // },
  // {
  //   id: 'remote-video-129',
  //   nickname: 'Ivy',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy',
  // },
  // {
  //   id: 'remote-video-130',
  //   nickname: 'Jack',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack',
  // },
  // {
  //   id: 'remote-video-131',
  //   nickname: 'Kate',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate',
  // },
  // {
  //   id: 'remote-video-132',
  //   nickname: 'Leo',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo',
  // },
  // {
  //   id: 'remote-video-133',
  //   nickname: 'Mia',
  //   muted: true,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mia',
  // },
  // {
  //   id: 'remote-video-134',
  //   nickname: 'Noah',
  //   muted: false,
  //   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah',
  // },
];

const CallKitDemo: React.FC = () => {
  const [notification, contextHolder] = useNotification();
  const [callkitPosition, setCallkitPosition] = useState({ left: 50, top: 50 });
  const [callkitSize, setCallkitSize] = useState({ width: 800, height: 600 });
  const [initialPosition, setInitialPosition] = useState({ left: 50, top: 50 });
  const [currentVideoCount, setCurrentVideoCount] = useState(8);

  // 控制按钮状态
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // 获取当前显示的视频
  const currentVideos = videos.slice(0, currentVideoCount);

  // 添加视频
  const addVideo = () => {
    if (currentVideoCount < videos.length) {
      setCurrentVideoCount(currentVideoCount + 1);
    }
  };

  // 移除视频
  const removeVideo = () => {
    if (currentVideoCount > 1) {
      setCurrentVideoCount(currentVideoCount - 1);
    }
  };

  // 控制按钮回调函数
  const handleMuteToggle = (newMuted: boolean) => {
    setMuted(newMuted);
    notification.info({
      message: newMuted ? '麦克风已静音' : '麦克风已开启',
    });
  };

  const handleCameraToggle = (enabled: boolean) => {
    setCameraEnabled(enabled);
    notification.info({
      message: enabled ? '摄像头已开启' : '摄像头已关闭',
    });
  };

  const handleSpeakerToggle = (enabled: boolean) => {
    setSpeakerEnabled(enabled);
    notification.info({
      message: enabled ? '扬声器已开启' : '扬声器已关闭',
    });
  };

  const handleScreenShareToggle = (sharing: boolean) => {
    setScreenSharing(sharing);
    notification.info({
      message: sharing ? '屏幕共享已开启' : '屏幕共享已关闭',
    });
  };

  const handleHangup = () => {
    notification.error({
      message: '通话已结束',
    });
    // 重置状态
    setMuted(false);
    setCameraEnabled(true);
    setSpeakerEnabled(true);
    setScreenSharing(false);
  };

  // 处理CallKit的大小调整和位置变化 - 支持同步位置更新
  const handleResize = (
    width: number,
    height: number,
    newLeft?: number,
    newTop?: number,
    direction?: string,
  ) => {
    console.log('CallKit resize:', { width, height, newLeft, newTop, direction });

    // 更新尺寸
    setCallkitSize({ width, height });

    // 同步更新位置，避免拖动过程中的视觉跳动
    if (newLeft !== undefined || newTop !== undefined) {
      const newPosition = {
        left: newLeft !== undefined ? newLeft : callkitPosition.left,
        top: newTop !== undefined ? newTop : callkitPosition.top,
      };

      setCallkitPosition(newPosition);

      // 立即应用位置到 DOM，避免等待 React 重新渲染
      const callkitElement = document.querySelector('.cui-callkit') as HTMLElement;
      if (callkitElement) {
        if (newLeft !== undefined) {
          callkitElement.style.left = `${newPosition.left}px`;
        }
        if (newTop !== undefined) {
          callkitElement.style.top = `${newPosition.top}px`;
        }
      }
    }
  };

  // 邀请状态
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);

  // 通话状态
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00:00');

  // 视频数据
  const [videos, setVideos] = useState<VideoWindowProps[]>([]);

  // 模拟通话时长计时器
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  // 开始计时
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(
        2,
        '0',
      )}:${String(seconds % 60).padStart(2, '0')}`;
      setCallDuration(formattedTime);
    }, 1000);
  }, []);

  // 停止计时
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    setCallDuration('00:00:00');
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 模拟视频通话邀请
  const handleVideoCallInvitation = () => {
    setInvitation({
      id: '1',
      type: 'video',
      callerName: '张三',
      callerAvatar: 'https://via.placeholder.com/60x60?text=张三',
      timestamp: Date.now(),
    });
  };

  // 模拟语音通话邀请
  const handleAudioCallInvitation = () => {
    setInvitation({
      id: '2',
      type: 'audio',
      callerName: '李四',
      callerAvatar: 'https://via.placeholder.com/60x60?text=李四',
      timestamp: Date.now(),
    });
  };

  // 模拟群组通话邀请
  const handleGroupCallInvitation = () => {
    setInvitation({
      id: '3',
      type: 'group',
      groupName: '项目讨论组',
      groupAvatar: 'https://via.placeholder.com/60x60?text=群组',
      memberCount: 5,
      timestamp: Date.now(),
    });
  };

  // 接听邀请
  const handleAcceptInvitation = (invitationData: InvitationInfo) => {
    console.log('接听邀请:', invitationData);
    setInvitation(null);
    setIsInCall(true);
    startTimer();

    // 模拟添加视频流
    const mockVideos: VideoWindowProps[] = [
      {
        id: 'local',
        isLocalVideo: true,
        muted: false,
        nickname: '我',
        avatar: 'https://via.placeholder.com/60x60?text=我',
      },
      {
        id: 'remote',
        muted: false,
        nickname: invitationData.callerName || invitationData.groupName || '对方',
        avatar: invitationData.callerAvatar || invitationData.groupAvatar,
      },
    ];

    // 如果是群组通话，添加更多参与者
    if (invitationData.type === 'group' && invitationData.memberCount) {
      for (let i = 2; i < Math.min(invitationData.memberCount, 6); i++) {
        mockVideos.push({
          id: `member-${i}`,
          muted: Math.random() > 0.5,
          nickname: `成员${i}`,
          avatar: `https://via.placeholder.com/60x60?text=成员${i}`,
        });
      }
    }

    setVideos(mockVideos);
    notification.success({
      message: `已接听${invitationData.type === 'video' ? '视频' : '语音'}通话`,
    });
  };

  // 拒绝邀请
  const handleRejectInvitation = (invitationData: InvitationInfo) => {
    console.log('拒绝邀请:', invitationData);
    setInvitation(null);
    notification.info({
      message: '已拒绝通话邀请',
    });
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      {contextHolder}

      <h1>CallKit 邀请通知演示</h1>

      {/* 演示说明 */}
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3>功能说明</h3>
        <ul>
          <li>CallKit 组件支持邀请通知功能，可以在任何路由页面显示通话邀请</li>
          <li>点击下方按钮模拟收到不同类型的通话邀请</li>
          <li>邀请通知会在屏幕顶部显示，包含头像、用户信息、倒计时等</li>
          <li>支持接听和拒绝操作，接听后会显示通话界面</li>
          <li>组件默认隐藏，只有在有邀请或正在通话时才显示</li>
        </ul>
      </div>

      {/* 控制按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>模拟邀请</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            onClick={handleVideoCallInvitation}
            disabled={!!invitation || isInCall}
          >
            <Icon type="VIDEO_CAMERA" />
            视频通话邀请
          </Button>
          <Button
            type="primary"
            onClick={handleAudioCallInvitation}
            disabled={!!invitation || isInCall}
          >
            <Icon type="MIC_ON" />
            语音通话邀请
          </Button>
          <Button
            type="primary"
            onClick={handleGroupCallInvitation}
            disabled={!!invitation || isInCall}
          >
            <Icon type="PERSON_DOUBLE_FILL" />
            群组通话邀请
          </Button>
        </div>
      </div>

      {/* 当前状态 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>当前状态</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <strong>邀请状态:</strong> {invitation ? '有邀请' : '无邀请'}
          </div>
          <div>
            <strong>通话状态:</strong> {isInCall ? '通话中' : '未通话'}
          </div>
          <div>
            <strong>通话时长:</strong> {callDuration}
          </div>
          <div>
            <strong>视频数量:</strong> {videos.length}
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
        // 邀请相关
        invitation={invitation}
        onInvitationAccept={handleAcceptInvitation}
        onInvitationReject={handleRejectInvitation}
        showInvitationAvatar={true}
        showInvitationTimer={true}
        autoRejectTime={30}
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

      {/* 使用说明 */}
      <div
        style={{
          marginTop: '40px',
          padding: '15px',
          backgroundColor: '#e6f7ff',
          borderRadius: '8px',
        }}
      >
        <h3>使用方法</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {`import CallKit from './module/callkit/CallKit';
import { InvitationInfo } from './module/callkit/types';

const App = () => {
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  
  // 处理邀请
  const handleAccept = (invitation: InvitationInfo) => {
    setInvitation(null);
    // 开始通话逻辑
  };
  
  const handleReject = (invitation: InvitationInfo) => {
    setInvitation(null);
    // 拒绝通话逻辑
  };
  
  return (
    <div>
      {/* 你的应用内容 */}
      
      {/* CallKit 组件 - 放在根组件下 */}
      <CallKit
        videos={videos}
        invitation={invitation}
        onInvitationAccept={handleAccept}
        onInvitationReject={handleReject}
        managedPosition={true}
        // ... 其他配置
      />
    </div>
  );
};`}
        </pre>
      </div>
    </div>
  );
};

// 渲染到页面
ReactDOM.createRoot(document.getElementById('callkitRoot') as Element).render(
  <div>
    <CallKitDemo />
  </div>,
);
