import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, getTasksForView } from '@/lib/data';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...init?.headers,
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  const listId = searchParams.get('listId');
  const labelId = searchParams.get('labelId');
  const date = searchParams.get('date');
  const completed = searchParams.get('completed');

  if (view) {
    return json(getTasksForView(view));
  }

  return json(getTasks({
    listId: listId || undefined,
    labelId: labelId || undefined,
    date: date || undefined,
    completed: completed !== null ? completed === 'true' : undefined,
  }));
}

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return json({ error: 'Task name is required' }, { status: 400 });
  }
  return json(createTask(body), { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'Task ID is required' }, { status: 400 });
  }
  if (body._action === 'toggle') {
    const task = toggleTaskCompletion(body.id);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }
  const task = updateTask(body.id, body);
  if (!task) return json({ error: 'Task not found' }, { status: 404 });
  return json(task);
}

export async function DELETE(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'Task ID is required' }, { status: 400 });
  }
  deleteTask(body.id);
  return json({ success: true });
}
