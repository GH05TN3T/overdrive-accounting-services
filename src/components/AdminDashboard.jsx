import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, LoaderCircle, LogOut, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { apiRequest } from '../lib/api'
import TurnstileWidget from './TurnstileWidget'

const filters = ['all', 'new', 'confirmed', 'completed', 'cancelled']

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', configured: true })
  const [appointments, setAppointments] = useState([])
  const [documents, setDocuments] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [turnstileToken, setTurnstileToken] = useState('')

  const loadDashboard = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const currentSession = await apiRequest('/api/admin/session')
      const configured = currentSession.configured?.database && currentSession.configured?.documents
      setSession(currentSession)
      setState({ loading: false, error: '', configured })
      if (!configured || !currentSession.authenticated || !currentSession.isAdmin) return
      const [appointmentData, documentData] = await Promise.all([apiRequest('/api/admin/appointments'), apiRequest('/api/admin/documents')])
      setAppointments(appointmentData.appointments || [])
      setDocuments(documentData.documents || [])
    } catch (error) {
      setState({ loading: false, error: error.message, configured: false })
    }
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboard()
    const poll = setInterval(() => loadDashboard(), 30000)
    return () => clearInterval(poll)
  }, [])

  const signIn = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, error: '' }))
    try {
      await apiRequest('/api/admin/login', { method: 'POST', body: JSON.stringify({ ...credentials, turnstile_token: turnstileToken }) })
      await loadDashboard()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/api/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status } : appointment))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const deleteDocument = async (document) => {
    try {
      await apiRequest(`/api/admin/documents/${document.id}`, { method: 'DELETE' })
      setDocuments((current) => current.filter((item) => item.id !== document.id))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  if (state.loading) return <DashboardFrame><LoaderCircle className="spin" /></DashboardFrame>
  if (!state.configured) return <DashboardFrame><CloudflareSetup message={state.error} /></DashboardFrame>
  if (!session?.authenticated || !session?.isAdmin) return <DashboardFrame><AdminLogin credentials={credentials} setCredentials={setCredentials} error={state.error} onSubmit={signIn} onToken={setTurnstileToken} /></DashboardFrame>

  const visibleAppointments = appointments.filter((appointment) => (filter === 'all' || appointment.status === filter) && `${appointment.name} ${appointment.email} ${appointment.business || ''}`.toLowerCase().includes(search.toLowerCase()))
  const newCount = appointments.filter((appointment) => appointment.status === 'new').length

  return <DashboardFrame session={session} onSignOut={async () => { await apiRequest('/api/admin/logout', { method: 'POST' }); window.location.reload() }}><div className="dashboard-heading"><div><span className="portal-eyebrow">Cloudflare operations</span><h1>Good morning, Overdrive.</h1><p>Appointments and client documents, together in one place. Data refreshes every 30 seconds.</p></div><button className="dashboard-refresh" onClick={() => loadDashboard(true)}><RefreshCw className={refreshing ? 'spin' : ''} size={16} /> Refresh</button></div><div className="dashboard-stats"><Stat icon={<CalendarDays />} label="Total appointments" value={appointments.length} /><Stat icon={<Clock3 />} label="Needs review" value={newCount} accent /><Stat icon={<Users />} label="Client documents" value={documents.length} /><Stat icon={<CheckCircle2 />} label="Completed" value={appointments.filter((appointment) => appointment.status === 'completed').length} /></div>{state.error && <p className="form-error dashboard-error">{state.error}</p>}<div className="dashboard-grid"><section className="dashboard-panel appointments-panel"><div className="panel-heading"><div><span className="portal-eyebrow">Live queue</span><h2>Appointments</h2></div><span className="live-pill"><span /> Auto refresh</span></div><div className="table-tools"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" /></div><div className="filter-tabs">{filters.map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="appointment-list">{visibleAppointments.length === 0 ? <div className="empty-state"><CalendarDays size={28} /><p>No appointments match this view.</p></div> : visibleAppointments.map((appointment) => <div className="appointment-row" key={appointment.id}><div className="appointment-date"><strong>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span></div><div className="appointment-details"><strong>{appointment.name}</strong><span>{appointment.business || 'Individual client'} · {appointment.service}</span><small>{appointment.email}</small></div><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => updateStatus(appointment.id, event.target.value)} aria-label={`Update status for ${appointment.name}`}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>)}</div></section><section className="dashboard-panel documents-panel-admin"><div className="panel-heading"><div><span className="portal-eyebrow">Cloudflare R2</span><h2>Recent documents</h2></div><span>{documents.length} total</span></div>{documents.length === 0 ? <div className="empty-state"><FileText size={28} /><p>Client documents will appear here after upload.</p></div> : <div className="admin-document-list">{documents.slice(0, 8).map((document) => <div className="admin-document-row" key={document.id}><a href={`/api/admin/documents/${document.id}/download`}><span className="document-icon"><FileText size={18} /></span><span><strong>{document.file_name}</strong><small>{document.client_email}</small></span></a><button className="delete-document" onClick={() => deleteDocument(document)} aria-label={`Delete ${document.file_name}`}><Trash2 size={15} /></button></div>)}</div>}</section></div></DashboardFrame>
}

function Stat({ icon, label, value, accent }) { return <div className={`dashboard-stat ${accent ? 'is-accent' : ''}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div> }
function CloudflareSetup({ message }) { return <div className="setup-notice"><span className="portal-eyebrow">Dashboard not connected</span><h1>Connect Cloudflare D1 and R2.</h1><p>{message || 'Create the D1 database and R2 bucket, add their bindings to wrangler.jsonc, run cloudflare/schema.sql, then deploy again.'}</p><a className="button button-accent" href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">Open Cloudflare <ArrowUpRight size={16} /></a></div> }
function AdminLogin({ credentials, setCredentials, error, onSubmit, onToken }) { return <div className="admin-login"><span className="portal-eyebrow">Overdrive operations</span><h1>Admin sign in.</h1><p>Use the staff credentials configured as Cloudflare Worker secrets.</p><form onSubmit={onSubmit}><label>Email address<input type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label><TurnstileWidget onToken={onToken} />{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">Sign in <ArrowUpRight size={16} /></button></form><a className="back-link" href="/"><ArrowUpRight size={15} /> View public website</a></div> }
function DashboardFrame({ children, session, onSignOut }) { return <div className="dashboard-page"><header className="dashboard-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a><div className="dashboard-user">{session?.email && <><span>{session.email}</span><button onClick={onSignOut}><LogOut size={15} /> Sign out</button></>}</div></header><main className="dashboard-content">{children}</main></div> }
