import React, { createContext, useContext, useEffect } from 'react';
import { notification } from 'antd';
import type { NotificationInstance } from 'antd/es/notification/interface';
import { setNotify } from 'src/platform/notify';

interface NotificationContextType {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  api: NotificationInstance;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  const value: NotificationContextType = {
    success: (message: string, description?: string) => {
      api.success({
        message,
        description,
        duration: 4,
      });
    },
    error: (message: string, description?: string) => {
      api.error({
        message,
        description,
        duration: 6,
      });
    },
    warning: (message: string, description?: string) => {
      api.warning({
        message,
        description,
        duration: 5,
      });
    },
    info: (message: string, description?: string) => {
      api.info({
        message,
        description,
        duration: 4,
      });
    },
    api,
  };

  // Register the spine's platform-neutral notify adapter so portable hooks
  // (useCart, useUser, …) route their toasts through antd on web.
  useEffect(() => {
    setNotify({
      success: value.success,
      error: value.error,
      warning: value.warning,
      info: value.info,
    });
  }, [api]);

  return (
    <NotificationContext.Provider value={value}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
