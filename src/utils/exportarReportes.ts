import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ReporteAbastecimientoResponse,
  ReporteExistenciasResponse,
  ReporteVentasResponse,
} from '../services/reportes.service';
import { formatearFechaHora, formatearMoneda } from './formato';

const COLOR_PRIMARIO: [number, number, number] = [253, 55, 6];
const COLOR_OSCURO: [number, number, number] = [24, 24, 27];
const COLOR_GRIS: [number, number, number] = [100, 116, 139];
const COLOR_FONDO_SUAVE: [number, number, number] = [248, 250, 252];

function obtenerSelloArchivo(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dibujarEncabezadoPDF(
  doc: jsPDF,
  titulo: string,
  subtituloFiltros: string,
): number {
  const ancho = doc.internal.pageSize.getWidth();

  // Franja superior institucional
  doc.setFillColor(...COLOR_PRIMARIO);
  doc.rect(0, 0, ancho, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('LIBRERÍA TOFOR', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRIS);
  doc.text('Sistema de Control de Stock y Ventas', 14, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text(titulo, ancho - 14, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_GRIS);
  doc.text(
    `Emitido: ${formatearFechaHora(new Date())}`,
    ancho - 14,
    20,
    { align: 'right' },
  );

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 24, ancho - 14, 24);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text(`Filtros aplicados: ${subtituloFiltros}`, 14, 30);

  return 35;
}

function dibujarResumenKpisPDF(
  doc: jsPDF,
  startY: number,
  kpis: { etiqueta: string; valor: string }[],
): number {
  const ancho = doc.internal.pageSize.getWidth();
  const margen = 14;
  const gap = 4;
  const anchoDisponible = ancho - margen * 2;
  const anchoTarjeta =
    (anchoDisponible - gap * (kpis.length - 1)) / Math.max(kpis.length, 1);

  kpis.forEach((kpi, idx) => {
    const x = margen + idx * (anchoTarjeta + gap);
    doc.setFillColor(...COLOR_FONDO_SUAVE);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, anchoTarjeta, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_GRIS);
    doc.text(kpi.etiqueta, x + 3, startY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_OSCURO);
    doc.text(kpi.valor, x + 3, startY + 12);
  });

  return startY + 21;
}

function dibujarPiePaginasPDF(doc: jsPDF): void {
  const totalPaginas = doc.getNumberOfPages();
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, alto - 12, ancho - 14, alto - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_GRIS);
    doc.text('Librería TOFOR — Reporte oficial generado por el sistema', 14, alto - 7);
    doc.text(`Página ${i} de ${totalPaginas}`, ancho - 14, alto - 7, {
      align: 'right',
    });
  }
}

function obtenerFinalY(doc: jsPDF, fallback: number): number {
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY?: number } })
    .lastAutoTable;
  return lastTable?.finalY ?? fallback;
}

function ajustarAnchosHoja(
  hoja: XLSX.WorkSheet,
  anchos: number[],
): void {
  hoja['!cols'] = anchos.map((wch) => ({ wch }));
}

/* ==========================================================================
   1. REPORTE DE VENTAS
   ========================================================================== */

export interface DescripcionFiltrosVentas {
  desde?: string;
  hasta?: string;
  tipo_cliente?: string;
  metodo_pago?: string;
}

function textoFiltrosVentas(f: DescripcionFiltrosVentas): string {
  const partes: string[] = [];
  if (f.desde || f.hasta) {
    partes.push(`Periodo: ${f.desde || 'Inicio'} a ${f.hasta || 'Hoy'}`);
  } else {
    partes.push('Periodo: Histórico completo');
  }
  partes.push(`Cliente: ${f.tipo_cliente || 'Todos'}`);
  partes.push(`Pago: ${f.metodo_pago || 'Todos'}`);
  return partes.join(' | ');
}

