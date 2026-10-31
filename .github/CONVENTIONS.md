# Platea — Convenciones de desarrollo

## Git Commit Convention (Conventional Commits)

| Tipo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Cambios en documentación |
| `style:` | Formato, punto y coma, etc. (sin cambio de lógica) |
| `refactor:` | Refactorización sin cambio de comportamiento |
| `perf:` | Mejora de rendimiento |
| `test:` | Agregar/modificar tests |
| `chore:` | Build, dependencias, configuración |

Formato:

```text
<tipo>(<alcance>): <descripción en imperativo>
```

Ejemplos:

```text
feat(backend): agregar módulo de orders con Socket.io
fix(tenant): impedir lectura cruzada entre restaurantes
docs(setup): documentar Docker y variables de entorno
test(orders): cubrir descuento de stock al pasar a PREPARING
chore(deps): actualizar Prisma a 6.19.3
```

- Descripción en español, imperativa y en minúsculas.
- Un commit = un cambio lógico.
- No mezclar refactors grandes con features.

## Branch Naming

- `main`: producción; solo merges desde `develop`.
- `develop`: rama principal de desarrollo e integración.
- `feature/nombre-feature`: nuevas funcionalidades.
- `fix/nombre-bug`: correcciones no urgentes.
- `hotfix/nombre-critico`: hotfixes urgentes sobre producción.

Flujo:

```text
feature/* ──PR──► develop ──PR──► main
```

## Code Style

- **TypeScript estricto**; no usar `any` sin justificación.
- **Prettier**: 2 espacios, comillas simples, **sin punto y coma**, ancho 100, trailing commas `es5`.
  - El backend actual todavía usa punto y coma; se reformateará al configurar Prettier (pendiente).
- **ESLint**: reglas recomendadas + seguridad; se configurará junto con Prettier.
- Preferir `const`, funciones puras y nombres explícitos.
- No dejar `console.log` en código de producción; usar el logger de Fastify.
- Evitar comentarios obvios; documentar decisiones no evidentes.

## Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables/funciones | `camelCase` | `getTenantId`, `currentStock` |
| Componentes React | `PascalCase` | `DishCard`, `OrderStatusPage` |
| Clases/tipos | `PascalCase` | `OrderService`, `AuthUser` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Archivos backend | `kebab-case` | `tenant-scope.ts`, `error-handler.ts` |
| Componentes frontend | `PascalCase` | `DishCard.tsx` |
| Tablas DB | `snake_case` vía `@@map` | `order_items` |
| Columnas DB | `camelCase` (decisión actual) | `tenantId`, `createdAt` |
| URLs API | `kebab-case` | `/api/order-items` |
| JSON | `camelCase` | `{ "categoryId": "..." }` |

## Imports

Orden recomendado:

1. Librerías externas (`fastify`, `zod`, `@prisma/client`).
2. Módulos internos con alias/rutas del proyecto (`../lib`, `../types`).
3. Relativos del mismo módulo (`./service`).
4. Tipos (`import type`) al final o agrupados.

Evitar imports circulares.

## API Response Format

### Éxito

```typescript
{
  data: { /* entidad o lista */ },
  meta: { total: 10, page: 1, limit: 20 } // opcional, para listas
}
```

### Error

```typescript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Campo requerido',
    details: []
  }
}
```

Códigos de error sugeridos:

- `VALIDATION_ERROR` (422)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)

> `/health` es la excepción actual; el formato se aplicará a los módulos de negocio nuevos.

## Validación

- Validar con Zod en el borde (rutas), no dentro de componentes React.
- Inferir tipos de los schemas (`z.infer`) en lugar de duplicarlos.
- Rechazar campos desconocidos en bodies sensibles (`strict()` cuando aplique).
- Nunca confiar en precios, totales ni `tenantId` enviados por el cliente.

## Tests

- Backend: Vitest en Fase 3; mientras tanto, self-checks ejecutables con `node:assert`.
- Nombres descriptivos en español: `debe descontar stock al pasar a PREPARING`.
- Cubrir caminos de error y aislamiento entre tenants, no solo el camino feliz.
- No borrar ni desactivar tests para "hacer pasar" un cambio.

## Documentación

- Actualizar `README.md` si cambian comandos, variables o instalación.
- Actualizar `.github/MEMORY.md` si se toma una decisión arquitectónica.
- Actualizar `.github/ROADMAP.md` al completar hitos.
- Mantener este archivo si cambian las convenciones.
