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
  RefreshCw,
  ScanBarcode,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { AjusteStockModal } from '../../components/AjusteStockModal/AjusteStockModal';
import { LectorCodigoBarrasModal } from '../../components/LectorCodigoBarrasModal/LectorCodigoBarrasModal';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../services/api';
import { productosService, Producto, ProductoPayload } from '../../services/productos.service';
import { proveedoresService, Marca, LineaProducto } from '../../services/proveedores.service';
import { formatearMoneda } from '../../utils/formato';
import { aNumero } from '../../utils/consulta';
import { bloquearTeclasNoNumericas, sanitizarEntero } from '../../utils/validacion';

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

interface ErroresForm {
  nombre_producto?: string;
  codigo_barras?: string;
  precio?: string;
  stock_actual?: string;
  stock_minimo?: string;
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [productoAjuste, setProductoAjuste] = useState<Producto | null>(null);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const hayErrores = Object.values(errores).some(Boolean);

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
    setErrores({});
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
    setErrores({});
    setModalOpen(true);
  };

  const actualizarNumerico = (
    campo: 'stock_actual' | 'stock_minimo',
    valor: string,
  ) => {
    const permitirCero = campo === 'stock_minimo' || !form.id_producto;
    const resultado = sanitizarEntero(valor, permitirCero);
    setForm((prev) => ({ ...prev, [campo]: resultado.valor }));
    setErrores((prev) => ({ ...prev, [campo]: resultado.error }));
  };

  const validarFormulario = (): boolean => {
    const nuevos: ErroresForm = {};

    if (!form.nombre_producto.trim()) {
      nuevos.nombre_producto = 'El nombre del producto es obligatorio.';
    }

    if (!form.id_producto && !form.codigo_barras.trim()) {
      nuevos.codigo_barras = 'El código de barras es obligatorio para registrar un producto.';
    } else if (form.codigo_barras.trim().length > 100) {
      nuevos.codigo_barras = 'El código de barras no puede exceder 100 caracteres.';
    }

    const precioNum = Number(form.precio);
    if (form.precio === '' || Number.isNaN(precioNum) || precioNum < 0) {
      nuevos.precio = 'El precio debe ser un número mayor o igual a 0.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(form.precio.trim())) {
      nuevos.precio = 'El precio admite máximo 2 decimales.';
    }

    if (!form.id_producto) {
      const stockActual = sanitizarEntero(form.stock_actual, true);
      if (!stockActual.valido) nuevos.stock_actual = stockActual.error;
    }

    const stockMinimo = sanitizarEntero(form.stock_minimo, true);
    if (!stockMinimo.valido) nuevos.stock_minimo = stockMinimo.error;

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const construirPayload = (): ProductoPayload => {
    const payload: ProductoPayload = {
      nombre_producto: form.nombre_producto.trim(),
      precio: Number(Number(form.precio).toFixed(2)),
      stock_minimo: Number(form.stock_minimo),
      estado: form.estado,
    };

    if (!form.id_producto) {
      payload.stock_actual = Number(form.stock_actual);
    }

    if (form.codigo_barras.trim()) {
      payload.codigo_barras = form.codigo_barras.trim();
    }

    const idMarca = aNumero(form.id_marca);
    if (idMarca !== undefined) payload.id_marca = idMarca;

    const idLinea = aNumero(form.id_linea);
    if (idLinea !== undefined) payload.id_linea = idLinea;

    return payload;
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      const payload = construirPayload();
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
      const mensaje =
        error instanceof Error ? error.message : 'Error al guardar el producto.';
      if (error instanceof ApiError && error.status === 409) {
        if (mensaje.includes('código de barras')) {
          setErrores((prev) => ({ ...prev, codigo_barras: mensaje }));
        } else {
          setErrores((prev) => ({ ...prev, nombre_producto: mensaje }));
        }
      }
      showToast(mensaje, 'error');
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

  const alGuardarStock = (actualizado: Producto) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id_producto === actualizado.id_producto ? { ...p, ...actualizado } : p,
      ),
    );
    setProductoAjuste(null);
    showToast('Stock actualizado correctamente.');
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
    (p) => p.estado && Number(p.stock_actual) <= Number(p.stock_minimo),
  ).length;
  const valorStock = productos.reduce(
    (acc, p) => acc + Number(p.precio) * Number(p.stock_actual),
    0,
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
                            className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                            title="Actualizar stock"
                            onClick={() => setProductoAjuste(p)}
                          >
                            <RefreshCw size={15} />
                          </button>
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
            <button
              type="submit"
              form="form-producto"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving || hayErrores}
            >
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
              className={`${styles.input} ${errores.nombre_producto ? styles.inputError : ''}`}
              type="text"
              value={form.nombre_producto}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, nombre_producto: e.target.value }));
                if (errores.nombre_producto) {
                  setErrores((prev) => ({ ...prev, nombre_producto: undefined }));
                }
              }}
              placeholder="Ej: Cuaderno Espiral 100 hojas"
            />
            {errores.nombre_producto && (
              <span className={styles.fieldError}>{errores.nombre_producto}</span>
            )}
          </div>

          <div className={styles.field}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className={styles.fieldLabel} htmlFor="prod-codigo" style={{ marginBottom: 0 }}>
                Código de barras {!form.id_producto && <span className={styles.requiredMark}>*</span>}
              </label>
              {!form.id_producto && (
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-primary, #fd3706)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <ScanBarcode size={14} /> Escanear con cámara
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="prod-codigo"
                className={`${styles.input} ${errores.codigo_barras ? styles.inputError : ''}`}
                type="text"
                value={form.codigo_barras}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, codigo_barras: e.target.value }));
                  if (errores.codigo_barras) {
                    setErrores((prev) => ({ ...prev, codigo_barras: undefined }));
                  }
                }}
                placeholder={!form.id_producto ? 'Ej: 7770001000012 o escanee el código' : 'Opcional'}
              />
              {!form.id_producto && (
                <button
                  type="button"
                  title="Escanear con cámara (ZXing)"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => setScannerOpen(true)}
                  style={{ flexShrink: 0, padding: '0 12px' }}
                >
                  <ScanBarcode size={18} />
                </button>
              )}
            </div>
            {errores.codigo_barras && (
              <span className={styles.fieldError}>{errores.codigo_barras}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-precio">
              Precio de venta (Bs) <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="prod-precio"
              className={`${styles.input} ${errores.precio ? styles.inputError : ''}`}
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, precio: e.target.value }));
                if (errores.precio) {
                  setErrores((prev) => ({ ...prev, precio: undefined }));
                }
              }}
              placeholder="0.00"
            />
            {errores.precio && (
              <span className={styles.fieldError}>{errores.precio}</span>
            )}
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
              className={`${styles.input} ${errores.stock_actual ? styles.inputError : ''}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.stock_actual}
              placeholder="Mín. 0"
              readOnly={Boolean(form.id_producto)}
              onKeyDown={bloquearTeclasNoNumericas}
              onChange={(e) => actualizarNumerico('stock_actual', e.target.value)}
              aria-invalid={Boolean(errores.stock_actual)}
            />
            {errores.stock_actual && (
              <span className={styles.fieldError}>{errores.stock_actual}</span>
            )}
            {form.id_producto && (
              <span className={styles.hint}>Usa «Actualizar stock» para modificar la cantidad.</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="prod-minimo">
              Stock mínimo
            </label>
            <input
              id="prod-minimo"
              className={`${styles.input} ${errores.stock_minimo ? styles.inputError : ''}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.stock_minimo}
              placeholder="0"
              onKeyDown={bloquearTeclasNoNumericas}
              onChange={(e) => actualizarNumerico('stock_minimo', e.target.value)}
              aria-invalid={Boolean(errores.stock_minimo)}
            />
            {errores.stock_minimo && (
              <span className={styles.fieldError}>{errores.stock_minimo}</span>
            )}
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

      <AjusteStockModal
        producto={productoAjuste}
        onClose={() => setProductoAjuste(null)}
        onGuardado={alGuardarStock}
      />

      <LectorCodigoBarrasModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(codigo) => {
          setForm((prev) => ({ ...prev, codigo_barras: codigo }));
          setErrores((prev) => ({ ...prev, codigo_barras: undefined }));
          showToast(`Código de barras escaneado: ${codigo}`);
        }}
      />
    </main>
  );
};

export default Productos;
