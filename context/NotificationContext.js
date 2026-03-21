'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [lastLockExpiry, setLastLockExpiry] = useState(null);
  const normalizedUserId = user?.userId || user?.id || user?._id;

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`notifications_${normalizedUserId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, [normalizedUserId]);

  // Sync with local storage
  useEffect(() => {
    if (normalizedUserId) {
      localStorage.setItem(`notifications_${normalizedUserId}`, JSON.stringify(notifications));
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications, normalizedUserId]);

  useEffect(() => {
    if (!normalizedUserId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('identify', { userId: normalizedUserId });
    });

    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [
        { ...notification, read: false, id: Date.now() },
        ...prev
      ].slice(0, 50)); // Keep last 50
    });

    newSocket.on('doctor-rating-updated', (data) => {
      setLastRatingUpdate(data);
    });

    newSocket.on('lock-expired', (data) => {
      console.log('🔄 Lock expired (Socket):', data);
      setLastLockExpiry(data);
    });

    return () => newSocket.disconnect();
  }, [normalizedUserId]);

  const [lastRatingUpdate, setLastRatingUpdate] = useState(null);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications,
      markAllAsRead, 
      clearNotifications,
      lastRatingUpdate,
      lastLockExpiry
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
