import { api } from './api';
import { construirQuery } from '../utils/consulta';

export type TipoCliente = 'Mayorista' | 'Minorista' | 'General';

export interface Cliente {
  id_cliente?: number;
  razon_social_nombre: string;
  nit_ci: string;
  telefono?: string | null;
  direccion?: string | null;
  tipo_cliente: TipoCliente | string;
  estado: boolean;
}

export interface ClientePayload {
  razon_social_nombre: string;
  nit_ci: string;
  telefono?: string;
  direccion?: string;
  tipo_cliente?: TipoCliente;
  estado?: boolean;
}

export const clientesService = {
  getAll: (params: { q?: string; incluirInactivos?: boolean } = {}) =>
    api.get<Cliente[]>(`/clientes${construirQuery(params)}`),

  getOne: (id: number) => api.get<Cliente>(`/clientes/${id}`),

  create: (data: ClientePayload) => api.post<Cliente>('/clientes', data),

  update: (id: number, data: Partial<ClientePayload>) =>
    api.patch<Cliente>(`/clientes/${id}`, data),

  remove: (id: number) => api.delete<Cliente>(`/clientes/${id}`),
};
