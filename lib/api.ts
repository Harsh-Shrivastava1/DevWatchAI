import type { ApiResponse } from "@/lib/types";

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string;
};

export class ApiError extends Error {
  status: number;
  payload: ApiResponse<unknown> | null;

  constructor(status: number, message: string, payload: ApiResponse<unknown> | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(
  path: string,
  { body, headers, token, ...init }: ApiOptions = {}
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = (await response.json().catch(() => null)) as
    | ApiResponse<unknown>
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error || data?.message || `Request failed with status ${response.status}`,
      data
    );
  }

  return data as T;
}

export async function apiData<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch<ApiResponse<T>>(path, options);

  if (!response.success) {
    throw new Error(response.error || response.message || "Request failed");
  }

  return response.data as T;
}

export function downloadUrl(path: string) {
  return `${API_BASE}${path}`;
}
