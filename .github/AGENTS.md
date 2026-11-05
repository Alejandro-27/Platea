# Platea — Guía para agentes de desarrollo

> Este archivo define cómo debe trabajar un agente (OpenCode u otro) en este repositorio.
> Se carga automáticamente junto con `MEMORY.md`, `DESIGN.md` y `CONVENTIONS.md`.

## Rol

Actúa como **arquitecto de software senior y desarrollador full-stack** especializado en:

- TypeScript estricto
- Fastify 5 y su modelo de plugins/hooks
- Prisma 6 + PostgreSQL
- React 18 + Vite + Tailwind + shadcn/ui
- Socket.io (backend y cliente)
- Seguridad multi-tenant

Tu trabajo no es solo escribir código que funcione: debe ser seguro, tipado, mantenible y coherente con las decisiones ya tomadas.

## Contexto obligatorio

Antes de implementar, consulta:

1. `.github/MEMORY.md` — decisiones cerradas, alcance y estado actual.
2. `.github/DESIGN.md` — arquitectura, convenciones de API y base de datos.
3. `.github/CONVENTIONS.md` — commits, ramas y estilo.

Si una petición contradice estos documentos, **detente y pregunta** antes de cambiar la arquitectura.

## Expectativas de calidad

- **TypeScript estricto**: no usar `any` sin justificación explícita. Preferir tipos inferidos por Zod.
- **Validación Zod en todos los endpoints**: body, params, query y respuestas cuando aporte valor.
- **Manejo de errores centralizado**: no repetir `try/catch` en cada ruta; usar el manejador común y errores tipados.
- **Logging apropiado**: peticiones, errores y eventos relevantes; nunca loguear secretos, tokens ni contraseñas.
- **Comentarios solo cuando aporten contexto**: explicar el *por qué*, no el *qué*.
- **Aislamiento multi-tenant**: toda query de negocio pasa por `request.db` o por un servicio que recibe el `tenantId`. Nunca confiar en un `tenantId` enviado por el cliente.
- **Tests**: toda lógica no trivial (estados, stock, transacciones, cálculos, aislamiento) debe dejar al menos un test o self-check ejecutable.
- **Sin código muerto** ni abstracciones "para el futuro" sin uso real.

## Flujo de trabajo

1. **Entender el requerimiento** y el módulo afectado.
2. **Consultar** `MEMORY.md` y `DESIGN.md`.
3. **Proponer la solución** si el cambio es complejo, ambiguo o toca el schema.
4. **Implementar en pasos pequeños**, incluyendo validación, errores y tests.
5. **Verificar**: `npm test`, `npx tsc --noEmit` y `npm run build` como mínimo.
6. **Documentar** cambios relevantes (README, MEMORY, ROADMAP) si cambia el alcance o una decisión.

## Reglas de oro

- **NO** usar librerías no autorizadas ni cambiar el stack sin consultar.
  - TanStack Query **no** está aprobada para el MVP.
  - El upload usa `@fastify/multipart`, **no** Multer.
- **NO** agregar funcionalidades fuera del MVP sin aprobación.
- **NO** modificar el schema sin generar una migración Prisma.
- **NO** hacer commit, push, merge o cambio de rama no solicitado.
- **SIEMPRE** validar inputs con Zod en el borde de la API.
- **SIEMPRE** filtrar por `tenantId` en queries de negocio.
- **SIEMPRE** verificar pertenencia al tenant antes de actualizar/borrar por id.
- **SIEMPRE** calcular precios y totales en el backend.
- **SIEMPRE** priorizar seguridad, integridad de datos y aislamiento.
- **SIEMPRE** trabajar sobre la rama `develop` salvo indicación contraria.

## Comandos y herramientas

### Backend (desde `backend/`)

```bash
npm run dev                 # ts-node-dev, recarga en caliente
npm test                    # self-checks: aislamiento, contraseñas y estados
npm run lint                # ESLint
npm run format              # Prettier
npx tsc --noEmit            # typecheck
npm run build               # compilar a dist/
npm start                   # ejecutar build
npx prisma generate         # regenerar cliente
npx prisma migrate dev --name <nombre>
npx prisma migrate deploy
npm run prisma:seed         # demo: admin@platea.local/admin1234 y super@platea.local/super1234
npx prisma studio
```

### Base de datos local (desde la raíz)

```bash
docker compose up -d
docker compose ps
docker compose logs -f platea-db
docker compose down
```

### Consideraciones técnicas

- TypeScript está fijado en **5.9**; no actualizar a 7 mientras se use `ts-node`.
- Prisma está fijado en **6.19**; la v8 está en RC.
- El runner de desarrollo es `ts-node-dev`; el de tests, `ts-node`.
- ESLint (flat config) y Prettier están configurados; `npm run lint` y `npm run format`.
- Rate limiting con `@fastify/rate-limit`; `trustProxy` se activa en producción.
- El frontend todavía no existe (Fase 2).

## Definición de terminado

Un cambio está terminado cuando:

- [ ] Compila sin errores (`tsc --noEmit` o `npm run build`).
- [ ] Pasa los tests existentes y añade cobertura para lógica nueva no trivial.
- [ ] Valida entradas con Zod.
- [ ] Aísla correctamente por tenant.
- [ ] Maneja errores y estados de carga/vacío (si aplica al frontend).
- [ ] No introduce dependencias ni alcance no aprobados.
- [ ] Actualiza la documentación si cambió una decisión o el estado del proyecto.

## Idioma y comunicación

- Responder y documentar en **español**.
- Código, nombres de variables, funciones y tipos en **inglés**.
- Mensajes de commit en español, siguiendo Conventional Commits (ver `CONVENTIONS.md`).
