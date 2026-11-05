# Platea — Arquitectura y diseño técnico

## 1. Arquitectura del sistema

```text
┌──────────────────┐        QR / HTTPS        ┌────────────────────────────┐
│ Comensal (móvil) │ ───────────────────────► │  Frontend React (Vite)     │
└──────────────────┘                          │  Comensal · KDS · Admin    │
┌──────────────────┐        HTTPS             │  Mesero                    │
│ Staff (PC/tablet)│ ───────────────────────► └─────────────┬──────────────┘
└──────────────────┘                                        │
                                       REST /api + WSS Socket.io
                                                            ▼
                                              ┌──────────────────────────┐
                                              │  API Fastify 5           │
                                              │  plugins · modules       │
                                              └───┬─────────┬────────────┘
                                                  │         │
                                    Prisma Client │         │ Cloudinary SDK
                                                  ▼         ▼
                                   ┌──────────────────┐  ┌──────────────┐
                                   │ PostgreSQL 16    │  │ Cloudinary   │
                                   │ datos + tenants  │  │ imágenes     │
                                   └──────────────────┘  └──────────────┘
```

- El frontend nunca accede a la base de datos.
- La API es la única autoridad de validación, cálculo de precios y aislamiento.
- Socket.io comparte el servidor HTTP de Fastify.
- Cloudinary se usa en un endpoint separado; la DB solo guarda la URL.

## 2. Multi-tenancy

### Resolución del tenant

Cada request pasa por `src/plugins/tenant.ts`:

1. **JWT de staff** (`Authorization: Bearer`): `tenantId` sale del token. Si el token es inválido se responde 401; no se degrada a anónimo. El `SUPER_ADMIN` lleva `tenantId: null` y opera con el cliente base solo en `/api/tenants`.
2. **Sesión de comensal** (`x-session-id`): se busca la `Session` vigente, con su tenant activo, y se toma su `tenantId`.
3. **`:tenantId` de la URL**: endpoints públicos de menú.

El plugin deja:

- `request.tenantId: string | null`
- `request.db: PrismaClient` ya acotado al tenant (o el cliente base si no hay tenant).

El cliente acotado se obtiene con `getPrisma(tenantId)`; sin argumento devuelve el cliente base.

### Aislamiento de datos

`src/lib/tenant-scope.ts` define el alcance:

- Modelos con `tenantId` propio: `User`, `Table`, `Session`, `Category`, `Dish`, `Ingredient`, `Review`, `Order`.
- `Tenant`: exento (entidad raíz; lookup público por id/slug y gestión de Super Admin).
- `OrderItem` y `DishIngredient`: sin `tenantId` propio; se acceden a través de `Order`/`Dish`, que ya están acotados.

Reglas de la extensión:

| Operación | Acción |
|---|---|
| `findUnique`, `findFirst`, `findMany`, `count`, `aggregate`, `groupBy` | Añade `tenantId` al `where` |
| `update`, `updateMany`, `upsert`, `delete`, `deleteMany` | Añade `tenantId` al `where` |
| `create` | Fuerza `tenantId` en `data` |
| `createMany`, `createManyAndReturn` | Fuerza `tenantId` en cada fila |
| Relaciones anidadas | **No se procesan** (decisión de alcance) |

Reglas para el código:

- En rutas autenticadas usar siempre `request.db`; nunca importar el cliente base.
- El cliente base solo se usa para: login, resolución pública de tenant, health y tareas de Super Admin.
- Toda respuesta de "no encontrado" por tenant ajeno debe ser 404 (no revelar existencia).
- Un create anidado de un modelo con `tenantId` debe enviar `tenantId` explícito.

### Flujo de una petición

```text
Request → CORS → JWT (si hay Bearer) → tenant plugin → hook de ruta
       → validación Zod → servicio → request.db → PostgreSQL
       → respuesta { data } / { error }
```

### Super Admin

Se usa un rol `SUPER_ADMIN` en `User` con `tenantId` nullable:

- El Super Admin no pertenece a ningún restaurante (`tenantId = null`) y su JWT lo refleja.
- `/api/tenants` exige `SUPER_ADMIN` y usa el cliente base de Prisma (es la única excepción junto al login/menú/health).
- Las rutas de tenant llaman a `requireTenant()`; un token sin tenant recibe 401 aunque el JWT sea válido.
- `POST /api/tenants` puede crear el primer usuario `ADMIN` del restaurante en la misma transacción.
- `DELETE /api/tenants/:id` es borrado lógico (`isActive: false`): bloquea login, menú público y sesiones nuevas o vigentes, pero conserva el historial.
- Un token de staff ya emitido sigue siendo válido hasta su expiración (no hay revocación en el MVP).

## 3. Patrones de diseño

### Backend: arquitectura por módulos

