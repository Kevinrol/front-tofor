# Módulo: Reportes

## Propósito

Entregar a la administración indicadores para decidir qué comprar, qué precio ajustar y cómo van las ventas, a partir de los datos que generan los demás módulos.

## Problema que resuelve

Hoy no existen indicadores de **rotación de productos** (más y menos vendidos), **margen de rentabilidad** ni un **consolidado mensual de compras**. Las decisiones se toman por intuición.

## Reportes

| Reporte | Contenido | Datos de origen |
|---|---|---|
| Rotación de productos | Más y menos vendidos en un período | `detalle_venta` |
| Rentabilidad | Margen por producto: precio de venta − precio de compra | `detalle_venta`, `producto` |
| Consolidado mensual de compras | Compras por mes, proveedor y producto | `compra`, `detalle_compra` |
| Consolidado mensual de ventas | Ventas por mes, tipo de cliente y método de pago | `venta`, `pago` |
| Stock actual | Existencias y productos bajo el mínimo | `producto` |
| Bajas | Productos dados de baja por deterioro y su costo | `movimiento_inventario` |
| Ventas por vendedor y turno | Rendimiento por usuario | `venta`, `usuario` |
| Arqueos | Diferencias de caja por fecha y vendedor | `arqueo` |

## Funcionalidades

1. Filtrar reportes por rango de fechas, categoría, proveedor, vendedor o tipo de cliente.
2. Mostrar resultados en tabla y, donde aporte, en gráficos.
3. Exportar a PDF o Excel (por definir).
4. Resumen general (panel) con indicadores clave del mes.

## Reglas de negocio

- Solo el administrador accede a los reportes.
- Las ventas anuladas no cuentan en los indicadores.
- El margen se calcula con el precio de compra vigente al momento de la venta (por definir si se guarda el costo en el detalle de venta).
- Los reportes no modifican datos; son solo de lectura.

## Tablas involucradas

Lee de casi todas las tablas; no define tablas propias. Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/reportes/rotacion` | Más y menos vendidos | Administrador |
| GET | `/reportes/rentabilidad` | Margen por producto | Administrador |
| GET | `/reportes/compras-mensuales` | Consolidado de compras | Administrador |
| GET | `/reportes/ventas-mensuales` | Consolidado de ventas | Administrador |
| GET | `/reportes/stock` | Stock y alertas | Administrador |
| GET | `/reportes/bajas` | Bajas por deterioro | Administrador |
| GET | `/reportes/ventas-vendedor` | Ventas por vendedor y turno | Administrador |

## Casos de uso

- **CU-22 Decidir compras:** el administrador consulta los más vendidos y el stock para armar el próximo pedido.
- **CU-23 Evaluar rentabilidad:** el administrador identifica productos con bajo margen para ajustar precios.
- **CU-24 Cierre mensual:** el administrador revisa el consolidado de compras y ventas del mes.

## Requisitos relacionados

RF-27 a RF-31.
