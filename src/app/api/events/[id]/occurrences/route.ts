import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEventById, getOccurrencesByEventId, createOccurrence, filterOccurrencesByDateRange } from '@/lib/db';

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

    let occurrences = await getOccurrencesByEventId(id);

    // 处理时间范围筛选
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999); // 包含结束日期整天
      occurrences = filterOccurrencesByDateRange(occurrences, startDate, endDate);
    }

    return NextResponse.json({
      occurrences,
      total: occurrences.length,
    });
  } catch (error) {
    console.error('Get occurrences error:', error);
    return NextResponse.json(
      { error: '获取发生记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { year, month, day, hour, minute, second, note } = await request.json();

    // 至少需要一个时间字段
    if (year === undefined && month === undefined && day === undefined &&
        hour === undefined && minute === undefined && second === undefined) {
      return NextResponse.json(
        { error: '请至少填写一个时间字段' },
        { status: 400 }
      );
    }

    // 验证时间字段的有效性
    if (year !== undefined && (year < 1 || year > 9999)) {
      return NextResponse.json({ error: '年份无效' }, { status: 400 });
    }
    if (month !== undefined && (month < 1 || month > 12)) {
      return NextResponse.json({ error: '月份无效 (1-12)' }, { status: 400 });
    }
    if (day !== undefined && (day < 1 || day > 31)) {
      return NextResponse.json({ error: '日期无效 (1-31)' }, { status: 400 });
    }
    if (hour !== undefined && (hour < 0 || hour > 23)) {
      return NextResponse.json({ error: '小时无效 (0-23)' }, { status: 400 });
    }
    if (minute !== undefined && (minute < 0 || minute > 59)) {
      return NextResponse.json({ error: '分钟无效 (0-59)' }, { status: 400 });
    }
    if (second !== undefined && (second < 0 || second > 59)) {
      return NextResponse.json({ error: '秒数无效 (0-59)' }, { status: 400 });
    }

    const occurrence = {
      id: crypto.randomUUID(),
      eventId: id,
      userId: user.id,
      year: year !== undefined ? Number(year) : undefined,
      month: month !== undefined ? Number(month) : undefined,
      day: day !== undefined ? Number(day) : undefined,
      hour: hour !== undefined ? Number(hour) : undefined,
      minute: minute !== undefined ? Number(minute) : undefined,
      second: second !== undefined ? Number(second) : undefined,
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createOccurrence(occurrence);

    return NextResponse.json({ success: true, occurrence });
  } catch (error) {
    console.error('Create occurrence error:', error);
    return NextResponse.json(
      { error: '创建发生记录失败' },
      { status: 500 }
    );
  }
}
