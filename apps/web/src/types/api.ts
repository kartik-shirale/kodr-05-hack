export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta;
}

export type UserRole = "TEACHER" | "STUDENT";

export interface TeacherUser {
  id: string;
  name: string;
  email: string;
  role: "TEACHER";
}

export interface StudentUser {
  participantId: string;
  name: string;
  email: string;
  role: "STUDENT";
  testId: string;
}

export type AuthUser = TeacherUser | StudentUser;
