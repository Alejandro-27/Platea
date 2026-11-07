# Platea — Roadmap

## Fase 0 — Setup (completada)

- [x] Definición de stack y arquitectura
- [x] Creación del repositorio y rama `develop`
- [x] Configuración de Docker (PostgreSQL 16)
- [x] Estructura de carpetas del backend
- [ ] Estructura de carpetas del frontend (Fase 2)
- [x] README.md y archivos de contexto (`.github/`)

## Fase 1 — Backend Core (MVP) — completada

- [x] Schema de Prisma completo
- [x] Migraciones (inicial + Super Admin)
- [x] Auth JWT (login de staff y `/me`; alta de usuarios desde el admin)
- [x] CRUD Tenants (Super Admin) con rol `SUPER_ADMIN` y `tenantId` nullable
- [x] CRUD Users (Admin restaurante)
- [x] CRUD Tables + generación de QR
- [x] CRUD Categories
- [x] CRUD Dishes + upload de imágenes
- [x] CRUD Ingredients (inventario básico)
- [x] Sesiones anónimas para comensales
- [x] Orders (creación, estados, descuento de stock en `PREPARING`)
- [x] Reviews (calificaciones)
- [x] Integración completa de Socket.io (rooms y eventos verificados con cliente real)
- [x] Manejo centralizado de errores y respuestas `{ data }` / `{ error }`
- [x] Seed de datos de demostración
- [x] Helmet + rate limiting
- [x] ESLint + Prettier

## Fase 2 — Frontend Core (MVP) — pendiente

- [ ] Setup Vite + React 18 + TypeScript
- [ ] Tailwind CSS + shadcn/ui
- [ ] i18n ES/EN
- [ ] Vista Comensal (menú, carrito, estado del pedido)
- [ ] Vista KDS (cocina en tiempo real)
- [ ] Vista Admin (dashboard, platos, mesas, inventario)
- [ ] Vista Mesero (gestión de mesas)
- [ ] Integración Socket.io en el cliente
- [ ] Upload de imágenes desde el admin
- [ ] Persistencia de `sessionId`/`tableId` para recargas

## Fase 3 — Testing y Deploy — pendiente

- [ ] Tests unitarios backend (Vitest)
- [ ] Tests E2E críticos (Playwright)
- [ ] Dockerfile optimizado
- [ ] Deploy backend (Render/Railway)
- [ ] Deploy frontend (Vercel/Cloudflare Pages)
- [ ] Deploy DB (Supabase/Neon)
- [ ] Configuración de Cloudinary en producción
- [x] Rate limiting y hardening (helmet + `@fastify/rate-limit`)
- [ ] Smoke tests en producción

## Fase 4 — v1.5 (Post-MVP) — pendiente

- [ ] Pagos online (Stripe/MercadoPago)
- [ ] Impresión automática de tickets
- [ ] Reportes básicos de ventas
- [ ] Dashboard Super Admin
- [ ] Reservas de mesa
- [ ] Delivery básico

## Notas de alcance

- **TanStack Query**: no forma parte del MVP; evaluar en v1.5.
- **Super Admin**: rol `SUPER_ADMIN` con `tenantId` nullable; el dashboard visual sigue en Fase 4.
- **Refresh tokens**: fuera del MVP; JWT de 7 días. Revisar con el frontend (cookie `httpOnly` + revocación).
- **Inventario**: el descuento ocurre al transicionar a `PREPARING`; cancelar desde `PREPARING` repone el stock reservado, cancelar desde `PENDING` no lo toca y los ítems ya `READY` no se reponen.
- **Impresión**: en v1 solo KDS; no hay impresión automática.
- **Pagos y delivery**: fuera del MVP; pertenecen a v1.5.
