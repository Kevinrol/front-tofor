import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  Eye,
  Truck,
  DollarSign,
  PackageCheck,
  X,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  comprasService,
  CompraProveedor,
  CompraPayload,
} from '../../services/compras-proveedores.service';
import { productosService, Producto } from '../../services/productos.service';
import { proveedoresService, Proveedor } from '../../services/proveedores.service';
import { usuariosService, Usuario } from '../../services/usuarios.service';
import { pedidosService, PedidoProveedor } from '../../services/pedidos-proveedor.service';
import { SelectorComprobante } from '../../components/SelectorComprobante/SelectorComprobante';
import { formatearMoneda, formatearFechaHora, aDatetimeLocal } from '../../utils/formato';
import { aNumero } from '../../utils/consulta';

interface LineaForm {
  id_producto: string;
  cantidad_recibida: string;
  precio_costo_unitario: string;
}

interface FormState {
  id_proveedor: string;
  id_usuario: string;
  fecha_recepcion: string;
  comprobante_url: string;
  detalles: LineaForm[];
}

const LINEA_VACIA: LineaForm = { id_producto: '', cantidad_recibida: '1', precio_costo_unitario: '' };

const FORM_VACIO: FormState = {
  id_proveedor: '',
  id_usuario: '',
  fecha_recepcion: aDatetimeLocal(new Date()),
  comprobante_url: '',
  detalles: [{ ...LINEA_VACIA }],
};

type FiltroEstado = 'all' | 'Completada' | 'Anulada';

const POR_PAGINA_INICIAL = 5;

