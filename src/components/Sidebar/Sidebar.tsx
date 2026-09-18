import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Box, 
  ShoppingBag, 
  BookOpen, 
  BarChart2, 
  Inbox, 
  Settings, 
  LogOut 
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const navItems: NavOption[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: <LayoutGrid size={20} /> },
    { id: 'inventory', label: 'Almacén & Stock', icon: <Box size={20} /> },
    { id: 'sales', label: 'Ventas Mostrador', icon: <ShoppingBag size={20} /> },
    { id: 'catalog', label: 'Catálogo Escolar', icon: <BookOpen size={20} /> },
    { id: 'analytics', label: 'Reportes & Métricas', icon: <BarChart2 size={20} /> },
    { id: 'inbox', label: 'Entradas & Envíos', icon: <Inbox size={20} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topSection}>
        {/* Brand Logo "P" */}
        <div className={styles.brandLogo} title="EduStock Papelería">
          <span>P</span>
        </div>

        {/* Primary Navigation items */}
        <nav className={styles.navGroup} aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span className={styles.tooltip}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Logout */}
      <div className={styles.bottomSection}>
        <button
          className={styles.navItem}
          title="Configuración"
          aria-label="Configuración"
          onClick={() => alert('Configuración de la tienda')}
        >
          <Settings size={20} />
          <span className={styles.tooltip}>Configuración</span>
        </button>
        <button
          className={styles.navItem}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          onClick={() => alert('Cerrar sesión del sistema')}
        >
          <LogOut size={20} />
          <span className={styles.tooltip}>Salir</span>
        </button>
      </div>
    </aside>
  );
};
