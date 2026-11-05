import assert from 'node:assert/strict'
import { applyTenantScope } from './tenant-scope'

const TENANT = 'tenant_123'

// Lectura: inyecta tenantId y conserva el where original.
assert.deepEqual(applyTenantScope('Dish', 'findMany', { where: { isAvailable: true } }, TENANT), {
  where: { isAvailable: true, tenantId: TENANT },
})

// Sin where previo.
assert.deepEqual(applyTenantScope('Order', 'count', {}, TENANT), {
  where: { tenantId: TENANT },
})

// Creación: fuerza el tenant y descarta el tenantId enviado por el cliente.
assert.deepEqual(
  applyTenantScope('Dish', 'create', { data: { name: 'Burger', tenantId: 'ajeno' } }, TENANT),
  { data: { name: 'Burger', tenantId: TENANT } }
)

// createMany: aplica a cada fila.
assert.deepEqual(
  applyTenantScope('Table', 'createMany', { data: [{ number: 1 }, { number: 2 }] }, TENANT),
  {
    data: [
      { number: 1, tenantId: TENANT },
      { number: 2, tenantId: TENANT },
    ],
  }
)

// Update por id: el where lleva id + tenantId.
assert.deepEqual(
  applyTenantScope('Dish', 'update', { where: { id: 'd1' }, data: { price: 10 } }, TENANT),
  {
    where: { id: 'd1', tenantId: TENANT },
    data: { price: 10 },
  }
)

// Tenant es la entidad raíz: no se filtra.
const tenantArgs = { where: { slug: 'demo' } }
assert.equal(applyTenantScope('Tenant', 'findUnique', tenantArgs, TENANT), tenantArgs)

// Modelos hijos sin tenantId propio: los gestiona su servicio vía padre.
const itemArgs = { where: { id: 'oi1' } }
assert.equal(applyTenantScope('OrderItem', 'update', itemArgs, TENANT), itemArgs)

console.log('tenant-scope: OK')
