# Platea — Memoria del proyecto

> Contexto acumulado y decisiones cerradas. Leer antes de implementar cualquier cambio.
> Este archivo se carga automáticamente en OpenCode (ver `opencode.json`).

## Visión del proyecto

Platea es un **SaaS multi-tenant de carta digital y pedidos para restaurantes**. Cada restaurante (tenant) digitaliza su carta, genera un QR por mesa y recibe pedidos del comensal en tiempo real. El comensal usa el navegador del móvil: sin app nativa y sin registro.

Módulos del MVP:

1. **Comensal** (web mobile-first): menú por QR, filtros, fotos, alérgenos, calificaciones, carrito con notas y estado del pedido en tiempo real.
2. **Cocina (KDS)**: pedidos entrantes en tiempo real, cambio de estado, alertas sonoras.
3. **Mesero**: estado de mesas y pedidos, marcar como servido.
4. **Admin del restaurante**: platos, categorías, mesas/QR, agotados, inventario básico, configuración, historial.
5. **Super Admin**: gestión de tenants y métricas globales básicas.

## Decisiones arquitectónicas clave

1. **Multi-tenancy por `tenantId`**: todas las tablas de negocio relevantes llevan `tenantId`. `Tenant` es la entidad raíz y no se filtra por sí misma. `OrderItem` y `DishIngredient` heredan el tenant a través de `Order`/`Dish`.
2. **Aislamiento con Prisma Client Extensions**: `getPrisma(tenantId)` intercepta operaciones y:
   - inyecta `tenantId` en `where` para lecturas y escrituras;
   - fuerza `tenantId` en `data` para creaciones (ignora el valor enviado por el cliente);
   - **no** procesa relaciones anidadas. Un create anidado de un modelo con `tenantId` debe enviarlo explícitamente o fallará por NOT NULL.
3. **Sesiones anónimas para comensales**: el QR abre `/menu/{tenantId}?table={tableId}`. El backend crea una `Session` anónima con `tableId` obligatorio y `expiresAt`. El frontend persiste `sessionId` y `tableId` en `localStorage` para sobrevivir recargas.
4. **Inventario al pasar a `PREPARING`**: el stock de ingredientes se descuenta cuando el pedido/ítem entra en preparación, **nunca al crear el pedido**. Debe ser idempotente y ejecutarse en transacción.
5. **Upload de imágenes en dos pasos**: `POST /api/upload` recibe el archivo y devuelve la URL de Cloudinary; después `POST/PATCH /api/dishes` recibe esa URL como string en `imageUrl`.
6. **Precio congelado**: `OrderItem.price` guarda el precio del plato al momento del pedido; los cambios posteriores de precio no alteran pedidos pasados.
7. **IDs `cuid()`** generados por Prisma, no UUID.
8. **Dinero con `Decimal`**: `Decimal(10,2)`. En JSON se convierte a número solo para presentación; no hacer aritmética de dinero en el frontend.
9. **Respuestas API**: sobre `{ data, meta }` y `{ error: { code, message, details } }` para los módulos nuevos (ver `DESIGN.md`). `/health` es la excepción actual.
10. **Tiempo real**: Socket.io en una sola instancia (adapter en memoria). Rooms autenticados en el handshake.

## Stack confirmado

### Backend
- Node.js 20+ (local: 24)
- TypeScript 5.9 en modo estricto (TS 7 aún no es compatible con ts-node; no actualizar sin migrar el runner)
- Fastify 5 + `fastify-plugin`
- Prisma 6.19 + PostgreSQL 16
- Zod 4 para validación
- JWT propio con `@fastify/jwt` + `fast-jwt` (firma/verificación, expiración 7 días)
- Contraseñas con `scrypt` de `node:crypto` (sin bcrypt/argon2)
- Socket.io
- `@fastify/helmet` para cabeceras de seguridad
- `@fastify/rate-limit` para límites por IP
- `@fastify/multipart` para subida de archivos (no se usa Multer en este backend)
- Cloudinary
- `dotenv`
- ESLint + Prettier para lint y formato

