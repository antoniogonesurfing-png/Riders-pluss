import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EventCard, RetreatCard } from '../components/Cards.jsx';
import { api } from '../api.js';

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [where, setWhere] = useState(sp.get('where') || '');
  const [res, setRes] = useState(null);
  useEffect(() => {
    setRes(null);
    api(`/search?q=${encodeURIComponent(sp.get('q') || '')}&where=${encodeURIComponent(sp.get('where') || '')}`).then(setRes).catch(() => setRes({ events: [], retreats: [] }));
  }, [sp]);
  const submit = (e) => { e.preventDefault(); setSp({ q, where }); };
  const label = [sp.get('q'), sp.get('where') && `in ${sp.get('where')}`].filter(Boolean).join(' ');
  return (
    <div className="stack">
      <h1>Search</h1>
      <form className="searchbox" onSubmit={submit} role="search" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
        <input className="input" placeholder="What?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="What" />
        <input className="input" placeholder="Where?" value={where} onChange={(e) => setWhere(e.target.value)} aria-label="Where" />
        <button className="btn primary">Search</button>
      </form>
      {!res ? <p className="muted">Searching…</p> : (
        <>
          <p className="muted" data-testid="search-summary">{res.events.length + res.retreats.length} results{label ? ` for ${label}` : ''}</p>
          {res.retreats.length > 0 && <section><h2>Retreats</h2><div className="grid three">{res.retreats.map((r) => <RetreatCard key={r.slug} r={r} />)}</div></section>}
          {res.events.length > 0 && <section><h2>Events</h2><div className="grid two">{res.events.map((e) => <EventCard key={e.id} e={e} />)}</div></section>}
          {res.events.length + res.retreats.length === 0 && <div className="card empty">Nothing matches yet. Try a different place or <Link className="link" to="/events">browse all events</Link>.</div>}
        </>
      )}
    </div>
  );
}
