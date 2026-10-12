# Sistema Web de Control de Stock y Gestión de Ventas — Librería TOFOR

Proyecto de grado (Técnico Superior en Sistemas) — Instituto Técnico Comercial INCOS El Alto.

## Descripción

Sistema web para la Librería Tiahunacota / TOFOR (Villa Dolores, El Alto, Bolivia) que reemplaza el control manual de inventario, compras y ventas por un sistema centralizado con kardex, registro de clientes mayoristas, comprobantes de venta, arqueo de caja y reportes.

## Documentación

| Documento | Contenido |
|---|---|
| [Visión general](docs/00-vision-general.md) | Contexto, problema, objetivos y alcance |
| [Arquitectura](docs/01-arquitectura.md) | Stack propuesto y estructura de carpetas |
| [Base de datos](docs/02-base-de-datos.md) | Entidades, relaciones y reglas |
| [Requisitos](docs/03-requisitos.md) | Funcionales y no funcionales |
| [Despliegue](docs/04-despliegue.md) | Instalación y variables de entorno |

### Módulos

| Módulo | Documento |
|---|---|
| Autenticación y usuarios | [auth-usuarios](docs/modulos/auth-usuarios.md) |
| Productos e inventario | [productos-inventario](docs/modulos/productos-inventario.md) |
| Proveedores | [proveedores](docs/modulos/proveedores.md) |
| Compras | [compras](docs/modulos/compras.md) |
| Clientes | [clientes](docs/modulos/clientes.md) |
| Ventas | [ventas](docs/modulos/ventas.md) |
| Caja y arqueo | [caja-arqueo](docs/modulos/caja-arqueo.md) |
| Reportes | [reportes](docs/modulos/reportes.md) |

## Estructura del repositorio

```
tofor/
├── .agents/        # documentación (esta carpeta) y agentes de IA
├── backend/     # API
└── frontend/    # aplicación web
```

## Estado del proyecto

- [x] Análisis del contexto institucional
- [ ] Diseño de base de datos
- [ ] Backend
- [ ] Frontend
- [ ] Pruebas y despliegue

## Autor

Kevin Rolando Ticona Yujra
