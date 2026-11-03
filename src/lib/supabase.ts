import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

export async function subirComprobante(
  file: File,
  carpeta: 'compras' | 'pedidos'
): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Storage no está configurado en las variables de entorno.');
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error('Formato no permitido. Solo se aceptan archivos PDF, JPG, PNG o WebP.');
  }

  if (file.size > TAMANIO_MAXIMO_BYTES) {
    throw new Error('El archivo excede el tamaño máximo permitido de 5 MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const nombreLimpio = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const rutaArchivo = `${carpeta}/${Date.now()}_${nombreLimpio}.${extension}`;

  const { error } = await supabase.storage
    .from('comprobantes')
    .upload(rutaArchivo, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error al subir a Supabase Storage:', error);
    throw new Error(`Error al subir comprobante: ${error.message}`);
  }

  const { data } = supabase.storage.from('comprobantes').getPublicUrl(rutaArchivo);
  return data.publicUrl;
}
