import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Avatar from '../../../component/avatar';
import Button from '../../../component/button';
import { Icon } from '../../../component/icon/Icon';
import { InvitationInfo, CallControlsIconMap } from '../types/index';
import { RootContext } from '../../store/rootContext';
// import '../styles/invitation.scss';

interface InvitationContentProps {
  invitation: InvitationInfo;
  onAccept: (invitation: InvitationInfo) => void;
  onReject: (invitation: InvitationInfo) => void;
  onTimeout?: (invitation: InvitationInfo) => void;
  acceptText?: string;
  rejectText?: string;
  showAvatar?: boolean;
  showTimer?: boolean;
  autoRejectTime?: number;
  className?: string;
  style?: React.CSSProperties;

  // 🔧 新增：自定义图标支持
  customIcons?: CallControlsIconMap;
  iconRenderer?: (
    iconType: string,
    defaultIcon: React.ReactElement,
    context?: any,
  ) => React.ReactElement;
}

const InvitationContent: React.FC<InvitationContentProps> = ({
  invitation,
  onAccept,
  onReject,
  onTimeout,
  acceptText,
  rejectText,
  showAvatar = true,
  showTimer = true,
  autoRejectTime = 30,
  className,
  style,
  // 🔧 新增：自定义图标支持
  customIcons,
  iconRenderer,
}) => {
  const [remainingTime, setRemainingTime] = useState(autoRejectTime);
  const { t } = useTranslation();
  const { theme } = React.useContext(RootContext);

  // 设置默认文本
  const finalAcceptText = acceptText || t('callkit.callcontrols.accept');
  const finalRejectText = rejectText || t('callkit.callcontrols.reject');

  let avatarShape: 'square' | 'circle' = 'square';
  if (theme?.avatarShape) {
    avatarShape = theme?.avatarShape;
  }

  // 🔧 新增：渲染图标的辅助函数
  const renderIcon = React.useCallback(
    (
      iconKey: keyof CallControlsIconMap,
      fallbackType: string,
      iconProps: { width?: number; height?: number; color?: string } = {},
    ) => {
      const { width = 24, height = 24, color } = iconProps;

      // 优先使用自定义图标
      const customIcon = customIcons?.[iconKey];
      if (customIcon) {
        if (React.isValidElement(customIcon)) {
          const elementProps = customIcon.props as any;
          return React.cloneElement(customIcon, { width, height, color, ...(elementProps || {}) });
        } else if (typeof customIcon === 'function') {
          const CustomIconComponent = customIcon as React.ComponentType<any>;
          return <CustomIconComponent width={width} height={height} color={color} />;
        }
      }

      // 默认图标
      const defaultIcon = (
        <Icon type={fallbackType as any} width={width} height={height} color={color} />
      );

      // 使用自定义渲染函数
      if (iconRenderer) {
        return iconRenderer(iconKey, defaultIcon, { iconKey, fallbackType, iconProps });
      }

      return defaultIcon;
    },
    [customIcons, iconRenderer],
  );

  // 倒计时逻辑
  useEffect(() => {
    if (!showTimer || autoRejectTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // 区分超时与用户主动拒绝。
          (onTimeout ?? onReject)(invitation);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimer, autoRejectTime, onReject, onTimeout, invitation]);

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
      return invitation.groupAvatar || '';
    }
    return invitation.callerAvatar || '';
  };

  // 获取显示的名称
  const getDisplayName = () => {
    if (invitation.type === 'group') {
      return invitation.groupName || '';
    }
    return invitation.callerName || '';
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
    switch (invitation.type) {
      case 'video':
        return t('callkit.invitation.videoCallDescription');
      case 'audio':
        return t('callkit.invitation.audioCallDescription');
      case 'group':
        return t('callkit.invitation.groupCallDescription');
      default:
        return t('callkit.invitation.callDescription');
    }
  };

  const containerClass = classNames('cui-callkit-invitation-content', className);

  return (
    <div className={containerClass} style={style}>
      {/* 头像区域 */}
      {showAvatar && (
        <Avatar src={getDisplayAvatar()} size={40} shape={avatarShape}>
          {getDisplayName()}
        </Avatar>
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
          {renderIcon('reject', 'PHONE_HANG', { width: 24, height: 24, color: '#F9FAFA' })}
        </Button>
        <Button type="primary" className="cui-callkit-invitation-accept-btn" onClick={handleAccept}>
          {renderIcon('accept', invitation.type === 'video' ? 'VIDEO_CAMERA' : 'PHONE_PICK', {
            width: 24,
            height: 24,
            color: '#F9FAFA',
          })}
        </Button>
      </div>
    </div>
  );
};

export default InvitationContent;
