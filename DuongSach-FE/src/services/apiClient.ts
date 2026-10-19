const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'duongsach_token';
const REFRESH_TOKEN_KEY = 'duongsach_refresh_token';
let refreshPromise: Promise<string> | null = null;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  warnings?: string[];
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

function readStored(key: string) {
  // Authentication belongs to this tab, so concurrent roles cannot overwrite it.
  return sessionStorage.getItem(key);
}

function writeStored(key: string, value: string) {
  sessionStorage.setItem(key, value);
}

export function clearAuthSession() {
  [localStorage, sessionStorage].forEach(storage => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem('duongsach_user');
    storage.removeItem('duongsach_admin_auth_v1');
    storage.removeItem('duongsach_partner_auth_v1');
  });
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = readStored(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('Phiên đăng nhập đã hết hạn.');
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json().catch(() => ({
    success: false,
    data: {} as { accessToken: string; refreshToken: string },
    error: { code: 'INVALID_JSON', message: 'Phản hồi làm mới phiên không hợp lệ' },
  }));
  if (!response.ok || !json.success || !json.data?.accessToken) {
    throw new Error(json.error?.message || 'Phiên đăng nhập đã hết hạn.');
  }
  writeStored(ACCESS_TOKEN_KEY, json.data.accessToken);
  if (json.data.refreshToken) writeStored(REFRESH_TOKEN_KEY, json.data.refreshToken);
  return json.data.accessToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}, retryUnauthorized = true): Promise<T> {
  const token = readStored(ACCESS_TOKEN_KEY);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = String(options.method || 'GET').toUpperCase();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      cache: method === 'GET' ? 'no-store' : options.cache,
    });
  } catch (cause) {
    throw new Error('Không thể kết nối đến máy chủ dữ liệu.', { cause });
  }

  if (response.status === 401 && retryUnauthorized && !endpoint.startsWith('/auth/')) {
    try {
      refreshPromise ||= refreshAccessToken().finally(() => { refreshPromise = null; });
      await refreshPromise;
      return request<T>(endpoint, options, false);
    } catch {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const json: ApiResponse<T> = await response.json().catch(() => ({ success: false, data: {} as T, error: { code: 'INVALID_JSON', message: 'Phản hồi từ máy chủ không hợp lệ' } }));

  if (!response.ok || !json.success) {
    const detailMsg = json.error?.details?.map(d => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ');
    const fullMsg = detailMsg ? `${json.error?.message || 'Dữ liệu không hợp lệ'}: ${detailMsg}` : (json.error?.message || 'Có lỗi xảy ra khi gọi API');
    throw new Error(fullMsg);
  }

  if (method !== 'GET' && endpoint !== '/public/visits') {
    window.dispatchEvent(new Event('duongsach:data-changed'));
  }

  return json.data;
}

export const apiClient = {
  get: <T>(endpoint: string, options: { signal?: AbortSignal } = {}) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
