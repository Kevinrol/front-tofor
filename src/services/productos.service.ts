import { api } from './api';

export interface Producto {
  id_producto?: number;
  codigo_barras?: string | null;
  nombre_producto: string;
  id_marca?: number | null;
  id_linea?: number | null;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  nombre_marca?: string | null;
  nombre_linea?: string | null;
}

export interface ProductoPayload {
  codigo_barras?: string;
  nombre_producto: string;
  id_marca?: number;
  id_linea?: number;
  precio: number;
  stock_actual?: number;
  stock_minimo?: number;
  estado?: boolean;
}

export type TipoAjusteStock = 'ENTRADA' | 'SALIDA' | 'FIJAR';

export interface AjusteStockPayload {
  tipo: TipoAjusteStock;
  cantidad: number;
  motivo?: string;
}

export const productosService = {
  getAll: (incluirInactivos = false) =>
    api.get<Producto[]>(`/productos?incluirInactivos=${incluirInactivos}`),

  getBajoStock: () => api.get<Producto[]>('/productos/bajo-stock'),

  getOne: (id: number) => api.get<Producto>(`/productos/${id}`),

  create: (data: ProductoPayload) => api.post<Producto>('/productos', data),

  update: (id: number, data: Partial<ProductoPayload>) =>
    api.patch<Producto>(`/productos/${id}`, data),

  ajustarStock: (id: number, data: AjusteStockPayload) =>
    api.patch<Producto>(`/productos/${id}/stock`, data),

  remove: (id: number) => api.delete<Producto>(`/productos/${id}`),
};
