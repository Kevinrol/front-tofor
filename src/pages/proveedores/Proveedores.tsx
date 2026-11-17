import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  MapPin,
  Phone,
  Award,
  Eye,
  RotateCcw,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  proveedoresService,
  Proveedor,
  Marca,
  LineaProducto,
} from '../../services/proveedores.service';
import { ProveedorFormModal } from './ProveedorFormModal';
import { ProveedorDetalleModal } from './ProveedorDetalleModal';

type FiltroEstado = 'all' | 'active' | 'inactive';

const POR_PAGINA_INICIAL = 6;

export const Proveedores: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [lineas, setLineas] = useState<LineaProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [proveedorDetalle, setProveedorDetalle] = useState<Proveedor | null>(null);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirCrear = () => {
    setProveedorEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (p: Proveedor) => {
    setProveedorEditando(p);
    setModalOpen(true);
  };

  const cerrarModalForm = () => {
    setModalOpen(false);
    setProveedorEditando(null);
  };

  const handleProveedorGuardado = async (mensaje: string) => {
    showToast(mensaje);
    cerrarModalForm();
    await cargarDatos();
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
                            onClick={() => setProveedorDetalle(p)}
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

      <ProveedorFormModal
        open={modalOpen}
        proveedor={proveedorEditando}
        proveedoresExistentes={proveedores}
        marcas={marcas}
        lineas={lineas}
        onClose={cerrarModalForm}
        onGuardado={handleProveedorGuardado}
        onMarcaCreada={(nueva) => setMarcas((prev) => [...prev, nueva])}
        onLineaCreada={(nueva) => setLineas((prev) => [...prev, nueva])}
        onToast={showToast}
      />

      <ProveedorDetalleModal
        proveedor={proveedorDetalle}
        onClose={() => setProveedorDetalle(null)}
      />
    </main>
  );
};

export default Proveedores;
