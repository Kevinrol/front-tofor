import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  const [currency, setCurrency] = useState<'BOL' | 'USD' | 'ARG'>('BOL');
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'BOL' ? 'USD' : prev === 'USD' ? 'ARG' : 'BOL'));
  };

  return (
    <header className={styles.header}>
      <div className={styles.brandInfo}>
        <div className={styles.titleRow}>
          <h1 className={styles.mainTitle}>EduStock</h1>
          <span className={styles.seasonBadge}>Temporada Escolar</span>
        </div>
        <p className={styles.subtitle}>Control de Stock, Material y Ventas en Mostrador</p>
      </div>

      <div className={styles.actionsGroup}>
        {/* Currency Switcher */}
        <button 
          className={styles.currencyPill} 
          onClick={toggleCurrency}
          title="Cambiar divisa"
        >
          <span className={styles.currencyIcon}>€</span>
          <span>{currency} ({currency === 'BOL' ? 'Bs' : currency === 'USD' ? '$' : '$'})</span>
          <ChevronDown size={14} />
        </button>

        {/* Global Search Bar */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar producto, SKU, categoría..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar producto o SKU"
          />
        </div>

        {/* Notification Bell */}
        <button
          className={styles.notificationBtn}
          title="Notificaciones pendientes"
          aria-label="Notificaciones"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={18} />
          <span className={styles.notificationBadge}>4</span>
        </button>

        {/* User Profile */}
        <div className={styles.userProfile} title="Perfil de usuario">
          <div className={styles.userAvatar}>
            <span>CM</span>
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>Carlos Méndez</span>
            <span className={styles.userRole}>Gerente de Tienda</span>
          </div>
        </div>
      </div>
    </header>
  );
};
