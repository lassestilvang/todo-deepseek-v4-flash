import { NextRequest, NextResponse } from 'next/server';
import { getLists, createList, updateList, deleteList } from '@/lib/data';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...init?.headers,
    },
  });
}

export async function GET() {
  return json(getLists());
}

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return json({ error: 'List name is required' }, { status: 400 });
  }
  return json(createList({
    name: body.name.trim(),
    color: body.color || '#6366f1',
    icon: body.icon || '📋',
  }), { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'List ID is required' }, { status: 400 });
  }
  const list = updateList(body.id, body);
  if (!list) return json({ error: 'List not found' }, { status: 404 });
  return json(list);
}

export async function DELETE(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'List ID is required' }, { status: 400 });
  }
  try {
    deleteList(body.id);
    return json({ success: true });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : 'Failed to delete list' }, { status: 400 });
  }
}
