'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();
const subscribers = new Map<string, Set<() => void>>();
const TTL = 30000;

function notify(key: string) {
  subscribers.get(key)?.forEach(fn => fn());
}

export function invalidateCache(pattern: string) {
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

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
  notify(key);
}

function subscribe(key: string, fn: () => void) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(fn);
  return () => {
    subscribers.get(key)?.delete(fn);
    if (subscribers.get(key)?.size === 0) subscribers.delete(key);
  };
}

export function useCachedFetch<T>(url: string | null, key: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(() => url ? getCached<T>(key) : null);
  const [loading, setLoading] = useState(!data && !!url);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!url) return;
    const cached = getCached<T>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!mountedRef.current) return;
      setCached(key, json);
      setData(json);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e as Error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url, key]);

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
  const { data: lists, loading, error, refresh } = useCachedFetch<List[]>('/api/lists', 'lists');
  return { lists: lists || [], loading, error, refresh };
}

export function useLabelCache() {
  const { data: labels, loading, error, refresh } = useCachedFetch<Label[]>('/api/labels', 'labels');
  return { labels: labels || [], loading, error, refresh };
}

import type { List, Label } from '@/types';

export interface TaskCounts {
  total: number;
  today: number;
  upcoming: number;
  next7Days: number;
  byList: Record<string, number>;
  byLabel: Record<string, number>;
}

export function useTaskCounts() {
  const { data: counts, refresh } = useCachedFetch<TaskCounts>('/api/counts', 'task-counts');
  return { counts: counts || { total: 0, today: 0, upcoming: 0, next7Days: 0, byList: {}, byLabel: {} }, refresh };
}
