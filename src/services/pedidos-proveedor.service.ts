import { api } from './api';
import { construirQuery } from '../utils/consulta';

export type EstadoPedido = 'Pendiente' | 'Enviado' | 'Parcial' | 'Recibido' | 'Cancelado';

export interface DetallePedidoProveedor {
  id_detalle_pedido?: number;
  id_pedido?: number;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_recibida?: number;
  cantidad_pendiente?: number;
  unidad_venta: string;
  precio_unitario_compra: number;
  porcentaje_descuento?: number;
  subtotal: number;
  nombre_producto?: string;
}

export interface PedidoProveedor {
  id_pedido?: number;
  id_proveedor: number;
  id_usuario: number;
  fecha_pedido: string;
  fecha_entrega_estimada?: string | null;
  total_pedido: number;
  estado_pedido: EstadoPedido | string;
  comprobante_url?: string | null;
  detalles?: DetallePedidoProveedor[];
  razon_social_proveedor?: string;
  nombre_usuario?: string;
}

export interface DetallePedidoPayload {
  id_producto: number;
  cantidad_solicitada: number;
  unidad_venta: string;
  precio_unitario_compra: number;
  porcentaje_descuento?: number;
}

export interface PedidoPayload {
  id_proveedor: number;
  id_usuario: number;
  fecha_pedido?: string;
  fecha_entrega_estimada?: string;
  estado_pedido?: EstadoPedido;
  comprobante_url?: string | null;
  detalles: DetallePedidoPayload[];
}

export interface PedidosFiltros {
  estado_pedido?: string;
  id_proveedor?: number;
  id_usuario?: number;
  desde?: string;
  hasta?: string;
}

export const pedidosService = {
  getAll: (filtros: PedidosFiltros = {}) =>
    api.get<PedidoProveedor[]>(`/pedidos-proveedor${construirQuery({ ...filtros })}`),

  getOne: (id: number) => api.get<PedidoProveedor>(`/pedidos-proveedor/${id}`),

  create: (data: PedidoPayload) => api.post<PedidoProveedor>('/pedidos-proveedor', data),

  update: (
    id: number,
    data: { fecha_entrega_estimada?: string; estado_pedido?: EstadoPedido; comprobante_url?: string | null }
  ) => api.patch<PedidoProveedor>(`/pedidos-proveedor/${id}`, data),

  recibir: (
    id: number,
    id_usuario?: number,
    detalles?: Array<{
      id_detalle_pedido?: number;
      id_producto?: number;
      cantidad_recibida: number;
    }>,
    comprobante_url?: string | null
  ) =>
    api.post<{ mensaje: string; estado_pedido?: EstadoPedido }>(
      `/pedidos-proveedor/${id}/recibir`,
      {
        id_usuario,
        ...(detalles ? { detalles } : {}),
        ...(comprobante_url ? { comprobante_url } : {}),
      }
    ),

  remove: (id: number) => api.delete<PedidoProveedor>(`/pedidos-proveedor/${id}`),
};
