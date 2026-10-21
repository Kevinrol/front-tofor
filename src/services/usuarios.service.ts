import { api } from './api';

export type RolUsuario = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR';
export type TurnoUsuario = 'mañana' | 'tarde' | 'tiempo_completo';

export interface Usuario {
  id_usuario?: number;
  nombre_completo: string;
  username: string;
  rol: RolUsuario;
  turno?: TurnoUsuario | null;
  estado: boolean;
}

export const usuariosService = {
  getAll: () => api.get<Usuario[]>('/usuarios'),
};
