import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end dates required' }, { status: 400 });
  }

  const tasks = getTasks({
    startDate: start,
    endDate: end,
    includeUndated: false,
  });

  return NextResponse.json(tasks);
}
