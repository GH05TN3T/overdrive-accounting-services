import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, ExternalLink, FileText, FolderOpen, LayoutDashboard, LoaderCircle, LogOut, Mail, RefreshCw, Save, Search, Settings, Trash2, UploadCloud, Users, Video, X } from 'lucide-react'
import { apiRequest } from '../lib/api'
import ClientManagement from './ClientManagement'
import TurnstileWidget from './TurnstileWidget'

const filters = ['all', 'new', 'confirmed', 'completed', 'cancelled']
const blankMeeting = { status: 'new', appointment_date: '', appointment_time: '', meeting_url: '', meeting_notes: '', cancellation_reason: '' }

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', configured: true })
  const [appointments, setAppointments] = useState([])
  const [documents, setDocuments] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [documentSearch, setDocumentSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [turnstileToken, setTurnstileToken] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [meetingForm, setMeetingForm] = useState(blankMeeting)
  const [savingMeeting, setSavingMeeting] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [documentClientEmail, setDocumentClientEmail] = useState('')
  const [documentCategory, setDocumentCategory] = useState('Tax document')
  const [publishDocument, setPublishDocument] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)

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
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const updateStatus = async (id, status) => {
    try {
      await apiRequest(`/api/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status } : appointment))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const openAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setMeetingForm({ status: appointment.status || 'new', appointment_date: appointment.appointment_date || '', appointment_time: appointment.appointment_time || '', meeting_url: appointment.meeting_url || '', meeting_notes: appointment.meeting_notes || '', cancellation_reason: appointment.cancellation_reason || '' })
  }

  const saveMeeting = async (event) => {
    event.preventDefault()
    setSavingMeeting(true)
    try {
      await apiRequest(`/api/admin/appointments/${selectedAppointment.id}`, { method: 'PATCH', body: JSON.stringify(meetingForm) })
      setAppointments((current) => current.map((appointment) => appointment.id === selectedAppointment.id ? { ...appointment, ...meetingForm } : appointment))
      setSelectedAppointment(null)
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
    setSavingMeeting(false)
  }

  const deleteAppointment = async (appointment) => {
    if (!window.confirm(`Permanently delete the appointment request from ${appointment.name}?`)) return
    try {
      await apiRequest(`/api/admin/appointments/${appointment.id}`, { method: 'DELETE' })
      setAppointments((current) => current.filter((item) => item.id !== appointment.id))
      setSelectedAppointment(null)
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const deleteDocument = async (document) => {
    try {
      await apiRequest(`/api/admin/documents/${document.id}`, { method: 'DELETE' })
      setDocuments((current) => current.filter((item) => item.id !== document.id))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !documentClientEmail) {
      setState((current) => ({ ...current, error: 'Enter the client email before uploading a document.' }))
      return
    }
    setUploadingDocument(true)
    const form = new FormData()
    form.append('file', file)
    form.append('client_email', documentClientEmail)
    form.append('category', documentCategory)
    form.append('is_published', String(publishDocument))
    try {
      const result = await apiRequest('/api/admin/documents', { method: 'POST', body: form })
      setDocuments((current) => [result.document, ...current])
      setState((current) => ({ ...current, error: '' }))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
    setUploadingDocument(false)
    event.target.value = ''
  }

  const toggleDocumentPublish = async (document) => {
    try {
      await apiRequest(`/api/admin/documents/${document.id}`, { method: 'PATCH', body: JSON.stringify({ category: document.category, is_published: !document.is_published }) })
      setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, is_published: item.is_published ? 0 : 1, published_at: item.is_published ? '' : new Date().toISOString() } : item))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const navigateDashboard = (view) => {
    setActiveView(view)
    window.requestAnimationFrame(() => document.getElementById(view)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  if (state.loading) return <DashboardFrame><LoaderCircle className="spin" /></DashboardFrame>
  if (!state.configured) return <DashboardFrame><CloudflareSetup message={state.error} /></DashboardFrame>
  if (!session?.authenticated || !session?.isAdmin) return <DashboardFrame><AdminLogin credentials={credentials} setCredentials={setCredentials} error={state.error} onSubmit={signIn} onToken={setTurnstileToken} /></DashboardFrame>

  const activeAppointments = appointments.filter((appointment) => appointment.status !== 'cancelled')
  const newCount = appointments.filter((appointment) => appointment.status === 'new').length
  const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length
  const visibleAppointments = appointments.filter((appointment) => (filter === 'all' || appointment.status === filter) && `${appointment.name} ${appointment.email} ${appointment.business || ''}`.toLowerCase().includes(search.toLowerCase()))
  const visibleDocuments = documents.filter((document) => `${document.file_name} ${document.client_email}`.toLowerCase().includes(documentSearch.toLowerCase()))

  return <DashboardFrame session={session} activeView={activeView} onNavigate={navigateDashboard} onSignOut={async () => { await apiRequest('/api/admin/logout', { method: 'POST' }); window.location.reload() }}>
    <div className="dashboard-heading" id="overview"><div><span className="portal-eyebrow">Cloudflare operations</span><h1>Good morning, Overdrive.</h1><p>Appointments and client documents, together in one place. Data refreshes every 30 seconds.</p></div><button className="dashboard-refresh" onClick={() => loadDashboard(true)}><RefreshCw className={refreshing ? 'spin' : ''} size={16} /> Refresh</button></div>
    <div className="dashboard-stats"><Stat icon={<CalendarDays />} label="Active consultations" value={activeAppointments.length} /><Stat icon={<Clock3 />} label="Needs review" value={newCount} accent /><Stat icon={<Video />} label="Scheduled meetings" value={confirmedCount} /><Stat icon={<CheckCircle2 />} label="Completed" value={appointments.filter((appointment) => appointment.status === 'completed').length} /></div>
    {state.error && <p className="form-error dashboard-error">{state.error}</p>}
    <div className="dashboard-grid">
      <section className="dashboard-panel appointments-panel" id="appointments"><div className="panel-heading"><div><span className="portal-eyebrow">Live queue</span><h2>Appointments</h2></div><span className="live-pill"><span /> Auto refresh</span></div><div className="table-tools"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" /></div><div className="filter-tabs">{filters.map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="appointment-list">{visibleAppointments.length === 0 ? <div className="empty-state"><CalendarDays size={28} /><p>No appointments match this view.</p></div> : visibleAppointments.map((appointment) => <div className="appointment-row" key={appointment.id}><div className="appointment-date"><strong>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span></div><div className="appointment-details"><strong>{appointment.name}</strong><span>{appointment.business || 'Individual client'} - {appointment.service}</span><small>{appointment.email}{appointment.appointment_time ? ` - ${appointment.appointment_time}` : ''}</small></div><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => updateStatus(appointment.id, event.target.value)} aria-label={`Update status for ${appointment.name}`}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="manage-appointment" onClick={() => openAppointment(appointment)}>Manage</button></div>)}</div></section>
      <section className="dashboard-panel documents-panel-admin" id="documents"><div className="panel-heading"><div><span className="portal-eyebrow">Cloudflare R2</span><h2>Client documents</h2></div><span>{documents.length} total</span></div><div className="document-actions"><div className="document-search"><Search size={15} /><input value={documentSearch} onChange={(event) => setDocumentSearch(event.target.value)} placeholder="Search files or clients" /></div><input className="document-client-email" type="email" value={documentClientEmail} onChange={(event) => setDocumentClientEmail(event.target.value)} placeholder="Client email for upload" /><select className="document-category" value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}><option>Tax document</option><option>Payroll</option><option>Accounting</option><option>Other</option></select><label className="document-publish-check"><input type="checkbox" checked={publishDocument} onChange={(event) => setPublishDocument(event.target.checked)} /> Publish now</label><label className="document-upload-button"><UploadCloud size={15} />{uploadingDocument ? 'Uploading...' : 'Upload file'}<input type="file" onChange={uploadDocument} disabled={uploadingDocument} /></label></div>{visibleDocuments.length === 0 ? <div className="empty-state"><FileText size={28} /><p>No documents match this search.</p></div> : <div className="admin-document-list">{visibleDocuments.slice(0, 10).map((document) => <div className="admin-document-row" key={document.id}><a href={`/api/admin/documents/${document.id}/download`}><span className="document-icon"><FileText size={18} /></span><span><strong>{document.file_name}</strong><small>{document.client_email} - {document.category || 'Other'}</small></span></a><span className={`document-state ${document.is_published ? 'published' : 'draft'}`}>{document.is_published ? 'Published' : 'Draft'}</span><button className="publish-document" onClick={() => toggleDocumentPublish(document)}>{document.is_published ? 'Unpublish' : 'Publish'}</button><button className="delete-document" onClick={() => deleteDocument(document)} aria-label={`Delete ${document.file_name}`}><Trash2 size={15} /></button></div>)}</div>}</section>
    </div>
    <section className="dashboard-panel calendar-panel" id="calendar"><CalendarView appointments={appointments} onSelectAppointment={openAppointment} /></section>
    <ClientManagement />
    {selectedAppointment && <AppointmentDrawer appointment={selectedAppointment} form={meetingForm} setForm={setMeetingForm} saving={savingMeeting} onSave={saveMeeting} onDelete={deleteAppointment} onClose={() => setSelectedAppointment(null)} />}
  </DashboardFrame>
}

function AppointmentDrawer({ appointment, form, setForm, saving, onSave, onDelete, onClose }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="appointment-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="portal-eyebrow">Appointment details</span><h2>{appointment.name}</h2><p>{appointment.email}</p></div><button onClick={onClose} aria-label="Close appointment details"><X size={19} /></button></div><div className="drawer-client-card"><span className="drawer-avatar">{appointment.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><strong>{appointment.business || 'Individual client'}</strong><small>{appointment.service}</small></div></div><form className="drawer-form" onSubmit={onSave}><label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><div className="drawer-two-col"><label>Meeting date<input type="date" value={form.appointment_date} onChange={(event) => update('appointment_date', event.target.value)} /></label><label>Meeting time<input type="time" value={form.appointment_time} onChange={(event) => update('appointment_time', event.target.value)} /></label></div><label>Video meeting link<div className="input-with-icon"><Video size={15} /><input type="url" value={form.meeting_url} onChange={(event) => update('meeting_url', event.target.value)} placeholder="https://meet.google.com/..." /></div></label><label>Meeting notes<textarea rows="4" value={form.meeting_notes} onChange={(event) => update('meeting_notes', event.target.value)} placeholder="Agenda, preparation, or follow-up notes" /></label>{form.status === 'cancelled' && <label>Cancellation reason<textarea rows="3" value={form.cancellation_reason} onChange={(event) => update('cancellation_reason', event.target.value)} placeholder="Why was this consultation cancelled?" /></label>}<div className="drawer-actions"><button className="button button-accent" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save changes'} <Save size={16} /></button>{form.meeting_url && <a className="drawer-meeting-link" href={form.meeting_url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open meeting</a>}<button className="drawer-delete" type="button" onClick={() => onDelete(appointment)}><Trash2 size={14} /> Delete permanently</button></div></form></aside></div>
}

function Stat({ icon, label, value, accent }) { return <div className={`dashboard-stat ${accent ? 'is-accent' : ''}`}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div> }
function CalendarView({ appointments, onSelectAppointment }) {
  const [month, setMonth] = useState(() => new Date())
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDay + 1
    return dayNumber > 0 && dayNumber <= daysInMonth ? new Date(year, monthIndex, dayNumber) : null
  })
  const keyFor = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : ''
  const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return <div><div className="calendar-heading"><div><span className="portal-eyebrow">Planning view</span><h2>Consultation calendar</h2><p>Click any appointment to manage its meeting details.</p></div><div className="calendar-controls"><button onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} aria-label="Previous month">←</button><strong>{monthName}</strong><button onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} aria-label="Next month">→</button></div></div><div className="calendar-weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((date, index) => { const dayAppointments = date ? appointments.filter((appointment) => appointment.appointment_date === keyFor(date)) : []; return <div className={`calendar-day ${date ? '' : 'is-empty'} ${date && date.toDateString() === new Date().toDateString() ? 'is-today' : ''}`} key={`${keyFor(date)}-${index}`}>{date && <><span className="calendar-day-number">{date.getDate()}</span><div className="calendar-events">{dayAppointments.slice(0, 3).map((appointment) => <button className={`calendar-event event-${appointment.status}`} key={appointment.id} onClick={() => onSelectAppointment(appointment)}><span>{appointment.appointment_time || 'Consult'}</span> {appointment.name}</button>)}{dayAppointments.length > 3 && <small>+{dayAppointments.length - 3} more</small>}</div></>}</div>})}</div></div>
}
function CloudflareSetup({ message }) { return <div className="setup-notice"><span className="portal-eyebrow">Dashboard not connected</span><h1>Connect Cloudflare D1 and R2.</h1><p>{message || 'Create the D1 database and R2 bucket, add their bindings to wrangler.jsonc, run cloudflare/schema.sql, then deploy again.'}</p><a className="button button-accent" href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">Open Cloudflare <ArrowUpRight size={16} /></a></div> }
function AdminLogin({ credentials, setCredentials, error, onSubmit, onToken }) { return <div className="admin-login"><span className="portal-eyebrow">Overdrive operations</span><h1>Admin sign in.</h1><p>Use the staff credentials configured as Cloudflare Worker secrets.</p><form onSubmit={onSubmit}><label>Email address<input type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label><TurnstileWidget onToken={onToken} />{error && <p className="form-error">{error}</p>}<button className="button button-accent" type="submit">Sign in <ArrowUpRight size={16} /></button></form><a className="back-link" href="/"><ArrowUpRight size={15} /> View public website</a></div> }
function DashboardFrame({ children, session, activeView = 'overview', onNavigate, onSignOut }) { return <div className="dashboard-page dashboard-shell"><aside className="dashboard-sidebar"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a><div className="sidebar-label">Workspace</div><nav className="dashboard-nav"><button className={activeView === 'overview' ? 'active' : ''} onClick={() => onNavigate?.('overview')}><LayoutDashboard size={16} /> Overview</button><button className={activeView === 'appointments' ? 'active' : ''} onClick={() => onNavigate?.('appointments')}><CalendarDays size={16} /> Appointments</button><button className={activeView === 'documents' ? 'active' : ''} onClick={() => onNavigate?.('documents')}><FolderOpen size={16} /> Documents</button><button className={activeView === 'calendar' ? 'active' : ''} onClick={() => onNavigate?.('calendar')}><CalendarDays size={16} /> Calendar</button><button className={activeView === 'clients' ? 'active' : ''} onClick={() => onNavigate?.('clients')}><Mail size={16} /> Clients & inbox</button><a href="/"><ExternalLink size={16} /> Public website</a></nav><div className="sidebar-footer"><span><span className="status-dot" /> Systems online</span><small>D1 + R2 workspace</small><a href="mailto:Info@OverdriveAccountingServices.com"><Settings size={14} /> Get support</a></div></aside><div className="dashboard-main"><header className="dashboard-header"><div className="dashboard-breadcrumb"><span>Overdrive</span><strong>Operations</strong></div><div className="dashboard-user">{session?.email && <><span>{session.email}</span><button onClick={onSignOut}><LogOut size={15} /> Sign out</button></>}</div></header><main className="dashboard-content">{children}</main></div></div> }
