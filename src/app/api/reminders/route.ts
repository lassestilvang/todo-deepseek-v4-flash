import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate', ...init?.headers },
  });
}

export async function GET() {
  const db = getDb();
  const now = new Date().toISOString();
  const fiveMinLater = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const reminders = db.prepare(`
    SELECT r.*, t.name as task_name
    FROM reminders r
    JOIN tasks t ON t.id = r.task_id
    WHERE r.time <= ? AND r.sent = 0
  `).all(fiveMinLater) as { id: string; task_id: string; time: string; type: string; task_name: string }[];

  return json(reminders);
}

export async function PUT(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { ids } = body;
  if (!Array.isArray(ids)) {
    return json({ error: 'ids array required' }, { status: 400 });
  }

  const db = getDb();
  const stmt = db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?');
  const markSent = db.transaction(() => {
    for (const id of ids) stmt.run(id);
  });
  markSent();
  return json({ success: true });
}
