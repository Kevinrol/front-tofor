# Módulo: Productos e inventario

## Propósito

Mantener el catálogo de productos y su stock en tiempo real, con un kardex que explique cada movimiento y un registro formal de bajas por deterioro.

## Problema que resuelve

- Las compras se anotan en cuadernos solo como gasto: **no existe un inventario ni kardex permanente**.
- Los faltantes se detectan solo por inspección visual en estantes o cuando un cliente pide algo que no hay.
- Adhesivos, témperas y pinturas se secan o se pierden sin ningún registro de bajas.

## Funcionalidades

1. Registrar, editar, consultar y desactivar productos.
2. Clasificar por categoría (cuadernos, adhesivos, pinturas, etc.).
3. Definir precio de compra, precio minorista, precio mayorista y unidades por docena.
4. Definir stock mínimo y marcar productos perecibles.
5. Consultar stock actual con búsqueda por código o nombre.
6. Consultar el kardex por producto y rango de fechas.
7. Registrar bajas por deterioro o pérdida, con motivo.
8. Registrar ajustes de inventario (conteo físico vs. sistema), con motivo y responsable.
9. Alertas de stock bajo el mínimo.

## Reglas de negocio

- El stock **no se edita directamente**: solo cambia por movimientos (COMPRA, VENTA, BAJA, AJUSTE).
- Cada movimiento guarda cantidad, stock resultante, motivo, usuario y fecha.
- El stock no puede quedar negativo.
- Las bajas y ajustes requieren motivo obligatorio.
- Un producto con historial no se elimina; se desactiva.
- El código de producto es único.
- Un producto en o bajo su stock mínimo aparece en la lista de alertas.

## Tablas involucradas

`categoria`, `producto`, `movimiento_inventario` (ver [base de datos](../02-base-de-datos.md)).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/productos` | Listar y buscar productos | Autenticado |
| GET | `/productos/:id` | Detalle de producto | Autenticado |
| POST | `/productos` | Crear producto | Administrador |
| PATCH | `/productos/:id` | Editar producto | Administrador |
| GET | `/productos/alertas-stock` | Productos bajo el mínimo | Autenticado |
| GET | `/inventario/kardex/:productoId` | Kardex de un producto | Autenticado |
| POST | `/inventario/bajas` | Registrar baja | Administrador |
| POST | `/inventario/ajustes` | Registrar ajuste | Administrador |
| GET | `/categorias` | Listar categorías | Autenticado |

## Casos de uso

- **CU-04 Registrar producto:** el administrador da de alta un producto con sus precios y stock mínimo.
- **CU-05 Consultar stock:** un vendedor busca un producto y ve cuántas unidades hay antes de ofrecerlo.
- **CU-06 Registrar baja:** el administrador da de baja pinturas secas indicando cantidad y motivo; el kardex lo refleja.
- **CU-07 Revisar alertas:** el administrador revisa qué productos están por agotarse para planificar el pedido.

## Requisitos relacionados

RF-04, RF-05, RF-06, RF-07, RF-08, RNF-05, RNF-10.
