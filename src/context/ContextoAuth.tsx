import React, { createContext, useContext, useState } from 'react';

interface ContextoAuthType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const ContextoAuth = createContext<ContextoAuthType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <ContextoAuth.Provider value={{ isAuthenticated, login, logout }}>
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
