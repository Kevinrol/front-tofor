/** Formatea un monto numérico como moneda boliviana (Bs). */
export const formatearMoneda = (valor: number | null | undefined): string => {
  const numero = Number(valor ?? 0);
  return `Bs ${numero.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Formatea una fecha (ISO o Date) como fecha y hora legible. */
export const formatearFechaHora = (valor: string | Date | null | undefined): string => {
  if (!valor) return '—';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
};

/** Formatea una fecha (ISO o Date) como fecha corta (sin hora). */
export const formatearFecha = (valor: string | Date | null | undefined): string => {
  if (!valor) return '—';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
};

/** Convierte una fecha/hora a valor para <input type="datetime-local">. */
export const aDatetimeLocal = (valor: string | Date | null | undefined): string => {
  if (!valor) return '';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

/** Convierte una fecha a valor para <input type="date">. */
export const aDateInput = (valor: string | Date | null | undefined): string => {
  if (!valor) return '';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toISOString().slice(0, 10);
};
