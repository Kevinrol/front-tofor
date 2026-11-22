import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  PackageSearch,
  Plus,
  RotateCcw,
  Save,
  Search,
  Truck,
  X,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import modalStyles from './PedidoFormModal.module.css';
import { Modal } from '../../components/Modal/Modal';
import { SelectorComprobante } from '../../components/SelectorComprobante/SelectorComprobante';
import {
  EstadoPedido,
  PedidoPayload,
  PedidoProveedor,
  pedidosService,
} from '../../services/pedidos-proveedor.service';
import { Producto } from '../../services/productos.service';
import { Proveedor } from '../../services/proveedores.service';
import { Usuario } from '../../services/usuarios.service';
import { aNumero } from '../../utils/consulta';
import {
  aDateInput,
  formatearMoneda,
  obtenerFechaMinimaEntrega,
} from '../../utils/formato';

interface LineaForm {
  id_producto: string;
  cantidad_solicitada: string;
  unidad_venta: string;
  factor_conversion: string;
  precio_unitario_compra: string;
  porcentaje_descuento: string;
}

interface FormState {
  id_proveedor: string;
  id_usuario: string;
  fecha_entrega_estimada: string;
  estado_pedido: EstadoPedido;
  comprobante_url: string;
  detalles: LineaForm[];
}

type ModoBusquedaPedido = 'proveedor' | 'producto';

const LINEA_VACIA: LineaForm = {
  id_producto: '',
  cantidad_solicitada: '1',
  unidad_venta: 'Unidad',
  factor_conversion: '1',
  precio_unitario_compra: '',
  porcentaje_descuento: '0',
};

const FORM_VACIO: FormState = {
  id_proveedor: '',
  id_usuario: '',
  fecha_entrega_estimada: '',
  estado_pedido: 'Pendiente',
  comprobante_url: '',
  detalles: [{ ...LINEA_VACIA }],
};

const UNIDADES_BASE_FIJAS: Array<{ nombre: string; cantidad: number }> = [
  { nombre: 'Unidad', cantidad: 1 },
  { nombre: 'Media Docena', cantidad: 6 },
  { nombre: 'Docena', cantidad: 12 },
];

const esUnidadFija = (nombreUnidad: string): boolean => {
  const n = nombreUnidad.trim().toLowerCase();
  return UNIDADES_BASE_FIJAS.some((u) => u.nombre.toLowerCase() === n);
};

const obtenerFactorUnidad = (prod: Producto | undefined, nombreUnidad: string): number => {
  const n = nombreUnidad.trim().toLowerCase();
  const fija = UNIDADES_BASE_FIJAS.find((u) => u.nombre.toLowerCase() === n);
  if (fija) return fija.cantidad;
  const encontrada = prod?.unidades?.find(
    (u) => u.nombre_unidad.trim().toLowerCase() === n,
  );
  if (encontrada && encontrada.cantidad_unidades >= 1) {
    return encontrada.cantidad_unidades;
  }
  return 1;
};

const subtotalLinea = (linea: LineaForm): number => {
  const cantidad = Number(linea.cantidad_solicitada) || 0;
  const precio = Number(linea.precio_unitario_compra) || 0;
  const desc = Number(linea.porcentaje_descuento) || 0;
  return cantidad * precio * (1 - desc / 100);
};

export const esBajoStock = (producto: Producto): boolean =>
  Number(producto.stock_actual) <= Number(producto.stock_minimo);

/**
 * Ordena los productos dejando los de bajo stock (stock_actual <= stock_minimo) arriba,
 * ordenados de menor a mayor stock_actual para priorizar reposición urgente.
 */
export const ordenarProductosPorStock = (lista: Producto[]): Producto[] =>
  [...lista].sort((a, b) => {
    const bajoA = esBajoStock(a) ? 0 : 1;
    const bajoB = esBajoStock(b) ? 0 : 1;
    if (bajoA !== bajoB) return bajoA - bajoB;

    const diffStock = Number(a.stock_actual) - Number(b.stock_actual);
    if (diffStock !== 0) return diffStock;

    return a.nombre_producto.localeCompare(b.nombre_producto, 'es');
  });

