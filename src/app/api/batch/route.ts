import { NextRequest, NextResponse } from 'next/server';
import { deleteTasksBatch } from '@/lib/data';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...init?.headers,
    },
  });
}

export async function DELETE(request: NextRequest) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, { status: 400 }); }
  
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return json({ error: 'Task IDs array is required' }, { status: 400 });
  }
  
  deleteTasksBatch(body.ids);
  return json({ success: true, count: body.ids.length });
}
