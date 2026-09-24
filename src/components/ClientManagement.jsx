import { useEffect, useState } from 'react'
import { ArrowUpRight, Inbox, LoaderCircle, Mail, RefreshCw, Send, UserRound } from 'lucide-react'
import { apiRequest } from '../lib/api'

export default function ClientManagement({ documents = [] }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [composer, setComposer] = useState({ subject: '', body_text: '' })
  const [state, setState] = useState({ loading: true, sending: false, error: '' })

  const loadClients = async () => {
    try {
      const result = await apiRequest('/api/admin/clients')
      setClients(result.clients || [])
      setState((current) => ({ ...current, loading: false, error: '' }))
    } catch (error) { setState({ loading: false, sending: false, error: error.message }) }
  }

  const loadMessages = async (client) => {
    setSelectedClient(client)
    setComposer({ subject: '', body_text: '' })
    try {
      const result = await apiRequest(`/api/admin/messages?client_email=${encodeURIComponent(client.email)}`)
      setMessages(result.messages || [])
      setClients((current) => current.map((item) => item.email === client.email ? { ...item, unread_count: 0 } : item))
    } catch (error) { setState((current) => ({ ...current, error: error.message })) }
  }

  useEffect(() => { loadClients() }, [])

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!selectedClient) return
    setState((current) => ({ ...current, sending: true, error: '' }))
    try {
      const result = await apiRequest('/api/admin/messages', { method: 'POST', body: JSON.stringify({ client_email: selectedClient.email, ...composer }) })
      setMessages((current) => [...current, result.message])
      setComposer({ subject: '', body_text: '' })
      await loadClients()
      setState((current) => ({ ...current, sending: false }))
    } catch (error) { setState((current) => ({ ...current, sending: false, error: error.message })) }
  }

  const visibleClients = clients.filter((client) => `${client.name} ${client.email} ${client.business || ''}`.toLowerCase().includes(search.toLowerCase()))

  const selectedDocuments = selectedClient ? documents.filter((document) => document.client_email === selectedClient.email) : []
  return <section className="client-management dashboard-panel" id="clients"><div className="client-management-heading"><div><span className="portal-eyebrow">Client communications</span><h2>Inbox & client management</h2><p>Send replies through your verified Overdrive email and keep every conversation beside the client record.</p></div><button className="dashboard-refresh" onClick={loadClients}><RefreshCw size={15} /> Refresh</button></div>{state.error && <p className="form-error dashboard-error">{state.error}</p>}<div className="client-inbox-grid"><aside className="client-list"><div className="client-list-top"><strong>Clients</strong><span>{clients.length}</span></div><div className="search-box"><UserRound size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a client" /></div>{state.loading ? <LoaderCircle className="spin" /> : visibleClients.length === 0 ? <div className="client-empty">No clients yet. New consultation requests appear here automatically.</div> : <div className="client-list-items">{visibleClients.map((client) => <button className={`client-list-item ${selectedClient?.email === client.email ? 'active' : ''}`} key={client.email} onClick={() => loadMessages(client)}><span className="client-avatar">{(client.name || client.email).slice(0, 1).toUpperCase()}</span><span><strong>{client.name || client.email}</strong><small>{client.business || client.email}</small></span>{client.unread_count > 0 && <b>{client.unread_count}</b>}</button>)}</div>}</aside><div className="client-thread">{selectedClient ? <><div className="thread-heading"><div><span className="portal-eyebrow">Client detail</span><h3>{selectedClient.name || selectedClient.email}</h3><small>{selectedClient.email}{selectedClient.business ? ` - ${selectedClient.business}` : ''}</small></div><a href={`mailto:${selectedClient.email}`} className="thread-email"><Mail size={15} /> Email client</a></div><div className="client-file-strip"><span className="portal-eyebrow">Uploaded files</span>{selectedDocuments.length === 0 ? <small>No files uploaded yet.</small> : selectedDocuments.map((document) => <a href={`/api/admin/documents/${document.id}/download?download=1`} key={document.id}><FileText size={14} /> {document.file_name}</a>)}</div><div className="message-list">{messages.length === 0 ? <div className="client-empty"><Inbox size={27} /><p>No messages yet. Start the conversation below.</p></div> : messages.map((message) => <article className={`message-bubble ${message.direction}`} key={message.id}><div className="message-meta"><span>{message.direction === 'inbound' ? selectedClient.name || selectedClient.email : 'Overdrive Accounting Services'}</span><time>{new Date(message.created_at).toLocaleString()}</time></div>{message.subject && <strong>{message.subject}</strong>}<p>{message.body_text}</p></article>)}</div><form className="message-composer" onSubmit={sendMessage}><div className="composer-label"><span>New message</span><small>Sent through Resend</small></div><input placeholder="Subject" value={composer.subject} onChange={(event) => setComposer({ ...composer, subject: event.target.value })} required /><textarea rows="4" placeholder="Write a reply..." value={composer.body_text} onChange={(event) => setComposer({ ...composer, body_text: event.target.value })} required /><button className="button button-accent" disabled={state.sending} type="submit">{state.sending ? 'Sending...' : 'Send message'} <Send size={15} /></button></form></> : <div className="client-empty client-empty-large"><Inbox size={34} /><strong>Select a client to open their conversation</strong><p>Appointments and inbound email clients will be listed on the left.</p><a href="#appointments" className="text-link">View appointments <ArrowUpRight size={15} /></a></div>}</div></div></section>
}
