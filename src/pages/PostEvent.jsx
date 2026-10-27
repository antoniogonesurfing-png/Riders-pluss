import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { PlusBadge } from '../components/PlusSheet.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function PostEvent() {
  const { me, usage, config, refresh, openPlus } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ title: '', category: 'Sport', date: '', time: '', place: '', island: 'Fuerteventura', isFree: true, price: '', listingFee: config.paidEventMinListingFeeEur, featuredBoost: false, description: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  if (!me) return <NeedLogin what="post an event" next="/events/new" />;
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const fee = Number(f.listingFee) || 0;
  const total = fee + (f.featuredBoost ? config.featuredBoostEur : 0);
  const freeLeft = usage?.freePostsLeft;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await api('/events', { method: 'POST', body: f });
      await refresh();
      if (r.checkoutUrl) { if (r.checkoutUrl.startsWith('/')) nav(r.checkoutUrl); else window.location.href = r.checkoutUrl; } else setDone(r);
    } catch (x) { setErr(x.message); if (x.data?.locked) openPlus(x.data.locked); } finally { setBusy(false); }
  };
  if (done) return (
    <div className="page-narrow card stack" data-testid="post-done">
      <h2>Thanks! Your event is in the review queue</h2>
      <p className="muted">An admin checks every listing before it goes live. You'll see it in the calendar once approved.</p>
      <div className="row"><Link className="btn primary" to={`/events/${done.eventId}`}>View submission</Link><Link className="btn outline" to="/events">Back to events</Link></div>
    </div>
  );
  const minDate = new Date().toISOString().slice(0, 10);
  return (
    <div className="page-narrow">
      <Link to="/events" className="link row" style={{ gap: 6 }}><Icon name="arrowLeft" size={16} /> Events</Link>
      <h1 style={{ marginTop: 10 }}>Post an event</h1>
      <p className="muted">Free events: Basic members get {config.tiers.basic.freeEventPostsPerMonth} free post per month{freeLeft != null ? ` (${freeLeft} left this month)` : ''}. Paid events need a listing fee of at least €{config.paidEventMinListingFeeEur}. All listings are reviewed before they go live.</p>
      <form className="card stack" onSubmit={submit} data-testid="post-event-form">
        <label className="field"><span>Title</span><input className="input" name="title" value={f.title} onChange={up('title')} required maxLength={120} /></label>
        <div className="form-grid two">
          <label className="field"><span>Category</span><select className="input" name="category" value={f.category} onChange={up('category')}>{config.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field"><span>Island</span><select className="input" name="island" value={f.island} onChange={up('island')}>{config.islands.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field"><span>Date</span><input className="input" type="date" name="date" min={minDate} max="2027-12-31" value={f.date} onChange={up('date')} required /></label>
          <label className="field"><span>Start time</span><input className="input" type="time" name="time" value={f.time} onChange={up('time')} /></label>
        </div>
        <label className="field"><span>Place</span><input className="input" name="place" placeholder="e.g. Flag Beach, Corralejo" value={f.place} onChange={up('place')} required /></label>
        <div className="field"><span className="label">Entry</span>
          <div className="seg"><button type="button" className={f.isFree ? 'active' : ''} onClick={() => setF({ ...f, isFree: true, featuredBoost: false })}>Free event</button><button type="button" className={!f.isFree ? 'active' : ''} onClick={() => setF({ ...f, isFree: false })} data-testid="paid-toggle">Paid event</button></div>
        </div>
        {f.isFree && freeLeft === 0 && <div className="notice row between"><span>You've used your free event post this month.</span><button type="button" className="btn sm outline" onClick={() => openPlus('event_posts')}><PlusBadge /> More with Plus</button></div>}
        {!f.isFree && (
          <div className="card flat stack" style={{ background: 'var(--secondary)', borderColor: 'transparent' }}>
            <div className="form-grid two">
              <label className="field"><span>Ticket price (€)</span><input className="input" type="number" min="0.5" step="0.5" name="price" value={f.price} onChange={up('price')} required /></label>
              <label className="field"><span>Listing fee (€, min {config.paidEventMinListingFeeEur})</span><input className="input" type="number" min={config.paidEventMinListingFeeEur} step="1" name="listingFee" value={f.listingFee} onChange={up('listingFee')} required /></label>
            </div>
            <label className="check"><input type="checkbox" name="featuredBoost" checked={f.featuredBoost} onChange={up('featuredBoost')} /><span><b>Featured boost +€{config.featuredBoostEur}</b><br /><span className="muted small">Pinned at the top of its month and shown on the home page once approved.</span></span></label>
            <div className="row between"><span>Total due at checkout</span><b data-testid="total-due">€{total.toFixed(2)}</b></div>
          </div>
        )}
        <label className="field"><span>Description</span><textarea className="input" name="description" value={f.description} onChange={up('description')} required minLength={10} maxLength={2000} /></label>
        <p className="xs muted">By posting you confirm the event is real, legal and that you are allowed to share these details. Listings follow our <Link className="link" to="/guidelines">community guidelines</Link>.</p>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn primary block" disabled={busy} type="submit">{f.isFree ? 'Submit for review' : `Continue to checkout (€${total.toFixed(2)})`}</button>
      </form>
    </div>
  );
}
