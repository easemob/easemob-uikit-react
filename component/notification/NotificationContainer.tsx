import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { NotificationProps, NotificationItemProps } from './interface';
import NotificationItem from './NotificationItem';

interface NotificationContainerProps extends NotificationProps {
  notifications: (NotificationItemProps & { id: string })[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  placement = 'topRight',
  top = 20,
  bottom = 20,
  getContainer,
}) => {
  const prefixCls = 'cui-notification';

  // 根据位置计算样式
  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1050,
      pointerEvents: 'none',
    };

    switch (placement) {
      case 'top':
        return {
          ...baseStyle,
          top,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'topLeft':
        return {
          ...baseStyle,
          top,
          left: 20,
        };
      case 'topRight':
        return {
          ...baseStyle,
          top,
          right: 20,
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottomLeft':
        return {
          ...baseStyle,
          bottom,
          left: 20,
        };
      case 'bottomRight':
        return {
          ...baseStyle,
          bottom,
          right: 20,
        };
      default:
        return {
          ...baseStyle,
          top,
          right: 20,
        };
    }
  };

  const containerClass = classNames(prefixCls, `${prefixCls}-${placement}`);

  const container = getContainer ? getContainer() : document.body;

  if (notifications.length === 0) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={containerClass} style={getPositionStyle()}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          {...notification}
          placement={placement}
          onRemove={onRemove}
        />
      ))}
    </div>,
    container,
  );
};

export default NotificationContainer;
