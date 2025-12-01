import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEventsByUserId, createEvent } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const events = await getEventsByUserId(user.id);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: '获取事项列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '事项名称不能为空' },
        { status: 400 }
      );
    }

    const event = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createEvent(event);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: '创建事项失败' },
      { status: 500 }
    );
  }
}
