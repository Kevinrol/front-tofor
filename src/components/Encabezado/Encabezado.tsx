import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useContextoAuth } from '../../context/ContextoAuth';
import { RolUsuario } from '../../services/usuarios.service';
import { useNotificacionesStock } from '../../hooks/useNotificacionesStock';
import styles from './Encabezado.module.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onIrAStock?: () => void;
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

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onIrAStock,
}) => {
  const { usuario } = useContextoAuth();
  const [currency, setCurrency] = useState<'BOL' | 'USD' | 'ARG'>('BOL');
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { alertas, totalAlertas, cargando } = useNotificacionesStock();

  // Cerrar el menú flotante al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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

        {/* Notification Bell con Dropdown */}
        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button
            className={styles.notificationBtn}
            title={
              totalAlertas > 0
                ? `${totalAlertas} producto(s) con existencias bajas`
                : 'Sin alertas de existencias'
            }
            aria-label="Notificaciones de existencias"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <Bell size={18} />
            {totalAlertas > 0 && (
              <span className={styles.notificationBadge}>
                {totalAlertas > 99 ? '99+' : totalAlertas}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitle}>
                  <AlertTriangle size={16} className={styles.alertIcon} />
                  <span>Alertas de Existencias</span>
                </div>
                <span className={styles.dropdownCount}>
                  {totalAlertas} {totalAlertas === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              <div className={styles.dropdownBody}>
                {cargando ? (
                  <div className={styles.emptyState}>
                    <span>Cargando alertas...</span>
                  </div>
                ) : totalAlertas === 0 ? (
                  <div className={styles.emptyState}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                    <p>Todo en orden</p>
                    <span>No hay productos con existencias bajas o agotadas.</span>
                  </div>
                ) : (
                  <ul className={styles.alertList}>
                    {alertas.map((prod) => {
                      const agotado = Number(prod.stock_actual) === 0;
                      return (
                        <li
                          key={prod.id_producto}
                          className={`${styles.alertItem} ${agotado ? styles.alertItemAgotado : ''}`}
                        >
                          <div className={styles.itemInfo}>
                            <span className={styles.itemNombre}>{prod.nombre_producto}</span>
                            <span className={styles.itemSubtext}>
                              {prod.nombre_marca ? `${prod.nombre_marca} · ` : ''}
                              Mínimo: {prod.stock_minimo} uds
                            </span>
                          </div>
                          <div className={styles.itemBadgeGroup}>
                            <span
                              className={`${styles.stockPill} ${agotado ? styles.stockPillAgotado : styles.stockPillBajo}`}
                            >
                              {agotado ? 'Agotado' : `${prod.stock_actual} uds`}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {onIrAStock && totalAlertas > 0 && (
                <div className={styles.dropdownFooter}>
                  <button
                    type="button"
                    className={styles.verTodoBtn}
                    onClick={() => {
                      setShowNotifications(false);
                      onIrAStock();
                    }}
                  >
                    <span>Gestionar existencias en Almacén</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
