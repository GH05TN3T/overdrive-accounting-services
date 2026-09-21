import PostalMime from 'postal-mime'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function accessEmail(request) {
  return (request.headers.get('CF-Access-Authenticated-User-Email') || '').trim().toLowerCase()
}

function adminEmails(env) {
  return (env.ADMIN_EMAILS || env.ADMIN_EMAIL || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
}

function configured(env) {
  return { database: Boolean(env.DB), documents: Boolean(env.DOCUMENTS) }
}

function requireUser(request) {
  const email = accessEmail(request)
  return email ? email : null
}

function cookieValue(request, name) {
  const cookies = request.headers.get('Cookie') || ''
  const match = cookies.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : ''
}

function base64UrlEncode(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4))
  return new Uint8Array([...binary].map((character) => character.charCodeAt(0)))
}

async function hmac(secret, value, verify = false, signature) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  if (verify) return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(value))
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
}

async function createSession(email, env) {
  const payload = `${email}|${Date.now() + 8 * 60 * 60 * 1000}`
  const signature = await hmac(env.ADMIN_SESSION_SECRET, payload)
  return `${base64UrlEncode(payload)}.${base64UrlEncode(signature)}`
}

async function sessionEmail(request, env) {
  const access = accessEmail(request)
  if (access && adminEmails(env).includes(access)) return access
  const token = cookieValue(request, 'overdrive_admin')
  if (!token || !env.ADMIN_SESSION_SECRET) return null
  const [encodedPayload, encodedSignature] = token.split('.')
  if (!encodedPayload || !encodedSignature) return null
  try {
    const payload = new TextDecoder().decode(base64UrlDecode(encodedPayload))
    const [email, expiresAt] = payload.split('|')
    const valid = adminEmails(env).includes(email) && Number(expiresAt) > Date.now() && await hmac(env.ADMIN_SESSION_SECRET, payload, true, base64UrlDecode(encodedSignature))
    return valid ? email : null
  } catch { return null }
}

async function requireAdmin(request, env) {
  return sessionEmail(request, env)
}

function missingBindings(env) {
  const missing = []
  if (!env.DB) missing.push('D1 binding DB')
  if (!env.DOCUMENTS) missing.push('R2 binding DOCUMENTS')
  return missing
}

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true
  if (!token) return false
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET_KEY)
  form.append('response', token)
  const remoteIp = request.headers.get('CF-Connecting-IP')
  if (remoteIp) form.append('remoteip', remoteIp)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const result = await response.json()
  return result.success === true
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 150)
}

async function ensureClient(env, email, name = '', business = '') {
  await env.DB.prepare("INSERT INTO clients (email, name, business) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = CASE WHEN excluded.name != '' THEN excluded.name ELSE clients.name END, business = CASE WHEN excluded.business != '' THEN excluded.business ELSE clients.business END, updated_at = datetime('now')").bind(email.toLowerCase(), name.trim(), business.trim()).run()
}

async function sendEmailWithResend(env, email, subject, text) {
  if (!env.RESEND_API_KEY) return { error: 'RESEND_API_KEY is not configured in Cloudflare.' }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM || 'Info@OverdriveAccountingServices.com', to: [email], subject, text }),
  })
  const data = await response.json()
  if (!response.ok) return { error: data.message || 'Resend could not send the email.' }
  return { id: data.id || '' }
}

