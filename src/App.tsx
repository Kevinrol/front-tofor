import React from 'react';
import { AuthProvider, useContextoAuth } from './context/ContextoAuth';
import LayoutPrincipal from './layouts/LayoutPrincipal';
import InicioSesion from './pages/Login/InicioSesion';

const ContenidoApp: React.FC = () => {
  const { isAuthenticated } = useContextoAuth();
  return isAuthenticated ? <LayoutPrincipal /> : <InicioSesion />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
};

export default App;
