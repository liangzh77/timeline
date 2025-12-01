import { kv } from '@vercel/kv';
import { User, Event, Occurrence } from './types';

// 用户相关操作
export async function getUserByUsername(username: string): Promise<User | null> {
  return await kv.get<User>(`user:${username}`);
}

export async function getUserById(id: string): Promise<User | null> {
  const username = await kv.get<string>(`userId:${id}`);
  if (!username) return null;
  return await kv.get<User>(`user:${username}`);
}

export async function createUser(user: User): Promise<void> {
  await kv.set(`user:${user.username}`, user);
  await kv.set(`userId:${user.id}`, user.username);
  await kv.sadd('users', user.username);
}

export async function updateUser(user: User): Promise<void> {
  await kv.set(`user:${user.username}`, user);
}

export async function getAllUsers(): Promise<User[]> {
  const usernames = await kv.smembers('users');
  const users: User[] = [];
  for (const username of usernames) {
    const user = await kv.get<User>(`user:${username}`);
    if (user) users.push(user);
  }
  return users;
}

// 事项相关操作
export async function getEventsByUserId(userId: string): Promise<Event[]> {
  const eventIds = await kv.smembers(`userEvents:${userId}`);
  const events: Event[] = [];
  for (const eventId of eventIds) {
    const event = await kv.get<Event>(`event:${eventId}`);
    if (event) events.push(event);
  }
  return events.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getEventById(eventId: string): Promise<Event | null> {
  return await kv.get<Event>(`event:${eventId}`);
}

export async function createEvent(event: Event): Promise<void> {
  await kv.set(`event:${event.id}`, event);
  await kv.sadd(`userEvents:${event.userId}`, event.id);
}

export async function updateEvent(event: Event): Promise<void> {
  await kv.set(`event:${event.id}`, event);
}

export async function deleteEvent(eventId: string, userId: string): Promise<void> {
  // 删除事项下的所有发生记录
  const occurrenceIds = await kv.smembers(`eventOccurrences:${eventId}`);
  for (const occId of occurrenceIds) {
    await kv.del(`occurrence:${occId}`);
  }
  await kv.del(`eventOccurrences:${eventId}`);

  // 删除事项
  await kv.del(`event:${eventId}`);
  await kv.srem(`userEvents:${userId}`, eventId);
}

// 发生记录相关操作
export async function getOccurrencesByEventId(eventId: string): Promise<Occurrence[]> {
  const occurrenceIds = await kv.smembers(`eventOccurrences:${eventId}`);
  const occurrences: Occurrence[] = [];
  for (const occId of occurrenceIds) {
    const occ = await kv.get<Occurrence>(`occurrence:${occId}`);
    if (occ) occurrences.push(occ);
  }
  // 按时间倒序排列
  return occurrences.sort((a, b) => {
    const dateA = occurrenceToDate(a);
    const dateB = occurrenceToDate(b);
    return dateB.getTime() - dateA.getTime();
  });
}

export async function getOccurrenceById(occId: string): Promise<Occurrence | null> {
  return await kv.get<Occurrence>(`occurrence:${occId}`);
}

export async function createOccurrence(occurrence: Occurrence): Promise<void> {
  await kv.set(`occurrence:${occurrence.id}`, occurrence);
  await kv.sadd(`eventOccurrences:${occurrence.eventId}`, occurrence.id);
}

export async function updateOccurrence(occurrence: Occurrence): Promise<void> {
  await kv.set(`occurrence:${occurrence.id}`, occurrence);
}

export async function deleteOccurrence(occId: string, eventId: string): Promise<void> {
  await kv.del(`occurrence:${occId}`);
  await kv.srem(`eventOccurrences:${eventId}`, occId);
}

// 辅助函数：将发生记录转换为 Date 对象（用于排序和筛选）
export function occurrenceToDate(occ: Occurrence): Date {
  return new Date(
    occ.year ?? 2000,
    (occ.month ?? 1) - 1,
    occ.day ?? 1,
    occ.hour ?? 0,
    occ.minute ?? 0,
    occ.second ?? 0
  );
}

// 筛选时间段内的发生记录
export function filterOccurrencesByDateRange(
  occurrences: Occurrence[],
  startDate: Date,
  endDate: Date
): Occurrence[] {
  return occurrences.filter(occ => {
    const date = occurrenceToDate(occ);
    return date >= startDate && date <= endDate;
  });
}
