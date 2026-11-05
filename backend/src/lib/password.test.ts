import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './password'

async function main(): Promise<void> {
  const password = 'admin1234'
  const stored = await hashPassword(password)

  assert.match(stored, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/)
  assert.equal(await verifyPassword(password, stored), true)
  assert.equal(await verifyPassword('incorrecta', stored), false)

  const other = await hashPassword(password)
  assert.notEqual(stored, other, 'cada hash debe usar una sal distinta')
  assert.equal(await verifyPassword(password, other), true)

  assert.equal(await verifyPassword(password, 'texto-plano'), false)
  assert.equal(await verifyPassword(password, 'scrypt$abc'), false)

  console.log('password: OK')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
