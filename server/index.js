// Riders Plus API + static front-end server.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { dbFile, uploadsDir } = require('./paths');
const { ensureRuntimeSeed } = require('./seed');
const config = require('./config');
const { createPayment, createCheckout, markPaid } = require('./payments');
const { bots, FIRST_MESSAGE, botReply } = require('./data/bots');
const { exampleGroms } = require('./data/groms');

const PORT = Number(process.env.PORT || 4310);
const HOST = process.env.HOST || '0.0.0.0';
const UPLOADS = uploadsDir;
fs.mkdirSync(UPLOADS, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// ---------- helpers ----------
const P = (s, d = []) => { try { return JSON.parse(s); } catch { return d; } };
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const ageFrom = (b) => { if (!b) return null; const d = new Date(b); const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const tierOf = (u) => config.tiers[u?.tier] || config.tiers.basic;
const bad = (res, msg, code = 400, extra = {}) => res.status(code).json({ error: msg, ...extra });
const clean = (s, max = 2000) => (typeof s === 'string' ? s.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISLANDS = ['Fuerteventura', 'Lanzarote', 'Gran Canaria', 'Tenerife', 'La Palma', 'La Gomera', 'El Hierro', 'La Graciosa'];
const SPORTS = ['Surf', 'Kitesurf', 'Windsurf', 'Wing foil', 'Cycling', 'Running', 'Yoga', 'Sailing', 'SUP', 'Hiking', 'Climbing', 'Skate'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All levels'];
const CATEGORIES = ['Sport', 'Music', 'Fiestas', 'Carnival', 'Culture', 'Festivals', 'Markets', 'Food & Drink', 'Bars & Beach', 'Wellness', 'Community'];
const MONTHS = (() => { const out = []; let y = 2026, m = 11; while (y < 2027 || (y === 2027 && m <= 12)) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } } return out; })();

function publicUser(u, viewer) {
  if (!u) return null;
  const out = { id: u.id, name: u.name, sports: P(u.sports), level: u.level, island: u.island, town: u.town, bio: u.bio,
    is_bot: !!u.is_bot, avatar_color: u.avatar_color, photos: P(u.photos), age: u.is_bot ? null : ageFrom(u.birthdate) };
  if (viewer && viewer.id === u.id) Object.assign(out, { email: u.email, birthdate: u.birthdate, is_admin: !!u.is_admin, tier: u.tier, marketing_opt_in: !!u.marketing_opt_in, created_at: u.created_at });
  return out;
}

// ---------- auth ----------
app.use((req, _res, next) => {
  const t = req.cookies.rp_session;
  if (t) {
    const u = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(t);
    if (u) req.user = u;
  }
  next();
});
const requireUser = (req, res, next) => (req.user ? next() : bad(res, 'Please log in first.', 401));
const requireAdmin = (req, res, next) => (req.user?.is_admin ? next() : bad(res, 'Admins only.', 403));
function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token,user_id) VALUES (?,?)').run(token, userId);
  res.cookie('rp_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 30 });
}
function usage(u) {
  if (!u) return null;
  const t = tierOf(u);
  const swipesToday = db.prepare("SELECT COUNT(*) c FROM swipes WHERE from_id=? AND date(created_at)=date('now')").get(u.id).c;
  const freePostsThisMonth = db.prepare("SELECT COUNT(*) c FROM events WHERE created_by=? AND is_free=1 AND origin='user' AND strftime('%Y-%m',created_at)=?").get(u.id, thisMonth()).c;
  return { tier: u.tier, tierLabel: t.label, limits: t, swipesToday, swipesLeft: t.dailySwipeLimit == null ? null : Math.max(0, t.dailySwipeLimit - swipesToday),
    freePostsThisMonth, freePostsLeft: t.freeEventPostsPerMonth == null ? null : Math.max(0, t.freeEventPostsPerMonth - freePostsThisMonth),
    onPlusWaitlist: !!db.prepare('SELECT 1 FROM plus_waitlist WHERE user_id=?').get(u.id) };
}

app.get('/api/config', (_req, res) => res.json({ tiers: config.tiers, plusFeatures: config.plusFeatures, paidEventMinListingFeeEur: config.paidEventMinListingFeeEur,
  featuredBoostEur: config.featuredBoostEur, gromSponsorAmountsEur: config.gromSponsorAmountsEur, paymentsMode: config.paymentsMode, contactEmail: config.contactEmail,
  islands: ISLANDS, sports: SPORTS, levels: LEVELS, categories: CATEGORIES, months: MONTHS, minAgeForMatching: config.minAgeForMatching }));

app.post('/api/auth/signup', (req, res) => {
  const b = req.body || {};
  const email = clean(b.email, 200).toLowerCase(); const name = clean(b.name, 80); const password = typeof b.password === 'string' ? b.password : '';
  if (!name) return bad(res, 'Please add your name.');
  if (!EMAIL_RE.test(email)) return bad(res, 'Please enter a valid email.');
  if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.birthdate || '')) return bad(res, 'Please add your date of birth.');
  const age = ageFrom(b.birthdate);
  if (age == null || age < 0 || age > 120) return bad(res, 'Please check your date of birth.');
  if (age < 18) return bad(res, 'Riders Plus accounts are for adults (18+). Young riders can be nominated for Sponsor a Grom by a parent or guardian.');
  if (!b.acceptTerms) return bad(res, 'Please accept the community guidelines and privacy policy.');
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return bad(res, 'An account with this email already exists. Try logging in.');
  const sports = Array.isArray(b.sports) ? b.sports.filter((s) => SPORTS.includes(s)).map((s) => [s, LEVELS.includes(b.level) ? b.level : 'Beginner']) : [];
  const colors = ['#e0703a', '#2f8f9d', '#7a5cc9', '#4a9a5b', '#c2414b', '#d49a2a'];
  const r = db.prepare(`INSERT INTO users (email,password_hash,name,birthdate,sports,level,island,bio,marketing_opt_in,terms_accepted_at,avatar_color) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),?)`)
    .run(email, bcrypt.hashSync(password, 10), name, b.birthdate, JSON.stringify(sports), LEVELS.includes(b.level) ? b.level : null,
      ISLANDS.includes(b.island) ? b.island : 'Fuerteventura', clean(b.bio, 500), b.marketingOptIn ? 1 : 0, colors[Math.floor(Math.random() * colors.length)]);
  startSession(res, r.lastInsertRowid);
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid);
  res.json({ user: publicUser(u, u), usage: usage(u) });
});

