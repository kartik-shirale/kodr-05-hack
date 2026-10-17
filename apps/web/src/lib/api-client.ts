import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { ApiError, ApiResponse, PaginationMeta } from "@/types/api";

export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_BASE_URL = API_ORIGIN + "/api/v1";

export class NormalizedApiError extends Error implements ApiError {
  code: string;
  details?: unknown;
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.details = error.details;
    this.status = error.status;
  }
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const responseData = error.response?.data as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | undefined;

    if (responseData?.error) {
      return {
        code: responseData.error.code || "UNKNOWN_ERROR",
        message: responseData.error.message || error.message || "An unexpected error occurred",
        details: responseData.error.details,
        status,
      };
    }

    if (error.code === "ECONNABORTED") {
      return {
        code: "TIMEOUT",
        message: "Request timed out after 15 seconds",
        status: 408,
      };
    }

    if (!error.response) {
      return {
        code: "NETWORK_ERROR",
        message: error.message || "Network error. Please check your connection.",
        status: 0,
      };
    }

    return {
      code: `HTTP_${status}`,
      message: error.message || `Request failed with status ${status}`,
      status,
    };
  }

  if (error instanceof Error) {
    return {
      code: "CLIENT_ERROR",
      message: error.message,
      status: 0,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred",
    status: 0,
  };
}

export function unwrapResponse<T>(response: AxiosResponse<unknown>): ApiResponse<T> {
  const data = response.data;
  if (data && typeof data === "object" && "data" in data) {
    return {
      data: (data as { data: T }).data,
      meta: (data as { meta?: PaginationMeta }).meta,
    };
  }
  return { data: data as T };
}

// Queue for concurrent requests while refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
}

function handleAuthRedirect() {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  const isStudentRoute = pathname.startsWith("/exam") || pathname.startsWith("/join");

  if (isStudentRoute) {
    const match = pathname.match(/^\/join\/([^/?#]+)/);
    const testIdFromPath = match ? match[1] : null;
    const storedTestId = sessionStorage.getItem("exam_test_id");
    const testId = testIdFromPath || storedTestId;

    if (testId) {
      window.location.href = `/join/${testId}`;
    } else {
      window.location.href = "/join";
    }
  } else {
    const next = encodeURIComponent(pathname);
    window.location.href = `/login?next=${next}`;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Support FormData for multipart uploads (e.g. POST /exam/events)
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never retry on /auth/* routes to avoid infinite refresh loops
    const isAuthRoute = originalRequest?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRoute && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(normalizeError(err)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            timeout: 15000,
          }
        );

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        const normalized = normalizeError(refreshError);
        processQueue(normalized);
        handleAuthRedirect();
        return Promise.reject(new NormalizedApiError(normalized));
      } finally {
        isRefreshing = false;
      }
    }

    const normalized = normalizeError(error);
    return Promise.reject(new NormalizedApiError(normalized));
  }
);

// Typed wrappers
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await apiClient.get<unknown>(url, config);
  return unwrapResponse<T>(response);
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const cleanConfig: AxiosRequestConfig = { ...config };
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    cleanConfig.headers = { ...(cleanConfig.headers || {}) };
    delete (cleanConfig.headers as Record<string, unknown>)["Content-Type"];
  }
  const response = await apiClient.post<unknown>(url, data, cleanConfig);
  return unwrapResponse<T>(response);
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<unknown>(url, data, config);
  return unwrapResponse<T>(response);
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<unknown>(url, data, config);
  return unwrapResponse<T>(response);
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<unknown>(url, config);
  return unwrapResponse<T>(response);
}

