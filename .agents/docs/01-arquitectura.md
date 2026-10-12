# 01 — Arquitectura

> Stack tecnológico y arquitectura del sistema TOFOR, actualizado con las herramientas y estructura real del repositorio.

## 1. Stack tecnológico actual

| Capa | Tecnología | Estado | Descripción |
|---|---|---|---|
| **Backend (API REST)** | NestJS 11 + TypeScript | **Implementado** | Ubicado en `api-tofor/api-stock/`. Arquitectura modular y decoradores. |
| **Capa de acceso a datos** | Knex.js + driver `pg` | **Implementado** | Query builder SQL con pool de conexiones (`pg`), reemplaza ORMs pesados. |
| **Base de datos (BaaS)** | PostgreSQL 17 (Supabase) | **Implementado** | Proyecto `back_tofor` (`nduyneswqrbyinsgmfzh`), alojado en Supabase (AWS ca-central-1). |
| **Gestión de base de datos** | Supabase CLI (`supabase/`) | **Implementado** | Control de configuración local y migraciones mediante `supabase/config.toml`. |
| **Documentación de API** | Swagger (`@nestjs/swagger`) | **Implementado** | Documentación OpenAPI interactiva expuesta desde la API. |
| **Autenticación y Seguridad** | `bcryptjs` + JWT | **Implementado** | Hashing de contraseñas y control de accesos por roles y turnos. |
| **Frontend** | React 19 + TypeScript + Vite | **Implementado** | Ubicado en `front_tofor/`. Enrutamiento con `react-router-dom` v7 e iconografía Lucide. |
| **Control de versiones** | Git + GitHub | **Implementado** | Repositorio estructurado por subcarpetas de servicios. |

## 2. Estilo de arquitectura

Aplicación web **cliente-servidor** en tres capas desacopladas:

```
Navegador (React 19 + Vite)  ──HTTP / JSON──▶  API REST (NestJS 11)  ──Knex.js (pg)──▶  PostgreSQL (Supabase)
```

- **Frontend (`front_tofor`):** Interfaz reactiva SPA, consume la API REST, gestiona el estado visual y la navegación.
- **Backend (`api-tofor/api-stock`):** Contiene la lógica de negocio, validaciones de stock, cálculo de precios minorista/mayorista, autenticación y transacciones.
- **Base de datos (Supabase):** PostgreSQL relacional con soporte para RLS (Row Level Security), extensiones, tipos ENUM y triggers.

## 3. Organización por módulos

Cada dominio del sistema se modela como un módulo en NestJS y tiene su componente o vista correspondiente en el frontend, así como su ficha en `.agents/docs/modulos/`:

| Módulo | Carpeta Backend (`api-stock/src/`) | Componentes Frontend (`front_tofor/src/`) | Documentación |
|---|---|---|---|
| Autenticación y usuarios | `usuarios/` | Vistas de login y administración | `auth-usuarios.md` |
| Catálogo y Productos | `productos/`, `marcas/`, `lineas-productos/` | Catálogo de productos y gestión de stock | `productos-inventario.md` |
| Proveedores | `proveedores/` | Directorio y marcas/líneas de proveedores | `proveedores.md` |
| Pedidos y Compras | `pedidos-proveedor/`, `compras/` | Registro de pedidos y compras | `compras.md` |
| Clientes | `clientes/` | Registro de clientes mayoristas/minoristas | `clientes.md` |
| Ventas | `ventas/` | Punto de venta y emisión de cobro | `ventas.md` |
| Caja y arqueo *(Sugerido a futuro)* | `caja/` *(por implementar)* | Cuadre y apertura/cierre de turno | `caja-arqueo.md` |
| Kardex / Movimientos *(Sugerido a futuro)* | `inventario/` *(por implementar)* | Historial y trazabilidad de entradas/salidas | `productos-inventario.md` |

## 4. Estructura de carpetas del proyecto

```
tofor/
├── .agents/                                # Documentación técnica, reglas y guías del sistema
│   ├── AGENTS.md                           # Reglas de comportamiento del asistente AI
│   └── docs/
│       ├── 00-vision-general.md
│       ├── 01-arquitectura.md
│       ├── 02-base-de-datos.md
│       ├── 03-requisitos.md
│       ├── 04-despliegue.md
│       └── modulos/
│           ├── auth-usuarios.md
│           ├── caja-arqueo.md
│           ├── clientes.md
│           ├── compras.md
│           ├── productos-inventario.md
│           ├── proveedores.md
│           ├── reportes.md
│           └── ventas.md
│
├── api-tofor/
│   └── api-stock/                          # Backend en NestJS
│       ├── src/
│       │   ├── database/                   # Proveedor de conexión Knex a Supabase
│       │   │   ├── database.module.ts
│       │   │   └── database.provider.ts
│       │   ├── usuarios/                   # Módulo de usuarios y roles
│       │   ├── productos/                  # Módulo de productos y catálogo
│       │   ├── marcas/                     # Módulo de marcas
│       │   ├── lineas-productos/           # Módulo de líneas de producto
│       │   ├── proveedores/                # Módulo de proveedores
│       │   ├── app.module.ts               # Módulo raíz de la aplicación
│       │   └── main.ts                     # Punto de entrada y configuración de Swagger
│       ├── supabase/                       # Configuración de Supabase CLI
│       │   └── config.toml
│       ├── .env                            # Credenciales (DATABASE_URL a Supabase)
│       ├── package.json
│       └── tsconfig.json
│
└── front_tofor/                            # Frontend en React + Vite
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   └── ...                             # Componentes y rutas de la interfaz
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## 5. Decisiones de diseño e implementación

1. **Knex.js como Query Builder:** Brinda control directo sobre el SQL generado y optimización de consultas relacionales contra PostgreSQL sin la sobrecarga ni limitaciones de abstracción de un ORM pesado.
2. **Cálculo de precios en backend:** Las ventas aplican el `precio_minorista` o `precio_mayorista` según el tipo de cliente registrado, impidiendo modificaciones arbitrarias en el frontend.
3. **Manejo monetario preciso:** Todos los montos se gestionan con el tipo de dato SQL `numeric` (y procesados como strings/números decimales exactos), evitando imprecisiones de coma flotante.
4. **Borrado lógico (Soft Delete):** Las tablas principales (`usuarios`, `clientes`, `proveedores`, `productos`) incluyen la columna `estado boolean DEFAULT true`, preservando el histórico de compras y ventas.
5. **Transacciones atómicas:** Las operaciones que involucran múltiples tablas (como el registro de ventas con sus detalles y descuento de stock) se ejecutan dentro de bloques de transacción de Knex (`knex.transaction`).
6. **Seguridad y RLS:** La base de datos en Supabase tiene habilitado Row Level Security (RLS) en sus tablas públicas.
