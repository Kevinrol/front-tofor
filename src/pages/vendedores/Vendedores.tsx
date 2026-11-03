import React, { useEffect, useMemo, useState } from 'react';
import {
  UserCheck,
  Users,
  Clock,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  Receipt,
  Eye,
  TrendingUp,
  Wallet,
  Printer,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  usuariosService,
  Usuario,
  RolUsuario,
  TurnoUsuario,
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
} from '../../services/usuarios.service';
import { ventasService, Venta } from '../../services/ventas.service';
import { formatearMoneda, formatearFechaHora } from '../../utils/formato';

interface FormState {
  id_usuario?: number;
  nombre_completo: string;
  username: string;
  password: string;
  rol: RolUsuario;
  turno: TurnoUsuario;
  estado: boolean;
}

const FORM_VACIO: FormState = {
  nombre_completo: '',
  username: '',
  password: '',
  rol: 'VENDEDOR',
  turno: 'mañana',
  estado: true,
};

type FiltroPersonal =
  | 'all'
  | 'VENDEDOR'
  | 'ADMIN'
  | 'mañana'
  | 'tarde'
  | 'tiempo_completo'
  | 'inactive';

const ETIQUETA_TURNO: Record<TurnoUsuario, string> = {
  mañana: 'Mañana',
  tarde: 'Tarde',
  tiempo_completo: 'Tiempo Completo',
};

const POR_PAGINA_INICIAL = 5;

