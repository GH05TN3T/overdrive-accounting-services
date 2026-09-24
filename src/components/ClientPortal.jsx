import { useEffect, useState } from 'react'
import { ArrowUpRight, Download, Eye, FileText, LoaderCircle, LogOut, UploadCloud } from 'lucide-react'
import { apiRequest } from '../lib/api'
import ClientWorkspace from './ClientWorkspace'
import TurnstileWidget from './TurnstileWidget'

const emptyAuth = { name: '', business: '', email: '', password: '' }

export default function ClientPortal() {
  const [session, setSession] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', configured: true })
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [documentError, setDocumentError] = useState('')
  const [mode, setMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [turnstileToken, setTurnstileToken] = useState('')

  const loadPortal = async () => {
    try {
      const currentSession = await apiRequest('/api/client/session')
      const configured = currentSession.configured?.database && currentSession.configured?.documents && currentSession.configured?.clientAccounts
      setSession(currentSession)
      setState({ loading: false, error: '', configured })
      if (currentSession.authenticated) {
        const result = await apiRequest('/api/client/documents')
        setDocuments(result.documents || [])
      }
    } catch (error) { setState({ loading: false, error: error.message, configured: false }) }
  }

  useEffect(() => { loadPortal() }, [])

  const submitAuth = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, error: '' }))
    try {
      await apiRequest(`/api/client/${mode}`, { method: 'POST', body: JSON.stringify({ ...authForm, turnstile_token: turnstileToken }) })
      setAuthForm(emptyAuth)
      setTurnstileToken('')
      await loadPortal()
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setState((current) => ({ ...current, error: '' }))
    const form = new FormData()
    form.append('file', file)
    try {
      const result = await apiRequest('/api/client/documents', { method: 'POST', body: form })
      setDocuments((current) => [result.document, ...current])
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
    setUploading(false)
    event.target.value = ''
  }

  const openDocument = async (file, download = false) => {
    const previewWindow = download ? null : window.open('about:blank', '_blank')
    setDocumentError('')
    try {
      const response = await fetch(`/api/client/documents/${file.id}/download${download ? '?download=1' : ''}`, { credentials: 'include' })
      if (!response.ok) throw new Error(`The document could not be opened (${response.status}).`)
      const blobUrl = URL.createObjectURL(await response.blob())
      if (download) {
        const link = window.document.createElement('a')
        link.href = blobUrl
        link.download = file.file_name
        link.click()
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      } else if (previewWindow) {
        previewWindow.location.href = blobUrl
      }
    } catch (error) {
      previewWindow?.close()
      setDocumentError(error.message)
    }
  }

  if (state.loading) return <div className="portal-page"><PortalHeader /><main className="portal-content"><LoaderCircle className="spin" /></main></div>
  if (!state.configured) return <div className="portal-page"><PortalHeader /><main className="portal-content"><CloudflareSetup message={state.error} /></main></div>
  if (!session?.authenticated) return <div className="portal-page"><PortalHeader /><main className="portal-content"><ClientAuth mode={mode} setMode={setMode} form={authForm} setForm={setAuthForm} error={state.error} onSubmit={submitAuth} onToken={setTurnstileToken} /></main></div>

  return <ClientWorkspace session={session} onSignOut={async () => { await apiRequest('/api/client/logout', { method: 'POST' }); window.location.reload() }} />
}

function ClientAuth({ mode, setMode, form, setForm, error, onSubmit, onToken }) {
  const register = mode === 'register'
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  return <div className="portal-auth"><span className="portal-eyebrow">Client portal</span><h1>{register ? 'Create your workspace.' : 'Welcome back.'}</h1><p>{register ? 'Create a secure account to send documents and stay connected with the Overdrive team.' : 'Sign in to upload documents and manage your secure client files.'}</p><form onSubmit={onSubmit}>{register && <><label>Full name<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label><label>Business name<input value={form.business} onChange={(event) => update('business', event.target.value)} /></label></>}<label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label><label>Password<input type="password" minLength="8" value={form.password} onChange={(event) => update('password', event.target.value)} required /></label><TurnstileWidget onToken={onToken} />{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">{register ? 'Create account' : 'Sign in'} <ArrowUpRight size={16} /></button></form><button className="portal-mode-switch" onClick={() => { setMode(register ? 'login' : 'register'); setForm(emptyAuth) }}>{register ? 'Already have an account? Sign in' : 'New client? Create an account'}</button><a className="back-link" href="/"><ArrowUpRight size={15} /> Back to website</a></div>
}

function CloudflareSetup({ message }) { return <div className="portal-notice"><strong>Client accounts are not connected.</strong><p>{message || 'Run the client account migration and add CLIENT_SESSION_SECRET to Cloudflare Runtime Secrets.'}</p><a className="text-link" href="/">Return to website <ArrowUpRight size={15} /></a></div> }
function PortalHeader({ session, onSignOut }) { return <header className="portal-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a>{session?.email && <button className="portal-signout" onClick={onSignOut}><LogOut size={15} /> Sign out</button>}</header> }