export function exportarVentasPDF(
  datos: ReporteVentasResponse,
  filtros: DescripcionFiltrosVentas,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = dibujarEncabezadoPDF(
    doc,
    'REPORTE DE VENTAS',
    textoFiltrosVentas(filtros),
  );

  y = dibujarResumenKpisPDF(doc, y, [
    { etiqueta: 'Total Recaudado', valor: formatearMoneda(datos.total_recaudado) },
    { etiqueta: 'Cantidad de Ventas', valor: String(datos.cantidad_ventas) },
    { etiqueta: 'Ticket Promedio', valor: formatearMoneda(datos.ticket_promedio) },
    { etiqueta: 'Descuentos Aplicados', valor: formatearMoneda(datos.total_descuentos) },
  ]);

  // Resumen por Método de Pago y Tipo de Cliente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('Resumen por Método de Pago y Tipo de Cliente', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Categoría', 'Concepto', 'Cantidad Ventas', 'Total (Bs)']],
    body: [
      ...datos.por_metodo_pago.map((m) => [
        'Método de Pago',
        m.metodo_pago,
        String(m.cantidad),
        formatearMoneda(m.total),
      ]),
      ...datos.por_tipo_cliente.map((t) => [
        'Tipo de Cliente',
        t.tipo_cliente,
        String(t.cantidad),
        formatearMoneda(t.total),
      ]),
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: COLOR_OSCURO, textColor: 255 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = obtenerFinalY(doc, y + 20) + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('Detalle de Ventas', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        'N°',
        'Fecha y Hora',
        'Cliente',
        'Tipo Cliente',
        'Vendedor',
        'Tipo Venta',
        'Método Pago',
        'Estado',
        'Descuento',
        'Total',
      ],
    ],
    body: datos.ventas.map((v) => [
      `#${v.id_venta}`,
      formatearFechaHora(v.fecha_hora),
      v.cliente,
      v.tipo_cliente,
      v.vendedor,
      v.tipo_venta,
      v.metodo_pago,
      v.estado_pago,
      formatearMoneda(v.monto_descuento),
      formatearMoneda(v.monto_total),
    ]),
    foot: [
      [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'TOTALES',
        formatearMoneda(datos.total_descuentos),
        formatearMoneda(datos.total_recaudado),
      ],
    ],
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255 },
    footStyles: {
      fillColor: COLOR_FONDO_SUAVE,
      textColor: COLOR_OSCURO,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      8: { halign: 'right' },
      9: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  dibujarPiePaginasPDF(doc);
  doc.save(`reporte-ventas-tofor-${obtenerSelloArchivo()}.pdf`);
}

export function exportarVentasExcel(
  datos: ReporteVentasResponse,
  filtros: DescripcionFiltrosVentas,
): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const filasResumen = [
    ['LIBRERÍA TOFOR — REPORTE DE VENTAS'],
    ['Filtros:', textoFiltrosVentas(filtros)],
    ['Emitido:', formatearFechaHora(new Date())],
    [],
    ['INDICADOR', 'VALOR'],
    ['Total Recaudado (Bs)', datos.total_recaudado],
    ['Cantidad de Ventas', datos.cantidad_ventas],
    ['Ticket Promedio (Bs)', datos.ticket_promedio],
    ['Total Descuentos (Bs)', datos.total_descuentos],
    [],
    ['DESGLOSE POR MÉTODO DE PAGO', 'CANTIDAD', 'TOTAL (Bs)'],
    ...datos.por_metodo_pago.map((m) => [m.metodo_pago, m.cantidad, m.total]),
    [],
    ['DESGLOSE POR TIPO DE CLIENTE', 'CANTIDAD', 'TOTAL (Bs)'],
    ...datos.por_tipo_cliente.map((t) => [t.tipo_cliente, t.cantidad, t.total]),
    [],
    ['DESGLOSE POR VENDEDOR', 'CANTIDAD', 'TOTAL (Bs)'],
    ...datos.por_vendedor.map((v) => [v.vendedor, v.cantidad, v.total]),
  ];

  const hojaResumen = XLSX.utils.aoa_to_sheet(filasResumen);
  ajustarAnchosHoja(hojaResumen, [34, 18, 18]);
  XLSX.utils.book_append_sheet(wb, hojaResumen, 'Resumen');

  // Hoja 2: Detalle de Ventas
  const filasDetalle = datos.ventas.map((v) => ({
    'N° Venta': v.id_venta,
    'Fecha y Hora': formatearFechaHora(v.fecha_hora),
    Cliente: v.cliente,
    'NIT/CI': v.nit_cliente ?? '—',
    'Tipo Cliente': v.tipo_cliente,
    Vendedor: v.vendedor,
    'Tipo Venta': v.tipo_venta,
    'Método Pago': v.metodo_pago,
    Estado: v.estado_pago,
    'Descuento (Bs)': v.monto_descuento,
    'Total (Bs)': v.monto_total,
  }));

  const hojaDetalle = XLSX.utils.json_to_sheet(filasDetalle);
  ajustarAnchosHoja(hojaDetalle, [10, 20, 26, 14, 14, 22, 12, 14, 12, 14, 14]);
  XLSX.utils.book_append_sheet(wb, hojaDetalle, 'Detalle Ventas');

  XLSX.writeFile(wb, `reporte-ventas-tofor-${obtenerSelloArchivo()}.xlsx`);
}

