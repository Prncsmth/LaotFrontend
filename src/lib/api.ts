// Small fetch wrapper for the Express API.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'fishport_token';
const USER_KEY = 'fishport_user';

export type Department = 'ADMIN' | 'OPERATIONS' | 'SALES' | 'FINANCE';
export type User = { id: number; name: string; email: string; department: Department };
export type Violation = { code: string; name: string; severity: 'BLOCK' | 'WARN'; message: string };

export class ApiError extends Error {
  status: number;
  violations?: Violation[];
  fields?: { field: string; message: string }[];
  constructor(status: number, body: any) {
    super(body?.error ?? `Request failed (${status})`);
    this.status = status;
    this.violations = body?.violations;
    this.fields = body?.fields;
  }
}

export const session = {
  get token() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  get user(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(token: string, user: User) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = session.token;
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: options.method ?? (options.body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: `Cannot reach the API at ${API_URL}. Is the backend running?` });
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      session.clear();
      window.location.href = '/login';
    }
    throw new ApiError(res.status, body);
  }
  return body as T;
}
