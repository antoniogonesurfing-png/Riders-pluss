import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import { eventDate, eventPrice } from '../api.js';

const MSHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function EventCard({ e }) {
  const tbc = e.date_status === 'tbc'; const rec = e.date_status === 'recurring';
  const d = e.start_date ? e.start_date.split('-') : null;
  return (
    <Link to={`/events/${e.id}`} className="card card-link event-card" data-testid="event-card">
      <div className="datebox">
        {rec ? <><b style={{ fontSize: '1.1rem' }}>↻</b><small>Weekly</small></>
          : tbc ? <><b style={{ fontSize: '1.05rem' }}>{MSHORT[+d[1] - 1]}</b><small>TBC</small></>
            : <><b>{+d[2]}</b><small>{MSHORT[+d[1] - 1]}</small></>}
      </div>
      <div className="info">
        <div className="row" style={{ gap: 6 }}>
          {e.featured && <span className="pill primary"><Icon name="star" size={12} /> Featured</span>}
          <span className="pill">{e.category}</span>
          {(e.is_free || e.price_status === 'free') && <span className="pill success">Free</span>}
          {tbc && <span className="pill warn">Date to be confirmed</span>}
          {e.origin === 'user' && <span className="pill accent">Community</span>}
        </div>
        <h3>{e.title}</h3>
        <div className="meta">
          <span><Icon name="calendar" size={14} /> {eventDate(e)}</span>
          <span><Icon name="pin" size={14} /> {e.place}{e.island && !String(e.place).includes(e.island) ? `, ${e.island}` : ''}</span>
          {!e.is_free && e.price_status !== 'free' && <span><Icon name="ticket" size={14} /> {eventPrice(e)}</span>}
          {e.going > 0 && <span><Icon name="users" size={14} /> {e.going} going</span>}
        </div>
      </div>
    </Link>
  );
}

export function RetreatCard({ r, compact }) {
  return (
    <Link to={`/retreats/${r.slug}`} className="card card-link media-card" data-testid="retreat-card">
      <div className="media">
        {r.image && <img src={r.image} alt={r.image_alt || r.title} loading="lazy" />}
        <div className="badges"><span className="pill dark">{r.kind}</span>{r.status_label && <span className="pill">{r.status_label}</span>}</div>
      </div>
      <div className="body">
        <div className="xs muted row" style={{ gap: 6 }}><Icon name="pin" size={13} /> {r.location}</div>
        <h3 style={{ margin: 0 }}>{r.title}</h3>
        {!compact && <p className="small muted" style={{ margin: 0 }}>{r.summary}</p>}
        <div className="row between" style={{ marginTop: 'auto', paddingTop: 6 }}>
          <b>{r.price_text || 'Price on request'}</b>
          <span className="verified"><Icon name="shield" size={14} /> Ride With Us</span>
        </div>
      </div>
    </Link>
  );
}

export function NeedLogin({ what = 'this', next }) {
  return (
    <div className="card page-narrow stack" style={{ textAlign: 'center' }}>
      <h2>Join free to {what}</h2>
      <p className="muted">Sign-up is free. Riders Plus is a test version run by Ride With Us Retreats.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link className="btn primary" to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Join free</Link>
        <Link className="btn outline" to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link>
      </div>
    </div>
  );
}