Cada carpeta de `src/modules/` es un plugin Fastify autocontenido:

```text
modules/dishes/
├── index.ts      # registra las rutas del módulo
├── routes.ts     # endpoints + validación Zod
├── service.ts    # lógica de negocio + Prisma (patrón service/repository)
└── schema.ts     # esquemas Zod e inferencia de tipos
```

- Las rutas no contienen queries Prisma; delegan en el servicio.
- Los servicios reciben el cliente acotado (`request.db`) o el `tenantId`.
- Los eventos Socket.io se emiten **después** de confirmar la transacción.
- Los errores se lanzan hacia un manejador central.

### Frontend: componentes + stores

```text
src/
├── components/ui/        # shadcn/ui
├── components/menu/      # DishCard, filtros, rating
├── components/cart/      # carrito y notas
├── components/kds/       # tarjetas de cocina
├── components/admin/     # formularios y tablas
├── pages/customer/       # menú, carrito, estado
├── pages/kitchen/        # KDS
├── pages/waiter/         # mesero
├── pages/admin/          # panel
├── store/                # Zustand: cart, auth, socket
├── hooks/                # useSocket, useMenu, useOrders
├── lib/                  # cliente HTTP, socket, i18n, utils
└── i18n/                 # es.json, en.json
```

- Estado global mínimo: carrito del comensal, auth del staff y conexión Socket.io.
- Los datos de servidor se piden con `fetch` y se refrescan por eventos Socket.io. **No TanStack Query en MVP.**
- Componentes accesibles y mobile-first; reutilizar shadcn/ui.

### Manejo de errores

Formato implementado:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El precio debe ser mayor que cero",
    "details": []
  }
}
```

- Zod → 422 `VALIDATION_ERROR`.
- JWT ausente/inválido → 401 `UNAUTHORIZED`.
- Rol insuficiente → 403 `FORBIDDEN`.
- Recurso inexistente o de otro tenant → 404 `NOT_FOUND`.
- Conflicto de unicidad → 409 `CONFLICT`.
- Demasiadas peticiones → 429 `RATE_LIMIT`.
- Error inesperado → 500 `INTERNAL_ERROR` (sin filtrar detalles internos).

### Tiempo real

- Handshake autenticado:
  - staff: `{ token }` (JWT);
  - comensal: `{ sessionId }`.
- Rooms:
  - `kds:{tenantId}` y `waiter:{tenantId}` para staff;
  - `session:{sessionId}` y `table:{tableId}` para comensales.
- Eventos planificados: `order:new`, `order:updated`, `order:cancelled`.
- Los clientes no pueden unirse a rooms de otro tenant/sesión.
- Adapter en memoria: una sola instancia de API. Si se escala, usar Redis adapter (fuera del MVP gratuito).

## 4. Estructura de carpetas

### Backend (actual)

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/          # env validado con Zod
│   ├── lib/             # prisma, tenant-scope, cloudinary (futuro)
│   ├── middleware/      # tenantIsolation, errorHandler (futuro)
│   ├── modules/         # auth, tenants, tables, categories, dishes,
│   │                    # ingredients, sessions, orders, reviews, upload
│   ├── plugins/         # cors, jwt, tenant, socket
│   ├── types/           # auth.ts, fastify.d.ts
│   └── server.ts
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

### Frontend (Fase 2)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── kds/
│   │   ├── admin/
│   │   └── layout/
│   ├── pages/
│   │   ├── customer/
│   │   ├── kitchen/
│   │   ├── waiter/
│   │   └── admin/
│   ├── store/           # Zustand
│   ├── hooks/
│   ├── lib/
│   ├── i18n/
│   └── main.tsx
├── index.html
├── tailwind.config.ts
└── vite.config.ts
```

## 5. API Design

### Convenciones

- Base: `/api`; endpoints públicos del comensal bajo `/api/public`.
- URLs en **kebab-case** y sustantivos en plural: `/api/dishes`, `/api/order-items`.
- JSON en **camelCase**: `categoryId`, `imageUrl`, `createdAt`.
- Autenticación staff: `Authorization: Bearer <jwt>`.
- Sesión comensal: header `x-session-id`.
- Paginación: `?page=1&limit=20`; respuesta `meta: { total, page, limit }`.
- Fechas ISO 8601 en UTC.
- Precios como string decimal o número con 2 decimales, consistente por endpoint (documentar).

### Códigos HTTP

| Código | Uso |
|---|---|
| 200 | Lectura/actualización correcta |
| 201 | Recurso creado |
| 204 | Borrado sin cuerpo |
| 400 | Request malformado |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No existe o es de otro tenant |
| 409 | Conflicto de unicidad/estado |
| 422 | Validación Zod |
| 500 | Error interno |

### Formato de respuesta

