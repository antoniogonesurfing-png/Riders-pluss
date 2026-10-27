import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, eventDate, euro } from '../api.js';
import { useApp } from '../ctx.js';

const TABS = [['overview', 'Overview'], ['queue', 'Event queue'], ['events', 'All events'], ['groms', 'Grom nominations'], ['enquiries', 'Retreat enquiries'], ['feedback', 'Feedback'], ['users', 'Users & tiers']];
const fmt = (s) => (s ? new Date(`${s.replace(' ', 'T')}Z`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function Admin() {
  const { me } = useApp();
  const [tab, setTab] = useState('overview');
  const [o, setO] = useState(null);
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const d = data && data.tab === tab ? data : null;
  const loadOverview = useCallback(() => api('/admin/overview').then(setO).catch(() => {}), []);
  const load = useCallback(async () => {
    setData(null);
    const map = { queue: '/admin/events?status=pending', events: `/admin/events?status=all&q=${encodeURIComponent(q)}`, groms: '/admin/groms', enquiries: '/admin/enquiries', feedback: '/admin/feedback', users: '/admin/users' };
    if (tab === 'queue') { const [p, a] = await Promise.all([api(map.queue), api('/admin/events?status=awaiting_payment')]); setData({ tab, events: p.events, awaiting: a.events }); return; }
    if (map[tab]) { const r = await api(map[tab]); setData({ ...r, tab }); }
  }, [tab, q]);
  useEffect(() => { if (me?.is_admin) loadOverview(); }, [me, loadOverview]);
  useEffect(() => { if (me?.is_admin) load(); }, [me, load]);
  if (!me) return <div className="card empty">Admins only. <Link className="link" to="/login?next=/admin">Log in</Link></div>;
  if (!me.is_admin) return <div className="card empty">This area is for Riders Plus admins.</div>;
  const setStatus = async (id, status) => { await api(`/admin/events/${id}/status`, { method: 'POST', body: { status } }); load(); loadOverview(); };
  const toggleFeatured = async (id) => { await api(`/admin/events/${id}/featured`, { method: 'POST' }); load(); };
  const fbStatus = async (id, status) => { await api(`/admin/feedback/${id}/status`, { method: 'POST', body: { status } }); load(); loadOverview(); };
  const setTier = async (id, tier) => { await api(`/admin/users/${id}/tier`, { method: 'POST', body: { tier } }); load(); loadOverview(); };

  return (
    <div>
      <div className="eyebrow">Riders Plus</div>
      <h1>Admin panel</h1>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}{k === 'queue' && o?.pending ? ` (${o.pending})` : ''}{k === 'feedback' && o?.feedback ? ` (${o.feedback})` : ''}</button>)}</div>

      {tab === 'overview' && o && (
        <div className="stack" data-testid="admin-overview">
          <div className="stats">
            {[['Users', o.users], ['Test bots', o.bots], ['Plus members', o.plusUsers], ['Plus waitlist', o.plusWaitlist], ['Live events', o.events], ['Pending events', o.pending], ['Awaiting payment', o.awaitingPayment], ['Matches', o.matches], ['Grom nominations', o.groms], ['Retreat enquiries', o.enquiries], ['New feedback', o.feedback], ['Test payments', `€${o.testPaymentsEur}`]].map(([l, v]) => <div className="stat" key={l}><b>{v}</b><span className="small muted">{l}</span></div>)}
          </div>
          <div className="card">
            <h3>Membership limits (server/config.js)</h3>
            <div className="table-wrap"><table><thead><tr><th>Setting</th>{Object.values(o.config.tiers).map((t) => <th key={t.label}>{t.label} ({t.price})</th>)}</tr></thead><tbody>
              {[['Daily swipe limit', 'dailySwipeLimit'], ['See who liked you', 'canSeeWhoLikedYou'], ['Rider filters', 'filters'], ['Max profile photos', 'maxProfilePhotos'], ['Free event posts / month', 'freeEventPostsPerMonth']].map(([l, k]) => (
                <tr key={k}><td>{l}</td>{Object.values(o.config.tiers).map((t) => <td key={t.label}>{t[k] === null ? 'Unlimited' : Array.isArray(t[k]) ? t[k].join(', ') : String(t[k])}</td>)}</tr>))}
            </tbody></table></div>
            <p className="xs muted" style={{ marginTop: 8 }}>Paid event min listing fee €{o.config.paidEventMinListingFeeEur} · Featured boost €{o.config.featuredBoostEur} · Payments: {o.config.paymentsMode.toUpperCase()} mode · Crew matching {o.config.minAgeForMatching}+. Edit server/config.js and restart to change.</p>
          </div>
        </div>
      )}

      {tab === 'queue' && d && (
        <div className="stack">
          <h3>Waiting for approval ({d.events.length})</h3>
          {d.events.length === 0 && <p className="muted">Nothing to review.</p>}
          {d.events.map((e) => (
            <div className="card stack" key={e.id} data-testid="queue-item">
              <div className="row between"><b>{e.title}</b><span className="pill">{e.category}</span></div>
              <div className="small muted">{eventDate(e)} · {e.place}, {e.island} · {e.is_free ? 'Free' : `€${e.price_eur}`} · by {e.host}</div>
              <p className="small" style={{ margin: 0 }}>{e.description}</p>
              <div className="xs muted">{e.payment ? `Paid at checkout: ${euro(e.payment.amount_cents)} (listing fee €${e.listing_fee_eur}${e.featured_boost ? ' + featured boost' : ''}) · ${e.payment.status === 'paid' ? 'paid (test)' : e.payment.status}` : 'Free listing'}</div>
              <div className="row"><button className="btn success sm" onClick={() => setStatus(e.id, 'approved')} data-testid="approve-btn">Approve</button><button className="btn danger sm" onClick={() => setStatus(e.id, 'rejected')}>Reject</button></div>
            </div>
          ))}
          {d.awaiting.length > 0 && <><h3>Awaiting payment ({d.awaiting.length})</h3>{d.awaiting.map((e) => <div className="small" key={e.id}>{e.title} · by {e.host}</div>)}</>}
        </div>
      )}

      {tab === 'events' && (
        <div className="stack">
          <input className="input" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
          {d && <div className="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Island</th><th>Origin</th><th>Status</th><th>Featured</th></tr></thead><tbody>
            {d.events.map((e) => <tr key={e.id}><td><Link className="link" to={`/events/${e.id}`}>{e.title}</Link></td><td>{eventDate(e)}</td><td>{e.island}</td><td>{e.origin}</td><td>{e.status}</td>
              <td><button className={`btn sm ${e.featured ? 'primary' : 'outline'}`} onClick={() => toggleFeatured(e.id)}>{e.featured ? '★ Featured' : 'Feature'}</button></td></tr>)}
          </tbody></table></div>}
        </div>
      )}

      {tab === 'groms' && d && (
        <div className="stack">
          <div className="table-wrap"><table><thead><tr><th>When</th><th>Guardian</th><th>Contact</th><th>Grom</th><th>Island / sport</th><th>Story / needs</th><th>Consent</th></tr></thead><tbody>
            {d.nominations.map((n) => <tr key={n.id} data-testid="grom-row"><td>{fmt(n.created_at)}</td><td>{n.guardian_name} ({n.relationship})</td><td>{n.guardian_email}<br />{n.guardian_phone}</td><td>{n.grom_first_name}, {n.grom_age}</td><td>{n.island} · {n.sport}</td><td>{n.story}<br /><i>{n.needs}</i></td><td>{n.guardian_consent ? '✓' : '✗'}</td></tr>)}
            {d.nominations.length === 0 && <tr><td colSpan={7} className="muted">No nominations yet.</td></tr>}
          </tbody></table></div>
          <h3>Sponsorships (test)</h3>
          <div className="table-wrap"><table><thead><tr><th>When</th><th>Sponsor</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            {d.sponsorships.map((s) => <tr key={s.id}><td>{fmt(s.created_at)}</td><td>{s.user_name}</td><td>€{s.amount_eur}</td><td>{s.status}</td></tr>)}
          </tbody></table></div>
        </div>
      )}

      {tab === 'enquiries' && d && (
        <div className="table-wrap"><table><thead><tr><th>When</th><th>Retreat</th><th>Name</th><th>Contact</th><th>Dates</th><th>Guests</th><th>Message</th></tr></thead><tbody>
          {d.enquiries.map((x) => <tr key={x.id} data-testid="enquiry-row"><td>{fmt(x.created_at)}</td><td>{x.retreat_title}</td><td>{x.name}</td><td><a className="link" href={`mailto:${x.email}`}>{x.email}</a><br />{x.phone}</td><td>{x.preferred_dates}</td><td>{x.guests}</td><td>{x.message}</td></tr>)}
          {d.enquiries.length === 0 && <tr><td colSpan={7} className="muted">No enquiries yet.</td></tr>}
        </tbody></table></div>
      )}

      {tab === 'feedback' && d && (
        <div className="table-wrap"><table><thead><tr><th>When</th><th>Type</th><th>Page</th><th>Message</th><th>Email</th><th>Status</th></tr></thead><tbody>
          {d.feedback.map((x) => <tr key={x.id} data-testid="feedback-row"><td>{fmt(x.created_at)}</td><td>{x.kind}</td><td>{x.page}</td><td>{x.message}</td><td>{x.email}</td><td><button className={`btn sm ${x.status === 'done' ? 'outline' : 'primary'}`} onClick={() => fbStatus(x.id, x.status === 'done' ? 'new' : 'done')}>{x.status === 'done' ? 'Done ✓' : 'Mark done'}</button></td></tr>)}
          {d.feedback.length === 0 && <tr><td colSpan={6} className="muted">No feedback yet.</td></tr>}
        </tbody></table></div>
      )}

      {tab === 'users' && d && (
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Island</th><th>Tier</th><th>Plus waitlist</th><th>News opt-in</th><th>Joined</th></tr></thead><tbody>
          {d.users.map((u) => <tr key={u.id}><td>{u.name}{u.is_bot ? ' 🤖' : ''}</td><td>{u.is_bot ? '(test bot)' : u.email}</td><td>{u.island}</td>
            <td>{u.is_bot ? '-' : <select className="input" style={{ minHeight: 32, padding: '4px 8px' }} value={u.tier} onChange={(e) => setTier(u.id, e.target.value)}><option value="basic">Basic</option><option value="plus">Plus (test)</option></select>}</td>
            <td>{u.waitlist ? '✓' : ''}</td><td>{u.marketing_opt_in ? '✓' : ''}</td><td>{fmt(u.created_at)}</td></tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}
