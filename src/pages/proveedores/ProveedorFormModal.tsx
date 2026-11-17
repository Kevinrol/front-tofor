import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Shapes,
  X,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { ApiError } from '../../services/api';
import {
  LineaProducto,
  Marca,
  Proveedor,
  proveedoresService,
} from '../../services/proveedores.service';

interface FormState {
  id_proveedor?: number;
  nit: string;
  razon_social: string;
  nombre_contacto: string;
  telefono_contacto: string;
  ciudad: string;
  estado: boolean;
  marcas: string[];
  lineas_productos: string[];
}

interface ErroresForm {
  nit?: string;
  razon_social?: string;
  telefono_contacto?: string;
}

const FORM_VACIO: FormState = {
  nit: '',
  razon_social: '',
  nombre_contacto: '',
  telefono_contacto: '',
  ciudad: '',
  estado: true,
  marcas: [],
  lineas_productos: [],
};

const CIUDADES_SUGERIDAS = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Sucre',
  'Tarija',
  'Beni',
  'Pando',
];

const normalizarNombreCatalogo = (valor: string): string =>
  valor
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const validarItemCatalogoEnTiempoReal = (
  valor: string,
  seleccionados: string[],
  catalogo: string[],
  etiqueta: 'marca' | 'línea',
): string | undefined => {
  const limpio = valor.trim().replace(/\s+/g, ' ');
  if (!limpio) return undefined;

  if (limpio.length > 100) {
    return `El nombre de la ${etiqueta} no puede exceder 100 caracteres.`;
  }

  const norm = normalizarNombreCatalogo(limpio);
  const enProveedor = seleccionados.find(
    (item) => normalizarNombreCatalogo(item) === norm,
  );
  if (enProveedor) {
    return `La ${etiqueta} "${enProveedor}" ya está vinculada a este proveedor.`;
  }

  const enCatalogo = catalogo.find(
    (item) => normalizarNombreCatalogo(item) === norm,
  );
  if (enCatalogo) {
    return `La ${etiqueta} "${enCatalogo}" ya existe en el catálogo; selecciónala en la lista superior.`;
  }

  return undefined;
};

export interface ProveedorFormModalProps {
  open: boolean;
  proveedor: Proveedor | null;
  proveedoresExistentes: Proveedor[];
  marcas: Marca[];
  lineas: LineaProducto[];
  onClose: () => void;
  onGuardado: (mensaje: string) => void;
  onMarcaCreada: (marca: Marca) => void;
  onLineaCreada: (linea: LineaProducto) => void;
  onToast: (mensaje: string, tipo?: 'success' | 'error') => void;
}

/**
 * Modal de registro y actualización de proveedores con validación en tiempo real
 * de NIT/CI, teléfono y prevención de marcas o líneas repetidas.
 */
