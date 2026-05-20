import { NextRequest, NextResponse } from 'next/server';
import { getLabels, createLabel, updateLabel, deleteLabel } from '@/lib/data';

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
  return json(getLabels());
}

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return json({ error: 'Label name is required' }, { status: 400 });
  }
  return json(createLabel({
    name: body.name.trim(),
    color: body.color || '#6366f1',
    icon: body.icon || '🏷️',
  }), { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'Label ID is required' }, { status: 400 });
  }
  const label = updateLabel(body.id, body);
  if (!label) return json({ error: 'Label not found' }, { status: 404 });
  return json(label);
}

export async function DELETE(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body.id) {
    return json({ error: 'Label ID is required' }, { status: 400 });
  }
  deleteLabel(body.id);
  return json({ success: true });
}
