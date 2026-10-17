import { apiGet, apiPost } from "@/lib/api-client";
import type { TeacherUser, StudentUser, AuthUser } from "@/types/api";
import type {
  TeacherRegisterInput,
  TeacherLoginInput,
  StudentLoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./schemas";

export async function registerTeacherApi(data: TeacherRegisterInput) {
  return apiPost<TeacherUser>("/auth/teacher/register", data);
}

export async function loginTeacherApi(data: TeacherLoginInput) {
  return apiPost<TeacherUser>("/auth/teacher/login", data);
}

export async function loginStudentApi(data: StudentLoginInput) {
  return apiPost<StudentUser>("/auth/student/login", data);
}

export async function refreshAuthApi() {
  return apiPost<{ status: string }>("/auth/refresh", {});
}

export async function logoutApi() {
  return apiPost<void>("/auth/logout", {});
}

export async function getMeApi() {
  return apiGet<AuthUser>("/auth/me");
}

export async function forgotPasswordApi(data: ForgotPasswordInput) {
  return apiPost<{ message?: string }>("/auth/teacher/forgot-password", data);
}

export async function resetPasswordApi(data: ResetPasswordInput) {
  return apiPost<{ message?: string }>("/auth/teacher/reset-password", data);
}
