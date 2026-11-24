import React, { useEffect, useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Cliente } from '../../services/clientes.service';
import { Venta, ventasService } from '../../services/ventas.service';
import { formatearFechaHora, formatearMoneda } from '../../utils/formato';

export interface ClienteHistorialModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  onError?: (mensaje: string) => void;
}

/**
 * Modal de solo lectura con el historial de compras de un cliente.
 */
export const ClienteHistorialModal: React.FC<ClienteHistorialModalProps> = ({
  cliente,
  onClose,
  onError,
}) => {
  const [ventasCliente, setVentasCliente] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const idCliente = cliente?.id_cliente;
    if (!idCliente) {
      setVentasCliente([]);
      return;
    }

    let activo = true;
    setLoading(true);
    ventasService
      .getAll({ id_cliente: idCliente })
      .then((data) => {
        if (activo) setVentasCliente(data || []);
      })
      .catch(() => {
        if (activo) {
          setVentasCliente([]);
          onError?.('No se pudo cargar el historial de compras.');
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  const totalAcumulado = ventasCliente
    .filter((v) => v.estado_pago !== 'Anulado')
    .reduce((acc, v) => acc + Number(v.monto_total), 0);

  return (
    <Modal
      open={cliente !== null}
      title={`Historial de Compras — ${cliente?.razon_social_nombre ?? ''}`}
      onClose={onClose}
      width={680}
    >
      {loading ? (
        <div className={styles.loadingRow}>
          <Loader2 size={18} className={styles.spinner} /> Cargando historial...
        </div>
      ) : ventasCliente.length === 0 ? (
        <div className={styles.empty}>
          <Receipt size={32} color="var(--color-text-placeholder)" />
          <span className={styles.emptyTitle}>Sin compras registradas</span>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th className={styles.right}>Descuento</th>
                  <th className={styles.right}>Total</th>
                  <th className={styles.center}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventasCliente.map((v) => (
                  <tr key={v.id_venta}>
                    <td className={styles.strong}>#{v.id_venta}</td>
                    <td className={styles.muted}>{formatearFechaHora(v.fecha_hora)}</td>
                    <td>{v.metodo_pago}</td>
                    <td className={`${styles.right} ${styles.muted}`}>
                      {formatearMoneda(v.monto_descuento ?? 0)}
                    </td>
                    <td className={`${styles.right} ${styles.money}`}>
                      {formatearMoneda(v.monto_total)}
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.pill} ${styles.pillNeutral}`}>
                        {v.estado_pago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.lineTotal}>
            <span className={styles.lineTotalLabel}>Total Acumulado (sin anuladas)</span>
            {formatearMoneda(totalAcumulado)}
          </div>
        </>
      )}
    </Modal>
  );
};

export default ClienteHistorialModal;