export const productoPerteneceAProveedor = (
  producto: Producto,
  proveedor: Proveedor,
): boolean => {
  const marcasNombres = new Set(
    (proveedor.marcas || []).map((m) => m.trim().toLowerCase()),
  );
  const marcasIds = new Set(
    (proveedor.ids_marcas || []).map((id) => Number(id)),
  );
  return (
    (producto.id_marca != null && marcasIds.has(Number(producto.id_marca))) ||
    (producto.nombre_marca != null &&
      marcasNombres.has(producto.nombre_marca.trim().toLowerCase()))
  );
};

export const obtenerProveedoresDeProducto = (
  producto: Producto,
  proveedores: Proveedor[],
): Proveedor[] => proveedores.filter((prov) => productoPerteneceAProveedor(producto, prov));

export interface PedidoFormModalProps {
  open: boolean;
  editando: PedidoProveedor | null;
  productos: Producto[];
  proveedores: Proveedor[];
  usuarios: Usuario[];
  onClose: () => void;
  onGuardado: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}

/**
 * Modal de creación y edición de pedidos a proveedor.
 * Soporta búsqueda por proveedor o búsqueda directa por producto ordenada por bajo stock.
 */
export const PedidoFormModal: React.FC<PedidoFormModalProps> = ({
  open,
  editando,
  productos,
  proveedores,
  usuarios,
  onClose,
  onGuardado,
  onError,
}) => {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [modoBusqueda, setModoBusqueda] = useState<ModoBusquedaPedido>('proveedor');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  const fechaMinimaEntrega = useMemo(() => obtenerFechaMinimaEntrega(1), []);

  useEffect(() => {
    if (!open) return;

    if (editando) {
      setForm({
        id_proveedor: String(editando.id_proveedor),
        id_usuario: String(editando.id_usuario),
        fecha_entrega_estimada: aDateInput(editando.fecha_entrega_estimada),
        estado_pedido: (editando.estado_pedido as EstadoPedido) ?? 'Pendiente',
        comprobante_url: editando.comprobante_url || '',
        detalles: [{ ...LINEA_VACIA }],
      });
    } else {
      setForm({
        ...FORM_VACIO,
        id_usuario: usuarios[0]?.id_usuario != null ? String(usuarios[0].id_usuario) : '',
        fecha_entrega_estimada: obtenerFechaMinimaEntrega(1),
        comprobante_url: '',
        detalles: [{ ...LINEA_VACIA }],
      });
    }
    setModoBusqueda('proveedor');
    setBusquedaProducto('');
    setSoloBajoStock(false);
    setSaving(false);
  }, [open, editando, usuarios]);

  const totalEstimado = useMemo(
    () => form.detalles.reduce((acc, linea) => acc + subtotalLinea(linea), 0),
    [form.detalles],
  );

  const proveedorSeleccionado = useMemo(() => {
    if (!form.id_proveedor) return null;
    return proveedores.find((p) => String(p.id_proveedor) === String(form.id_proveedor)) ?? null;
  }, [form.id_proveedor, proveedores]);

  const productosProveedor = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return ordenarProductosPorStock(
      productos.filter((prod) => productoPerteneceAProveedor(prod, proveedorSeleccionado)),
    );
  }, [proveedorSeleccionado, productos]);

  const productosOrdenados = useMemo(
    () => ordenarProductosPorStock(productos),
    [productos],
  );

  const productosBuscador = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    return productosOrdenados.filter((p) => {
      if (soloBajoStock && !esBajoStock(p)) return false;
      if (!q) return true;
      return (
        p.nombre_producto.toLowerCase().includes(q) ||
        (p.codigo_barras ?? '').toLowerCase().includes(q) ||
        (p.nombre_marca ?? '').toLowerCase().includes(q) ||
        (p.nombre_linea ?? '').toLowerCase().includes(q)
      );
    });
  }, [productosOrdenados, busquedaProducto, soloBajoStock]);

  const totalBajoStockDisponibles = useMemo(
    () => productosOrdenados.filter(esBajoStock).length,
    [productosOrdenados],
  );

  // Si en modo "Por Producto" ya hay líneas con productos, calculamos qué proveedores las abastecen
  const proveedoresCompatiblesConLineas = useMemo(() => {
    const idsProductosEnLineas = form.detalles
      .map((d) => d.id_producto)
      .filter((id) => id !== '');
    if (idsProductosEnLineas.length === 0) return null;

    const prodsSeleccionados = idsProductosEnLineas
      .map((id) => productos.find((p) => String(p.id_producto) === id))
      .filter((p): p is Producto => p !== undefined);

    if (prodsSeleccionados.length === 0) return null;

    return proveedores.filter((prov) =>
      prodsSeleccionados.every((prod) => productoPerteneceAProveedor(prod, prov)),
    );
  }, [form.detalles, productos, proveedores]);

  const cambiarProveedor = (nuevoIdProveedor: string) => {
    if (nuevoIdProveedor === form.id_proveedor) return;

    if (!nuevoIdProveedor) {
      setForm((prev) => ({
        ...prev,
        id_proveedor: '',
        detalles: [{ ...LINEA_VACIA }],
      }));
      return;
    }

    const nuevoProv = proveedores.find((p) => String(p.id_proveedor) === String(nuevoIdProveedor));
    if (!nuevoProv) {
      setForm((prev) => ({ ...prev, id_proveedor: nuevoIdProveedor }));
      return;
    }

    const tieneConfig = nuevoProv.marcas && nuevoProv.marcas.length > 0;

    if (!tieneConfig) {
      onError(
        `El proveedor "${nuevoProv.razon_social}" no tiene marcas asociadas. Debe configurarlas en el módulo de Proveedores.`,
      );
    }

    const productosValidosIds = new Set(
      productos
        .filter((prod) => productoPerteneceAProveedor(prod, nuevoProv))
        .map((p) => String(p.id_producto)),
    );

    const lineasConProducto = form.detalles.filter((d) => d.id_producto !== '');
    if (lineasConProducto.length > 0) {
      const detallesFiltrados = form.detalles.filter(
        (d) => !d.id_producto || productosValidosIds.has(String(d.id_producto)),
      );
      const eliminados = form.detalles.length - detallesFiltrados.length;
      if (eliminados > 0) {
        onError(
          `Se quitaron ${eliminados} producto(s) añadidos porque no corresponden al nuevo proveedor.`,
        );
      }
      setForm((prev) => ({
        ...prev,
        id_proveedor: nuevoIdProveedor,
        detalles: detallesFiltrados.length > 0 ? detallesFiltrados : [{ ...LINEA_VACIA }],
      }));
    } else {
      setForm((prev) => ({ ...prev, id_proveedor: nuevoIdProveedor }));
    }
  };

  const agregarProductoDirecto = (prod: Producto) => {
    if (prod.id_producto == null) return;
    const compatibles = obtenerProveedoresDeProducto(prod, proveedores);
    if (compatibles.length === 0) {
      onError(
        `El producto "${prod.nombre_producto}" no tiene un proveedor vinculado a su marca (${prod.nombre_marca ?? 'sin marca'}).`,
      );
      return;
    }

    if (proveedorSeleccionado && !productoPerteneceAProveedor(prod, proveedorSeleccionado)) {
      onError(
        `"${prod.nombre_producto}" pertenece a la marca ${prod.nombre_marca ?? 'sin marca'}, que no abastece "${proveedorSeleccionado.razon_social}". Limpia el proveedor para pedir a otro distribuidor.`,
      );
      return;
    }

    const idProdStr = String(prod.id_producto);
    const precioSugerido = String(
      Number(prod.precio_compra) > 0 ? prod.precio_compra : prod.precio,
    );

    setForm((prev) => {
      const idProvResuelto =
        prev.id_proveedor ||
        (compatibles[0]?.id_proveedor != null ? String(compatibles[0].id_proveedor) : '');

      const idxExistente = prev.detalles.findIndex((d) => d.id_producto === idProdStr);
      if (idxExistente >= 0) {
        const nuevosDetalles = prev.detalles.map((d, i) =>
          i === idxExistente
            ? {
                ...d,
                cantidad_solicitada: String((Number(d.cantidad_solicitada) || 0) + 1),
              }
            : d,
        );
        return { ...prev, id_proveedor: idProvResuelto, detalles: nuevosDetalles };
      }

      const idxVacio = prev.detalles.findIndex((d) => d.id_producto === '');
      const nuevaLinea: LineaForm = {
        ...LINEA_VACIA,
        id_producto: idProdStr,
        factor_conversion: String(obtenerFactorUnidad(prod, LINEA_VACIA.unidad_venta)),
        precio_unitario_compra: precioSugerido,
      };

      const nuevosDetalles =
        idxVacio >= 0
          ? prev.detalles.map((d, i) => (i === idxVacio ? nuevaLinea : d))
          : [...prev.detalles, nuevaLinea];

      return { ...prev, id_proveedor: idProvResuelto, detalles: nuevosDetalles };
    });
  };

  const actualizarLinea = (index: number, cambios: Partial<LineaForm>) =>
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)),
    }));

  const agregarLinea = () => {
    if (!form.id_proveedor) {
      onError('Selecciona primero un proveedor antes de agregar productos.');
      return;
    }
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...LINEA_VACIA }] }));
  };

  const quitarLinea = (index: number) =>
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (!form.fecha_entrega_estimada || form.fecha_entrega_estimada.trim() === '') {
        onError('La fecha estimada de entrega es obligatoria.');
        setSaving(false);
        return;
      }

      if (form.fecha_entrega_estimada < fechaMinimaEntrega) {
        onError(
          `La fecha estimada de entrega debe ser de al menos un día posterior a la fecha actual (a partir del ${fechaMinimaEntrega}).`,
        );
        setSaving(false);
        return;
      }

      if (editando?.id_pedido != null) {
        const payload: {
          fecha_entrega_estimada?: string;
          estado_pedido?: EstadoPedido;
          comprobante_url?: string | null;
        } = {};
        if (form.fecha_entrega_estimada) {
          payload.fecha_entrega_estimada = new Date(form.fecha_entrega_estimada).toISOString();
        }
        if (
          editando.estado_pedido !== 'Parcial' &&
          (form.estado_pedido === 'Enviado' || form.estado_pedido === 'Cancelado') &&
          form.estado_pedido !== editando.estado_pedido
        ) {
          payload.estado_pedido = form.estado_pedido;
        }
        payload.comprobante_url = form.comprobante_url || null;
        await pedidosService.update(editando.id_pedido, payload);
        onGuardado('Pedido actualizado correctamente.');
      } else {
        const idProveedor = aNumero(form.id_proveedor);
        const idUsuario = aNumero(form.id_usuario);
        if (idProveedor === undefined || idUsuario === undefined) {
          onError('Selecciona el proveedor y el usuario responsable.');
          setSaving(false);
          return;
        }

        if (
          proveedorSeleccionado &&
          (proveedorSeleccionado.marcas?.length || 0) === 0
        ) {
          onError(
            `El proveedor "${proveedorSeleccionado.razon_social}" no tiene marcas asociadas. Configure marcas en el módulo de Proveedores antes de registrar una orden.`,
          );
          setSaving(false);
          return;
        }

        for (let i = 0; i < form.detalles.length; i++) {
          const l = form.detalles[i];
          if (!l.id_producto) continue;
          const cant = aNumero(l.cantidad_solicitada);
          const factor = aNumero(l.factor_conversion);
          const prec = aNumero(l.precio_unitario_compra);
          const desc = aNumero(l.porcentaje_descuento) ?? 0;

          if (cant === undefined || cant <= 0) {
            onError(`Línea #${i + 1}: La cantidad solicitada debe ser mayor a 0.`);
            setSaving(false);
            return;
          }
          if (factor === undefined || !Number.isInteger(factor) || factor < 1) {
            onError(
              `Línea #${i + 1}: La cantidad de unidades por "${l.unidad_venta}" debe ser un entero mayor o igual a 1.`,
            );
            setSaving(false);
            return;
          }
          if (prec === undefined || prec < 0) {
            onError(
              `Línea #${i + 1}: El precio unitario de compra no puede ser negativo ni estar vacío.`,
            );
            setSaving(false);
            return;
          }
          if (desc < 0 || desc > 100) {
            onError(`Línea #${i + 1}: El porcentaje de descuento debe estar entre 0% y 100%.`);
            setSaving(false);
            return;
          }
          if (!l.unidad_venta.trim()) {
            onError(`Línea #${i + 1}: Selecciona una unidad de venta.`);
            setSaving(false);
            return;
          }
        }

        const detalles = form.detalles
          .map((linea) => ({
            id_producto: aNumero(linea.id_producto),
            cantidad_solicitada: aNumero(linea.cantidad_solicitada),
            unidad_venta: linea.unidad_venta,
            factor_conversion: aNumero(linea.factor_conversion) ?? 1,
            precio_unitario_compra: aNumero(linea.precio_unitario_compra),
            porcentaje_descuento: aNumero(linea.porcentaje_descuento) ?? 0,
          }))
          .filter(
            (d): d is {
              id_producto: number;
              cantidad_solicitada: number;
              unidad_venta: string;
              factor_conversion: number;
              precio_unitario_compra: number;
              porcentaje_descuento: number;
            } =>
              d.id_producto !== undefined &&
              d.cantidad_solicitada !== undefined &&
              d.cantidad_solicitada > 0 &&
              d.factor_conversion >= 1 &&
              d.precio_unitario_compra !== undefined &&
              d.unidad_venta.trim() !== '',
          );

        if (detalles.length === 0) {
          onError('Agrega al menos un producto con cantidad, unidad y precio válidos.');
          setSaving(false);
          return;
        }

        const payload: PedidoPayload = {
          id_proveedor: idProveedor,
          id_usuario: idUsuario,
          comprobante_url: form.comprobante_url || null,
          detalles,
        };
        if (form.fecha_entrega_estimada) {
          payload.fecha_entrega_estimada = new Date(form.fecha_entrega_estimada).toISOString();
        }
        await pedidosService.create(payload);
        onGuardado('Pedido registrado correctamente.');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al guardar el pedido.');
    } finally {
      setSaving(false);
    }
  };

  const proveedoresEnSelector =
    modoBusqueda === 'producto' &&
    proveedoresCompatiblesConLineas &&
    proveedoresCompatiblesConLineas.length > 0
      ? proveedoresCompatiblesConLineas
      : proveedores;

  return (
    <Modal
      open={open}
      title={editando ? `Editar Pedido #${editando.id_pedido}` : 'Nuevo Pedido a Proveedor'}
      onClose={onClose}
      width={editando ? 520 : 940}
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
            form="form-pedido"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      {editando ? (
        <form id="form-pedido" onSubmit={guardar} className={styles.formGrid} noValidate>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pedido-fecha-edit">
              Entrega estimada <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="pedido-fecha-edit"
              className={styles.input}
              type="date"
              min={fechaMinimaEntrega}
              value={form.fecha_entrega_estimada}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fecha_entrega_estimada: e.target.value }))
              }
              required
            />
            <span className={styles.hint}>Mínimo a partir de mañana ({fechaMinimaEntrega})</span>
          </div>
          {editando.estado_pedido !== 'Parcial' && (
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="pedido-estado-edit">
                Estado del pedido
              </label>
              <select
                id="pedido-estado-edit"
                className={styles.select}
                value={form.estado_pedido}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estado_pedido: e.target.value as EstadoPedido }))
                }
              >
                {editando.estado_pedido === 'Pendiente' && (
                  <option value="Pendiente">Pendiente (actual)</option>
                )}
                <option value="Enviado">Enviado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          )}
          <div className={`${styles.field} ${styles.formGridFull}`}>
            <SelectorComprobante
              urlActual={form.comprobante_url}
              onArchivoSubido={(url) => setForm((prev) => ({ ...prev, comprobante_url: url }))}
              onEliminar={() => setForm((prev) => ({ ...prev, comprobante_url: '' }))}
              carpeta="pedidos"
              etiqueta="Nota de pedido / Cotización"
            />
          </div>
        </form>
      ) : (
        <form id="form-pedido" onSubmit={guardar} className={styles.formGrid} noValidate>
          <div className={`${styles.field} ${styles.formGridFull}`}>
            <div className={modalStyles.modeSwitch} role="tablist" aria-label="Modo de armado de pedido">
              <button
                type="button"
                role="tab"
                aria-selected={modoBusqueda === 'proveedor'}
                className={`${modalStyles.modeBtn} ${
                  modoBusqueda === 'proveedor' ? modalStyles.modeBtnActive : ''
                }`}
                onClick={() => setModoBusqueda('proveedor')}
              >
                <Truck size={14} /> Por Proveedor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modoBusqueda === 'producto'}
                className={`${modalStyles.modeBtn} ${
                  modoBusqueda === 'producto' ? modalStyles.modeBtnActive : ''
                }`}
                onClick={() => setModoBusqueda('producto')}
              >
                <PackageSearch size={14} /> Por Producto (Bajo stock primero)
              </button>
            </div>
          </div>

          {modoBusqueda === 'producto' && (
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <div className={modalStyles.searchPanel}>
                <div className={modalStyles.searchBarRow}>
                  <div className={modalStyles.searchInputWrap}>
                    <Search size={14} color="var(--color-text-placeholder)" />
                    <input
                      type="text"
                      aria-label="Buscar producto para pedir"
                      placeholder="Buscar producto por nombre, código de barras, marca o línea..."
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${
                      soloBajoStock ? styles.filterChipActive : ''
                    }`}
                    onClick={() => setSoloBajoStock((prev) => !prev)}
                  >
                    <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                    Solo bajo stock ({totalBajoStockDisponibles})
                  </button>
                </div>

                {proveedorSeleccionado && (
                  <div className={modalStyles.activeSupplierBar}>
                    <span>
                      <strong>Proveedor activo:</strong> {proveedorSeleccionado.razon_social} — los
                      productos de otras marcas aparecen atenuados.
                    </span>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => cambiarProveedor('')}
                    >
                      <RotateCcw size={12} /> Limpiar proveedor
                    </button>
                  </div>
                )}

                <div
                  className={modalStyles.productList}
                  role="list"
                  aria-label="Productos disponibles por stock"
                >
                  {productosBuscador.length === 0 ? (
                    <div className={modalStyles.emptyResults}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </div>
                  ) : (
                    productosBuscador.map((p) => {
                      const stock = Number(p.stock_actual);
                      const minimo = Number(p.stock_minimo);
                      const agotado = stock === 0;
                      const bajo = esBajoStock(p);
                      const compatibles = obtenerProveedoresDeProducto(p, proveedores);
                      const compatibleConActivo =
                        !proveedorSeleccionado ||
                        productoPerteneceAProveedor(p, proveedorSeleccionado);
                      const lineaExistente = form.detalles.find(
                        (d) => d.id_producto === String(p.id_producto),
                      );
                      const sinProveedor = compatibles.length === 0;
                      const deshabilitado = sinProveedor || !compatibleConActivo;

                      return (
                        <div
                          key={p.id_producto}
                          role="listitem"
                          className={`${modalStyles.productItem} ${
                            deshabilitado ? modalStyles.productItemDimmed : ''
                          }`}
                        >
                          <div className={modalStyles.productInfo}>
                            <div className={modalStyles.productTitleRow}>
                              <span className={modalStyles.productName}>{p.nombre_producto}</span>
                              <span
                                className={`${modalStyles.stockBadge} ${
                                  agotado
                                    ? modalStyles.stockOut
                                    : bajo
                                      ? modalStyles.stockLow
                                      : modalStyles.stockOk
                                }`}
                              >
                                {agotado
                                  ? 'Agotado (0 u.)'
                                  : bajo
                                    ? `Bajo stock: ${stock} / mín ${minimo}`
                                    : `Stock: ${stock} u.`}
                              </span>
                            </div>
                            <div className={modalStyles.productMeta}>
                              <span>
                                {p.nombre_marca ? `Marca: ${p.nombre_marca}` : 'Sin marca'}
                                {p.nombre_linea ? ` · ${p.nombre_linea}` : ''}
                              </span>
                              <span>
                                Ref. compra:{' '}
                                {formatearMoneda(
                                  Number(p.precio_compra) > 0 ? p.precio_compra : p.precio,
                                )}
                              </span>
                              <span>
                                {sinProveedor
                                  ? 'Sin proveedor asociado'
                                  : !compatibleConActivo
                                    ? 'Otro proveedor'
                                    : compatibles.length === 1
                                      ? `Proveedor: ${compatibles[0].razon_social}`
                                      : `${compatibles.length} proveedores: ${compatibles
                                          .map((c) => c.razon_social)
                                          .join(', ')}`}
                              </span>
                            </div>
                          </div>
                          <div className={modalStyles.productActions}>
                            <button
                              type="button"
                              className={`${styles.btn} ${
                                lineaExistente ? styles.btnGhost : styles.btnPrimary
                              } ${styles.btnSm}`}
                              onClick={() => agregarProductoDirecto(p)}
                              disabled={deshabilitado}
                              title={
                                sinProveedor
                                  ? 'Configura un proveedor para esta marca primero'
                                  : !compatibleConActivo
                                    ? 'Pertenece a otro proveedor; limpia el proveedor activo para pedirlo'
                                    : 'Agregar al pedido'
                              }
                            >
                              <Plus size={13} />
                              {lineaExistente
                                ? `Sumar (+1 · ${lineaExistente.cantidad_solicitada})`
                                : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pedido-proveedor">
              Proveedor <span className={styles.requiredMark}>*</span>
            </label>
            <select
              id="pedido-proveedor"
              className={styles.select}
              value={form.id_proveedor}
              onChange={(e) => cambiarProveedor(e.target.value)}
            >
              <option value="">Seleccionar proveedor</option>
              {proveedoresEnSelector.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.razon_social}
                </option>
              ))}
            </select>
            {proveedorSeleccionado && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: (proveedorSeleccionado.marcas?.length || 0) === 0 ? '#e53e3e' : '#4b5563',
                }}
              >
                {(proveedorSeleccionado.marcas?.length || 0) === 0 ? (
                  <span>
                    ⚠️ Este proveedor no tiene marcas asociadas. Configure marcas en el módulo de Proveedores.
                  </span>
                ) : (
                  <span>
                    <strong>Marcas abastecidas:</strong> {proveedorSeleccionado.marcas.join(', ')} (
                    {productosProveedor.length} productos disponibles)
                    {modoBusqueda === 'producto' &&
                      proveedoresCompatiblesConLineas &&
                      proveedoresCompatiblesConLineas.length > 1 &&
                      ` · ${proveedoresCompatiblesConLineas.length} proveedores compatibles`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pedido-usuario">
              Responsable <span className={styles.requiredMark}>*</span>
            </label>
            <select
              id="pedido-usuario"
              className={styles.select}
              value={form.id_usuario}
              onChange={(e) => setForm((prev) => ({ ...prev, id_usuario: e.target.value }))}
            >
              <option value="">Seleccionar usuario</option>
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pedido-fecha">
              Entrega estimada <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="pedido-fecha"
              className={styles.input}
              type="date"
              min={fechaMinimaEntrega}
              value={form.fecha_entrega_estimada}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fecha_entrega_estimada: e.target.value }))
              }
              required
            />
            <span className={styles.hint}>Mínimo a partir de mañana ({fechaMinimaEntrega})</span>
          </div>

          <div className={`${styles.field} ${styles.formGridFull}`}>
            <SelectorComprobante
              urlActual={form.comprobante_url}
              onArchivoSubido={(url) => setForm((prev) => ({ ...prev, comprobante_url: url }))}
              onEliminar={() => setForm((prev) => ({ ...prev, comprobante_url: '' }))}
              carpeta="pedidos"
              etiqueta="Nota de pedido / Cotización previa (opcional)"
            />
          </div>

          <div className={`${styles.field} ${styles.formGridFull}`}>
            <div className={styles.linesHeader}>
              <span className={styles.linesTitle}>
                <ClipboardList size={15} /> Productos solicitados
              </span>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                onClick={agregarLinea}
                disabled={!form.id_proveedor}
                title={!form.id_proveedor ? 'Selecciona un proveedor primero' : 'Agregar producto'}
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#334155',
                background: '#f8fafc',
                padding: '7px 10px',
                borderRadius: '6px',
                marginBottom: '10px',
                border: '1px solid #cbd5e1',
              }}
            >
              <span>
                🔒 <strong>Unidades base fijas:</strong> <em>Unidad (1 u.)</em>, <em>Media Docena (6 u.)</em> y{' '}
                <em>Docena (12 u.)</em> son estándar y no editables. Las demás medidas son agregables y editables por
                producto.
              </span>
            </div>

            <div className={`${styles.lineRow} ${styles.lineRowPedido} ${styles.lineRowHead}`}>
              <span>Producto</span>
              <span>Cant.</span>
              <span>Unidad</span>
              <span>U. x Medida</span>
              <span>Precio</span>
              <span>Desc.%</span>
              <span>Subtotal</span>
              <span />
            </div>

            {form.detalles.map((linea, index) => {
              const prodActual = productos.find((p) => String(p.id_producto) === linea.id_producto);
              const unidadesOpcionalesProd = (prodActual?.unidades || []).filter(
                (u) => !esUnidadFija(u.nombre_unidad),
              );
              const esPersonalizada =
                linea.unidad_venta.trim() !== '' &&
                !esUnidadFija(linea.unidad_venta) &&
                !unidadesOpcionalesProd.some(
                  (u) => u.nombre_unidad.trim().toLowerCase() === linea.unidad_venta.trim().toLowerCase(),
                );
              const unidadBloqueada = esUnidadFija(linea.unidad_venta);
              const totalUnidadesSueltas =
                (Number(linea.cantidad_solicitada) || 0) * (Number(linea.factor_conversion) || 1);

              return (
                <div key={index} className={`${styles.lineRow} ${styles.lineRowPedido}`}>
                  <select
                    className={styles.select}
                    value={linea.id_producto}
                    onChange={(e) => {
                      const id = e.target.value;
                      const prod = productos.find((p) => String(p.id_producto) === id);
                      const factor = obtenerFactorUnidad(prod, linea.unidad_venta);
                      actualizarLinea(index, {
                        id_producto: id,
                        factor_conversion: String(factor),
                        precio_unitario_compra:
                          prod && (!linea.precio_unitario_compra || linea.precio_unitario_compra === '0')
                            ? String(Number(prod.precio_compra) > 0 ? prod.precio_compra : prod.precio)
                            : linea.precio_unitario_compra,
                      });
                    }}
                    disabled={!form.id_proveedor}
                  >
                    <option value="">
                      {!form.id_proveedor
                        ? '— Selecciona un proveedor primero —'
                        : productosProveedor.length === 0
                        ? '— Proveedor sin productos asociados —'
                        : 'Seleccionar producto'}
                    </option>
                    {productosProveedor.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre_producto}
                        {p.nombre_marca ? ` (${p.nombre_marca})` : ''}
                        {` — Stock: ${p.stock_actual}/${p.stock_minimo}`}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={linea.cantidad_solicitada}
                    onChange={(e) => actualizarLinea(index, { cantidad_solicitada: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                    }}
                  />
                  <select
                    className={styles.select}
                    value={linea.unidad_venta}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__NUEVA__') {
                        const nombreNueva = window.prompt(
                          'Ingresa el nombre de la nueva unidad de pedido (ej. Caja Madre, Display, Tira, Paquete):',
                        );
                        if (nombreNueva && nombreNueva.trim()) {
                          const limpia = nombreNueva.trim();
                          actualizarLinea(index, {
                            unidad_venta: limpia,
                            factor_conversion: '1',
                          });
                        }
                        return;
                      }
                      const factor = obtenerFactorUnidad(prodActual, val);
                      actualizarLinea(index, {
                        unidad_venta: val,
                        factor_conversion: String(factor),
                      });
                    }}
                  >
                    <optgroup label="Unidades Base (Fijas - No editables)">
                      <option value="Unidad">Unidad (1 u.)</option>
                      <option value="Media Docena">Media Docena (6 u.)</option>
                      <option value="Docena">Docena (12 u.)</option>
                    </optgroup>
                    {unidadesOpcionalesProd.length > 0 && (
                      <optgroup label="Presentaciones del Producto">
                        {unidadesOpcionalesProd.map((u) => (
                          <option key={u.nombre_unidad} value={u.nombre_unidad}>
                            {u.nombre_unidad} ({u.cantidad_unidades} u.)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {esPersonalizada && (
                      <optgroup label="Personalizada">
                        <option value={linea.unidad_venta}>{linea.unidad_venta}</option>
                      </optgroup>
                    )}
                    <option value="__NUEVA__">+ Otra unidad...</option>
                  </select>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    step="1"
                    value={linea.factor_conversion}
                    disabled={unidadBloqueada}
                    style={{
                      backgroundColor: unidadBloqueada ? '#f1f5f9' : '#ffffff',
                      color: unidadBloqueada ? '#64748b' : '#0f172a',
                      fontWeight: unidadBloqueada ? 600 : 400,
                    }}
                    title={
                      unidadBloqueada
                        ? `🔒 ${linea.unidad_venta} es unidad base fija (no editable: ${linea.factor_conversion} u.)`
                        : `Cantidad de unidades que trae 1 ${linea.unidad_venta} (Total: ${totalUnidadesSueltas} u. al stock)`
                    }
                    onChange={(e) => actualizarLinea(index, { factor_conversion: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.')
                        e.preventDefault();
                    }}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={linea.precio_unitario_compra}
                    onChange={(e) => actualizarLinea(index, { precio_unitario_compra: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                    }}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max="100"
                    value={linea.porcentaje_descuento}
                    onChange={(e) => actualizarLinea(index, { porcentaje_descuento: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                    }}
                  />
                  <span className={styles.money} title={`Ingresarán ${totalUnidadesSueltas} u. sueltas al stock`}>
                    {formatearMoneda(subtotalLinea(linea))}
                  </span>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => quitarLinea(index)}
                    title="Quitar"
                    disabled={form.detalles.length === 1}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}

            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total estimado</span>
              {formatearMoneda(totalEstimado)}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PedidoFormModal;
