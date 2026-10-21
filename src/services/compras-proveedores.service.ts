import { api } from './api';
import { construirQuery } from '../utils/consulta';

export type EstadoCompra = 'Completada' | 'Anulada';

export interface DetalleCompraProveedor {
  id_detalle_compra?: number;
  id_compra?: number;
  id_producto: number;
  cantidad_recibida: number;
  precio_costo_unitario: number;
  subtotal: number;
  nombre_producto?: string;
}

export interface CompraProveedor {
  id_compra?: number;
  id_pedido?: number | null;
  id_proveedor: number;
  id_usuario: number;
  fecha_recepcion: string;
  total_pagado: number;
  estado: EstadoCompra | string;
  detalles?: DetalleCompraProveedor[];
  razon_social_proveedor?: string;
  nombre_usuario?: string;
}

export interface DetalleCompraPayload {
  id_producto: number;
  cantidad_recibida: number;
  precio_costo_unitario: number;
}

export interface CompraPayload {
  id_proveedor: number;
  id_usuario: number;
  id_pedido?: number;
  fecha_recepcion: string;
  detalles: DetalleCompraPayload[];
}

export interface ComprasFiltros {
  id_proveedor?: number;
  id_usuario?: number;
  estado?: string;
  desde?: string;
  hasta?: string;
}

export const comprasService = {
  getAll: (filtros: ComprasFiltros = {}) =>
    api.get<CompraProveedor[]>(`/compras-proveedores${construirQuery({ ...filtros })}`),

  getOne: (id: number) => api.get<CompraProveedor>(`/compras-proveedores/${id}`),

  create: (data: CompraPayload) => api.post<CompraProveedor>('/compras-proveedores', data),

  update: (id: number, data: { fecha_recepcion?: string }) =>
    api.patch<CompraProveedor>(`/compras-proveedores/${id}`, data),

  remove: (id: number) => api.delete<CompraProveedor>(`/compras-proveedores/${id}`),
};