export const Vendedores: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);

  // Modal de historial de ventas del vendedor
  const [vendedorHistorial, setVendedorHistorial] = useState<Usuario | null>(null);
  const [ventasVendedor, setVentasVendedor] = useState<Venta[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<FiltroPersonal>('all');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getAll({ incluirInactivos: true });
      // Ocultar el registro técnico SUPER_ADMIN ('dev') de la gestión operativa
      setUsuarios((data || []).filter((u) => u.rol !== 'SUPER_ADMIN'));
    } catch (error) {
      console.error(error);
      showToast('No se pudo cargar el listado de vendedores.', 'error');
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

  const cargarVentasVendedor = async (
    idUsuario: number,
    desde?: string,
    hasta?: string,
  ) => {
    setLoadingHistorial(true);
    try {
      const data = await ventasService.getAll({
        id_usuario: idUsuario,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setVentasVendedor(data || []);
    } catch {
      showToast('No se pudieron cargar las ventas del vendedor.', 'error');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const abrirHistorialVentas = async (usuario: Usuario) => {
    if (!usuario.id_usuario) return;
    setVendedorHistorial(usuario);
    setFechaDesde('');
    setFechaHasta('');
    await cargarVentasVendedor(usuario.id_usuario);
  };

  const verComprobanteVenta = async (venta: Venta) => {
    if (!venta.id_venta) return;
    try {
      const completa = await ventasService.getOne(venta.id_venta);
      setVentaDetalle(completa);
    } catch {
      showToast('No se pudo cargar el detalle de la venta.', 'error');
    }
  };

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setModalOpen(true);
  };

  const abrirEditar = (u: Usuario) => {
    setForm({
      id_usuario: u.id_usuario,
      nombre_completo: u.nombre_completo,
      username: u.username,
      password: '',
      rol: u.rol === 'ADMIN' ? 'ADMIN' : 'VENDEDOR',
      turno: (u.turno as TurnoUsuario) || 'mañana',
      estado: Boolean(u.estado),
    });
    setModalOpen(true);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombre_completo.trim() || !form.username.trim()) {
      showToast('El nombre completo y el usuario (username) son obligatorios.', 'error');
      return;
    }

    const esEdicion = form.id_usuario != null;
    if (!esEdicion && form.password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (esEdicion && form.password && form.password.length < 8) {
      showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (esEdicion && form.id_usuario != null) {
        const payload: UpdateUsuarioPayload = {
          nombre_completo: form.nombre_completo.trim(),
          username: form.username.trim(),
          rol: form.rol,
          turno: form.turno,
          estado: form.estado,
        };
        if (form.password) {
          payload.password = form.password;
        }
        await usuariosService.update(form.id_usuario, payload);
        showToast('Vendedor actualizado correctamente.');
      } else {
        const payload: CreateUsuarioPayload = {
          nombre_completo: form.nombre_completo.trim(),
          username: form.username.trim(),
          password: form.password,
          rol: form.rol,
          turno: form.turno,
          estado: form.estado,
        };
        await usuariosService.create(payload);
        showToast('Vendedor creado correctamente.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al guardar el vendedor.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const desactivar = async (u: Usuario) => {
    if (!u.id_usuario) return;
    if (
      !window.confirm(
        `¿Dar de baja a "${u.nombre_completo}" (@${u.username})? Ya no podrá iniciar sesión.`,
      )
    )
      return;
    try {
      await usuariosService.remove(u.id_usuario);
      showToast('Usuario dado de baja correctamente.');
      await cargar();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo dar de baja.',
        'error',
      );
    }
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usuarios.filter((u) => {
      const coincideTexto =
        !q ||
        u.nombre_completo.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q);
      if (!coincideTexto) return false;

      if (filtro === 'inactive') return !u.estado;
      if (!u.estado) return false;

      if (filtro === 'VENDEDOR' || filtro === 'ADMIN') return u.rol === filtro;
      if (filtro === 'mañana' || filtro === 'tarde' || filtro === 'tiempo_completo') {
        return u.turno === filtro;
      }
      return true;
    });
  }, [usuarios, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina,
  );

  const activos = usuarios.filter((u) => u.estado);
  const totalVendedores = activos.filter((u) => u.rol === 'VENDEDOR').length;
  const totalAdmins = activos.filter((u) => u.rol === 'ADMIN').length;
  const totalTiempoCompleto = activos.filter(
    (u) => u.rol === 'VENDEDOR' && u.turno === 'tiempo_completo',
  ).length;

  // KPIs del modal de ventas por vendedor
  const ventasValidasVendedor = useMemo(
    () => ventasVendedor.filter((v) => v.estado_pago !== 'Anulado'),
    [ventasVendedor],
  );
  const totalVendidoVendedor = useMemo(
    () =>
      ventasValidasVendedor.reduce((acc, v) => acc + Number(v.monto_total || 0), 0),
    [ventasValidasVendedor],
  );
  const totalEfectivoVendedor = useMemo(
    () =>
      ventasValidasVendedor
        .filter((v) => v.metodo_pago === 'Efectivo')
        .reduce((acc, v) => acc + Number(v.monto_total || 0), 0),
    [ventasValidasVendedor],
  );
  const totalQrVendedor = useMemo(
    () =>
      ventasValidasVendedor
        .filter((v) => v.metodo_pago === 'QR')
        .reduce((acc, v) => acc + Number(v.monto_total || 0), 0),
    [ventasValidasVendedor],
  );

  return (
    <main className={styles.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Vendedores y Personal</h1>
            <span className={styles.badge}>
              <UserCheck size={14} /> Gestión de Roles y Turnos
            </span>
          </div>
          <p className={styles.subtitle}>
            Registra vendedores de mostrador, administra sus credenciales de acceso y
            consulta las ventas realizadas por cada miembro del equipo.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={abrirCrear}
          >
            <Plus size={16} /> Nuevo Vendedor
          </button>
        </div>
      </div>

      {/* KPIs */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <Users size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Vendedores Activos</span>
            <span className={styles.kpiValue}>{totalVendedores}</span>
            <span className={styles.kpiSubtext}>Habilitados para registrar ventas</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
            <Clock size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Tiempo Completo</span>
            <span className={styles.kpiValue}>{totalTiempoCompleto}</span>
            <span className={styles.kpiSubtext}>
              {totalVendedores - totalTiempoCompleto} en medio turno (mañana/tarde)
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Administradores</span>
            <span className={styles.kpiValue}>{totalAdmins}</span>
            <span className={styles.kpiSubtext}>Acceso total al sistema</span>
          </div>
        </div>
      </section>

      {/* Tabla principal */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <UserCheck size={17} /> Directorio de Personal
            <span className={styles.countBadge}>{filtrados.length}</span>
          </h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} color="var(--color-text-placeholder)" />
            <input
              type="text"
              placeholder="Buscar por nombre o usuario (@username)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            {(
              [
                ['all', 'Todos Activos'],
                ['VENDEDOR', 'Vendedores'],
                ['ADMIN', 'Administradores'],
                ['mañana', 'Turno Mañana'],
                ['tarde', 'Turno Tarde'],
                ['tiempo_completo', 'Tiempo Completo'],
                ['inactive', 'Inactivos'],
              ] as [FiltroPersonal, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.filterChip} ${
                  filtro === key ? styles.filterChipActive : ''
                }`}
                onClick={() => setFiltro(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando personal...
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles.empty}>
            <UserCheck size={34} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin registros</span>
            <span className={styles.emptyText}>
              No se encontraron vendedores con los filtros seleccionados.
            </span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Usuario (Login)</th>
                  <th>Rol</th>
                  <th>Turno</th>
                  <th className={styles.center}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => (
                  <tr key={u.id_usuario}>
                    <td className={styles.muted}>#{u.id_usuario}</td>
                    <td className={styles.strong}>{u.nombre_completo}</td>
                    <td>
                      <span className={styles.code}>@{u.username}</span>
                    </td>
                    <td>
                      <span
                        className={`${styles.pill} ${
                          u.rol === 'ADMIN' ? styles.pillInfo : styles.pillNeutral
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className={styles.muted}>
                      {u.turno ? ETIQUETA_TURNO[u.turno] ?? u.turno : '—'}
                    </td>
                    <td className={styles.center}>
                      <span
                        className={`${styles.pill} ${
                          u.estado ? styles.pillSuccess : styles.pillDanger
                        }`}
                      >
                        {u.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Ver ventas registradas por este vendedor"
                          onClick={() => abrirHistorialVentas(u)}
                        >
                          <Receipt size={15} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Editar usuario / cambiar contraseña"
                          onClick={() => abrirEditar(u)}
                        >
                          <Pencil size={15} />
                        </button>
                        {u.estado && (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Dar de baja"
                            onClick={() => desactivar(u)}
                          >
                            <Trash2 size={15} />
                          </button>
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
            total={filtrados.length}
            pagina={paginaActual}
            onChange={setPagina}
            porPagina={porPagina}
            onPorPaginaChange={(nuevo) => {
              setPorPagina(nuevo);
              setPagina(1);
            }}
            etiqueta="usuarios"
          />
        )}
      </section>

      {/* Modal Crear / Editar Vendedor */}
      <Modal
        open={modalOpen}
        title={
          form.id_usuario != null
            ? `Editar Personal #${form.id_usuario}`
            : 'Registrar Nuevo Vendedor'
        }
        onClose={() => setModalOpen(false)}
        width={560}
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
              form="form-vendedor"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={16} className={styles.spinner} />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <form
          id="form-vendedor"
          onSubmit={guardar}
          className={styles.formGrid}
          noValidate
        >
          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label className={styles.fieldLabel} htmlFor="vend-nombre">
              Nombre completo <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="vend-nombre"
              type="text"
              className={styles.input}
              placeholder="Ej. Rodrigo Quispe Choque"
              value={form.nombre_completo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
              }
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="vend-username">
              Usuario (username) <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="vend-username"
              type="text"
              className={styles.input}
              placeholder="Ej. rquispe"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="vend-password">
              Contraseña{' '}
              {form.id_usuario == null ? (
                <span className={styles.requiredMark}>*</span>
              ) : (
                <span className={styles.muted}>(opcional)</span>
              )}
            </label>
            <input
              id="vend-password"
              type="password"
              className={styles.input}
              placeholder={
                form.id_usuario == null
                  ? 'Mínimo 8 caracteres'
                  : 'Dejar vacío para mantener la actual'
              }
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="vend-rol">
              Rol en el sistema
            </label>
            <select
              id="vend-rol"
              className={styles.select}
              value={form.rol}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, rol: e.target.value as RolUsuario }))
              }
            >
              <option value="VENDEDOR">VENDEDOR (Solo registrar ventas)</option>
              <option value="ADMIN">ADMIN (Acceso completo)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="vend-turno">
              Turno de trabajo
            </label>
            <select
              id="vend-turno"
              className={styles.select}
              value={form.turno}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  turno: e.target.value as TurnoUsuario,
                }))
              }
            >
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="tiempo_completo">Tiempo Completo</option>
            </select>
          </div>

          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label className={styles.fieldLabel} htmlFor="vend-estado">
              Estado de la cuenta
            </label>
            <select
              id="vend-estado"
              className={styles.select}
              value={form.estado ? 'true' : 'false'}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))
              }
            >
              <option value="true">Activo (Puede iniciar sesión)</option>
              <option value="false">Inactivo (Acceso bloqueado)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal Historial de Ventas del Vendedor */}
      <Modal
        open={vendedorHistorial != null}
        title={
          vendedorHistorial
            ? `Ventas registradas por ${vendedorHistorial.nombre_completo} (@${vendedorHistorial.username})`
            : 'Ventas del Vendedor'
        }
        onClose={() => setVendedorHistorial(null)}
        width={820}
        footer={
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => setVendedorHistorial(null)}
          >
            Cerrar
          </button>
        }
      >
        {vendedorHistorial && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filtros por fecha */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <div className={styles.field} style={{ minWidth: 160 }}>
                <label className={styles.fieldLabel} htmlFor="hist-desde">
                  Desde
                </label>
                <input
                  id="hist-desde"
                  type="date"
                  className={styles.input}
                  value={fechaDesde}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFechaDesde(val);
                    if (vendedorHistorial.id_usuario) {
                      cargarVentasVendedor(
                        vendedorHistorial.id_usuario,
                        val,
                        fechaHasta,
                      );
                    }
                  }}
                />
              </div>
              <div className={styles.field} style={{ minWidth: 160 }}>
                <label className={styles.fieldLabel} htmlFor="hist-hasta">
                  Hasta
                </label>
                <input
                  id="hist-hasta"
                  type="date"
                  className={styles.input}
                  value={fechaHasta}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFechaHasta(val);
                    if (vendedorHistorial.id_usuario) {
                      cargarVentasVendedor(
                        vendedorHistorial.id_usuario,
                        fechaDesde,
                        val,
                      );
                    }
                  }}
                />
              </div>
              {(fechaDesde || fechaHasta) && (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => {
                    setFechaDesde('');
                    setFechaHasta('');
                    if (vendedorHistorial.id_usuario) {
                      cargarVentasVendedor(vendedorHistorial.id_usuario);
                    }
                  }}
                >
                  Limpiar fechas
                </button>
              )}
            </div>

            {/* KPIs del Vendedor */}
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
                  <Receipt size={20} />
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Ventas Válidas</span>
                  <span className={styles.kpiValue}>
                    {ventasValidasVendedor.length}
                  </span>
                  <span className={styles.kpiSubtext}>
                    {ventasVendedor.length} registradas en total
                  </span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={`${styles.kpiIcon} ${styles.accentGreen}`}>
                  <TrendingUp size={20} />
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Total Vendido</span>
                  <span className={styles.kpiValue}>
                    {formatearMoneda(totalVendidoVendedor)}
                  </span>
                  <span className={styles.kpiSubtext}>Excluye anuladas</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
                  <Wallet size={20} />
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Efectivo / QR</span>
                  <span className={styles.kpiValue} style={{ fontSize: 16 }}>
                    {formatearMoneda(totalEfectivoVendedor)} /{' '}
                    {formatearMoneda(totalQrVendedor)}
                  </span>
                  <span className={styles.kpiSubtext}>Efectivo vs. QR</span>
                </div>
              </div>
            </div>

            {/* Tabla de ventas del vendedor */}
            {loadingHistorial ? (
              <div className={styles.loadingRow}>
                <Loader2 size={18} className={styles.spinner} /> Cargando ventas...
              </div>
            ) : ventasVendedor.length === 0 ? (
              <div className={styles.empty}>
                <Receipt size={30} color="var(--color-text-placeholder)" />
                <span className={styles.emptyTitle}>Sin ventas registradas</span>
                <span className={styles.emptyText}>
                  Este vendedor aún no registra ventas en el rango seleccionado.
                </span>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Método</th>
                      <th className={styles.right}>Descuento</th>
                      <th className={styles.right}>Total</th>
                      <th className={styles.center}>Estado</th>
                      <th className={styles.right}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasVendedor.map((v) => (
                      <tr key={v.id_venta}>
                        <td className={styles.strong}>#{v.id_venta}</td>
                        <td className={styles.muted}>
                          {formatearFechaHora(v.fecha_hora)}
                        </td>
                        <td>{v.nombre_cliente || 'General'}</td>
                        <td>
                          <span className={`${styles.pill} ${styles.pillNeutral}`}>
                            {v.metodo_pago}
                          </span>
                        </td>
                        <td className={styles.right}>
                          {formatearMoneda(v.monto_descuento ?? 0)}
                        </td>
                        <td className={`${styles.right} ${styles.money}`}>
                          {formatearMoneda(v.monto_total)}
                        </td>
                        <td className={styles.center}>
                          <span
                            className={`${styles.pill} ${
                              v.estado_pago === 'Pagado'
                                ? styles.pillSuccess
                                : v.estado_pago === 'Pendiente'
                                  ? styles.pillWarning
                                  : styles.pillDanger
                            }`}
                          >
                            {v.estado_pago}
                          </span>
                        </td>
                        <td className={styles.right}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Ver comprobante de venta"
                            onClick={() => verComprobanteVenta(v)}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Comprobante de una Venta individual */}
      <Modal
        open={ventaDetalle != null}
        title={
          ventaDetalle
            ? `Comprobante de Venta #${ventaDetalle.id_venta}`
            : 'Detalle de Venta'
        }
        onClose={() => setVentaDetalle(null)}
        width={640}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setVentaDetalle(null)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => window.print()}
            >
              <Printer size={16} /> Imprimir / Guardar PDF
            </button>
          </>
        }
      >
        {ventaDetalle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                fontSize: 13,
              }}
            >
              <div>
                <strong>Vendedor:</strong> {ventaDetalle.nombre_usuario || '—'}
              </div>
              <div>
                <strong>Fecha:</strong> {formatearFechaHora(ventaDetalle.fecha_hora)}
              </div>
              <div>
                <strong>Cliente:</strong> {ventaDetalle.nombre_cliente || 'General'}
              </div>
              <div>
                <strong>Método de pago:</strong> {ventaDetalle.metodo_pago} (
                {ventaDetalle.estado_pago})
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.right}>Cant.</th>
                    <th className={styles.right}>P. Unit.</th>
                    <th className={styles.right}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(ventaDetalle.detalles ?? []).map((d, i) => (
                    <tr key={d.id_detalle_venta ?? i}>
                      <td>{d.nombre_producto || `#${d.id_producto}`}</td>
                      <td className={styles.right}>{d.cantidad}</td>
                      <td className={styles.right}>
                        {formatearMoneda(d.precio_aplicado)}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>
                        {formatearMoneda(d.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', fontSize: 14 }}>
              {Number(ventaDetalle.monto_descuento ?? 0) > 0 && (
                <div>
                  Descuento aplicado:{' '}
                  <strong>
                    -{formatearMoneda(ventaDetalle.monto_descuento ?? 0)}
                  </strong>
                </div>
              )}
              <div style={{ fontSize: 16, marginTop: 4 }}>
                Total cobrado:{' '}
                <strong>{formatearMoneda(ventaDetalle.monto_total)}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default Vendedores;
