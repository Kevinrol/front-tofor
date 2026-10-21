import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error';

export interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

/**
 * Notificación flotante reutilizable para confirmar acciones del CRUD.
 */
export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={`${styles.toast} ${toast.type === 'success' ? styles.success : styles.error}`}>
        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span>{toast.message}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar notificación">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
