import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  Eye,
  Truck,
  PackageCheck,
  Send,
  Undo2,
  X,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  pedidosService,
  PedidoProveedor,
  PedidoPayload,
  EstadoPedido,
} from '../../services/pedidos-proveedor.service';
import { productosService, Producto } from '../../services/productos.service';
import { proveedoresService, Proveedor } from '../../services/proveedores.service';
import { usuariosService, Usuario } from '../../services/usuarios.service';
import { SelectorComprobante } from '../../components/SelectorComprobante/SelectorComprobante';
import { formatearMoneda, formatearFecha, aDateInput } from '../../utils/formato';
import { aNumero } from '../../utils/consulta';

interface LineaForm {
  id_producto: string;
  cantidad_solicitada: string;
  unidad_venta: string;
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

const LINEA_VACIA: LineaForm = {
  id_producto: '',
  cantidad_solicitada: '1',
  unidad_venta: 'Unidad',
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

const UNIDADES = ['Unidad', 'Caja', 'Paquete', 'Docena', 'Media Docena', 'Gruesa'];
const ESTADOS: EstadoPedido[] = ['Pendiente', 'Enviado', 'Parcial', 'Recibido', 'Cancelado'];

type FiltroEstado = 'all' | EstadoPedido;

const POR_PAGINA_INICIAL = 5;

const subtotalLinea = (linea: LineaForm): number => {
  const cantidad = Number(linea.cantidad_solicitada) || 0;
  const precio = Number(linea.precio_unitario_compra) || 0;
  const desc = Number(linea.porcentaje_descuento) || 0;
  return cantidad * precio * (1 - desc / 100);
};

const normalizarNombre = (valor?: string | null): string =>
  (valor ?? '').trim().toLowerCase();

/**
 * Devuelve únicamente los productos que pertenecen a alguna de las marcas o
 * líneas abastecidas por el proveedor (misma regla "marca OR línea" del backend).
 */
const productosDelProveedor = (
  proveedor: Proveedor | null,
  productos: Producto[]
): Producto[] => {
  if (!proveedor) return [];
  const marcas = new Set((proveedor.marcas ?? []).map(normalizarNombre).filter(Boolean));
  const lineas = new Set(
    (proveedor.lineas_productos ?? []).map(normalizarNombre).filter(Boolean)
  );
  if (marcas.size === 0 && lineas.size === 0) return [];
  return productos.filter((producto) => {
    const marca = normalizarNombre(producto.nombre_marca);
    const linea = normalizarNombre(producto.nombre_linea);
    return (marca !== '' && marcas.has(marca)) || (linea !== '' && lineas.has(linea));
  });
};

export const PedidosProveedor: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [pedidos, setPedidos] = useState<PedidoProveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<PedidoProveedor | null>(null);
  const [detalle, setDetalle] = useState<PedidoProveedor | null>(null);
  const [pedidoARecibir, setPedidoARecibir] = useState<PedidoProveedor | null>(null);
  const [comprobanteRecepcion, setComprobanteRecepcion] = useState<string>('');
  const [usuarioRecepcion, setUsuarioRecepcion] = useState<string>('');
  const [recibiendo, setRecibiendo] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const [pedidosData, productosData, proveedoresData, usuariosData] = await Promise.all([
        pedidosService.getAll(),
        productosService.getAll(false),
        proveedoresService.getProveedores(),
        usuariosService.getAll(),
      ]);
      setPedidos(pedidosData || []);
      setProductos(productosData || []);
      setProveedores(proveedoresData || []);
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los pedidos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [search, filtro]);

  const totalEstimado = useMemo(
    () => form.detalles.reduce((acc, linea) => acc + subtotalLinea(linea), 0),
    [form.detalles]
  );

  const proveedorSeleccionado = useMemo(
    () => proveedores.find((p) => String(p.id_proveedor) === form.id_proveedor) ?? null,
    [proveedores, form.id_proveedor]
  );

  const productosDisponibles = useMemo(
    () => productosDelProveedor(proveedorSeleccionado, productos),
    [proveedorSeleccionado, productos]
  );

  const proveedorSinAsociaciones =
    proveedorSeleccionado !== null &&
    (proveedorSeleccionado.marcas ?? []).length === 0 &&
    (proveedorSeleccionado.lineas_productos ?? []).length === 0;

