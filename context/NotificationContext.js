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
  const [doctorPresence, setDoctorPresence] = useState({});
  const NORMALIZED_USER_ID = user?.id || user?._id || user?.userId;

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`notifications_${NORMALIZED_USER_ID}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, [NORMALIZED_USER_ID]);

  // Sync with local storage
  useEffect(() => {
    if (NORMALIZED_USER_ID) {
      localStorage.setItem(`notifications_${NORMALIZED_USER_ID}`, JSON.stringify(notifications));
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications, NORMALIZED_USER_ID]);

  useEffect(() => {
    if (!NORMALIZED_USER_ID) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      reconnection: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Signaling Socket Connected:', newSocket.id);
      
      const isManualOff = user?.role === 'doctor' 
        ? localStorage.getItem(`doctor_manual_offline_${NORMALIZED_USER_ID}`) === 'true'
        : undefined;

      newSocket.emit('identify', { 
        userId: NORMALIZED_USER_ID,
        manualOffline: isManualOff 
      });
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

    newSocket.on('doctor:status-changed', (data) => {
      const { doctorId, isOnline } = data;
      setDoctorPresence(prev => ({ ...prev, [doctorId]: isOnline }));
    });

    newSocket.on('lock-expired', (data) => {
      console.log('🔄 Lock expired (Socket):', data);
      setLastLockExpiry(data);
    });

    return () => newSocket.disconnect();
  }, [NORMALIZED_USER_ID]);

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
      lastLockExpiry,
      doctorPresence,
      socket
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
