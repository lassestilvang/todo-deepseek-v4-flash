import { NextRequest, NextResponse } from 'next/server';
import { getTasks, getTask, createTask, updateTask, deleteTask, toggleTaskCompletion, getTasksForView } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');
  const listId = searchParams.get('listId');
  const labelId = searchParams.get('labelId');
  const date = searchParams.get('date');
  const completed = searchParams.get('completed');

  if (view) {
    const tasks = getTasksForView(view);
    return NextResponse.json(tasks);
  }

  const tasks = getTasks({
    listId: listId || undefined,
    labelId: labelId || undefined,
    date: date || undefined,
    completed: completed !== null ? completed === 'true' : undefined,
  });
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = createTask(body);
  return NextResponse.json(task, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (body._action === 'toggle') {
    const task = toggleTaskCompletion(body.id);
    return NextResponse.json(task);
  }
  const task = updateTask(body.id, body);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  deleteTask(body.id);
  return NextResponse.json({ success: true });
}