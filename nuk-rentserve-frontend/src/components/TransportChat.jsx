import { useCallback, useEffect, useState } from 'react';
import { api, readUser, unwrapItems } from '../services/api';

export default function TransportChat({ bookingId, title = 'Trip messages' }) {
  const currentUser = readUser();
  const currentUserId = currentUser?.id || currentUser?._id;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    try { setMessages(unwrapItems(await api(`transport-bookings/${bookingId}/messages`))); setError(''); }
    catch (e) { setError(e.message); }
  }, [bookingId]);
  useEffect(() => { load(); const timer = window.setInterval(load, 3000); return () => window.clearInterval(timer); }, [load]);
  async function send(e) {
    e.preventDefault(); const message = draft.trim(); if (!message || sending) return;
    setSending(true); setError('');
    try { await api(`transport-bookings/${bookingId}/messages`, { method: 'POST', body: { message } }); setDraft(''); await load(); }
    catch (e) { setError(e.message); }
    finally { setSending(false); }
  }
  return <section className="transport-chat" aria-label={title}>
    <div className="transport-chat-heading"><div><span className="eyebrow">BOOKING CHAT</span><h3>{title}</h3></div><span className="chat-live-dot">● Updates every 3 sec</span></div>
    <div className="transport-chat-messages" aria-live="polite">{messages.length ? messages.map(m => <article className={`transport-chat-message ${m.senderId?._id === currentUserId ? 'mine' : ''}`} key={m._id}><p>{m.message}</p><small>{m.senderId?.name || 'Participant'} · {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small></article>) : <p className="chat-empty">No messages yet. Send a message to coordinate the pickup.</p>}</div>
    {error && <p className="notice error" role="alert">{error}</p>}
    <form className="transport-chat-compose" onSubmit={send}><input aria-label="Message" maxLength={2000} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a message…"/><button className="btn" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send'}</button></form>
  </section>;
}
