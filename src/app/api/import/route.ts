import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.version || !body.tasks) {
    return NextResponse.json({ error: 'Invalid import format. Expected version and tasks.' }, { status: 400 });
  }

  const db = getDb();

  const result = db.transaction(() => {
    const stats = { lists: 0, labels: 0, tasks: 0, subtasks: 0, taskLabels: 0, reminders: 0 };

    // Import lists
    if (body.lists) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO lists (id, name, color, icon, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const list of body.lists) {
        stmt.run(list.id, list.name, list.color, list.icon, list.is_default || 0, list.created_at, list.updated_at);
        stats.lists++;
      }
    }

    // Import labels
    if (body.labels) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO labels (id, name, color, icon, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const label of body.labels) {
        stmt.run(label.id, label.name, label.color, label.icon, label.created_at);
        stats.labels++;
      }
    }

    // Import tasks
    if (body.tasks) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tasks (id, name, description, date, deadline, estimate, actual_time, priority, list_id, recurrence, completed, completed_at, pinned, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const task of body.tasks) {
        stmt.run(
          task.id, task.name, task.description || '', task.date || null,
          task.deadline || null, task.estimate || null, task.actual_time || null,
          task.priority || 'none', task.list_id || 'inbox', task.recurrence || null,
          task.completed ? 1 : 0, task.completed_at || null, task.pinned ? 1 : 0,
          task.position ?? 0, task.created_at, task.updated_at
        );
        stats.tasks++;
      }
    }

    // Import subtasks
    if (body.subtasks) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO subtasks (id, task_id, title, completed, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const st of body.subtasks) {
        stmt.run(st.id, st.task_id, st.title, st.completed ? 1 : 0, st.created_at);
        stats.subtasks++;
      }
    }

    // Import task_labels
    if (body.taskLabels) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO task_labels (task_id, label_id)
        VALUES (?, ?)
      `);
      for (const tl of body.taskLabels) {
        stmt.run(tl.task_id, tl.label_id);
        stats.taskLabels++;
      }
    }

    // Import reminders
    if (body.reminders) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO reminders (id, task_id, time, type, sent)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const r of body.reminders) {
        stmt.run(r.id, r.task_id, r.time, r.type || 'notification', r.sent ? 1 : 0);
        stats.reminders++;
      }
    }

    return stats;
  })();

  return NextResponse.json({ success: true, imported: result });
}
