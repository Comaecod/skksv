import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToNotifications } from '../services/notificationService';

const READ_KEY = 'skksv_read_notifications';
const CLEARED_KEY = 'skksv_cleared_notifications';

const NotificationContext = createContext(null);

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => loadSet(READ_KEY));
  const [clearedIds, setClearedIds] = useState(() => loadSet(CLEARED_KEY));
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const clearedRef = useRef(clearedIds);

  useEffect(() => {
    clearedRef.current = clearedIds;
  }, [clearedIds]);

  useEffect(() => {
    const cleared = loadSet(CLEARED_KEY);
    setLoading(true);

    unsubRef.current = subscribeToNotifications((list) => {
      const currentCleared = clearedRef.current;
      const filtered = list.filter(n => !currentCleared.has(n.id));
      setNotifications(filtered);
      setLoading(false);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  useEffect(() => {
    saveSet(READ_KEY, readIds);
  }, [readIds]);

  useEffect(() => {
    saveSet(CLEARED_KEY, clearedIds);
  }, [clearedIds]);

  const visibleNotifications = notifications.filter(n => !clearedIds.has(n.id));
  const unreadCount = visibleNotifications.filter(n => !readIds.has(n.id)).length;

  const markAsRead = useCallback((id) => {
    setReadIds(prev => new Set([...prev, id]));
  }, []);

  const markAsUnread = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearNotification = useCallback((id) => {
    setClearedIds(prev => new Set([...prev, id]));
  }, []);

  const clearAll = useCallback(() => {
    const allIds = visibleNotifications.map(n => n.id);
    setClearedIds(prev => new Set([...prev, ...allIds]));
  }, [visibleNotifications]);

  const isRead = useCallback((id) => readIds.has(id), [readIds]);
  const isCleared = useCallback((id) => clearedIds.has(id), [clearedIds]);

  return (
    <NotificationContext.Provider value={{
      notifications: visibleNotifications,
      loading,
      unreadCount,
      markAsRead,
      markAsUnread,
      clearNotification,
      clearAll,
      isRead,
      isCleared,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;