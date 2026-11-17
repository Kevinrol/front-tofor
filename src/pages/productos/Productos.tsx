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
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
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

interface UnidadFormItem {
  nombre_unidad: string;
  cantidad_unidades: string;
}

interface FormState {
  id_producto?: number;
  codigo_barras: string;
  nombre_producto: string;
  id_marca: string;
  id_linea: string;
  precio: string;
  precio_compra: string;
  stock_actual: string;
  stock_minimo: string;
  estado: boolean;
  unidades_opcionales: UnidadFormItem[];
}

interface ErroresForm {
  nombre_producto?: string;
  codigo_barras?: string;
  precio?: string;
  precio_compra?: string;
  stock_actual?: string;
  stock_minimo?: string;
}

const FORM_VACIO: FormState = {
  codigo_barras: '',
  nombre_producto: '',
  id_marca: '',
  id_linea: '',
  precio: '',
  precio_compra: '',
  stock_actual: '0',
  stock_minimo: '5',
  estado: true,
  unidades_opcionales: [],
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
  const [mostrarUnidades, setMostrarUnidades] = useState(true);
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
    setMostrarUnidades(true);
    setModalOpen(true);
  };

  const abrirEditar = (producto: Producto) => {
    const opcionales: UnidadFormItem[] = (producto.unidades || [])
      .filter((u) => {
        const n = u.nombre_unidad.trim().toLowerCase();
        return n !== 'unidad' && n !== 'media docena' && n !== 'docena';
      })
      .map((u) => ({
        nombre_unidad: u.nombre_unidad,
        cantidad_unidades: String(u.cantidad_unidades),
      }));

    setForm({
      id_producto: producto.id_producto,
      codigo_barras: producto.codigo_barras ?? '',
      nombre_producto: producto.nombre_producto,
      id_marca: producto.id_marca != null ? String(producto.id_marca) : '',
      id_linea: producto.id_linea != null ? String(producto.id_linea) : '',
      precio: String(producto.precio ?? ''),
      precio_compra: producto.precio_compra != null ? String(producto.precio_compra) : '0',
      stock_actual: String(producto.stock_actual ?? 0),
      stock_minimo: String(producto.stock_minimo ?? 0),
      estado: producto.estado,
      unidades_opcionales: opcionales,
    });
    setErrores({});
    setMostrarUnidades(true);
    setModalOpen(true);
  };

  const agregarUnidadOpcional = (nombre = '', cantidad = '24') => {
    setForm((prev) => ({
      ...prev,
      unidades_opcionales: [
        ...prev.unidades_opcionales,
        { nombre_unidad: nombre, cantidad_unidades: cantidad },
      ],
    }));
  };

  const cambiarTipoUnidadFila = (index: number, tipo: string) => {
    if (tipo === 'Caja') {
      actualizarUnidadOpcional(index, { nombre_unidad: 'Caja', cantidad_unidades: '24' });
    } else if (tipo === 'Caja Madre') {
      actualizarUnidadOpcional(index, { nombre_unidad: 'Caja Madre', cantidad_unidades: '144' });
    } else if (tipo === 'Paquete') {
      actualizarUnidadOpcional(index, { nombre_unidad: 'Paquete', cantidad_unidades: '10' });
    }
  };

  const detectarTipoUnidad = (nombre: string): string => {
    const n = nombre.trim().toLowerCase();
    if (n === 'caja') return 'Caja';
    if (n === 'caja madre') return 'Caja Madre';
    if (n === 'paquete') return 'Paquete';
    return 'personalizado';
  };

  const actualizarUnidadOpcional = (
    index: number,
    cambios: Partial<UnidadFormItem>,
  ) => {
    setForm((prev) => ({
      ...prev,
      unidades_opcionales: prev.unidades_opcionales.map((item, i) =>
        i === index ? { ...item, ...cambios } : item,
      ),
    }));
  };

  const quitarUnidadOpcional = (index: number) => {
    setForm((prev) => ({
      ...prev,
      unidades_opcionales: prev.unidades_opcionales.filter((_, i) => i !== index),
    }));
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

  const validarCodigoBarrasEnTiempoReal = (
    codigo: string,
    idActual?: number,
  ): string | undefined => {
    const limpio = codigo.trim();
    if (!limpio) {
      return undefined;
    }
    if (limpio.length > 100) {
      return 'El código de barras no puede exceder 100 caracteres.';
    }
    if (/\s/.test(limpio)) {
      return 'El código de barras no debe contener espacios.';
    }
    const repetido = productos.find(
      (p) =>
        p.codigo_barras &&
        p.codigo_barras.trim().toLowerCase() === limpio.toLowerCase() &&
        p.id_producto !== idActual,
    );
    if (repetido) {
      return `Código ya registrado en "${repetido.nombre_producto}" (${repetido.estado ? 'Activo' : 'Inactivo'}).`;
    }
    return undefined;
  };

  const validarPreciosEnTiempoReal = (
    precioVentaStr: string,
    precioCompraStr: string,
  ): { precio?: string; precio_compra?: string } => {
    const errs: { precio?: string; precio_compra?: string } = {};
    const ventaLimpia = precioVentaStr.trim();
    const compraLimpia = precioCompraStr.trim();

    // 1. Validar precio de venta (si se escribió un valor)
    if (ventaLimpia) {
      const pVenta = Number(ventaLimpia);
      if (Number.isNaN(pVenta) || pVenta <= 0) {
        errs.precio = 'El precio de venta debe ser un número mayor a 0.';
      } else if (!/^\d+(\.\d{1,2})?$/.test(ventaLimpia)) {
        errs.precio = 'El precio de venta admite máximo 2 decimales.';
      }
    }

    // 2. Validar precio de compra (si se escribió un valor)
    if (compraLimpia) {
      const pCompra = Number(compraLimpia);
      if (Number.isNaN(pCompra) || pCompra <= 0) {
        errs.precio_compra = 'El precio de compra debe ser un número mayor a 0.';
      } else if (!/^\d+(\.\d{1,2})?$/.test(compraLimpia)) {
        errs.precio_compra = 'El precio de compra admite máximo 2 decimales.';
      }
    }

    // 3. Relación de costo vs venta (si ambos tienen valores)
    if (ventaLimpia && compraLimpia && !errs.precio && !errs.precio_compra) {
      const pV = Number(ventaLimpia);
      const pC = Number(compraLimpia);
      if (pC >= pV) {
        errs.precio_compra = `El precio de compra (Bs ${pC.toFixed(2)}) debe ser menor al precio de venta (Bs ${pV.toFixed(2)}).`;
      }
    }

    return errs;
  };

  const actualizarCodigoBarras = (valor: string) => {
    setForm((prev) => ({ ...prev, codigo_barras: valor }));
    const error = validarCodigoBarrasEnTiempoReal(valor, form.id_producto);
    setErrores((prev) => ({ ...prev, codigo_barras: error }));
  };

  const actualizarPrecioVenta = (valor: string) => {
    setForm((prev) => ({ ...prev, precio: valor }));
    const errs = validarPreciosEnTiempoReal(valor, form.precio_compra);
    setErrores((prev) => ({
      ...prev,
      precio: errs.precio,
      precio_compra: errs.precio_compra,
    }));
  };

  const actualizarPrecioCompra = (valor: string) => {
    setForm((prev) => ({ ...prev, precio_compra: valor }));
    const errs = validarPreciosEnTiempoReal(form.precio, valor);
    setErrores((prev) => ({
      ...prev,
      precio: errs.precio,
      precio_compra: errs.precio_compra,
    }));
  };

  const resumenMargen = useMemo(() => {
    const pV = Number(form.precio.trim());
    const pC = Number(form.precio_compra.trim());
    if (
      !Number.isNaN(pV) &&
      !Number.isNaN(pC) &&
      pV > 0 &&
      pC > 0 &&
      pV > pC &&
      !errores.precio &&
      !errores.precio_compra
    ) {
      const ganancia = pV - pC;
      const porcentaje = (ganancia / pC) * 100;
      return { ganancia, porcentaje };
    }
    return null;
  }, [form.precio, form.precio_compra, errores.precio, errores.precio_compra]);

  const validarFormulario = (): boolean => {
    const nuevos: ErroresForm = {};

    if (!form.nombre_producto.trim()) {
      nuevos.nombre_producto = 'El nombre del producto es obligatorio.';
    }

    if (!form.id_producto && !form.codigo_barras.trim()) {
      nuevos.codigo_barras = 'El código de barras es obligatorio para registrar un producto.';
    } else {
      const errCodigo = validarCodigoBarrasEnTiempoReal(form.codigo_barras, form.id_producto);
      if (errCodigo) nuevos.codigo_barras = errCodigo;
    }

    if (!form.precio.trim()) {
      nuevos.precio = 'El precio de venta es obligatorio.';
    }
    if (!form.precio_compra.trim()) {
      nuevos.precio_compra = 'El precio de compra es obligatorio.';
    }

    const errPrecios = validarPreciosEnTiempoReal(form.precio, form.precio_compra);
    if (errPrecios.precio) nuevos.precio = errPrecios.precio;
    if (errPrecios.precio_compra) nuevos.precio_compra = errPrecios.precio_compra;

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
      precio_compra: Number(Number(form.precio_compra).toFixed(2)),
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

    payload.unidades = form.unidades_opcionales
      .filter((u) => u.nombre_unidad.trim() !== '' && Number(u.cantidad_unidades) >= 1)
      .map((u) => ({
        nombre_unidad: u.nombre_unidad.trim(),
        cantidad_unidades: Math.floor(Number(u.cantidad_unidades)),
      }));

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
                      <td className={`${styles.right} ${styles.money}`}>
                        <div>{formatearMoneda(p.precio)}</div>
                        {Number(p.precio_compra) > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            Costo: {formatearMoneda(p.precio_compra)}
                          </div>
                        )}
                      </td>
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
        width={mostrarUnidades ? 1040 : 560}
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
        <form
          id="form-producto"
          onSubmit={guardar}
          noValidate
          style={{
            display: 'grid',
            gridTemplateColumns: mostrarUnidades ? 'minmax(360px, 1fr) minmax(440px, 1.15fr)' : '1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Panel Izquierdo: Datos principales del producto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className={styles.field}>
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
                  onChange={(e) => actualizarCodigoBarras(e.target.value)}
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
              {errores.codigo_barras ? (
                <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertCircle size={13} /> {errores.codigo_barras}
                </span>
              ) : form.codigo_barras.trim() ? (
                <span style={{ fontSize: '12px', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 500 }}>
                  <CheckCircle2 size={13} /> Código disponible y válido
                </span>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prod-precio">
                  Precio de venta (Bs) <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="prod-precio"
                  className={`${styles.input} ${errores.precio ? styles.inputError : ''}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => actualizarPrecioVenta(e.target.value)}
                  placeholder="0.00"
                />
                {errores.precio && (
                  <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <AlertCircle size={13} /> {errores.precio}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prod-precio-compra">
                  Precio de compra (Bs) <span className={styles.requiredMark}>*</span>
                </label>
                <input
                  id="prod-precio-compra"
                  className={`${styles.input} ${errores.precio_compra ? styles.inputError : ''}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.precio_compra}
                  onChange={(e) => actualizarPrecioCompra(e.target.value)}
                  placeholder="0.00"
                />
                {errores.precio_compra && (
                  <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <AlertCircle size={13} /> {errores.precio_compra}
                  </span>
                )}
              </div>
            </div>

            {resumenMargen && (
              <div style={{
                fontSize: '12px',
                color: '#15803d',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '7px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <CheckCircle2 size={14} />
                <span>
                  Ganancia estimada: <strong>Bs {resumenMargen.ganancia.toFixed(2)}</strong> (+{resumenMargen.porcentaje.toFixed(1)}% margen sobre compra)
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

            {/* Botón toggle de unidades */}
            <div style={{ paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setMostrarUnidades((prev) => !prev)}
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  backgroundColor: mostrarUnidades ? 'var(--color-bg-subtle)' : '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--color-text-heading)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={15} color="var(--color-primary, #fd3706)" />
                  Unidades de compra - venta de producto
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                  {form.unidades_opcionales.length > 0 && (
                    <span className={styles.countBadge}>
                      +{form.unidades_opcionales.length} opcionales
                    </span>
                  )}
                  {mostrarUnidades ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </span>
              </button>
            </div>
          </div>

          {/* Panel Derecho: Unidades de compra - venta de producto al lado derecho */}
          {mostrarUnidades && (
            <div
              style={{
                borderLeft: '1px solid var(--color-border-light)',
                paddingLeft: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--color-primary, #fd3706)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                    Unidades de compra - venta de producto
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarUnidades(false)}
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                  style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
                  title="Ocultar panel lateral de unidades"
                >
                  Ocultar
                </button>
              </div>

              {/* Unidades base fijas */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} color="#475569" /> Unidades base estándar del producto
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#1e293b', fontWeight: 700, background: '#e2e8f0', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.02em' }}>
                    Fijas · No editables
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                  Medidas universales del producto. Su equivalencia es universal y no puede modificarse:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Unidad</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>1 u. suelta</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Media Docena</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>6 u. sueltas</div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Docena</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>12 u. sueltas</div>
                  </div>
                </div>
              </div>

              {/* Presentaciones opcionales adicionales */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span className={styles.fieldLabel} style={{ marginBottom: 2 }}>
                      Presentaciones adicionales para pedidos (Opcionales)
                    </span>
                    <p className={styles.hint} style={{ margin: 0 }}>
                      Medidas en las que compras al proveedor o vendes el producto.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      className={styles.select}
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === 'Caja') agregarUnidadOpcional('Caja', '24');
                        else if (val === 'Caja Madre') agregarUnidadOpcional('Caja Madre', '144');
                        else if (val === 'Paquete') agregarUnidadOpcional('Paquete', '10');
                        else agregarUnidadOpcional('', '24');
                        e.target.value = '';
                      }}
                      style={{ width: 'auto', minWidth: '140px', height: '30px', fontSize: '11.5px', padding: '3px 26px 3px 8px' }}
                      title="Selecciona una medida rápida para agregar"
                    >
                      <option value="">+ Agregar medida...</option>
                      <option value="Caja">Caja (24 u.)</option>
                      <option value="Caja Madre">Caja Madre (144 u.)</option>
                      <option value="Paquete">Paquete (10 u.)</option>
                      <option value="personalizado">Personalizada</option>
                    </select>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                      onClick={() => agregarUnidadOpcional()}
                      style={{ height: '30px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 10px' }}
                    >
                      <Plus size={13} /> Nueva
                    </button>
                  </div>
                </div>

                {form.unidades_opcionales.length === 0 ? (
                  <div style={{ padding: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', fontSize: '11.5px', color: '#64748b' }}>
                    Este producto no tiene presentaciones adicionales. Solo se maneja en unidades base (Unidad, Media Docena y Docena).
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {form.unidades_opcionales.map((u, idx) => {
                      const tipoActual = detectarTipoUnidad(u.nombre_unidad);
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '115px 1fr 100px auto', gap: '6px', alignItems: 'center' }}>
                          <select
                            className={styles.select}
                            value={tipoActual}
                            onChange={(e) => cambiarTipoUnidadFila(idx, e.target.value)}
                            title="Elegir o cambiar tipo de medida sugerida"
                            style={{ fontSize: '11.5px', padding: '6px 22px 6px 6px', height: '32px' }}
                          >
                            <option value="Caja">Caja</option>
                            <option value="Caja Madre">Caja Madre</option>
                            <option value="Paquete">Paquete</option>
                            <option value="personalizado">Personalizado</option>
                          </select>
                          <input
                            className={styles.input}
                            type="text"
                            placeholder="Nombre (ej. Caja, Paquete)"
                            value={u.nombre_unidad}
                            style={{ height: '32px', fontSize: '12px' }}
                            onChange={(e) => actualizarUnidadOpcional(idx, { nombre_unidad: e.target.value })}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              className={styles.input}
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Cant."
                              value={u.cantidad_unidades}
                              style={{ height: '32px', fontSize: '12px', padding: '6px 8px' }}
                              onKeyDown={bloquearTeclasNoNumericas}
                              onChange={(e) => actualizarUnidadOpcional(idx, { cantidad_unidades: e.target.value })}
                            />
                            <span style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap' }}>u.</span>
                          </div>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => quitarUnidadOpcional(idx)}
                            title="Quitar presentación"
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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
          actualizarCodigoBarras(codigo);
          showToast(`Código de barras escaneado: ${codigo}`);
        }}
      />
    </main>
  );
};

export default Productos;
