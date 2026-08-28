import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'empresa_diamante_admin'
const SESSION_MAX_AGE = 60 * 60 * 8

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Configura ${name} para usar el administrador.`)
  return value
}

function signature(payload: string) {
  return createHmac('sha256', required('ADMIN_SESSION_SECRET')).update(payload).digest('base64url')
}

function cookieValue(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookie = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))
  return cookie?.slice(COOKIE_NAME.length + 1) ?? ''
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function isAdminRequest(request: Request) {
  const [timestamp, token] = cookieValue(request).split('.')
  if (!timestamp || !token) return false
  const createdAt = Number(timestamp)
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_MAX_AGE * 1000 || createdAt > Date.now() + 60_000) return false
  return safeEqual(token, signature(timestamp))
}

export function adminLoginResponse() {
  const payload = String(Date.now())
  const cookie = `${COOKIE_NAME}=${payload}.${signature(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`
  return cookie
}

export function adminLogoutResponse() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

export function validAdminCredentials(email: unknown, password: unknown) {
  const configuredEmail = required('ADMIN_EMAIL')
  const configuredPassword = required('ADMIN_PASSWORD')
  return typeof email === 'string' && typeof password === 'string' && safeEqual(email.trim().toLowerCase(), configuredEmail.toLowerCase()) && safeEqual(password, configuredPassword)
}
