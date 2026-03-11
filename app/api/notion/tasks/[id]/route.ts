import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask } from '@/lib/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task = await updateTask(id, body);
    if (!task) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
