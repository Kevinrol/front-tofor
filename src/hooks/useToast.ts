import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastState, ToastType } from '../components/Toast/Toast';

/**
 * Hook de notificaciones: expone el estado del toast y una función para
 * mostrarlo automáticamente durante unos segundos.
 */
export const useToast = (duracion = 4000) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      setToast({ message, type });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setToast(null), duracion);
    },
    [duracion]
  );

  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, showToast, closeToast };
};

export default useToast;