  const puedeAgregarProductos =
    proveedorSeleccionado !== null && productosDisponibles.length > 0;

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      ...FORM_VACIO,
      id_usuario: usuarios[0]?.id_usuario != null ? String(usuarios[0].id_usuario) : '',
      comprobante_url: '',
      detalles: [{ ...LINEA_VACIA }],
    });
    setModalOpen(true);
  };

  const abrirEditar = (pedido: PedidoProveedor) => {
    setEditando(pedido);
    setForm({
      id_proveedor: String(pedido.id_proveedor),
      id_usuario: String(pedido.id_usuario),
      fecha_entrega_estimada: aDateInput(pedido.fecha_entrega_estimada),
      estado_pedido: (pedido.estado_pedido as EstadoPedido) ?? 'Pendiente',
      comprobante_url: pedido.comprobante_url || '',
      detalles: [{ ...LINEA_VACIA }],
    });
    setModalOpen(true);
  };

  const verDetalle = async (pedido: PedidoProveedor) => {
    if (pedido.id_pedido == null) return;
    try {
      setDetalle(await pedidosService.getOne(pedido.id_pedido));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el detalle.', 'error');
    }
  };

  const actualizarLinea = (index: number, cambios: Partial<LineaForm>) =>
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)),
    }));

  const agregarLinea = () => {
    if (!puedeAgregarProductos) return;
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...LINEA_VACIA }] }));
  };

  const cambiarProveedor = (nuevoId: string) => {
    const nuevoProveedor =
      proveedores.find((p) => String(p.id_proveedor) === nuevoId) ?? null;
    const permitidos = new Set(
      productosDelProveedor(nuevoProveedor, productos).map((p) => String(p.id_producto))
    );
    const invalidos = form.detalles.filter(
      (linea) => linea.id_producto !== '' && !permitidos.has(linea.id_producto)
    ).length;

    setForm((prev) => ({
      ...prev,
      id_proveedor: nuevoId,
      detalles: prev.detalles.map((linea) =>
        linea.id_producto !== '' && !permitidos.has(linea.id_producto)
          ? { ...linea, id_producto: '' }
          : linea
      ),
    }));

    if (invalidos > 0) {
      showToast(
        `Se quitaron ${invalidos} producto(s) que no corresponden al proveedor seleccionado.`,
        'error'
      );
    }
  };

  const quitarLinea = (index: number) =>
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editando?.id_pedido != null) {
        const payload: { fecha_entrega_estimada?: string; estado_pedido?: EstadoPedido; comprobante_url?: string | null } = {};
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
        showToast('Pedido actualizado correctamente.');
      } else {
        const idProveedor = aNumero(form.id_proveedor);
        const idUsuario = aNumero(form.id_usuario);
        if (idProveedor === undefined || idUsuario === undefined) {
          showToast('Selecciona el proveedor y el usuario responsable.', 'error');
          setSaving(false);
          return;
        }

        if (productosDisponibles.length === 0) {
          showToast(
            proveedorSinAsociaciones
              ? 'El proveedor no tiene marcas ni líneas asociadas. Configúralas antes de registrar el pedido.'
              : 'No hay productos activos que correspondan a las marcas o líneas del proveedor.',
            'error'
          );
          setSaving(false);
          return;
        }

        const idsDisponibles = new Set(
          productosDisponibles.map((p) => String(p.id_producto))
        );
        const hayProductoAjeno = form.detalles.some(
          (linea) => linea.id_producto !== '' && !idsDisponibles.has(linea.id_producto)
        );
        if (hayProductoAjeno) {
          showToast(
            'Hay productos que no corresponden al proveedor seleccionado. Vuelve a elegirlos.',
            'error'
          );
          setSaving(false);
          return;
        }

        const detalles = form.detalles
          .map((linea) => ({
            id_producto: aNumero(linea.id_producto),
            cantidad_solicitada: aNumero(linea.cantidad_solicitada),
            unidad_venta: linea.unidad_venta,
            precio_unitario_compra: aNumero(linea.precio_unitario_compra),
            porcentaje_descuento: aNumero(linea.porcentaje_descuento) ?? 0,
          }))
          .filter(
            (d): d is {
              id_producto: number;
              cantidad_solicitada: number;
              unidad_venta: string;
              precio_unitario_compra: number;
              porcentaje_descuento: number;
            } =>
              d.id_producto !== undefined &&
              d.cantidad_solicitada !== undefined &&
              d.cantidad_solicitada > 0 &&
              d.precio_unitario_compra !== undefined &&
              d.unidad_venta.trim() !== ''
          );

        if (detalles.length === 0) {
          showToast('Agrega al menos un producto con cantidad, unidad y precio válidos.', 'error');
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
        showToast('Pedido registrado correctamente.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar el pedido.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async (pedido: PedidoProveedor) => {
    if (pedido.id_pedido == null) return;
    if (!window.confirm(`¿Cancelar el pedido #${pedido.id_pedido}?`)) return;
    try {
      await pedidosService.remove(pedido.id_pedido);
      showToast('Pedido cancelado.');
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al cancelar.', 'error');
    }
  };

  const recibir = (pedido: PedidoProveedor) => {
    if (pedido.id_pedido == null) return;
    setPedidoARecibir(pedido);
    setComprobanteRecepcion('');
    setUsuarioRecepcion(usuarios[0]?.id_usuario ? String(usuarios[0].id_usuario) : '');
  };

  const confirmarRecepcion = async () => {
    if (pedidoARecibir?.id_pedido == null) return;
    setRecibiendo(true);
    try {
      const idUsr = aNumero(usuarioRecepcion);
      const resultado = await pedidosService.recibir(
        pedidoARecibir.id_pedido,
        idUsr,
        undefined,
        comprobanteRecepcion || null
      );
      showToast(resultado?.mensaje || 'Pedido recibido y compra generada correctamente.');
      setPedidoARecibir(null);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al recibir el pedido.', 'error');
    } finally {
      setRecibiendo(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pedidos.filter((p) => {
      const coincide =
        !q ||
        (p.razon_social_proveedor ?? '').toLowerCase().includes(q) ||
        (p.nombre_usuario ?? '').toLowerCase().includes(q) ||
        String(p.id_pedido ?? '').includes(q);
      const porEstado = filtro === 'all' ? true : p.estado_pedido === filtro;
      return coincide && porEstado;
    });
  }, [pedidos, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalPedidos = pedidos.length;
  const esPorRecibir = (estado: string) =>
    estado === 'Pendiente' || estado === 'Enviado' || estado === 'Parcial';
  const pendientes = pedidos.filter((p) => esPorRecibir(String(p.estado_pedido))).length;
  const valorPendiente = pedidos
    .filter((p) => esPorRecibir(String(p.estado_pedido)))
    .reduce((acc, p) => acc + Number(p.total_pedido), 0);

  const pillEstado = (estado: string) =>
    estado === 'Recibido'
      ? styles.pillSuccess
      : estado === 'Cancelado'
        ? styles.pillDanger
        : estado === 'Enviado' || estado === 'Parcial'
          ? styles.pillInfo
          : styles.pillWarning;

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Pedidos a Proveedor</h1>
            <span className={styles.badge}>
              <ClipboardList size={14} /> Órdenes de compra
            </span>
          </div>
          <p className={styles.subtitle}>
            Genera órdenes de pedido a distribuidores y recíbelas para ingresar mercadería al
            stock automáticamente.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirCrear}>
            <Plus size={16} /> Nuevo Pedido
          </button>
        </div>
      </div>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <ClipboardList size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Pedidos Totales</span>
            <span className={styles.kpiValue}>{totalPedidos}</span>
            <span className={styles.kpiSubtext}>{pendientes} por recibir</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Calendar size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Por Recibir</span>
            <span className={styles.kpiValue}>{pendientes}</span>
            <span className={styles.kpiSubtext}>Pendientes, enviados y parciales</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <Truck size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Valor Comprometido</span>
            <span className={styles.kpiValue}>{formatearMoneda(valorPendiente)}</span>
            <span className={styles.kpiSubtext}>Pedidos abiertos</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <ClipboardList size={17} /> Listado de Pedidos
            <span className={styles.countBadge}>{filtrados.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por proveedor, responsable o N° de pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('all')}
            >
              Todos
            </button>
            {ESTADOS.map((estado) => (
              <button
                key={estado}
                type="button"
                className={`${styles.filterChip} ${filtro === estado ? styles.filterChipActive : ''}`}
                onClick={() => setFiltro(estado)}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando pedidos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <ClipboardList size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin pedidos</span>
            <span className={styles.emptyText}>Crea la primera orden de compra.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Proveedor</th>
                  <th>Responsable</th>
                  <th>Entrega estimada</th>
                  <th className={styles.right}>Total</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const puedeRecibir = p.estado_pedido !== 'Recibido' && p.estado_pedido !== 'Cancelado';
                  const puedeEditar = p.estado_pedido !== 'Recibido' && p.estado_pedido !== 'Cancelado';
                  return (
                    <tr key={p.id_pedido}>
                      <td className={styles.strong}>#{p.id_pedido}</td>
                      <td>{p.razon_social_proveedor || '—'}</td>
                      <td className={styles.muted}>{p.nombre_usuario || '—'}</td>
                      <td className={styles.muted}>
                        {p.fecha_entrega_estimada ? formatearFecha(p.fecha_entrega_estimada) : '—'}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(p.total_pedido)}</td>
                      <td className={styles.center}>
                        <span className={`${styles.pill} ${pillEstado(String(p.estado_pedido))}`}>
                          {p.estado_pedido}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" className={styles.iconBtn} title="Ver detalle" onClick={() => verDetalle(p)}>
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Editar"
                            onClick={() => abrirEditar(p)}
                            disabled={!puedeEditar}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                            title="Recibir pedido"
                            onClick={() => recibir(p)}
                            disabled={!puedeRecibir}
                          >
                            <PackageCheck size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Cancelar"
                            onClick={() => cancelar(p)}
                            disabled={
                              p.estado_pedido === 'Recibido' ||
                              p.estado_pedido === 'Parcial' ||
                              p.estado_pedido === 'Cancelado'
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <Paginador
            total={filtrados.length}
            pagina={paginaActual}
            onChange={setPagina}
            porPagina={porPagina}
            onPorPaginaChange={(nuevo) => {
              setPorPagina(nuevo);
              setPagina(1);
            }}
            etiqueta="pedidos"
          />
        )}
      </section>

      <Modal
        open={modalOpen}
        title={editando ? `Editar Pedido #${editando.id_pedido}` : 'Nuevo Pedido a Proveedor'}
        onClose={() => setModalOpen(false)}
        width={editando ? 520 : 900}
        footer={
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-pedido" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
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
                Entrega estimada
              </label>
              <input
                id="pedido-fecha-edit"
                className={styles.input}
                type="date"
                value={form.fecha_entrega_estimada}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
              />
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
                {proveedores.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
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
                Entrega estimada
              </label>
              <input
                id="pedido-fecha"
                className={styles.input}
                type="date"
                value={form.fecha_entrega_estimada}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
              />
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
                  disabled={!puedeAgregarProductos}
                  title={
                    puedeAgregarProductos
                      ? 'Agregar producto'
                      : 'Selecciona un proveedor con marcas o líneas asociadas'
                  }
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>

              {!proveedorSeleccionado ? (
                <p className={styles.hint}>
                  Selecciona un proveedor para ver únicamente los productos de las marcas y
                  líneas que abastece.
                </p>
              ) : proveedorSinAsociaciones ? (
                <p className={styles.hint}>
                  Este proveedor no tiene marcas ni líneas asociadas. Asígnalas en Proveedores
                  antes de registrar el pedido.
                </p>
              ) : productosDisponibles.length === 0 ? (
                <p className={styles.hint}>
                  No hay productos activos que correspondan a las marcas o líneas de este
                  proveedor.
                </p>
              ) : (
                <p className={styles.hint}>
                  Mostrando {productosDisponibles.length} producto(s) de las marcas y líneas
                  abastecidas por {proveedorSeleccionado.razon_social}.
                </p>
              )}

              <div className={`${styles.lineRow} ${styles.lineRowPedido} ${styles.lineRowHead}`}>
                <span>Producto</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>Precio</span>
                <span>Desc.%</span>
                <span>Subtotal</span>
                <span />
              </div>

              {form.detalles.map((linea, index) => (
                <div key={index} className={`${styles.lineRow} ${styles.lineRowPedido}`}>
                  <select
                    className={styles.select}
                    value={linea.id_producto}
                    onChange={(e) => actualizarLinea(index, { id_producto: e.target.value })}
                    disabled={!puedeAgregarProductos}
                  >
                    <option value="">Seleccionar</option>
                    {productosDisponibles.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre_producto}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={linea.cantidad_solicitada}
                    onChange={(e) => actualizarLinea(index, { cantidad_solicitada: e.target.value })}
                  />
                  <select
                    className={styles.select}
                    value={linea.unidad_venta}
                    onChange={(e) => actualizarLinea(index, { unidad_venta: e.target.value })}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={linea.precio_unitario_compra}
                    onChange={(e) => actualizarLinea(index, { precio_unitario_compra: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    max="100"
                    value={linea.porcentaje_descuento}
                    onChange={(e) => actualizarLinea(index, { porcentaje_descuento: e.target.value })}
                  />
                  <span className={styles.money}>{formatearMoneda(subtotalLinea(linea))}</span>
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
              ))}

              <div className={styles.lineTotal}>
                <span className={styles.lineTotalLabel}>Total estimado</span>
                {formatearMoneda(totalEstimado)}
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={detalle !== null}
        title={`Detalle de Pedido #${detalle?.id_pedido ?? ''}`}
        onClose={() => setDetalle(null)}
        width={760}
      >
        {detalle && (
          <>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Proveedor</span>
                <span className={styles.detailItemValue}>{detalle.razon_social_proveedor || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Responsable</span>
                <span className={styles.detailItemValue}>{detalle.nombre_usuario || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Entrega estimada</span>
                <span className={styles.detailItemValue}>
                  {detalle.fecha_entrega_estimada ? formatearFecha(detalle.fecha_entrega_estimada) : '—'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Estado</span>
                <span className={styles.detailItemValue}>
                  <span className={`${styles.pill} ${pillEstado(String(detalle.estado_pedido))}`}>
                    {detalle.estado_pedido}
                  </span>
                </span>
              </div>
              {detalle.comprobante_url && (
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Comprobante adjunto</span>
                  <span className={styles.detailItemValue}>
                    <a
                      href={detalle.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      style={{ padding: '2px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}
                    >
                      <ExternalLink size={13} /> Ver archivo adjunto
                    </a>
                  </span>
                </div>
              )}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.center}>Solicitado</th>
                    <th className={styles.center}>Recibido</th>
                    <th className={styles.center}>Pendiente</th>
                    <th>Unidad</th>
                    <th className={styles.right}>Precio</th>
                    <th className={styles.center}>Desc.</th>
                    <th className={styles.right}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.detalles ?? []).map((d, i) => {
                    const recibida = d.cantidad_recibida ?? 0;
                    const pendiente = d.cantidad_pendiente ?? Math.max(0, d.cantidad_solicitada - recibida);
                    return (
                      <tr key={d.id_detalle_pedido ?? i}>
                        <td className={styles.strong}>{d.nombre_producto || `Producto #${d.id_producto}`}</td>
                        <td className={styles.center}>{d.cantidad_solicitada}</td>
                        <td className={styles.center}>{recibida}</td>
                        <td className={styles.center}>{pendiente}</td>
                        <td>{d.unidad_venta}</td>
                        <td className={`${styles.right} ${styles.money}`}>
                          {formatearMoneda(d.precio_unitario_compra)}
                        </td>
                        <td className={styles.center}>{d.porcentaje_descuento ?? 0}%</td>
                        <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total del pedido</span>
              {formatearMoneda(detalle.total_pedido)}
            </div>

            {detalle.estado_pedido !== 'Recibido' && detalle.estado_pedido !== 'Cancelado' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    const actual = detalle;
                    setDetalle(null);
                    recibir(actual);
                  }}
                >
                  <Send size={15} /> Recibir y generar compra
                </button>
              </div>
            )}

            {detalle.estado_pedido === 'Cancelado' && (
              <div className={styles.hint} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                <Undo2 size={14} /> Este pedido fue cancelado y no puede recibirse.
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={pedidoARecibir !== null}
        title={`Recepción de Mercadería — Pedido #${pedidoARecibir?.id_pedido ?? ''}`}
        onClose={() => setPedidoARecibir(null)}
        width={560}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setPedidoARecibir(null)}
              disabled={recibiendo}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={confirmarRecepcion}
              disabled={recibiendo}
            >
              {recibiendo ? <Loader2 size={16} className={styles.spinner} /> : <PackageCheck size={16} />}
              {recibiendo ? 'Recepcionando...' : 'Confirmar Recepción y Generar Compra'}
            </button>
          </>
        }
      >
        {pedidoARecibir && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Proveedor</span>
                <span className={styles.detailItemValue}>{pedidoARecibir.razon_social_proveedor || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Total Pedido</span>
                <span className={styles.detailItemValue}>{formatearMoneda(pedidoARecibir.total_pedido)}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="recepcion-usuario">
                Personal que recibe la mercadería <span className={styles.requiredMark}>*</span>
              </label>
              <select
                id="recepcion-usuario"
                className={styles.select}
                value={usuarioRecepcion}
                onChange={(e) => setUsuarioRecepcion(e.target.value)}
              >
                {usuarios.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombre_completo} ({u.rol})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <SelectorComprobante
                urlActual={comprobanteRecepcion}
                onArchivoSubido={(url) => setComprobanteRecepcion(url)}
                onEliminar={() => setComprobanteRecepcion('')}
                carpeta="pedidos"
                etiqueta="Nota de entrega / Factura del proveedor (PDF o imagen)"
              />
            </div>

            <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
              Al confirmar, se registrará la recepción de mercadería, se generará la compra asociada enlazada a este pedido y se incrementará automáticamente el stock de los productos.
            </p>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default PedidosProveedor;
