import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function RetreatDetail() {
  const { slug } = useParams();
  const { me, config } = useApp();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', phone: '', preferredDates: '', guests: 1, message: '', consent: false });
  const [sent, setSent] = useState(false);
  const [formErr, setFormErr] = useState('');
  useEffect(() => { api(`/retreats/${slug}`).then((x) => setR(x.retreat)).catch((e) => setErr(e.message)); }, [slug]);
  useEffect(() => { if (me) setF((p) => ({ ...p, name: p.name || me.name, email: p.email || me.email })); }, [me]);
  if (err) return <div className="card empty">{err} <Link className="link" to="/retreats">All retreats</Link></div>;
  if (!r) return <p className="muted">Loading…</p>;
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setFormErr('');
    try { await api(`/retreats/${slug}/enquiry`, { method: 'POST', body: f }); setSent(true); } catch (x) { setFormErr(x.message); }
  };
  const mail = `mailto:${r.provider_email || config.contactEmail}?subject=${encodeURIComponent(`Riders Plus enquiry: ${r.title}`)}`;
  return (
    <div className="stack">
      <Link to="/retreats" className="link row" style={{ gap: 6 }}><Icon name="arrowLeft" size={16} /> Retreats</Link>
      <div className="cover">{r.image && <img src={r.image} alt={r.image_alt || r.title} />}</div>
      <div className="grid two-lg" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="row" style={{ gap: 6 }}><span className="pill">{r.kind}</span>{r.status_label && <span className="pill warn">{r.status_label}</span>}</div>
          <h1 style={{ margin: 0 }}>{r.title}</h1>
          <div className="row small muted"><Icon name="pin" size={16} /> {r.location}</div>
          <Link to={`/providers/${r.provider_slug}`} className="verified"><Icon name="shield" size={16} /> {r.provider_name} · verified provider</Link>
          <div className="row between card flat" style={{ background: 'var(--secondary)', borderColor: 'transparent' }}>
            <span><span className="xs muted">Price</span><br /><b>{r.price_text || 'Price on request'}</b></span>
            <a className="btn primary" href="#enquire" data-testid="request-btn">Request to book</a>
          </div>
          <p style={{ fontSize: '1.05rem' }}>{r.summary}</p>
          <p className="muted">{r.description}</p>
          {r.facts.length > 0 && <div className="facts">{r.facts.map(([k, v]) => <div key={k}><b>{k}</b>{v}</div>)}</div>}
          {r.includes.length > 0 && <div className="card flat"><h3>What's included</h3><ul className="list">{r.includes.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {r.not_included.length > 0 && <div className="card flat"><h3>Not included</h3><ul className="list muted">{r.not_included.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <a className="link row" style={{ gap: 6 }} href={r.source_url} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Full details on ridewithusretreats.com</a>
        </div>
        <div className="stack">
          <div className="card">
            <h3>Price</h3>
            {r.prices.length ? r.prices.map(([k, v]) => <div className="price-row" key={k}><span>{k}</span><span>{v}</span></div>) : <p className="muted" style={{ margin: 0 }}>Price on request.</p>}
          </div>
          <div className="card">
            <h3>Dates</h3>
            {r.dates.length ? r.dates.map(([k, v]) => <div className="price-row" key={k}><span>{k}</span><span className={/sold/i.test(v) ? 'muted' : ''}>{v}</span></div>) : <p style={{ margin: 0 }}><b>Ask for dates</b></p>}
            {r.dates_note && <p className="xs muted" style={{ marginTop: 8 }}>{r.dates_note}</p>}
          </div>
          <div className="card" id="enquire">
            <h3>Send a booking request</h3>
            {sent ? (
              <div className="notice success" data-testid="enquiry-sent"><b>Request sent.</b> {r.provider_name} will confirm availability and the price by email. No payment is taken now.</div>
            ) : (
              <form className="stack" onSubmit={submit} data-testid="enquiry-form">
                <div className="form-grid two">
                  <label className="field"><span>Name</span><input className="input" name="name" value={f.name} onChange={up('name')} required /></label>
                  <label className="field"><span>Email</span><input className="input" type="email" name="email" value={f.email} onChange={up('email')} required /></label>
                  <label className="field"><span>Phone / WhatsApp</span><input className="input" name="phone" value={f.phone} onChange={up('phone')} /></label>
                  <label className="field"><span>Guests</span><input className="input" type="number" min="1" max="30" name="guests" value={f.guests} onChange={up('guests')} /></label>
                </div>
                <label className="field"><span>Preferred dates</span>
                  {r.dates.length ? <select className="input" name="preferredDates" value={f.preferredDates} onChange={up('preferredDates')}><option value="">Choose or leave flexible</option>{r.dates.map(([k]) => <option key={k}>{k}</option>)}<option>Flexible</option></select>
                    : <input className="input" name="preferredDates" placeholder="When would you like to go?" value={f.preferredDates} onChange={up('preferredDates')} />}
                </label>
                <label className="field"><span>Message</span><textarea className="input" name="message" value={f.message} onChange={up('message')} placeholder="Level, room preference, questions…" /></label>
                <label className="check"><input type="checkbox" name="consent" checked={f.consent} onChange={up('consent')} /><span className="small">I agree that Riders Plus shares this request with {r.provider_name} so they can reply. See <Link className="link" to="/privacy">privacy</Link>.</span></label>
                {formErr && <div className="error" role="alert">{formErr}</div>}
                <button className="btn primary block" type="submit">Send request</button>
                <a className="btn outline block" href={mail}><Icon name="mail" size={16} /> Or email {r.provider_email || config.contactEmail}</a>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
