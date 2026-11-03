import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserRound,
  Store,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import styles from '../../styles/crud.module.css';
import { Modal } from '../../components/Modal/Modal';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  clientesService,
  Cliente,
  ClientePayload,
  TipoCliente,
} from '../../services/clientes.service';
import { ventasService, Venta } from '../../services/ventas.service';
import { formatearMoneda, formatearFechaHora } from '../../utils/formato';

interface FormState {
  id_cliente?: number;
  razon_social_nombre: string;
  nit_ci: string;
  telefono: string;
  direccion: string;
  tipo_cliente: TipoCliente;
  estado: boolean;
}

const FORM_VACIO: FormState = {
  razon_social_nombre: '',
  nit_ci: '',
  telefono: '',
  direccion: '',
  tipo_cliente: 'Mayorista',
  estado: true,
};

type FiltroTipo = 'all' | TipoCliente | 'inactive';

const TIPOS: TipoCliente[] = ['Mayorista', 'Minorista', 'General'];

const POR_PAGINA_INICIAL = 5;

export const Clientes: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [clienteHistorial, setClienteHistorial] = useState<Cliente | null>(null);
  const [ventasCliente, setVentasCliente] = useState<Venta[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const verHistorial = async (cliente: Cliente) => {
    if (!cliente.id_cliente) return;
    setClienteHistorial(cliente);
    setLoadingHistorial(true);
    try {
      const data = await ventasService.getAll({ id_cliente: cliente.id_cliente });
      setVentasCliente(data || []);
    } catch {
      showToast('No se pudo cargar el historial de compras.', 'error');
    } finally {
      setLoadingHistorial(false);
    }
  };

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
    setForm(FORM_VACIO);
    setModalOpen(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setForm({
      id_cliente: cliente.id_cliente,
      razon_social_nombre: cliente.razon_social_nombre,
      nit_ci: cliente.nit_ci,
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? '',
      tipo_cliente: (cliente.tipo_cliente as TipoCliente) ?? 'Mayorista',
      estado: cliente.estado,
    });
    setModalOpen(true);
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.razon_social_nombre.trim()) {
      showToast('El nombre o razón social es obligatorio.', 'error');
      return;
    }
    if (!form.nit_ci.trim()) {
      showToast('El NIT / CI es obligatorio.', 'error');
      return;
    }

    const payload: ClientePayload = {
      razon_social_nombre: form.razon_social_nombre.trim(),
      nit_ci: form.nit_ci.trim(),
      tipo_cliente: form.tipo_cliente,
      estado: form.estado,
    };
    if (form.telefono.trim()) payload.telefono = form.telefono.trim();
    if (form.direccion.trim()) payload.direccion = form.direccion.trim();

    setSaving(true);
    try {
      if (form.id_cliente) {
        await clientesService.update(form.id_cliente, payload);
        showToast('Cliente actualizado correctamente.');
      } else {
        await clientesService.create(payload);
        showToast('Cliente registrado correctamente.');
      }
      setModalOpen(false);
      await cargar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al guardar el cliente.', 'error');
    } finally {
      setSaving(false);
    }
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

      const porTipo =
        filtro === 'all' ? true : filtro === 'inactive' ? !c.estado : c.tipo_cliente === filtro;

      return coincide && porTipo;
    });
  }, [clientes, search, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  const totalMayoristas = clientes.filter((c) => c.tipo_cliente === 'Mayorista').length;
  const totalMinoristas = clientes.filter((c) => c.tipo_cliente === 'Minorista').length;
  const totalActivos = clientes.filter((c) => c.estado).length;

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
            Registro de clientes mayoristas, minoristas y generales para ventas, comprobantes y
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
          <div className={`${styles.kpiIcon} ${styles.accentOrange}`}>
            <Users size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Clientes Totales</span>
            <span className={styles.kpiValue}>{clientes.length}</span>
            <span className={styles.kpiSubtext}>{totalActivos} activos</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentBlue}`}>
            <Store size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Mayoristas</span>
            <span className={styles.kpiValue}>{totalMayoristas}</span>
            <span className={styles.kpiSubtext}>Compras al por mayor</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.accentPurple}`}>
            <UserRound size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Minoristas</span>
            <span className={styles.kpiValue}>{totalMinoristas}</span>
            <span className={styles.kpiSubtext}>Venta al detalle</span>
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
            {TIPOS.map((tipo) => (
              <button
                key={tipo}
                type="button"
                className={`${styles.filterChip} ${filtro === tipo ? styles.filterChipActive : ''}`}
                onClick={() => setFiltro(tipo)}
              >
                {tipo}
              </button>
            ))}
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
                          onClick={() => verHistorial(c)}
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

      <Modal
        open={modalOpen}
        title={form.id_cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        onClose={() => setModalOpen(false)}
        width={600}
        footer={
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-cliente" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="form-cliente" onSubmit={guardar} className={styles.formGrid} noValidate>
          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label className={styles.fieldLabel} htmlFor="cli-nombre">
              Nombre o razón social <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="cli-nombre"
              className={styles.input}
              type="text"
              value={form.razon_social_nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, razon_social_nombre: e.target.value }))}
              placeholder="Ej: Librería Central"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cli-nit">
              NIT / CI <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="cli-nit"
              className={styles.input}
              type="text"
              value={form.nit_ci}
              onChange={(e) => setForm((prev) => ({ ...prev, nit_ci: e.target.value }))}
              placeholder="Ej: 1029384756"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cli-tipo">
              Tipo de cliente
            </label>
            <select
              id="cli-tipo"
              className={styles.select}
              value={form.tipo_cliente}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo_cliente: e.target.value as TipoCliente }))}
            >
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cli-telefono">
              Teléfono
            </label>
            <input
              id="cli-telefono"
              className={styles.input}
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
              placeholder="Ej: 71234567"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cli-direccion">
              Dirección
            </label>
            <input
              id="cli-direccion"
              className={styles.input}
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
              placeholder="Ej: Av. 6 de Marzo #123"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cli-estado">
              Estado
            </label>
            <select
              id="cli-estado"
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

      <Modal
        open={clienteHistorial !== null}
        title={`Historial de Compras — ${clienteHistorial?.razon_social_nombre ?? ''}`}
        onClose={() => setClienteHistorial(null)}
        width={680}
      >
        {loadingHistorial ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} /> Cargando historial...
          </div>
        ) : ventasCliente.length === 0 ? (
          <div className={styles.empty}>
            <Receipt size={32} color="var(--color-text-placeholder)" />
            <span className={styles.emptyTitle}>Sin compras registradas</span>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>N° Venta</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th className={styles.right}>Descuento</th>
                    <th className={styles.right}>Total</th>
                    <th className={styles.center}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasCliente.map((v) => (
                    <tr key={v.id_venta}>
                      <td className={styles.strong}>#{v.id_venta}</td>
                      <td className={styles.muted}>{formatearFechaHora(v.fecha_hora)}</td>
                      <td>{v.metodo_pago}</td>
                      <td className={`${styles.right} ${styles.muted}`}>
                        {formatearMoneda(v.monto_descuento ?? 0)}
                      </td>
                      <td className={`${styles.right} ${styles.money}`}>{formatearMoneda(v.monto_total)}</td>
                      <td className={styles.center}>
                        <span className={`${styles.pill} ${styles.pillNeutral}`}>{v.estado_pago}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.lineTotal}>
              <span className={styles.lineTotalLabel}>Total Acumulado (sin anuladas)</span>
              {formatearMoneda(
                ventasCliente
                  .filter((v) => v.estado_pago !== 'Anulado')
                  .reduce((acc, v) => acc + Number(v.monto_total), 0)
              )}
            </div>
          </>
        )}
      </Modal>
    </main>
  );
};

export default Clientes;
