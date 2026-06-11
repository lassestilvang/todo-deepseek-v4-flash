import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB limit
const MAX_ITEMS = 10000; // Safety limit on total imported items

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_IMPORT_SIZE) {
    return NextResponse.json({ error: 'Import file too large (max 10MB)' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.tasks || !Array.isArray(body.tasks)) {
    return NextResponse.json({ error: 'Invalid import format. Expected tasks array.' }, { status: 400 });
  }

  const totalItems = (body.tasks as unknown[]).length +
    (Array.isArray(body.lists) ? (body.lists as unknown[]).length : 0) +
    (Array.isArray(body.labels) ? (body.labels as unknown[]).length : 0) +
    (Array.isArray(body.subtasks) ? (body.subtasks as unknown[]).length : 0);
  
  if (totalItems > MAX_ITEMS) {
    return NextResponse.json({ error: `Too many items to import (max ${MAX_ITEMS})` }, { status: 400 });
  }

  const db = getDb();

  const result = db.transaction(() => {
    const stats = { lists: 0, labels: 0, tasks: 0, subtasks: 0, taskLabels: 0, reminders: 0 };

    // Import lists
    if (Array.isArray(body.lists)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO lists (id, name, color, icon, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const list of body.lists as Record<string, unknown>[]) {
        if (!list.id || !list.name) continue;
        stmt.run(list.id, list.name, list.color || '#6366f1', list.icon || '📋', list.is_default ? 1 : 0, list.created_at || new Date().toISOString(), list.updated_at || new Date().toISOString());
        stats.lists++;
      }
    }

    // Import labels
    if (Array.isArray(body.labels)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO labels (id, name, color, icon, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const label of body.labels as Record<string, unknown>[]) {
        if (!label.id || !label.name) continue;
        stmt.run(label.id, label.name, label.color || '#6366f1', label.icon || '🏷️', label.created_at || new Date().toISOString());
        stats.labels++;
      }
    }

    // Import tasks
    if (Array.isArray(body.tasks)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tasks (id, name, description, date, deadline, estimate, actual_time, priority, list_id, recurrence, completed, completed_at, pinned, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const task of body.tasks as Record<string, unknown>[]) {
        if (!task.id || !task.name) continue;
        stmt.run(
          task.id, task.name, String(task.description || ''), task.date || null,
          task.deadline || null, task.estimate || null, task.actual_time || null,
          String(task.priority || 'none'), String(task.list_id || 'inbox'), task.recurrence ? JSON.stringify(task.recurrence) : null,
          task.completed ? 1 : 0, task.completed_at || null, task.pinned ? 1 : 0,
          typeof task.position === 'number' ? task.position : 0, task.created_at || new Date().toISOString(), task.updated_at || new Date().toISOString()
        );
        stats.tasks++;
      }
    }

    // Import subtasks (with position support)
    if (Array.isArray(body.subtasks)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO subtasks (id, task_id, title, completed, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const st of body.subtasks as Record<string, unknown>[]) {
        if (!st.id || !st.task_id) continue;
        stmt.run(st.id, st.task_id, st.title || '', st.completed ? 1 : 0, typeof st.position === 'number' ? st.position : 0, st.created_at || new Date().toISOString());
        stats.subtasks++;
      }
    }

    // Import task_labels
    if (Array.isArray(body.taskLabels)) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO task_labels (task_id, label_id)
        VALUES (?, ?)
      `);
      for (const tl of body.taskLabels as Record<string, unknown>[]) {
        if (!tl.task_id || !tl.label_id) continue;
        stmt.run(tl.task_id, tl.label_id);
        stats.taskLabels++;
      }
    }

    // Import reminders
    if (Array.isArray(body.reminders)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO reminders (id, task_id, time, type, sent)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const r of body.reminders as Record<string, unknown>[]) {
        if (!r.id || !r.task_id) continue;
        stmt.run(r.id, r.task_id, r.time || new Date().toISOString(), String(r.type || 'notification'), r.sent ? 1 : 0);
        stats.reminders++;
      }
    }

    return stats;
  })();

  return NextResponse.json({ success: true, imported: result });
}
