import { NextResponse } from 'next/server';
import { getTaskCounts } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getTaskCounts(), {
    headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
  });
}
