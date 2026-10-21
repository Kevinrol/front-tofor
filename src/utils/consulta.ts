/**
 * Construye un query string a partir de un objeto, omitiendo valores
 * vacíos, nulos o indefinidos. Devuelve '' si no hay parámetros.
 */
export const construirQuery = (
  params: Record<string, string | number | boolean | undefined | null>
): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

/**
 * Convierte un valor de entrada a número, devolviendo undefined si no es válido.
 */
export const aNumero = (value: string | number): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};
