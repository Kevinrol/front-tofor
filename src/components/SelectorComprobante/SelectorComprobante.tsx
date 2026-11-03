import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { subirComprobante } from '../../lib/supabase';
import styles from './SelectorComprobante.module.css';

interface Props {
  urlActual?: string | null;
  onArchivoSubido: (url: string) => void;
  onEliminar: () => void;
  carpeta: 'compras' | 'pedidos';
  disabled?: boolean;
  etiqueta?: string;
}

export const SelectorComprobante: React.FC<Props> = ({
  urlActual,
  onArchivoSubido,
  onEliminar,
  carpeta,
  disabled = false,
  etiqueta = 'Comprobante / Factura (PDF o imagen)',
}) => {
  const [subiendo, setSubiendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const manejarSeleccion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorLocal(null);
    setSubiendo(true);
    try {
      const url = await subirComprobante(file, carpeta);
      onArchivoSubido(url);
    } catch (err) {
      console.error(err);
      setErrorLocal(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const abrirSelector = () => {
    if (!disabled && !subiendo) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={styles.contenedor}>
      <label className={styles.etiqueta}>
        <FileText size={16} />
        {etiqueta}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={manejarSeleccion}
        className={styles.inputOculto}
        disabled={disabled || subiendo}
      />

      {subiendo ? (
        <div className={styles.areaSubida}>
          <div className={styles.cargando}>
            <Loader2 className="animate-spin" size={20} />
            <span>Subiendo archivo a Supabase Storage...</span>
          </div>
        </div>
      ) : urlActual ? (
        <div className={styles.cardCargado}>
          <div className={styles.infoArchivo}>
            <CheckCircle2 className={styles.iconoExito} />
            <a
              href={urlActual}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.enlaceArchivo}
              title="Abrir comprobante"
            >
              Comprobante adjuntado
            </a>
          </div>
          <div className={styles.accionesCargado}>
            <a
              href={urlActual}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.botonIcono}
              style={{ color: '#2563eb' }}
              title="Visualizar comprobante"
            >
              <ExternalLink size={16} />
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={onEliminar}
                className={styles.botonIcono}
                title="Quitar archivo adjunto"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={abrirSelector}
          className={`${styles.areaSubida} ${disabled ? styles.deshabilitado : ''}`}
        >
          <UploadCloud className={styles.icono} />
          <p className={styles.textoPrincipal}>
            <span className={styles.textoDestacado}>Haz clic para adjuntar</span> o arrastra un archivo
          </p>
          <p className={styles.textoSecundario}>PDF, JPG, PNG o WebP (máx. 5 MB)</p>
        </div>
      )}

      {errorLocal && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
          {errorLocal}
        </p>
      )}
    </div>
  );
};
