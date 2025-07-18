import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { InvitationInfo } from '../types';
import { Icon } from '../../../component/icon/Icon';
import Button from '../../../component/button';
import Avatar from '../../../component/avatar';

interface InvitationContentProps {
  invitation: InvitationInfo;
  onAccept: (invitation: InvitationInfo) => void;
  onReject: (invitation: InvitationInfo) => void;
  acceptText?: string;
  rejectText?: string;
  showAvatar?: boolean;
  showTimer?: boolean;
  autoRejectTime?: number;
  className?: string;
  style?: React.CSSProperties;
}

const InvitationContent: React.FC<InvitationContentProps> = ({
  invitation,
  onAccept,
  onReject,
  acceptText = '接听',
  rejectText = '挂断',
  showAvatar = true,
  showTimer = true,
  autoRejectTime = 30,
  className,
  style,
}) => {
  const [remainingTime, setRemainingTime] = useState(autoRejectTime);

  // 倒计时逻辑
  useEffect(() => {
    if (!showTimer || autoRejectTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // 时间到了，自动拒绝
          onReject(invitation);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimer, autoRejectTime, onReject, invitation]);

  // 处理接听
  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onAccept(invitation);
  };

  // 处理拒绝
  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onReject(invitation);
  };

  // 获取显示的头像
  const getDisplayAvatar = () => {
    if (invitation.type === 'group') {
      return invitation.groupAvatar;
    }
    return invitation.callerAvatar;
  };

  // 获取显示的名称
  const getDisplayName = () => {
    if (invitation.type === 'group') {
      return invitation.groupName || '群组通话';
    }
    return invitation.callerName || '未知用户';
  };

  // 获取通话类型图标
  const getCallTypeIcon = () => {
    switch (invitation.type) {
      case 'video':
        return <Icon type="VIDEO_CAMERA" />;
      case 'audio':
        return <Icon type="MIC_ON" />;
      case 'group':
        return <Icon type="PERSON_DOUBLE_FILL" />;
      default:
        return <Icon type="PHONE_PICK" />;
    }
  };

  // 获取通话类型描述
  const getCallTypeDescription = () => {
    if (invitation.type === 'group' && invitation.memberCount) {
      return `群组通话 • ${invitation.memberCount} 人`;
    }
    switch (invitation.type) {
      case 'video':
        return '视频通话邀请';
      case 'audio':
        return '语音通话邀请';
      case 'group':
        return '群组通话邀请';
      default:
        return '通话邀请';
    }
  };

  const containerClass = classNames('cui-callkit-invitation-content', className);

  return (
    <div className={containerClass} style={style}>
      {/* 头像区域 */}
      {showAvatar && (
        <Avatar src={getDisplayAvatar() || getDisplayName().charAt(0).toUpperCase()} size={40} />
      )}

      {/* 信息区域 */}
      <div className="cui-callkit-invitation-info">
        <div className="cui-callkit-invitation-caller">{getDisplayName()}</div>
        <div className="cui-callkit-invitation-description">{getCallTypeDescription()}</div>
        {/* 倒计时 */}
        {/* {showTimer && autoRejectTime > 0 && (
            <div className="cui-callkit-invitation-timer">{remainingTime}s 后自动拒绝</div>
          )} */}
      </div>

      {/* 操作按钮 */}
      <div className="cui-callkit-invitation-actions" onClick={e => e.stopPropagation()}>
        <Button type="default" className="cui-callkit-invitation-reject-btn" onClick={handleReject}>
          <Icon type="PHONE_HANG" width={24} height={24} color="#F9FAFA" />
        </Button>
        <Button type="primary" className="cui-callkit-invitation-accept-btn" onClick={handleAccept}>
          <Icon
            type={invitation.type === 'video' ? 'VIDEO_CAMERA' : 'PHONE_PICK'}
            width={24}
            height={24}
            color="#F9FAFA"
          />
        </Button>
      </div>
    </div>
  );
};

export default InvitationContent;
