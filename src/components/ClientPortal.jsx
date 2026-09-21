import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, FileText, LoaderCircle, LogOut, UploadCloud } from 'lucide-react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

function PortalNotice() {
  return <div className="portal-notice"><strong>Supabase setup required</strong><p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local `.env` file, then run the SQL in `supabase/schema.sql`.</p><a href="/" className="text-link">Return to website <ArrowUpRight size={15} /></a></div>
}

export default function ClientPortal() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return undefined }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !supabase) return
    supabase.from('documents').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message)
      else setDocuments(data || [])
    })
  }, [session])

  const signIn = async (event) => {
    event.preventDefault()
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword(form)
    if (signInError) setError(signInError.message)
  }

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !supabase || !session) return
    setUploading(true)
    setError('')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)
    if (uploadError) { setError(uploadError.message); setUploading(false); return }
    const { data, error: recordError } = await supabase.from('documents').insert({ user_id: session.user.id, client_name: session.user.user_metadata?.full_name || '', client_email: session.user.email, file_name: file.name, storage_path: path }).select().single()
    if (recordError) setError(recordError.message)
    else setDocuments((current) => [data, ...current])
    setUploading(false)
    event.target.value = ''
  }

  const downloadDocument = async (document) => {
    const { data, error: downloadError } = await supabase.storage.from('client-documents').createSignedUrl(document.storage_path, 3600)
    if (downloadError) setError(downloadError.message)
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (!hasSupabaseConfig) return <div className="portal-page"><PortalHeader /><main className="portal-content"><PortalNotice /></main></div>
  if (authLoading) return <div className="portal-page"><PortalHeader /><main className="portal-content"><LoaderCircle className="spin" /></main></div>
  if (!session) return <div className="portal-page"><PortalHeader /><main className="portal-content"><div className="portal-auth"><span className="portal-eyebrow">Secure client access</span><h1>Your financial workspace.</h1><p>Sign in to securely send documents to the Overdrive team and view the files shared with you.</p><form onSubmit={signIn}><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">Sign in <ArrowUpRight size={16} /></button></form><a className="back-link" href="/"><ArrowLeft size={15} /> Back to website</a></div></main></div>

  return <div className="portal-page"><PortalHeader session={session} onSignOut={() => supabase.auth.signOut()} /><main className="portal-content"><div className="portal-title"><div><span className="portal-eyebrow">Client portal</span><h1>Your secure workspace.</h1><p>Send files directly to the Overdrive team. Your documents are stored privately and encrypted by Supabase Storage.</p></div><label className="upload-button"><UploadCloud size={17} />{uploading ? 'Uploading...' : 'Upload document'}<input type="file" onChange={uploadDocument} disabled={uploading} /></label></div>{error && <p className="form-error">{error}</p>}<section className="documents-panel"><div className="panel-heading"><div><span className="portal-eyebrow">Shared files</span><h2>Your documents</h2></div><span>{documents.length} files</span></div>{documents.length === 0 ? <div className="empty-state"><FileText size={28} /><p>No documents yet. Upload your first file when you are ready.</p></div> : <div className="document-list">{documents.map((document) => <button className="document-row" key={document.id} onClick={() => downloadDocument(document)}><span className="document-icon"><FileText size={19} /></span><span><strong>{document.file_name}</strong><small>{new Date(document.created_at).toLocaleDateString()}</small></span><ArrowUpRight size={16} /></button>)}</div>}</section></main></div>
}

function PortalHeader({ session, onSignOut }) {
  return <header className="portal-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a>{session && <button className="portal-signout" onClick={onSignOut}><LogOut size={15} /> Sign out</button>}</header>
}
