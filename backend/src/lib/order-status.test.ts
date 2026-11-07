import assert from 'node:assert/strict'
import { canReplenishStock, canTransitionItem, canTransitionOrder } from './order-status'

assert.equal(canTransitionOrder('PENDING', 'PREPARING'), true)
assert.equal(canTransitionOrder('PREPARING', 'READY'), true)
assert.equal(canTransitionOrder('READY', 'SERVED'), true)
assert.equal(canTransitionOrder('PENDING', 'SERVED'), false)
assert.equal(canTransitionOrder('SERVED', 'PREPARING'), false)
assert.equal(canTransitionOrder('CANCELLED', 'PENDING'), false)
assert.equal(canTransitionOrder('PREPARING', 'CANCELLED'), true)

assert.equal(canTransitionItem('PENDING', 'PREPARING'), true)
assert.equal(canTransitionItem('PREPARING', 'READY'), true)
assert.equal(canTransitionItem('READY', 'SERVED'), true)
assert.equal(canTransitionItem('READY', 'PENDING'), false)
assert.equal(canTransitionItem('SERVED', 'PREPARING'), false)

assert.equal(canReplenishStock('PREPARING'), true)
assert.equal(canReplenishStock('PENDING'), false)
assert.equal(canReplenishStock('READY'), false)
assert.equal(canReplenishStock('SERVED'), false)

console.log('order-status: OK')
