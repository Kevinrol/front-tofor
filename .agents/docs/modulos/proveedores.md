# Módulo: Proveedores

## Propósito

Centralizar la información de los proveedores de la librería en un solo lugar consultable.

## Problema que resuelve

Los datos de proveedores (razón social, marcas, tipo de material, teléfono y ciudad) están dispersos en agendas personales y fólderes sueltos, lo que dificulta encontrarlos y se pierde si cambia quien los administra.

## Funcionalidades

1. Registrar, editar y desactivar proveedores.
2. Guardar razón social, marcas que distribuye, tipo de material, teléfono y ciudad.
3. Buscar proveedores por nombre, marca, tipo de material o ciudad.
4. Ver el historial de compras de cada proveedor.
5. Asociar productos al proveedor que los abastece.

## Reglas de negocio

- Un proveedor con compras registradas no se elimina; se desactiva.
- La razón social no puede repetirse.
- Un proveedor desactivado no aparece al registrar nuevas compras.
- Solo el administrador puede crear o modificar proveedores.

## Tablas involucradas

`proveedor` (y relación con `producto` y `compra`). Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/proveedores` | Listar y buscar proveedores | Autenticado |
| GET | `/proveedores/:id` | Detalle e historial de compras | Autenticado |
| POST | `/proveedores` | Crear proveedor | Administrador |
| PATCH | `/proveedores/:id` | Editar proveedor | Administrador |
| PATCH | `/proveedores/:id/desactivar` | Desactivar proveedor | Administrador |

## Casos de uso

- **CU-08 Registrar proveedor:** el administrador ingresa los datos del proveedor que antes estaban en una agenda.
- **CU-09 Buscar proveedor:** ante un faltante, el administrador busca qué proveedor distribuye esa marca y consulta su teléfono.

## Requisitos relacionados

RF-09, RF-10.
