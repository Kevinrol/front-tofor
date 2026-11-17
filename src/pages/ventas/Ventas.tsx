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
  ScanBarcode,
  LayoutGrid,
  List,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import vStyles from './Ventas.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { LectorCodigoBarrasModal } from '../../components/LectorCodigoBarrasModal/LectorCodigoBarrasModal';
import { useToast } from '../../hooks/useToast';
import {
  ventasService,
  Venta,
  VentaPayload,
  VentaUpdatePayload,
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
  unidad_venta: string;
  factor_conversion: number;
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

const LINEA_VACIA: LineaForm = {
  id_producto: '',
  cantidad: '1',
  unidad_venta: 'Unidad',
  factor_conversion: 1,
};

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editando, setEditando] = useState<Venta | null>(null);
  const [detalle, setDetalle] = useState<Venta | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const [search, setSearch] = useState('');
  const [busquedaRapida, setBusquedaRapida] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);
  const [vistaModo, setVistaModo] = useState<'cards' | 'table'>('cards');

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

  const subtotalLineaVenta = (linea: LineaForm): number => {
    const pUnit = precioDe(linea.id_producto);
    const cant = Number(linea.cantidad) || 0;
    const factor = Number(linea.factor_conversion) || 1;
    return cant * factor * pUnit;
  };

  const subtotalEstimado = useMemo(
    () =>
      form.detalles.reduce((acc, linea) => acc + subtotalLineaVenta(linea), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.detalles, productos]
  );

  const clienteSeleccionado = useMemo(() => {
    if (!form.id_cliente) return null;
    return clientes.find((c) => String(c.id_cliente) === String(form.id_cliente)) ?? null;
  }, [form.id_cliente, clientes]);

  const esClienteMayorista = clienteSeleccionado?.tipo_cliente === 'Mayorista';

  const cambiarClienteNuevo = (nuevoIdCliente: string) => {
    const cli = clientes.find((c) => String(c.id_cliente) === String(nuevoIdCliente));
    const esMayorista = cli?.tipo_cliente === 'Mayorista';

    setForm((prev) => ({
      ...prev,
      id_cliente: nuevoIdCliente,
      monto_descuento: '0',
      tipo_venta: esMayorista ? prev.tipo_venta : 'Contado',
      estado_pago: esMayorista ? prev.estado_pago : 'Pagado',
    }));
  };

  const descuentoNum = Math.max(0, Number(form.monto_descuento) || 0);
  const totalEstimado = Math.max(0, subtotalEstimado - descuentoNum);

  const subtotalEdicion = editando
    ? Number(editando.monto_total ?? 0) + Number(editando.monto_descuento ?? 0)
    : 0;
  const totalEdicion = Math.max(0, subtotalEdicion - descuentoNum);
  const efectivoEdicion = Number(form.monto_efectivo) || 0;
  const cambioEdicion = efectivoEdicion - totalEdicion;

  const agregarProductoAlDetalle = (prod: Producto) => {
    const idStr = String(prod.id_producto);
    const uDefault = 'Unidad';
    const fDefault = 1;

    setForm((prev) => {
      const idx = prev.detalles.findIndex(
        (d) => d.id_producto === idStr && d.unidad_venta === uDefault
      );
      if (idx >= 0) {
        const detalles = prev.detalles.map((d, i) =>
          i === idx ? { ...d, cantidad: String((Number(d.cantidad) || 0) + 1) } : d
        );
        return { ...prev, detalles };
      }
      const emptyIdx = prev.detalles.findIndex((d) => !d.id_producto);
      if (emptyIdx >= 0) {
        const detalles = prev.detalles.map((d, i) =>
          i === emptyIdx
            ? { id_producto: idStr, cantidad: '1', unidad_venta: uDefault, factor_conversion: fDefault }
            : d
        );
        return { ...prev, detalles };
      }
      return {
        ...prev,
        detalles: [
          ...prev.detalles,
          { id_producto: idStr, cantidad: '1', unidad_venta: uDefault, factor_conversion: fDefault },
        ],
      };
    });
  };

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
    agregarProductoAlDetalle(match);
    setBusquedaRapida('');
  };

  const agregarPorCodigoBarras = (codigo: string) => {
    const term = codigo.trim().toLowerCase();
    if (!term) return;
    const match = productos.find(
      (p) => (p.codigo_barras ?? '').trim().toLowerCase() === term
    );
    if (!match?.id_producto) {
      showToast(`No se encontró ningún producto con el código de barras: ${codigo}`, 'error');
      return;
    }
    if (match.stock_actual <= 0) {
      showToast(`Atención: "${match.nombre_producto}" tiene stock 0.`, 'error');
    }
    agregarProductoAlDetalle(match);
    showToast(`Producto agregado: ${match.nombre_producto}`);
  };

  const iniciarEscaneo = () => {
    if (!modalOpen || editando) {
      abrirCrear();
    }
    setScannerOpen(true);
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
      monto_descuento: String(Number(venta.monto_descuento ?? 0)),
      monto_efectivo:
        venta.monto_efectivo !== null && venta.monto_efectivo !== undefined
          ? String(venta.monto_efectivo)
          : '',
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
        if (descuentoNum > subtotalEdicion + 0.001) {
          showToast('El descuento no puede superar el subtotal de la venta.', 'error');
          setSaving(false);
          return;
        }

        const payload: VentaUpdatePayload = {
          estado_pago: form.estado_pago,
          monto_descuento: descuentoNum,
        };

        const idCliente = aNumero(form.id_cliente);
        payload.id_cliente = idCliente ?? null;

        if (editando.tipo_venta === 'Credito') {
          const cli = clientes.find((c) => c.id_cliente === idCliente);
          if (!cli || cli.tipo_cliente !== 'Mayorista') {
            showToast(
              'Una venta a crédito solo puede estar asociada a un cliente Mayorista registrado.',
              'error'
            );
            setSaving(false);
            return;
          }
        }

        if (editando.metodo_pago === 'Efectivo') {
          const efectivo = aNumero(form.monto_efectivo);
          if (efectivo === undefined) {
            showToast('Indica el monto entregado en efectivo.', 'error');
            setSaving(false);
            return;
          }
          if (efectivo < totalEdicion) {
            showToast('El monto entregado es menor al nuevo total de la venta.', 'error');
            setSaving(false);
            return;
          }
          payload.monto_efectivo = efectivo;
        }

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
          .map((linea) => {
            const cant = aNumero(linea.cantidad) ?? 0;
            const factor = Number(linea.factor_conversion) || 1;
            return {
              id_producto: aNumero(linea.id_producto),
              cantidad: cant * factor,
            };
          })
          .filter(
            (d): d is { id_producto: number; cantidad: number } =>
              d.id_producto !== undefined && d.cantidad > 0
          );

        if (detalles.length === 0) {
          showToast('Agrega al menos un producto con cantidad válida.', 'error');
          setSaving(false);
          return;
        }

        if (form.tipo_venta === 'Credito' && !esClienteMayorista) {
          showToast(
            'Las ventas a crédito solo están permitidas para clientes mayoristas registrados.',
            'error'
          );
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

        if (form.tipo_venta === 'Credito') {
          payload.estado_pago = form.estado_pago || 'Pendiente';
          if (form.monto_efectivo && form.monto_efectivo.trim() !== '') {
            payload.monto_efectivo = aNumero(form.monto_efectivo);
          }
        } else if (form.metodo_pago === 'Efectivo') {
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
          payload.estado_pago = 'Pagado';
        } else {
          payload.estado_pago = form.estado_pago || 'Pagado';
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
        <div className={vStyles.headerActionsResponsive}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${vStyles.headerBtn}`}
            onClick={iniciarEscaneo}
            title="Escanear producto con cámara para venta"
          >
            <ScanBarcode size={16} /> Escanear para Venta
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${vStyles.headerBtn}`}
            onClick={abrirCrear}
          >
            <Plus size={16} /> Nueva Venta
          </button>
        </div>
      </div>

      <section className={vStyles.kpiGridResponsive}>
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

        <div className={vStyles.toolbarResponsive}>
          <div className={vStyles.searchBoxResponsive}>
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
              className={`${styles.select} ${vStyles.selectVendedorResponsive}`}
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
          <div className={vStyles.filtersResponsive}>
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

          <div className={vStyles.viewSwitcher}>
            <button
              type="button"
              className={`${vStyles.viewSwitchBtn} ${vistaModo === 'cards' ? vStyles.viewSwitchBtnActive : ''}`}
              onClick={() => setVistaModo('cards')}
              title="Ver en formato Tarjetas"
            >
              <LayoutGrid size={15} /> Tarjetas
            </button>
            <button
              type="button"
              className={`${vStyles.viewSwitchBtn} ${vistaModo === 'table' ? vStyles.viewSwitchBtnActive : ''}`}
              onClick={() => setVistaModo('table')}
              title="Ver en formato Tabla"
            >
              <List size={15} /> Tabla
            </button>
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
        ) : vistaModo === 'table' ? (
          /* Vista en Formato Tabla */
          <div className={vStyles.desktopTableWrap}>
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
                              title={
                                v.estado_pago === 'Anulado'
                                  ? 'No se puede editar una venta anulada'
                                  : 'Editar venta'
                              }
                              onClick={() => abrirEditar(v)}
                              disabled={v.estado_pago === 'Anulado'}
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
        ) : (
          /* Vista en Formato Tarjetas (Predeterminado en todas las pantallas) */
          <div className={vStyles.salesCardsGrid}>
            {visibles.map((v) => (
              <div key={v.id_venta} className={vStyles.saleCard}>
                <div className={vStyles.saleCardHeader}>
                  <div className={vStyles.saleCardIdGroup}>
                    <span className={vStyles.saleCardId}>#{v.id_venta}</span>
                    <span className={vStyles.saleCardDate}>{formatearFechaHora(v.fecha_hora)}</span>
                  </div>
                  <span className={`${styles.pill} ${pillEstado(String(v.estado_pago))}`}>
                    {v.estado_pago}
                  </span>
                </div>

                <div className={vStyles.saleCardBody}>
                  <div className={vStyles.saleCardRow}>
                    <span className={vStyles.saleCardRowLabel}>Cliente:</span>
                    <span className={vStyles.saleCardRowValue}>
                      <strong>{v.nombre_cliente || 'Venta general'}</strong>
                      {v.tipo_cliente && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          ({v.tipo_cliente})
                        </span>
                      )}
                      {v.nit_cliente && (
                        <div className={styles.hint}>NIT/CI: {v.nit_cliente}</div>
                      )}
                    </span>
                  </div>

                  <div className={vStyles.saleCardRow}>
                    <span className={vStyles.saleCardRowLabel}>Vendedor:</span>
                    <span className={vStyles.saleCardRowValue}>{v.nombre_usuario || '—'}</span>
                  </div>

                  <div className={vStyles.saleCardRow}>
                    <span className={vStyles.saleCardRowLabel}>Método:</span>
                    <span className={vStyles.saleCardRowValue}>
                      {v.metodo_pago} · {v.tipo_venta}
                    </span>
                  </div>

                  <div className={vStyles.saleCardTotalRow}>
                    <span className={vStyles.saleCardTotalLabel}>Total:</span>
                    <span className={vStyles.saleCardTotalValue}>{formatearMoneda(v.monto_total)}</span>
                  </div>
                </div>

                <div className={vStyles.saleCardActions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost} ${vStyles.saleCardActionMain}`}
                    onClick={() => verDetalle(v)}
                  >
                    <Eye size={15} /> Comprobante
                  </button>
                  {esAdmin && (
                    <>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${vStyles.saleCardActionIcon}`}
                        title="Editar"
                        onClick={() => abrirEditar(v)}
                        disabled={v.estado_pago === 'Anulado'}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger} ${vStyles.saleCardActionIcon}`}
                        title="Anular"
                        onClick={() => anular(v)}
                        disabled={v.estado_pago === 'Anulado'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
          <div className={vStyles.modalFooterResponsive}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-venta" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        }
      >
        {editando ? (
          <form id="form-venta" onSubmit={guardar} className={styles.formGrid} noValidate>
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <span className={styles.hint}>
                Puedes actualizar cliente, descuento, estado de pago y monto entregado. El total y el
                vuelto se recalculan automáticamente.
              </span>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-cliente">
                Cliente {editando.tipo_venta === 'Credito' ? '(Solo Mayoristas por ser venta a Crédito)' : ''}
              </label>
              <select
                id="venta-cliente"
                className={styles.select}
                value={form.id_cliente}
                onChange={(e) => setForm((prev) => ({ ...prev, id_cliente: e.target.value }))}
              >
                {editando.tipo_venta !== 'Credito' && (
                  <option value="">Venta general</option>
                )}
                {clientes
                  .filter((c) => (editando.tipo_venta === 'Credito' ? c.tipo_cliente === 'Mayorista' : true))
                  .map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.razon_social_nombre} ({c.tipo_cliente})
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
                {ESTADOS.filter((estado) => estado !== 'Anulado').map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            {/* Panel de Cálculo de Totales y Cobro en Edición */}
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <div className={vStyles.cobroPanel}>
                {/* 1. Cálculo del Total: Subtotal, Descuento y Total */}
                <div className={vStyles.cobroCalculoRow}>
                  <div className={vStyles.cobroDatoGrupo}>
                    <span className={vStyles.cobroDatoLabel}>Subtotal:</span>
                    <span className={vStyles.cobroDatoValor}>{formatearMoneda(subtotalEdicion)}</span>
                  </div>

                  <div className={vStyles.cobroDatoGrupo}>
                    <label htmlFor="venta-descuento-editar" className={vStyles.cobroDatoLabel}>
                      Descuento (Bs):
                    </label>
                    <input
                      id="venta-descuento-editar"
                      className={`${styles.input} ${vStyles.cobroDescuentoInput}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monto_descuento}
                      onChange={(e) => setForm((prev) => ({ ...prev, monto_descuento: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={vStyles.cobroTotalDestacado}>
                    <span className={vStyles.cobroTotalLabel}>Total calculado:</span>
                    <span className={vStyles.cobroTotalValor}>{formatearMoneda(totalEdicion)}</span>
                  </div>
                </div>

                {/* 2. Campo Monto Entregado y Vuelto: DESPUÉS DE CALCULAR EL TOTAL */}
                {editando.metodo_pago === 'Efectivo' && (
                  <>
                    <hr className={vStyles.cobroDivider} />
                    <div className={vStyles.cobroEfectivoRow}>
                      <div className={vStyles.cobroEfectivoInputWrap}>
                        <label htmlFor="venta-efectivo-editar" className={vStyles.cobroDatoLabel}>
                          Monto entregado (Bs):
                        </label>
                        <input
                          id="venta-efectivo-editar"
                          className={`${styles.input} ${vStyles.cobroEfectivoInput}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monto_efectivo}
                          onChange={(e) => setForm((prev) => ({ ...prev, monto_efectivo: e.target.value }))}
                          placeholder={totalEdicion > 0 ? totalEdicion.toFixed(2) : '0.00'}
                        />
                        {totalEdicion > 0 && (
                          <button
                            type="button"
                            className={vStyles.cobroBtnExacto}
                            onClick={() => setForm((prev) => ({ ...prev, monto_efectivo: totalEdicion.toFixed(2) }))}
                            title="Completar con el monto exacto"
                          >
                            Monto exacto
                          </button>
                        )}
                      </div>

                      <div className={vStyles.cobroVueltoWrap}>
                        <span className={vStyles.cobroDatoLabel}>
                          {cambioEdicion >= 0 ? 'Vuelto / Cambio:' : 'Falta abonar:'}
                        </span>
                        {cambioEdicion >= 0 ? (
                          <span className={vStyles.cobroVueltoBadgePositivo}>
                            {formatearMoneda(cambioEdicion)}
                          </span>
                        ) : (
                          <span className={vStyles.cobroVueltoBadgeAlerta}>
                            {formatearMoneda(Math.abs(cambioEdicion))}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                onChange={(e) => cambiarClienteNuevo(e.target.value)}
              >
                <option value="">Venta general (Minorista ocasional)</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.razon_social_nombre} ({c.tipo_cliente})
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '4px', fontSize: '12px', color: esClienteMayorista ? '#059669' : '#6b7280' }}>
              </div>
            </div>

            {esClienteMayorista && (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="venta-tipo">
                  Tipo de venta
                </label>
                <select
                  id="venta-tipo"
                  className={styles.select}
                  value={form.tipo_venta}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value as TipoVenta;
                    setForm((prev) => ({
                      ...prev,
                      tipo_venta: nuevoTipo,
                      estado_pago: nuevoTipo === 'Credito' ? 'Pendiente' : 'Pagado',
                    }));
                  }}
                >
                  {TIPOS_VENTA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="venta-estado-nuevo">
                Estado de pago {form.tipo_venta === 'Credito' ? '(Venta a Crédito)' : ''}
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

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <div className={vStyles.canastaHeaderWrap}>
                <span className={styles.linesTitle}>
                  <ShoppingBag size={15} /> Canasta de Productos
                </span>
                <div className={vStyles.canastaSearchGroup}>
                  <input
                    className={`${styles.input} ${vStyles.canastaSearchInput}`}
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
                    {productos.map((p) => {
                      const unidadesTexto = (p.unidades || [])
                        .map((u) => `${u.nombre_unidad} (${u.cantidad_unidades}u)`)
                        .join(', ');
                      return (
                        <option key={p.id_producto} value={p.codigo_barras || p.nombre_producto}>
                          {p.nombre_producto} — {formatearMoneda(p.precio)} (Stock: {p.stock_actual} u.) · [Medidas: {unidadesTexto || 'Unidad'}]
                        </option>
                      );
                    })}
                  </datalist>
                  <div className={vStyles.canastaActionBtns}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => (busquedaRapida.trim() ? agregarPorBusqueda(busquedaRapida) : agregarLinea())}
                    >
                      <Plus size={14} /> Agregar
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => setScannerOpen(true)}
                      title="Escanear código de barras con la cámara"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ScanBarcode size={14} /> Escanear código
                    </button>
                  </div>
                </div>
              </div>

              <div className={vStyles.canastaHeader}>
                <span>Producto</span>
                <span>Cant.</span>
                <span>Unidad / Medida</span>
                <span>Precio unit.</span>
                <span>Subtotal</span>
                <span />
              </div>

              {form.detalles.map((linea, index) => {
                const prod = productos.find((p) => String(p.id_producto) === linea.id_producto);
                const precio = prod ? Number(prod.precio) : 0;
                const factor = Number(linea.factor_conversion) || 1;
                const cant = Number(linea.cantidad) || 0;
                const totalUnidades = cant * factor;
                const subtotal = totalUnidades * precio;

                const unidadesDisponibles =
                  prod?.unidades && prod.unidades.length > 0
                    ? prod.unidades
                    : [
                        { nombre_unidad: 'Unidad', cantidad_unidades: 1 },
                        { nombre_unidad: 'Media Docena', cantidad_unidades: 6 },
                        { nombre_unidad: 'Docena', cantidad_unidades: 12 },
                      ];

                return (
                  <div key={index} className={vStyles.canastaItem}>
                    <div className={vStyles.canastaColProducto}>
                      <span className={vStyles.canastaMobileTag}>Producto</span>
                      <select
                        className={styles.select}
                        value={linea.id_producto}
                        onChange={(e) => {
                          const id = e.target.value;
                          const pSel = productos.find((x) => String(x.id_producto) === id);
                          const uDefault = pSel?.unidades?.[0]?.nombre_unidad || 'Unidad';
                          const fDefault = pSel?.unidades?.[0]?.cantidad_unidades || 1;
                          actualizarLinea(index, {
                            id_producto: id,
                            unidad_venta: uDefault,
                            factor_conversion: fDefault,
                          });
                        }}
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map((p) => (
                          <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre_producto} (Stock: {p.stock_actual} u.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={vStyles.canastaColCantidad}>
                      <span className={vStyles.canastaMobileTag}>Cant.</span>
                      <input
                        className={styles.input}
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
                      />
                    </div>

                    <div className={vStyles.canastaColUnidad}>
                      <span className={vStyles.canastaMobileTag}>Unidad / Medida</span>
                      <select
                        className={styles.select}
                        value={linea.unidad_venta}
                        disabled={!linea.id_producto}
                        title={factor > 1 ? `${cant} ${linea.unidad_venta} = ${totalUnidades} u. sueltas a descontar` : undefined}
                        onChange={(e) => {
                          const nom = e.target.value;
                          const uObj = unidadesDisponibles.find(
                            (u) => u.nombre_unidad.trim().toLowerCase() === nom.trim().toLowerCase()
                          );
                          const f = uObj?.cantidad_unidades ?? 1;
                          actualizarLinea(index, { unidad_venta: nom, factor_conversion: f });
                        }}
                      >
                        {unidadesDisponibles.map((u) => (
                          <option key={u.nombre_unidad} value={u.nombre_unidad}>
                            {u.nombre_unidad} ({u.cantidad_unidades} u.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={vStyles.canastaColPrecio}>
                      <span className={vStyles.canastaMobileTag}>Precio unit.</span>
                      <span className={styles.money}>{formatearMoneda(precio)}</span>
                    </div>

                    <div className={vStyles.canastaColSubtotal}>
                      <span className={vStyles.canastaMobileTag}>Subtotal</span>
                      <span className={`${styles.money} ${vStyles.subtotalValue}`} title={factor > 1 ? `${totalUnidades} u. sueltas × ${formatearMoneda(precio)}` : undefined}>
                        {formatearMoneda(subtotal)}
                      </span>
                    </div>

                    <div className={vStyles.canastaColAccion}>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger} ${vStyles.canastaBtnQuitar}`}
                        onClick={() => quitarLinea(index)}
                        title="Quitar"
                        disabled={form.detalles.length === 1}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Panel de Cálculo de Totales y Cobro */}
              <div className={vStyles.cobroPanel}>
                {/* 1. Cálculo del Total: Subtotal, Descuento y Total a cobrar */}
                <div className={vStyles.cobroCalculoRow}>
                  <div className={vStyles.cobroDatoGrupo}>
                    <span className={vStyles.cobroDatoLabel}>Subtotal:</span>
                    <span className={vStyles.cobroDatoValor}>{formatearMoneda(subtotalEstimado)}</span>
                  </div>

                  <div className={vStyles.cobroDatoGrupo}>
                    <label htmlFor="venta-descuento" className={vStyles.cobroDatoLabel}>
                      Descuento (Bs):
                    </label>
                    <input
                      id="venta-descuento"
                      className={`${styles.input} ${vStyles.cobroDescuentoInput}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monto_descuento}
                      onChange={(e) => setForm((prev) => ({ ...prev, monto_descuento: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={vStyles.cobroTotalDestacado}>
                    <span className={vStyles.cobroTotalLabel}>Total a cobrar:</span>
                    <span className={vStyles.cobroTotalValor}>{formatearMoneda(totalEstimado)}</span>
                  </div>
                </div>

                {/* 2. Campo Monto Entregado y Vuelto: DESPUÉS DE CALCULAR EL TOTAL */}
                {form.metodo_pago === 'Efectivo' && (
                  <>
                    <hr className={vStyles.cobroDivider} />
                    <div className={vStyles.cobroEfectivoRow}>
                      <div className={vStyles.cobroEfectivoInputWrap}>
                        <label htmlFor="venta-efectivo" className={vStyles.cobroDatoLabel}>
                          Monto entregado (Bs):
                        </label>
                        <input
                          id="venta-efectivo"
                          className={`${styles.input} ${vStyles.cobroEfectivoInput}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.monto_efectivo}
                          onChange={(e) => setForm((prev) => ({ ...prev, monto_efectivo: e.target.value }))}
                          placeholder={totalEstimado > 0 ? totalEstimado.toFixed(2) : '0.00'}
                        />
                        {totalEstimado > 0 && (
                          <button
                            type="button"
                            className={vStyles.cobroBtnExacto}
                            onClick={() => setForm((prev) => ({ ...prev, monto_efectivo: totalEstimado.toFixed(2) }))}
                            title="Completar con el monto exacto"
                          >
                            Monto exacto
                          </button>
                        )}
                      </div>

                      <div className={vStyles.cobroVueltoWrap}>
                        <span className={vStyles.cobroDatoLabel}>
                          {Number(form.monto_efectivo || 0) >= totalEstimado
                            ? 'Vuelto / Cambio:'
                            : 'Falta abonar:'}
                        </span>
                        {Number(form.monto_efectivo || 0) >= totalEstimado ? (
                          <span className={vStyles.cobroVueltoBadgePositivo}>
                            {formatearMoneda((Number(form.monto_efectivo) || 0) - totalEstimado)}
                          </span>
                        ) : (
                          <span className={vStyles.cobroVueltoBadgeAlerta}>
                            {formatearMoneda(totalEstimado - (Number(form.monto_efectivo) || 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
            className={`${styles.btn} ${styles.btnPrimary} ${vStyles.printBtnResponsive}`}
            onClick={() => window.print()}
          >
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
        }
      >
        {detalle && (
          <>
            <div className={vStyles.detailGridResponsive}>
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

      <LectorCodigoBarrasModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(codigo) => {
          agregarPorCodigoBarras(codigo);
        }}
      />
    </main>
  );
};

export default Ventas;
