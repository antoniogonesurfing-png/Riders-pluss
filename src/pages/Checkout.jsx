import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NeedLogin } from '../components/Cards.jsx';
import { api, euro } from '../api.js';
import { useApp } from '../ctx.js';

export default function Checkout() {
  const { id } = useParams();
  const { me } = useApp();
  const [p, setP] = useState(null);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me) api(`/payments/${id}`).then((r) => setP(r.payment)).catch((e) => setErr(e.message)); }, [id, me]);
  if (!me) return <NeedLogin what="pay" next={`/checkout/${id}`} />;
  if (err && !p) return <div className="card empty">{err}</div>;
  if (!p) return <p className="muted">Loading checkout…</p>;
  const pay = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await api(`/payments/${id}/test-pay`, { method: 'POST', body: { card } }); setP(r.payment); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const isEvent = p.kind === 'event_listing';
  return (
    <div className="page-narrow stack">
      <div className="testmode" data-testid="test-mode-banner">TEST MODE · No real payment is taken. This checkout simulates Stripe so the flow can be tested.</div>
      <div className="card stack">
        <div className="eyebrow">Checkout</div>
        <h2 style={{ margin: 0 }}>{p.description}</h2>
        <div>{p.line_items.map((li, i) => <div className="price-row" key={i}><span>{li.label}</span><span>{euro(li.amount_cents)}</span></div>)}
          <div className="price-row"><span><b>Total</b></span><span data-testid="checkout-total">{euro(p.amount_cents)}</span></div></div>
        {p.status === 'paid' ? (
          <div className="stack">
            <div className="notice success" data-testid="payment-success"><b>Test payment complete.</b> {isEvent ? 'Your event is now in the admin approval queue. It appears in the calendar once approved.' : 'Thank you for backing the Sponsor a Grom fund (test).'}</div>
            <div className="row">{isEvent ? <Link className="btn primary" to={`/events/${p.ref_id}`}>View my listing</Link> : <Link className="btn primary" to="/groms">Back to Groms</Link>}<Link className="btn outline" to="/you">My profile</Link></div>
          </div>
        ) : (
          <form className="stack" onSubmit={pay}>
            <label className="field"><span>Test card number</span><input className="input" value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" name="card" /></label>
            <div className="form-grid two"><label className="field"><span>Expiry</span><input className="input" defaultValue="12 / 34" readOnly /></label><label className="field"><span>CVC</span><input className="input" defaultValue="123" readOnly /></label></div>
            <p className="xs muted">Use 4242 4242 4242 4242. Real cards are never accepted here. When Stripe keys are added, this step is replaced by Stripe Checkout.</p>
            {err && <div className="error" role="alert">{err}</div>}
            <button className="btn primary block" disabled={busy} data-testid="pay-btn">Pay {euro(p.amount_cents)} (test)</button>
          </form>
        )}
      </div>
    </div>
  );
}
