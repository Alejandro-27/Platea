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
2. **Aislamiento con Prisma Client Extensions**: `tenantClient(tenantId)` intercepta operaciones y:
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
- JWT propio con `@fastify/jwt`
- Socket.io
- `@fastify/multipart` para subida de archivos (no se usa Multer en este backend)
- Cloudinary
- `dotenv`

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
| `User` | Staff del tenant | `email`, `passwordHash`, `role` (`ADMIN`, `STAFF`, `KITCHEN`), `tenantId` |
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
- Backend inicializado con Fastify 5, Prisma 6 y TypeScript 5.9.
- Schema completo + migración inicial aplicada (`prisma/migrations/20261027210715_init`).
- Base de datos local con Docker (`platea-db`, PostgreSQL 16).
- Plugins base: CORS, JWT, tenant, Socket.io.
- Extensión de aislamiento multi-tenant implementada y probada.
- Documentación de contexto creada (este directorio `.github/`).
- **Módulos de negocio aún no implementados.**
- **Frontend aún no iniciado (Fase 2).**

## Pendientes conocidos

- Definir el diseño de **Super Admin** (el schema actual no tiene rol `SUPER_ADMIN` ni `tenantId` opcional).
- Implementar auth staff, sesiones, upload, CRUDs, orders, reviews y eventos Socket.io.
- Decidir si una cancelación posterior a `PREPARING` repone stock.
- Configurar ESLint + Prettier y reformatear el backend (el código actual usa punto y coma).
- Añadir helmet y rate limiting antes de producción.
- Seed de datos de demostración.
- Frontend completo y despliegue.
