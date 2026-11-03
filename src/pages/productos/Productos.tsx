import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Package,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  AlertTriangle,
  DollarSign,
  Layers,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import { productosService, Producto, ProductoPayload } from '../../services/productos.service';
import { proveedoresService, Marca, LineaProducto } from '../../services/proveedores.service';
import { formatearMoneda } from '../../utils/formato';
import { aNumero } from '../../utils/consulta';

interface FormState {
  id_producto?: number;
  codigo_barras: string;
  nombre_producto: string;
  id_marca: string;
  id_linea: string;
  precio: string;
  stock_actual: string;
  stock_minimo: string;
  estado: boolean;
}

const FORM_VACIO: FormState = {
  codigo_barras: '',
  nombre_producto: '',
  id_marca: '',
  id_linea: '',
  precio: '',
  stock_actual: '0',
  stock_minimo: '5',
  estado: true,
};

type FiltroEstado = 'all' | 'active' | 'inactive' | 'low';

const POR_PAGINA_INICIAL = 5;

export const Productos: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [lineas, setLineas] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const [prods, marcasData, lineasData] = await Promise.all([
        productosService.getAll(true),
        proveedoresService.getMarcas(),
        proveedoresService.getLineasProducto(),
      ]);
      setProductos(prods || []);
      setMarcas(marcasData || []);
      setLineas(lineasData || []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los productos.', 'error');
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
    setForm(FORM_VACIO);
    setModalOpen(true);
  };

  const abrirEditar = (producto: Producto) => {
    setForm({
      id_producto: producto.id_producto,
      codigo_barras: producto.codigo_barras ?? '',
      nombre_producto: producto.nombre_producto,
      id_marca: producto.id_marca != null ? String(producto.id_marca) : '',
      id_linea: producto.id_linea != null ? String(producto.id_linea) : '',
      precio: String(producto.precio ?? ''),
      stock_actual: String(producto.stock_actual ?? 0),
      stock_minimo: String(producto.stock_minimo ?? 0),
      estado: producto.estado,
    });
    setModalOpen(true);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombre_producto.trim()) {
      showToast('El nombre del producto es obligatorio.', 'error');
      return;
    }
    if (form.precio === '' || Number.isNaN(Number(form.precio))) {
      showToast('El precio debe ser un número válido.', 'error');
      return;
    }

    const payload: ProductoPayload = {
      nombre_producto: form.nombre_producto.trim(),
      precio: Number(form.precio),
      stock_actual: aNumero(form.stock_actual) ?? 0,
      stock_minimo: aNumero(form.stock_minimo) ?? 0,
      estado: form.estado,
    };
    if (form.codigo_barras.trim()) payload.codigo_barras = form.codigo_barras.trim();
    const idMarca = aNumero(form.id_marca);
    if (idMarca !== undefined) payload.id_marca = idMarca;
    const idLinea = aNumero(form.id_linea);
    if (idLinea !== undefined) payload.id_linea = idLinea;

    setSaving(true);
    try {
      if (form.id_producto) {
        await productosService.update(form.id_producto, payload);
        showToast('Producto actualizado correctamente.');
      } else {
        await productosService.create(payload);
        showToast('Producto registrado correctamente.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar el producto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (producto: Producto) => {
    if (producto.id_producto == null) return;
    if (!window.confirm(`¿Desactivar el producto "${producto.nombre_producto}"?`)) return;
    try {
      await productosService.remove(producto.id_producto);
      showToast('Producto desactivado.');
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al desactivar.', 'error');
    }
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productos.filter((p) => {
      const coincide =
        !q ||
        p.nombre_producto.toLowerCase().includes(q) ||
        (p.codigo_barras ?? '').toLowerCase().includes(q) ||
        (p.nombre_marca ?? '').toLowerCase().includes(q) ||
        (p.nombre_linea ?? '').toLowerCase().includes(q);

      const bajoStock = Number(p.stock_actual) <= Number(p.stock_minimo);
      const porEstado =
        filtro === 'all'
          ? true
          : filtro === 'active'
            ? p.estado
            : filtro === 'inactive'
              ? !p.estado
              : bajoStock;

      return coincide && porEstado;
    });
  }, [productos, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalActivos = productos.filter((p) => p.estado).length;
  const totalBajoStock = productos.filter(
    (p) => p.estado && Number(p.stock_actual) <= Number(p.stock_minimo)
  ).length;
  const valorStock = productos.reduce(
    (acc, p) => acc + Number(p.precio) * Number(p.stock_actual),
    0
  );

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Almacén &amp; Stock</h1>
            <span className={styles.badge}>
              <Package size={14} /> Catálogo de productos
            </span>
          </div>
          <p className={styles.subtitle}>
            Alta, edición y control del Stock. Administra precios y existencias.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirCrear}>
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <Package size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Productos Totales</span>
            <span className={styles.kpiValue}>{productos.length}</span>
            <span className={styles.kpiSubtext}>{totalActivos} activos</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Bajo Stock</span>
            <span className={styles.kpiValue}>{totalBajoStock}</span>
            <span className={styles.kpiSubtext}>Requieren reposición</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <DollarSign size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Valor del Stock</span>
            <span className={styles.kpiValue}>{formatearMoneda(valorStock)}</span>
            <span className={styles.kpiSubtext}>Precio de venta × stock</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentPurple}`}>
            <Layers size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Marcas / Líneas</span>
            <span className={styles.kpiValue}>
              {marcas.length} / {lineas.length}
            </span>
            <span className={styles.kpiSubtext}>Catálogo registrado</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Boxes size={17} /> Listado de Productos
            <span className={styles.countBadge}>{filtrados.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, marca o línea..."
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
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'active' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('active')}
            >
              Activos
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'inactive' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('inactive')}
            >
              Inactivos
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filtro === 'low' ? styles.filterChipActive : ''}`}
              onClick={() => setFiltro('low')}
            >
              Bajo stock
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando productos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <Package size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin productos</span>
            <span className={styles.emptyText}>Registra tu primer producto o ajusta la búsqueda.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Marca / Línea</th>
                  <th className={styles.right}>Precio</th>
                  <th className={styles.center}>Stock</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const bajoStock = Number(p.stock_actual) <= Number(p.stock_minimo);
                  return (
                    <tr key={p.id_producto}>
                      <td className={styles.muted}>{p.codigo_barras || '—'}</td>
                      <td className={styles.strong}>{p.nombre_producto}</td>
                      <td>
                        {p.nombre_marca || p.nombre_linea ? (
                          <span className={styles.muted}>
                            {[p.nombre_marca, p.nombre_linea].filter(Boolean).join(' · ')}
                          </span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(p.precio)}</td>
                      <td className={styles.center}>
                        <span className={`${styles.pill} ${bajoStock ? styles.pillWarning : styles.pillSuccess}`}>
                          {p.stock_actual} u.
                        </span>
                      </td>
                      <td className={styles.center}>
                        <span className={`${styles.pill} ${p.estado ? styles.pillSuccess : styles.pillNeutral}`}>
                          <span className={styles.pillDot} />
                          {p.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Editar"
                            onClick={() => abrirEditar(p)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Desactivar"
                            onClick={() => eliminar(p)}
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
            etiqueta="productos"
          />
        )}
      </section>

      <Modal
        open={modalOpen}
        title={form.id_producto ? 'Editar Producto' : 'Nuevo Producto'}
        onClose={() => setModalOpen(false)}
        width={620}
        footer={
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-producto" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="form-producto" onSubmit={guardar} className={styles.formGrid} noValidate>
          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label className={styles.fieldLabel} htmlFor="prod-nombre">
              Nombre del producto <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="prod-nombre"
              className={styles.input}
              type="text"
              value={form.nombre_producto}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre_producto: e.target.value }))}
              placeholder="Ej: Cuaderno Espiral 100 hojas"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-codigo">
              Código de barras
            </label>
            <input
              id="prod-codigo"
              className={styles.input}
              type="text"
              value={form.codigo_barras}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo_barras: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-precio">
              Precio de venta (Bs) <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="prod-precio"
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-marca">
              Marca
            </label>
            <select
              id="prod-marca"
              className={styles.select}
              value={form.id_marca}
              onChange={(e) => setForm((prev) => ({ ...prev, id_marca: e.target.value }))}
            >
              <option value="">Sin marca</option>
              {marcas.map((m) => (
                <option key={m.id_marca} value={m.id_marca}>
                  {m.nombre_marca}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-linea">
              Línea / categoría
            </label>
            <select
              id="prod-linea"
              className={styles.select}
              value={form.id_linea}
              onChange={(e) => setForm((prev) => ({ ...prev, id_linea: e.target.value }))}
            >
              <option value="">Sin línea</option>
              {lineas.map((l) => (
                <option key={l.id_linea} value={l.id_linea}>
                  {l.nombre_linea}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-stock">
              Stock actual
            </label>
            <input
              id="prod-stock"
              className={styles.input}
              type="number"
              min="0"
              value={form.stock_actual}
              onChange={(e) => setForm((prev) => ({ ...prev, stock_actual: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-minimo">
              Stock mínimo
            </label>
            <input
              id="prod-minimo"
              className={styles.input}
              type="number"
              min="0"
              value={form.stock_minimo}
              onChange={(e) => setForm((prev) => ({ ...prev, stock_minimo: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-estado">
              Estado
            </label>
            <select
              id="prod-estado"
              className={styles.select}
              value={form.estado ? 'true' : 'false'}
              onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </main>
  );
};

export default Productos;
