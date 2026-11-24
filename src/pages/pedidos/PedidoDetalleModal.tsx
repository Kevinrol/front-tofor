import React from 'react';
import { ExternalLink, Send, Undo2 } from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { PedidoProveedor } from '../../services/pedidos-proveedor.service';
import { formatearFecha, formatearMoneda } from '../../utils/formato';

export const pillEstadoPedido = (estado: string) =>
  estado === 'Recibido'
    ? styles.pillSuccess
    : estado === 'Cancelado'
      ? styles.pillDanger
      : estado === 'Enviado' || estado === 'Parcial'
        ? styles.pillInfo
        : styles.pillWarning;

export interface PedidoDetalleModalProps {
  detalle: PedidoProveedor | null;
  onClose: () => void;
  onRecibir: (pedido: PedidoProveedor) => void;
}

/**
 * Modal de solo lectura con el detalle de líneas, recepciones parciales y comprobante del pedido.
 */
export const PedidoDetalleModal: React.FC<PedidoDetalleModalProps> = ({
  detalle,
  onClose,
  onRecibir,
}) => {
  return (
    <Modal
      open={detalle !== null}
      title={`Detalle de Pedido #${detalle?.id_pedido ?? ''}`}
      onClose={onClose}
      width={760}
    >
      {detalle && (
        <>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Proveedor</span>
              <span className={styles.detailItemValue}>{detalle.razon_social_proveedor || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Responsable</span>
              <span className={styles.detailItemValue}>{detalle.nombre_usuario || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Entrega estimada</span>
              <span className={styles.detailItemValue}>
                {detalle.fecha_entrega_estimada ? formatearFecha(detalle.fecha_entrega_estimada) : '—'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Estado</span>
              <span className={styles.detailItemValue}>
                <span className={`${styles.pill} ${pillEstadoPedido(String(detalle.estado_pedido))}`}>
                  {detalle.estado_pedido}
                </span>
              </span>
            </div>
            {detalle.comprobante_url && (
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Comprobante adjunto</span>
                <span className={styles.detailItemValue}>
                  <a
                    href={detalle.comprobante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#2563eb',
                    }}
                  >
                    <ExternalLink size={13} /> Ver archivo adjunto
                  </a>
                </span>
              </div>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className={styles.center}>Solicitado</th>
                  <th className={styles.center}>Recibido</th>
                  <th className={styles.center}>Pendiente</th>
                  <th>Unidad</th>
                  <th className={styles.right}>Precio</th>
                  <th className={styles.center}>Desc.</th>
                  <th className={styles.right}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(detalle.detalles ?? []).map((d, i) => {
                  const recibida = d.cantidad_recibida ?? 0;
                  const pendiente = d.cantidad_pendiente ?? Math.max(0, d.cantidad_solicitada - recibida);
                  return (
                    <tr key={d.id_detalle_pedido ?? i}>
                      <td className={styles.strong}>
                        {d.nombre_producto || `Producto #${d.id_producto}`}
                      </td>
                      <td className={styles.center}>{d.cantidad_solicitada}</td>
                      <td className={styles.center}>{recibida}</td>
                      <td className={styles.center}>{pendiente}</td>
                      <td>
                        {d.unidad_venta}
                        {(d.factor_conversion ?? 1) > 1
                          ? ` (${d.factor_conversion} u. = ${d.cantidad_solicitada * (d.factor_conversion ?? 1)} u.)`
                          : ''}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>
                        {formatearMoneda(d.precio_unitario_compra)}
                      </td>
                      <td className={styles.center}>{d.porcentaje_descuento ?? 0}%</td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.lineTotal}>
            <span className={styles.lineTotalLabel}>Total del pedido</span>
            {formatearMoneda(detalle.total_pedido)}
          </div>

          {detalle.estado_pedido !== 'Recibido' && detalle.estado_pedido !== 'Cancelado' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  const actual = detalle;
                  onClose();
                  onRecibir(actual);
                }}
              >
                <Send size={15} /> Recibir y generar compra
              </button>
            </div>
          )}

          {detalle.estado_pedido === 'Cancelado' && (
            <div
              className={styles.hint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}
            >
              <Undo2 size={14} /> Este pedido fue cancelado y no puede recibirse.
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default PedidoDetalleModal;
