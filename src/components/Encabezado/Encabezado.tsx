import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useContextoAuth } from '../../context/ContextoAuth';
import { RolUsuario } from '../../services/usuarios.service';
import styles from './Encabezado.module.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
};

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'US';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  const { usuario } = useContextoAuth();
  const [currency, setCurrency] = useState<'BOL' | 'USD' | 'ARG'>('BOL');
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'BOL' ? 'USD' : prev === 'USD' ? 'ARG' : 'BOL'));
  };

  const nombreVisible = usuario?.nombre_completo ?? 'Usuario';
  const rolVisible = usuario?.rol ? ETIQUETA_ROL[usuario.rol] : 'Sesión activa';
  const iniciales = obtenerIniciales(nombreVisible);

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
        <div className={styles.userProfile} title={`Usuario: ${usuario?.username ?? ''}`}>
          <div className={styles.userAvatar}>
            <span>{iniciales}</span>
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{nombreVisible}</span>
            <span className={styles.userRole}>{rolVisible}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
