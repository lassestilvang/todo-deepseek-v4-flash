import { NextRequest, NextResponse } from 'next/server';
import { searchTasks } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'private, no-cache, must-revalidate' },
    });
  }

  return NextResponse.json(searchTasks(q), {
    headers: { 'Cache-Control': 'private, no-cache, must-revalidate' },
  });
}