app.post('/api/auth/login', (req, res) => {
  const email = clean(req.body?.email, 200).toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email=? AND is_bot=0').get(email);
  if (!u || !u.password_hash || !bcrypt.compareSync(String(req.body?.password || ''), u.password_hash)) return bad(res, 'Email or password is not correct.', 401);
  startSession(res, u.id);
  res.json({ user: publicUser(u, u), usage: usage(u) });
});
app.post('/api/auth/logout', (req, res) => {
  if (req.cookies.rp_session) db.prepare('DELETE FROM sessions WHERE token=?').run(req.cookies.rp_session);
  res.clearCookie('rp_session'); res.json({ ok: true });
});
app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user, req.user), usage: usage(req.user) }));
app.put('/api/me', requireUser, (req, res) => {
  const b = req.body || {};
  const level = LEVELS.includes(b.level) ? b.level : req.user.level;
  const sports = Array.isArray(b.sports) ? b.sports.filter((s) => SPORTS.includes(s)).map((s) => [s, level || 'Beginner']) : P(req.user.sports);
  db.prepare('UPDATE users SET name=?, sports=?, level=?, island=?, town=?, bio=?, marketing_opt_in=? WHERE id=?').run(
    clean(b.name, 80) || req.user.name, JSON.stringify(sports), level, ISLANDS.includes(b.island) ? b.island : req.user.island,
    clean(b.town, 80), clean(b.bio, 500), b.marketingOptIn ? 1 : 0, req.user.id);
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: publicUser(u, u), usage: usage(u) });
});
app.post('/api/me/photos', requireUser, (req, res) => {
  const photos = P(req.user.photos); const max = tierOf(req.user).maxProfilePhotos;
  if (photos.length >= max) return bad(res, `Basic profiles can have up to ${max} photos.`, 403, { locked: 'photos' });
  const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(req.body?.dataUrl || '');
  if (!m) return bad(res, 'Please choose a PNG, JPG or WebP image.');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 2.5 * 1024 * 1024) return bad(res, 'Image is too large (max 2.5 MB).');
  const file = `${crypto.randomUUID()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOADS, file), buf);
  photos.push(`/uploads/${file}`);
  db.prepare('UPDATE users SET photos=? WHERE id=?').run(JSON.stringify(photos), req.user.id);
  res.json({ photos });
});
app.delete('/api/me/photos/:idx', requireUser, (req, res) => {
  const photos = P(req.user.photos); const i = Number(req.params.idx);
  if (photos[i]) { const f = path.join(UPLOADS, path.basename(photos[i])); if (fs.existsSync(f)) fs.unlinkSync(f); photos.splice(i, 1); }
  db.prepare('UPDATE users SET photos=? WHERE id=?').run(JSON.stringify(photos), req.user.id);
  res.json({ photos });
});
app.post('/api/plus/notify', requireUser, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO plus_waitlist (user_id, feature) VALUES (?,?)').run(req.user.id, clean(req.body?.feature, 80));
  res.json({ ok: true, usage: usage(req.user) });
});

// ---------- events ----------
function eventOut(e, viewer) {
  const going = db.prepare('SELECT COUNT(*) c FROM event_rsvps WHERE event_id=?').get(e.id).c;
  const mine = viewer ? !!db.prepare('SELECT 1 FROM event_rsvps WHERE event_id=? AND user_id=?').get(e.id, viewer.id) : false;
  const host = e.created_by ? db.prepare('SELECT name FROM users WHERE id=?').get(e.created_by) : null;
  return { ...e, is_free: !!e.is_free, featured: !!e.featured, featured_boost: !!e.featured_boost, going, i_am_going: mine, host: host?.name || null };
}
app.get('/api/events', (req, res) => {
  const { month, island, category, free, q } = req.query;
  const where = ["status='approved'", "date_status!='recurring'", `(end_date IS NULL OR end_date >= '${today()}' OR date_status='tbc')`];
  const args = {};
  if (month) { where.push('month=@month'); args.month = month; }
  if (island && island !== 'All') { where.push("(island=@island OR island='All islands')"); args.island = island; }
  if (category && category !== 'All') { where.push('category=@category'); args.category = category; }
  if (free === '1') where.push('is_free=1');
  if (q) { where.push('(title LIKE @q OR place LIKE @q OR description LIKE @q OR island LIKE @q OR category LIKE @q)'); args.q = `%${q}%`; }
  const rows = db.prepare(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY featured DESC, date_status='tbc', start_date, id`).all(args);
  // recurring (weekly markets etc.) shown separately
  const rw = ["status='approved'", "date_status='recurring'"]; const ra = {};
  if (island && island !== 'All') { rw.push('island=@island'); ra.island = island; }
  if (category && category !== 'All') { rw.push('category=@category'); ra.category = category; }
  if (free === '1') rw.push('is_free=1');
  if (q) { rw.push('(title LIKE @q OR place LIKE @q OR description LIKE @q)'); ra.q = `%${q}%`; }
  const recurring = db.prepare(`SELECT * FROM events WHERE ${rw.join(' AND ')} ORDER BY title`).all(ra);
  // counts per month for the tabs (same filters except month)
  const cw = where.filter((w) => w !== 'month=@month'); const ca = { ...args }; delete ca.month;
  const counts = Object.fromEntries(db.prepare(`SELECT month, COUNT(*) c FROM events WHERE ${cw.join(' AND ')} GROUP BY month`).all(ca).map((r) => [r.month, r.c]));
  res.json({ events: rows.map((e) => eventOut(e, req.user)), recurring: recurring.map((e) => eventOut(e, req.user)), counts });
});
app.get('/api/events/mine', requireUser, (req, res) => {
  const rows = db.prepare('SELECT * FROM events WHERE created_by=? ORDER BY id DESC').all(req.user.id);
  const going = db.prepare('SELECT e.* FROM events e JOIN event_rsvps r ON r.event_id=e.id WHERE r.user_id=? ORDER BY e.start_date').all(req.user.id);
  res.json({ posted: rows.map((e) => eventOut(e, req.user)), going: going.map((e) => eventOut(e, req.user)) });
});
app.get('/api/events/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!e || (e.status !== 'approved' && e.created_by !== req.user?.id && !req.user?.is_admin)) return bad(res, 'Event not found.', 404);
  const payment = e.created_by === req.user?.id ? db.prepare("SELECT id,status,amount_cents FROM payments WHERE kind='event_listing' AND ref_id=? ORDER BY id DESC").get(e.id) : null;
  res.json({ event: eventOut(e, req.user), payment });
});
app.post('/api/events', requireUser, async (req, res) => {
  const b = req.body || {};
  const title = clean(b.title, 120), place = clean(b.place, 120), description = clean(b.description, 2000);
  if (title.length < 3) return bad(res, 'Please add a title.');
  if (!CATEGORIES.includes(b.category)) return bad(res, 'Please choose a category.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return bad(res, 'Please choose a date.');
  if (b.date < today()) return bad(res, 'The date must be in the future.');
  if (!MONTHS.includes(b.date.slice(0, 7))) return bad(res, 'Events can be listed from November 2026 to December 2027.');
  if (b.time && !/^\d{2}:\d{2}$/.test(b.time)) return bad(res, 'Please check the time.');
  if (!place) return bad(res, 'Please add the place.');
  if (!ISLANDS.includes(b.island)) return bad(res, 'Please choose an island.');
  if (description.length < 10) return bad(res, 'Please add a short description (10+ characters).');
  const isFree = !!b.isFree;
  const u = usage(req.user);
  if (isFree && u.freePostsLeft === 0) return bad(res, `Basic members can post ${u.limits.freeEventPostsPerMonth} free event per month. More free posts come with Plus.`, 403, { locked: 'event_posts' });
  let price = null, fee = null;
  if (!isFree) {
    price = Number(b.price);
    if (!Number.isFinite(price) || price <= 0) return bad(res, 'Please add the ticket price.');
    fee = Number(b.listingFee);
    if (!Number.isFinite(fee) || fee < config.paidEventMinListingFeeEur) return bad(res, `Paid events need a listing fee of at least €${config.paidEventMinListingFeeEur}.`);
  }
  const boost = !isFree && !!b.featuredBoost;
  const status = isFree ? 'pending' : 'awaiting_payment';
  const r = db.prepare(`INSERT INTO events (title,category,start_date,end_date,start_time,month,place,island,is_free,price_status,price_eur,description,source_url,date_status,origin,status,featured,featured_boost,listing_fee_eur,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL,'confirmed','user',?,0,?,?,?)`).run(title, b.category, b.date, b.date, b.time || null, b.date.slice(0, 7), place, b.island,
    isFree ? 1 : 0, isFree ? 'free' : 'paid', price, description, status, boost ? 1 : 0, fee, req.user.id);
  const eventId = r.lastInsertRowid;
  if (isFree) return res.json({ eventId, status });
  const items = [{ label: `Listing fee: ${title}`, amount_cents: Math.round(fee * 100) }];
  if (boost) items.push({ label: 'Featured boost', amount_cents: config.featuredBoostEur * 100 });
  const payment = createPayment({ userId: req.user.id, kind: 'event_listing', refId: eventId, description: `Event listing: ${title}`, lineItems: items });
  const checkout = await createCheckout(payment, `${req.protocol}://${req.get('host')}`);
  res.json({ eventId, status, paymentId: payment.id, checkoutUrl: checkout.url });
});
app.post('/api/events/:id/rsvp', requireUser, (req, res) => {
  const e = db.prepare("SELECT * FROM events WHERE id=? AND status='approved'").get(req.params.id);
  if (!e) return bad(res, 'Event not found.', 404);
  const has = db.prepare('SELECT 1 FROM event_rsvps WHERE event_id=? AND user_id=?').get(e.id, req.user.id);
  if (has) db.prepare('DELETE FROM event_rsvps WHERE event_id=? AND user_id=?').run(e.id, req.user.id);
  else db.prepare('INSERT INTO event_rsvps (event_id,user_id) VALUES (?,?)').run(e.id, req.user.id);
  res.json({ event: eventOut(e, req.user) });
});

// ---------- payments (test mode) ----------
app.get('/api/payments/:id', requireUser, (req, res) => {
  const p = db.prepare('SELECT * FROM payments WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!p) return bad(res, 'Payment not found.', 404);
  res.json({ payment: { ...p, line_items: P(p.line_items) } });
});
app.post('/api/payments/:id/test-pay', requireUser, (req, res) => {
  if (config.paymentsMode !== 'test') return bad(res, 'Test payments are disabled when Stripe is configured.', 400);
  const p = db.prepare('SELECT * FROM payments WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!p) return bad(res, 'Payment not found.', 404);
  const card = String(req.body?.card || '').replace(/\s/g, '');
  if (card !== '4242424242424242') return bad(res, 'TEST MODE: use the test card 4242 4242 4242 4242.');
  const paid = markPaid(p.id);
  res.json({ payment: { ...paid, line_items: P(paid.line_items) } });
});
// Stripe webhook placeholder (activate with STRIPE_WEBHOOK_SECRET and signature verification before going live)
app.post('/api/stripe/webhook', (_req, res) => res.status(501).json({ error: 'Stripe not configured' }));

// ---------- retreats ----------
const retreatOut = (r) => ({ ...r, facts: P(r.facts), prices: P(r.prices), dates: P(r.dates), includes: P(r.includes), not_included: P(r.not_included), featured: !!r.featured });
app.get('/api/retreats', (req, res) => {
  const rows = db.prepare('SELECT r.*, p.name provider_name, p.slug provider_slug, p.verified provider_verified FROM retreats r JOIN providers p ON p.id=r.provider_id ORDER BY r.sort').all();
  res.json({ retreats: rows.map(retreatOut) });
});
app.get('/api/retreats/:slug', (req, res) => {
  const r = db.prepare('SELECT r.*, p.name provider_name, p.slug provider_slug, p.verified provider_verified, p.email provider_email FROM retreats r JOIN providers p ON p.id=r.provider_id WHERE r.slug=?').get(req.params.slug);
  if (!r) return bad(res, 'Retreat not found.', 404);
  res.json({ retreat: retreatOut(r) });
});
app.get('/api/providers/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM providers WHERE slug=?').get(req.params.slug);
  if (!p) return bad(res, 'Provider not found.', 404);
  const rows = db.prepare('SELECT * FROM retreats WHERE provider_id=? ORDER BY sort').all(p.id);
  res.json({ provider: { ...p, verified: !!p.verified }, retreats: rows.map(retreatOut) });
});
app.post('/api/retreats/:slug/enquiry', (req, res) => {
  const r = db.prepare('SELECT * FROM retreats WHERE slug=?').get(req.params.slug);
  if (!r) return bad(res, 'Retreat not found.', 404);
  const b = req.body || {};
  const name = clean(b.name, 80), email = clean(b.email, 200);
  if (!name) return bad(res, 'Please add your name.');
  if (!EMAIL_RE.test(email)) return bad(res, 'Please enter a valid email.');
  if (!b.consent) return bad(res, 'Please agree that we can share your request with the retreat provider.');
  const guests = Math.max(1, Math.min(30, parseInt(b.guests, 10) || 1));
  const x = db.prepare('INSERT INTO retreat_enquiries (retreat_id,user_id,name,email,phone,preferred_dates,guests,message) VALUES (?,?,?,?,?,?,?,?)')
    .run(r.id, req.user?.id || null, name, email, clean(b.phone, 40), clean(b.preferredDates, 120), guests, clean(b.message, 2000));
  res.json({ ok: true, id: x.lastInsertRowid });
});

// ---------- find your rider ----------
function needAdult(req, res) {
  const age = ageFrom(req.user.birthdate);
  if (age == null || age < config.minAgeForMatching) { bad(res, 'Crew matching is for adults (18+).', 403); return false; }
  return true;
}
app.get('/api/riders', requireUser, (req, res) => {
  if (!needAdult(req, res)) return;
  const t = tierOf(req.user);
  const { sport, level, island } = req.query;
  const where = ['u.id != @me', 'u.is_admin = 0', 'NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_id=@me AND s.to_id=u.id)'];
  const args = { me: req.user.id };
  const ignored = [];
  if (sport && sport !== 'All') { where.push('u.sports LIKE @sport'); args.sport = `%"${sport}"%`; }
  if (level && level !== 'All') { if (t.filters.includes('level')) { where.push('u.sports LIKE @level'); args.level = `%"${level}"%`; } else ignored.push('level'); }
  if (island && island !== 'All') { if (t.filters.includes('island')) { where.push('u.island=@island'); args.island = island; } else ignored.push('island'); }
  const rows = db.prepare(`SELECT u.* FROM users u WHERE ${where.join(' AND ')} ORDER BY u.is_bot, u.id`).all(args);
  const likedMe = db.prepare('SELECT u.* FROM swipes s JOIN users u ON u.id=s.from_id WHERE s.to_id=? AND s.liked=1 AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.a_id=s.from_id AND m.b_id=s.to_id) OR (m.b_id=s.from_id AND m.a_id=s.to_id))').all(req.user.id);
  res.json({ riders: rows.map((u) => publicUser(u)), ignoredFilters: ignored, usage: usage(req.user),
    likedYou: { count: likedMe.length, users: t.canSeeWhoLikedYou ? likedMe.map((u) => publicUser(u)) : null } });
});
app.get('/api/riders/:id', requireUser, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id=? AND is_admin=0').get(req.params.id);
  if (!u) return bad(res, 'Rider not found.', 404);
  res.json({ rider: publicUser(u) });
});
function matchBetween(a, b) {
  const [x, y] = a < b ? [a, b] : [b, a];
  db.prepare('INSERT OR IGNORE INTO matches (a_id,b_id) VALUES (?,?)').run(x, y);
  return db.prepare('SELECT * FROM matches WHERE a_id=? AND b_id=?').get(x, y);
}
app.post('/api/riders/:id/swipe', requireUser, (req, res) => {
  if (!needAdult(req, res)) return;
  const target = db.prepare('SELECT * FROM users WHERE id=? AND is_admin=0').get(req.params.id);
  if (!target || target.id === req.user.id) return bad(res, 'Rider not found.', 404);
  const u = usage(req.user);
  if (u.swipesLeft === 0) return bad(res, `You've used your ${u.limits.dailySwipeLimit} swipes for today. Come back tomorrow, or unlock unlimited likes with Plus.`, 429, { locked: 'swipes', usage: u });
  const liked = req.body?.direction === 'up' ? 1 : 0;
  db.prepare("INSERT INTO swipes (from_id,to_id,liked,created_at) VALUES (?,?,?,datetime('now')) ON CONFLICT(from_id,to_id) DO UPDATE SET liked=excluded.liked, created_at=excluded.created_at").run(req.user.id, target.id, liked);
  let match = null;
  if (liked) {
    if (target.is_bot) {
      db.prepare('INSERT OR IGNORE INTO swipes (from_id,to_id,liked) VALUES (?,?,1)').run(target.id, req.user.id); // bots always like you back
      match = matchBetween(req.user.id, target.id);
      if (!db.prepare('SELECT 1 FROM messages WHERE match_id=?').get(match.id)) db.prepare('INSERT INTO messages (match_id,sender_id,body) VALUES (?,?,?)').run(match.id, target.id, FIRST_MESSAGE);
    } else if (db.prepare('SELECT 1 FROM swipes WHERE from_id=? AND to_id=? AND liked=1').get(target.id, req.user.id)) {
      match = matchBetween(req.user.id, target.id);
    }
  }
  res.json({ match: match ? { id: match.id, with: publicUser(target) } : null, usage: usage(req.user) });
});

