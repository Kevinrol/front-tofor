import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductItem } from '../../types';
import styles from './ProductTable.module.css';

interface ProductTableProps {
  products: ProductItem[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  const renderProductIcon = (iconType: ProductItem['iconType']) => {
    switch (iconType) {
      case 'notebook':
        return (
          <div className={`${styles.productIconBox} ${styles.iconBoxNotebook}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2" fill="#FBBF24" />
              <rect x="5" y="3" width="3" height="18" fill="#3B82F6" />
              <line x1="10" y1="8" x2="16" y2="8" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="12" x2="16" y2="12" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="16" x2="14" y2="16" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'pencil':
        return (
          <div className={`${styles.productIconBox} ${styles.iconBoxPencil}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17 3L21 7L7 21H3V17L17 3Z" fill="#F59E0B" />
              <path d="M3 21L5.5 18.5L2.5 15.5L3 21Z" fill="#1F2937" />
              <path d="M17 3L21 7L18.5 9.5L14.5 5.5L17 3Z" fill="#DC2626" />
            </svg>
          </div>
        );
      case 'backpack':
        return (
          <div className={`${styles.productIconBox} ${styles.iconBoxBackpack}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="6" width="14" height="15" rx="4" fill="#EF4444" />
              <path d="M9 6V4C9 2.89543 9.89543 2 11 2H13C14.1046 2 15 2.89543 15 4V6" stroke="#B91C1C" strokeWidth="1.5" />
              <rect x="8" y="11" width="8" height="7" rx="2" fill="#DC2626" />
              <circle cx="12" cy="13" r="1" fill="#FFFFFF" />
            </svg>
          </div>
        );
      case 'case':
        return (
          <div className={`${styles.productIconBox} ${styles.iconBoxCase}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="7" width="18" height="10" rx="3" fill="#8B5CF6" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="#DDD6FE" strokeWidth="1.5" />
              <line x1="3" y1="14" x2="21" y2="14" stroke="#6D28D9" strokeWidth="1.5" />
              <circle cx="6" cy="10" r="1.5" fill="#FDE047" />
            </svg>
          </div>
        );
      case 'compass':
        return (
          <div className={`${styles.productIconBox} ${styles.iconBoxCompass}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="2.5" fill="#EF4444" />
              <path d="M12 7L7 20" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 7L17 20" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <line x1="8.5" y1="15" x2="15.5" y2="15" stroke="#FD3706" strokeWidth="1.5" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className={styles.tableCard} aria-label="Productos Más Vendidos">
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Productos Más Vendidos & Estado de Stock</h2>
          <p className={styles.subtitle}>Listado en tiempo real con inventario y precio de venta</p>
        </div>

        <a 
          href="#catalogo" 
          className={styles.catalogLink}
          onClick={(e) => { e.preventDefault(); alert('Abriendo catálogo completo de productos...'); }}
        >
          <span>Ver catálogo completo</span>
          <ArrowRight size={14} />
        </a>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Artículo / Material</th>
              <th>Stock</th>
              <th>P. Mayorista</th>
              <th>Oferta</th>
              <th>PVP Final</th>
              <th>Ventas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item.id}>
                {/* Artículo */}
                <td>
                  <div className={styles.articleCell}>
                    {renderProductIcon(item.iconType)}
                    <div className={styles.articleMeta}>
                      <span className={styles.articleName}>{item.name}</span>
                      <span className={styles.articleDesc}>{item.description}</span>
                    </div>
                  </div>
                </td>

                {/* Stock */}
                <td>
                  <span
                    className={`${styles.stockVal} ${
                      item.status === 'almost_out'
                        ? styles.stockValCritical
                        : item.status === 'low_stock'
                        ? styles.stockValLow
                        : ''
                    }`}
                  >
                    {item.stock}
                  </span>
                </td>

                {/* P. Mayorista */}
                <td>
                  <span className={styles.subtleVal}>
                    {item.wholesalePrice ? `$${item.wholesalePrice.toFixed(2)}` : '—'}
                  </span>
                </td>

                {/* Oferta */}
                <td>
                  {item.discountPercent ? (
                    <span
                      className={`${styles.discountBadge} ${
                        item.discountPercent >= 15 ? styles.discountBadgeOrange : ''
                      }`}
                    >
                      {item.discountPercent}%
                    </span>
                  ) : (
                    <span className={styles.subtleVal}>—</span>
                  )}
                </td>

                {/* PVP Final */}
                <td>
                  <span className={styles.finalPrice}>${item.finalPrice.toFixed(2)}</span>
                </td>

                {/* Ventas */}
                <td>
                  <span className={styles.salesVal}>{item.salesCount}</span>
                </td>

                {/* Estado */}
                <td>
                  {item.status === 'in_stock' && (
                    <span className={`${styles.statusPill} ${styles.statusInStock}`}>
                      <span className={styles.statusDot}></span> En Stock
                    </span>
                  )}
                  {item.status === 'low_stock' && (
                    <span className={`${styles.statusPill} ${styles.statusLowStock}`}>
                      <span className={styles.statusDot}></span> Stock Bajo
                    </span>
                  )}
                  {item.status === 'almost_out' && (
                    <span className={`${styles.statusPill} ${styles.statusAlmostOut}`}>
                      <span className={styles.statusDot}></span> Por Agotar
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
