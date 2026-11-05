import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env'

const config = {
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
}

// Las credenciales son opcionales para permitir levantar la API sin upload.
const isConfigured = Boolean(config.cloud_name && config.api_key && config.api_secret)

if (isConfigured) {
  cloudinary.config(config)
}

function assertConfigured(): void {
  if (!isConfigured) {
    throw new Error('Cloudinary no configurado: faltan CLOUDINARY_* en backend/.env')
  }
}

export function uploadImage(
  fileBuffer: Buffer,
  folder: string,
  publicId?: string
): Promise<string> {
  assertConfigured()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(new Error(error.message))
          return
        }
        if (!result) {
          reject(new Error('Cloudinary no devolvió resultado'))
          return
        }
        resolve(result.secure_url)
      }
    )

    stream.end(fileBuffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  assertConfigured()

  const result = (await cloudinary.uploader.destroy(publicId)) as { result: string }

  // 'not found' se acepta para que borrar dos veces sea idempotente.
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary no pudo borrar ${publicId}: ${result.result}`)
  }
}
