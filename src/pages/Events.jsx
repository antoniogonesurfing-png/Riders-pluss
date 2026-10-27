import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { EventCard } from '../components/Cards.jsx';
import { api, monthLabel } from '../api.js';
import { useApp } from '../ctx.js';

export default function Events() {
  const { config } = useApp();
  const [sp, setSp] = useSearchParams();
  const month = sp.get('month') || config.months[0];
  const island = sp.get('island') || 'Fuerteventura';
  const category = sp.get('category') || 'All';
  const free = sp.get('free') === '1';
  const [q, setQ] = useState(sp.get('q') || '');
  const [data, setData] = useState(null);
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v === null || v === '') n.delete(k); else n.set(k, v); setSp(n, { replace: true }); };

  useEffect(() => { if ((sp.get('q') || '') === q.trim()) return undefined; const t = setTimeout(() => set('q', q.trim() || null), 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line
  useEffect(() => {
    const p = new URLSearchParams({ island, category, free: free ? '1' : '0', q: sp.get('q') || '' });
    if (month !== 'all') p.set('month', month);
    api(`/events?${p}`).then(setData).catch(() => setData({ events: [], recurring: [], counts: {} }));
  }, [month, island, category, free, sp]);

  const total = useMemo(() => Object.values(data?.counts || {}).reduce((a, b) => a + b, 0), [data]);
  return (
    <div>
      <div className="row between">
        <div><div className="eyebrow">Canary Islands calendar</div><h1 style={{ margin: 0 }}>Events</h1></div>
        <Link className="btn primary" to="/events/new" data-testid="post-event-btn"><Icon name="plus" size={18} /> Post an event</Link>
      </div>

      <div className="filters">
        <div className="chips" role="tablist" aria-label="Month">
          <button role="tab" aria-selected={month === 'all'} className={`chip ${month === 'all' ? 'active' : ''}`} onClick={() => set('month', 'all')}>All <span className="count">{total}</span></button>
          {config.months.map((m) => (
            <button role="tab" key={m} aria-selected={month === m} className={`chip ${month === m ? 'active' : ''}`} onClick={() => set('month', m)} data-month={m}>
              {monthLabel(m, true)} <span className="count">{data?.counts?.[m] || 0}</span>
            </button>
          ))}
        </div>
        <div className="chips" style={{ marginTop: 8 }} aria-label="Category">
          {['All', ...config.categories].map((c) => <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => set('category', c === 'All' ? null : c)}>{c}</button>)}
        </div>
        <div className="row">
          <label className="sr-only" htmlFor="island">Island</label>
          <select id="island" className="input" value={island} onChange={(e) => set('island', e.target.value)} data-testid="island-select">
            <option value="Fuerteventura">Fuerteventura</option>
            <option value="All">All Canary Islands</option>
            {config.islands.filter((i) => i !== 'Fuerteventura').map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <label className="toggle"><input type="checkbox" checked={free} onChange={(e) => set('free', e.target.checked ? '1' : null)} /> Free only</label>
          <input className="input" style={{ flex: '1 1 160px', minHeight: 38, borderRadius: 999, padding: '6px 14px' }} placeholder="Search events or places" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        </div>
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        {!data ? <p className="muted">Loading events…</p> : (
          <>
            <p className="muted small" data-testid="events-count">{data.events.length} event{data.events.length === 1 ? '' : 's'} · {month === 'all' ? 'all months' : monthLabel(month)} · {island === 'All' ? 'all Canary Islands' : island}</p>
            {data.events.length === 0 ? (
              <div className="card empty">No events match these filters. Try another month, island or category{free ? ', or turn off Free only' : ''}.</div>
            ) : <div className="grid two">{data.events.map((e) => <EventCard key={e.id} e={e} />)}</div>}
            {data.recurring.length > 0 && (
              <div className="section">
                <h2>Every week</h2>
                <div className="grid two">{data.recurring.map((e) => <EventCard key={e.id} e={e} />)}</div>
              </div>
            )}
            <p className="xs muted" style={{ marginTop: 18 }}>Events marked <b>Date to be confirmed</b> are annual events whose new date isn't published yet; we show the usual month and link the latest source. Prices and times can change, so always check the organiser's link.</p>
          </>
        )}
      </div>
    </div>
  );
}
