import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config';
import './CallKitHeader.scss';

export interface CallKitHeaderProps {
  /** 群组名称 */
  groupName?: string;
  /** 群组头像 */
  groupAvatar?: string;
  /** 通话开始时间戳 */
  callStartTime?: number;
  /** 参与者数量 */
  participantCount?: number;
  /** 是否全屏状态 */
  isFullscreen?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** CSS类名前缀 */
  prefix?: string;
  /** 全屏切换回调 */
  onFullscreenToggle?: () => void;
  /** 复制链接回调 */
  onCopyLink?: () => void;
  /** 用户管理回调 */
  onUserManagement?: () => void;
  /** 更多操作回调 */
  onMoreActions?: () => void;
}

const CallKitHeader: React.FC<CallKitHeaderProps> = ({
  groupName = 'Groupname',
  groupAvatar,
  callStartTime,
  participantCount = 0,
  isFullscreen = false,
  className,
  style,
  prefix,
  onFullscreenToggle,
  onCopyLink,
  onUserManagement,
  onMoreActions,
}) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('callkit-header', prefix);

  const [callDuration, setCallDuration] = useState('00:00:01');

  // 计算通话时长
  useEffect(() => {
    if (!callStartTime) return;

    const updateDuration = () => {
      const now = Date.now();
      const duration = Math.floor((now - callStartTime) / 1000);

      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;

      if (hours > 0) {
        setCallDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`,
        );
      } else {
        setCallDuration(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
      }
    };

    updateDuration();
    const timer = setInterval(updateDuration, 1000);

    return () => clearInterval(timer);
  }, [callStartTime]);

  const headerClass = classNames(prefixCls, className);

  return (
    <div className={headerClass} style={style}>
      {/* 左侧群组信息 */}
      <div className={`${prefixCls}-left`}>
        <div className={`${prefixCls}-group-info`}>
          {/* 群组头像 */}
          <div className={`${prefixCls}-avatar-container`}>
            {groupAvatar ? (
              <img src={groupAvatar} alt={groupName} className={`${prefixCls}-avatar`} />
            ) : (
              <div className={`${prefixCls}-avatar-placeholder`}>
                {groupName?.[0]?.toUpperCase() || 'G'}
              </div>
            )}
            {/* 参与者头像叠加显示 */}
            <div className={`${prefixCls}-participants-preview`}>
              {/* 这里可以显示前几个参与者的小头像 */}
            </div>
          </div>

          {/* 群组名称和通话信息 */}
          <div className={`${prefixCls}-info`}>
            <div className={`${prefixCls}-group-name`}>{groupName}</div>
            <div className={`${prefixCls}-call-info`}>
              <span className={`${prefixCls}-duration`}>{callDuration}</span>
              {participantCount > 0 && (
                <span className={`${prefixCls}-participant-count`}>
                  {participantCount} 人正在通话
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧操作按钮 */}
      <div className={`${prefixCls}-right`}>
        <div className={`${prefixCls}-actions`}>
          {/* 全屏按钮 */}
          <button
            className={`${prefixCls}-action-btn ${prefixCls}-fullscreen-btn`}
            onClick={onFullscreenToggle}
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>

          {/* 复制链接按钮 */}
          <button
            className={`${prefixCls}-action-btn ${prefixCls}-copy-btn`}
            onClick={onCopyLink}
            title="复制邀请链接"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
          </button>

          {/* 用户管理按钮 */}
          <button
            className={`${prefixCls}-action-btn ${prefixCls}-users-btn`}
            onClick={onUserManagement}
            title="用户管理"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.02 3.02 0 0 0 17.06 7H16.94c-1.41 0-2.63.93-3.01 2.26L11.5 18H14v2h6zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-3C9.57 12.5 8.5 13.57 8.5 15v7h2v-7h2v7h2v-7c0-1.43-1.07-2.5-2.5-2.5z" />
            </svg>
          </button>

          {/* 更多操作按钮 */}
          <button
            className={`${prefixCls}-action-btn ${prefixCls}-more-btn`}
            onClick={onMoreActions}
            title="更多操作"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallKitHeader;
