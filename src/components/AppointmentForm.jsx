import { useState } from 'react'
import { ArrowUpRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

const initialForm = { name: '', email: '', business: '', service: 'Accounting & bookkeeping', appointment_date: '', notes: '' }

export default function AppointmentForm() {
  const [form, setForm] = useState(initialForm)
  const [state, setState] = useState({ loading: false, error: '', submitted: false, demo: false })

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submitAppointment = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '', submitted: false, demo: false })

    if (!hasSupabaseConfig) {
      setState({ loading: false, error: '', submitted: true, demo: true })
      return
    }

    const { error } = await supabase.from('appointments').insert(form)
    if (error) {
      setState({ loading: false, error: error.message, submitted: false, demo: false })
      return
    }

    setForm(initialForm)
    setState({ loading: false, error: '', submitted: true, demo: false })
  }

  if (state.submitted) {
    return <div className="appointment-success"><CheckCircle2 size={28} /><div><strong>Request received.</strong><p>{state.demo ? 'This demo request is ready to connect once Supabase is configured.' : 'Our team will review your request and follow up within 24 hours.'}</p><button className="text-link" onClick={() => setState({ loading: false, error: '', submitted: false, demo: false })}>Send another request <ArrowUpRight size={16} /></button></div></div>
  }

  return <form className="appointment-form" onSubmit={submitAppointment}>
    <div className="form-field"><label htmlFor="name">Your name</label><input id="name" name="name" value={form.name} onChange={updateField} placeholder="Alex Morgan" required /></div>
    <div className="form-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={updateField} placeholder="alex@business.com" required /></div>
    <div className="form-field"><label htmlFor="business">Business name</label><input id="business" name="business" value={form.business} onChange={updateField} placeholder="Your company" /></div>
    <div className="form-field"><label htmlFor="appointment_date">Preferred date</label><input id="appointment_date" name="appointment_date" type="date" value={form.appointment_date} onChange={updateField} required /></div>
    <div className="form-field form-field-wide"><label htmlFor="service">What can we help with?</label><select id="service" name="service" value={form.service} onChange={updateField}><option>Accounting & bookkeeping</option><option>Tax preparation & filing</option><option>Payroll management</option><option>Fractional CFO</option><option>Business advisory</option></select></div>
    <div className="form-field form-field-wide"><label htmlFor="notes">Anything we should know?</label><textarea id="notes" name="notes" value={form.notes} onChange={updateField} placeholder="Tell us a little about what you need." rows="4" /></div>
    {state.error && <p className="form-error">{state.error}</p>}
    <button className="button button-accent" disabled={state.loading} type="submit">{state.loading ? <><LoaderCircle className="spin" size={17} /> Sending request</> : <>Request a consultation <ArrowUpRight size={17} /></>}</button>
  </form>
}
