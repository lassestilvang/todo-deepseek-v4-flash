'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/toast-provider';
import { usePathname } from 'next/navigation';

const CHECK_INTERVAL = 15_000;
const NOTIFICATION_KEY = 'planner-notification-permission-asked';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const pathname = usePathname();
  const shownRef = useRef<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const wasOfflineRef = useRef(false);

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        toast('Back online! Your data is syncing.', 'success');
        wasOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      toast('You are offline. Changes will sync when reconnected.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Reminder checking
  useEffect(() => {
    const checkReminders = async () => {
      if (!navigator.onLine) return;
      try {
        const res = await fetch('/api/reminders');
        const reminders = await res.json();
        if (!Array.isArray(reminders) || reminders.length === 0) return;

        const sentIds: string[] = [];

        for (const r of reminders) {
          if (shownRef.current.has(r.id)) continue;
          shownRef.current.add(r.id);
          sentIds.push(r.id);

          const taskName = r.task_name || 'Untitled task';
          const timeStr = r.time ? new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

          // Show in-app toast
          toast(`🔔 ${taskName}`, 'info');

          // Fire browser notification if permitted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification('Daily Planner', {
              body: taskName,
              icon: '/icon.svg',
              tag: `reminder-${r.id}`,
              data: { taskId: r.task_id, url: `/list/${r.task_id}` },
            });
            notification.onclick = (e) => {
              e.preventDefault();
              window.focus();
              if (notification.data?.url) {
                window.location.href = notification.data.url;
              }
            };
          }
        }

        if (sentIds.length > 0) {
          await fetch('/api/reminders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: sentIds }),
          });
        }
      } catch {
        // Silent fail — reminders check is best-effort
      }
    };

    const requestPermission = async () => {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
      const asked = localStorage.getItem(NOTIFICATION_KEY);
      if (asked) return;
      localStorage.setItem(NOTIFICATION_KEY, 'true');
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast('Notifications enabled! You\'ll get reminders for your tasks.', 'success');
      }
    };

    requestPermission();
    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [toast]);

  return <>{children}</>;
}
