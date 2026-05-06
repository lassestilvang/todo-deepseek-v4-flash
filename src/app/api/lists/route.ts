import { NextRequest, NextResponse } from 'next/server';
import { getLists, createList, updateList, deleteList } from '@/lib/data';

export async function GET() {
  const lists = getLists();
  return NextResponse.json(lists);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'List name is required' }, { status: 400 });
  }
  const list = createList({
    name: body.name.trim(),
    color: body.color || '#6366f1',
    icon: body.icon || '📋',
  });
  return NextResponse.json(list, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
  }
  const list = updateList(body.id, body);
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });
  return NextResponse.json(list);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
  }
  try {
    deleteList(body.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