// ---------- matches & messages ----------
const typing = new Map(); // matchId -> until timestamp
function matchFor(req, res) {
  const m = db.prepare('SELECT * FROM matches WHERE id=? AND (a_id=@u OR b_id=@u)').get(req.params.id, { u: req.user.id });
  if (!m) { bad(res, 'Chat not found.', 404); return null; }
  return m;
}
app.get('/api/matches', requireUser, (req, res) => {
  const rows = db.prepare('SELECT * FROM matches WHERE a_id=@u OR b_id=@u ORDER BY id DESC').all({ u: req.user.id });
  res.json({ matches: rows.map((m) => {
    const other = db.prepare('SELECT * FROM users WHERE id=?').get(m.a_id === req.user.id ? m.b_id : m.a_id);
    const last = db.prepare('SELECT * FROM messages WHERE match_id=? ORDER BY id DESC LIMIT 1').get(m.id);
    return { id: m.id, created_at: m.created_at, with: publicUser(other), last };
  }) });
});
app.get('/api/matches/:id/messages', requireUser, (req, res) => {
  const m = matchFor(req, res); if (!m) return;
  const other = db.prepare('SELECT * FROM users WHERE id=?').get(m.a_id === req.user.id ? m.b_id : m.a_id);
  const msgs = db.prepare('SELECT * FROM messages WHERE match_id=? ORDER BY id').all(m.id);
  res.json({ match: { id: m.id, with: publicUser(other) }, messages: msgs, typing: (typing.get(m.id) || 0) > Date.now() });
});
app.post('/api/matches/:id/messages', requireUser, (req, res) => {
  const m = matchFor(req, res); if (!m) return;
  const body = clean(req.body?.body, 1000);
  if (!body) return bad(res, 'Message is empty.');
  db.prepare('INSERT INTO messages (match_id,sender_id,body) VALUES (?,?,?)').run(m.id, req.user.id, body);
  const other = db.prepare('SELECT * FROM users WHERE id=?').get(m.a_id === req.user.id ? m.b_id : m.a_id);
  if (other.is_bot) {
    const bot = bots.find((x) => x.key === other.bot_key);
    const delay = 1200 + Math.floor(Math.random() * 1000);
    typing.set(m.id, Date.now() + delay);
    setTimeout(() => {
      try { db.prepare('INSERT INTO messages (match_id,sender_id,body) VALUES (?,?,?)').run(m.id, other.id, bot ? botReply(bot, body) : 'Hi! I am a test bot.'); } catch (e) { console.error(e); }
      typing.delete(m.id);
    }, delay);
  }
  res.json({ ok: true });
});

