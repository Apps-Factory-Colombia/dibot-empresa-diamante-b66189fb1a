import { appMeta, attentionRequests, menuCards, services } from './schema'
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
  { id: 'restaurante', name: 'Restaurante', description: 'Sabor Que Se Celebra', detail: 'De Lunes A Viernes De 8 Am A 7 Pm, Sábado Y Domingo De 8 Am A 5 Pm.', accent: 'coral', createdAt: now },
  { id: 'eventos', name: 'Salón De Eventos', description: 'Tu Ocasión, En Grande', detail: 'Un Espacio Rosa Y Elegante Para Celebrar A Tu Manera.', accent: 'lilac', createdAt: now },
  { id: 'banquetes', name: 'Banquetes', description: 'Menús Que Dejan Huella', detail: 'Propuestas Deliciosas Para Grupos, Fiestas Y Reuniones.', accent: 'gold', createdAt: now },
  { id: 'publicidad', name: 'Publicidad', description: 'Haz Que Te Recuerden', detail: 'Ideas Creativas Para Darle Brillo A Tu Marca.', accent: 'pink', createdAt: now },
]).onConflictDoNothing({ target: services.id })

await db.insert(menuCards).values([
  { id: 'carta-adultos', serviceId: 'restaurante', order: 1, title: 'Carta para Adultos', subtitle: 'Sabores de la casa', description: 'Platos con carácter, ingredientes frescos y ese toque Diamante que vuelve especial cada sobremesa.', color: 'rose', createdAt: now },
  { id: 'carta-ninos', serviceId: 'restaurante', order: 2, title: 'Carta para Niños', subtitle: 'Pequeños grandes favoritos', description: 'Opciones divertidas y equilibradas para que los más pequeños también celebren cada sabor.', color: 'lilac', createdAt: now },
  { id: 'carta-temporada', serviceId: 'restaurante', order: 3, title: 'Carta de Temporada', subtitle: 'Lo mejor de cada estación', description: 'Una selección que cambia con el mercado para servir lo más fresco, colorido y delicioso.', color: 'gold', createdAt: now },
  { id: 'carta-bebidas', serviceId: 'restaurante', order: 4, title: 'Carta de Bebidas', subtitle: 'Brindis con brillo', description: 'Cócteles, aguas frescas, vinos y bebidas sin alcohol para acompañar tu momento.', color: 'sky', createdAt: now },
]).onConflictDoNothing({ target: menuCards.id })

await db.insert(attentionRequests).values({
  id: 'solicitud-inicial',
  name: 'Mariana López',
  address: 'Av. Diamante 120',
  location: 'Ciudad de México',
  whatsapp: '+52 55 1234 5678',
  serviceId: 'eventos',
  message: 'Me Gustaría Conocer Las Opciones Para Una Celebración Familiar.',
  status: 'pendiente',
  createdAt: now,
  updatedAt: now,
}).onConflictDoNothing({ target: attentionRequests.id })