### Frontend (Fase 2)
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand para estado global
- react-i18next (ES/EN)
- socket.io-client
- html5-qrcode (generación/lectura de QR en admin)
- React Router para el enrutamiento

> **TanStack Query no forma parte del MVP.** No añadirla sin aprobación explícita; Zustand + fetch + Socket.io cubren las necesidades actuales. Se evaluará después del MVP.

### Infraestructura gratuita
- Frontend: Vercel o Cloudflare Pages
- Backend: Render (free) o Railway
- DB: Supabase (PostgreSQL) o Neon
- Imágenes: Cloudinary (25 GB)
- Email: Resend (3.000/mes) — sin uso todavía

## Modelo de datos principal

| Entidad | Rol | Campos clave |
|---|---|---|
| `Tenant` | Restaurante | `slug`, `name`, `logoUrl`, colores, `isActive`, `subscriptionPlan` |
| `User` | Staff del tenant o Super Admin | `email`, `passwordHash`, `role` (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `KITCHEN`), `tenantId` (nullable; `null` solo para `SUPER_ADMIN`) |
| `Table` | Mesa física | `number`, `qrCode` único, `isActive`, `tenantId` |
| `Session` | Comensal anónimo | `tenantId`, `tableId` **obligatorio**, `expiresAt`, `lastActiveAt` |
| `Category` | Categoría del menú | `name`, `slug`, `sortOrder`, `isActive`, `tenantId` |
| `Dish` | Plato | `price`, `imageUrl`, `isOutOfStock`, filtros/alérgenos, rating, `categoryId`, `tenantId` |
| `Ingredient` | Ingrediente | `unit`, `currentStock`, `minStock`, `costPerUnit`, `tenantId` |
| `DishIngredient` | Receta N:M | `dishId`, `ingredientId`, `quantity` |
| `Review` | Calificación | `rating` (1-5), `comment`, `dishId`, `sessionId`, `tenantId` |
| `Order` | Pedido | `status`, `tableId`, `sessionId`, `total`, `notes`, `tenantId` |
| `OrderItem` | Línea de pedido | `dishId`, `quantity`, `notes`, `price` congelado, `itemStatus` |

### Relaciones
- `Tenant` 1:N `User`, `Table`, `Category`, `Dish`, `Ingredient`, `Order`, `Session`
- `Category` 1:N `Dish`
- `Dish` N:M `Ingredient` (vía `DishIngredient`)
- `Session` 1:N `Order`, `Review`
- `Order` 1:N `OrderItem`
- `OrderItem` N:1 `Dish`
- `Table` 1:N `Session`, `Order`

### Estados
- `OrderStatus`: `PENDING → PREPARING → READY → SERVED`, más `CANCELLED`.
- `OrderItemStatus`: `PENDING → PREPARING → READY → SERVED`.

## Reglas de negocio críticas

- El comensal accede por QR **sin registro**; la sesión es anónima y expira.
- El `tableId` del QR se guarda en la `Session` y en el estado del frontend.
- Los pedidos y cambios de estado se propagan por Socket.io:
  - `order:new` → room de cocina del tenant.
  - `order:updated` → rooms de cocina, sesión del comensal y mesa.
- La cocina usa **KDS**; en v1 no hay impresión automática de tickets.
- Multi-idioma **ES/EN desde el primer día**.
- El comensal puede añadir notas por plato ("sin cebolla", "término medio").
- Las calificaciones son 1-5 por plato; el promedio se mantiene en `Dish`.
- Un plato agotado (`isOutOfStock`) no puede pedirse.
- Un pedido solo se crea desde una sesión vigente y con un `tableId` válido del tenant.
- El total del pedido se calcula en el backend con los precios de la base de datos, nunca se confía en el precio del cliente.

## Restricciones

