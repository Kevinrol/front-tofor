import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import crud from '../../styles/crud.module.css';
import rStyles from './Reportes.module.css';
import { Toast } from '../../components/Toast/Toast';
import { Paginador } from '../../components/Paginador/Paginador';
import { useToast } from '../../hooks/useToast';
import {
  ReporteAbastecimientoResponse,
  ReporteExistenciasResponse,
  ReporteVentasResponse,
  reportesService,
} from '../../services/reportes.service';
import {
  Proveedor,
  proveedoresService,
} from '../../services/proveedores.service';
import {
  exportarAbastecimientoExcel,
  exportarAbastecimientoPDF,
  exportarExistenciasExcel,
  exportarExistenciasPDF,
  exportarVentasExcel,
  exportarVentasPDF,
} from '../../utils/exportarReportes';
import { formatearFechaHora, formatearMoneda } from '../../utils/formato';

type PestanaReporte = 'ventas' | 'existencias' | 'abastecimiento';
type SubPestanaExistencias = 'actuales' | 'mas_vendidos' | 'faltantes';

const FILAS_POR_PAGINA = 12;

function obtenerInicioMesActual(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function obtenerHoyInput(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const Reportes: React.FC = () => {
  const { toast, showToast, closeToast } = useToast();
  const [pestana, setPestana] = useState<PestanaReporte>('ventas');

  // --- Estado Reporte de Ventas ---
  const [ventasDesde, setVentasDesde] = useState<string>(obtenerInicioMesActual);
  const [ventasHasta, setVentasHasta] = useState<string>(obtenerHoyInput);
  const [tipoCliente, setTipoCliente] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('');
  const [datosVentas, setDatosVentas] = useState<ReporteVentasResponse | null>(null);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [paginaVentas, setPaginaVentas] = useState(1);

  // --- Estado Reporte de Existencias ---
  const [existDesde, setExistDesde] = useState<string>('');
  const [existHasta, setExistHasta] = useState<string>('');
  const [subPestanaExist, setSubPestanaExist] =
    useState<SubPestanaExistencias>('actuales');
  const [datosExistencias, setDatosExistencias] =
    useState<ReporteExistenciasResponse | null>(null);
  const [cargandoExistencias, setCargandoExistencias] = useState(false);
  const [paginaExistencias, setPaginaExistencias] = useState(1);

  // --- Estado Reporte de Abastecimiento ---
  const [abastDesde, setAbastDesde] = useState<string>(obtenerInicioMesActual);
  const [abastHasta, setAbastHasta] = useState<string>(obtenerHoyInput);
  const [idProveedor, setIdProveedor] = useState<string>('');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [datosAbast, setDatosAbast] =
    useState<ReporteAbastecimientoResponse | null>(null);
  const [cargandoAbast, setCargandoAbast] = useState(false);
  const [paginaAbast, setPaginaAbast] = useState(1);

  // Cargar catálogo de proveedores para filtro opcional de abastecimiento
  useEffect(() => {
    proveedoresService
      .getProveedores()
      .then(setProveedores)
      .catch(() => {
        // Silencioso: el filtro por proveedor es opcional
      });
  }, []);

  const cargarVentas = useCallback(async () => {
    setCargandoVentas(true);
    try {
      const res = await reportesService.obtenerReporteVentas({
        desde: ventasDesde || undefined,
        hasta: ventasHasta || undefined,
        tipo_cliente: tipoCliente || undefined,
        metodo_pago: metodoPago || undefined,
      });
      setDatosVentas(res);
      setPaginaVentas(1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'No se pudo cargar el reporte de ventas.',
        'error',
      );
    } finally {
      setCargandoVentas(false);
    }
  }, [ventasDesde, ventasHasta, tipoCliente, metodoPago, showToast]);

  const cargarExistencias = useCallback(async () => {
    setCargandoExistencias(true);
    try {
      const res = await reportesService.obtenerReporteExistencias({
        desde: existDesde || undefined,
        hasta: existHasta || undefined,
        limit: 20,
      });
      setDatosExistencias(res);
      setPaginaExistencias(1);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el reporte de existencias.',
        'error',
      );
    } finally {
      setCargandoExistencias(false);
    }
  }, [existDesde, existHasta, showToast]);

  const cargarAbastecimiento = useCallback(async () => {
    setCargandoAbast(true);
    try {
      const res = await reportesService.obtenerReporteAbastecimiento({
        desde: abastDesde || undefined,
        hasta: abastHasta || undefined,
        id_proveedor: idProveedor ? Number(idProveedor) : undefined,
      });
      setDatosAbast(res);
      setPaginaAbast(1);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el reporte de abastecimiento.',
        'error',
      );
    } finally {
      setCargandoAbast(false);
    }
  }, [abastDesde, abastHasta, idProveedor, showToast]);

  // Carga automática al cambiar de pestaña o filtros
  useEffect(() => {
    if (pestana === 'ventas') {
      void cargarVentas();
    } else if (pestana === 'existencias') {
      void cargarExistencias();
    } else {
      void cargarAbastecimiento();
    }
  }, [pestana, cargarVentas, cargarExistencias, cargarAbastecimiento]);

  // Paginación Ventas
  const ventasPaginadas = useMemo(() => {
    const lista = datosVentas?.ventas ?? [];
    const inicio = (paginaVentas - 1) * FILAS_POR_PAGINA;
    return lista.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [datosVentas, paginaVentas]);

  // Paginación Existencias (según sub-pestaña)
  const totalExistenciasActual = useMemo(() => {
    if (!datosExistencias) return 0;
    if (subPestanaExist === 'actuales') return datosExistencias.existencias.length;
    if (subPestanaExist === 'mas_vendidos')
      return datosExistencias.mas_vendidos.length;
    return datosExistencias.faltantes.length;
  }, [datosExistencias, subPestanaExist]);

  const existenciasPaginadas = useMemo(() => {
    const lista = datosExistencias?.existencias ?? [];
    const inicio = (paginaExistencias - 1) * FILAS_POR_PAGINA;
    return lista.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [datosExistencias, paginaExistencias]);

  const masVendidosPaginados = useMemo(() => {
    const lista = datosExistencias?.mas_vendidos ?? [];
    const inicio = (paginaExistencias - 1) * FILAS_POR_PAGINA;
    return lista.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [datosExistencias, paginaExistencias]);

  const faltantesPaginados = useMemo(() => {
    const lista = datosExistencias?.faltantes ?? [];
    const inicio = (paginaExistencias - 1) * FILAS_POR_PAGINA;
    return lista.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [datosExistencias, paginaExistencias]);

  // Paginación Abastecimiento
  const comprasPaginadas = useMemo(() => {
    const lista = datosAbast?.compras ?? [];
    const inicio = (paginaAbast - 1) * FILAS_POR_PAGINA;
    return lista.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [datosAbast, paginaAbast]);

  const nombreProveedorSeleccionado = useMemo(() => {
    if (!idProveedor) return undefined;
    return proveedores.find((p) => String(p.id_proveedor) === idProveedor)
      ?.razon_social;
  }, [idProveedor, proveedores]);

  // Acciones de exportación
  const manejarExportarPDF = () => {
    try {
      if (pestana === 'ventas' && datosVentas) {
        exportarVentasPDF(datosVentas, {
          desde: ventasDesde || undefined,
          hasta: ventasHasta || undefined,
          tipo_cliente: tipoCliente || undefined,
          metodo_pago: metodoPago || undefined,
        });
        showToast('Reporte de ventas exportado en PDF.', 'success');
      } else if (pestana === 'existencias' && datosExistencias) {
        exportarExistenciasPDF(datosExistencias, {
          desde: existDesde || undefined,
          hasta: existHasta || undefined,
        });
        showToast('Reporte de existencias exportado en PDF.', 'success');
      } else if (pestana === 'abastecimiento' && datosAbast) {
        exportarAbastecimientoPDF(datosAbast, {
          desde: abastDesde || undefined,
          hasta: abastHasta || undefined,
          proveedorNombre: nombreProveedorSeleccionado,
        });
        showToast('Reporte de abastecimiento exportado en PDF.', 'success');
      }
    } catch {
      showToast('Ocurrió un error al generar el archivo PDF.', 'error');
    }
  };

  const manejarExportarExcel = () => {
    try {
      if (pestana === 'ventas' && datosVentas) {
        exportarVentasExcel(datosVentas, {
          desde: ventasDesde || undefined,
          hasta: ventasHasta || undefined,
          tipo_cliente: tipoCliente || undefined,
          metodo_pago: metodoPago || undefined,
        });
        showToast('Reporte de ventas exportado en Excel.', 'success');
      } else if (pestana === 'existencias' && datosExistencias) {
        exportarExistenciasExcel(datosExistencias);
        showToast('Reporte de existencias exportado en Excel.', 'success');
      } else if (pestana === 'abastecimiento' && datosAbast) {
        exportarAbastecimientoExcel(datosAbast, {
          desde: abastDesde || undefined,
          hasta: abastHasta || undefined,
          proveedorNombre: nombreProveedorSeleccionado,
        });
        showToast('Reporte de abastecimiento exportado en Excel.', 'success');
      }
    } catch {
      showToast('Ocurrió un error al generar el archivo Excel.', 'error');
    }
  };

  const exportacionDeshabilitada =
    (pestana === 'ventas' && (cargandoVentas || !datosVentas)) ||
    (pestana === 'existencias' && (cargandoExistencias || !datosExistencias)) ||
    (pestana === 'abastecimiento' && (cargandoAbast || !datosAbast));

  return (
    <main className={crud.scrollArea}>
      <Toast toast={toast} onClose={closeToast} />

      {/* Encabezado de página */}
      <header className={crud.pageHeader}>
        <div className={crud.pageTitleGroup}>
          <div className={crud.titleRow}>
            <h1 className={crud.title}>Módulo de Reportes</h1>
            <span className={crud.badge}>
              <BarChart3 size={13} />
              Administración
            </span>
          </div>
          <p className={crud.subtitle}>
            Emisión y exportación en PDF y Excel de los reportes oficiales de
            Ventas, Existencias y Abastecimiento.
          </p>
        </div>

        <div className={rStyles.exportGroup}>
          <button
            type="button"
            className={`${crud.btn} ${rStyles.btnPdf}`}
            onClick={manejarExportarPDF}
            disabled={exportacionDeshabilitada}
          >
            <FileText size={16} />
            Exportar PDF
          </button>
          <button
            type="button"
            className={`${crud.btn} ${rStyles.btnExcel}`}
            onClick={manejarExportarExcel}
            disabled={exportacionDeshabilitada}
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </button>
        </div>
      </header>

      {/* Navegación por pestañas de los 3 reportes oficiales */}
      <nav className={rStyles.tabsBar} aria-label="Tipos de reporte">
        <button
          type="button"
          className={`${rStyles.tabBtn} ${pestana === 'ventas' ? rStyles.tabBtnActive : ''}`}
          onClick={() => setPestana('ventas')}
        >
          <ShoppingBag size={16} />
          Reporte de Ventas
        </button>
        <button
          type="button"
          className={`${rStyles.tabBtn} ${pestana === 'existencias' ? rStyles.tabBtnActive : ''}`}
          onClick={() => setPestana('existencias')}
        >
          <Boxes size={16} />
          Reporte de Existencias
        </button>
        <button
          type="button"
          className={`${rStyles.tabBtn} ${pestana === 'abastecimiento' ? rStyles.tabBtnActive : ''}`}
          onClick={() => setPestana('abastecimiento')}
        >
          <Truck size={16} />
          Reporte de Abastecimiento
        </button>
      </nav>

      {/* ================================================================
          PESTAÑA 1: REPORTE DE VENTAS
         ================================================================ */}
      {pestana === 'ventas' && (
        <>
          <section className={rStyles.filtrosCard}>
            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-ventas-desde">
                Desde
              </label>
              <input
                id="rep-ventas-desde"
                type="date"
                className={rStyles.filtroControl}
                value={ventasDesde}
                onChange={(e) => setVentasDesde(e.target.value)}
              />
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-ventas-hasta">
                Hasta
              </label>
              <input
                id="rep-ventas-hasta"
                type="date"
                className={rStyles.filtroControl}
                value={ventasHasta}
                onChange={(e) => setVentasHasta(e.target.value)}
              />
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-ventas-cliente">
                Tipo de Cliente
              </label>
              <select
                id="rep-ventas-cliente"
                className={rStyles.filtroControl}
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Mayorista">Mayorista</option>
                <option value="Minorista">Minorista</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-ventas-pago">
                Método de Pago
              </label>
              <select
                id="rep-ventas-pago"
                className={rStyles.filtroControl}
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="QR">QR</option>
              </select>
            </div>

            <div className={rStyles.filtrosAcciones}>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnGhost}`}
                onClick={() => {
                  setVentasDesde('');
                  setVentasHasta('');
                  setTipoCliente('');
                  setMetodoPago('');
                }}
              >
                <RotateCcw size={15} />
                Limpiar
              </button>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnPrimary}`}
                onClick={() => void cargarVentas()}
                disabled={cargandoVentas}
              >
                {cargandoVentas ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Actualizar
              </button>
            </div>
          </section>

          {/* KPIs Ventas */}
          <section className={crud.kpiGrid}>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <DollarSign size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Total Recaudado</div>
                <div className={crud.kpiValue}>
                  {formatearMoneda(datosVentas?.total_recaudado)}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Ventas Válidas</div>
                <div className={crud.kpiValue}>
                  {datosVentas?.cantidad_ventas ?? 0}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Ticket Promedio</div>
                <div className={crud.kpiValue}>
                  {formatearMoneda(datosVentas?.ticket_promedio)}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <DollarSign size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Descuentos Aplicados</div>
                <div className={crud.kpiValue}>
                  {formatearMoneda(datosVentas?.total_descuentos)}
                </div>
              </div>
            </div>
          </section>

          {/* Desgloses rápidos */}
          {datosVentas && (
            <section className={rStyles.resumenGrid}>
              <div className={rStyles.miniCard}>
                <h3 className={rStyles.miniCardTitle}>Por Método de Pago</h3>
                <div className={rStyles.miniList}>
                  {datosVentas.por_metodo_pago.length === 0 ? (
                    <span className={rStyles.miniRowMeta}>Sin registros</span>
                  ) : (
                    datosVentas.por_metodo_pago.map((m) => (
                      <div key={m.metodo_pago} className={rStyles.miniRow}>
                        <span className={rStyles.miniRowLabel}>
                          {m.metodo_pago}
                          <span className={rStyles.miniRowMeta}>
                            ({m.cantidad} v.)
                          </span>
                        </span>
                        <span className={rStyles.miniRowValue}>
                          {formatearMoneda(m.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={rStyles.miniCard}>
                <h3 className={rStyles.miniCardTitle}>Por Tipo de Cliente</h3>
                <div className={rStyles.miniList}>
                  {datosVentas.por_tipo_cliente.length === 0 ? (
                    <span className={rStyles.miniRowMeta}>Sin registros</span>
                  ) : (
                    datosVentas.por_tipo_cliente.map((t) => (
                      <div key={t.tipo_cliente} className={rStyles.miniRow}>
                        <span className={rStyles.miniRowLabel}>
                          {t.tipo_cliente}
                          <span className={rStyles.miniRowMeta}>
                            ({t.cantidad} v.)
                          </span>
                        </span>
                        <span className={rStyles.miniRowValue}>
                          {formatearMoneda(t.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={rStyles.miniCard}>
                <h3 className={rStyles.miniCardTitle}>Por Vendedor</h3>
                <div className={rStyles.miniList}>
                  {datosVentas.por_vendedor.length === 0 ? (
                    <span className={rStyles.miniRowMeta}>Sin registros</span>
                  ) : (
                    datosVentas.por_vendedor.map((v) => (
                      <div key={v.id_usuario} className={rStyles.miniRow}>
                        <span className={rStyles.miniRowLabel}>
                          {v.vendedor}
                          <span className={rStyles.miniRowMeta}>
                            ({v.cantidad} v.)
                          </span>
                        </span>
                        <span className={rStyles.miniRowValue}>
                          {formatearMoneda(v.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Tabla detallada de ventas */}
          <section className={crud.tableCard}>
            <div className={crud.tableWrapper}>
              {cargandoVentas ? (
                <div className={rStyles.emptyState}>Cargando reporte de ventas...</div>
              ) : ventasPaginadas.length === 0 ? (
                <div className={rStyles.emptyState}>
                  No se encontraron ventas para los filtros seleccionados.
                </div>
              ) : (
                <table className={crud.table}>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha y Hora</th>
                      <th>Cliente</th>
                      <th>Tipo Cliente</th>
                      <th>Vendedor</th>
                      <th>Método</th>
                      <th>Estado</th>
                      <th className={rStyles.alignRight}>Descuento</th>
                      <th className={rStyles.alignRight}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPaginadas.map((v) => (
                      <tr key={v.id_venta}>
                        <td className={rStyles.mono}>#{v.id_venta}</td>
                        <td>{formatearFechaHora(v.fecha_hora)}</td>
                        <td>
                          <strong>{v.cliente}</strong>
                        </td>
                        <td>
                          <span
                            className={`${rStyles.pill} ${
                              v.tipo_cliente === 'Mayorista'
                                ? rStyles.pillInfo
                                : rStyles.pillNeutral
                            }`}
                          >
                            {v.tipo_cliente}
                          </span>
                        </td>
                        <td>{v.vendedor}</td>
                        <td>{v.metodo_pago}</td>
                        <td>
                          <span
                            className={`${rStyles.pill} ${
                              v.estado_pago === 'Pagado'
                                ? rStyles.pillOk
                                : rStyles.pillWarn
                            }`}
                          >
                            {v.estado_pago}
                          </span>
                        </td>
                        <td className={rStyles.alignRight}>
                          {formatearMoneda(v.monto_descuento)}
                        </td>
                        <td className={rStyles.alignRight}>
                          <strong>{formatearMoneda(v.monto_total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(datosVentas?.ventas.length ?? 0) > FILAS_POR_PAGINA && (
              <Paginador
                pagina={paginaVentas}
                total={datosVentas?.ventas.length ?? 0}
                porPagina={FILAS_POR_PAGINA}
                onChange={setPaginaVentas}
                etiqueta="ventas"
              />
            )}
          </section>
        </>
      )}

      {/* ================================================================
          PESTAÑA 2: REPORTE DE EXISTENCIAS
         ================================================================ */}
      {pestana === 'existencias' && (
        <>
          <section className={rStyles.filtrosCard}>
            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-exist-desde">
                Rotación Desde
              </label>
              <input
                id="rep-exist-desde"
                type="date"
                className={rStyles.filtroControl}
                value={existDesde}
                onChange={(e) => setExistDesde(e.target.value)}
              />
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-exist-hasta">
                Rotación Hasta
              </label>
              <input
                id="rep-exist-hasta"
                type="date"
                className={rStyles.filtroControl}
                value={existHasta}
                onChange={(e) => setExistHasta(e.target.value)}
              />
            </div>

            <div className={rStyles.filtrosAcciones}>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnGhost}`}
                onClick={() => {
                  setExistDesde('');
                  setExistHasta('');
                }}
              >
                <RotateCcw size={15} />
                Histórico
              </button>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnPrimary}`}
                onClick={() => void cargarExistencias()}
                disabled={cargandoExistencias}
              >
                {cargandoExistencias ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Actualizar
              </button>
            </div>
          </section>

          {/* KPIs Existencias */}
          <section className={crud.kpiGrid}>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <Package size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Productos Activos</div>
                <div className={crud.kpiValue}>
                  {datosExistencias?.resumen.total_productos ?? 0}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <Boxes size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Unidades en Stock</div>
                <div className={crud.kpiValue}>
                  {datosExistencias?.resumen.unidades_totales ?? 0}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <DollarSign size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Valor del Stock (Venta)</div>
                <div className={crud.kpiValue}>
                  {formatearMoneda(datosExistencias?.resumen.valor_stock_venta)}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Faltantes / Bajo Stock</div>
                <div className={crud.kpiValue}>
                  {datosExistencias?.resumen.cantidad_bajo_stock ?? 0}
                </div>
              </div>
            </div>
          </section>

          {/* Sub-pestañas de Existencias */}
          <div className={rStyles.subTabs}>
            <button
              type="button"
              className={`${rStyles.subTabBtn} ${
                subPestanaExist === 'actuales' ? rStyles.subTabBtnActive : ''
              }`}
              onClick={() => {
                setSubPestanaExist('actuales');
                setPaginaExistencias(1);
              }}
            >
              Existencias Actuales
              <span className={rStyles.subTabCount}>
                {datosExistencias?.existencias.length ?? 0}
              </span>
            </button>
            <button
              type="button"
              className={`${rStyles.subTabBtn} ${
                subPestanaExist === 'mas_vendidos' ? rStyles.subTabBtnActive : ''
              }`}
              onClick={() => {
                setSubPestanaExist('mas_vendidos');
                setPaginaExistencias(1);
              }}
            >
              Productos Más Vendidos
              <span className={rStyles.subTabCount}>
                {datosExistencias?.mas_vendidos.length ?? 0}
              </span>
            </button>
            <button
              type="button"
              className={`${rStyles.subTabBtn} ${
                subPestanaExist === 'faltantes' ? rStyles.subTabBtnActive : ''
              }`}
              onClick={() => {
                setSubPestanaExist('faltantes');
                setPaginaExistencias(1);
              }}
            >
              Faltantes / Bajo Stock
              <span className={rStyles.subTabCount}>
                {datosExistencias?.faltantes.length ?? 0}
              </span>
            </button>
          </div>

          <section className={crud.tableCard}>
            <div className={crud.tableWrapper}>
              {cargandoExistencias ? (
                <div className={rStyles.emptyState}>
                  Cargando reporte de existencias...
                </div>
              ) : subPestanaExist === 'actuales' ? (
                existenciasPaginadas.length === 0 ? (
                  <div className={rStyles.emptyState}>
                    No existen productos activos registrados.
                  </div>
                ) : (
                  <table className={crud.table}>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Línea</th>
                        <th className={rStyles.alignRight}>Stock Actual</th>
                        <th className={rStyles.alignRight}>Stock Mín.</th>
                        <th className={rStyles.alignRight}>Precio Venta</th>
                        <th className={rStyles.alignRight}>Valor Stock</th>
                        <th className={rStyles.alignCenter}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existenciasPaginadas.map((p) => (
                        <tr key={p.id_producto}>
                          <td className={rStyles.mono}>
                            {p.codigo_barras ?? '—'}
                          </td>
                          <td>
                            <strong>{p.nombre_producto}</strong>
                          </td>
                          <td>{p.nombre_marca ?? '—'}</td>
                          <td>{p.nombre_linea ?? '—'}</td>
                          <td className={rStyles.alignRight}>
                            <strong>{p.stock_actual}</strong>
                          </td>
                          <td className={rStyles.alignRight}>{p.stock_minimo}</td>
                          <td className={rStyles.alignRight}>
                            {formatearMoneda(p.precio)}
                          </td>
                          <td className={rStyles.alignRight}>
                            <strong>{formatearMoneda(p.valor_total)}</strong>
                          </td>
                          <td className={rStyles.alignCenter}>
                            <span
                              className={`${rStyles.pill} ${
                                p.estado_stock === 'AGOTADO'
                                  ? rStyles.pillDanger
                                  : p.estado_stock === 'BAJO'
                                    ? rStyles.pillWarn
                                    : rStyles.pillOk
                              }`}
                            >
                              {p.estado_stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : subPestanaExist === 'mas_vendidos' ? (
                masVendidosPaginados.length === 0 ? (
                  <div className={rStyles.emptyState}>
                    No hay ventas registradas para calcular el ranking en este periodo.
                  </div>
                ) : (
                  <table className={crud.table}>
                    <thead>
                      <tr>
                        <th className={rStyles.alignCenter}>#</th>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Línea</th>
                        <th className={rStyles.alignRight}>Unidades Vendidas</th>
                        <th className={rStyles.alignRight}>Stock Actual</th>
                        <th className={rStyles.alignRight}>Total Generado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masVendidosPaginados.map((p, idx) => (
                        <tr key={p.id_producto}>
                          <td className={rStyles.alignCenter}>
                            <strong>
                              {(paginaExistencias - 1) * FILAS_POR_PAGINA + idx + 1}
                            </strong>
                          </td>
                          <td className={rStyles.mono}>
                            {p.codigo_barras ?? '—'}
                          </td>
                          <td>
                            <strong>{p.nombre_producto}</strong>
                          </td>
                          <td>{p.nombre_marca ?? '—'}</td>
                          <td>{p.nombre_linea ?? '—'}</td>
                          <td className={rStyles.alignRight}>
                            <strong>{p.unidades_vendidas}</strong>
                          </td>
                          <td className={rStyles.alignRight}>{p.stock_actual}</td>
                          <td className={rStyles.alignRight}>
                            <strong>{formatearMoneda(p.total_generado)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : faltantesPaginados.length === 0 ? (
                <div className={rStyles.emptyState}>
                  Excelente: no hay productos agotados ni por debajo del stock mínimo.
                </div>
              ) : (
                <table className={crud.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Marca</th>
                      <th>Línea</th>
                      <th className={rStyles.alignRight}>Stock Actual</th>
                      <th className={rStyles.alignRight}>Stock Mínimo</th>
                      <th className={rStyles.alignRight}>Faltante (Déficit)</th>
                      <th className={rStyles.alignCenter}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faltantesPaginados.map((p) => (
                      <tr key={p.id_producto}>
                        <td className={rStyles.mono}>{p.codigo_barras ?? '—'}</td>
                        <td>
                          <strong>{p.nombre_producto}</strong>
                        </td>
                        <td>{p.nombre_marca ?? '—'}</td>
                        <td>{p.nombre_linea ?? '—'}</td>
                        <td className={rStyles.alignRight}>
                          <strong>{p.stock_actual}</strong>
                        </td>
                        <td className={rStyles.alignRight}>{p.stock_minimo}</td>
                        <td className={rStyles.alignRight}>
                          <strong>{p.deficit} u.</strong>
                        </td>
                        <td className={rStyles.alignCenter}>
                          <span
                            className={`${rStyles.pill} ${
                              p.estado_stock === 'AGOTADO'
                                ? rStyles.pillDanger
                                : rStyles.pillWarn
                            }`}
                          >
                            {p.estado_stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {totalExistenciasActual > FILAS_POR_PAGINA && (
              <Paginador
                pagina={paginaExistencias}
                total={totalExistenciasActual}
                porPagina={FILAS_POR_PAGINA}
                onChange={setPaginaExistencias}
                etiqueta="productos"
              />
            )}
          </section>
        </>
      )}

      {/* ================================================================
          PESTAÑA 3: REPORTE DE ABASTECIMIENTO
         ================================================================ */}
      {pestana === 'abastecimiento' && (
        <>
          <section className={rStyles.filtrosCard}>
            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-abast-desde">
                Desde
              </label>
              <input
                id="rep-abast-desde"
                type="date"
                className={rStyles.filtroControl}
                value={abastDesde}
                onChange={(e) => setAbastDesde(e.target.value)}
              />
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-abast-hasta">
                Hasta
              </label>
              <input
                id="rep-abast-hasta"
                type="date"
                className={rStyles.filtroControl}
                value={abastHasta}
                onChange={(e) => setAbastHasta(e.target.value)}
              />
            </div>

            <div className={rStyles.filtroGrupo}>
              <label className={rStyles.filtroLabel} htmlFor="rep-abast-prov">
                Proveedor
              </label>
              <select
                id="rep-abast-prov"
                className={rStyles.filtroControl}
                value={idProveedor}
                onChange={(e) => setIdProveedor(e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map((p) => (
                  <option key={p.id_proveedor} value={String(p.id_proveedor)}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div className={rStyles.filtrosAcciones}>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnGhost}`}
                onClick={() => {
                  setAbastDesde('');
                  setAbastHasta('');
                  setIdProveedor('');
                }}
              >
                <RotateCcw size={15} />
                Limpiar
              </button>
              <button
                type="button"
                className={`${crud.btn} ${crud.btnPrimary}`}
                onClick={() => void cargarAbastecimiento()}
                disabled={cargandoAbast}
              >
                {cargandoAbast ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Actualizar
              </button>
            </div>
          </section>

          {/* KPIs Abastecimiento */}
          <section className={crud.kpiGrid}>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <DollarSign size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Total Invertido</div>
                <div className={crud.kpiValue}>
                  {formatearMoneda(datosAbast?.total_invertido)}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <Truck size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Compras Realizadas</div>
                <div className={crud.kpiValue}>
                  {datosAbast?.cantidad_compras ?? 0}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <Boxes size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Unidades Ingresadas</div>
                <div className={crud.kpiValue}>
                  {datosAbast?.total_unidades_ingresadas ?? 0}
                </div>
              </div>
            </div>
            <div className={crud.kpiCard}>
              <div className={crud.kpiIcon}>
                <Package size={20} />
              </div>
              <div>
                <div className={crud.kpiLabel}>Proveedores Atendidos</div>
                <div className={crud.kpiValue}>
                  {datosAbast?.por_proveedor.length ?? 0}
                </div>
              </div>
            </div>
          </section>

          {/* Resumen por proveedor */}
          {datosAbast && datosAbast.por_proveedor.length > 0 && (
            <section className={rStyles.miniCard}>
              <h3 className={rStyles.miniCardTitle}>
                Inversión Consolidada por Proveedor
              </h3>
              <div className={rStyles.miniList}>
                {datosAbast.por_proveedor.map((p) => (
                  <div key={p.id_proveedor} className={rStyles.miniRow}>
                    <span className={rStyles.miniRowLabel}>
                      {p.proveedor}
                      <span className={rStyles.miniRowMeta}>
                        {p.nit ? `NIT ${p.nit} · ` : ''}
                        {p.cantidad} {p.cantidad === 1 ? 'compra' : 'compras'}
                      </span>
                    </span>
                    <span className={rStyles.miniRowValue}>
                      {formatearMoneda(p.total)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tabla detallada de compras */}
          <section className={crud.tableCard}>
            <div className={crud.tableWrapper}>
              {cargandoAbast ? (
                <div className={rStyles.emptyState}>
                  Cargando reporte de abastecimiento...
                </div>
              ) : comprasPaginadas.length === 0 ? (
                <div className={rStyles.emptyState}>
                  No se encontraron compras a proveedores para el periodo seleccionado.
                </div>
              ) : (
                <table className={crud.table}>
                  <thead>
                    <tr>
                      <th>N° Compra</th>
                      <th>Pedido</th>
                      <th>Fecha Recepción</th>
                      <th>Proveedor</th>
                      <th>Recepcionado por</th>
                      <th className={rStyles.alignRight}>Ítems</th>
                      <th className={rStyles.alignRight}>Unidades</th>
                      <th>Estado</th>
                      <th className={rStyles.alignRight}>Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprasPaginadas.map((c) => (
                      <tr key={c.id_compra}>
                        <td className={rStyles.mono}>#{c.id_compra}</td>
                        <td className={rStyles.mono}>
                          {c.id_pedido ? `#${c.id_pedido}` : 'Directa'}
                        </td>
                        <td>{formatearFechaHora(c.fecha_recepcion)}</td>
                        <td>
                          <strong>{c.proveedor}</strong>
                        </td>
                        <td>{c.receptor}</td>
                        <td className={rStyles.alignRight}>{c.items}</td>
                        <td className={rStyles.alignRight}>
                          {c.unidades_totales}
                        </td>
                        <td>
                          <span className={`${rStyles.pill} ${rStyles.pillOk}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className={rStyles.alignRight}>
                          <strong>{formatearMoneda(c.total_pagado)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(datosAbast?.compras.length ?? 0) > FILAS_POR_PAGINA && (
              <Paginador
                pagina={paginaAbast}
                total={datosAbast?.compras.length ?? 0}
                porPagina={FILAS_POR_PAGINA}
                onChange={setPaginaAbast}
                etiqueta="compras"
              />
            )}
          </section>
        </>
      )}
    </main>
  );
};
