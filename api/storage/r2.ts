import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const DEFAULT_BUCKET = 'dibot'
const DEFAULT_FOLDER = 'empresa-diamante-b66189fb1a'
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

let client: S3Client | undefined

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Configura ${name} para subir imágenes.`)
  return value
}

function r2Client() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: required('ENDPOINT_S3'),
      credentials: {
        accessKeyId: required('R2_ACCESS_KEY_ID'),
        secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
      },
    })
  }
  return client
}

function bucket() {
  return process.env.R2_BUCKET?.trim() || DEFAULT_BUCKET
}

function folder() {
  return (process.env.R2_APP_FOLDER?.trim() || DEFAULT_FOLDER).replace(/^\/+|\/+$/g, '')
}

export function imageKeyForProduct(productId: string, file: File) {
  const extension = allowedTypes.get(file.type)
  if (!extension) throw new Error('Usa una imagen JPG, PNG o WEBP.')
  return `${folder()}/products/${productId}-${Date.now()}.${extension}`
}

export function isAppImageKey(key: string) {
  return key.startsWith(`${folder()}/`) && !key.includes('..')
}

export async function uploadProductImage(productId: string, file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 5 MB.')
  const key = imageKeyForProduct(productId, file)
  await r2Client().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  return key
}

export async function deleteProductImage(key: string | null | undefined) {
  if (!key || !isAppImageKey(key)) return
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

export async function readProductImage(key: string) {
  if (!isAppImageKey(key)) return null
  const result = await r2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
  if (!result.Body) return null
  return {
    body: await result.Body.transformToByteArray(),
    contentType: result.ContentType || 'image/jpeg',
    cacheControl: result.CacheControl || 'public, max-age=31536000, immutable',
  }
}

export function imageUrl(key: string | null | undefined) {
  return key ? `/api/images/${encodeURIComponent(key)}` : null
}