/* ==========================================================================
   2. REPORTE DE EXISTENCIAS
   ========================================================================== */

export interface DescripcionFiltrosExistencias {
  desde?: string;
  hasta?: string;
}

function textoFiltrosExistencias(f: DescripcionFiltrosExistencias): string {
  if (f.desde || f.hasta) {
    return `Stock actual al día de hoy | Ranking de rotación: ${f.desde || 'Inicio'} a ${f.hasta || 'Hoy'}`;
  }
  return 'Stock actual al día de hoy | Ranking de rotación: Histórico completo';
}

export function exportarExistenciasPDF(
  datos: ReporteExistenciasResponse,
  filtros: DescripcionFiltrosExistencias,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = dibujarEncabezadoPDF(
    doc,
    'REPORTE DE EXISTENCIAS',
    textoFiltrosExistencias(filtros),
  );

  y = dibujarResumenKpisPDF(doc, y, [
    { etiqueta: 'Productos Activos', valor: String(datos.resumen.total_productos) },
    { etiqueta: 'Unidades en Stock', valor: String(datos.resumen.unidades_totales) },
    {
      etiqueta: 'Valor del Stock (Venta)',
      valor: formatearMoneda(datos.resumen.valor_stock_venta),
    },
    {
      etiqueta: 'Bajo Stock / Agotados',
      valor: `${datos.resumen.cantidad_bajo_stock} (${datos.resumen.cantidad_agotados} agot.)`,
    },
  ]);

  // Sección 1: Lista Actual de Existencias
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('1. Lista Actual de Existencias', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Código',
        'Producto',
        'Marca',
        'Línea',
        'Stock Actual',
        'Stock Mín.',
        'Precio Venta',
        'Valor Stock',
        'Estado',
      ],
    ],
    body: datos.existencias.map((p) => [
      p.codigo_barras ?? '—',
      p.nombre_producto,
      p.nombre_marca ?? '—',
      p.nombre_linea ?? '—',
      String(p.stock_actual),
      String(p.stock_minimo),
      formatearMoneda(p.precio),
      formatearMoneda(p.valor_total),
      p.estado_stock,
    ]),
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Sección 2: Productos Más Vendidos
  doc.addPage();
  y = dibujarEncabezadoPDF(
    doc,
    'REPORTE DE EXISTENCIAS — MÁS VENDIDOS',
    textoFiltrosExistencias(filtros),
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('2. Productos Más Vendidos (Ranking de Rotación)', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        '#',
        'Código',
        'Producto',
        'Marca',
        'Línea',
        'Unidades Vendidas',
        'Stock Actual',
        'Total Generado',
      ],
    ],
    body:
      datos.mas_vendidos.length > 0
        ? datos.mas_vendidos.map((p, idx) => [
            String(idx + 1),
            p.codigo_barras ?? '—',
            p.nombre_producto,
            p.nombre_marca ?? '—',
            p.nombre_linea ?? '—',
            String(p.unidades_vendidas),
            String(p.stock_actual),
            formatearMoneda(p.total_generado),
          ])
        : [['—', '—', 'Sin ventas registradas en el periodo', '—', '—', '0', '0', 'Bs 0,00']],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: COLOR_OSCURO, textColor: 255 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  y = obtenerFinalY(doc, y + 20) + 10;

  // Sección 3: Productos Faltantes / Bajo Stock
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('3. Productos Faltantes / Bajo Stock', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Código',
        'Producto',
        'Marca',
        'Línea',
        'Stock Actual',
        'Stock Mínimo',
        'Faltante (Déficit)',
        'Estado',
      ],
    ],
    body:
      datos.faltantes.length > 0
        ? datos.faltantes.map((p) => [
            p.codigo_barras ?? '—',
            p.nombre_producto,
            p.nombre_marca ?? '—',
            p.nombre_linea ?? '—',
            String(p.stock_actual),
            String(p.stock_minimo),
            String(p.deficit),
            p.estado_stock,
          ])
        : [['—', 'Todos los productos se encuentran sobre el stock mínimo', '—', '—', '—', '—', '0', 'OK']],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [185, 28, 28], textColor: 255 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  dibujarPiePaginasPDF(doc);
  doc.save(`reporte-existencias-tofor-${obtenerSelloArchivo()}.pdf`);
}

