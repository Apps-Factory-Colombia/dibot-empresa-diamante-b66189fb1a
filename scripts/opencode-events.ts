const endpoint = process.env.OPENCODE_EVENTS_URL ?? 'http://127.0.0.1:4096/event'
const headers: Record<string, string> = { Accept: 'text/event-stream' }
const username = process.env.OPENCODE_SERVER_USERNAME ?? 'opencode'
const password = process.env.OPENCODE_SERVER_PASSWORD
if (password) headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
const response = await fetch(endpoint, { headers })
if (!response.ok || !response.body) throw new Error(`OpenCode event stream failed: ${response.status}`)

console.log(`Listening to ${endpoint}`)
const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split(/\r?\n\r?\n/)
  buffer = events.pop() ?? ''
  for (const event of events) {
    const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
    if (data) console.log(data)
  }
}