// ---------- groms ----------
app.get('/api/groms/examples', (_req, res) => res.json({ examples: exampleGroms }));
app.post('/api/groms/nominate', (req, res) => {
  const b = req.body || {};
  const g = { guardian_name: clean(b.guardianName, 80), guardian_email: clean(b.guardianEmail, 200), guardian_phone: clean(b.guardianPhone, 40), relationship: clean(b.relationship, 40),
    grom_first_name: clean(b.gromFirstName, 40), grom_age: parseInt(b.gromAge, 10), island: ISLANDS.includes(b.island) ? b.island : null, sport: clean(b.sport, 40), story: clean(b.story, 2000), needs: clean(b.needs, 1000) };
  if (!g.guardian_name) return bad(res, 'Please add the parent or guardian name.');
  if (!EMAIL_RE.test(g.guardian_email)) return bad(res, 'Please add a valid guardian email.');
  if (!g.relationship) return bad(res, 'Please tell us your relationship to the young rider.');
  if (!g.grom_first_name) return bad(res, "Please add the young rider's first name.");
  if (!(g.grom_age >= 5 && g.grom_age <= 17)) return bad(res, 'Sponsor a Grom is for riders aged 5 to 17.');
  if (!b.guardianIsAdult) return bad(res, 'Nominations must be made by a parent or legal guardian aged 18+.');
  if (!b.guardianConsent) return bad(res, 'Guardian consent is required.');
  const r = db.prepare(`INSERT INTO grom_nominations (submitted_by,guardian_name,guardian_email,guardian_phone,relationship,grom_first_name,grom_age,island,sport,story,needs,guardian_consent)
    VALUES (@by,@guardian_name,@guardian_email,@guardian_phone,@relationship,@grom_first_name,@grom_age,@island,@sport,@story,@needs,1)`).run({ ...g, by: req.user?.id || null });
  res.json({ ok: true, id: r.lastInsertRowid });
});
app.post('/api/groms/sponsor', requireUser, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!config.gromSponsorAmountsEur.includes(amount)) return bad(res, 'Please choose an amount.');
  const s = db.prepare('INSERT INTO grom_sponsorships (user_id,amount_eur,message) VALUES (?,?,?)').run(req.user.id, amount, clean(req.body?.message, 500));
  const payment = createPayment({ userId: req.user.id, kind: 'grom_sponsorship', refId: s.lastInsertRowid, description: 'Sponsor a Grom fund', lineItems: [{ label: 'Sponsor a Grom fund', amount_cents: amount * 100 }] });
  db.prepare('UPDATE grom_sponsorships SET payment_id=? WHERE id=?').run(payment.id, s.lastInsertRowid);
  const checkout = await createCheckout(payment, `${req.protocol}://${req.get('host')}`);
  res.json({ paymentId: payment.id, checkoutUrl: checkout.url });
});

