import { useEffect, useState } from 'react'
import { ArrowUpRight, Bell, CalendarDays, CheckCircle2, Download, FileCheck2, FileText, LoaderCircle, Mail, Save, Send, Settings, UploadCloud } from 'lucide-react'
import { apiRequest } from '../lib/api'

const tabs = ['overview', 'documents', 'appointments', 'messages', 'taxes', 'profile']

export default function ClientWorkspace({ session, onSignOut }) {
  const [view, setView] = useState('overview')
  const [data, setData] = useState({ client: {}, appointments: [], documents: [], messages: [], tax_tasks: [] })
  const [state, setState] = useState({ loading: true, error: '', saving: false })
  const [composer, setComposer] = useState({ subject: '', body_text: '' })
  const [profile, setProfile] = useState({ name: '', business: '', phone: '' })

  const loadWorkspace = async () => {
    try {
      const result = await apiRequest('/api/client/overview')
      setData(result)
      setProfile({ name: result.client?.name || '', business: result.client?.business || '', phone: result.client?.phone || '' })
      setState({ loading: false, error: '', saving: false })
    } catch (error) { setState({ loading: false, error: error.message, saving: false }) }
  }

  useEffect(() => { loadWorkspace() }, [])

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setState((current) => ({ ...current, saving: true, error: '' }))
    const form = new FormData()
    form.append('file', file)
    try { await apiRequest('/api/client/documents', { method: 'POST', body: form }); await loadWorkspace() } catch (error) { setState((current) => ({ ...current, saving: false, error: error.message })) }
    event.target.value = ''
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '' }))
    try { await apiRequest('/api/client/messages', { method: 'POST', body: JSON.stringify(composer) }); setComposer({ subject: '', body_text: '' }); await loadWorkspace() } catch (error) { setState((current) => ({ ...current, saving: false, error: error.message })) }
  }

  const updateAppointment = async (id, changes) => {
    setState((current) => ({ ...current, saving: true, error: '' }))
    try { await apiRequest(`/api/client/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }); await loadWorkspace() } catch (error) { setState((current) => ({ ...current, saving: false, error: error.message })) }
  }

  const updateTask = async (task, status) => {
    try { await apiRequest('/api/client/tax-tasks', { method: 'PATCH', body: JSON.stringify({ id: task.id, status }) }); await loadWorkspace() } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '' }))
    try { await apiRequest('/api/client/profile', { method: 'PATCH', body: JSON.stringify(profile) }); await loadWorkspace() } catch (error) { setState((current) => ({ ...current, saving: false, error: error.message })) }
  }

  const unread = data.messages.filter((message) => message.direction === 'inbound' && !message.is_read).length
  const outstandingTasks = data.tax_tasks.filter((task) => task.status !== 'complete').length

  if (state.loading) return <div className="crm-page"><LoaderCircle className="spin" /></div>

  return <div className="crm-page"><header className="crm-header"><a href="/" className="portal-logo"><img src="https://overdriveaccountingservices.com/wp-content/uploads/2024/05/WebLogo_White.png" alt="Overdrive Accounting Services" /></a><div className="crm-user"><span>{session.email}</span><button onClick={onSignOut}>Sign out</button></div></header><div className="crm-layout"><aside className="crm-sidebar"><span className="crm-kicker">Client workspace</span><h1>{data.client.name || 'Your workspace'}</h1><nav>{tabs.map((tab) => <button className={view === tab ? 'active' : ''} onClick={() => setView(tab)} key={tab}>{tab === 'overview' && <CheckCircle2 size={16} />}{tab === 'documents' && <FileText size={16} />}{tab === 'appointments' && <CalendarDays size={16} />}{tab === 'messages' && <Mail size={16} />}{tab === 'taxes' && <FileCheck2 size={16} />}{tab === 'profile' && <Settings size={16} />}{tab === 'taxes' ? 'Tax checklist' : tab[0].toUpperCase() + tab.slice(1)}{tab === 'messages' && unread > 0 && <b>{unread}</b>}</button>)}</nav><div className="crm-sidebar-note"><Bell size={15} /> Your Overdrive team will post updates here.</div></aside><main className="crm-main">{state.error && <p className="form-error">{state.error}</p>}{view === 'overview' && <Overview data={data} outstandingTasks={outstandingTasks} unread={unread} setView={setView} />}{view === 'documents' && <Documents data={data} onUpload={uploadDocument} saving={state.saving} />}{view === 'appointments' && <Appointments appointments={data.appointments} onUpdate={updateAppointment} />}{view === 'messages' && <Messages messages={data.messages} composer={composer} setComposer={setComposer} onSend={sendMessage} saving={state.saving} />}{view === 'taxes' && <TaxChecklist tasks={data.tax_tasks} onUpdate={updateTask} />}{view === 'profile' && <Profile profile={profile} setProfile={setProfile} onSave={saveProfile} saving={state.saving} />}</main></div></div>
}

function Overview({ data, outstandingTasks, unread, setView }) { return <><div className="crm-title"><div><span className="crm-kicker">Client overview</span><h2>Welcome back, {data.client.name || 'client'}.</h2><p>Keep your financial work moving with one secure place for every update.</p></div></div><div className="crm-metrics"><Metric value={data.appointments.filter((item) => item.status !== 'cancelled').length} label="Active appointments" /><Metric value={data.documents.length} label="Published documents" /><Metric value={unread} label="Unread messages" accent /><Metric value={outstandingTasks} label="Open tax tasks" /></div><div className="crm-overview-grid"><section className="crm-card"><div className="crm-card-heading"><div><span className="crm-kicker">Next steps</span><h3>Tax checklist</h3></div><button onClick={() => setView('taxes')}>View all <ArrowUpRight size={14} /></button></div>{data.tax_tasks.slice(0, 3).map((task) => <div className="crm-task-preview" key={task.id}><span className={`task-dot task-${task.status}`} /><span>{task.title}</span><small>{task.status}</small></div>)}</section><section className="crm-card"><div className="crm-card-heading"><div><span className="crm-kicker">Upcoming</span><h3>Appointments</h3></div><button onClick={() => setView('appointments')}>Manage <ArrowUpRight size={14} /></button></div>{data.appointments.filter((item) => item.status !== 'cancelled').slice(0, 2).map((appointment) => <div className="crm-appointment-preview" key={appointment.id}><strong>{appointment.appointment_date}</strong><span>{appointment.service}</span><small>{appointment.appointment_time || 'Time to be confirmed'}</small></div>)}</section></div></> }
function Metric({ value, label, accent }) { return <div className={`crm-metric ${accent ? 'accent' : ''}`}><strong>{value}</strong><span>{label}</span></div> }
function Documents({ data, onUpload, saving }) { return <section><CrmHeading eyebrow="Secure files" title="Documents" description="View published files and send new documents to the Overdrive team." /><div className="crm-action-row"><label className="crm-upload"><UploadCloud size={16} />{saving ? 'Uploading...' : 'Upload document'}<input type="file" onChange={onUpload} disabled={saving} /></label></div><div className="crm-document-grid">{data.documents.length === 0 ? <Empty title="No published documents yet" text="Your Overdrive team will publish prepared files here." /> : data.documents.map((document) => <div className="crm-document-card" key={document.id}><FileText size={22} /><div><strong>{document.file_name}</strong><small>{document.category || 'Other'} · {new Date(document.created_at).toLocaleDateString()}</small></div><a href={`/api/client/documents/${document.id}/download?download=1`}><Download size={15} /></a></div>)}</div></section> }
function Appointments({ appointments, onUpdate }) { return <section><CrmHeading eyebrow="Your schedule" title="Appointments" description="Review your consultations and request a new time when needed." /><div className="crm-list">{appointments.length === 0 ? <Empty title="No appointments yet" text="Your consultation requests will appear here." /> : appointments.map((appointment) => <div className="crm-list-row" key={appointment.id}><div className="crm-date-block"><strong>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { day: '2-digit' })}</strong><span>{new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span></div><div><strong>{appointment.service}</strong><small>{appointment.appointment_time || 'Time to be confirmed'} · {appointment.status}</small>{appointment.meeting_url && <a href={appointment.meeting_url} target="_blank" rel="noreferrer">Open meeting link <ArrowUpRight size={13} /></a>}</div>{appointment.status !== 'cancelled' && appointment.status !== 'completed' && <button className="crm-danger-link" onClick={() => onUpdate(appointment.id, { status: 'cancelled' })}>Cancel</button>}</div>)}</div></section> }
function Messages({ messages, composer, setComposer, onSend, saving }) { return <section><CrmHeading eyebrow="Secure communication" title="Messages" description="Keep your conversation with the Overdrive team in one private thread." /><div className="crm-thread">{messages.length === 0 ? <Empty title="No messages yet" text="Send a message to start the conversation." /> : messages.map((message) => <article className={`crm-message ${message.direction}`} key={message.id}><small>{message.direction === 'inbound' ? 'You' : 'Overdrive Accounting Services'} · {new Date(message.created_at).toLocaleString()}</small><strong>{message.subject}</strong><p>{message.body_text}</p></article>)}</div><form className="crm-compose" onSubmit={onSend}><input placeholder="Subject" value={composer.subject} onChange={(event) => setComposer({ ...composer, subject: event.target.value })} required /><textarea placeholder="Write a message..." rows="5" value={composer.body_text} onChange={(event) => setComposer({ ...composer, body_text: event.target.value })} required /><button className="button button-accent" disabled={saving} type="submit">Send message <Send size={15} /></button></form></section> }
function TaxChecklist({ tasks, onUpdate }) { return <section><CrmHeading eyebrow="Tax preparation" title="Tax checklist" description="Track the records requested by your Overdrive team." /><div className="crm-list">{tasks.map((task) => <div className="crm-list-row task-row" key={task.id}><span className={`task-dot task-${task.status}`} /><div><strong>{task.title}</strong><small>{task.description}</small></div><button className="crm-task-action" onClick={() => onUpdate(task, task.status === 'requested' ? 'uploaded' : 'requested')}>{task.status === 'uploaded' ? 'Mark requested' : 'Mark uploaded'}</button></div>)}</div></section> }
function Profile({ profile, setProfile, onSave, saving }) { return <section><CrmHeading eyebrow="Account settings" title="Profile" description="Keep your business details current for the Overdrive team." /><form className="crm-profile" onSubmit={onSave}><label>Full name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label><label>Business name<input value={profile.business} onChange={(event) => setProfile({ ...profile, business: event.target.value })} /></label><label>Phone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><button className="button button-accent" disabled={saving} type="submit">Save profile <Save size={15} /></button></form></section> }
function CrmHeading({ eyebrow, title, description }) { return <div className="crm-title"><span className="crm-kicker">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div> }
function Empty({ title, text }) { return <div className="crm-empty"><FileText size={28} /><strong>{title}</strong><p>{text}</p></div> }
