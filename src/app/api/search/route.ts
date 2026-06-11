import { NextRequest, NextResponse } from 'next/server';
import { searchTasks } from '@/lib/data';

const MAX_SEARCH_LENGTH = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'private, no-cache, must-revalidate' },
    });
  }

  if (q.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json({ error: `Search query too long (max ${MAX_SEARCH_LENGTH} characters)` }, { status: 400 });
  }

  return NextResponse.json(searchTasks(q.slice(0, MAX_SEARCH_LENGTH)), {
    headers: { 'Cache-Control': 'private, no-cache, must-revalidate' },
  });
}
