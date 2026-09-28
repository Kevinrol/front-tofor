import React from 'react';
import { AuthProvider } from './context/ContextoAuth';
import LayoutPrincipal from './layouts/LayoutPrincipal';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LayoutPrincipal />
    </AuthProvider>
  );
};

export default App;
