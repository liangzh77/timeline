export interface User {
  id: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Occurrence {
  id: string;
  eventId: string;
  userId: string;
  // 时间精度：可以只记录部分时间
  year?: number;
  month?: number;    // 1-12
  day?: number;      // 1-31
  hour?: number;     // 0-23
  minute?: number;   // 0-59
  second?: number;   // 0-59
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartialDateTime {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

export interface AuthPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
}
