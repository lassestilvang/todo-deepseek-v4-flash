import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

function dateFromDateOnly(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isToday(date: string): boolean {
  const d = dateFromDateOnly(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isTomorrow(date: string): boolean {
  const d = dateFromDateOnly(date);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

export function isOverdue(date: string): boolean {
  const d = dateFromDateOnly(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function parseEstimateToMinutes(estimate: string | null): number {
  if (!estimate) return 0;
  const [h, m] = estimate.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToEstimate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

export function formatRelativeDate(date: string): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  const d = dateFromDateOnly(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return formatDate(date);
}

export function formatEstimate(estimate: string): string {
  const parts = estimate.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}


/**
 * Parses natural language date references from the end of a task name.
 * Returns { cleanName, date } where cleanName has the date part removed.
 * Examples: "Buy groceries tomorrow" -> { cleanName: "Buy groceries", date: "2026-06-03" }
 *           "Meeting next monday" -> { cleanName: "Meeting", date: "2026-06-08" }
 *           "No date task" -> { cleanName: "No date task", date: null }
 */
export function parseNaturalDate(input: string): { cleanName: string; date: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { cleanName: trimmed, date: null };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayMap: Record<string, number> = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };

  const lower = trimmed.toLowerCase();

  // Pattern: "task name tomorrow" or "task name today"
  const relativeDayMatch = lower.match(
    /\s+(today|tomorrow|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))\s*$/i
  );
  if (relativeDayMatch) {
    const matched = relativeDayMatch[1].toLowerCase();
    const name = trimmed.slice(0, relativeDayMatch.index).trim();
    let date: Date;

    if (matched === 'today') {
      date = today;
    } else if (matched === 'tomorrow') {
      date = new Date(today);
      date.setDate(date.getDate() + 1);
    } else if (matched.startsWith('next ')) {
      const dayName = matched.slice(5);
      const targetDay = dayMap[dayName];
      if (targetDay !== undefined) {
        date = new Date(today);
        const currentDay = date.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        date.setDate(date.getDate() + daysUntil);
      } else {
        return { cleanName: trimmed, date: null };
      }
    } else {
      return { cleanName: trimmed, date: null };
    }

    return {
      cleanName: name,
      date: date.toISOString().split('T')[0],
    };
  }

  return { cleanName: trimmed, date: null };
}
