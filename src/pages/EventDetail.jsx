import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { api, eventDate, eventPrice, euro } from '../api.js';
import { useApp } from '../ctx.js';

export default function EventDetail() {
  const { id } = useParams();
  const { me, toast } = useApp();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/events/${id}`).then(setD).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <div className="card empty">{err} <Link className="link" to="/events">Back to events</Link></div>;
  if (!d) return <p className="muted">Loading…</p>;
  const e = d.event;
  const rsvp = async () => {
    if (!me) return nav(`/login?next=/events/${id}`);
    const r = await api(`/events/${id}/rsvp`, { method: 'POST' });
    setD({ ...d, event: r.event });
    toast(r.event.i_am_going ? "You're going! 🎉" : 'RSVP removed');
  };
  const statusNote = { awaiting_payment: 'Waiting for the listing fee (test checkout).', pending: 'Submitted: waiting for admin approval.', rejected: 'This listing was not approved.' }[e.status];
  return (
    <div className="page-narrow stack">
      <Link to="/events" className="link row" style={{ gap: 6 }}><Icon name="arrowLeft" size={16} /> Events</Link>
      {statusNote && <div className="notice" data-testid="event-status"><b>Status:</b> {statusNote} {e.status === 'awaiting_payment' && d.payment && <Link className="link" to={`/checkout/${d.payment.id}`}>Pay {euro(d.payment.amount_cents)} (test)</Link>}</div>}
      <div className="card stack">
        <div className="row" style={{ gap: 6 }}>
          {e.featured && <span className="pill primary"><Icon name="star" size={12} /> Featured</span>}
          <span className="pill">{e.category}</span>
          {e.date_status === 'tbc' && <span className="pill warn">Date to be confirmed</span>}
          {e.origin === 'user' && <span className="pill accent">Posted by {e.host || 'a member'}</span>}
        </div>
        <h1 style={{ margin: 0 }}>{e.title}</h1>
        <div className="stack small" style={{ gap: 6 }}>
          <div className="row"><Icon name="calendar" size={18} /> {eventDate(e)}</div>
          <div className="row"><Icon name="pin" size={18} /> {e.place}, {e.island}</div>
          <div className="row"><Icon name="ticket" size={18} /> {eventPrice(e)}</div>
        </div>
        {e.date_status === 'tbc' && <p className="small muted">This is an annual event. The new date isn't published yet; we show the usual month from the last edition. Fecha por confirmar.</p>}
        <p>{e.description}</p>
        {e.source_url && <a className="link row" style={{ gap: 6 }} href={e.source_url} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Source / organiser info</a>}
        {e.status === 'approved' && (
          <div className="row between card flat" style={{ background: 'var(--secondary)', borderColor: 'transparent' }}>
            <span data-testid="going-count"><b>{e.going}</b> {e.going === 1 ? 'rider' : 'riders'} going</span>
            <button className={`btn ${e.i_am_going ? 'outline' : 'primary'}`} onClick={rsvp} data-testid="rsvp-btn">{e.i_am_going ? "✓ You're going" : "I'm going"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
