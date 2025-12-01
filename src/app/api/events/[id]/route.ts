import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEventById, updateEvent, deleteEvent } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: '事项不存在' }, { status: 404 });
    }

    if (event.userId !== user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: '获取事项失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: '事项不存在' }, { status: 404 });
    }

    if (event.userId !== user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '事项名称不能为空' },
        { status: 400 }
      );
    }

    const updatedEvent = {
      ...event,
      name: name.trim(),
      description: description?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await updateEvent(updatedEvent);

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: '更新事项失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: '事项不存在' }, { status: 404 });
    }

    if (event.userId !== user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await deleteEvent(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: '删除事项失败' },
      { status: 500 }
    );
  }
}
