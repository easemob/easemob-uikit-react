import React, { useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { NotificationItemProps } from './interface';
import Icon from '../icon';

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  message,
  description,
  icon,
  type = 'info',
  duration = 4.5,
  onClick,
  onClose,
  onRemove,
  className,
  style,
  closeIcon,
  closable = true,
  placement,
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const nodeRef = useRef<HTMLDivElement>(null);

  // 默认图标映射
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <Icon type="CHECK_IN_CIRCLE_FILL" color="#52c41a" />;
      case 'info':
        return <Icon type="EXCLAMATION_MARK_IN_CIRCLE" color="#1890ff" />;
      case 'warning':
        return <Icon type="EXCLAMATION_MARK_IN_CIRCLE_FILL" color="#faad14" />;
      case 'error':
        return <Icon type="CLOSE_CIRCLE" color="#ff4d4f" />;
      default:
        return <Icon type="EXCLAMATION_MARK_IN_CIRCLE" color="#1890ff" />;
    }
  };

  // 设置自动关闭定时器
  const setAutoCloseTimer = () => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration * 1000);
    }
  };

  // 清除定时器
  const clearAutoCloseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  // 处理关闭
  const handleClose = () => {
    clearAutoCloseTimer();
    setLeaving(true);
    onClose?.();

    // 等待动画完成后移除
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  // 处理点击
  const handleClick = () => {
    onClick?.();
  };

  // 鼠标悬停暂停自动关闭
  const handleMouseEnter = () => {
    clearAutoCloseTimer();
  };

  // 鼠标离开恢复自动关闭
  const handleMouseLeave = () => {
    setAutoCloseTimer();
  };

  // 组件挂载时的入场动画
  useEffect(() => {
    // 延迟一帧开始动画，确保元素已渲染
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10);

    // 设置自动关闭定时器
    setAutoCloseTimer();

    return () => {
      clearTimeout(timer);
      clearAutoCloseTimer();
    };
  }, []);

  const prefixCls = 'cui-notification';

  const notificationClass = classNames(
    `${prefixCls}-notice`,
    `${prefixCls}-notice-${type}`,
    {
      [`${prefixCls}-notice-visible`]: visible && !leaving,
      [`${prefixCls}-notice-leaving`]: leaving,
      [`${prefixCls}-notice-clickable`]: onClick,
    },
    className,
  );

  return (
    <div
      ref={nodeRef}
      className={notificationClass}
      style={style}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`${prefixCls}-notice-content`}>
        {/* 图标 */}
        {icon != null && (
          <div className={`${prefixCls}-notice-icon`}>{icon || getDefaultIcon()}</div>
        )}

        {/* 内容 */}
        <div className={`${prefixCls}-notice-message-wrapper`}>
          <div className={`${prefixCls}-notice-message`}>{message}</div>
          {description && <div className={`${prefixCls}-notice-description`}>{description}</div>}
        </div>

        {/* 关闭按钮 */}
        {closable && (
          <button
            type="button"
            className={`${prefixCls}-notice-close`}
            onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
          >
            {closeIcon || <Icon type="CLOSE" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
