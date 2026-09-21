import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, LoaderCircle, LogOut, RefreshCw, Search, Trash2, Users, XCircle } from 'lucide-react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const filters = ['all', 'new', 'confirmed', 'completed', 'cancelled']

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [documents, setDocuments] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return undefined }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadDashboard = async () => {
    if (!supabase || !session) return
    setRefreshing(true)
    const [{ data: appointmentData, error: appointmentError }, { data: documentData, error: documentError }] = await Promise.all([
      supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
    ])
    const nextError = appointmentError || documentError
    if (nextError) setError(nextError.message)
    else { setError(''); setAppointments(appointmentData || []); setDocuments(documentData || []) }
    setRefreshing(false)
  }

  useEffect(() => {
    if (!session || !supabase) return undefined
    loadDashboard()
    const channel = supabase.channel('overdrive-admin-live').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, loadDashboard).on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, loadDashboard).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  const signIn = async (event) => {
    event.preventDefault()
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword(login)
    if (signInError) setError(signInError.message)
  }

  const updateStatus = async (id, status) => {
    const { error: updateError } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (updateError) setError(updateError.message)
    else setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status } : appointment))
  }

  const downloadDocument = async (document) => {
    const { data, error: downloadError } = await supabase.storage.from('client-documents').createSignedUrl(document.storage_path, 3600)
    if (downloadError) setError(downloadError.message)
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const deleteDocument = async (document) => {
    const { error: storageError } = await supabase.storage.from('client-documents').remove([document.storage_path])
    if (storageError) { setError(storageError.message); return }
    const { error: recordError } = await supabase.from('documents').delete().eq('id', document.id)
    if (recordError) setError(recordError.message)
    else setDocuments((current) => current.filter((item) => item.id !== document.id))
  }

  if (!hasSupabaseConfig) return <DashboardFrame><SetupNotice /></DashboardFrame>
  if (authLoading) return <DashboardFrame><LoaderCircle className="spin" /></DashboardFrame>
  if (!session) return <DashboardFrame><div className="admin-login"><span className="portal-eyebrow">Overdrive operations</span><h1>Admin sign in.</h1><p>Manage appointments, client requests, and secure documents from one place.</p><form onSubmit={signIn}><label>Email address<input type="email" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} required /></label><label>Password<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">Sign in <ArrowUpRight size={16} /></button></form><a className="back-link" href="/"><ArrowUpRight size={15} /> View public website</a></div></DashboardFrame>

  const visibleAppointments = appointments.filter((appointment) => (filter === 'all' || appointment.status === filter) && `${appointment.name} ${appointment.email} ${appointment.business || ''}`.toLowerCase().includes(search.toLowerCase()))
  const newCount = appointments.filter((appointment) => appointment.status === 'new').length

  return <DashboardFrame session={session} onSignOut={() => supabase.auth.signOut()}><div className="dashboard-heading"><div><span className="portal-eyebrow">Operations overview</span><h1>Good morning, Overdrive.</h1><p>Keep the next conversation moving and every client file in its place.</p></div><button className="dashboard-refresh" onClick={loadDashboard}><RefreshCw className={refreshing ? 'spin' : ''} size={16} /> Refresh</button></div><div className="dashboard-stats"><Stat icon={<CalendarDays />} label="Total appointments" value={appointments.length} /><Stat icon={<Clock3 />} label="Needs review" value={newCount} accent /><Stat icon={<Users />} label="Client documents" value={documents.length} /><Stat icon={<CheckCircle2 />} label="Completed" value={appointments.filter((appointment) => appointment.status === 'completed').length} /></div>{error && <p className="form-error dashboard-error">{error}</p>}<div className="dashboard-grid"><section className="dashboard-panel appointments-panel"><div className="panel-heading"><div><span className="portal-eyebrow">Live queue</span><h2>Appointments</h2></div><span className="live-pill"><span /> Realtime</span></div><div className="table-tools"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" /></div><div className="filter-tabs">{filters.map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="appointment-list">{visibleAppointments.length === 0 ? <div className="empty-state"><CalendarDays size={28} /><p>No appointments match this view.</p></div> : visibleAppointments.map((appointment) => <div className="appointment-row" key={appointment.id}><div className="appointment-date"><strong>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span></div><div className="appointment-details"><strong>{appointment.name}</strong><span>{appointment.business || 'Individual client'} · {appointment.service}</span><small>{appointment.email}</small></div><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => updateStatus(appointment.id, event.target.value)} aria-label={`Update status for ${appointment.name}`}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>)}</div></section><section className="dashboard-panel documents-panel-admin"><div className="panel-heading"><div><span className="portal-eyebrow">Secure storage</span><h2>Recent documents</h2></div><span>{documents.length} total</span></div>{documents.length === 0 ? <div className="empty-state"><FileText size={28} /><p>Client documents will appear here after upload.</p></div> : <div className="admin-document-list">{documents.slice(0, 8).map((document) => <div className="admin-document-row" key={document.id}><button onClick={() => downloadDocument(document)}><span className="document-icon"><FileText size={18} /></span><span><strong>{document.file_name}</strong><small>{document.client_email}</small></span></button><button className="delete-document" onClick={() => deleteDocument(document)} aria-label={`Delete ${document.file_name}`}><Trash2 size={15} /></button></div>)}</div>}</section></div></DashboardFrame>
}

function Stat({ icon, label, value, accent }) { return <div className={`dashboard-stat ${accent ? 'is-accent' : ''}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div> }
function SetupNotice() { return <div className="setup-notice"><span className="portal-eyebrow">Dashboard not connected</span><h1>Connect Supabase to go live.</h1><p>Copy `.env.example` to `.env`, add your Supabase project values, run `supabase/schema.sql`, then create your admin auth user.</p><a className="button button-accent" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase <ArrowUpRight size={16} /></a></div> }
function DashboardFrame({ children, session, onSignOut }) { return <div className="dashboard-page"><header className="dashboard-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a><div className="dashboard-user">{session && <><span>{session.user.email}</span><button onClick={onSignOut}><LogOut size={15} /> Sign out</button></>}</div></header><main className="dashboard-content">{children}</main></div> }
