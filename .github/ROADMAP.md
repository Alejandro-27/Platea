# Platea — Roadmap

## Fase 0 — Setup (completada)

- [x] Definición de stack y arquitectura
- [x] Creación del repositorio y rama `develop`
- [x] Configuración de Docker (PostgreSQL 16)
- [x] Estructura de carpetas del backend
- [ ] Estructura de carpetas del frontend (Fase 2)
- [x] README.md y archivos de contexto (`.github/`)

## Fase 1 — Backend Core (MVP) — en progreso

- [x] Schema de Prisma completo
- [x] Migración inicial
- [ ] Auth JWT (registro/login de staff)
- [ ] CRUD Tenants (Super Admin)
- [ ] CRUD Users (Admin restaurante)
- [ ] CRUD Tables + generación de QR
- [ ] CRUD Categories
- [ ] CRUD Dishes + upload de imágenes
- [ ] CRUD Ingredients (inventario básico)
- [ ] Sesiones anónimas para comensales
- [ ] Orders (creación, estados, descuento de stock en `PREPARING`)
- [ ] Reviews (calificaciones)
- [ ] Integración completa de Socket.io (rooms y eventos)
- [ ] Manejo centralizado de errores y respuestas `{ data }` / `{ error }`

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
- [ ] Helmet, rate limiting y hardening
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
- **Super Admin**: el schema actual no tiene `SUPER_ADMIN`; definir el diseño antes de implementar el CRUD de tenants.
- **Inventario**: el descuento ocurre al transicionar a `PREPARING`; definir si una cancelación posterior repone stock.
- **Impresión**: en v1 solo KDS; no hay impresión automática.
- **Pagos y delivery**: fuera del MVP; pertenecen a v1.5.