async function handleInboundEmail(message, env) {
  if (!env.DB) throw new Error('D1 binding DB is not configured.')
  const parsed = await new PostalMime().parse(await new Response(message.raw).arrayBuffer())
  const email = (message.from || parsed.from?.address || '').trim().toLowerCase()
  if (!email) return
  const subject = parsed.subject || message.headers.get('subject') || '(no subject)'
  await ensureClient(env, email, parsed.from?.name || '')
  await env.DB.prepare('INSERT INTO email_messages (id, client_email, direction, subject, body_text, body_html, message_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), email, 'inbound', subject, parsed.text || '', parsed.html || '', message.headers.get('message-id') || '', 0).run()
}

async function handleApi(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method
  const setup = configured(env)

  if (path === '/api/admin/session' && method === 'GET') {
    const email = accessEmail(request)
    const admin = await requireAdmin(request, env)
    return json({ authenticated: Boolean(admin), email: admin || email, isAdmin: Boolean(admin), configured: setup })
  }

  if (path === '/api/admin/login' && method === 'POST') {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: 'Admin password secrets are not configured in Cloudflare.' }, 503)
    const body = await request.json()
    if (!await verifyTurnstile(request, env, body.turnstile_token)) return json({ error: 'Complete the security check and try again.' }, 400)
    const email = (body.email || '').trim().toLowerCase()
    if (!adminEmails(env).includes(email) || body.password !== env.ADMIN_PASSWORD) return json({ error: 'Invalid admin email or password.' }, 401)
    const token = await createSession(email, env)
    return new Response(JSON.stringify({ authenticated: true, email, isAdmin: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': `overdrive_admin=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800` } })
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'overdrive_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' } })
  }

  if (path === '/api/client/session' && method === 'GET') {
    const email = accessEmail(request)
    return json({ authenticated: Boolean(email), email, configured: setup })
  }

  if (path === '/api/appointments' && method === 'POST') {
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const body = await request.json()
    if (!await verifyTurnstile(request, env, body.turnstile_token)) return json({ error: 'Complete the security check and try again.' }, 400)
    if (!body.name || !body.email || !body.service || !body.appointment_date) return json({ error: 'Name, email, service, and preferred date are required.' }, 400)
    const id = crypto.randomUUID()
    const email = body.email.trim().toLowerCase()
    await env.DB.prepare('INSERT INTO appointments (id, name, email, business, service, appointment_date, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, body.name.trim(), email, body.business?.trim() || '', body.service, body.appointment_date, body.notes?.trim() || '', 'new').run()
    await ensureClient(env, email, body.name, body.business || '')
    return json({ id, status: 'new' }, 201)
  }

  if (path === '/api/admin/appointments' && method === 'GET') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const result = await env.DB.prepare('SELECT * FROM appointments ORDER BY appointment_date ASC, created_at DESC').all()
    return json({ appointments: result.results || [] })
  }

  if (path === '/api/admin/clients' && method === 'GET') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const result = await env.DB.prepare("SELECT c.*, (SELECT COUNT(*) FROM email_messages m WHERE m.client_email = c.email AND m.direction = 'inbound' AND m.is_read = 0) AS unread_count, (SELECT MAX(created_at) FROM email_messages m WHERE m.client_email = c.email) AS last_message_at FROM clients c ORDER BY COALESCE(last_message_at, c.updated_at) DESC").all()
    return json({ clients: result.results || [] })
  }

  if (path === '/api/admin/messages' && method === 'GET') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const email = (url.searchParams.get('client_email') || '').trim().toLowerCase()
    if (!email) return json({ error: 'client_email is required.' }, 400)
    await env.DB.prepare("UPDATE email_messages SET is_read = 1 WHERE client_email = ? AND direction = 'inbound'").bind(email).run()
    const result = await env.DB.prepare('SELECT * FROM email_messages WHERE client_email = ? ORDER BY created_at ASC').bind(email).all()
    return json({ messages: result.results || [] })
  }

  if (path === '/api/admin/messages' && method === 'POST') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const body = await request.json()
    const email = (body.client_email || '').trim().toLowerCase()
    const subject = (body.subject || '').trim()
    const text = (body.body_text || '').trim()
    if (!email || !subject || !text) return json({ error: 'Client email, subject, and message are required.' }, 400)
    const sent = await sendEmailWithResend(env, email, subject, text)
    if (sent.error) return json({ error: sent.error }, 503)
    await ensureClient(env, email)
    const id = crypto.randomUUID()
    await env.DB.prepare('INSERT INTO email_messages (id, client_email, direction, subject, body_text, provider_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, email, 'outbound', subject, text, sent.id, 1).run()
    return json({ message: { id, client_email: email, direction: 'outbound', subject, body_text: text, provider_id: sent.id, created_at: new Date().toISOString() } }, 201)
  }

  const appointmentMatch = path.match(/^\/api\/admin\/appointments\/([^/]+)$/)
  if (appointmentMatch && method === 'PATCH') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const body = await request.json()
    const validStatuses = ['new', 'confirmed', 'completed', 'cancelled']
    const updates = []
    const values = []
    if (body.status !== undefined) {
      if (!validStatuses.includes(body.status)) return json({ error: 'Invalid appointment status.' }, 400)
      updates.push('status = ?')
      values.push(body.status)
    }
    for (const field of ['appointment_time', 'meeting_url', 'meeting_notes', 'cancellation_reason']) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(String(body[field] || '').trim())
      }
    }
    if (!updates.length) return json({ error: 'No appointment changes were provided.' }, 400)
    updates.push("updated_at = datetime('now')")
    values.push(appointmentMatch[1])
    await env.DB.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    return json({ ok: true })
  }

  if (appointmentMatch && method === 'DELETE') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    await env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(appointmentMatch[1]).run()
    return json({ ok: true })
  }

  if (path === '/api/admin/documents' && method === 'GET') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const result = await env.DB.prepare('SELECT * FROM documents ORDER BY created_at DESC').all()
    return json({ documents: result.results || [] })
  }

  if (path === '/api/client/documents' && method === 'GET') {
    const email = requireUser(request)
    if (!email) return json({ error: 'Cloudflare Access client authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const result = await env.DB.prepare('SELECT * FROM documents WHERE client_email = ? ORDER BY created_at DESC').bind(email).all()
    return json({ documents: result.results || [] })
  }

  if ((path === '/api/client/documents' || path === '/api/admin/documents') && method === 'POST') {
    const email = path.startsWith('/api/admin') ? await requireAdmin(request, env) : requireUser(request)
    if (!email) return json({ error: 'Cloudflare Access authentication required.' }, 401)
    const missing = missingBindings(env)
    if (missing.length) return json({ error: `Connect ${missing.join(' and ')} before uploading documents.` }, 503)
    const form = await request.formData()
    const file = form.get('file')
    const clientEmail = path.startsWith('/api/admin') ? (form.get('client_email') || email).toString().toLowerCase() : email
    if (!(file instanceof File) || !file.size) return json({ error: 'Choose a file to upload.' }, 400)
    if (file.size > 25 * 1024 * 1024) return json({ error: 'Files must be smaller than 25 MB.' }, 400)
    const fileName = safeFileName(file.name)
    const storagePath = `${clientEmail}/${crypto.randomUUID()}-${fileName}`
    await env.DOCUMENTS.put(storagePath, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } })
    const id = crypto.randomUUID()
    try {
      await env.DB.prepare('INSERT INTO documents (id, client_email, file_name, storage_path) VALUES (?, ?, ?, ?)').bind(id, clientEmail, file.name, storagePath).run()
    } catch (error) {
      await env.DOCUMENTS.delete(storagePath)
      throw error
    }
    return json({ document: { id, client_email: clientEmail, file_name: file.name, storage_path: storagePath, created_at: new Date().toISOString() } }, 201)
  }

  const documentMatch = path.match(/^\/api\/(admin|client)\/documents\/([^/]+)(?:\/download)?$/)
  if (documentMatch && method === 'GET') {
    const admin = await requireAdmin(request, env)
    const email = admin || requireUser(request)
    if (!email) return json({ error: 'Cloudflare Access authentication required.' }, 401)
    if (!env.DB || !env.DOCUMENTS) return json({ error: 'Cloudflare D1 and R2 are not connected yet.' }, 503)
    const document = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(documentMatch[2]).first()
    if (!document || (!admin && document.client_email !== email)) return json({ error: 'Document not found.' }, 404)
    const object = await env.DOCUMENTS.get(document.storage_path)
    if (!object) return json({ error: 'Stored file not found.' }, 404)
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Content-Disposition', `attachment; filename="${safeFileName(document.file_name)}"`)
    return new Response(object.body, { headers })
  }

  if (path.startsWith('/api/admin/documents/') && method === 'DELETE') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB || !env.DOCUMENTS) return json({ error: 'Cloudflare D1 and R2 are not connected yet.' }, 503)
    const id = path.split('/').pop()
    const document = await env.DB.prepare('SELECT storage_path FROM documents WHERE id = ?').bind(id).first()
    if (document) await env.DOCUMENTS.delete(document.storage_path)
    await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run()
    return json({ ok: true })
  }

  return json({ error: 'API route not found.' }, 404)
}

export default {
  async fetch(request, env) {
    try {
      if (new URL(request.url).pathname.startsWith('/api/')) return await handleApi(request, env)
      return env.ASSETS.fetch(request)
    } catch (error) {
      return json({ error: error.message || 'Unexpected server error.' }, 500)
    }
  },

  async email(message, env) {
    await handleInboundEmail(message, env)
  },
}
