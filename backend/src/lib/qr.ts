import { randomBytes } from 'node:crypto'

/** Token opaco que viaja en la URL del QR de una mesa. */
export function generateQrCode(): string {
  return randomBytes(12).toString('base64url')
}
