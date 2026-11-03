import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  Eye,
  Receipt,
  Wallet,
  TrendingUp,
  Printer,
  X,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  ventasService,
  Venta,
  VentaPayload,
  TipoVenta,
  MetodoPago,
  EstadoPagoVenta,
} from '../../services/ventas.service';
import { productosService, Producto } from '../../services/productos.service';
import { clientesService, Cliente } from '../../services/clientes.service';
import { usuariosService, Usuario } from '../../services/usuarios.service';
import { useContextoAuth } from '../../context/ContextoAuth';
import { formatearMoneda, formatearFechaHora } from '../../utils/formato';
import { aNumero } from '../../utils/consulta';

interface LineaForm {
  id_producto: string;
  cantidad: string;
}

interface FormState {
  id_usuario: string;
  id_cliente: string;
  tipo_venta: TipoVenta;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPagoVenta;
  monto_descuento: string;
  monto_efectivo: string;
  detalles: LineaForm[];
}

const LINEA_VACIA: LineaForm = { id_producto: '', cantidad: '1' };

const FORM_VACIO: FormState = {
  id_usuario: '',
  id_cliente: '',
  tipo_venta: 'Contado',
  metodo_pago: 'Efectivo',
  estado_pago: 'Pagado',
  monto_descuento: '0',
  monto_efectivo: '',
  detalles: [{ ...LINEA_VACIA }],
};

const TIPOS_VENTA: TipoVenta[] = ['Contado', 'Credito'];
const METODOS: MetodoPago[] = ['Efectivo', 'QR'];
const ESTADOS: EstadoPagoVenta[] = ['Pagado', 'Pendiente', 'Anulado'];

type FiltroEstado = 'all' | EstadoPagoVenta;

const POR_PAGINA_INICIAL = 5;

