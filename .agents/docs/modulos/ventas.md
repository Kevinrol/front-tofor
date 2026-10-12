# Módulo: Ventas

## Propósito

Registrar cada venta, minorista o mayorista, con sus ítems, su forma de pago y un comprobante, descontando el stock automáticamente.

## Problema que resuelve

- **Minorista:** se revisa a mano la lista de útiles, se suma con calculadora y se cobra en efectivo o QR (Yape / Altoke) **sin comprobante ni registro de los ítems despachados**.
- **Mayorista:** se anota en trozos de papel suelto, con precios preferenciales y notas de venta manuscritas eventuales.
- Sin registro de ítems, no se puede saber qué salió de los estantes ni cuadrar la caja.

## Flujo de una venta

```
Abrir caja → Buscar producto(s) → Seleccionar cliente (si es mayorista)
          → Sistema calcula precios y total → Registrar pago (efectivo / QR)
          → Se descuenta stock + kardex → Comprobante
```

## Funcionalidades

1. Buscar productos por código o nombre y agregarlos a la venta.
2. Cálculo automático de subtotales y total.
3. Aplicación automática del precio según el tipo de cliente.
4. Venta de mostrador sin cliente asociado (minorista).
5. Registro de pago en efectivo, QR o combinado, con referencia del QR.
6. Cálculo de cambio en pagos en efectivo.
7. Descuento automático de stock y registro en el kardex.
8. Generación de comprobante de venta imprimible o descargable.
9. Historial de ventas con filtros por fecha, vendedor, cliente y tipo.
10. Anulación de ventas con motivo (solo administrador), revirtiendo el stock.

## Reglas de negocio

- Solo se puede vender con una **caja abierta** del usuario.
- No se puede vender más cantidad que el stock disponible.
- El precio unitario se guarda en el detalle al momento de la venta (si el precio cambia después, la venta no se altera).
- La suma de los pagos debe ser igual al total de la venta.
- El cliente mayorista aplica `precio_mayorista`; el resto aplica `precio_minorista`.
- La venta completa se registra en una sola transacción: venta, detalle, pagos y descuento de stock, o nada.
- Una venta anulada conserva su registro con estado `ANULADA`; no se borra.
- Cada venta queda asociada al vendedor y a la caja del turno.

## Tablas involucradas

`venta`, `detalle_venta`, `pago`, `producto`, `cliente`, `caja`, `movimiento_inventario`. Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/ventas` | Registrar venta con detalle y pagos | Autenticado |
| GET | `/ventas` | Historial con filtros | Autenticado |
| GET | `/ventas/:id` | Detalle de venta | Autenticado |
| GET | `/ventas/:id/comprobante` | Comprobante imprimible | Autenticado |
| PATCH | `/ventas/:id/anular` | Anular venta con motivo | Administrador |

## Casos de uso

- **CU-16 Venta minorista:** un padre trae una lista de útiles; el vendedor agrega los productos, el sistema calcula el total, se cobra por QR y se entrega el comprobante.
- **CU-17 Venta mayorista:** una librería de barrio compra por docenas; el vendedor selecciona al cliente y el sistema aplica el precio preferencial.
- **CU-18 Anular venta:** el administrador anula una venta errónea y el stock se restituye.

## Requisitos relacionados

RF-18 a RF-23, RNF-02, RNF-05, RNF-10.
