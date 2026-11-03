import React, { createContext, useContext, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../services/api';
import {
  LoginRequest,
  LoginResponse,
  UsuarioAutenticado,
  usuariosService,
} from '../services/usuarios.service';

interface ContextoAuthType {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  isAuthenticated: boolean;
  esAdmin: boolean;
  login: (credenciales: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
}

const ContextoAuth = createContext<ContextoAuthType | undefined>(undefined);

function leerSesionGuardada(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoginResponse;
    if (parsed?.access_token && parsed?.usuario?.id_usuario) {
      return parsed;
    }
  } catch {
    // Sesión inválida o corrupta
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sesion, setSesion] = useState<LoginResponse | null>(() => leerSesionGuardada());

  const login = async (credenciales: LoginRequest): Promise<LoginResponse> => {
    const respuesta = await usuariosService.login(credenciales);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(respuesta));
    setSesion(respuesta);
    return respuesta;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSesion(null);
  };

  const usuario = sesion?.usuario ?? null;
  const token = sesion?.access_token ?? null;
  const isAuthenticated = Boolean(usuario && token);
  const esAdmin =
    usuario?.rol === 'SUPER_ADMIN' || usuario?.rol === 'ADMIN';

  return (
    <ContextoAuth.Provider
      value={{ usuario, token, isAuthenticated, esAdmin, login, logout }}
    >
      {children}
    </ContextoAuth.Provider>
  );
};

export const useContextoAuth = () => {
  const context = useContext(ContextoAuth);
  if (context === undefined) {
    throw new Error('useContextoAuth must be used within an AuthProvider');
  }
  return context;
};