export const Ventas: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();
  const { usuario: usuarioAuth, esAdmin } = useContextoAuth();

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Venta | null>(null);
  const [detalle, setDetalle] = useState<Venta | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const [search, setSearch] = useState('');
  const [busquedaRapida, setBusquedaRapida] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const [ventasData, productosData, clientesData, usuariosData] = await Promise.all([
        ventasService.getAll(),
        productosService.getAll(false),
        clientesService.getAll(),
        usuariosService.getAll(),
      ]);
      setVentas(ventasData || []);
      setProductos(productosData || []);
      setClientes(clientesData || []);
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar las ventas.', 'error');
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
  }, [search, filtro, filtroVendedor]);

  const precioDe = (idProducto: string): number => {
    const prod = productos.find((p) => String(p.id_producto) === idProducto);
    return prod ? Number(prod.precio) : 0;
  };

  const subtotalEstimado = useMemo(
    () =>
      form.detalles.reduce((acc, linea) => {
        const cantidad = Number(linea.cantidad) || 0;
        return acc + precioDe(linea.id_producto) * cantidad;
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.detalles, productos]
  );

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => String(c.id_cliente) === form.id_cliente),
    [clientes, form.id_cliente]
  );

  // ponytail: 10% wholesale auto-discount heuristic, replace with per-client column if rates diverge
  useEffect(() => {
    if (!editando && clienteSeleccionado?.tipo_cliente === 'Mayorista') {
      setForm((prev) => ({
        ...prev,
        monto_descuento: (subtotalEstimado * 0.1).toFixed(2),
      }));
    }
  }, [clienteSeleccionado?.id_cliente, clienteSeleccionado?.tipo_cliente, subtotalEstimado, editando]);

  const descuentoNum = Math.max(0, Number(form.monto_descuento) || 0);
  const totalEstimado = Math.max(0, subtotalEstimado - descuentoNum);

  const agregarPorBusqueda = (q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) return;
    const match = productos.find(
      (p) =>
        (p.codigo_barras ?? '').toLowerCase() === term ||
        p.nombre_producto.toLowerCase().includes(term)
    );
    if (!match?.id_producto) {
      showToast('Producto no encontrado.', 'error');
      return;
    }
    const idStr = String(match.id_producto);
    setForm((prev) => {
      const idx = prev.detalles.findIndex((d) => d.id_producto === idStr);
      if (idx >= 0) {
        const detalles = prev.detalles.map((d, i) =>
          i === idx ? { ...d, cantidad: String((Number(d.cantidad) || 0) + 1) } : d
        );
        return { ...prev, detalles };
      }
      if (prev.detalles.length === 1 && !prev.detalles[0].id_producto) {
        return { ...prev, detalles: [{ id_producto: idStr, cantidad: '1' }] };
      }
      return { ...prev, detalles: [...prev.detalles, { id_producto: idStr, cantidad: '1' }] };
    });
    setBusquedaRapida('');
  };

  const abrirCrear = () => {
    setEditando(null);
    const idPorDefecto =
      usuarioAuth?.id_usuario != null
        ? String(usuarioAuth.id_usuario)
        : usuarios[0]?.id_usuario != null
          ? String(usuarios[0].id_usuario)
          : '';
    setForm({
      ...FORM_VACIO,
      id_usuario: idPorDefecto,
      detalles: [{ ...LINEA_VACIA }],
    });
    setModalOpen(true);
  };

  const abrirEditar = (venta: Venta) => {
    setEditando(venta);
    setForm({
      ...FORM_VACIO,
      id_usuario: String(venta.id_usuario),
      id_cliente: venta.id_cliente != null ? String(venta.id_cliente) : '',
      tipo_venta: venta.tipo_venta as TipoVenta,
      metodo_pago: venta.metodo_pago as MetodoPago,
      estado_pago: venta.estado_pago as EstadoPagoVenta,
      detalles: [{ ...LINEA_VACIA }],
    });
    setModalOpen(true);
  };

  const verDetalle = async (venta: Venta) => {
    if (venta.id_venta == null) return;
    try {
      const completa = await ventasService.getOne(venta.id_venta);
      setDetalle(completa);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el detalle.', 'error');
    }
  };

  const actualizarLinea = (index: number, cambios: Partial<LineaForm>) => {
    setForm((prev) => {
      const detalles = prev.detalles.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea));
      return { ...prev, detalles };
    });
  };

  const agregarLinea = () =>
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...LINEA_VACIA }] }));

  const quitarLinea = (index: number) =>
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editando?.id_venta != null) {
        const payload: { id_cliente?: number; estado_pago?: EstadoPagoVenta } = {
          estado_pago: form.estado_pago,
        };
        const idCliente = aNumero(form.id_cliente);
        if (idCliente !== undefined) payload.id_cliente = idCliente;
        await ventasService.update(editando.id_venta, payload);
        showToast('Venta actualizada correctamente.');
      } else {
        const idUsuario = aNumero(form.id_usuario);
        if (idUsuario === undefined) {
          showToast('Selecciona el vendedor (usuario).', 'error');
          setSaving(false);
          return;
        }
        const detalles = form.detalles
          .map((linea) => ({
            id_producto: aNumero(linea.id_producto),
            cantidad: aNumero(linea.cantidad),
          }))
          .filter(
            (d): d is { id_producto: number; cantidad: number } =>
              d.id_producto !== undefined && d.cantidad !== undefined && d.cantidad > 0
          );

        if (detalles.length === 0) {
          showToast('Agrega al menos un producto con cantidad válida.', 'error');
          setSaving(false);
          return;
        }

        const payload: VentaPayload = {
          id_usuario: idUsuario,
          tipo_venta: form.tipo_venta,
          metodo_pago: form.metodo_pago,
          monto_descuento: descuentoNum,
          detalles,
        };
        const idCliente = aNumero(form.id_cliente);
        if (idCliente !== undefined) payload.id_cliente = idCliente;

        if (form.metodo_pago === 'Efectivo') {
          const efectivo = aNumero(form.monto_efectivo);
          if (efectivo === undefined) {
            showToast('Indica el monto entregado en efectivo.', 'error');
            setSaving(false);
            return;
          }
          if (efectivo < totalEstimado) {
            showToast('El monto en efectivo es menor al total de la venta.', 'error');
            setSaving(false);
            return;
          }
          payload.monto_efectivo = efectivo;
        } else {
          payload.estado_pago = form.estado_pago;
        }

        const creada = await ventasService.create(payload);
        setDetalle(creada);
        showToast('Venta registrada y stock descontado.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar la venta.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const anular = async (venta: Venta) => {
    if (venta.id_venta == null) return;
    if (!window.confirm(`¿Anular la venta #${venta.id_venta}? El stock será restituido.`)) return;
    try {
      await ventasService.remove(venta.id_venta);
      showToast('Venta anulada y stock restituido.');
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al anular.', 'error');
    }
  };

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ventas.filter((v) => {
      const coincide =
        !q ||
        (v.nombre_cliente ?? '').toLowerCase().includes(q) ||
        (v.nombre_usuario ?? '').toLowerCase().includes(q) ||
        String(v.id_venta ?? '').includes(q);
      const porEstado = filtro === 'all' ? true : v.estado_pago === filtro;
      const porVendedor =
        filtroVendedor === 'all' ? true : String(v.id_usuario) === filtroVendedor;
      return coincide && porEstado && porVendedor;
    });
  }, [ventas, search, filtro, filtroVendedor]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalRecaudado = ventas
    .filter((v) => v.estado_pago !== 'Anulado')
    .reduce((acc, v) => acc + Number(v.monto_total), 0);
  const totalPendientes = ventas.filter((v) => v.estado_pago === 'Pendiente').length;
  const totalEfectivo = ventas
    .filter((v) => v.estado_pago !== 'Anulado' && v.metodo_pago === 'Efectivo')
    .reduce((acc, v) => acc + Number(v.monto_total), 0);

  const pillEstado = (estado: string) =>
    estado === 'Pagado' ? styles.pillSuccess : estado === 'Pendiente' ? styles.pillWarning : styles.pillDanger;

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Ventas en Mostrador</h1>
            <span className={styles.badge}>
              <ShoppingBag size={14} /> Punto de venta
            </span>
          </div>
          <p className={styles.subtitle}>
            Registro de ventas con descuento automático de stock, control de pagos y
            comprobantes.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirCrear}>
            <Plus size={16} /> Nueva Venta
          </button>
        </div>
      </div>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <Receipt size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Ventas Registradas</span>
            <span className={styles.kpiValue}>{ventas.length}</span>
            <span className={styles.kpiSubtext}>{totalPendientes} pendientes de pago</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Recaudado</span>
            <span className={styles.kpiValue}>{formatearMoneda(totalRecaudado)}</span>
            <span className={styles.kpiSubtext}>Excluye ventas anuladas</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Wallet size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Cobrado en Efectivo</span>
            <span className={styles.kpiValue}>{formatearMoneda(totalEfectivo)}</span>
            <span className={styles.kpiSubtext}>Arqueo de caja</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Receipt size={17} /> Historial de Ventas
            <span className={styles.countBadge}>{filtradas.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por cliente, vendedor o N° de venta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {esAdmin && (
            <select
              className={styles.select}
              style={{ maxWidth: 230, height: 36 }}
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              aria-label="Filtrar ventas por vendedor"
            >
              <option value="all">Todos los vendedores</option>
              {usuarios
                .filter((u) => u.rol !== 'SUPER_ADMIN')
                .map((u) => (
                  <option key={u.id_usuario} value={String(u.id_usuario)}>
                    {u.nombre_completo}
                  </option>
                ))}
            </select>
          )}
          <div className={styles.filters}>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('all')}
            >
              Todas
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
            <Loader2 size={18} className={styles.spinner} /> Cargando ventas...
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingBag size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin ventas</span>
            <span className={styles.emptyText}>Registra la primera venta del día.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Método</th>
                  <th className={styles.right}>Total</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((v) => (
                  <tr key={v.id_venta}>
                    <td className={styles.strong}>#{v.id_venta}</td>
                    <td className={styles.muted}>{formatearFechaHora(v.fecha_hora)}</td>
                    <td>
                      {v.nombre_cliente ? (
                        <>
                          <span className={styles.strong}>{v.nombre_cliente}</span>{' '}
                          {v.tipo_cliente === 'Mayorista' && (
                            <span className={`${styles.pill} ${styles.pillInfo}`}>Mayorista</span>
                          )}
                        </>
                      ) : (
                        <span className={styles.muted}>General</span>
                      )}
                    </td>
                    <td className={styles.muted}>{v.nombre_usuario || '—'}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillNeutral}`}>{v.metodo_pago}</span>
                    </td>
                    <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(v.monto_total)}</td>
                    <td className={styles.center}>
                      <span className={`${styles.pill} ${pillEstado(String(v.estado_pago))}`}>
                        {v.estado_pago}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Ver detalle"
                          onClick={() => verDetalle(v)}
                        >
                          <Eye size={15} />
                        </button>
                        {esAdmin && (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Editar pago / cliente"
                              onClick={() => abrirEditar(v)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              title="Anular"
                              onClick={() => anular(v)}
                              disabled={v.estado_pago === 'Anulado'}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <Paginador
            total={filtradas.length}
            pagina={paginaActual}
            onChange={setPagina}
            porPagina={porPagina}
            onPorPaginaChange={(nuevo) => {
              setPorPagina(nuevo);
              setPagina(1);
            }}
            etiqueta="ventas"
          />
        )}
      </section>

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        title={editando ? `Editar Venta #${editando.id_venta}` : 'Nueva Venta'}
        onClose={() => setModalOpen(false)}
        width={editando ? 520 : 780}
        footer={
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-venta" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        {editando ? (
          <form id="form-venta" onSubmit={guardar} className={styles.formGrid} noValidate>
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <span className={styles.hint}>Solo se puede actualizar el cliente y el estado de pago.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-cliente">
                Cliente
              </label>
              <select
                id="venta-cliente"
                className={styles.select}
                value={form.id_cliente}
                onChange={(e) => setForm((prev) => ({ ...prev, id_cliente: e.target.value }))}
              >
                <option value="">Venta general</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.razon_social_nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-estado">
                Estado de pago
              </label>
              <select
                id="venta-estado"
                className={styles.select}
                value={form.estado_pago}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estado_pago: e.target.value as EstadoPagoVenta }))
                }
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </form>
        ) : (
          <form id="form-venta" onSubmit={guardar} className={styles.formGrid} noValidate>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-usuario">
                Vendedor <span className={styles.requiredMark}>*</span>
              </label>
              <select
                id="venta-usuario"
                className={styles.select}
                value={form.id_usuario}
                onChange={(e) => setForm((prev) => ({ ...prev, id_usuario: e.target.value }))}
                disabled={!esAdmin}
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
              <label className={styles.fieldLabel} htmlFor="venta-cliente-nuevo">
                Cliente
              </label>
              <select
                id="venta-cliente-nuevo"
                className={styles.select}
                value={form.id_cliente}
                onChange={(e) => setForm((prev) => ({ ...prev, id_cliente: e.target.value, monto_descuento: '0' }))}
              >
                <option value="">Venta general (Minorista ocasional)</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.razon_social_nombre} ({c.tipo_cliente})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-descuento">
                Descuento (Bs) {clienteSeleccionado?.tipo_cliente === 'Mayorista' && '· Mayorista 10% auto'}
              </label>
              <input
                id="venta-descuento"
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.monto_descuento}
                onChange={(e) => setForm((prev) => ({ ...prev, monto_descuento: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-tipo">
                Tipo de venta
              </label>
              <select
                id="venta-tipo"
                className={styles.select}
                value={form.tipo_venta}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_venta: e.target.value as TipoVenta }))}
              >
                {TIPOS_VENTA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-metodo">
                Método de pago
              </label>
              <select
                id="venta-metodo"
                className={styles.select}
                value={form.metodo_pago}
                onChange={(e) => setForm((prev) => ({ ...prev, metodo_pago: e.target.value as MetodoPago }))}
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {form.metodo_pago === 'Efectivo' ? (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="venta-efectivo">
                  Monto entregado (Bs)
                </label>
                <input
                  id="venta-efectivo"
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto_efectivo}
                  onChange={(e) => setForm((prev) => ({ ...prev, monto_efectivo: e.target.value }))}
                  placeholder={totalEstimado.toFixed(2)}
                />
                <span className={styles.hint}>Vuelto: {formatearMoneda((Number(form.monto_efectivo) || 0) - totalEstimado)}</span>
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="venta-estado-nuevo">
                  Estado de pago
                </label>
                <select
                  id="venta-estado-nuevo"
                  className={styles.select}
                  value={form.estado_pago}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, estado_pago: e.target.value as EstadoPagoVenta }))
                  }
                >
                  {ESTADOS.filter((e) => e !== 'Anulado').map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <div className={styles.linesHeader}>
                <span className={styles.linesTitle}>
                  <ShoppingBag size={15} /> Canasta de Productos
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    className={styles.input}
                    style={{ width: '240px', padding: '5px 10px' }}
                    type="text"
                    list="lista-productos-pos"
                    placeholder="Buscar código o nombre + Enter..."
                    value={busquedaRapida}
                    onChange={(e) => setBusquedaRapida(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarPorBusqueda(busquedaRapida);
                      }
                    }}
                  />
                  <datalist id="lista-productos-pos">
                    {productos.map((p) => (
                      <option key={p.id_producto} value={p.codigo_barras || p.nombre_producto}>
                        {p.nombre_producto} — {formatearMoneda(p.precio)} (Stock: {p.stock_actual})
                      </option>
                    ))}
                  </datalist>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                    onClick={() => (busquedaRapida.trim() ? agregarPorBusqueda(busquedaRapida) : agregarLinea())}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>

              <div className={`${styles.lineRow} ${styles.lineRowHead}`}>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>Subtotal</span>
                <span />
              </div>

              {form.detalles.map((linea, index) => {
                const precio = precioDe(linea.id_producto);
                const subtotal = precio * (Number(linea.cantidad) || 0);
                return (
                  <div key={index} className={styles.lineRow}>
                    <select
                      className={styles.select}
                      value={linea.id_producto}
                      onChange={(e) => actualizarLinea(index, { id_producto: e.target.value })}
                    >
                      <option value="">Seleccionar</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre_producto} (stock: {p.stock_actual})
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
                    />
                    <span className={styles.money}>{formatearMoneda(precio)}</span>
                    <span className={styles.money}>{formatearMoneda(subtotal)}</span>
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
                <span className={styles.lineTotalLabel}>
                  Subtotal: {formatearMoneda(subtotalEstimado)} · Desc: -{formatearMoneda(descuentoNum)} · Total a cobrar
                </span>
                {formatearMoneda(totalEstimado)}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal detalle / Comprobante */}
      <Modal
        open={detalle !== null}
        title={`Nota de Venta #${detalle?.id_venta ?? ''} — Librería TOFOR`}
        onClose={() => setDetalle(null)}
        width={680}
        footer={
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => window.print()}
          >
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
        }
      >
        {detalle && (
          <>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Fecha</span>
                <span className={styles.detailItemValue}>{formatearFechaHora(detalle.fecha_hora)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Cliente / NIT-CI</span>
                <span className={styles.detailItemValue}>
                  {detalle.nombre_cliente
                    ? `${detalle.nombre_cliente} (${detalle.nit_cliente || 'S/N'} · ${detalle.tipo_cliente || ''})`
                    : 'General (Mostrador)'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Vendedor</span>
                <span className={styles.detailItemValue}>{detalle.nombre_usuario || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Método / Estado</span>
                <span className={styles.detailItemValue}>
                  {detalle.metodo_pago} · {detalle.estado_pago}
                </span>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.center}>Cantidad</th>
                    <th className={styles.right}>Precio</th>
                    <th className={styles.right}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.detalles ?? []).map((d, i) => (
                    <tr key={d.id_detalle_venta ?? i}>
                      <td className={styles.strong}>{d.nombre_producto || `Producto #${d.id_producto}`}</td>
                      <td className={styles.center}>{d.cantidad}</td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.precio_aplicado)}</td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Number(detalle.monto_descuento) > 0 && (
              <div className={styles.hint} style={{ textAlign: 'right', marginTop: '8px' }}>
                Descuento aplicado: -{formatearMoneda(detalle.monto_descuento)}
              </div>
            )}
            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total Cobrado</span>
              {formatearMoneda(detalle.monto_total)}
            </div>
            {detalle.metodo_pago === 'Efectivo' && (
              <div className={styles.hint} style={{ textAlign: 'right' }}>
                Efectivo: {formatearMoneda(detalle.monto_efectivo)} · Vuelto:{' '}
                {formatearMoneda(detalle.monto_cambio)}
              </div>
            )}
          </>
        )}
      </Modal>
    </main>
  );
};

export default Ventas;
