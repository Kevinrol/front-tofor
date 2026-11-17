import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Eye,
  Truck,
  PackageCheck,
  Calendar,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  pedidosService,
  PedidoProveedor,
  EstadoPedido,
} from '../../services/pedidos-proveedor.service';
import { productosService, Producto } from '../../services/productos.service';
import { proveedoresService, Proveedor } from '../../services/proveedores.service';
import { usuariosService, Usuario } from '../../services/usuarios.service';
import { formatearMoneda, formatearFecha } from '../../utils/formato';
import { PedidoFormModal } from './PedidoFormModal';
import { PedidoDetalleModal, pillEstadoPedido } from './PedidoDetalleModal';
import { PedidoRecepcionModal } from './PedidoRecepcionModal';

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Enviado', 'Parcial', 'Recibido', 'Cancelado'];

type FiltroEstado = 'all' | EstadoPedido;

const POR_PAGINA_INICIAL = 5;

export const PedidosProveedor: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [pedidos, setPedidos] = useState<PedidoProveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<PedidoProveedor | null>(null);
  const [detalle, setDetalle] = useState<PedidoProveedor | null>(null);
  const [pedidoARecibir, setPedidoARecibir] = useState<PedidoProveedor | null>(null);

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

  const abrirCrear = () => {
    setEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (pedido: PedidoProveedor) => {
    setEditando(pedido);
    setModalOpen(true);
  };

  const cerrarModalForm = () => {
    setModalOpen(false);
    setEditando(null);
  };

  const handlePedidoGuardado = async (mensaje: string) => {
    showToast(mensaje);
    cerrarModalForm();
    await cargar();
  };

  const verDetalle = async (pedido: PedidoProveedor) => {
    if (pedido.id_pedido == null) return;
    try {
      setDetalle(await pedidosService.getOne(pedido.id_pedido));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el detalle.', 'error');
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
  };

  const handlePedidoRecibido = async (mensaje: string) => {
    showToast(mensaje);
    setPedidoARecibir(null);
    await cargar();
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
                        <span className={`${styles.pill} ${pillEstadoPedido(String(p.estado_pedido))}`}>
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

      <PedidoFormModal
        open={modalOpen}
        editando={editando}
        productos={productos}
        proveedores={proveedores}
        usuarios={usuarios}
        onClose={cerrarModalForm}
        onGuardado={handlePedidoGuardado}
        onError={(mensaje) => showToast(mensaje, 'error')}
      />

      <PedidoDetalleModal
        detalle={detalle}
        onClose={() => setDetalle(null)}
        onRecibir={recibir}
      />

      <PedidoRecepcionModal
        pedido={pedidoARecibir}
        usuarios={usuarios}
        onClose={() => setPedidoARecibir(null)}
        onRecibido={handlePedidoRecibido}
        onError={(mensaje) => showToast(mensaje, 'error')}
      />
    </main>
  );
};

export default PedidosProveedor;
