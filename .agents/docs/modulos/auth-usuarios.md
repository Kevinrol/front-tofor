# Módulo: Autenticación y usuarios

## Propósito

Controlar quién entra al sistema y qué puede hacer. La librería tiene administración familiar y 7 vendedores en distintos turnos, por lo que cada persona necesita su propio usuario para saber quién registró cada operación.

## Problema que resuelve

Hoy no existe registro de quién atendió cada venta o anotó cada compra; todo queda en cuadernos y papeles sin responsable identificable.

## Roles

| Rol | Permisos |
|---|---|
| Administrador | Todo: usuarios, productos, compras, anulaciones, reportes, configuración |
| Vendedor | Registrar ventas, consultar stock y clientes, abrir y cerrar su caja |

## Funcionalidades

1. Inicio y cierre de sesión.
2. Crear, editar y desactivar usuarios (solo administrador).
3. Asignar rol y turno (tiempo completo / medio tiempo).
4. Cambiar contraseña propia.
5. Restablecer contraseña de otro usuario (solo administrador).

## Reglas de negocio

- Las contraseñas se guardan con hash, nunca en texto plano.
- Un usuario desactivado no puede iniciar sesión pero conserva su historial.
- Los usuarios no se eliminan si tienen ventas, compras o movimientos asociados.
- Cada operación del sistema registra el usuario que la realizó.

## Tablas involucradas

`rol`, `usuario` (ver [base de datos](../02-base-de-datos.md)).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/login` | Iniciar sesión, devuelve token | Público |
| GET | `/auth/perfil` | Datos del usuario actual | Autenticado |
| PATCH | `/auth/cambiar-contrasena` | Cambiar contraseña propia | Autenticado |
| GET | `/usuarios` | Listar usuarios | Administrador |
| POST | `/usuarios` | Crear usuario | Administrador |
| PATCH | `/usuarios/:id` | Editar usuario | Administrador |
| PATCH | `/usuarios/:id/desactivar` | Desactivar usuario | Administrador |

## Casos de uso

- **CU-01 Iniciar sesión:** el usuario ingresa credenciales; el sistema valida y entrega acceso según su rol.
- **CU-02 Gestionar usuarios:** el administrador crea el usuario de un nuevo vendedor y le asigna rol y turno.
- **CU-03 Desactivar usuario:** el administrador desactiva a un vendedor que deja de trabajar; su historial se conserva.

## Requisitos relacionados

RF-01, RF-02, RF-03, RNF-03, RNF-04, RNF-10.