export function exportarExistenciasExcel(
  datos: ReporteExistenciasResponse,
): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Existencias Actuales
  const hojaExistencias = XLSX.utils.json_to_sheet(
    datos.existencias.map((p) => ({
      'Código Barras': p.codigo_barras ?? '—',
      Producto: p.nombre_producto,
      Marca: p.nombre_marca ?? '—',
      Línea: p.nombre_linea ?? '—',
      'Stock Actual': p.stock_actual,
      'Stock Mínimo': p.stock_minimo,
      'Precio Compra (Bs)': p.precio_compra,
      'Precio Venta (Bs)': p.precio,
      'Valor Stock Venta (Bs)': p.valor_total,
      Estado: p.estado_stock,
    })),
  );
  ajustarAnchosHoja(hojaExistencias, [16, 30, 18, 18, 12, 12, 16, 16, 18, 12]);
  XLSX.utils.book_append_sheet(wb, hojaExistencias, 'Existencias Actuales');

  // Hoja 2: Más Vendidos
  const hojaMasVendidos = XLSX.utils.json_to_sheet(
    datos.mas_vendidos.map((p, idx) => ({
      Ranking: idx + 1,
      'Código Barras': p.codigo_barras ?? '—',
      Producto: p.nombre_producto,
      Marca: p.nombre_marca ?? '—',
      Línea: p.nombre_linea ?? '—',
      'Unidades Vendidas': p.unidades_vendidas,
      'Stock Actual': p.stock_actual,
      'Total Generado (Bs)': p.total_generado,
    })),
  );
  ajustarAnchosHoja(hojaMasVendidos, [10, 16, 30, 18, 18, 18, 14, 18]);
  XLSX.utils.book_append_sheet(wb, hojaMasVendidos, 'Más Vendidos');

  // Hoja 3: Faltantes / Bajo Stock
  const hojaFaltantes = XLSX.utils.json_to_sheet(
    datos.faltantes.map((p) => ({
      'Código Barras': p.codigo_barras ?? '—',
      Producto: p.nombre_producto,
      Marca: p.nombre_marca ?? '—',
      Línea: p.nombre_linea ?? '—',
      'Stock Actual': p.stock_actual,
      'Stock Mínimo': p.stock_minimo,
      'Déficit (Unidades)': p.deficit,
      Estado: p.estado_stock,
    })),
  );
  ajustarAnchosHoja(hojaFaltantes, [16, 30, 18, 18, 14, 14, 16, 12]);
  XLSX.utils.book_append_sheet(wb, hojaFaltantes, 'Faltantes Bajo Stock');

  XLSX.writeFile(wb, `reporte-existencias-tofor-${obtenerSelloArchivo()}.xlsx`);
}

/* ==========================================================================
   3. REPORTE DE ABASTECIMIENTO
   ========================================================================== */

export interface DescripcionFiltrosAbastecimiento {
  desde?: string;
  hasta?: string;
  proveedorNombre?: string;
}

function textoFiltrosAbastecimiento(f: DescripcionFiltrosAbastecimiento): string {
  const periodo =
    f.desde || f.hasta
      ? `Periodo: ${f.desde || 'Inicio'} a ${f.hasta || 'Hoy'}`
      : 'Periodo: Histórico completo';
  return `${periodo} | Proveedor: ${f.proveedorNombre || 'Todos'}`;
}

