/**
 * Servicio HTTP base — apunta al backend NestJS via VITE_API_BASE_URL
 * Uso: import { api } from '../services/api';
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const AUTH_STORAGE_KEY = 'tofor_auth';

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed?.access_token) {
        headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    }
  } catch {
    // Ignorar errores de parseo de localStorage
  }
  return headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Ejecuta una petición HTTP y normaliza la respuesta.
 * En caso de error intenta extraer el mensaje enviado por NestJS.
 */
async function request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: buildHeaders(),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let detail = '';
    let body: unknown = null;
    try {
      body = await response.json();
      const mensaje = (body as { message?: string | string[] })?.message;
      if (Array.isArray(mensaje)) detail = mensaje.join(', ');
      else if (typeof mensaje === 'string') detail = mensaje;
    } catch {
      // La respuesta no contenía JSON; se usa el mensaje genérico.
    }
    throw new ApiError(
      detail || `${method} ${endpoint} — ${response.status}`,
      response.status,
      body,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T = unknown>(endpoint: string): Promise<T> => request<T>('GET', endpoint),

  post: <T = unknown>(endpoint: string, data: unknown): Promise<T> =>
    request<T>('POST', endpoint, data),

  put: <T = unknown>(endpoint: string, data: unknown): Promise<T> =>
    request<T>('PUT', endpoint, data),

  patch: <T = unknown>(endpoint: string, data: unknown): Promise<T> =>
    request<T>('PATCH', endpoint, data),

  delete: <T = unknown>(endpoint: string): Promise<T> => request<T>('DELETE', endpoint),
};
