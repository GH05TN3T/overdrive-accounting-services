export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  })

  let payload = {}
  try { payload = await response.json() } catch { payload = {} }
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed with status ${response.status}`)
    error.status = response.status
    throw error
  }
  return payload
}
