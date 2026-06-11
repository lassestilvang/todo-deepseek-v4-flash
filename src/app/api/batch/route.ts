import { NextRequest, NextResponse } from 'next/server';
import { deleteTasksBatch, updateTasksBatch } from '@/lib/data';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...init?.headers,
    },
  });
}

const MAX_BATCH_SIZE = 200;

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return json({ error: 'Task IDs array is required' }, { status: 400 });
  }
  
  if (body.ids.length > MAX_BATCH_SIZE) {
    return json({ error: `Batch size cannot exceed ${MAX_BATCH_SIZE} tasks` }, { status: 400 });
  }

  if (body.ids.some((id: unknown) => typeof id !== 'string')) {
    return json({ error: 'All task IDs must be strings' }, { status: 400 });
  }

  if (body.data && typeof body.data === 'object') {
    const data = body.data as Record<string, unknown>;
    if (data.priority !== undefined && !['none', 'low', 'medium', 'high'].includes(data.priority as string)) {
      return json({ error: 'Invalid priority value' }, { status: 400 });
    }
  }
  
  updateTasksBatch(body.ids as string[], body.data as Parameters<typeof updateTasksBatch>[1]);
  return json({ success: true, count: (body.ids as string[]).length });
}

export async function DELETE(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return json({ error: 'Task IDs array is required' }, { status: 400 });
  }
  
  if (body.ids.length > MAX_BATCH_SIZE) {
    return json({ error: `Batch size cannot exceed ${MAX_BATCH_SIZE} tasks` }, { status: 400 });
  }

  if (body.ids.some((id: unknown) => typeof id !== 'string')) {
    return json({ error: 'All task IDs must be strings' }, { status: 400 });
  }
  
  deleteTasksBatch(body.ids as string[]);
  return json({ success: true, count: (body.ids as string[]).length });
}
