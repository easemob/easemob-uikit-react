import React, { useRef, useState } from 'react';
import { CallKit, CallKitRef } from '../../module/callkit';
import type { LayoutMode } from '../../module/callkit';
import Button from '../../component/button';

// 示例：模拟批量用户信息provider
const mockGroupMemberProvider = async (userIds: string[]) => {
  // 模拟异步获取用户信息的过程
  await new Promise(resolve => setTimeout(resolve, 200));

  // 模拟不同用户的信息
  const userInfoMap: Record<string, any> = {
    user1: {
      userId: 'user1',
      nickname: '张三',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    user2: {
      userId: 'user2',
      nickname: '李四',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
    user3: {
      userId: 'user3',
      nickname: '王五',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
    },
    lxm: {
      userId: 'lxm',
      nickname: '李小明',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lxm',
    },
    zd1: {
      userId: 'zd1',
      nickname: '张东1',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zd1',
    },
    zd2: {
      userId: 'zd2',
      nickname: '张东2',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zd1',
    },
    xu1: {
      userId: 'xu1',
      nickname: '徐成普1',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xu1',
    },
    xu2: {
      userId: 'xu2',
      nickname: '徐成普2',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xu2',
    },
  };

  // 批量返回用户信息
  return userIds.map(
    userId =>
      userInfoMap[userId] || {
        userId,
        nickname: userId,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      },
  );
};

// 模拟环信IM连接
const mockWebimConnection = {
  listGroupMembers: async ({ groupId, pageNum, pageSize }: any) => {
    // 模拟不同群组的成员数据
    const groupMembersMap: Record<string, any[]> = {
      group_123: [{ member: 'user1' }, { member: 'user2' }, { member: 'user3' }, { owner: 'lxm' }],
      group_456: [{ member: 'user1' }, { member: 'zd1' }, { owner: 'lxm' }],
    };

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: groupMembersMap[groupId] || [],
    };
  },
};

const GroupCallByGroupIdDemo: React.FC = () => {
  const callKitRef = useRef<CallKitRef>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('group_123');

  // 处理群组选择
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  // 发起视频群组通话（基于群组ID）
  const handleStartVideoGroupCall = async () => {
    console.log('🚀 发起视频群组通话，群组ID:', selectedGroupId);
    await callKitRef.current?.startGroupCall(selectedGroupId, 'video');
  };

  // 发起语音群组通话（基于群组ID）
  const handleStartAudioGroupCall = async () => {
    console.log('🚀 发起语音群组通话，群组ID:', selectedGroupId);
    await callKitRef.current?.startGroupCall(selectedGroupId, 'audio');
  };

  // 邀请接受处理
  const handleAcceptInvitation = (invitation: any) => {
    console.log('接受邀请:', invitation);
  };

  // 邀请拒绝处理
  const handleRejectInvitation = (invitation: any) => {
    console.log('拒绝邀请:', invitation);
  };

  // 通话开始处理
  const handleCallStart = (videos: any[]) => {
    console.log('通话开始，视频列表:', videos);
  };

  // 通话结束处理
  const handleCallEnd = () => {
    console.log('通话结束');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>群组通话演示 - 基于群组ID自动获取成员</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>功能特性：</h3>
        <ul>
          <li>✅ 只需调用startGroupCall(groupId)，无需预设群成员列表</li>
          <li>✅ 自动调用环信IM SDK的listGroupMembers方法获取群成员</li>
          <li>✅ 支持批量groupMemberProvider一次性获取多个用户头像和昵称</li>
          <li>✅ 兼容传统的groupMembers方式，优先使用IM SDK获取的数据</li>
          <li>✅ 支持异步批量用户信息获取，性能更优</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>选择群组：</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <Button
            type={selectedGroupId === 'group_123' ? 'primary' : 'default'}
            onClick={() => handleGroupChange('group_123')}
          >
            群组123 (4名成员)
          </Button>
          <Button
            type={selectedGroupId === 'group_456' ? 'primary' : 'default'}
            onClick={() => handleGroupChange('group_456')}
          >
            群组456 (3名成员)
          </Button>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          当前选择的群组ID: <strong>{selectedGroupId}</strong>
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>发起通话：</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="primary" onClick={handleStartVideoGroupCall}>
            📹 发起视频群组通话
          </Button>
          <Button onClick={handleStartAudioGroupCall}>🎤 发起语音群组通话</Button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h4>代码示例：</h4>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {`// 1. 配置CallKit组件
<CallKit
  ref={callKitRef}
  webimConnection={webimConnection}
  groupMemberProvider={async (userIds) => {
    // 批量获取用户信息的逻辑
    return userIds.map(userId => ({
      userId,
      nickname: getUserNickname(userId),
      avatarUrl: getUserAvatar(userId)
    }));
  }}
  // ... 其他配置
/>

// 2. 发起群组通话（自动获取群成员）
await callKitRef.current?.startGroupCall('${selectedGroupId}', 'video');`}
        </pre>
      </div>

      <CallKit
        ref={callKitRef}
        // 基础配置
        layoutMode={'multi-party' as LayoutMode}
        aspectRatio={1}
        gap={6}
        // 新功能：基于群组ID自动获取成员
        webimConnection={mockWebimConnection}
        groupMemberProvider={mockGroupMemberProvider}
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
        // 事件回调
        onInvitationAccept={handleAcceptInvitation}
        onInvitationReject={handleRejectInvitation}
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
        // 用户选择弹窗标题
        userSelectTitle="选择群成员进行通话"
      />
    </div>
  );
};

export default GroupCallByGroupIdDemo;