// ---------- feedback ----------
app.post('/api/feedback', (req, res) => {
  const b = req.body || {};
  const message = clean(b.message, 3000);
  if (message.length < 5) return bad(res, 'Please describe the bug or idea (5+ characters).');
  const kind = ['bug', 'feature', 'other'].includes(b.kind) ? b.kind : 'other';
  const email = clean(b.email, 200);
  if (email && !EMAIL_RE.test(email)) return bad(res, 'Please check the email address.');
  db.prepare('INSERT INTO feedback (user_id,kind,page,message,email,user_agent) VALUES (?,?,?,?,?,?)').run(req.user?.id || null, kind, clean(b.page, 300), message, email || req.user?.email || null, clean(req.get('user-agent'), 300));
  res.json({ ok: true });
});

// ---------- search & highlights ----------
app.get('/api/search', (req, res) => {
  const q = clean(req.query.q, 80), where = clean(req.query.where, 80);
  const ew = ["status='approved'", `(end_date IS NULL OR end_date >= '${today()}' OR date_status IN ('tbc','recurring'))`]; const ea = {};
  if (q) { ew.push('(title LIKE @q OR description LIKE @q OR category LIKE @q)'); ea.q = `%${q}%`; }
  if (where) { ew.push('(place LIKE @w OR island LIKE @w)'); ea.w = `%${where}%`; }
  const events = (q || where) ? db.prepare(`SELECT * FROM events WHERE ${ew.join(' AND ')} ORDER BY featured DESC, start_date LIMIT 60`).all(ea) : [];
  const rw = []; const ra = {};
  if (q) { rw.push('(title LIKE @q OR summary LIKE @q OR kind LIKE @q OR description LIKE @q)'); ra.q = `%${q}%`; }
  if (where) { rw.push('(location LIKE @w OR region LIKE @w)'); ra.w = `%${where}%`; }
  const retreats = rw.length ? db.prepare(`SELECT * FROM retreats WHERE ${rw.join(' AND ')} ORDER BY sort`).all(ra) : [];
  res.json({ events: events.map((e) => eventOut(e, req.user)), retreats: retreats.map(retreatOut) });
});
app.get('/api/highlights', (req, res) => {
  const featured = db.prepare(`SELECT * FROM events WHERE status='approved' AND featured=1 AND (end_date IS NULL OR end_date >= ?) ORDER BY start_date LIMIT 6`).all(today());
  const upcoming = db.prepare(`SELECT * FROM events WHERE status='approved' AND featured=0 AND island='Fuerteventura' AND date_status='confirmed' AND start_date >= ? ORDER BY start_date LIMIT 6`).all(today());
  const retreats = db.prepare('SELECT * FROM retreats WHERE featured=1 ORDER BY sort').all();
  const islands = db.prepare(`SELECT island, COUNT(*) c FROM events WHERE status='approved' AND island!='All islands' GROUP BY island HAVING c>0 ORDER BY c DESC`).all();
  res.json({ featured: featured.map((e) => eventOut(e, req.user)), upcoming: upcoming.map((e) => eventOut(e, req.user)), retreats: retreats.map(retreatOut), islands,
    riders: db.prepare('SELECT COUNT(*) c FROM users WHERE is_admin=0').get().c });
});

