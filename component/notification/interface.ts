import React from 'react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export type NotificationPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight';

export interface NotificationConfig {
  /** 通知提醒标题，必选 */
  message: React.ReactNode;
  /** 通知提醒内容，必选 */
  description?: React.ReactNode;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 通知类型 */
  type?: NotificationType;
  /** 自动关闭的延时，单位秒。设为 0 时不自动关闭 */
  duration?: number;
  /** 点击通知时触发的回调函数 */
  onClick?: () => void;
  /** 当通知关闭时触发 */
  onClose?: () => void;
  /** 自定义 CSS class */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;
  /** 当前通知唯一标志 */
  key?: string | number;
  /** 自定义关闭按钮 */
  closeIcon?: React.ReactNode;
  /** 是否显示关闭按钮 */
  closable?: boolean;
}

export interface NotificationInstance {
  /** 打开通知 */
  open: (config: NotificationConfig) => void;
  /** 成功通知 */
  success: (config: Omit<NotificationConfig, 'type'>) => void;
  /** 信息通知 */
  info: (config: Omit<NotificationConfig, 'type'>) => void;
  /** 警告通知 */
  warning: (config: Omit<NotificationConfig, 'type'>) => void;
  /** 错误通知 */
  error: (config: Omit<NotificationConfig, 'type'>) => void;
  /** 关闭指定通知 */
  destroy: (key?: string | number) => void;
  /** 关闭所有通知 */
  destroyAll: () => void;
}

export interface NotificationProps {
  /** 弹出位置 */
  placement?: NotificationPlacement;
  /** 距离顶部的位置，单位像素 */
  top?: number;
  /** 距离底部的位置，单位像素 */
  bottom?: number;
  /** 默认自动关闭延时，单位秒 */
  duration?: number;
  /** 配置渲染节点的输出位置 */
  getContainer?: () => HTMLElement;
  /** 最大显示数，超过限制时，最早的消息会被自动关闭 */
  maxCount?: number;
  /** 是否开启 RTL 模式 */
  rtl?: boolean;
}

export interface NotificationItemProps extends NotificationConfig {
  /** 通知唯一标识 */
  id: string;
  /** 移除通知的回调 */
  onRemove: (id: string) => void;
  /** 弹出位置 */
  placement: NotificationPlacement;
}

export type UseNotificationResult = [NotificationInstance, React.ReactElement];
