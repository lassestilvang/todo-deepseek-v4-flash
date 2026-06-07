'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { List, Label } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const subscribers = new Map<string, Set<() => void>>();
// Request deduplication map — prevents duplicate in-flight requests for the same key
const inflightRequests = new Map<string, Promise<unknown>>();
const TTL = 30000; // 30 seconds for task data
const STATIC_TTL = 300000; // 5 minutes for lists/labels (rarely change)

// Debounce map to prevent rapid successive invalidations
const invalidationTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notify(key: string) {
  subscribers.get(key)?.forEach(fn => fn());
}

export function invalidateCache(pattern: string) {
  // Clear existing timer for this pattern
  if (invalidationTimers.has(pattern)) {
    clearTimeout(invalidationTimers.get(pattern)!);
  }

  invalidationTimers.set(pattern, setTimeout(() => {
    invalidationTimers.delete(pattern);
    for (const key of cache.keys()) {
      if (key.startsWith(pattern)) {
        cache.delete(key);
        notify(key);
      }
    }
  }, 80));
}

export function invalidateCacheImmediate(pattern: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
      notify(key);
    }
  }
}

export function clearAllCache() {
  cache.clear();
  for (const key of subscribers.keys()) {
    notify(key);
  }
}

function getCached<T>(key: string, isStatic: boolean = false): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const ttl = isStatic ? STATIC_TTL : TTL;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
  notify(key);
  // Clean up any inflight request for this key
  inflightRequests.delete(key);
}

function subscribe(key: string, fn: () => void) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(fn);
  return () => {
    subscribers.get(key)?.delete(fn);
    if (subscribers.get(key)?.size === 0) subscribers.delete(key);
  };
}

export function useCachedFetch<T>(url: string | null, key: string, options?: { staticCache?: boolean }): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(() => url ? getCached<T>(key, options?.staticCache) : null);
  const [loading, setLoading] = useState(!data && !!url);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const fetchVersionRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!url) return;
    const cached = getCached<T>(key, options?.staticCache);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const version = ++fetchVersionRef.current;

    // Request deduplication — reuse in-flight promise if available
    let requestPromise = inflightRequests.get(key) as Promise<T> | undefined;
    if (!requestPromise) {
      requestPromise = (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })();
      inflightRequests.set(key, requestPromise);
      // Clean up on completion regardless of success/failure
      requestPromise.finally(() => {
        if (inflightRequests.get(key) === requestPromise) {
          inflightRequests.delete(key);
        }
      });
    }

    try {
      const json = await requestPromise;
      if (!mountedRef.current || version !== fetchVersionRef.current) return;
      setCached(key, json);
      setData(json);
    } catch (e) {
      if (!mountedRef.current || version !== fetchVersionRef.current) return;
      setError(e as Error);
    } finally {
      if (mountedRef.current && version === fetchVersionRef.current) setLoading(false);
    }
  }, [url, key, options?.staticCache]);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data fetching pattern
    fetchData();
    const unsub = subscribe(key, () => {
      const updated = getCached<T>(key);
      if (updated) setData(updated);
    });
    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [fetchData, key]);

  return { data, loading, error, refresh: fetchData };
}

export function useListCache() {
  const { data: lists, loading, error, refresh } = useCachedFetch<List[]>('/api/lists', 'lists', { staticCache: true });
  return { lists: lists || [], loading, error, refresh };
}

export function useLabelCache() {
  const { data: labels, loading, error, refresh } = useCachedFetch<Label[]>('/api/labels', 'labels', { staticCache: true });
  return { labels: labels || [], loading, error, refresh };
}

export interface TaskCounts {
  total: number;
  today: number;
  upcoming: number;
  next7Days: number;
  overdue: number;
  byList: Record<string, number>;
  byLabel: Record<string, number>;
  timeByList: Record<string, number>;
  completedToday: number;
  completedThisWeek: number;
  streak: number;
  weeklyCompletions: { day: string; count: number }[];
}

export function useTaskCounts() {
  const { data: counts, refresh } = useCachedFetch<TaskCounts>('/api/counts', 'task-counts');
  return { counts: counts || { total: 0, today: 0, upcoming: 0, next7Days: 0, overdue: 0, byList: {}, byLabel: {}, timeByList: {}, completedToday: 0, completedThisWeek: 0, streak: 0, weeklyCompletions: [] }, refresh };
}
