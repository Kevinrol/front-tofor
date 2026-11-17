import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Store,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Receipt,
  UserX,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import { clientesService, Cliente } from '../../services/clientes.service';
import { ClienteFormModal } from './ClienteFormModal';
import { ClienteHistorialModal } from './ClienteHistorialModal';

type FiltroTipo = 'all' | 'active' | 'inactive';

const POR_PAGINA_INICIAL = 5;

export const Clientes: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteHistorial, setClienteHistorial] = useState<Cliente | null>(null);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipo>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await clientesService.getAll({ incluirInactivos: true });
      setClientes(data || []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los clientes.', 'error');
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
    setClienteEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalOpen(true);
  };

  const cerrarModalForm = () => {
    setModalOpen(false);
    setClienteEditando(null);
  };

  const handleClienteGuardado = async (mensaje: string) => {
    showToast(mensaje);
    cerrarModalForm();
    await cargar();
  };

  const eliminar = async (cliente: Cliente) => {
    if (cliente.id_cliente == null) return;
    if (!window.confirm(`¿Desactivar el cliente "${cliente.razon_social_nombre}"?`)) return;
    try {
      await clientesService.remove(cliente.id_cliente);
      showToast('Cliente desactivado.');
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al desactivar.', 'error');
    }
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clientes.filter((c) => {
      const coincide =
        !q ||
        c.razon_social_nombre.toLowerCase().includes(q) ||
        c.nit_ci.toLowerCase().includes(q) ||
        (c.telefono ?? '').toLowerCase().includes(q);

      const porEstado =
        filtro === 'all' ? true : filtro === 'active' ? c.estado : !c.estado;

      return coincide && porEstado;
    });
  }, [clientes, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalActivos = clientes.filter((c) => c.estado).length;
  const totalInactivos = clientes.filter((c) => !c.estado).length;

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Gestión de Clientes</h1>
            <span className={styles.badge}>
              <Users size={14} /> Cartera de clientes
            </span>
          </div>
          <p className={styles.subtitle}>
            Registro de clientes mayoristas frecuentes para ventas, comprobantes y
            seguimiento comercial.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={abrirCrear}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Store size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Clientes Mayoristas</span>
            <span className={styles.kpiValue}>{clientes.length}</span>
            <span className={styles.kpiSubtext}>Cartera registrada</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Habilitados</span>
            <span className={styles.kpiValue}>{totalActivos}</span>
            <span className={styles.kpiSubtext}>Listos para facturar</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <UserX size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Inactivos</span>
            <span className={styles.kpiValue}>{totalInactivos}</span>
            <span className={styles.kpiSubtext}>Fuera de cartera</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Users size={17} /> Directorio de Clientes
            <span className={styles.countBadge}>{filtrados.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT/CI o teléfono..."
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
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando clientes...
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <Users size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin clientes</span>
            <span className={styles.emptyText}>Registra tu primer cliente o ajusta la búsqueda.</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>NIT / CI</th>
                  <th>Tipo</th>
                  <th>Contacto</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => (
                  <tr key={c.id_cliente}>
                    <td className={styles.strong}>{c.razon_social_nombre}</td>
                    <td className={styles.muted}>{c.nit_ci}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillInfo}`}>{c.tipo_cliente}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {c.telefono && (
                          <span className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={13} /> {c.telefono}
                          </span>
                        )}
                        {c.direccion && (
                          <span className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={13} /> {c.direccion}
                          </span>
                        )}
                        {!c.telefono && !c.direccion && <span className={styles.muted}>—</span>}
                      </div>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.pill} ${c.estado ? styles.pillSuccess : styles.pillNeutral}`}>
                        <span className={styles.pillDot} />
                        {c.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Historial de compras"
                          onClick={() => c.id_cliente && setClienteHistorial(c)}
                        >
                          <Receipt size={15} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Editar"
                          onClick={() => abrirEditar(c)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Desactivar"
                          onClick={() => eliminar(c)}
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
            total={filtrados.length}
            pagina={paginaActual}
            onChange={setPagina}
            porPagina={porPagina}
            onPorPaginaChange={(nuevo) => {
              setPorPagina(nuevo);
              setPagina(1);
            }}
            etiqueta="clientes"
          />
        )}
      </section>

      <ClienteFormModal
        open={modalOpen}
        cliente={clienteEditando}
        clientesExistentes={clientes}
        onClose={cerrarModalForm}
        onGuardado={handleClienteGuardado}
        onError={(mensaje) => showToast(mensaje, 'error')}
      />

      <ClienteHistorialModal
        cliente={clienteHistorial}
        onClose={() => setClienteHistorial(null)}
        onError={(mensaje) => showToast(mensaje, 'error')}
      />
    </main>
  );
};

export default Clientes;
