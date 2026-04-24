export type CameraStatus = "online" | "offline" | "no-hit";
export type CameraCategory = "IN" | "OUT";
export type StreamProtocol = "rtsp" | "rtmp";
export type AlertSeverity = "info" | "warning" | "critical";

export interface BackendCamera {
  cameraId: string;
  streamId: string;
  title: string;
  district: string;
  assembly: string;
  acNo: number;
  psNo: number;
  psAddress: string;
  category: CameraCategory;
  status: CameraStatus;
  streamUrl: string;
  streamProtocol: StreamProtocol;
  is4G: boolean;
  enabled: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAlert {
  id: string;
  timestamp: string;
  district: string;
  assembly: string;
  acNo: number;
  psNo: number;
  psAddress: string;
  category: CameraCategory;
  streamId: string;
  alertType: string;
  severity: AlertSeverity;
}

export interface DashboardSummaryResponse {
  ok: true;
  counts: { total: number; online: number; offline: number; noHit: number };
  districtSummary: Array<{
    district: string;
    total: number;
    online: number;
    offline: number;
    noHit: number;
  }>;
}

export interface HourlyStatsResponse {
  ok: true;
  items: Array<{ label: string; total: number; online: number; offline: number; noHit: number }>;
}

export interface CamerasResponse {
  ok: true;
  items: BackendCamera[];
  total: number;
  options: {
    districts: string[];
    assemblies: string[];
    categories: string[];
    statuses: string[];
  };
}

export interface AlertsResponse {
  ok: true;
  items: BackendAlert[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminLoginResponse {
  ok: boolean;
  token?: string;
  message?: string;
}

export interface SaveCameraInput {
  cameraId: string;
  streamId: string;
  title: string;
  district: string;
  assembly: string;
  acNo: number;
  psNo: number;
  psAddress: string;
  category: CameraCategory;
  status: CameraStatus;
  streamUrl: string;
  streamProtocol: StreamProtocol;
  is4G: boolean;
  enabled: boolean;
  lastSeen?: string;
}

const ADMIN_TOKEN_STORAGE_KEY = "gil_admin_token";
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");
const BACKEND_PROXY_PREFIX = "/api/backend";

export function getBackendBaseUrl() {
  return BACKEND_URL;
}

export function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "";
}

export function setStoredAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAdminToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function buildUrl(pathname: string, params?: Record<string, string | number | undefined>) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") {
        continue;
      }

      searchParams.set(key, String(value));
    }
  }

  const search = searchParams.toString();

  if (typeof window !== "undefined") {
    return `${BACKEND_PROXY_PREFIX}${normalizedPathname}${search ? `?${search}` : ""}`;
  }

  const url = new URL(normalizedPathname, BACKEND_URL);
  if (search) {
    url.search = search;
  }

  return url.toString();
}

async function backendFetch<T>(pathname: string, init: RequestInit = {}) {
  const requestUrl = pathname;
  const headers = new Headers(init.headers ?? {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(requestUrl, {
    cache: "no-store",
    ...init,
    headers,
  });

  const payload = (await response.json()) as T;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

function authHeaders(token?: string): Record<string, string> | undefined {
  const resolvedToken = token ?? getStoredAdminToken();
  return resolvedToken ? { "x-admin-token": resolvedToken } : undefined;
}

export async function loginAdmin(username: string, password: string) {
  return backendFetch<AdminLoginResponse>(buildUrl("/api/admin/login"), {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchCameras(params?: Record<string, string | number | undefined>) {
  return backendFetch<CamerasResponse>(buildUrl("/api/cameras", params), {
    method: "GET",
    headers: {},
  });
}

export async function fetchCamera(cameraId: string) {
  return backendFetch<{ ok: true; item: BackendCamera }>(buildUrl(`/api/cameras/${encodeURIComponent(cameraId)}`));
}

export async function createCamera(input: SaveCameraInput, token?: string) {
  return backendFetch<{ ok: true; item: BackendCamera }>(buildUrl("/api/cameras"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function updateCamera(cameraId: string, input: SaveCameraInput, token?: string) {
  return backendFetch<{ ok: true; item: BackendCamera }>(buildUrl(`/api/cameras/${encodeURIComponent(cameraId)}`), {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export async function deleteCamera(cameraId: string, token?: string) {
  return backendFetch<{ ok: true }>(buildUrl(`/api/cameras/${encodeURIComponent(cameraId)}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function fetchDashboardSummary() {
  return backendFetch<DashboardSummaryResponse>(buildUrl("/api/dashboard/summary"));
}

export async function fetchHourlyStats() {
  return backendFetch<HourlyStatsResponse>(buildUrl("/api/dashboard/hourly"));
}

export async function fetchAlertsPage(params?: Record<string, string | number | undefined>) {
  return backendFetch<AlertsResponse>(buildUrl("/api/alerts", params), {
    method: "GET",
    headers: {},
  });
}

export async function fetchAllAlerts(params?: Record<string, string | number | undefined>) {
  const pageSize = typeof params?.pageSize === "number" ? params.pageSize : 500;
  const baseParams = { ...params, pageSize };
  const firstPage = await fetchAlertsPage({ ...baseParams, page: 1 });
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await fetchAlertsPage({ ...baseParams, page });
    items.push(...nextPage.items);
  }

  return items;
}