```json
{
  "data": { "id": "cuid", "name": "Burger" },
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

### Endpoints implementados (MVP)

| Módulo | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Público | `GET /api/public/tenants/:tenantId/menu`, `POST /api/public/sessions`, `GET /api/public/sessions/:id` |
| Pedidos comensal | `POST /api/public/orders`, `GET /api/public/orders/:id` |
| Reviews | `POST /api/public/reviews` |
| Upload | `POST /api/upload` |
| Platos | `GET/POST /api/dishes`, `GET/PATCH/DELETE /api/dishes/:id` |
| Categorías | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id` |
| Mesas | `GET/POST /api/tables`, `PATCH/DELETE /api/tables/:id`, `GET /api/tables/:id/qr` |
| Ingredientes | `GET/POST /api/ingredients`, `PATCH/DELETE /api/ingredients/:id` |
| Pedidos staff | `GET /api/orders`, `PATCH /api/orders/:id/items/:itemId/status`, `PATCH /api/orders/:id/status` |
| Usuarios | `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` |
| Tenants (Super Admin) | `GET/POST /api/tenants`, `GET/PATCH/DELETE /api/tenants/:id` |

> Los `DELETE` de platos, categorías y mesas son borrados lógicos (`isAvailable`/`isActive`) para conservar historial.

## 6. Base de datos

### Convenciones

- Tablas en **snake_case** vía `@@map` (`tenants`, `order_items`, `dish_ingredients`).
- Columnas en **camelCase** (decisión actual; coincide con los campos Prisma y evita `@map` innecesarios).
- IDs `cuid()` en todas las entidades.
- Timestamps `createdAt` / `updatedAt` donde aplica.
- Dinero con `Decimal(10,2)`; cantidades de receta con `Decimal(10,3)`.
- Array de alérgenos: `String[]` (PostgreSQL `text[]`).
- Soft delete: en MVP se usan flags `isActive`/`isAvailable`; no hay `deletedAt`.
- Índices en `tenantId` y en combinaciones de consulta frecuente (`tenantId + status`, `tenantId + categoryId`, etc.).

### Estrategia de migraciones

- `prisma migrate dev --name <nombre>` en desarrollo (crea migración y aplica).
- `prisma migrate deploy` en CI/producción (solo aplica).
- El schema es la fuente de verdad; no editar tablas manualmente.
- Las migraciones están versionadas en `prisma/migrations/`.
- `npm run prisma:seed` crea datos de demostración idempotentes: `admin@platea.local` / `admin1234` y Super Admin `super@platea.local` / `super1234`.

### Reglas de integridad

- No borrar físicamente datos con historial; desactivar (`isActive`) cuando aplique.
- `Session.tableId` es obligatorio: toda sesión nace de un QR de mesa.
- `OrderItem.price` es histórico y no se actualiza.
- El borrado de un tenant arrastra sus datos (`onDelete: Cascade`), salvo referencias protegidas.

## 7. UI/UX Guidelines

- **Mobile-first** desde 320 px; breakpoints Tailwind (`sm`, `md`, `lg`).
- Comensal: una mano, botones grandes, carrito fijo inferior, feedback inmediato.
- Temporizador/estado de pedido visible y comprensible.
- **shadcn/ui** como base; personalizar con tokens de Tailwind, no con estilos ad hoc.
- Branding del restaurante: `primaryColor`/`secondaryColor` del tenant aplicados como variables CSS.
- Contraste mínimo WCAG AA; no depender solo del color para estados.
- ARIA labels en iconos y controles; navegación por teclado en admin/KDS.
- i18n ES/EN desde el inicio; no concatenar textos traducidos.
- Estados de carga, vacío y error explícitos en cada pantalla.
- Imágenes optimizadas (Cloudinary) con `alt` descriptivo.
- KDS legible a distancia: tipografía grande, estados con color + texto, alerta sonora opcional.

## 8. Seguridad

- HTTPS/WSS obligatorio en producción; CORS restringido a `FRONTEND_URL`.
- JWT firmado con `JWT_SECRET` de 32+ caracteres; expiración de 7 días. Sin refresh tokens en el MVP: cuando exista el frontend se valorará cookie `httpOnly` + revocación.
- Contraseñas con `scrypt` de `node:crypto` (sal aleatoria por usuario); nunca texto plano.
- Validación Zod en todos los inputs; límites de tamaño en uploads (5 MB, JPEG/PNG/WebP).
- Aislamiento por tenant en la capa Prisma + verificación de pertenencia en servicios.
- No exponer trazas internas ni datos de otros tenants en errores.
- Helmet + rate limit por IP: 300/min global, 10/min en login, 60/min en sesiones y pedidos, 30/min en reviews y 20/min en upload.
- `trustProxy` activo en producción para leer la IP real detrás de Render/Railway.
- Secretos solo en variables de entorno; `.env` fuera de Git.
