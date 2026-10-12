# Módulo: Compras

## Propósito

Registrar los pedidos a proveedores y la recepción de mercadería, de modo que cada compra alimente automáticamente el inventario.

## Problema que resuelve

- Las notas de pedido son físicas y **no se cruzan sistemáticamente con lo realmente recibido**.
- Las compras se anotan en cuadernos (cantidades, código, producto, subtotal, precio por docena y total), documentando solo el gasto, sin actualizar inventario.

## Flujo

```
Detectar faltante → Nota de pedido (PEDIDO) → Recepción de mercadería (RECIBIDA)
                                                  └→ aumenta stock + kardex
```

## Funcionalidades

1. Crear una nota de pedido seleccionando proveedor y productos con cantidad y precio por docena.
2. Registrar la recepción indicando la cantidad realmente recibida de cada ítem.
3. Comparar lo pedido contra lo recibido y mostrar diferencias.
4. Al confirmar la recepción, aumentar el stock y registrar el movimiento en el kardex.
5. Anular una compra (revierte el stock si ya fue recibida).
6. Consultar el historial de compras por proveedor, producto y fechas.
7. Calcular subtotales y total automáticamente.

## Reglas de negocio

- Estados de una compra: `PEDIDO`, `RECIBIDA`, `ANULADA`.
- Solo las compras `RECIBIDA` modifican el stock.
- La cantidad recibida puede ser distinta de la pedida; el stock aumenta según lo **recibido**.
- El precio por docena se convierte a unidad usando `unidades_por_docena` del producto.
- Una compra recibida puede actualizar el `precio_compra` del producto (confirmar con el administrador).
- Al anular una compra recibida, el stock no puede quedar negativo.
- Solo el administrador gestiona compras.

## Tablas involucradas

`compra`, `detalle_compra`, `proveedor`, `producto`, `movimiento_inventario`. Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/compras` | Listar compras con filtros | Administrador |
| GET | `/compras/:id` | Detalle con pedido vs. recibido | Administrador |
| POST | `/compras` | Crear nota de pedido | Administrador |
| POST | `/compras/:id/recibir` | Registrar recepción de mercadería | Administrador |
| PATCH | `/compras/:id/anular` | Anular compra | Administrador |

## Casos de uso

- **CU-10 Crear nota de pedido:** el administrador detecta faltantes y arma el pedido a un proveedor.
- **CU-11 Recibir mercadería:** llega el pedido; se registran las cantidades recibidas y se actualiza el stock.
- **CU-12 Revisar diferencias:** se identifican ítems pedidos que no llegaron completos.

## Requisitos relacionados

RF-11, RF-12, RF-13, RF-14, RNF-05.
