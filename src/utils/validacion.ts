import type { KeyboardEvent } from 'react';

const TECLAS_BLOQUEADAS = new Set(['e', 'E', '+', '-', '.', ',']);

export interface ResultadoEntero {
  valor: string;
  valido: boolean;
  error?: string;
}

/** Deja solo dígitos y valida si es un entero permitido. */
export const sanitizarEntero = (
  valor: string,
  permitirCero = false,
): ResultadoEntero => {
  const digitos = valor.replace(/\D/g, '');
  if (digitos === '') {
    return { valor: '', valido: false, error: 'La cantidad es obligatoria.' };
  }
  const numero = Number(digitos);
  if (!permitirCero && numero === 0) {
    return {
      valor: digitos,
      valido: false,
      error: 'La cantidad debe ser un número entero mayor a 0.',
    };
  }
  return { valor: String(numero), valido: true };
};

/** Bloquea e, E, +, -, ., , sin afectar navegación ni atajos. */
export const bloquearTeclasNoNumericas = (
  event: KeyboardEvent<HTMLInputElement>,
) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (TECLAS_BLOQUEADAS.has(event.key)) event.preventDefault();
};
