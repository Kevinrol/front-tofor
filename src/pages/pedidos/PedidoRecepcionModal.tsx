import React, { useEffect, useState } from 'react';
import { Loader2, PackageCheck } from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { SelectorComprobante } from '../../components/SelectorComprobante/SelectorComprobante';
import { PedidoProveedor, pedidosService } from '../../services/pedidos-proveedor.service';
import { Usuario } from '../../services/usuarios.service';
import { aNumero } from '../../utils/consulta';
import { formatearMoneda } from '../../utils/formato';

export interface PedidoRecepcionModalProps {
  pedido: PedidoProveedor | null;
  usuarios: Usuario[];
  onClose: () => void;
  onRecibido: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}

/**
 * Modal para confirmar la recepción de mercadería de un pedido y generar la compra asociada.
 */
export const PedidoRecepcionModal: React.FC<PedidoRecepcionModalProps> = ({
  pedido,
  usuarios,
  onClose,
  onRecibido,
  onError,
}) => {
  const [comprobanteRecepcion, setComprobanteRecepcion] = useState<string>('');
  const [usuarioRecepcion, setUsuarioRecepcion] = useState<string>('');
  const [recibiendo, setRecibiendo] = useState<boolean>(false);

  useEffect(() => {
    if (!pedido) return;
    setComprobanteRecepcion('');
    setUsuarioRecepcion(usuarios[0]?.id_usuario ? String(usuarios[0].id_usuario) : '');
    setRecibiendo(false);
  }, [pedido, usuarios]);

  const confirmarRecepcion = async () => {
    if (pedido?.id_pedido == null) return;
    setRecibiendo(true);
    try {
      const idUsr = aNumero(usuarioRecepcion);
      const resultado = await pedidosService.recibir(
        pedido.id_pedido,
        idUsr,
        undefined,
        comprobanteRecepcion || null,
      );
      onRecibido(resultado?.mensaje || 'Pedido recibido y compra generada correctamente.');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al recibir el pedido.');
    } finally {
      setRecibiendo(false);
    }
  };

  return (
    <Modal
      open={pedido !== null}
      title={`Recepción de Mercadería — Pedido #${pedido?.id_pedido ?? ''}`}
      onClose={onClose}
      width={560}
      footer={
        <>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
            disabled={recibiendo}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={confirmarRecepcion}
            disabled={recibiendo}
          >
            {recibiendo ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <PackageCheck size={16} />
            )}
            {recibiendo ? 'Recepcionando...' : 'Confirmar Recepción y Generar Compra'}
          </button>
        </>
      }
    >
      {pedido && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Proveedor</span>
              <span className={styles.detailItemValue}>{pedido.razon_social_proveedor || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Total Pedido</span>
              <span className={styles.detailItemValue}>{formatearMoneda(pedido.total_pedido)}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="recepcion-usuario">
              Personal que recibe la mercadería <span className={styles.requiredMark}>*</span>
            </label>
            <select
              id="recepcion-usuario"
              className={styles.select}
              value={usuarioRecepcion}
              onChange={(e) => setUsuarioRecepcion(e.target.value)}
            >
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre_completo} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <SelectorComprobante
              urlActual={comprobanteRecepcion}
              onArchivoSubido={(url) => setComprobanteRecepcion(url)}
              onEliminar={() => setComprobanteRecepcion('')}
              carpeta="pedidos"
              etiqueta="Nota de entrega / Factura del proveedor (PDF o imagen)"
            />
          </div>

          <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
            Al confirmar, se registrará la recepción de mercadería, se generará la compra asociada enlazada a este
            pedido y se incrementará automáticamente el stock de los productos.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PedidoRecepcionModal;
