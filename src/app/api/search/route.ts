import { NextRequest } from 'next/server';
import { searchTasks } from '@/lib/data';

const MAX_SEARCH_LENGTH = 200;

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-cache, must-revalidate',
      ...init?.headers,
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return json([]);
  }

  if (q.length > MAX_SEARCH_LENGTH) {
    return json({ error: `Search query too long (max ${MAX_SEARCH_LENGTH} characters)` }, { status: 400 });
  }

  return json(searchTasks(q.slice(0, MAX_SEARCH_LENGTH)));
}
