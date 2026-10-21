import React from 'react';
import { 
  LayoutGrid, 
  Box, 
  ShoppingBag, 
  ShoppingCart,
  ClipboardList,
  Users,
  Settings, 
  LogOut,
  Truck
} from 'lucide-react';
import styles from './BarraLateral.module.css';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'orders'
  | 'clients'
  | 'suppliers';

interface NavOption {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavOption[] = [
    { id: 'dashboard',  label: 'Panel Principal',    icon: <LayoutGrid size={20} /> },
    { id: 'inventory',  label: 'Almacén & Stock',    icon: <Box size={20} /> },
    { id: 'sales',      label: 'Ventas Mostrador',   icon: <ShoppingBag size={20} /> },
    { id: 'purchases',  label: 'Compras a Proveedor',icon: <ShoppingCart size={20} /> },
    { id: 'orders',     label: 'Pedidos a Proveedor',icon: <ClipboardList size={20} /> },
    { id: 'clients',    label: 'Clientes',           icon: <Users size={20} /> },
    { id: 'suppliers',  label: 'Proveedores',        icon: <Truck size={20} /> },
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
                onClick={() => onTabChange(item.id)}
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
