import React from 'react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Proveedor } from '../../services/proveedores.service';

export interface ProveedorDetalleModalProps {
  proveedor: Proveedor | null;
  onClose: () => void;
}

/**
 * Modal de solo lectura con la ficha completa del proveedor, sus marcas y líneas.
 */
export const ProveedorDetalleModal: React.FC<ProveedorDetalleModalProps> = ({
  proveedor,
  onClose,
}) => {
  if (!proveedor) return null;

  return (
    <Modal
      open={true}
      title={`Ficha de Proveedor: ${proveedor.razon_social}`}
      onClose={onClose}
      width={640}
      footer={
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onClose}
        >
          Cerrar Ficha
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <span className={styles.hint}>Razón Social</span>
            <div className={styles.strong}>{proveedor.razon_social}</div>
          </div>
          <div>
            <span className={styles.hint}>NIT / CI</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {proveedor.nit || '—'}
            </div>
          </div>
          <div>
            <span className={styles.hint}>Contacto</span>
            <div>{proveedor.nombre_contacto || '—'}</div>
          </div>
          <div>
            <span className={styles.hint}>Teléfono / WhatsApp</span>
            <div>{proveedor.telefono_contacto || '—'}</div>
          </div>
          <div>
            <span className={styles.hint}>Ciudad</span>
            <div>{proveedor.ciudad || '—'}</div>
          </div>
          <div>
            <span className={styles.hint}>Estado Operativo</span>
            <div>
              <span
                className={`${styles.pill} ${
                  proveedor.estado ? styles.pillSuccess : styles.pillNeutral
                }`}
              >
                <span className={styles.pillDot} />
                {proveedor.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)' }} />

        <div>
          <span className={styles.hint} style={{ display: 'block', marginBottom: '6px' }}>
            Marcas que Distribuye ({(proveedor.marcas || []).length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(proveedor.marcas || []).length === 0 ? (
              <span className={styles.muted}>Sin marcas vinculadas</span>
            ) : (
              (proveedor.marcas || []).map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#F0E7FE',
                    color: '#7C3AED',
                  }}
                >
                  {m}
                </span>
              ))
            )}
          </div>
        </div>

        <div>
          <span className={styles.hint} style={{ display: 'block', marginBottom: '6px' }}>
            Líneas de Producto que Abastece ({(proveedor.lineas_productos || []).length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(proveedor.lineas_productos || []).length === 0 ? (
              <span className={styles.muted}>Sin líneas vinculadas</span>
            ) : (
              (proveedor.lineas_productos || []).map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#E0EDFF',
                    color: '#2563EB',
                  }}
                >
                  {l}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProveedorDetalleModal;
