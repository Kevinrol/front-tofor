import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { ApiError } from '../../services/api';
import {
  Cliente,
  ClientePayload,
  clientesService,
  TipoCliente,
} from '../../services/clientes.service';

interface FormState {
  id_cliente?: number;
  razon_social_nombre: string;
  nit_ci: string;
  telefono: string;
  direccion: string;
  tipo_cliente: TipoCliente;
  estado: boolean;
}

interface ErroresForm {
  razon_social_nombre?: string;
  nit_ci?: string;
}

const FORM_VACIO: FormState = {
  razon_social_nombre: '',
  nit_ci: '',
  telefono: '',
  direccion: '',
  tipo_cliente: 'Mayorista',
  estado: true,
};

const TIPOS_REGISTRO: TipoCliente[] = ['Mayorista'];

export interface ClienteFormModalProps {
  open: boolean;
  cliente: Cliente | null;
  clientesExistentes: Cliente[];
  onClose: () => void;
  onGuardado: (mensaje: string) => void;
  onError?: (mensaje: string) => void;
}

/**
 * Modal de registro y actualización de clientes con validación en tiempo real de NIT / CI.
 */
export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  open,
  cliente,
  clientesExistentes,
  onClose,
  onGuardado,
  onError,
}) => {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [saving, setSaving] = useState(false);

  const validarNitCiEnTiempoReal = (
    nitCi: string,
    idActual?: number,
  ): string | undefined => {
    const limpio = nitCi.trim();
    if (!limpio) {
      return undefined;
    }
    if (/\s/.test(limpio)) {
      return 'El NIT / CI no debe contener espacios.';
    }
    if (!/^\d+$/.test(limpio)) {
      return 'El NIT / CI debe contener únicamente números.';
    }
    if (limpio.length < 5) {
      return 'El NIT / CI debe tener al menos 5 dígitos.';
    }
    if (limpio.length > 20) {
      return 'El NIT / CI no puede exceder 20 dígitos.';
    }
    const repetido = clientesExistentes.find(
      (c) =>
        c.nit_ci &&
        c.nit_ci.trim() === limpio &&
        c.id_cliente !== idActual,
    );
    if (repetido) {
      return `NIT / CI ya registrado en: "${repetido.razon_social_nombre}" (${repetido.estado ? 'Activo' : 'Inactivo'}).`;
    }
    return undefined;
  };

  useEffect(() => {
    if (!open) return;

    if (cliente) {
      const nitInicial = cliente.nit_ci ?? '';
      setForm({
        id_cliente: cliente.id_cliente,
        razon_social_nombre: cliente.razon_social_nombre,
        nit_ci: nitInicial,
        telefono: cliente.telefono ?? '',
        direccion: cliente.direccion ?? '',
        tipo_cliente: (cliente.tipo_cliente as TipoCliente) ?? 'Mayorista',
        estado: cliente.estado,
      });
      const errorInicial = validarNitCiEnTiempoReal(nitInicial, cliente.id_cliente);
      setErrores(errorInicial ? { nit_ci: errorInicial } : {});
    } else {
      setForm(FORM_VACIO);
      setErrores({});
    }
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente]);

  const actualizarNitCi = (valor: string) => {
    setForm((prev) => ({ ...prev, nit_ci: valor }));
    const error = validarNitCiEnTiempoReal(valor, form.id_cliente);
    setErrores((prev) => ({ ...prev, nit_ci: error }));
  };

  const validarFormulario = (): boolean => {
    const nuevos: ErroresForm = {};

    if (!form.razon_social_nombre.trim()) {
      nuevos.razon_social_nombre = 'El nombre o razón social es obligatorio.';
    }

    if (!form.nit_ci.trim()) {
      nuevos.nit_ci = 'El NIT / CI es obligatorio.';
    } else {
      const errNit = validarNitCiEnTiempoReal(form.nit_ci, form.id_cliente);
      if (errNit) nuevos.nit_ci = errNit;
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validarFormulario()) return;

    const payload: ClientePayload = {
      razon_social_nombre: form.razon_social_nombre.trim(),
      nit_ci: form.nit_ci.trim(),
      tipo_cliente: form.tipo_cliente,
      estado: form.estado,
    };
    if (form.telefono.trim()) payload.telefono = form.telefono.trim();
    if (form.direccion.trim()) payload.direccion = form.direccion.trim();

    setSaving(true);
    try {
      if (form.id_cliente) {
        await clientesService.update(form.id_cliente, payload);
        onGuardado('Cliente actualizado correctamente.');
      } else {
        await clientesService.create(payload);
        onGuardado('Cliente registrado correctamente.');
      }
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al guardar el cliente.';
      if (error instanceof ApiError && error.status === 409) {
        setErrores((prev) => ({ ...prev, nit_ci: mensaje }));
      } else {
        onError?.(mensaje);
      }
    } finally {
      setSaving(false);
    }
  };

  const nitValidoDisponible = Boolean(form.nit_ci.trim()) && !errores.nit_ci;

  return (
    <Modal
      open={open}
      title={form.id_cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      onClose={onClose}
      width={600}
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
            form="form-cliente"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving || Boolean(errores.nit_ci)}
          >
            {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={guardar} className={styles.formGrid} noValidate>
        <div className={`${styles.field} ${styles.formGridFull}`}>
          <label className={styles.fieldLabel} htmlFor="cli-nombre">
            Nombre o razón social <span className={styles.requiredMark}>*</span>
          </label>
          <input
            id="cli-nombre"
            className={`${styles.input} ${errores.razon_social_nombre ? styles.inputError : ''}`}
            type="text"
            value={form.razon_social_nombre}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, razon_social_nombre: e.target.value }));
              if (errores.razon_social_nombre) {
                setErrores((prev) => ({ ...prev, razon_social_nombre: undefined }));
              }
            }}
            placeholder="Ej: Librería Central"
          />
          {errores.razon_social_nombre && (
            <span
              className={styles.fieldError}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <AlertCircle size={13} /> {errores.razon_social_nombre}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cli-nit">
            NIT / CI <span className={styles.requiredMark}>*</span>
          </label>
          <input
            id="cli-nit"
            className={`${styles.input} ${errores.nit_ci ? styles.inputError : ''}`}
            type="text"
            inputMode="numeric"
            value={form.nit_ci}
            onChange={(e) => actualizarNitCi(e.target.value)}
            placeholder="Ej: 1029384756"
          />
          {errores.nit_ci ? (
            <span
              className={styles.fieldError}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <AlertCircle size={13} /> {errores.nit_ci}
            </span>
          ) : nitValidoDisponible ? (
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
              <CheckCircle2 size={13} /> NIT / CI disponible y válido
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cli-tipo">
            Tipo de cliente
          </label>
          <select
            id="cli-tipo"
            className={styles.select}
            value={form.tipo_cliente}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tipo_cliente: e.target.value as TipoCliente }))
            }
          >
            {TIPOS_REGISTRO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cli-telefono">
            Teléfono
          </label>
          <input
            id="cli-telefono"
            className={styles.input}
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
            placeholder="Ej: 71234567"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cli-direccion">
            Dirección
          </label>
          <input
            id="cli-direccion"
            className={styles.input}
            type="text"
            value={form.direccion}
            onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
            placeholder="Ej: Av. 6 de Marzo #123"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cli-estado">
            Estado
          </label>
          <select
            id="cli-estado"
            className={styles.select}
            value={form.estado ? 'true' : 'false'}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))
            }
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default ClienteFormModal;
