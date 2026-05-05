import { NextRequest, NextResponse } from 'next/server';
import { getTasksForView } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (!view) {
    return NextResponse.json({ error: 'View parameter required' }, { status: 400 });
  }

  const tasks = getTasksForView(view);
  return NextResponse.json(tasks);
}