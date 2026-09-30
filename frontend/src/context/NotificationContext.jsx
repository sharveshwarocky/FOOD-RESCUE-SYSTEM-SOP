import React, { createContext, useState, useEffect, useContext } from 'react';
import { notificationService } from '../services/notificationService';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter(n => !n.is_read).length);
      }
    } catch (e) {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (e) {
      // Silent fail
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
