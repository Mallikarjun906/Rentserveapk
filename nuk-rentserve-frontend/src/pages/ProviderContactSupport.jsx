import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, readUser, unwrapItems } from '../services/api';
const categories = [{value:'account',label:'Account access'},{value:'application',label:'Provider application'},{value:'booking',label:'Customer request or booking'},{value:'payment',label:'Payment'},{value:'technical',label:'Technical issue'},{value:'other',label:'Other'}];
export default function ProviderContactSupport() {
  const user = readUser();
  const [form, setForm] = useState({subject:'',category:'application',message:''});
  const [tickets,setTickets] = useState([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  useEffect(() => { let active = true; api('support/mine').then(data => { if(active) setTickets(unwrapItems(data)); }).catch(e => { if(active) setError(e.message); }).finally(() => { if(active) setLoading(false); }); return () => { active = false; }; }, []);
  if (user?.role !== 'provider') return <Navigate to="/dashboard" replace />;
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); setSuccess(''); try { const ticket = await api('support', { method:'POST', body:form }); setSuccess(ticket?.message || 'Support request submitted.'); setForm({subject:'',category:'application',message:''}); const data = await api('support/mine'); setTickets(unwrapItems(data)); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  return <section className="wrap section provider-support-page"><Link to="/provider/dashboard" className="text-link">← Provider Dashboard</Link><div className="page-title"><span className="eyebrow">PROVIDER HELP DESK</span><h1>Contact Support</h1><p>Send a request to the NUK RentServe team and track your submitted support tickets.</p></div>
    <div className="support-layout"><form className="auth-card form-stack" onSubmit={submit}><h2>Submit a support request</h2><label>Subject<input required minLength={3} maxLength={160} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Briefly describe the issue" /></label><label>Issue category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option value={c.value} key={c.value}>{c.label}</option>)}</select></label><label>Message<textarea required minLength={10} maxLength={3000} rows={6} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Tell us what happened and what help you need." /></label>{error&&<div className="notice error" role="alert">{error}</div>}{success&&<div className="notice success" role="status">{success}</div>}<button className="btn btn-full" disabled={busy}>{busy?'Submitting…':'Submit support request'}</button></form>
    <aside className="support-history"><h2>Your support requests</h2>{loading?<p>Loading requests…</p>:tickets.length?<div className="enquiry-list">{tickets.map(t=><article className="enquiry-card" key={t._id}><div><span className="eyebrow">{t.category} · {t.status}</span><h3>{t.subject}</h3><p>{t.message}</p><small>Submitted {new Date(t.createdAt).toLocaleString()}</small>{t.adminNote&&<p><strong>Support note:</strong> {t.adminNote}</p>}</div></article>)}</div>:<div className="empty-state"><span>✉</span><h3>No support requests yet</h3><p>Your submitted tickets will appear here.</p></div>}</aside></div>
  </section>;
}
