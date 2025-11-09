'use client';

import { useNotifications, NotificationType } from '@/contexts/NotificationContext';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getColors = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900 border-green-700 text-green-100';
      case 'error':
        return 'bg-red-900 border-red-700 text-red-100';
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-100';
      case 'info':
        return 'bg-blue-900 border-blue-700 text-blue-100';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm animate-slide-in ${getColors(
            notification.type
          )}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{getIcon(notification.type)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-lg mb-1">{notification.title}</h4>
              {notification.message && (
                <p className="text-sm opacity-90">{notification.message}</p>
              )}
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action?.onClick();
                    removeNotification(notification.id);
                  }}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-xl flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
