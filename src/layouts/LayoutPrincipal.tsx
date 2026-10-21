import React, { useState } from 'react';
import { Sidebar, NavTab } from '../components/BarraLateral/BarraLateral';
import { Header } from '../components/Encabezado/Encabezado';
import { Panel } from '../pages/Dashboard/Panel';
import { Proveedores } from '../pages/proveedores/Proveedores';
import { Productos } from '../pages/productos/Productos';
import { Clientes } from '../pages/clientes/Clientes';
import { Ventas } from '../pages/ventas/Ventas';
import { ComprasProveedor } from '../pages/compras/ComprasProveedor';
import { PedidosProveedor } from '../pages/pedidos/PedidosProveedor';
import styles from '../pages/Dashboard/Panel.module.css';

/**
 * LayoutPrincipal — Shell that wraps Sidebar + Header + dynamic page content.
 * Manages navigation state (activeTab) and renders the correct page.
 */
export const LayoutPrincipal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Panel searchQuery={searchQuery} />;
      case 'inventory':
        return <Productos />;
      case 'sales':
        return <Ventas />;
      case 'purchases':
        return <ComprasProveedor />;
      case 'orders':
        return <PedidosProveedor />;
      case 'clients':
        return <Clientes />;
      case 'suppliers':
        return <Proveedores />;
      default:
        return (
          <main style={{ padding: '32px', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
            <p>🚧 Sección en construcción: <strong>{activeTab}</strong></p>
          </main>
        );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Left Navigation Sidebar — controlled by LayoutPrincipal */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        {renderPage()}
      </div>
    </div>
  );
};

export default LayoutPrincipal;
