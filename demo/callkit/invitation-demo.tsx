import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useNotification } from '../../component/notification';
import Button from '../../component/button';
import CallKit from '../../module/callkit/CallKit';
import {
  VideoWindowProps,
  InvitationInfo,
  LayoutMode,
  CallKitRef,
} from '../../module/callkit/types';
import { Icon } from '../../component/icon/Icon';
import '../../component/style/index.scss';

const InvitationDemo: React.FC = () => {
  const [notification, contextHolder] = useNotification();
  const callKitRef = useRef<CallKitRef>(null);

  // 通话状态（用于UI显示）
  const [isInCall, setIsInCall] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00:00');

  // 控制状态
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // 模拟群组成员数据
  const mockGroupMembers = [
    {
      userId: 'user1',
      nickname: '张三',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    {
      userId: 'user2',
      nickname: '李四',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
    {
      userId: 'user3',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    {
      userId: 'user4',
      nickname: '赵六',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
    },
    {
      userId: 'user5',
      nickname: '钱七',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
    },
  ];

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
    const invitation = {
      id: '1',
      type: 'video' as const,
      callerName: '张三',
      callerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      timestamp: Date.now(),
    };
    callKitRef.current?.showInvitation(invitation);
    setHasInvitation(true);
  };

  // 模拟语音通话邀请
  const handleAudioCallInvitation = () => {
    const invitation = {
      id: '2',
      type: 'audio' as const,
      callerName: '李四',
      callerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      timestamp: Date.now(),
    };
    callKitRef.current?.showInvitation(invitation);
    setHasInvitation(true);
  };

  // 模拟群组通话邀请
  const handleGroupCallInvitation = () => {
    const invitation = {
      id: '3',
      type: 'group' as const,
      groupName: '项目讨论组',
      groupAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      memberCount: 5,
      timestamp: Date.now(),
    };
    callKitRef.current?.showInvitation(invitation);
    setHasInvitation(true);
  };

  // 接听邀请
  const handleAcceptInvitation = (invitationData: InvitationInfo) => {
    console.log('接听邀请:', invitationData);
    setHasInvitation(false);
    setIsInCall(true);
    startTimer();

    // 模拟添加视频流
    const mockVideos: VideoWindowProps[] = [
      {
        id: 'local',
        isLocalVideo: true,
        muted: false,
        cameraEnabled: true,
        nickname: '我',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
      {
        id: 'remote',
        muted: false,
        cameraEnabled: true,
        nickname: invitationData.callerName || invitationData.groupName || '对方',
        avatar: invitationData.callerAvatar || invitationData.groupAvatar,
      },
    ];

    // 如果是群组通话，添加更多参与者
    if (invitationData.type === 'group' && invitationData.memberCount) {
      for (let i = 2; i < Math.min(invitationData.memberCount, 2); i++) {
        mockVideos.push({
          id: `member-${i}`,
          muted: Math.random() > 0.5,
          cameraEnabled: Math.random() > 0.3, // 70% 概率开启摄像头
          nickname: `成员${i}`,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        });
      }
    }

    // 开始通话
    callKitRef.current?.startCall(mockVideos);

    notification.success({
      message: `已接听${invitationData.type === 'video' ? '视频' : '语音'}通话`,
    });
  };

  // 拒绝邀请
  const handleRejectInvitation = (invitationData: InvitationInfo) => {
    console.log('拒绝邀请:', invitationData);
    setHasInvitation(false);
    notification.info({
      message: '已拒绝通话邀请',
    });
  };

  // 结束通话
  const handleHangup = () => {
    setIsInCall(false);
    stopTimer();
    callKitRef.current?.endCall();
    notification.error({
      message: '通话已结束',
    });
  };

  // 切换静音
  const handleMuteToggle = (newMuted: boolean) => {
    setMuted(newMuted);
    notification.info({
      message: newMuted ? '麦克风已静音' : '麦克风已开启',
    });
  };

  // 切换摄像头
  const handleCameraToggle = (enabled: boolean) => {
    setCameraEnabled(enabled);
    notification.info({
      message: enabled ? '摄像头已开启' : '摄像头已关闭',
    });
  };

  // 切换扬声器
  const handleSpeakerToggle = (enabled: boolean) => {
    setSpeakerEnabled(enabled);
    notification.info({
      message: enabled ? '扬声器已开启' : '扬声器已关闭',
    });
  };

  // 切换屏幕共享
  const handleScreenShareToggle = (sharing: boolean) => {
    setScreenSharing(sharing);
    notification.info({
      message: sharing ? '屏幕共享已开启' : '屏幕共享已关闭',
    });
  };

  // 处理添加参与者
  const handleAddParticipant = (newMembers?: any[]) => {
    if (newMembers && newMembers.length > 0) {
      notification.success({
        message: `已邀请 ${newMembers.map(m => m.nickname).join(', ')} 加入通话`,
      });
      console.log('邀请新成员:', newMembers);
    }
  };

  // 处理通话开始
  const handleCallStart = (videos: VideoWindowProps[]) => {
    console.log('通话开始:', videos);
    setIsInCall(true);
    startTimer();
    notification.success({
      message: `群组通话已开始，共${videos.length}位参与者`,
    });
  };

  // 发起视频群组通话
  const handleStartVideoGroupCall = () => {
    callKitRef.current?.startGroupCall('video');
  };

  // 发起语音群组通话
  const handleStartAudioGroupCall = () => {
    callKitRef.current?.startGroupCall('audio');
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
          <li>点击&ldquo;模拟邀请&rdquo;按钮可以模拟收到不同类型的通话邀请</li>
          <li>点击&ldquo;发起多人通话&rdquo;按钮可以主动发起群组通话，先选择群成员后开始通话</li>
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
            disabled={hasInvitation || isInCall}
          >
            <Icon type="VIDEO_CAMERA" />
            视频通话邀请
          </Button>
          <Button
            type="primary"
            onClick={handleAudioCallInvitation}
            disabled={hasInvitation || isInCall}
          >
            <Icon type="MIC_ON" />
            语音通话邀请
          </Button>
          <Button
            type="primary"
            onClick={handleGroupCallInvitation}
            disabled={hasInvitation || isInCall}
          >
            <Icon type="PERSON_DOUBLE_FILL" />
            群组通话邀请
          </Button>
        </div>
      </div>

      {/* 发起多人通话按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>发起多人通话</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            onClick={handleStartVideoGroupCall}
            disabled={hasInvitation || isInCall}
            style={{ backgroundColor: '#52c41a' }}
          >
            <Icon type="VIDEO_CAMERA" />
            发起视频群组通话
          </Button>
          <Button
            type="primary"
            onClick={handleStartAudioGroupCall}
            disabled={hasInvitation || isInCall}
            style={{ backgroundColor: '#1890ff' }}
          >
            <Icon type="MIC_ON" />
            发起语音群组通话
          </Button>
        </div>
      </div>

      {/* 当前状态 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>当前状态</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <strong>邀请状态:</strong> {hasInvitation ? '有邀请' : '无邀请'}
          </div>
          <div>
            <strong>通话状态:</strong> {isInCall ? '通话中' : '未通话'}
          </div>
          <div>
            <strong>通话时长:</strong> {callDuration}
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

      {/* CallKit 组件 - 内部管理状态 */}
      <CallKit
        ref={callKitRef}
        // 基础配置
        layoutMode={LayoutMode.MULTI_PARTY}
        aspectRatio={1}
        gap={6}
        // 位置和大小管理
        managedPosition={true}
        initialPosition={{ left: 100, top: 100 }}
        initialSize={{ width: 800, height: 600 }}
        resizable={true}
        draggable={true}
        // 邀请相关配置
        showInvitationAvatar={true}
        showInvitationTimer={true}
        autoRejectTime={60}
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
        onAddParticipant={handleAddParticipant}
        onInvitationAccept={handleAcceptInvitation}
        onInvitationReject={handleRejectInvitation}
        onCallStart={handleCallStart}
        // 群组成员选择相关
        groupMembers={mockGroupMembers}
        userSelectTitle="邀请群组成员"
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

export default InvitationDemo;