export const ComprasProveedor: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [compras, setCompras] = useState<CompraProveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<CompraProveedor | null>(null);
  const [detalle, setDetalle] = useState<CompraProveedor | null>(null);
  const [pedidoAsociado, setPedidoAsociado] = useState<PedidoProveedor | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const [comprasData, productosData, proveedoresData, usuariosData] = await Promise.all([
        comprasService.getAll(),
        productosService.getAll(false),
        proveedoresService.getProveedores(),
        usuariosService.getAll(),
      ]);
      setCompras(comprasData || []);
      setProductos(productosData || []);
      setProveedores(proveedoresData || []);
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar las compras.', 'error');
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
    () =>
      form.detalles.reduce(
        (acc, linea) =>
          acc + (Number(linea.cantidad_recibida) || 0) * (Number(linea.precio_costo_unitario) || 0),
        0
      ),
    [form.detalles]
  );

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

  const abrirEditar = (compra: CompraProveedor) => {
    setEditando(compra);
    setForm({
      id_proveedor: String(compra.id_proveedor),
      id_usuario: String(compra.id_usuario),
      fecha_recepcion: aDatetimeLocal(compra.fecha_recepcion),
      comprobante_url: compra.comprobante_url || '',
      detalles: [{ ...LINEA_VACIA }],
    });
    setModalOpen(true);
  };

  const verDetalle = async (compra: CompraProveedor) => {
    if (compra.id_compra == null) return;
    try {
      setDetalle(await comprasService.getOne(compra.id_compra));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el detalle.', 'error');
    }
  };

  const verPedidoAsociado = async (idPedido: number) => {
    try {
      const p = await pedidosService.getOne(idPedido);
      setPedidoAsociado(p);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cargar el pedido asociado.', 'error');
    }
  };

  const actualizarLinea = (index: number, cambios: Partial<LineaForm>) =>
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)),
    }));

  const agregarLinea = () =>
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...LINEA_VACIA }] }));

  const quitarLinea = (index: number) =>
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editando?.id_compra != null) {
        await comprasService.update(editando.id_compra, {
          fecha_recepcion: new Date(form.fecha_recepcion).toISOString(),
          comprobante_url: form.comprobante_url || null,
        });
        showToast('Compra actualizada correctamente.');
      } else {
        const idProveedor = aNumero(form.id_proveedor);
        const idUsuario = aNumero(form.id_usuario);
        if (idProveedor === undefined || idUsuario === undefined) {
          showToast('Selecciona el proveedor y el usuario responsable.', 'error');
          setSaving(false);
          return;
        }

        const detalles = form.detalles
          .map((linea) => ({
            id_producto: aNumero(linea.id_producto),
            cantidad_recibida: aNumero(linea.cantidad_recibida),
            precio_costo_unitario: aNumero(linea.precio_costo_unitario),
          }))
          .filter(
            (d): d is { id_producto: number; cantidad_recibida: number; precio_costo_unitario: number } =>
              d.id_producto !== undefined &&
              d.cantidad_recibida !== undefined &&
              d.cantidad_recibida > 0 &&
              d.precio_costo_unitario !== undefined
          );

        if (detalles.length === 0) {
          showToast('Agrega al menos un producto con cantidad y costo válidos.', 'error');
          setSaving(false);
          return;
        }

        const payload: CompraPayload = {
          id_proveedor: idProveedor,
          id_usuario: idUsuario,
          fecha_recepcion: new Date(form.fecha_recepcion).toISOString(),
          comprobante_url: form.comprobante_url || null,
          detalles,
        };
        await comprasService.create(payload);
        showToast('Compra registrada y stock incrementado.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar la compra.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const anular = async (compra: CompraProveedor) => {
    if (compra.id_compra == null) return;
    if (!window.confirm(`¿Anular la compra #${compra.id_compra}? El stock será revertido.`)) return;
    try {
      await comprasService.remove(compra.id_compra);
      showToast('Compra anulada y stock revertido.');
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al anular.', 'error');
    }
  };

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return compras.filter((c) => {
      const coincide =
        !q ||
        (c.razon_social_proveedor ?? '').toLowerCase().includes(q) ||
        (c.nombre_usuario ?? '').toLowerCase().includes(q) ||
        String(c.id_compra ?? '').includes(q);
      const porEstado = filtro === 'all' ? true : c.estado === filtro;
      return coincide && porEstado;
    });
  }, [compras, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalInvertido = compras
    .filter((c) => c.estado !== 'Anulada')
    .reduce((acc, c) => acc + Number(c.total_pagado), 0);
  const totalCompletadas = compras.filter((c) => c.estado === 'Completada').length;

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Compras a Proveedor</h1>
            <span className={styles.badge}>
              <ShoppingCart size={14} /> Entradas de mercadería
            </span>
          </div>
          <p className={styles.subtitle}>
            Registro de compras y recepción de mercadería con incremento automático de stock e
            historial de inversión por distribuidor.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirCrear}>
            <Plus size={16} /> Nueva Compra
          </button>
        </div>
      </div>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <ShoppingCart size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Compras Totales</span>
            <span className={styles.kpiValue}>{compras.length}</span>
            <span className={styles.kpiSubtext}>{totalCompletadas} completadas</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <DollarSign size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Inversión Total</span>
            <span className={styles.kpiValue}>{formatearMoneda(totalInvertido)}</span>
            <span className={styles.kpiSubtext}>Excluye compras anuladas</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Truck size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Proveedores</span>
            <span className={styles.kpiValue}>{proveedores.length}</span>
            <span className={styles.kpiSubtext}>Distribuidores registrados</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <PackageCheck size={17} /> Historial de Compras
            <span className={styles.countBadge}>{filtradas.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por proveedor, responsable o N° de compra..."
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
              Todas
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'Completada' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('Completada')}
            >
              Completadas
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'Anulada' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('Anulada')}
            >
              Anuladas
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando compras...
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingCart size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin compras</span>
            <span className={styles.emptyText}>Registra la recepción de mercadería.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Responsable</th>
                  <th className={styles.right}>Total</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => (
                  <tr key={c.id_compra}>
                    <td className={styles.strong}>#{c.id_compra}</td>
                    <td className={styles.muted}>{formatearFechaHora(c.fecha_recepcion)}</td>
                    <td>{c.razon_social_proveedor || '—'}</td>
                    <td className={styles.muted}>{c.nombre_usuario || '—'}</td>
                    <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(c.total_pagado)}</td>
                    <td className={styles.center}>
                      <span
                        className={`${styles.pill} ${c.estado === 'Anulada' ? styles.pillDanger : styles.pillSuccess}`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={styles.iconBtn} title="Ver detalle" onClick={() => verDetalle(c)}>
                          <Eye size={15} />
                        </button>
                        {c.id_pedido ? (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title={`Ver Pedido Asociado (#${c.id_pedido})`}
                            onClick={() => verPedidoAsociado(c.id_pedido!)}
                            style={{ color: '#2563eb' }}
                          >
                            <ClipboardList size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Compra directa (sin pedido asociado)"
                            disabled
                            style={{ opacity: 0.3, cursor: 'not-allowed' }}
                          >
                            <ClipboardList size={15} />
                          </button>
                        )}
                        <button type="button" className={styles.iconBtn} title="Editar fecha y comprobante" onClick={() => abrirEditar(c)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Anular"
                          onClick={() => anular(c)}
                          disabled={c.estado === 'Anulada'}
                        >
                          <Trash2 size={15} />
                        </button>
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
            etiqueta="compras"
          />
        )}
      </section>

      <Modal
        open={modalOpen}
        title={editando ? `Editar Compra #${editando.id_compra}` : 'Nueva Compra a Proveedor'}
        onClose={() => setModalOpen(false)}
        width={editando ? 480 : 780}
        footer={
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-compra" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        {editando ? (
          <form id="form-compra" onSubmit={guardar} className={styles.formGrid} noValidate>
            <div className={`${styles.field} ${styles.formGridFull}`}>
              <label className={styles.fieldLabel} htmlFor="compra-fecha-edit">
                Fecha de recepción
              </label>
              <input
                id="compra-fecha-edit"
                className={styles.input}
                type="datetime-local"
                value={form.fecha_recepcion}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_recepcion: e.target.value }))}
              />
            </div>

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <SelectorComprobante
                urlActual={form.comprobante_url}
                onArchivoSubido={(url) => setForm((prev) => ({ ...prev, comprobante_url: url }))}
                onEliminar={() => setForm((prev) => ({ ...prev, comprobante_url: '' }))}
                carpeta="compras"
                etiqueta="Comprobante / Factura de compra"
              />
            </div>
          </form>
        ) : (
          <form id="form-compra" onSubmit={guardar} className={styles.formGrid} noValidate>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="compra-proveedor">
                Proveedor <span className={styles.requiredMark}>*</span>
              </label>
              <select
                id="compra-proveedor"
                className={styles.select}
                value={form.id_proveedor}
                onChange={(e) => setForm((prev) => ({ ...prev, id_proveedor: e.target.value }))}
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
              <label className={styles.fieldLabel} htmlFor="compra-usuario">
                Registrado por <span className={styles.requiredMark}>*</span>
              </label>
              <select
                id="compra-usuario"
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

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <label className={styles.fieldLabel} htmlFor="compra-fecha">
                Fecha de recepción
              </label>
              <input
                id="compra-fecha"
                className={styles.input}
                type="datetime-local"
                value={form.fecha_recepcion}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_recepcion: e.target.value }))}
              />
            </div>

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <SelectorComprobante
                urlActual={form.comprobante_url}
                onArchivoSubido={(url) => setForm((prev) => ({ ...prev, comprobante_url: url }))}
                onEliminar={() => setForm((prev) => ({ ...prev, comprobante_url: '' }))}
                carpeta="compras"
                etiqueta="Comprobante / Factura de compra (PDF o imagen)"
              />
            </div>

            <div className={`${styles.field} ${styles.formGridFull}`}>
              <div className={styles.linesHeader}>
                <span className={styles.linesTitle}>
                  <PackageCheck size={15} /> Productos recibidos
                </span>
                <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={agregarLinea}>
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div className={`${styles.lineRow} ${styles.lineRowHead}`}>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Costo unit.</span>
                <span>Subtotal</span>
                <span />
              </div>

              {form.detalles.map((linea, index) => {
                const subtotal =
                  (Number(linea.cantidad_recibida) || 0) * (Number(linea.precio_costo_unitario) || 0);
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
                          {p.nombre_producto}
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      value={linea.cantidad_recibida}
                      onChange={(e) => actualizarLinea(index, { cantidad_recibida: e.target.value })}
                    />
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={linea.precio_costo_unitario}
                      onChange={(e) => actualizarLinea(index, { precio_costo_unitario: e.target.value })}
                    />
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
                <span className={styles.lineTotalLabel}>Total estimado</span>
                {formatearMoneda(totalEstimado)}
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={detalle !== null}
        title={`Detalle de Compra #${detalle?.id_compra ?? ''}`}
        onClose={() => setDetalle(null)}
        width={680}
      >
        {detalle && (
          <>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Fecha</span>
                <span className={styles.detailItemValue}>{formatearFechaHora(detalle.fecha_recepcion)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Proveedor</span>
                <span className={styles.detailItemValue}>{detalle.razon_social_proveedor || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Responsable</span>
                <span className={styles.detailItemValue}>{detalle.nombre_usuario || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Estado</span>
                <span className={styles.detailItemValue}>{detalle.estado}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Pedido asociado</span>
                <span className={styles.detailItemValue}>
                  {detalle.id_pedido ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      style={{ padding: '2px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}
                      onClick={() => verPedidoAsociado(detalle.id_pedido!)}
                    >
                      <ClipboardList size={13} /> Ver Pedido #{detalle.id_pedido}
                    </button>
                  ) : (
                    <span className={styles.muted}>Compra directa</span>
                  )}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Comprobante adjunto</span>
                <span className={styles.detailItemValue}>
                  {detalle.comprobante_url ? (
                    <a
                      href={detalle.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      style={{ padding: '2px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}
                    >
                      <ExternalLink size={13} /> Abrir comprobante
                    </a>
                  ) : (
                    <span className={styles.muted}>Sin archivo adjunto</span>
                  )}
                </span>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.center}>Cantidad</th>
                    <th className={styles.right}>Costo unit.</th>
                    <th className={styles.right}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.detalles ?? []).map((d, i) => (
                    <tr key={d.id_detalle_compra ?? i}>
                      <td className={styles.strong}>{d.nombre_producto || `Producto #${d.id_producto}`}</td>
                      <td className={styles.center}>{d.cantidad_recibida}</td>
                      <td className={`${styles.right} ${styles.money}`}>
                        {formatearMoneda(d.precio_costo_unitario)}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total pagado</span>
              {formatearMoneda(detalle.total_pagado)}
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={pedidoAsociado !== null}
        title={`Pedido de Abastecimiento Asociado #${pedidoAsociado?.id_pedido ?? ''}`}
        onClose={() => setPedidoAsociado(null)}
        width={720}
      >
        {pedidoAsociado && (
          <>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Fecha del Pedido</span>
                <span className={styles.detailItemValue}>{formatearFechaHora(pedidoAsociado.fecha_pedido)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Proveedor</span>
                <span className={styles.detailItemValue}>{pedidoAsociado.razon_social_proveedor || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Solicitado por</span>
                <span className={styles.detailItemValue}>{pedidoAsociado.nombre_usuario || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Estado del Pedido</span>
                <span className={styles.detailItemValue}>
                  <span
                    className={`${styles.pill} ${
                      pedidoAsociado.estado_pedido === 'Recibido'
                        ? styles.pillSuccess
                        : pedidoAsociado.estado_pedido === 'Parcial'
                        ? styles.pillWarning
                        : styles.pillInfo
                    }`}
                  >
                    {pedidoAsociado.estado_pedido}
                  </span>
                </span>
              </div>
              {pedidoAsociado.fecha_entrega_estimada && (
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Entrega pactada</span>
                  <span className={styles.detailItemValue}>{pedidoAsociado.fecha_entrega_estimada}</span>
                </div>
              )}
              {pedidoAsociado.comprobante_url && (
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Comprobante / Cotización</span>
                  <span className={styles.detailItemValue}>
                    <a
                      href={pedidoAsociado.comprobante_url}
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
                    <th>Unidad</th>
                    <th className={styles.right}>Costo Unit.</th>
                    <th className={styles.right}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(pedidoAsociado.detalles ?? []).map((d, i) => (
                    <tr key={d.id_detalle_pedido ?? i}>
                      <td className={styles.strong}>{d.nombre_producto || `Producto #${d.id_producto}`}</td>
                      <td className={styles.center}>{d.cantidad_solicitada}</td>
                      <td>{d.unidad_venta}</td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.precio_unitario_compra)}</td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total pedido</span>
              {formatearMoneda(pedidoAsociado.total_pedido)}
            </div>
          </>
        )}
      </Modal>
    </main>
  );
};

export default ComprasProveedor;
