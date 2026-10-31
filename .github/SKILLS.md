# Platea — Habilidades técnicas del proyecto

## Backend

- **Fastify 5**: plugins, hooks (`onRequest`, `preHandler`, `onClose`), decorators, encapsulación, `fastify-plugin`, validación de schemas, manejo centralizado de errores.
- **Prisma 6**: modelos y relaciones, `@@map`/`@map`, transacciones interactivas, `$transaction`, consultas raw cuando se justifiquen, Client Extensions (`$extends`), migraciones y seeds.
- **PostgreSQL 16**: índices, transacciones, `text[]`, `JSONB`, `Decimal`, integridad referencial, `EXPLAIN ANALYZE`.
- **JWT**: `sign`/`verify`, expiración, claims (`sub`, `role`, `tenantId`), refresh tokens (no implementados en MVP; evaluar), rotación de secretos.
- **Socket.io**: rooms, namespaces, eventos, acknowledgements, reconexión, adapter en memoria y consideraciones para escalar con Redis.
- **Subida de archivos**: `@fastify/multipart` (no Multer), validación de MIME/tamaño, streaming a Cloudinary.
- **Cloudinary**: upload, transformaciones, optimización, URLs firmadas cuando aplique.
- **Zod 4**: schemas, `safeParse`, inferencia con `z.infer`, validación de params/query/body, errores tipados.
- **TypeScript 5.9**: tipos avanzados, generics, utility types, narrowing, satisfies, module augmentation de Fastify/JWT.

## Frontend (Fase 2)

- **React 18**: hooks, context, Suspense, lazy loading, composición de componentes.
- **TypeScript**: tipado de props, eventos, refs y hooks personalizados.
- **Zustand**: stores, selectores, persistencia (carrito y sesión), integración con Socket.io.
- **React Router**: rutas anidadas, layouts, rutas protegidas por rol.
- **Tailwind CSS**: utilidades, responsive mobile-first, tokens de tema, dark mode (evaluar).
- **shadcn/ui**: composición, personalización con tokens, accesibilidad.
- **Socket.io-client**: conexión autenticada, eventos, reconexión, limpieza de listeners.
- **react-i18next**: namespaces, interpolación, plurales, cambio ES/EN.
- **Fetch API**: cliente HTTP tipado, manejo de errores y cancelación con `AbortController`.
- **TanStack Query**: **no incluida en el MVP**. No instalar sin aprobación; se evaluará después del MVP.

## DevOps

- **Docker**: `compose`, volúmenes, redes, healthchecks, límites de recursos.
- **Git**: branching strategy, Conventional Commits, resolución de conflictos, PRs.
- **GitHub**: workflows básicos de CI/CD (futuro), protección de ramas.
- **Variables de entorno**: validación con Zod, valores por defecto, secretos fuera del repositorio.
- **Prisma en CI/CD**: `prisma generate`, `prisma migrate deploy`, backups.
- **Observabilidad básica**: logs estructurados de Fastify, healthchecks, monitoreo de uptime.

## Nivel esperado

- Capacidad de diseñar un módulo completo (schema Zod + servicio + rutas + tests) sin supervisión.
- Capacidad de detectar y corregir fugas de datos entre tenants.
- Capacidad de mantener coherencia entre backend, frontend y documentación.
- Capacidad de explicar decisiones técnicas y sus trade-offs en español.
