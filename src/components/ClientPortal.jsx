import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, FileText, LoaderCircle, LogOut, UploadCloud } from 'lucide-react'
import { apiRequest } from '../lib/api'

export default function ClientPortal() {
  const [session, setSession] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', configured: true })
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)

  const loadPortal = async () => {
    try {
      const currentSession = await apiRequest('/api/client/session')
      setSession(currentSession)
      setState({ loading: false, error: '', configured: currentSession.configured?.database && currentSession.configured?.documents })
      if (currentSession.authenticated) {
        const result = await apiRequest('/api/client/documents')
        setDocuments(result.documents || [])
      }
    } catch (error) {
      setState({ loading: false, error: error.message, configured: false })
    }
  }

  useEffect(() => { loadPortal() }, [])

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
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
    setUploading(false)
    event.target.value = ''
  }

  if (state.loading) return <div className="portal-page"><PortalHeader /><main className="portal-content"><LoaderCircle className="spin" /></main></div>
  if (!state.configured) return <div className="portal-page"><PortalHeader /><main className="portal-content"><CloudflareSetup message={state.error} /></main></div>
  if (!session?.authenticated) return <div className="portal-page"><PortalHeader /><main className="portal-content"><AccessRequired label="Client portal access" /></main></div>

  return <div className="portal-page"><PortalHeader session={session} /><main className="portal-content"><div className="portal-title"><div><span className="portal-eyebrow">Cloudflare client portal</span><h1>Your secure workspace.</h1><p>Send files directly to the Overdrive team. Documents are stored in a private Cloudflare R2 bucket.</p></div><label className="upload-button"><UploadCloud size={17} />{uploading ? 'Uploading...' : 'Upload document'}<input type="file" onChange={uploadDocument} disabled={uploading} /></label></div>{state.error && <p className="form-error">{state.error}</p>}<section className="documents-panel"><div className="panel-heading"><div><span className="portal-eyebrow">Shared files</span><h2>Your documents</h2></div><span>{documents.length} files</span></div>{documents.length === 0 ? <div className="empty-state"><FileText size={28} /><p>No documents yet. Upload your first file when you are ready.</p></div> : <div className="document-list">{documents.map((document) => <a className="document-row" href={`/api/client/documents/${document.id}/download`} key={document.id}><span className="document-icon"><FileText size={19} /></span><span><strong>{document.file_name}</strong><small>{new Date(document.created_at).toLocaleDateString()}</small></span><ArrowUpRight size={16} /></a>)}</div>}</section></main></div>
}

function CloudflareSetup({ message }) {
  return <div className="portal-notice"><strong>Cloudflare storage is not connected.</strong><p>{message || 'Create the D1 database and R2 bucket, add their bindings to wrangler.jsonc, then deploy again.'}</p><a className="text-link" href="/">Return to website <ArrowUpRight size={15} /></a></div>
}

function AccessRequired({ label }) {
  return <div className="portal-auth"><span className="portal-eyebrow">{label}</span><h1>Sign in with Cloudflare Access.</h1><p>This protected workspace uses Cloudflare Access for identity. Open this route through the Access-protected domain and complete the email verification step.</p><a className="button button-accent" href="/">Back to website <ArrowUpRight size={16} /></a></div>
}

function PortalHeader({ session }) {
  return <header className="portal-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a>{session?.email && <span className="portal-signout"><LogOut size={15} /> {session.email}</span>}</header>
}
