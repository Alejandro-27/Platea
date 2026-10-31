# 🍽️ Platea — Sistema de Carta Digital para Restaurantes

SaaS **multi-tenant** que digitaliza la carta de un restaurante y permite recibir pedidos desde la mesa del comensal escaneando un código QR. El comensal no descarga ninguna app ni crea una cuenta.

Cada restaurante (tenant) gestiona su propia carta, mesas, personal, inventario y pedidos, con aislamiento estricto de datos entre tenants.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** (Fase 2) | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand + react-i18next + socket.io-client + html5-qrcode |
| **Backend** | Node.js 20+ (probado con 24) + TypeScript 5.9 + Fastify 5 |
| **Base de datos** | PostgreSQL 16 + Prisma ORM 6 |
| **Validación** | Zod 4 |
| **Autenticación** | JWT propio con `@fastify/jwt` |
| **Tiempo real** | Socket.io (rooms por tenant, mesa y sesión) |
| **Subida de imágenes** | `@fastify/multipart` + Cloudinary |
| **Infraestructura gratuita** | Render/Railway (API), Vercel/Cloudflare Pages (web), Supabase/Neon (DB), Cloudinary (imágenes) |

> El frontend aún no está creado. Esta primera etapa desarrolla el backend y la base de datos. La Fase 2 añade la aplicación React.

---

## Requisitos previos

- **Node.js 20 o superior** (recomendado 20/22; probado con 24)
- **npm 10+**
- **Docker** y **Docker Compose** (para PostgreSQL local)
- **Git**

Verifica las versiones:

```bash
node --version
npm --version
docker --version
docker compose version
```

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone git@github.com:Alejandro-27/Platea.git
cd Platea
git switch develop
```

La rama `develop` es la rama de integración. `main` se reserva para producción.

### 2. Configurar variables de entorno

Copia la plantilla de la raíz al backend (Prisma y Fastify leen `backend/.env`):

```bash
cp .env.example backend/.env
```

Edita `backend/.env` y cambia, como mínimo:

- `JWT_SECRET` por un secreto de 32+ caracteres (`openssl rand -hex 32`)
- Las credenciales de Cloudinary (para el módulo de imágenes)

> `backend/.env` está en `.gitignore`; nunca lo subas al repositorio.

### 3. Levantar PostgreSQL con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d
docker compose ps
```

El servicio `platea-db` queda escuchando en `localhost:5432` con las credenciales de desarrollo definidas en `docker-compose.yml`.

### 4. Preparar e iniciar el backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

`npm install` ejecuta `prisma generate` (postinstall). `migrate deploy` aplica las migraciones existentes sin crear nuevas.

La API queda disponible en:

- Health check: <http://localhost:3000/health>
- Socket.io: `ws://localhost:3000`

### 5. Frontend (Fase 2 — pendiente)

La carpeta `frontend/` todavía no existe. Cuando se cree, la instalación será:

```bash
cd frontend
npm install
npm run dev
```

Disponible en <http://localhost:5173> (debe coincidir con `FRONTEND_URL`).

---

## Estructura del proyecto

```text
Platea/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo multi-tenant
│   │   └── migrations/            # Migraciones versionadas
│   ├── src/
│   │   ├── config/                # Validación de variables de entorno
│   │   ├── lib/                   # Prisma, aislamiento tenant, utilidades
│   │   ├── middleware/            # Middlewares transversales
│   │   ├── modules/               # Módulos de negocio (auth, dishes, orders...)
│   │   ├── plugins/               # CORS, JWT, tenant, Socket.io
│   │   ├── types/                 # Augmentations de Fastify y JWT
│   │   └── server.ts              # Entry point de la API
│   ├── prisma.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # Fase 2 (pendiente)
├── .github/
│   ├── MEMORY.md                  # Decisiones y contexto acumulado
│   ├── DESIGN.md                  # Arquitectura y convenciones técnicas
│   ├── AGENTS.md                  # Guía de trabajo para agentes
│   ├── SKILLS.md                  # Habilidades técnicas del proyecto
│   ├── ROADMAP.md                 # Plan por fases
│   └── CONVENTIONS.md             # Commits, ramas y estilo
├── .env.example                   # Plantilla de variables (raíz)
├── .dockerignore
├── .gitignore
├── docker-compose.yml             # Solo PostgreSQL
├── opencode.json                  # Contexto cargado por OpenCode
└── README.md
```

---

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL | `postgresql://platea_user:platea_pass@localhost:5432/platea_db` |
| `JWT_SECRET` | Sí | Secreto para firmar JWT (mín. 32 caracteres) | `openssl rand -hex 32` |
| `CLOUDINARY_CLOUD_NAME` | Sí para upload | Nombre del cloud de Cloudinary | `mi-cloud` |
| `CLOUDINARY_API_KEY` | Sí para upload | API key de Cloudinary | — |
| `CLOUDINARY_API_SECRET` | Sí para upload | API secret de Cloudinary | — |
| `PORT` | No (3000) | Puerto HTTP de la API | `3000` |
| `FRONTEND_URL` | No (5173) | Origen permitido por CORS y Socket.io | `http://localhost:5173` |
| `NODE_ENV` | No (`development`) | Entorno de ejecución | `development` / `production` |