// ---------- admin ----------
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const c = (sql) => db.prepare(sql).get().c;
  res.json({
    users: c('SELECT COUNT(*) c FROM users WHERE is_bot=0 AND is_admin=0'), bots: c('SELECT COUNT(*) c FROM users WHERE is_bot=1'),
    plusUsers: c("SELECT COUNT(*) c FROM users WHERE tier='plus' AND is_admin=0"), plusWaitlist: c('SELECT COUNT(*) c FROM plus_waitlist'),
    events: c("SELECT COUNT(*) c FROM events WHERE status='approved'"), pending: c("SELECT COUNT(*) c FROM events WHERE status='pending'"),
    awaitingPayment: c("SELECT COUNT(*) c FROM events WHERE status='awaiting_payment'"), groms: c('SELECT COUNT(*) c FROM grom_nominations'),
    enquiries: c('SELECT COUNT(*) c FROM retreat_enquiries'), feedback: c("SELECT COUNT(*) c FROM feedback WHERE status='new'"), matches: c('SELECT COUNT(*) c FROM matches'),
    testPaymentsEur: db.prepare("SELECT COALESCE(SUM(amount_cents),0)/100.0 c FROM payments WHERE status='paid'").get().c,
    config: { tiers: config.tiers, paidEventMinListingFeeEur: config.paidEventMinListingFeeEur, featuredBoostEur: config.featuredBoostEur, paymentsMode: config.paymentsMode, minAgeForMatching: config.minAgeForMatching },
  });
});
app.get('/api/admin/events', requireAdmin, (req, res) => {
  const status = req.query.status || 'pending';
  const q = clean(req.query.q, 80);
  const rows = status === 'all'
    ? db.prepare(`SELECT * FROM events WHERE (@q='' OR title LIKE @ql) ORDER BY origin='user' DESC, id DESC LIMIT 200`).all({ q, ql: `%${q}%` })
    : db.prepare('SELECT * FROM events WHERE status=? ORDER BY id DESC').all(status);
  res.json({ events: rows.map((e) => {
    const p = db.prepare("SELECT id,status,amount_cents FROM payments WHERE kind='event_listing' AND ref_id=? ORDER BY id DESC").get(e.id);
    return { ...eventOut(e), payment: p || null };
  }) });
});
app.post('/api/admin/events/:id/status', requireAdmin, (req, res) => {
  const s = req.body?.status;
  if (!['approved', 'rejected', 'pending'].includes(s)) return bad(res, 'Bad status.');
  const e = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!e) return bad(res, 'Not found', 404);
  const featured = s === 'approved' && e.featured_boost ? 1 : e.featured; // paid featured boost goes live on approval
  db.prepare('UPDATE events SET status=?, featured=? WHERE id=?').run(s, featured, e.id);
  res.json({ ok: true });
});
app.post('/api/admin/events/:id/featured', requireAdmin, (req, res) => {
  db.prepare('UPDATE events SET featured = 1 - featured WHERE id=?').run(req.params.id);
  res.json({ event: db.prepare('SELECT id, featured FROM events WHERE id=?').get(req.params.id) });
});
app.get('/api/admin/groms', requireAdmin, (_req, res) => res.json({ nominations: db.prepare('SELECT * FROM grom_nominations ORDER BY id DESC').all(),
  sponsorships: db.prepare('SELECT s.*, u.name user_name FROM grom_sponsorships s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.id DESC').all() }));
