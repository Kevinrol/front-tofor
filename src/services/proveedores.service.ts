import { api } from './api';

export interface Proveedor {
  id_proveedor?: number;
  nit: string;
  razon_social: string;
  nombre_contacto: string;
  telefono_contacto: string;
  ciudad: string;
  estado: boolean;
  marcas: string[];
  lineas_productos: string[];
}

export interface Marca {
  id_marca?: number;
  nombre_marca: string;
}

export interface LineaProducto {
  id_linea?: number;
  nombre_linea: string;
}

export const proveedoresService = {
  getProveedores: () => {
    return api.get<Proveedor[]>('/proveedores');
  },

  createProveedor: (data: Proveedor) => {
    return api.post<Proveedor>('/proveedores', data);
  },

  getMarcas: () => {
    return api.get<Marca[]>('/marcas');
  },

  createMarca: (nombre_marca: string) => {
    return api.post<Marca>('/marcas', { nombre_marca });
  },

  getLineasProducto: () => {
    return api.get<LineaProducto[]>('/lineas-productos');
  },

  createLineaProducto: (nombre_linea: string) => {
    return api.post<LineaProducto>('/lineas-productos', { nombre_linea });
  }
};
