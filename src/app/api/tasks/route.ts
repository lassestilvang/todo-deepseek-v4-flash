import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, getTasksForView, toggleSubtask, togglePinTask, reorderSubtasks, getTaskLight, incrementTaskActualTime, getTask } from '@/lib/data';
import type { Priority } from '@/types';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...init?.headers,
    },
  });
}

function parseBody(request: NextRequest): Promise<unknown> {
  return request.json();
}

const VALID_VIEWS = new Set(['today', 'next-7-days', 'upcoming', 'all']);
const VALID_PRIORITIES = new Set<Priority>(['none', 'low', 'medium', 'high']);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const view = searchParams.get('view');
  const listId = searchParams.get('listId');
  const labelId = searchParams.get('labelId');
  const date = searchParams.get('date');
  const completed = searchParams.get('completed');

  if (id) {
    if (typeof id !== 'string' || id.length < 1) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }
    const task = getTask(id);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }

  if (view) {
    if (typeof view !== 'string' || !VALID_VIEWS.has(view)) {
      return json({ error: `Invalid view. Must be one of: ${[...VALID_VIEWS].join(', ')}` }, { status: 400 });
    }
    return json(getTasksForView(view));
  }

  return json(getTasks({
    listId: listId || undefined,
    labelId: labelId || undefined,
    date: date || undefined,
    completed: completed !== null ? completed === 'true' : undefined,
    includeAttachments: false,
    includeReminders: false,
  }));
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await parseBody(request) as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return json({ error: 'Task name is required' }, { status: 400 });
  }
  if (body.name.trim().length > 500) {
    return json({ error: 'Task name is too long (max 500 characters)' }, { status: 400 });
  }
  if (body.description && typeof body.description === 'string' && body.description.length > 5000) {
    return json({ error: 'Task description is too long (max 5000 characters)' }, { status: 400 });
  }
  
  return json(createTask(body as Parameters<typeof createTask>[0]), { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await parseBody(request) as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!body.id || typeof body.id !== 'string') {
    return json({ error: 'Task ID is required' }, { status: 400 });
  }
  
  if (body._action === 'toggle') {
    const task = toggleTaskCompletion(body.id);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }
  if (body._action === 'toggle-subtask') {
    if (!body.subtaskId || typeof body.subtaskId !== 'string') return json({ error: 'Subtask ID is required' }, { status: 400 });
    const subtask = toggleSubtask(body.subtaskId);
    if (!subtask) return json({ error: 'Subtask not found' }, { status: 404 });
    return json(subtask);
  }
  if (body._action === 'toggle-pin') {
    const task = togglePinTask(body.id);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }
  if (body._action === 'reorder-subtasks') {
    if (!Array.isArray(body.subtaskIds) || body.subtaskIds.some(id => typeof id !== 'string')) {
      return json({ error: 'subtaskIds array of strings is required' }, { status: 400 });
    }
    reorderSubtasks(body.id, body.subtaskIds as string[]);
    const task = getTaskLight(body.id);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }
  if (body._action === 'increment-actual-time') {
    if (typeof body.minutes !== 'number' || body.minutes < 0 || body.minutes > 1440) {
      return json({ error: 'minutes must be a number between 0 and 1440' }, { status: 400 });
    }
    const task = incrementTaskActualTime(body.id, body.minutes);
    if (!task) return json({ error: 'Task not found' }, { status: 404 });
    return json(task);
  }
  
  if (body.priority !== undefined && !VALID_PRIORITIES.has(body.priority as Priority)) {
    return json({ error: `Invalid priority. Must be one of: ${[...VALID_PRIORITIES].join(', ')}` }, { status: 400 });
  }
  
  const task = updateTask(body.id, body as Parameters<typeof updateTask>[1]);
  if (!task) return json({ error: 'Task not found' }, { status: 404 });
  return json(task);
}

export async function DELETE(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await parseBody(request) as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!body.id || typeof body.id !== 'string') {
    return json({ error: 'Task ID is required' }, { status: 400 });
  }
  deleteTask(body.id);
  return json({ success: true });
}
