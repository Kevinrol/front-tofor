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
    try {
      const body = await response.json();
      if (Array.isArray(body?.message)) detail = body.message.join(', ');
      else if (typeof body?.message === 'string') detail = body.message;
    } catch {
      // La respuesta no contenía JSON; se usa el mensaje genérico.
    }
    throw new Error(detail || `${method} ${endpoint} — ${response.status}`);
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