- **Solo tecnologías gratuitas** para el MVP.
- **No pagos online** en v1 (Stripe/MercadoPago quedan para v1.5).
- **No delivery** en v1.
- **No app nativa**.
- **No fidelización, BI avanzado, reservas ni impresión automática** en v1.
- **No añadir librerías** fuera del stack sin aprobación.
- Aislamiento estricto entre tenants; HTTPS/WSS obligatorio en producción.
- Mobile-first desde 320 px; carga inicial del menú < 2 s en 4G (objetivo).

## Estado actual

- Repositorio: `git@github.com:Alejandro-27/Platea.git`, rama de trabajo `develop`.
- Backend con Fastify 5, Prisma 6 y TypeScript 5.9.
- Schema completo con dos migraciones aplicadas: `20261027210715_init` y `20261105171625_super_admin`.
- Base de datos local con Docker (`platea-db`, PostgreSQL 16).
- Plugins: CORS, Helmet, rate limit, JWT, tenant, Socket.io.
- Aislamiento multi-tenant con `getPrisma(tenantId)` y self-check.
- Autenticación staff con `scrypt` y JWT de 7 días.
- Módulos implementados: auth, users, categories, dishes (con receta), ingredients, tables (+ QR), sessions anónimas, menú público, orders (estados + descuento de stock), reviews, upload a Cloudinary y tenants (Super Admin).
- `buildApp()` exportado para tests y `start()` para ejecución.
- Manejo centralizado de errores con formato `{ error: { code, message, details } }`.
- Seed idempotente con tenant demo, mesas, categoría, platos e ingrediente. Credenciales: `admin@platea.local` / `admin1234` y Super Admin `super@platea.local` / `super1234`.
- Eventos Socket.io verificados con un cliente real (`order:new`, `order:updated`) y rooms aislados por tenant/sesión.
- **Frontend aún no iniciado (Fase 2).**

## API implementada (MVP)

| Módulo | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Usuarios | `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` |
| Categorías | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id` |
| Platos | `GET/POST /api/dishes`, `GET/PATCH/DELETE /api/dishes/:id` |
| Ingredientes | `GET/POST /api/ingredients`, `PATCH/DELETE /api/ingredients/:id` |
| Mesas | `GET/POST /api/tables`, `PATCH/DELETE /api/tables/:id`, `GET /api/tables/:id/qr` |
| Upload | `POST /api/upload` (multipart, solo ADMIN) |
| Público | `GET /api/public/tenants/:tenantId/menu`, `POST /api/public/sessions`, `GET /api/public/sessions/:id` |
| Pedidos comensal | `POST /api/public/orders`, `GET /api/public/orders/:id` |
| Reviews | `POST /api/public/reviews` |
| Pedidos staff | `GET /api/orders`, `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/items/:itemId/status` |
| Tenants (Super Admin) | `GET/POST /api/tenants`, `GET/PATCH/DELETE /api/tenants/:id` |

Reglas de seguridad de la API:

- Escrituras de catálogo y usuarios: `ADMIN`.
- Lecturas de catálogo y pedidos: cualquier staff autenticado con tenant.
- Upload: `ADMIN`.
- Super Admin: solo `/api/tenants`; las rutas de tenant lo rechazan (401) y no ve datos de ningún restaurante.
- Rutas públicas exigen `x-session-id` vigente salvo menú y creación de sesión.
- El total del pedido se calcula en el backend con precios de la DB.
- Rate limit por IP: 300/min global, 10/min en login, 60/min en sesiones y pedidos, 30/min en reviews, 20/min en upload.

## Pendientes conocidos

- Decidir si una cancelación posterior a `PREPARING` repone stock.
- **Refresh tokens**: no se implementan en el MVP. El JWT dura 7 días; cuando exista el frontend se revisará con cookie `httpOnly` y revocación. Desactivar un tenant bloquea nuevos logins y sesiones, pero un token de staff ya emitido sigue vigente hasta expirar.
- Frontend completo y despliegue.
- `npm audit`: 0 vulnerabilidades en runtime; quedan 10 moderadas en tooling de ESLint (`minimatch`), sin impacto en producción. Se fijó `deepmerge-ts` 8.0.2 vía `overrides` para cerrar las 3 altas de Prisma sin migrar a v7.
