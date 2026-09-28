/**
 * Servicio HTTP base — apunta al backend NestJS via VITE_API_BASE_URL
 * Uso: import { api } from '../services/api';
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = {
  get: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`GET ${endpoint} — ${response.status}`);
    return response.json() as Promise<T>;
  },

  post: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`POST ${endpoint} — ${response.status}`);
    return response.json() as Promise<T>;
  },

  put: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`PUT ${endpoint} — ${response.status}`);
    return response.json() as Promise<T>;
  },

  delete: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`DELETE ${endpoint} — ${response.status}`);
    return response.json() as Promise<T>;
  },
};
