import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Paginador.module.css';

interface PaginadorProps {
  /** Total de registros (ya filtrados). */
  total: number;
  /** Página actual (1-based). */
  pagina: number;
  /** Callback al cambiar de página. */
  onChange: (pagina: number) => void;
  /** Registros por página. Por defecto 5. */
  porPagina?: number;
  /** Callback opcional al cambiar la cantidad de registros por página. */
  onPorPaginaChange?: (porPagina: number) => void;
  /** Opciones de registros por página. Por defecto [5, 10, 20]. */
  opcionesPorPagina?: number[];
  /** Sustantivo mostrado en el texto informativo (ej. "productos"). */
  etiqueta?: string;
}

/** Construye la lista de botones de página, con elipsis cuando hay muchas. */
const construirPaginas = (actual: number, total: number): (number | '...')[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas: (number | '...')[] = [1];
  const inicio = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);

  if (inicio > 2) paginas.push('...');
  for (let i = inicio; i <= fin; i += 1) paginas.push(i);
  if (fin < total - 1) paginas.push('...');
  paginas.push(total);

  return paginas;
};

/**
 * Paginador reutilizable. Muestra el rango visible y los controles de
 * navegación (anterior / páginas / siguiente). Se oculta si no hay datos.
 */
export const Paginador: React.FC<PaginadorProps> = ({
  total,
  pagina,
  onChange,
  porPagina = 5,
  onPorPaginaChange,
  opcionesPorPagina = [5, 10, 20],
  etiqueta = 'registros',
}) => {
  if (total === 0) return null;

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  const paginas = construirPaginas(pagina, totalPaginas);

  return (
    <div className={styles.bar}>
      <div className={styles.leftGroup}>
        <span className={styles.info}>
          Mostrando <strong>{desde}–{hasta}</strong> de <strong>{total}</strong> {etiqueta}
        </span>

        {onPorPaginaChange && (
          <label className={styles.pageSizeLabel}>
            <span>Filas:</span>
            <select
              className={styles.pageSizeSelect}
              value={porPagina}
              onChange={(e) => onPorPaginaChange(Number(e.target.value))}
              aria-label="Cantidad de registros por página"
            >
              {opcionesPorPagina.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {paginas.map((p, index) =>
          p === '...' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.btn} ${p === pagina ? styles.active : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === pagina ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default Paginador;
