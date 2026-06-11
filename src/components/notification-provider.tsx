'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/toast-provider';

const CHECK_INTERVAL = 15_000;
const NOTIFICATION_KEY = 'planner-notification-permission-asked';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const shownRef = useRef<Set<string>>(new Set());
  const wasOfflineRef = useRef(true);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        toast('Back online! Your data is syncing.', 'success');
        wasOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
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
