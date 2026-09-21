import { useEffect, useState } from 'react'
import { ArrowUpRight, FileText, LoaderCircle, LogOut, UploadCloud } from 'lucide-react'
import { apiRequest } from '../lib/api'

const emptyAuth = { name: '', business: '', email: '', password: '' }

export default function ClientPortal() {
  const [session, setSession] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', configured: true })
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)

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
      await apiRequest(`/api/client/${mode}`, { method: 'POST', body: JSON.stringify(authForm) })
      setAuthForm(emptyAuth)
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

  if (state.loading) return <div className="portal-page"><PortalHeader /><main className="portal-content"><LoaderCircle className="spin" /></main></div>
  if (!state.configured) return <div className="portal-page"><PortalHeader /><main className="portal-content"><CloudflareSetup message={state.error} /></main></div>
  if (!session?.authenticated) return <div className="portal-page"><PortalHeader /><main className="portal-content"><ClientAuth mode={mode} setMode={setMode} form={authForm} setForm={setAuthForm} error={state.error} onSubmit={submitAuth} /></main></div>

  return <div className="portal-page"><PortalHeader session={session} onSignOut={async () => { await apiRequest('/api/client/logout', { method: 'POST' }); window.location.reload() }} /><main className="portal-content"><div className="portal-title"><div><span className="portal-eyebrow">Client portal</span><h1>Your secure workspace.</h1><p>Send files directly to the Overdrive team. Documents are stored in a private Cloudflare R2 bucket.</p></div><label className="upload-button"><UploadCloud size={17} />{uploading ? 'Uploading...' : 'Upload document'}<input type="file" onChange={uploadDocument} disabled={uploading} /></label></div>{state.error && <p className="form-error">{state.error}</p>}<section className="documents-panel"><div className="panel-heading"><div><span className="portal-eyebrow">Shared files</span><h2>Your documents</h2></div><span>{documents.length} files</span></div>{documents.length === 0 ? <div className="empty-state"><FileText size={28} /><p>No documents yet. Upload your first file when you are ready.</p></div> : <div className="document-list">{documents.map((document) => <a className="document-row" href={`/api/client/documents/${document.id}/download`} key={document.id}><span className="document-icon"><FileText size={19} /></span><span><strong>{document.file_name}</strong><small>{new Date(document.created_at).toLocaleDateString()}</small></span><ArrowUpRight size={16} /></a>)}</div>}</section></main></div>
}

function ClientAuth({ mode, setMode, form, setForm, error, onSubmit }) {
  const register = mode === 'register'
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  return <div className="portal-auth"><span className="portal-eyebrow">Client portal</span><h1>{register ? 'Create your workspace.' : 'Welcome back.'}</h1><p>{register ? 'Create a secure account to send documents and stay connected with the Overdrive team.' : 'Sign in to upload documents and manage your secure client files.'}</p><form onSubmit={onSubmit}>{register && <><label>Full name<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label><label>Business name<input value={form.business} onChange={(event) => update('business', event.target.value)} /></label></>}<label>Email address<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label><label>Password<input type="password" minLength="8" value={form.password} onChange={(event) => update('password', event.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">{register ? 'Create account' : 'Sign in'} <ArrowUpRight size={16} /></button></form><button className="portal-mode-switch" onClick={() => { setMode(register ? 'login' : 'register'); setForm(emptyAuth) }}>{register ? 'Already have an account? Sign in' : 'New client? Create an account'}</button><a className="back-link" href="/"><ArrowUpRight size={15} /> Back to website</a></div>
}

function CloudflareSetup({ message }) { return <div className="portal-notice"><strong>Client accounts are not connected.</strong><p>{message || 'Run the client account migration and add CLIENT_SESSION_SECRET to Cloudflare Runtime Secrets.'}</p><a className="text-link" href="/">Return to website <ArrowUpRight size={15} /></a></div> }
function PortalHeader({ session, onSignOut }) { return <header className="portal-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a>{session?.email && <button className="portal-signout" onClick={onSignOut}><LogOut size={15} /> Sign out</button>}</header> }
