import { api } from './api';
import { construirQuery } from '../utils/consulta';

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

export type UsuarioAutenticado = Usuario & {
  id_usuario: number;
};

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  rol: RolUsuario;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioAutenticado;
}

export interface CreateUsuarioPayload {
  nombre_completo: string;
  username: string;
  password: string;
  rol: RolUsuario;
  turno?: TurnoUsuario;
  estado: boolean;
}

export type UpdateUsuarioPayload = Partial<CreateUsuarioPayload>;

export interface UsuariosFiltros {
  rol?: RolUsuario;
  incluirInactivos?: boolean;
}

export const usuariosService = {
  getAll: (filtros: UsuariosFiltros = {}) =>
    api.get<Usuario[]>(`/usuarios${construirQuery({ ...filtros })}`),

  getOne: (id: number) => api.get<Usuario>(`/usuarios/${id}`),

  create: (data: CreateUsuarioPayload) => api.post<Usuario>('/usuarios', data),

  update: (id: number, data: UpdateUsuarioPayload) =>
    api.patch<Usuario>(`/usuarios/${id}`, data),

  remove: (id: number) => api.delete<Usuario>(`/usuarios/${id}`),

  login: (credenciales: LoginRequest) =>
    api.post<LoginResponse>('/usuarios/login', credenciales),
};
