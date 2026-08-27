import { appMeta, attentionRequests, services } from './schema'
import { db } from './client'

const appName = 'Empresa Diamante'

await db.insert(appMeta).values({
  id: 'app',
  appName,
  updatedAt: new Date(),
}).onConflictDoNothing({
  target: appMeta.id,
})

console.log(`[seed] Base metadata preparada para ${appName}.`)

const now = new Date()
await db.insert(services).values([
  { id: 'restaurante', name: 'Restaurante', description: 'Sabor que se celebra', detail: 'De Lunes a Viernes de 8 am a 7 pm, Sabado y Domingo de 8 am a 5 pm.', accent: 'coral', createdAt: now },
  { id: 'eventos', name: 'Salón de Eventos', description: 'Tu ocasión, en grande', detail: 'Un espacio rosa y elegante para celebrar a tu manera.', accent: 'lilac', createdAt: now },
  { id: 'banquetes', name: 'Banquetes', description: 'Menús que dejan huella', detail: 'Propuestas deliciosas para grupos, fiestas y reuniones.', accent: 'gold', createdAt: now },
  { id: 'publicidad', name: 'Publicidad', description: 'Haz que te recuerden', detail: 'Ideas creativas para darle brillo a tu marca.', accent: 'pink', createdAt: now },
]).onConflictDoNothing({ target: services.id })

await db.insert(attentionRequests).values({
  id: 'solicitud-inicial',
  name: 'Mariana López',
  address: 'Av. Diamante 120',
  location: 'Ciudad de México',
  whatsapp: '+52 55 1234 5678',
  serviceId: 'eventos',
  message: 'Me gustaría conocer las opciones para una celebración familiar.',
  status: 'pendiente',
  createdAt: now,
  updatedAt: now,
}).onConflictDoNothing({ target: attentionRequests.id })