export const ProveedorFormModal: React.FC<ProveedorFormModalProps> = ({
  open,
  proveedor,
  proveedoresExistentes,
  marcas,
  lineas,
  onClose,
  onGuardado,
  onMarcaCreada,
  onLineaCreada,
  onToast,
}) => {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [saving, setSaving] = useState(false);

  const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
  const [nuevaLineaInput, setNuevaLineaInput] = useState('');
  const [errorMarcaServidor, setErrorMarcaServidor] = useState<string | undefined>();
  const [errorLineaServidor, setErrorLineaServidor] = useState<string | undefined>();
  const [guardandoMarca, setGuardandoMarca] = useState(false);
  const [guardandoLinea, setGuardandoLinea] = useState(false);

  const hayErrores = Object.values(errores).some(Boolean);

  useEffect(() => {
    if (!open) return;

    if (proveedor) {
      setForm({
        id_proveedor: proveedor.id_proveedor,
        nit: proveedor.nit ?? '',
        razon_social: proveedor.razon_social ?? '',
        nombre_contacto: proveedor.nombre_contacto ?? '',
        telefono_contacto: proveedor.telefono_contacto ?? '',
        ciudad: proveedor.ciudad ?? '',
        estado: proveedor.estado ?? true,
        marcas: proveedor.marcas ? [...proveedor.marcas] : [],
        lineas_productos: proveedor.lineas_productos ? [...proveedor.lineas_productos] : [],
      });
    } else {
      setForm(FORM_VACIO);
    }
    setErrores({});
    setNuevaMarcaInput('');
    setNuevaLineaInput('');
    setErrorMarcaServidor(undefined);
    setErrorLineaServidor(undefined);
    setGuardandoMarca(false);
    setGuardandoLinea(false);
    setSaving(false);
  }, [open, proveedor]);

  const validarNitEnTiempoReal = (
    nit: string,
    idActual?: number,
  ): string | undefined => {
    const limpio = nit.trim();
    if (!limpio) {
      return undefined;
    }
    if (limpio.length > 30) {
      return 'El NIT/CI no puede exceder 30 caracteres.';
    }
    if (/\s/.test(limpio)) {
      return 'El NIT/CI no debe contener espacios intermedios.';
    }
    if (!/^[\d-]+$/.test(limpio)) {
      return 'El NIT/CI debe contener únicamente números y guiones.';
    }
    const repetido = proveedoresExistentes.find(
      (p) =>
        p.nit &&
        p.nit.trim().toLowerCase() === limpio.toLowerCase() &&
        p.id_proveedor !== idActual,
    );
    if (repetido) {
      return `NIT/CI ya registrado en: "${repetido.razon_social}" (${repetido.estado ? 'Activo' : 'Inactivo'}).`;
    }
    return undefined;
  };

  const validarTelefonoEnTiempoReal = (telefono: string): string | undefined => {
    const limpio = telefono.trim();
    if (!limpio) return undefined;
    if (!/^\+?[\d\s-]{7,15}$/.test(limpio)) {
      return 'El formato del teléfono no es válido (7 a 15 dígitos).';
    }
    return undefined;
  };

  const actualizarNit = (valor: string) => {
    setForm((prev) => ({ ...prev, nit: valor }));
    const error = validarNitEnTiempoReal(valor, form.id_proveedor);
    setErrores((prev) => ({ ...prev, nit: error }));
  };

  const actualizarTelefono = (valor: string) => {
    setForm((prev) => ({ ...prev, telefono_contacto: valor }));
    const error = validarTelefonoEnTiempoReal(valor);
    setErrores((prev) => ({ ...prev, telefono_contacto: error }));
  };

  const validarFormulario = (): boolean => {
    const nuevos: ErroresForm = {};

    if (!form.razon_social.trim()) {
      nuevos.razon_social = 'La Razón Social o Nombre Comercial es obligatoria.';
    }

    if (!form.nit.trim()) {
      nuevos.nit = 'El NIT/CI es obligatorio para registrar un proveedor.';
    } else {
      const errNit = validarNitEnTiempoReal(form.nit, form.id_proveedor);
      if (errNit) nuevos.nit = errNit;
    }

    if (form.telefono_contacto.trim()) {
      const errTel = validarTelefonoEnTiempoReal(form.telefono_contacto);
      if (errTel) nuevos.telefono_contacto = errTel;
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  // Validación en tiempo real para evitar marcas o líneas repetidas
  const errorMarcaLocal = useMemo(
    () =>
      validarItemCatalogoEnTiempoReal(
        nuevaMarcaInput,
        form.marcas,
        marcas.map((m) => m.nombre_marca),
        'marca',
      ),
    [nuevaMarcaInput, form.marcas, marcas],
  );
  const errorMarca = errorMarcaLocal ?? errorMarcaServidor;

  const errorLineaLocal = useMemo(
    () =>
      validarItemCatalogoEnTiempoReal(
        nuevaLineaInput,
        form.lineas_productos,
        lineas.map((l) => l.nombre_linea),
        'línea',
      ),
    [nuevaLineaInput, form.lineas_productos, lineas],
  );
  const errorLinea = errorLineaLocal ?? errorLineaServidor;

  const agregarMarcaAForm = (marcaNombre: string) => {
    const limpio = marcaNombre.trim().replace(/\s+/g, ' ');
    if (!limpio) return;
    const norm = normalizarNombreCatalogo(limpio);
    if (!form.marcas.some((m) => normalizarNombreCatalogo(m) === norm)) {
      setForm((prev) => ({ ...prev, marcas: [...prev.marcas, limpio] }));
    }
  };

  const quitarMarcaDeForm = (marcaNombre: string) => {
    const norm = normalizarNombreCatalogo(marcaNombre);
    setForm((prev) => ({
      ...prev,
      marcas: prev.marcas.filter((m) => normalizarNombreCatalogo(m) !== norm),
    }));
  };

  const agregarLineaAForm = (lineaNombre: string) => {
    const limpio = lineaNombre.trim().replace(/\s+/g, ' ');
    if (!limpio) return;
    const norm = normalizarNombreCatalogo(limpio);
    if (!form.lineas_productos.some((l) => normalizarNombreCatalogo(l) === norm)) {
      setForm((prev) => ({ ...prev, lineas_productos: [...prev.lineas_productos, limpio] }));
    }
  };

  const quitarLineaDeForm = (lineaNombre: string) => {
    const norm = normalizarNombreCatalogo(lineaNombre);
    setForm((prev) => ({
      ...prev,
      lineas_productos: prev.lineas_productos.filter(
        (l) => normalizarNombreCatalogo(l) !== norm,
      ),
    }));
  };

  const crearYNuevaMarca = async () => {
    const limpio = nuevaMarcaInput.trim().replace(/\s+/g, ' ');
    if (!limpio || guardandoMarca) return;

    const err = validarItemCatalogoEnTiempoReal(
      limpio,
      form.marcas,
      marcas.map((m) => m.nombre_marca),
      'marca',
    );
    if (err) return;

    setGuardandoMarca(true);
    setErrorMarcaServidor(undefined);
    try {
      const nueva = await proveedoresService.createMarca(limpio);
      onMarcaCreada(nueva);
      agregarMarcaAForm(nueva.nombre_marca);
      setNuevaMarcaInput('');
      onToast(`Marca "${nueva.nombre_marca}" creada y asociada.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrorMarcaServidor(error.message);
      } else {
        console.error(error);
        onToast('No se pudo registrar la marca en el servidor.', 'error');
      }
    } finally {
      setGuardandoMarca(false);
    }
  };

  const crearYNuevaLinea = async () => {
    const limpio = nuevaLineaInput.trim().replace(/\s+/g, ' ');
    if (!limpio || guardandoLinea) return;

    const err = validarItemCatalogoEnTiempoReal(
      limpio,
      form.lineas_productos,
      lineas.map((l) => l.nombre_linea),
      'línea',
    );
    if (err) return;

    setGuardandoLinea(true);
    setErrorLineaServidor(undefined);
    try {
      const nueva = await proveedoresService.createLineaProducto(limpio);
      onLineaCreada(nueva);
      agregarLineaAForm(nueva.nombre_linea);
      setNuevaLineaInput('');
      onToast(`Línea "${nueva.nombre_linea}" creada y asociada.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrorLineaServidor(error.message);
      } else {
        console.error(error);
        onToast('No se pudo registrar la línea en el servidor.', 'error');
      }
    } finally {
      setGuardandoLinea(false);
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      const { id_proveedor, ...payload } = form;
      if (id_proveedor) {
        await proveedoresService.updateProveedor(id_proveedor, payload);
        onGuardado(`Proveedor "${form.razon_social}" actualizado exitosamente.`);
      } else {
        await proveedoresService.createProveedor(payload);
        onGuardado(`Proveedor "${form.razon_social}" registrado exitosamente.`);
      }
    } catch (error) {
      console.error(error);
      const mensaje =
        error instanceof Error
          ? error.message
          : 'Error al guardar el proveedor en el servidor.';
      if (error instanceof ApiError && error.status === 409) {
        setErrores((prev) => ({ ...prev, nit: mensaje }));
      } else {
        onToast(mensaje, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const marcasDisponibles = useMemo(() => {
    const seleccionadas = new Set(form.marcas.map((m) => normalizarNombreCatalogo(m)));
    return marcas.filter((m) => !seleccionadas.has(normalizarNombreCatalogo(m.nombre_marca)));
  }, [marcas, form.marcas]);

  const lineasDisponibles = useMemo(() => {
    const seleccionadas = new Set(
      form.lineas_productos.map((l) => normalizarNombreCatalogo(l)),
    );
    return lineas.filter((l) => !seleccionadas.has(normalizarNombreCatalogo(l.nombre_linea)));
  }, [lineas, form.lineas_productos]);

  return (
    <Modal
      open={open}
      title={form.id_proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      onClose={onClose}
      width={940}
      footer={
        <>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-proveedor"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || hayErrores}
          >
            {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
            {saving
              ? 'Guardando...'
              : form.id_proveedor
              ? 'Actualizar Proveedor'
              : 'Guardar Proveedor'}
          </button>
        </>
      }
    >
      <form
        id="form-proveedor"
        onSubmit={guardar}
        noValidate
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(340px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Columna Izquierda: Datos Formales y Contacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prov-razon">
              Razón Social / Nombre Comercial <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="prov-razon"
              className={`${styles.input} ${errores.razon_social ? styles.inputError : ''}`}
              type="text"
              value={form.razon_social}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, razon_social: e.target.value }));
                if (errores.razon_social) {
                  setErrores((prev) => ({ ...prev, razon_social: undefined }));
                }
              }}
              placeholder="Ej: Distribuidora Escolar Papelera S.A."
            />
            {errores.razon_social && (
              <span
                className={styles.fieldError}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <AlertCircle size={13} /> {errores.razon_social}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prov-nit">
              NIT / CI <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="prov-nit"
              className={`${styles.input} ${errores.nit ? styles.inputError : ''}`}
              type="text"
              value={form.nit}
              onChange={(e) => actualizarNit(e.target.value)}
              placeholder="Ej: 1020304050 o 1020304-1B"
            />
            {errores.nit ? (
              <span
                className={styles.fieldError}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
              >
                <AlertCircle size={13} /> {errores.nit}
              </span>
            ) : form.nit.trim() ? (
              <span
                style={{
                  fontSize: '12px',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={13} /> NIT/CI disponible y válido
              </span>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-contacto">
                Nombre del Contacto
              </label>
              <input
                id="prov-contacto"
                className={styles.input}
                type="text"
                value={form.nombre_contacto}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre_contacto: e.target.value }))
                }
                placeholder="Ej: Carlos Valenzuela"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-tel">
                Teléfono / WhatsApp
              </label>
              <input
                id="prov-tel"
                className={`${styles.input} ${errores.telefono_contacto ? styles.inputError : ''}`}
                type="text"
                value={form.telefono_contacto}
                onChange={(e) => actualizarTelefono(e.target.value)}
                placeholder="Ej: 71234567"
              />
              {errores.telefono_contacto && (
                <span
                  className={styles.fieldError}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <AlertCircle size={13} /> {errores.telefono_contacto}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-ciudad">
                Ciudad de Despacho
              </label>
              <input
                id="prov-ciudad"
                list="lista-ciudades-prov"
                className={styles.input}
                type="text"
                value={form.ciudad}
                onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ej: La Paz"
              />
              <datalist id="lista-ciudades-prov">
                {CIUDADES_SUGERIDAS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-estado">
                Estado Operativo
              </label>
              <select
                id="prov-estado"
                className={styles.select}
                value={form.estado ? 'true' : 'false'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))
                }
              >
                <option value="true">Activo (Habilitado)</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Marcas y Líneas Abastecidas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderLeft: '1px solid var(--color-border-light)',
            paddingLeft: '20px',
          }}
        >
          {/* Sección Marcas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                className={styles.fieldLabel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Award size={14} color="#7C3AED" /> Marcas que Abastece
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {form.marcas.length} seleccionadas
              </span>
            </div>

            {/* Chips de marcas seleccionadas */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                minHeight: '36px',
                padding: '6px',
                background: 'var(--color-bg-subtle)',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {form.marcas.length === 0 ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                    padding: '4px',
                  }}
                >
                  Ninguna marca seleccionada.
                </span>
              ) : (
                form.marcas.map((m) => (
                  <span
                    key={m}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: '#F0E7FE',
                      color: '#7C3AED',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                    }}
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => quitarMarcaDeForm(m)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#7C3AED',
                      }}
                      title="Quitar marca"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Selector de marcas existentes */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                aria-label="Vincular marca existente"
                className={styles.select}
                value=""
                onChange={(e) => {
                  if (e.target.value) agregarMarcaAForm(e.target.value);
                }}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <option value="">+ Vincular marca existente...</option>
                {marcasDisponibles.map((m) => (
                  <option key={m.nombre_marca} value={m.nombre_marca}>
                    {m.nombre_marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Input para crear nueva marca al vuelo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  aria-label="Crear nueva marca"
                  className={`${styles.input} ${errorMarca ? styles.inputError : ''}`}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={nuevaMarcaInput}
                  onChange={(e) => {
                    setNuevaMarcaInput(e.target.value);
                    if (errorMarcaServidor) setErrorMarcaServidor(undefined);
                  }}
                  placeholder="Crear nueva marca..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      crearYNuevaMarca();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: '11px', padding: '6px 10px', flexShrink: 0 }}
                  onClick={crearYNuevaMarca}
                  disabled={guardandoMarca || !nuevaMarcaInput.trim() || Boolean(errorMarca)}
                >
                  {guardandoMarca ? (
                    <Loader2 size={12} className={styles.spinner} />
                  ) : (
                    <Plus size={12} />
                  )}
                  Agregar marca
                </button>
              </div>
              {errorMarca ? (
                <span
                  className={styles.fieldError}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                >
                  <AlertCircle size={12} /> {errorMarca}
                </span>
              ) : nuevaMarcaInput.trim() ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={12} /> Marca disponible para crear
                </span>
              ) : null}
            </div>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: '1px dashed var(--color-border-light)',
              margin: '4px 0',
            }}
          />

          {/* Sección Líneas de Producto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                className={styles.fieldLabel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Shapes size={14} color="#2563EB" /> Líneas de Producto
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {form.lineas_productos.length} seleccionadas
              </span>
            </div>

            {/* Chips de líneas seleccionadas */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                minHeight: '36px',
                padding: '6px',
                background: 'var(--color-bg-subtle)',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {form.lineas_productos.length === 0 ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                    padding: '4px',
                  }}
                >
                  Ninguna línea seleccionada.
                </span>
              ) : (
                form.lineas_productos.map((l) => (
                  <span
                    key={l}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: '#E0EDFF',
                      color: '#2563EB',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => quitarLineaDeForm(l)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#2563EB',
                      }}
                      title="Quitar línea"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Selector de líneas existentes */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                aria-label="Vincular línea existente"
                className={styles.select}
                value=""
                onChange={(e) => {
                  if (e.target.value) agregarLineaAForm(e.target.value);
                }}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <option value="">+ Vincular línea existente...</option>
                {lineasDisponibles.map((l) => (
                  <option key={l.nombre_linea} value={l.nombre_linea}>
                    {l.nombre_linea}
                  </option>
                ))}
              </select>
            </div>

            {/* Input para crear nueva línea al vuelo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  aria-label="Crear nueva línea"
                  className={`${styles.input} ${errorLinea ? styles.inputError : ''}`}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={nuevaLineaInput}
                  onChange={(e) => {
                    setNuevaLineaInput(e.target.value);
                    if (errorLineaServidor) setErrorLineaServidor(undefined);
                  }}
                  placeholder="Crear nueva línea..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      crearYNuevaLinea();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: '11px', padding: '6px 10px', flexShrink: 0 }}
                  onClick={crearYNuevaLinea}
                  disabled={guardandoLinea || !nuevaLineaInput.trim() || Boolean(errorLinea)}
                >
                  {guardandoLinea ? (
                    <Loader2 size={12} className={styles.spinner} />
                  ) : (
                    <Plus size={12} />
                  )}
                  Agregar línea
                </button>
              </div>
              {errorLinea ? (
                <span
                  className={styles.fieldError}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                >
                  <AlertCircle size={12} /> {errorLinea}
                </span>
              ) : nuevaLineaInput.trim() ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={12} /> Línea disponible para crear
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProveedorFormModal;
