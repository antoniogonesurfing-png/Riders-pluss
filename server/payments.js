// Payment abstraction. TEST MODE by default: no real charge is ever made.
// Stripe-ready: set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) to switch createCheckout()
// to a real Stripe Checkout Session. The Stripe branch is a starting point and is untested
// in this prototype, because no Stripe account or keys exist yet.
const db = require('./db');
const config = require('./config');

function createPayment({ userId, kind, refId, description, lineItems }) {
  const amount = lineItems.reduce((s, li) => s + li.amount_cents, 0);
  const r = db.prepare(`INSERT INTO payments (user_id,kind,ref_id,description,line_items,amount_cents,provider) VALUES (?,?,?,?,?,?,?)`)
    .run(userId, kind, refId, description, JSON.stringify(lineItems), amount, config.paymentsMode);
  return db.prepare('SELECT * FROM payments WHERE id=?').get(r.lastInsertRowid);
}

// Returns where the browser should go to pay.
async function createCheckout(payment, baseUrl) {
  if (config.paymentsMode !== 'stripe') return { url: `/checkout/${payment.id}`, mode: 'test' };
  // --- Stripe (not active until keys exist) ---
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${baseUrl}/checkout/${payment.id}?status=success`);
  params.append('cancel_url', `${baseUrl}/checkout/${payment.id}?status=cancelled`);
  params.append('metadata[payment_id]', String(payment.id));
  JSON.parse(payment.line_items).forEach((li, i) => {
    params.append(`line_items[${i}][quantity]`, '1');
    params.append(`line_items[${i}][price_data][currency]`, 'eur');
    params.append(`line_items[${i}][price_data][unit_amount]`, String(li.amount_cents));
    params.append(`line_items[${i}][price_data][product_data][name]`, li.label);
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, body: params,
  });
  const session = await res.json();
  db.prepare('UPDATE payments SET provider_ref=? WHERE id=?').run(session.id, payment.id);
  return { url: session.url, mode: 'stripe' };
}

// Called by the test checkout (or, later, by the Stripe webhook on checkout.session.completed).
function markPaid(paymentId) {
  const p = db.prepare('SELECT * FROM payments WHERE id=?').get(paymentId);
  if (!p || p.status === 'paid') return p;
  db.prepare("UPDATE payments SET status='paid', paid_at=datetime('now') WHERE id=?").run(paymentId);
  if (p.kind === 'event_listing') {
    db.prepare("UPDATE events SET status='pending' WHERE id=? AND status='awaiting_payment'").run(p.ref_id);
  } else if (p.kind === 'grom_sponsorship') {
    db.prepare("UPDATE grom_sponsorships SET status='paid' WHERE id=?").run(p.ref_id);
  }
  return db.prepare('SELECT * FROM payments WHERE id=?').get(paymentId);
}

module.exports = { createPayment, createCheckout, markPaid };