En producción, `DATABASE_URL` apunta a Supabase/Neon y normalmente incluye `?sslmode=require`.

---

## Comandos útiles

### Backend (`cd backend`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm test` | Self-check del aislamiento multi-tenant |
| `npm run prisma:generate` | Genera el cliente Prisma |
| `npm run prisma:migrate` | Crea/aplica una migración en desarrollo |
| `npm run prisma:studio` | Abre Prisma Studio |

### Prisma

| Comando | Descripción |
|---|---|
| `npx prisma migrate deploy` | Aplica migraciones pendientes (dev/producción) |
| `npx prisma migrate dev --name nombre` | Crea una migración a partir de cambios del schema |
| `npx prisma studio` | Interfaz visual de la base de datos |
| `npx prisma validate` | Valida el schema |

### Docker

| Comando | Descripción |
|---|---|
| `docker compose up -d` | Levanta PostgreSQL en segundo plano |
| `docker compose ps` | Estado y healthcheck del contenedor |
| `docker compose logs -f platea-db` | Logs de PostgreSQL |
| `docker compose down` | Detiene el contenedor conservando los datos |
| `docker compose down -v` | **Borra también el volumen** (pierde los datos) |
| `docker compose exec platea-db psql -U platea_user -d platea_db` | Consola SQL |

---

## Flujo de Git

- `main`: producción. Solo recibe merges desde `develop`.
- `develop`: integración de todas las funcionalidades.
- `feature/nombre-feature`: nuevas funcionalidades.
- `fix/nombre-bug`: correcciones no urgentes.
- `hotfix/nombre-critico`: correcciones urgentes sobre producción.

Ejemplo:

```bash
git switch develop
git pull origin develop
git switch -c feature/modulo-dishes
# ... cambios ...
git add .
git commit -m "feat(backend): agregar CRUD de platos"
git push -u origin feature/modulo-dishes
```

Se usan **Conventional Commits** (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`). El detalle está en [`.github/CONVENTIONS.md`](.github/CONVENTIONS.md).

---

## Roadmap

### Fase 0 — Setup (completada)

- [x] Definición de stack y arquitectura
- [x] Repositorio y rama `develop`
- [x] PostgreSQL con Docker
- [x] Estructura base del backend
- [x] README y archivos de contexto

### Fase 1 — Backend Core (en progreso)

- [x] Schema de Prisma completo
- [x] Migración inicial
- [ ] Auth JWT (registro/login de staff)
- [ ] CRUD Tenants (Super Admin)
- [ ] CRUD Users, Tables + QR, Categories, Dishes + upload, Ingredients
- [ ] Sesiones anónimas, Orders, Reviews
- [ ] Integración completa de Socket.io

### Fase 2 — Frontend Core (pendiente)

- [ ] Vite + React + TypeScript, Tailwind y shadcn/ui
- [ ] i18n ES/EN
- [ ] Vista comensal (menú, carrito, estado del pedido)
- [ ] KDS, panel admin y vista mesero
- [ ] Integración Socket.io y upload de imágenes

### Fase 3 — Testing y deploy (pendiente)

- [ ] Tests unitarios y E2E
- [ ] Dockerfile de producción
- [ ] Deploy de API, web y base de datos
- [ ] Smoke tests en producción

El roadmap detallado, incluyendo v1.5, está en [`.github/ROADMAP.md`](.github/ROADMAP.md).

---

## Documentación de desarrollo

| Documento | Contenido |
|---|---|
| [`.github/MEMORY.md`](.github/MEMORY.md) | Visión, decisiones tomadas, modelo de datos y reglas de negocio |
| [`.github/DESIGN.md`](.github/DESIGN.md) | Arquitectura, multi-tenancy, API, base de datos y UI/UX |
| [`.github/AGENTS.md`](.github/AGENTS.md) | Rol, calidad y reglas para agentes de desarrollo |
| [`.github/SKILLS.md`](.github/SKILLS.md) | Habilidades técnicas requeridas |
| [`.github/ROADMAP.md`](.github/ROADMAP.md) | Plan por fases |
| [`.github/CONVENTIONS.md`](.github/CONVENTIONS.md) | Commits, ramas, estilo y formato de API |

`opencode.json` carga automáticamente `MEMORY`, `DESIGN`, `AGENTS` y `CONVENTIONS` como instrucciones del proyecto.

---

## Seguridad

- No versionar `.env` ni credenciales reales.
- Cambiar `JWT_SECRET` y las claves de Cloudinary antes de desplegar.
- Las credenciales de `docker-compose.yml` son **solo para desarrollo local**.
- Todas las queries de negocio deben filtrar por `tenantId`; el aislamiento se aplica con la extensión de Prisma descrita en `DESIGN.md`.
- HTTPS/WSS obligatorio en producción.
