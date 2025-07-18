import React, { useState, useCallback, useRef } from 'react';
import {
  NotificationConfig,
  NotificationInstance,
  NotificationProps,
  NotificationItemProps,
  UseNotificationResult,
} from './interface';
import NotificationContainer from './NotificationContainer';

let notificationId = 0;

const useNotification = (config: NotificationProps = {}): UseNotificationResult => {
  const [notifications, setNotifications] = useState<(NotificationItemProps & { id: string })[]>(
    [],
  );
  const configRef = useRef(config);

  // 更新配置
  configRef.current = config;

  // 生成唯一ID
  const getNotificationId = useCallback(() => {
    return `notification-${++notificationId}`;
  }, []);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 添加通知
  const addNotification = useCallback(
    (notificationConfig: NotificationConfig) => {
      const id = notificationConfig.key?.toString() || getNotificationId();
      const { maxCount } = configRef.current;

      const newNotification: NotificationItemProps & { id: string } = {
        id,
        message: notificationConfig.message,
        description: notificationConfig.description,
        icon: notificationConfig.icon,
        type: notificationConfig.type,
        duration: notificationConfig.duration ?? configRef.current.duration ?? 4.5,
        onClick: notificationConfig.onClick,
        onClose: notificationConfig.onClose,
        className: notificationConfig.className,
        style: notificationConfig.style,
        closeIcon: notificationConfig.closeIcon,
        closable: notificationConfig.closable,
        onRemove: removeNotification,
        placement: configRef.current.placement || 'topRight',
      };

      setNotifications(prev => {
        // 如果key已存在，更新现有通知
        const existingIndex = prev.findIndex(notification => notification.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newNotification;
          return updated;
        }

        // 添加新通知
        let newNotifications = [...prev, newNotification];

        // 如果超过最大数量，移除最早的通知
        if (maxCount && newNotifications.length > maxCount) {
          newNotifications = newNotifications.slice(-maxCount);
        }

        return newNotifications;
      });
    },
    [getNotificationId, removeNotification],
  );

  // 销毁指定通知
  const destroy = useCallback(
    (key?: string | number) => {
      if (key !== undefined) {
        const id = key.toString();
        removeNotification(id);
      }
    },
    [removeNotification],
  );

  // 销毁所有通知
  const destroyAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 创建通知实例方法
  const notificationInstance: NotificationInstance = {
    open: addNotification,
    success: config => addNotification({ ...config, type: 'success' }),
    info: config => addNotification({ ...config, type: 'info' }),
    warning: config => addNotification({ ...config, type: 'warning' }),
    error: config => addNotification({ ...config, type: 'error' }),
    destroy,
    destroyAll,
  };

  // Context Holder 组件
  const contextHolder = (
    <NotificationContainer
      {...configRef.current}
      notifications={notifications}
      onRemove={removeNotification}
    />
  );

  return [notificationInstance, contextHolder];
};

export default useNotification;