export function exportarAbastecimientoPDF(
  datos: ReporteAbastecimientoResponse,
  filtros: DescripcionFiltrosAbastecimiento,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = dibujarEncabezadoPDF(
    doc,
    'REPORTE DE ABASTECIMIENTO',
    textoFiltrosAbastecimiento(filtros),
  );

  y = dibujarResumenKpisPDF(doc, y, [
    { etiqueta: 'Total Invertido', valor: formatearMoneda(datos.total_invertido) },
    { etiqueta: 'Compras Registradas', valor: String(datos.cantidad_compras) },
    {
      etiqueta: 'Unidades Ingresadas',
      valor: String(datos.total_unidades_ingresadas),
    },
    { etiqueta: 'Proveedores Atendidos', valor: String(datos.por_proveedor.length) },
  ]);

  // Resumen por proveedor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('Inversión Agrupada por Proveedor', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Proveedor', 'NIT', 'Compras Realizadas', 'Total Invertido (Bs)']],
    body: datos.por_proveedor.map((p) => [
      p.proveedor,
      p.nit ?? '—',
      String(p.cantidad),
      formatearMoneda(p.total),
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: COLOR_OSCURO, textColor: 255 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = obtenerFinalY(doc, y + 20) + 8;

  // Detalle de compras
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_OSCURO);
  doc.text('Detalle de Compras / Recepciones', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [
      [
        'N° Compra',
        'Pedido',
        'Fecha Recepción',
        'Proveedor',
        'Recepcionado por',
        'Ítems',
        'Unidades',
        'Estado',
        'Total Pagado',
      ],
    ],
    body: datos.compras.map((c) => [
      `#${c.id_compra}`,
      c.id_pedido ? `#${c.id_pedido}` : 'Directa',
      formatearFechaHora(c.fecha_recepcion),
      c.proveedor,
      c.receptor,
      String(c.items),
      String(c.unidades_totales),
      c.estado,
      formatearMoneda(c.total_pagado),
    ]),
    foot: [
      [
        '',
        '',
        '',
        '',
        'TOTALES',
        '',
        String(datos.total_unidades_ingresadas),
        '',
        formatearMoneda(datos.total_invertido),
      ],
    ],
    styles: { fontSize: 8.2, cellPadding: 2.3 },
    headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255 },
    footStyles: {
      fillColor: COLOR_FONDO_SUAVE,
      textColor: COLOR_OSCURO,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  dibujarPiePaginasPDF(doc);
  doc.save(`reporte-abastecimiento-tofor-${obtenerSelloArchivo()}.pdf`);
}

export function exportarAbastecimientoExcel(
  datos: ReporteAbastecimientoResponse,
  filtros: DescripcionFiltrosAbastecimiento,
): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen por proveedor
  const filasProveedor = [
    ['LIBRERÍA TOFOR — REPORTE DE ABASTECIMIENTO'],
    ['Filtros:', textoFiltrosAbastecimiento(filtros)],
    ['Emitido:', formatearFechaHora(new Date())],
    [],
    ['INDICADOR', 'VALOR'],
    ['Total Invertido (Bs)', datos.total_invertido],
    ['Compras Realizadas', datos.cantidad_compras],
    ['Unidades Ingresadas', datos.total_unidades_ingresadas],
    [],
    ['PROVEEDOR', 'NIT', 'COMPRAS', 'TOTAL INVERTIDO (Bs)'],
    ...datos.por_proveedor.map((p) => [
      p.proveedor,
      p.nit ?? '—',
      p.cantidad,
      p.total,
    ]),
  ];

  const hojaProveedor = XLSX.utils.aoa_to_sheet(filasProveedor);
  ajustarAnchosHoja(hojaProveedor, [32, 16, 12, 20]);
  XLSX.utils.book_append_sheet(wb, hojaProveedor, 'Por Proveedor');

  // Hoja 2: Detalle de compras
  const hojaCompras = XLSX.utils.json_to_sheet(
    datos.compras.map((c) => ({
      'N° Compra': c.id_compra,
      'N° Pedido': c.id_pedido ?? 'Directa',
      'Fecha Recepción': formatearFechaHora(c.fecha_recepcion),
      Proveedor: c.proveedor,
      'NIT Proveedor': c.nit_proveedor ?? '—',
      'Recepcionado por': c.receptor,
      'Cantidad Ítems': c.items,
      'Unidades Ingresadas': c.unidades_totales,
      Estado: c.estado,
      'Total Pagado (Bs)': c.total_pagado,
    })),
  );
  ajustarAnchosHoja(hojaCompras, [12, 12, 20, 28, 15, 22, 14, 18, 12, 18]);
  XLSX.utils.book_append_sheet(wb, hojaCompras, 'Detalle Compras');

  XLSX.writeFile(wb, `reporte-abastecimiento-tofor-${obtenerSelloArchivo()}.xlsx`);
}
