import axios, { AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import type { ApiResponse } from "@/types/api";
import { normalizeError, unwrapResponse, NormalizedApiError } from "./api-client";

export async function createServerApiClient() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const baseURL =
    (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") +
    "/api/v1";

  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      Cookie: cookieHeader,
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalized = normalizeError(error);
      return Promise.reject(new NormalizedApiError(normalized));
    }
  );

  return {
    client,
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await client.get<unknown>(url, config);
      return unwrapResponse<T>(response);
    },
    post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await client.post<unknown>(url, data, config);
      return unwrapResponse<T>(response);
    },
    put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await client.put<unknown>(url, data, config);
      return unwrapResponse<T>(response);
    },
    patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await client.patch<unknown>(url, data, config);
      return unwrapResponse<T>(response);
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await client.delete<unknown>(url, config);
      return unwrapResponse<T>(response);
    },
  };
}
