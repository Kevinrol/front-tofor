# 04 — Despliegue e instalación

> Pasos **propuestos** para el stack NestJS + Prisma + PostgreSQL. Ajustar cuando se defina el entorno final.

## 1. Requisitos previos

- Node.js (versión LTS)
- PostgreSQL
- Git

## 2. Instalación del backend

```bash
git clone <url-del-repositorio>
cd tofor/backend
npm install
cp .env.example .env      # luego editar los valores
npx prisma migrate dev    # crea las tablas
npx prisma db seed        # crea roles y usuario administrador inicial
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.

## 3. Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://usuario:clave@localhost:5432/tofor` |
| `JWT_SECRET` | Clave secreta para firmar los tokens | (cadena larga y aleatoria) |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `PORT` | Puerto de la API | `3000` |

> No subir el archivo `.env` al repositorio. Solo se versiona `.env.example`.

## 4. Instalación del frontend

```bash
cd tofor/frontend
npm install
npm start
```

## 5. Despliegue en producción (por definir)

Opciones a evaluar con el tutor:

- Servidor propio o VPS con PostgreSQL local.
- Servicio en la nube con base de datos administrada.
- Equipo local en la librería (si la conexión a internet no es confiable).

## 6. Respaldo

- Copia diaria de la base de datos con `pg_dump`.
- Guardar las copias fuera del equipo donde corre el sistema.
- Probar la restauración periódicamente.

## 7. Datos iniciales

El `seed` debe crear: roles (ADMINISTRADOR, VENDEDOR), un usuario administrador (cambiar su contraseña en el primer ingreso) y categorías base de productos.
