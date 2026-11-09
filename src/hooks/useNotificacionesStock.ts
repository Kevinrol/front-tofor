import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { productosService, Producto } from '../services/productos.service';

interface OpcionesNotificaciones {
  onNuevoBajoStock?: (producto: Producto) => void;
}

export function useNotificacionesStock(opciones: OpcionesNotificaciones = {}) {
  const [alertas, setAlertas] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarAlertas = useCallback(async () => {
    try {
      setError(null);
      const datos = await productosService.getBajoStock();
      setAlertas(datos || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener alertas de stock';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarAlertas();

    // Suscripción reactiva mediante Supabase Realtime (CDC de PostgreSQL)
    const canal = supabase
      .channel('cambios-stock-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
        },
        async (payload) => {
          // Si el evento es un UPDATE que deja el stock por debajo o igual al mínimo
          if (payload.eventType === 'UPDATE' && payload.new) {
            const nuevo = payload.new as Producto;
            if (nuevo.estado && Number(nuevo.stock_actual) <= Number(nuevo.stock_minimo)) {
              opciones.onNuevoBajoStock?.(nuevo);
            }
          }

          // Refrescamos la lista de alertas para garantizar consistencia completa
          try {
            const datos = await productosService.getBajoStock();
            setAlertas(datos || []);
          } catch (err) {
            console.error('Error al actualizar alertas de stock:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargarAlertas, opciones]);

  return {
    alertas,
    totalAlertas: alertas.length,
    cargando,
    error,
    refrescar: cargarAlertas,
  };
}

export default useNotificacionesStock;
