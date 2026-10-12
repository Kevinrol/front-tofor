# Módulo: Clientes

## Propósito

Identificar de forma objetiva a los clientes, en especial a los mayoristas, para aplicar siempre la tarifa que les corresponde sin depender de la memoria del vendedor.

## Problema que resuelve

Los mayoristas (pequeñas librerías de barrio) se reconocen solo de forma visual y de memoria por el vendedor de turno. Cuando el personal rota, los precios son inconsistentes y aparecen reclamos.

## Tipos de cliente

| Tipo | Descripción | Precio aplicado |
|---|---|---|
| Minorista | Estudiantes, padres de familia y docentes. No requiere registro obligatorio | `precio_minorista` |
| Mayorista | Pequeñas librerías que compran por docenas o cajas para reventa. Registro obligatorio | `precio_mayorista` |

## Funcionalidades

1. Registrar, editar y desactivar clientes mayoristas con nombre, negocio y teléfono.
2. Registro rápido opcional de clientes minoristas frecuentes.
3. Buscar clientes por nombre, negocio o teléfono desde la pantalla de venta.
4. Consultar el historial de compras de cada cliente.
5. Ver el total comprado por cliente en un período.

## Reglas de negocio

- Todo cliente mayorista debe estar registrado para recibir el precio mayorista.
- El tipo de cliente determina la tarifa; el vendedor no puede cambiarla manualmente.
- Un cliente con ventas no se elimina; se desactiva.
- La venta a un minorista puede hacerse sin cliente asociado (venta de mostrador).
- Solo el administrador puede cambiar el tipo de cliente.

## Tablas involucradas

`cliente`, `venta`. Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/clientes` | Listar y buscar clientes | Autenticado |
| GET | `/clientes/:id` | Detalle e historial | Autenticado |
| POST | `/clientes` | Crear cliente | Autenticado |
| PATCH | `/clientes/:id` | Editar cliente | Administrador |
| PATCH | `/clientes/:id/desactivar` | Desactivar cliente | Administrador |

## Casos de uso

- **CU-13 Registrar mayorista:** el administrador registra una librería de barrio como cliente mayorista.
- **CU-14 Identificar cliente en venta:** el vendedor busca al cliente y el sistema aplica su tarifa automáticamente.
- **CU-15 Consultar historial:** el administrador revisa qué ha comprado un mayorista en el último mes.

## Requisitos relacionados

RF-15, RF-16, RF-17.
