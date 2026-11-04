import { api } from './api';
import { construirQuery } from '../utils/consulta';

export type TipoVenta = 'Contado' | 'Credito';
export type MetodoPago = 'Efectivo' | 'QR' | 'Transferencia';
export type EstadoPagoVenta = 'Pagado' | 'Pendiente' | 'Anulado';

export interface DetalleVenta {
  id_detalle_venta?: number;
  id_venta?: number;
  id_producto: number;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
  nombre_producto?: string;
  codigo_barras?: string;
}

export interface Venta {
  id_venta?: number;
  id_usuario: number;
  id_cliente?: number | null;
  fecha_hora: string;
  tipo_venta: TipoVenta | string;
  metodo_pago: MetodoPago | string;
  monto_total: number;
  monto_descuento?: number;
  monto_efectivo?: number | null;
  monto_cambio?: number | null;
  estado_pago: EstadoPagoVenta | string;
  detalles?: DetalleVenta[];
  nombre_usuario?: string;
  nombre_cliente?: string;
  nit_cliente?: string;
  tipo_cliente?: string;
}

export interface DetalleVentaPayload {
  id_producto: number;
  cantidad: number;
}

export interface VentaPayload {
  id_usuario: number;
  id_cliente?: number;
  tipo_venta: TipoVenta;
  metodo_pago: MetodoPago;
  monto_descuento?: number;
  monto_efectivo?: number;
  estado_pago?: EstadoPagoVenta;
  fecha_hora?: string;
  detalles: DetalleVentaPayload[];
}

export interface VentaUpdatePayload {
  id_cliente?: number | null;
  estado_pago?: EstadoPagoVenta;
  monto_descuento?: number;
  monto_efectivo?: number;
}

export interface VentasFiltros {
  desde?: string;
  hasta?: string;
  id_usuario?: number;
  id_cliente?: number;
  estado_pago?: string;
  metodo_pago?: string;
}

export const ventasService = {
  getAll: (filtros: VentasFiltros = {}) =>
    api.get<Venta[]>(`/ventas${construirQuery({ ...filtros })}`),

  getOne: (id: number) => api.get<Venta>(`/ventas/${id}`),

  create: (data: VentaPayload) => api.post<Venta>('/ventas', data),

  update: (id: number, data: VentaUpdatePayload) =>
    api.patch<Venta>(`/ventas/${id}`, data),

  remove: (id: number) => api.delete<Venta>(`/ventas/${id}`),
};