app.get('/api/admin/enquiries', requireAdmin, (_req, res) => res.json({ enquiries: db.prepare('SELECT q.*, r.title retreat_title FROM retreat_enquiries q JOIN retreats r ON r.id=q.retreat_id ORDER BY q.id DESC').all() }));
app.get('/api/admin/feedback', requireAdmin, (_req, res) => res.json({ feedback: db.prepare('SELECT * FROM feedback ORDER BY id DESC').all() }));
app.post('/api/admin/feedback/:id/status', requireAdmin, (req, res) => {
  if (!['new', 'done'].includes(req.body?.status)) return bad(res, 'Bad status.');
  db.prepare('UPDATE feedback SET status=? WHERE id=?').run(req.body.status, req.params.id); res.json({ ok: true });
});
app.get('/api/admin/users', requireAdmin, (_req, res) => res.json({ users: db.prepare(`SELECT u.id,u.name,u.email,u.island,u.tier,u.is_bot,u.marketing_opt_in,u.created_at, (SELECT 1 FROM plus_waitlist w WHERE w.user_id=u.id) waitlist FROM users u WHERE is_admin=0 ORDER BY is_bot, id DESC`).all() }));
app.post('/api/admin/users/:id/tier', requireAdmin, (req, res) => {
  if (!config.tiers[req.body?.tier]) return bad(res, 'Bad tier.');
  db.prepare('UPDATE users SET tier=? WHERE id=? AND is_bot=0').run(req.body.tier, req.params.id); res.json({ ok: true });
});

app.use('/api', (_req, res) => bad(res, 'Not found', 404));

// ---------- static front-end ----------
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
const DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(DIST, 'index.html')) : next()));
}

if (!Number.isFinite(PORT) || PORT <= 0) {
  console.error('PORT must be a positive number.');
  process.exit(1);
}

// Fresh disk (or a brand-new local data dir): load events, retreats, bots, and the admin.
// `npm run seed` is still safe to run on every start; this covers `npm start` on an empty DB.
ensureRuntimeSeed();

app.listen(PORT, HOST, () => console.log(`Riders Plus running on http://${HOST}:${PORT} (db: ${dbFile}, payments: ${config.paymentsMode} mode)`));
