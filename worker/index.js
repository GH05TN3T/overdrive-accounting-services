import PostalMime from 'postal-mime'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

function adminEmails(env) {
  return (env.ADMIN_EMAILS || env.ADMIN_EMAIL || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
}

function configured(env) {
  return { database: Boolean(env.DB), documents: Boolean(env.DOCUMENTS), clientAccounts: Boolean(env.CLIENT_SESSION_SECRET) }
}

async function requireUser(request, env) {
  return clientSessionEmail(request, env)
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

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(value) {
  return new Uint8Array(value.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  return `${bytesToHex(salt)}:${bytesToHex(bits)}`
}

async function verifyPassword(password, storedHash) {
  const [saltHex, expectedHash] = storedHash.split(':')
  const actualHash = (await hashPassword(password, hexToBytes(saltHex))).split(':')[1]
  return actualHash === expectedHash
}

async function createClientSession(email, env) {
  const payload = `${email}|${Date.now() + 8 * 60 * 60 * 1000}`
  const signature = await hmac(env.CLIENT_SESSION_SECRET, payload)
  return `${base64UrlEncode(payload)}.${base64UrlEncode(signature)}`
}

async function clientSessionEmail(request, env) {
  const token = cookieValue(request, 'overdrive_client')
  if (!token || !env.CLIENT_SESSION_SECRET) return null
  const [encodedPayload, encodedSignature] = token.split('.')
  if (!encodedPayload || !encodedSignature) return null
  try {
    const payload = new TextDecoder().decode(base64UrlDecode(encodedPayload))
    const [email, expiresAt] = payload.split('|')
    const valid = Boolean(email) && Number(expiresAt) > Date.now() && await hmac(env.CLIENT_SESSION_SECRET, payload, true, base64UrlDecode(encodedSignature))
    return valid ? email : null
  } catch { return null }
}

async function sessionEmail(request, env) {
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
  if (!env.TURNSTILE_SECRET_KEY) {
    const hostname = new URL(request.url).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' ? null : ['missing-input-secret']
  }
  if (!token) return ['missing-input-response']
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET_KEY)
  form.append('response', token)
  const remoteIp = request.headers.get('CF-Connecting-IP')
  if (remoteIp) form.append('remoteip', remoteIp)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const result = await response.json()
  return result.success === true ? null : (result['error-codes'] || ['turnstile-validation-failed'])
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 150)
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
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

async function notifyAppointmentUpdate(env, appointment) {
  const statusLabel = appointment.status === 'cancelled' ? 'cancelled' : appointment.status === 'completed' ? 'completed' : 'scheduled'
  const subject = appointment.status === 'cancelled' ? 'Update to your Overdrive consultation' : 'Your Overdrive consultation details'
  const lines = [
    `Hello ${appointment.name || 'there'},`,
    '',
    `Your Overdrive Accounting Services consultation is ${statusLabel}.`,
    `Date: ${appointment.appointment_date || 'To be confirmed'}`,
    `Time: ${appointment.appointment_time || 'To be confirmed'}`,
  ]
  if (appointment.meeting_url) lines.push(`Meeting link: ${appointment.meeting_url}`)
  if (appointment.meeting_notes) lines.push('', `Notes: ${appointment.meeting_notes}`)
  if (appointment.cancellation_reason) lines.push('', `Cancellation reason: ${appointment.cancellation_reason}`)
  lines.push('', 'Overdrive Accounting Services', 'Info@OverdriveAccountingServices.com', '(352) 749-2459')
  const sent = await sendEmailWithResend(env, appointment.email, subject, lines.join('\n'))
  if (sent.error) return { sent: false, error: sent.error }
  try {
    await env.DB.prepare('INSERT INTO email_messages (id, client_email, direction, subject, body_text, provider_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), appointment.email, 'outbound', subject, lines.join('\n'), sent.id, 1).run()
  } catch { /* Messaging migration may not be installed yet. */ }
  return { sent: true }
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
    const admin = await requireAdmin(request, env)
    return json({ authenticated: Boolean(admin), email: admin || '', isAdmin: Boolean(admin), configured: setup })
  }

  if (path === '/api/admin/login' && method === 'POST') {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: 'Admin password secrets are not configured in Cloudflare.' }, 503)
    const body = await request.json()
    const turnstileError = await verifyTurnstile(request, env, body.turnstile_token)
    if (turnstileError) return json({ error: 'Complete the security check and try again.' }, 400)
    const email = (body.email || '').trim().toLowerCase()
    if (!adminEmails(env).includes(email) || body.password !== env.ADMIN_PASSWORD) return json({ error: 'Invalid admin email or password.' }, 401)
    const token = await createSession(email, env)
    return new Response(JSON.stringify({ authenticated: true, email, isAdmin: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': `overdrive_admin=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800` } })
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'overdrive_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' } })
  }

  if (path === '/api/client/register' && method === 'POST') {
    if (!env.DB || !env.CLIENT_SESSION_SECRET) return json({ error: 'Client account storage is not configured in Cloudflare.' }, 503)
    const body = await request.json()
    const turnstileError = await verifyTurnstile(request, env, body.turnstile_token)
    if (turnstileError) return json({ error: 'Complete the security check and try again.' }, 400)
    const email = (body.email || '').trim().toLowerCase()
    if (!email || !body.password || !body.name) return json({ error: 'Name, email, and password are required.' }, 400)
    if (body.password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)
    const existing = await env.DB.prepare('SELECT email FROM client_users WHERE email = ?').bind(email).first()
    if (existing) return json({ error: 'An account already exists for this email.' }, 409)
    const passwordHash = await hashPassword(body.password)
    await env.DB.prepare('INSERT INTO client_users (email, password_hash, name, business) VALUES (?, ?, ?, ?)').bind(email, passwordHash, body.name.trim(), body.business?.trim() || '').run()
    await ensureClient(env, email, body.name, body.business || '')
    const token = await createClientSession(email, env)
    return new Response(JSON.stringify({ authenticated: true, email }), { status: 201, headers: { 'Content-Type': 'application/json', 'Set-Cookie': `overdrive_client=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800` } })
  }

  if (path === '/api/client/login' && method === 'POST') {
    if (!env.DB || !env.CLIENT_SESSION_SECRET) return json({ error: 'Client account storage is not configured in Cloudflare.' }, 503)
    const body = await request.json()
    const turnstileError = await verifyTurnstile(request, env, body.turnstile_token)
    if (turnstileError) return json({ error: 'Complete the security check and try again.' }, 400)
    const email = (body.email || '').trim().toLowerCase()
    const user = await env.DB.prepare('SELECT email, password_hash FROM client_users WHERE email = ?').bind(email).first()
    if (!user || !await verifyPassword(body.password || '', user.password_hash)) return json({ error: 'Invalid email or password.' }, 401)
    await env.DB.prepare("UPDATE client_users SET last_login = datetime('now') WHERE email = ?").bind(email).run()
    const token = await createClientSession(email, env)
    return new Response(JSON.stringify({ authenticated: true, email }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': `overdrive_client=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800` } })
  }

  if (path === '/api/client/logout' && method === 'POST') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'overdrive_client=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' } })
  }

  if (path === '/api/client/session' && method === 'GET') {
    const email = await requireUser(request, env)
    return json({ authenticated: Boolean(email), email, configured: setup })
  }

  if (path === '/api/appointments' && method === 'POST') {
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const body = await request.json()
    const turnstileError = await verifyTurnstile(request, env, body.turnstile_token)
    if (turnstileError) return json({ error: 'Complete the security check and try again.' }, 400)
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
    for (const field of ['appointment_date', 'appointment_time', 'meeting_url', 'meeting_notes', 'cancellation_reason']) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(String(body[field] || '').trim())
      }
    }
    if (!updates.length) return json({ error: 'No appointment changes were provided.' }, 400)
    updates.push("updated_at = datetime('now')")
    values.push(appointmentMatch[1])
    await env.DB.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    const appointment = await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(appointmentMatch[1]).first()
    const emailResult = body.notify_client === false ? { sent: true } : await notifyAppointmentUpdate(env, appointment)
    return json({ ok: true, email_sent: emailResult.sent, email_error: emailResult.error || '' })
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
    const email = await requireUser(request, env)
    if (!email) return json({ error: 'Cloudflare Access client authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const result = await env.DB.prepare('SELECT * FROM documents WHERE client_email = ? AND is_published = 1 ORDER BY created_at DESC').bind(email).all()
    return json({ documents: result.results || [] })
  }

  if ((path === '/api/client/documents' || path === '/api/admin/documents') && method === 'POST') {
    const email = path.startsWith('/api/admin') ? await requireAdmin(request, env) : await requireUser(request, env)
    if (!email) return json({ error: 'Cloudflare Access authentication required.' }, 401)
    const missing = missingBindings(env)
    if (missing.length) return json({ error: `Connect ${missing.join(' and ')} before uploading documents.` }, 503)
    const form = await request.formData()
    const file = form.get('file')
    const clientEmail = path.startsWith('/api/admin') ? (form.get('client_email') || email).toString().toLowerCase() : email
    const category = ['Tax document', 'Payroll', 'Accounting', 'Other'].includes(form.get('category')) ? form.get('category').toString() : 'Other'
    const isPublished = path.startsWith('/api/admin') ? form.get('is_published') === 'true' : true
    if (!(file instanceof File) || !file.size) return json({ error: 'Choose a file to upload.' }, 400)
    if (file.size > 25 * 1024 * 1024) return json({ error: 'Files must be smaller than 25 MB.' }, 400)
    const fileName = safeFileName(file.name)
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
    const allowedExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx'])
    if (!allowedExtensions.has(extension)) return json({ error: 'This file type is not allowed.' }, 415)
    const storagePath = `${clientEmail}/${crypto.randomUUID()}-${fileName}`
    await env.DOCUMENTS.put(storagePath, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } })
    const id = crypto.randomUUID()
    try {
      await env.DB.prepare('INSERT INTO documents (id, client_email, file_name, storage_path, category, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, clientEmail, file.name, storagePath, category, isPublished ? 1 : 0, isPublished ? new Date().toISOString() : '').run()
    } catch (error) {
      await env.DOCUMENTS.delete(storagePath)
      throw error
    }
    return json({ document: { id, client_email: clientEmail, file_name: file.name, storage_path: storagePath, category, is_published: isPublished ? 1 : 0, published_at: isPublished ? new Date().toISOString() : '', created_at: new Date().toISOString() } }, 201)
  }

  const documentAdminMatch = path.match(/^\/api\/admin\/documents\/([^/]+)$/)
  if (documentAdminMatch && method === 'PATCH') {
    if (!await requireAdmin(request, env)) return json({ error: 'Admin authentication required.' }, 401)
    if (!env.DB) return json({ error: 'Cloudflare D1 is not connected yet.' }, 503)
    const body = await request.json()
    const category = ['Tax document', 'Payroll', 'Accounting', 'Other'].includes(body.category) ? body.category : 'Other'
    const isPublished = Boolean(body.is_published)
    await env.DB.prepare("UPDATE documents SET category = ?, is_published = ?, published_at = ? WHERE id = ?").bind(category, isPublished ? 1 : 0, isPublished ? new Date().toISOString() : '', documentAdminMatch[1]).run()
    return json({ ok: true })
  }

  const documentMatch = path.match(/^\/api\/(admin|client)\/documents\/([^/]+)(?:\/download)?$/)
  if (documentMatch && method === 'GET') {
    const admin = await requireAdmin(request, env)
    const email = admin || await requireUser(request, env)
    if (!email) return json({ error: 'Cloudflare Access authentication required.' }, 401)
    if (!env.DB || !env.DOCUMENTS) return json({ error: 'Cloudflare D1 and R2 are not connected yet.' }, 503)
    const document = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(documentMatch[2]).first()
    if (!document || (!admin && (document.client_email !== email || !document.is_published))) return json({ error: 'Document not found.' }, 404)
    const object = await env.DOCUMENTS.get(document.storage_path)
    if (!object) return json({ error: 'Stored file not found.' }, 404)
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    const mimeTypes = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    const extension = document.file_name.split('.').pop().toLowerCase()
    if (!headers.get('content-type') && mimeTypes[extension]) headers.set('content-type', mimeTypes[extension])
    const previewable = /\.(pdf|png|jpe?g|gif|webp|txt|csv)$/i.test(document.file_name)
    const disposition = url.searchParams.get('download') === '1' || !previewable ? 'attachment' : 'inline'
    headers.set('Content-Disposition', `${disposition}; filename="${safeFileName(document.file_name)}"`)
    headers.set('Cache-Control', 'private, no-store')
    headers.set('X-Content-Type-Options', 'nosniff')
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
      const url = new URL(request.url)
      if (['POST', 'PATCH', 'DELETE'].includes(request.method) && !sameOrigin(request)) return json({ error: 'Cross-origin request blocked.' }, 403)
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env)
      const response = await env.ASSETS.fetch(request)
      const headers = new Headers(response.headers)
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      headers.set('X-Frame-Options', 'DENY')
      headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https://overdriveaccountingservices.com https://lh3.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'")
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    } catch (error) {
      return json({ error: error.message || 'Unexpected server error.' }, 500)
    }
  },

  async email(message, env) {
    await handleInboundEmail(message, env)
  },
}
