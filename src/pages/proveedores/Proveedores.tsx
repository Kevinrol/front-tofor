import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Award,
  Shapes,
  X,
  Eye,
  RotateCcw,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  proveedoresService,
  Proveedor,
  Marca,
  LineaProducto,
} from '../../services/proveedores.service';

interface FormState {
  id_proveedor?: number;
  nit: string;
  razon_social: string;
  nombre_contacto: string;
  telefono_contacto: string;
  ciudad: string;
  estado: boolean;
  marcas: string[];
  lineas_productos: string[];
}

interface ErroresForm {
  nit?: string;
  razon_social?: string;
  telefono_contacto?: string;
}

const FORM_VACIO: FormState = {
  nit: '',
  razon_social: '',
  nombre_contacto: '',
  telefono_contacto: '',
  ciudad: '',
  estado: true,
  marcas: [],
  lineas_productos: [],
};

type FiltroEstado = 'all' | 'active' | 'inactive';

const POR_PAGINA_INICIAL = 6;

const CIUDADES_SUGERIDAS = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Sucre',
  'Tarija',
  'Beni',
  'Pando',
];

export const Proveedores: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [lineas, setLineas] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] = useState<Proveedor | null>(null);

  // Formulario y validaciones
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ErroresForm>({});

  // Inputs para añadir marcas/líneas al vuelo
  const [nuevaMarcaInput, setNuevaMarcaInput] = useState('');
  const [nuevaLineaInput, setNuevaLineaInput] = useState('');
  const [guardandoMarca, setGuardandoMarca] = useState(false);
  const [guardandoLinea, setGuardandoLinea] = useState(false);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const hayErrores = Object.values(errores).some(Boolean);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [provs, marcasData, lineasData] = await Promise.all([
        proveedoresService.getProveedores(),
        proveedoresService.getMarcas(),
        proveedoresService.getLineasProducto(),
      ]);
      setProveedores(provs || []);
      setMarcas(marcasData || []);
      setLineas(lineasData || []);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar la lista de proveedores y catálogos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --------------------------------------------------------------------------
  // Validaciones en tiempo real
  // --------------------------------------------------------------------------
  const validarNitEnTiempoReal = (
    nit: string,
    idActual?: number,
  ): string | undefined => {
    const limpio = nit.trim();
    if (!limpio) {
      return undefined; // Si está en blanco no mostrar error mientras escribe
    }
    if (limpio.length > 30) {
      return 'El NIT/CI no puede exceder 30 caracteres.';
    }
    if (/\s/.test(limpio)) {
      return 'El NIT/CI no debe contener espacios intermedios.';
    }
    if (!/^[\d-]+$/.test(limpio)) {
      return 'El NIT/CI debe contener únicamente números y guiones.';
    }
    const repetido = proveedores.find(
      (p) =>
        p.nit &&
        p.nit.trim().toLowerCase() === limpio.toLowerCase() &&
        p.id_proveedor !== idActual,
    );
    if (repetido) {
      return `NIT/CI ya registrado en: "${repetido.razon_social}" (${repetido.estado ? 'Activo' : 'Inactivo'}).`;
    }
    return undefined;
  };

  const validarTelefonoEnTiempoReal = (telefono: string): string | undefined => {
    const limpio = telefono.trim();
    if (!limpio) return undefined;
    if (!/^\+?[\d\s-]{7,15}$/.test(limpio)) {
      return 'El formato del teléfono no es válido (7 a 15 dígitos).';
    }
    return undefined;
  };

  const actualizarNit = (valor: string) => {
    setForm((prev) => ({ ...prev, nit: valor }));
    const error = validarNitEnTiempoReal(valor, form.id_proveedor);
    setErrores((prev) => ({ ...prev, nit: error }));
  };

  const actualizarTelefono = (valor: string) => {
    setForm((prev) => ({ ...prev, telefono_contacto: valor }));
    const error = validarTelefonoEnTiempoReal(valor);
    setErrores((prev) => ({ ...prev, telefono_contacto: error }));
  };

  const validarFormulario = (): boolean => {
    const nuevos: ErroresForm = {};

    if (!form.razon_social.trim()) {
      nuevos.razon_social = 'La Razón Social o Nombre Comercial es obligatoria.';
    }

    if (!form.nit.trim()) {
      nuevos.nit = 'El NIT/CI es obligatorio para registrar un proveedor.';
    } else {
      const errNit = validarNitEnTiempoReal(form.nit, form.id_proveedor);
      if (errNit) nuevos.nit = errNit;
    }

    if (form.telefono_contacto.trim()) {
      const errTel = validarTelefonoEnTiempoReal(form.telefono_contacto);
      if (errTel) nuevos.telefono_contacto = errTel;
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  // --------------------------------------------------------------------------
  // Manejo de Marcas y Líneas en el formulario
  // --------------------------------------------------------------------------
  const agregarMarcaAForm = (marcaNombre: string) => {
    const limpio = marcaNombre.trim();
    if (!limpio) return;
    if (!form.marcas.some((m) => m.toLowerCase() === limpio.toLowerCase())) {
      setForm((prev) => ({ ...prev, marcas: [...prev.marcas, limpio] }));
    }
  };

  const quitarMarcaDeForm = (marcaNombre: string) => {
    setForm((prev) => ({
      ...prev,
      marcas: prev.marcas.filter((m) => m.toLowerCase() !== marcaNombre.toLowerCase()),
    }));
  };

  const agregarLineaAForm = (lineaNombre: string) => {
    const limpio = lineaNombre.trim();
    if (!limpio) return;
    if (!form.lineas_productos.some((l) => l.toLowerCase() === limpio.toLowerCase())) {
      setForm((prev) => ({ ...prev, lineas_productos: [...prev.lineas_productos, limpio] }));
    }
  };

  const quitarLineaDeForm = (lineaNombre: string) => {
    setForm((prev) => ({
      ...prev,
      lineas_productos: prev.lineas_productos.filter((l) => l.toLowerCase() !== lineaNombre.toLowerCase()),
    }));
  };

  const crearYNuevaMarca = async () => {
    const limpio = nuevaMarcaInput.trim();
    if (!limpio) return;

    if (marcas.some((m) => m.nombre_marca.toLowerCase() === limpio.toLowerCase())) {
      agregarMarcaAForm(limpio);
      setNuevaMarcaInput('');
      showToast(`La marca "${limpio}" ya existía y fue vinculada.`);
      return;
    }

    setGuardandoMarca(true);
    try {
      const nueva = await proveedoresService.createMarca(limpio);
      setMarcas((prev) => [...prev, nueva]);
      agregarMarcaAForm(nueva.nombre_marca);
      setNuevaMarcaInput('');
      showToast(`Marca "${nueva.nombre_marca}" creada y asociada.`);
    } catch (error) {
      console.error(error);
      showToast('No se pudo registrar la marca en el servidor.', 'error');
    } finally {
      setGuardandoMarca(false);
    }
  };

  const crearYNuevaLinea = async () => {
    const limpio = nuevaLineaInput.trim();
    if (!limpio) return;

    if (lineas.some((l) => l.nombre_linea.toLowerCase() === limpio.toLowerCase())) {
      agregarLineaAForm(limpio);
      setNuevaLineaInput('');
      showToast(`La línea "${limpio}" ya existía y fue vinculada.`);
      return;
    }

    setGuardandoLinea(true);
    try {
      const nueva = await proveedoresService.createLineaProducto(limpio);
      setLineas((prev) => [...prev, nueva]);
      agregarLineaAForm(nueva.nombre_linea);
      setNuevaLineaInput('');
      showToast(`Línea "${nueva.nombre_linea}" creada y asociada.`);
    } catch (error) {
      console.error(error);
      showToast('No se pudo registrar la línea en el servidor.', 'error');
    } finally {
      setGuardandoLinea(false);
    }
  };

  // --------------------------------------------------------------------------
  // Guardar y Reset
  // --------------------------------------------------------------------------
  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setErrores({});
    setNuevaMarcaInput('');
    setNuevaLineaInput('');
    setModalOpen(true);
  };

  const abrirEditar = (p: Proveedor) => {
    setForm({
      id_proveedor: p.id_proveedor,
      nit: p.nit ?? '',
      razon_social: p.razon_social ?? '',
      nombre_contacto: p.nombre_contacto ?? '',
      telefono_contacto: p.telefono_contacto ?? '',
      ciudad: p.ciudad ?? '',
      estado: p.estado ?? true,
      marcas: p.marcas ? [...p.marcas] : [],
      lineas_productos: p.lineas_productos ? [...p.lineas_productos] : [],
    });
    setErrores({});
    setNuevaMarcaInput('');
    setNuevaLineaInput('');
    setModalOpen(true);
  };

  const abrirDetalle = (p: Proveedor) => {
    setProveedorDetalle(p);
    setModalDetalleOpen(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      const { id_proveedor, ...payload } = form;
      if (id_proveedor) {
        await proveedoresService.updateProveedor(id_proveedor, payload);
        showToast(`Proveedor "${form.razon_social}" actualizado exitosamente.`);
      } else {
        await proveedoresService.createProveedor(payload);
        showToast(`Proveedor "${form.razon_social}" registrado exitosamente.`);
      }
      setModalOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      showToast('Error al guardar el proveedor en el servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const alternarEstado = async (p: Proveedor) => {
    if (!p.id_proveedor) return;
    const nuevoEstado = !p.estado;
    const accion = nuevoEstado ? 'reactivar' : 'desactivar';
    if (!window.confirm(`¿Seguro que deseas ${accion} al proveedor "${p.razon_social}"?`)) {
      return;
    }

    try {
      await proveedoresService.updateProveedor(p.id_proveedor, {
        nit: p.nit,
        razon_social: p.razon_social,
        nombre_contacto: p.nombre_contacto || '',
        telefono_contacto: p.telefono_contacto || '',
        ciudad: p.ciudad || '',
        estado: nuevoEstado,
        marcas: p.marcas || [],
        lineas_productos: p.lineas_productos || [],
      });
      showToast(`Proveedor ${nuevoEstado ? 'reactivado' : 'desactivado'} correctamente.`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      showToast(`Error al ${accion} el proveedor.`, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Filtros y KPIs
  // --------------------------------------------------------------------------
  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proveedores.filter((p) => {
      const coincide =
        !q ||
        p.razon_social.toLowerCase().includes(q) ||
        (p.nit ?? '').toLowerCase().includes(q) ||
        (p.ciudad ?? '').toLowerCase().includes(q) ||
        (p.nombre_contacto ?? '').toLowerCase().includes(q) ||
        (p.marcas ?? []).some((m) => m.toLowerCase().includes(q)) ||
        (p.lineas_productos ?? []).some((l) => l.toLowerCase().includes(q));

      const porEstado =
        filtro === 'all' ? true : filtro === 'active' ? p.estado : !p.estado;

      return coincide && porEstado;
    });
  }, [proveedores, search, filtro]);

  useEffect(() => {
    setPagina(1);
  }, [search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalActivos = proveedores.filter((p) => p.estado).length;
  const ciudadesCount = useMemo(() => {
    const c = proveedores.map((p) => p.ciudad?.trim()).filter(Boolean);
    return new Set(c).size;
  }, [proveedores]);

  // Marcas y Líneas disponibles para selector en el modal
  const marcasDisponibles = useMemo(() => {
    const seleccionadas = new Set(form.marcas.map((m) => m.toLowerCase()));
    return marcas.filter((m) => !seleccionadas.has(m.nombre_marca.toLowerCase()));
  }, [marcas, form.marcas]);

  const lineasDisponibles = useMemo(() => {
    const seleccionadas = new Set(form.lineas_productos.map((l) => l.toLowerCase()));
    return lineas.filter((l) => !seleccionadas.has(l.nombre_linea.toLowerCase()));
  }, [lineas, form.lineas_productos]);

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <div
              style={{
                background: '#E0EDFF',
                color: '#2563EB',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Proveedores & Distribuidores</h1>
              <p className={styles.subtitle}>
                Directorio de proveedores oficiales, marcas y líneas para el abastecimiento continuo de librería y material escolar.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={abrirCrear}
          >
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Truck size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Proveedores</span>
            <span className={styles.kpiValue}>{proveedores.length}</span>
            <span className={styles.kpiSubtext}>Registrados en el sistema</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Proveedores Activos</span>
            <span className={styles.kpiValue}>{totalActivos}</span>
            <span className={styles.kpiSubtext}>Habilitados para órdenes</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentPurple}`}>
            <Award size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Marcas Vinculadas</span>
            <span className={styles.kpiValue}>{marcas.length}</span>
            <span className={styles.kpiSubtext}>En catálogo comercial</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <MapPin size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Ciudades de Origen</span>
            <span className={styles.kpiValue}>{ciudadesCount}</span>
            <span className={styles.kpiSubtext}>Sedes de distribución</span>
          </div>
        </div>
      </div>

      {/* Tarjeta con Barra de Filtros y Tabla */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por razón social, NIT/CI, contacto, ciudad..."
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
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: '48px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Loader2 size={18} className={styles.spinner} /> Cargando proveedores...
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <Building2 size={36} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin proveedores</span>
            <span className={styles.emptyText}>Registra tu primer proveedor o ajusta los filtros de búsqueda.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor / Razón Social</th>
                  <th>NIT / CI</th>
                  <th>Contacto & Teléfono</th>
                  <th>Ciudad</th>
                  <th>Marcas & Líneas</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const marcasListado = p.marcas || [];
                  const lineasListado = p.lineas_productos || [];

                  return (
                    <tr key={p.id_proveedor}>
                      <td>
                        <div className={styles.strong}>{p.razon_social}</div>
                        {p.nombre_contacto && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {p.nombre_contacto}
                          </div>
                        )}
                      </td>
                      <td className={styles.muted} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {p.nit || '—'}
                      </td>
                      <td>
                        {p.telefono_contacto ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={13} color="var(--color-primary)" />
                            {p.telefono_contacto}
                          </span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        {p.ciudad ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="var(--color-text-muted)" />
                            {p.ciudad}
                          </span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                          {marcasListado.slice(0, 3).map((m) => (
                            <span
                              key={m}
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#F0E7FE',
                                color: '#7C3AED',
                              }}
                            >
                              {m}
                            </span>
                          ))}
                          {lineasListado.slice(0, 2).map((l) => (
                            <span
                              key={l}
                              style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#E0EDFF',
                                color: '#2563EB',
                              }}
                            >
                              {l}
                            </span>
                          ))}
                          {marcasListado.length + lineasListado.length > 5 && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-text-muted)',
                                padding: '2px 4px',
                              }}
                            >
                              +{marcasListado.length + lineasListado.length - 5}
                            </span>
                          )}
                          {marcasListado.length === 0 && lineasListado.length === 0 && (
                            <span className={styles.muted}>Sin vincular</span>
                          )}
                        </div>
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
                            title="Ver ficha completa"
                            onClick={() => abrirDetalle(p)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Editar proveedor"
                            onClick={() => abrirEditar(p)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${p.estado ? styles.iconBtnDanger : styles.iconBtnSuccess}`}
                            title={p.estado ? 'Desactivar proveedor' : 'Reactivar proveedor'}
                            onClick={() => alternarEstado(p)}
                          >
                            {p.estado ? <Trash2 size={15} /> : <RotateCcw size={15} />}
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

        <Paginador
          pagina={paginaActual}
          total={filtrados.length}
          porPagina={porPagina}
          onChange={setPagina}
          onPorPaginaChange={(n) => {
            setPorPagina(n);
            setPagina(1);
          }}
          etiqueta="proveedores"
        />
      </div>

      {/* Modal Crear / Editar Proveedor */}
      <Modal
        open={modalOpen}
        title={form.id_proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        onClose={() => setModalOpen(false)}
        width={940}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-proveedor"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving || hayErrores}
            >
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving
                ? 'Guardando...'
                : form.id_proveedor
                ? 'Actualizar Proveedor'
                : 'Guardar Proveedor'}
            </button>
          </>
        }
      >
        <form
          id="form-proveedor"
          onSubmit={guardar}
          noValidate
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(340px, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Columna Izquierda: Datos Formales y Contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-razon">
                Razón Social / Nombre Comercial <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="prov-razon"
                className={`${styles.input} ${errores.razon_social ? styles.inputError : ''}`}
                type="text"
                value={form.razon_social}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, razon_social: e.target.value }));
                  if (errores.razon_social) {
                    setErrores((prev) => ({ ...prev, razon_social: undefined }));
                  }
                }}
                placeholder="Ej: Distribuidora Escolar Papelera S.A."
              />
              {errores.razon_social && (
                <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {errores.razon_social}
                </span>
              )}
            </div>

            {/* Campo NIT / CI con VALIDACIÓN EN TIEMPO REAL */}
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="prov-nit">
                NIT / CI <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="prov-nit"
                className={`${styles.input} ${errores.nit ? styles.inputError : ''}`}
                type="text"
                value={form.nit}
                onChange={(e) => actualizarNit(e.target.value)}
                placeholder="Ej: 1020304050 o 1020304-1B"
              />
              {errores.nit ? (
                <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertCircle size={13} /> {errores.nit}
                </span>
              ) : form.nit.trim() ? (
                <span style={{ fontSize: '12px', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 500 }}>
                  <CheckCircle2 size={13} /> NIT/CI disponible y válido
                </span>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prov-contacto">
                  Nombre del Contacto
                </label>
                <input
                  id="prov-contacto"
                  className={styles.input}
                  type="text"
                  value={form.nombre_contacto}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre_contacto: e.target.value }))}
                  placeholder="Ej: Carlos Valenzuela"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prov-tel">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="prov-tel"
                  className={`${styles.input} ${errores.telefono_contacto ? styles.inputError : ''}`}
                  type="text"
                  value={form.telefono_contacto}
                  onChange={(e) => actualizarTelefono(e.target.value)}
                  placeholder="Ej: 71234567"
                />
                {errores.telefono_contacto && (
                  <span className={styles.fieldError} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> {errores.telefono_contacto}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prov-ciudad">
                  Ciudad de Despacho
                </label>
                <input
                  id="prov-ciudad"
                  list="lista-ciudades-prov"
                  className={styles.input}
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Ej: La Paz"
                />
                <datalist id="lista-ciudades-prov">
                  {CIUDADES_SUGERIDAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="prov-estado">
                  Estado Operativo
                </label>
                <select
                  id="prov-estado"
                  className={styles.select}
                  value={form.estado ? 'true' : 'false'}
                  onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))}
                >
                  <option value="true">Activo (Habilitado)</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Marcas y Líneas Abastecidas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderLeft: '1px solid var(--color-border-light)',
              paddingLeft: '20px',
            }}
          >
            {/* Sección Marcas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} color="#7C3AED" /> Marcas que Abastece
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {form.marcas.length} seleccionadas
                </span>
              </div>

              {/* Chips de marcas seleccionadas */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  minHeight: '36px',
                  padding: '6px',
                  background: 'var(--color-bg-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {form.marcas.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px' }}>
                    Ninguna marca seleccionada.
                  </span>
                ) : (
                  form.marcas.map((m) => (
                    <span
                      key={m}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#F0E7FE',
                        color: '#7C3AED',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                      }}
                    >
                      {m}
                      <button
                        type="button"
                        onClick={() => quitarMarcaDeForm(m)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#7C3AED',
                        }}
                        title="Quitar marca"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Selector de marcas existentes */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  className={styles.select}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) agregarMarcaAForm(e.target.value);
                  }}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <option value="">+ Vincular marca existente...</option>
                  {marcasDisponibles.map((m) => (
                    <option key={m.nombre_marca} value={m.nombre_marca}>
                      {m.nombre_marca}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input para crear nueva marca al vuelo */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className={styles.input}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={nuevaMarcaInput}
                  onChange={(e) => setNuevaMarcaInput(e.target.value)}
                  placeholder="Crear nueva marca..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      crearYNuevaMarca();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: '11px', padding: '6px 10px', flexShrink: 0 }}
                  onClick={crearYNuevaMarca}
                  disabled={guardandoMarca || !nuevaMarcaInput.trim()}
                >
                  {guardandoMarca ? <Loader2 size={12} className={styles.spinner} /> : <Plus size={12} />}
                  Agregar
                </button>
              </div>
            </div>

            {/* Separador sutil */}
            <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border-light)', margin: '4px 0' }} />

            {/* Sección Líneas de Producto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shapes size={14} color="#2563EB" /> Líneas de Producto
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {form.lineas_productos.length} seleccionadas
                </span>
              </div>

              {/* Chips de líneas seleccionadas */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  minHeight: '36px',
                  padding: '6px',
                  background: 'var(--color-bg-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {form.lineas_productos.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px' }}>
                    Ninguna línea seleccionada.
                  </span>
                ) : (
                  form.lineas_productos.map((l) => (
                    <span
                      key={l}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#E0EDFF',
                        color: '#2563EB',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                      }}
                    >
                      {l}
                      <button
                        type="button"
                        onClick={() => quitarLineaDeForm(l)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#2563EB',
                        }}
                        title="Quitar línea"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Selector de líneas existentes */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  className={styles.select}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) agregarLineaAForm(e.target.value);
                  }}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <option value="">+ Vincular línea existente...</option>
                  {lineasDisponibles.map((l) => (
                    <option key={l.nombre_linea} value={l.nombre_linea}>
                      {l.nombre_linea}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input para crear nueva línea al vuelo */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className={styles.input}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={nuevaLineaInput}
                  onChange={(e) => setNuevaLineaInput(e.target.value)}
                  placeholder="Crear nueva línea..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      crearYNuevaLinea();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: '11px', padding: '6px 10px', flexShrink: 0 }}
                  onClick={crearYNuevaLinea}
                  disabled={guardandoLinea || !nuevaLineaInput.trim()}
                >
                  {guardandoLinea ? <Loader2 size={12} className={styles.spinner} /> : <Plus size={12} />}
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Ficha Completa del Proveedor */}
      {proveedorDetalle && (
        <Modal
          open={modalDetalleOpen}
          title={`Ficha de Proveedor: ${proveedorDetalle.razon_social}`}
          onClose={() => setModalDetalleOpen(false)}
          width={640}
          footer={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setModalDetalleOpen(false)}
            >
              Cerrar Ficha
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <span className={styles.hint}>Razón Social</span>
                <div className={styles.strong}>{proveedorDetalle.razon_social}</div>
              </div>
              <div>
                <span className={styles.hint}>NIT / CI</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{proveedorDetalle.nit || '—'}</div>
              </div>
              <div>
                <span className={styles.hint}>Contacto</span>
                <div>{proveedorDetalle.nombre_contacto || '—'}</div>
              </div>
              <div>
                <span className={styles.hint}>Teléfono / WhatsApp</span>
                <div>{proveedorDetalle.telefono_contacto || '—'}</div>
              </div>
              <div>
                <span className={styles.hint}>Ciudad</span>
                <div>{proveedorDetalle.ciudad || '—'}</div>
              </div>
              <div>
                <span className={styles.hint}>Estado Operativo</span>
                <div>
                  <span className={`${styles.pill} ${proveedorDetalle.estado ? styles.pillSuccess : styles.pillNeutral}`}>
                    <span className={styles.pillDot} />
                    {proveedorDetalle.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)' }} />

            <div>
              <span className={styles.hint} style={{ display: 'block', marginBottom: '6px' }}>
                Marcas que Distribuye ({(proveedorDetalle.marcas || []).length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(proveedorDetalle.marcas || []).length === 0 ? (
                  <span className={styles.muted}>Sin marcas vinculadas</span>
                ) : (
                  (proveedorDetalle.marcas || []).map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#F0E7FE',
                        color: '#7C3AED',
                      }}
                    >
                      {m}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <span className={styles.hint} style={{ display: 'block', marginBottom: '6px' }}>
                Líneas de Producto que Abastece ({(proveedorDetalle.lineas_productos || []).length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(proveedorDetalle.lineas_productos || []).length === 0 ? (
                  <span className={styles.muted}>Sin líneas vinculadas</span>
                ) : (
                  (proveedorDetalle.lineas_productos || []).map((l) => (
                    <span
                      key={l}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#E0EDFF',
                        color: '#2563EB',
                      }}
                    >
                      {l}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Proveedores;
