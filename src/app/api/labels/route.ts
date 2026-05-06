import { NextRequest, NextResponse } from 'next/server';
import { getLabels, createLabel, updateLabel, deleteLabel } from '@/lib/data';

export async function GET() {
  const labels = getLabels();
  return NextResponse.json(labels);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Label name is required' }, { status: 400 });
  }
  const label = createLabel({
    name: body.name.trim(),
    color: body.color || '#6366f1',
    icon: body.icon || '🏷️',
  });
  return NextResponse.json(label, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Label ID is required' }, { status: 400 });
  }
  const label = updateLabel(body.id, body);
  if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 });
  return NextResponse.json(label);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Label ID is required' }, { status: 400 });
  }
  deleteLabel(body.id);
  return NextResponse.json({ success: true });
}
