import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const lists = db.prepare('SELECT * FROM lists ORDER BY created_at').all();
  const labels = db.prepare('SELECT * FROM labels ORDER BY created_at').all();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at').all();
  const subtasks = db.prepare('SELECT * FROM subtasks ORDER BY created_at').all();
  const taskLabels = db.prepare('SELECT * FROM task_labels').all();
  const attachments = db.prepare('SELECT * FROM attachments ORDER BY created_at').all();
  const reminders = db.prepare('SELECT * FROM reminders ORDER BY time').all();

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: '1.0',
    lists,
    labels,
    tasks,
    subtasks,
    taskLabels,
    attachments,
    reminders,
  }, {
    headers: {
      'Cache-Control': 'private, no-cache, must-revalidate',
      'Content-Disposition': 'attachment; filename="planner-export.json"',
    },
  });
}
