import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, ArrowUpCircle, ArrowDownCircle, Equal } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { Producto, TipoAjusteStock, productosService } from '../../services/productos.service';
import { bloquearTeclasNoNumericas, sanitizarEntero } from '../../utils/validacion';
import modalStyles from './AjusteStockModal.module.css';
import crudStyles from '../../styles/crud.module.css';

export interface AjusteStockModalProps {
  producto: Producto | null;
  onClose: () => void;
  onGuardado: (producto: Producto) => void;
}

export const AjusteStockModal: React.FC<AjusteStockModalProps> = ({
  producto,
  onClose,
  onGuardado,
}) => {
  const [tipo, setTipo] = useState<TipoAjusteStock>('ENTRADA');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [errorCantidad, setErrorCantidad] = useState<string | undefined>();
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!producto) return;
    setTipo('ENTRADA');
    setCantidad('1');
    setMotivo('');
    setErrorCantidad(undefined);
    setErrorEnvio(null);
    setSaving(false);
  }, [producto]);

  if (!producto) return null;

  const anterior = Number(producto.stock_actual ?? 0);
  const cantRes = sanitizarEntero(cantidad, false);
  const cantidadNum = cantRes.valido ? Number(cantRes.valor) : 0;

  const resultante =
    tipo === 'ENTRADA'
      ? anterior + cantidadNum
      : tipo === 'SALIDA'
        ? anterior - cantidadNum
        : cantidadNum;

  const esSalidaInsuficiente = tipo === 'SALIDA' && cantRes.valido && resultante < 0;
  const motivoFaltante = tipo !== 'ENTRADA' && !motivo.trim();

  const formularioValido =
    cantRes.valido &&
    !esSalidaInsuficiente &&
    !motivoFaltante;

  const handleCantidadChange = (valor: string) => {
    const res = sanitizarEntero(valor, false);
    setCantidad(res.valor);
    setErrorCantidad(res.error);
    setErrorEnvio(null);
  };

  const handleConfirmar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!producto.id_producto || !formularioValido) return;

    setSaving(true);
    setErrorEnvio(null);
    try {
      const actualizado = await productosService.ajustarStock(producto.id_producto, {
        tipo,
        cantidad: cantidadNum,
        ...(tipo !== 'ENTRADA' ? { motivo: motivo.trim() } : {}),
      });
      onGuardado(actualizado);
    } catch (err) {
      setErrorEnvio(
        err instanceof Error ? err.message : 'Error al actualizar el stock.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(producto)}
      title="Actualizar Stock"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button
            type="button"
            className={`${crudStyles.btn} ${crudStyles.btnGhost}`}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-ajuste-stock"
            className={`${crudStyles.btn} ${crudStyles.btnPrimary}`}
            disabled={saving || !formularioValido}
          >
            {saving ? (
              <Loader2 size={16} className={crudStyles.spinner} />
            ) : (
              <RefreshCw size={16} />
            )}
            {saving ? 'Guardando...' : 'Confirmar Ajuste'}
          </button>
        </>
      }
    >
      <form
        id="form-ajuste-stock"
        onSubmit={handleConfirmar}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        noValidate
      >
        <div className={modalStyles.productoInfo}>
          <span className={modalStyles.productoNombre}>{producto.nombre_producto}</span>
          <span className={modalStyles.productoStock}>
            Stock actual: <strong>{anterior} u.</strong>
          </span>
        </div>

        <div className={crudStyles.field}>
          <label className={crudStyles.fieldLabel}>Tipo de ajuste</label>
          <div className={modalStyles.radioGroup}>
            <button
              type="button"
              className={`${modalStyles.radioButton} ${
                tipo === 'ENTRADA' ? modalStyles.radioButtonActive : ''
              }`}
              onClick={() => {
                setTipo('ENTRADA');
                setErrorEnvio(null);
              }}
            >
              <ArrowUpCircle size={16} /> Entrada
            </button>
            <button
              type="button"
              className={`${modalStyles.radioButton} ${
                tipo === 'SALIDA' ? modalStyles.radioButtonActive : ''
              }`}
              onClick={() => {
                setTipo('SALIDA');
                setErrorEnvio(null);
              }}
            >
              <ArrowDownCircle size={16} /> Salida
            </button>
            <button
              type="button"
              className={`${modalStyles.radioButton} ${
                tipo === 'FIJAR' ? modalStyles.radioButtonActive : ''
              }`}
              onClick={() => {
                setTipo('FIJAR');
                setErrorEnvio(null);
              }}
            >
              <Equal size={16} /> Fijar
            </button>
          </div>
        </div>

        <div className={crudStyles.field}>
          <label className={crudStyles.fieldLabel} htmlFor="ajuste-cantidad">
            {tipo === 'FIJAR' ? 'Nuevo valor de stock' : 'Cantidad a ajustar'}{' '}
            <span className={crudStyles.requiredMark}>*</span>
          </label>
          <input
            id="ajuste-cantidad"
            className={`${crudStyles.input} ${
              errorCantidad || esSalidaInsuficiente ? crudStyles.inputError : ''
            }`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={cantidad}
            placeholder="Mín. 1"
            onKeyDown={bloquearTeclasNoNumericas}
            onChange={(e) => handleCantidadChange(e.target.value)}
          />
          {errorCantidad && (
            <span className={crudStyles.fieldError}>{errorCantidad}</span>
          )}
          {esSalidaInsuficiente && (
            <span className={crudStyles.fieldError}>
              Stock insuficiente. Disponible: {anterior} u.
            </span>
          )}
        </div>

        {tipo !== 'ENTRADA' && (
          <div className={crudStyles.field}>
            <label className={crudStyles.fieldLabel} htmlFor="ajuste-motivo">
              Motivo <span className={crudStyles.requiredMark}>*</span>
            </label>
            <input
              id="ajuste-motivo"
              className={`${crudStyles.input} ${
                motivoFaltante && motivo !== '' ? crudStyles.inputError : ''
              }`}
              type="text"
              value={motivo}
              placeholder="Ej: Merma, conteo físico, corrección"
              onChange={(e) => {
                setMotivo(e.target.value);
                setErrorEnvio(null);
              }}
            />
            {motivoFaltante && (
              <span className={crudStyles.fieldError}>
                El motivo es obligatorio para {tipo === 'SALIDA' ? 'salidas' : 'fijar valor'}.
              </span>
            )}
          </div>
        )}

        <div
          className={`${modalStyles.preview} ${
            esSalidaInsuficiente ? modalStyles.previewError : ''
          }`}
        >
          <span>Stock resultante:</span>
          <span className={modalStyles.previewResult}>
            {esSalidaInsuficiente ? 'Inválido (negativo)' : `${resultante} u.`}
          </span>
        </div>

        {errorEnvio && (
          <div className={crudStyles.fieldError} style={{ fontSize: 13 }}>
            {errorEnvio}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AjusteStockModal;
