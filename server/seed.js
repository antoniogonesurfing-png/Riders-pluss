// Seed / reset the database: node server/seed.js [--reset]
// Safe to run more than once: curated events are inserted once, retreats and bots upsert,
// and the admin account is created or updated from ADMIN_EMAIL / ADMIN_PASSWORD.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { dbFile } = require('./paths');

if (require.main === module && process.argv.includes('--reset')) {
  for (const f of [dbFile, dbFile + '-wal', dbFile + '-shm']) if (fs.existsSync(f)) fs.unlinkSync(f);
}
const db = require('./db');
const { provider, retreats } = require('./data/retreats');
const { bots } = require('./data/bots');

const J = JSON.stringify;

function seedEvents() {
  if (db.prepare("SELECT COUNT(*) c FROM events WHERE origin='curated'").get().c > 0) return console.log('events: already seeded');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'events.json'), 'utf8'));
  const ins = db.prepare(`INSERT INTO events (title, category, start_date, end_date, month, schedule, place, island, is_free, price_status, description, source_url, date_status, origin, status)
    VALUES (@title,@category,@start,@end,@month,@schedule,@place,@island,@is_free,@price_status,@description,@source,@date_status,'curated','approved')`);
  const seen = new Set();
  let n = 0;
  db.transaction(() => {
    for (const e of [...data.events, ...data.recurring]) {
      const k = `${e.name}|${e.start || e.schedule}|${e.island}`.toLowerCase();
      if (seen.has(k)) continue; // never repeat a listing
      seen.add(k);
      ins.run({ title: e.name, category: e.category, start: e.start || null, end: e.end || e.start || null, month: e.month || null, schedule: e.schedule || null,
        place: e.place, island: e.island, is_free: e.free ? 1 : 0, price_status: e.price, description: e.description, source: e.source, date_status: e.date_status });
      n++;
    }
  })();
  console.log('events:', n);
}

function seedRetreats() {
  let p = db.prepare('SELECT id FROM providers WHERE slug=?').get(provider.slug);
  if (!p) {
    const r = db.prepare('INSERT INTO providers (slug,name,verified,tagline,location,about,website,email,image) VALUES (@slug,@name,@verified,@tagline,@location,@about,@website,@email,@image)').run(provider);
    p = { id: r.lastInsertRowid };
  }
  const up = db.prepare(`INSERT INTO retreats (slug,provider_id,title,kind,location,region,summary,description,facts,price_text,prices,dates,dates_note,includes,not_included,image,image_alt,source_url,status_label,featured,sort)
    VALUES (@slug,@provider_id,@title,@kind,@location,@region,@summary,@description,@facts,@price_text,@prices,@dates,@dates_note,@includes,@not_included,@image,@image_alt,@source_url,@status_label,@featured,@sort)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title,kind=excluded.kind,location=excluded.location,region=excluded.region,summary=excluded.summary,description=excluded.description,facts=excluded.facts,price_text=excluded.price_text,prices=excluded.prices,dates=excluded.dates,dates_note=excluded.dates_note,includes=excluded.includes,not_included=excluded.not_included,image=excluded.image,image_alt=excluded.image_alt,source_url=excluded.source_url,status_label=excluded.status_label,featured=excluded.featured,sort=excluded.sort`);
  retreats.forEach((r, i) => up.run({ ...r, provider_id: p.id, facts: J(r.facts), prices: J(r.prices), dates: J(r.dates), includes: J(r.includes), not_included: J(r.not_included), sort: i }));
  console.log('retreats:', retreats.length);
}

function seedBots() {
  const up = db.prepare(`INSERT INTO users (email,password_hash,name,birthdate,sports,level,island,town,bio,is_bot,bot_key,avatar_color,terms_accepted_at)
    VALUES (@email,NULL,@name,'1990-01-01',@sports,@level,@island,@town,@bio,1,@key,@color,datetime('now'))
    ON CONFLICT(email) DO UPDATE SET name=excluded.name,sports=excluded.sports,level=excluded.level,island=excluded.island,town=excluded.town,bio=excluded.bio,avatar_color=excluded.avatar_color`);
  for (const b of bots) up.run({ email: `bot-${b.key}@bots.riders-plus.test`, name: b.name, sports: J(b.sports), level: b.sports[0][1], island: b.island, town: b.town, bio: b.bio, key: b.key, color: b.color });
  console.log('bots:', bots.length);
}

function adminSettings() {
  const production = process.env.NODE_ENV === 'production';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (production) {
    if (!email || !password) {
      console.error('Production needs ADMIN_EMAIL and ADMIN_PASSWORD. Set them in the host dashboard and redeploy.');
      process.exit(1);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('ADMIN_EMAIL is not a valid email.');
      process.exit(1);
    }
    if (password.length < 8) {
      console.error('ADMIN_PASSWORD must be at least 8 characters.');
      process.exit(1);
    }
  }
  return { email: email || 'admin@riders-plus.local', password };
}

// Local installs can still read the gitignored credentials file (the e2e test does).
// Production never writes that file; the dashboard env vars are the source of truth.
function writeLocalCredentials(email, password) {
  if (process.env.NODE_ENV === 'production') return;
  const credFile = process.env.ADMIN_CREDENTIALS_FILE || path.join(__dirname, '..', 'ADMIN_CREDENTIALS.txt');
  fs.mkdirSync(path.dirname(credFile), { recursive: true });
  fs.writeFileSync(credFile, `Riders Plus admin login (local test install)\nURL:      http://localhost:${process.env.PORT || 4310}/login  then open /admin\nEmail:    ${email}\nPassword: ${password}\n\nThis file is gitignored. On a host, set ADMIN_EMAIL and ADMIN_PASSWORD instead.\n`);
}

function seedAdmin() {
  const { email, password } = adminSettings();
  const existing = db.prepare('SELECT id, is_admin, password_hash FROM users WHERE email=?').get(email);
  if (existing) {
    if (!existing.is_admin) db.prepare("UPDATE users SET is_admin=1, tier='plus' WHERE id=?").run(existing.id);
    if (password && (!existing.password_hash || !bcrypt.compareSync(password, existing.password_hash))) {
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), existing.id);
      writeLocalCredentials(email, password);
      console.log(`admin: password set from ADMIN_PASSWORD (${email})`);
    } else {
      console.log(`admin: exists (${email})`);
    }
    return;
  }
  const chosen = password || crypto.randomBytes(9).toString('base64url');
  db.prepare(`INSERT INTO users (email,password_hash,name,birthdate,is_admin,island,terms_accepted_at,tier) VALUES (?,?,?,?,1,'Fuerteventura',datetime('now'),'plus')`)
    .run(email, bcrypt.hashSync(chosen, 10), 'Riders Plus Admin', '1986-01-01');
  writeLocalCredentials(email, chosen);
  console.log(password ? `admin: created from ADMIN_EMAIL / ADMIN_PASSWORD (${email})` : 'admin: created, credentials written to ADMIN_CREDENTIALS.txt');
}

function isDatabaseEmpty() {
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const events = db.prepare('SELECT COUNT(*) c FROM events').get().c;
  return users === 0 && events === 0;
}

function seedAll() {
  adminSettings(); // fail before writing if production admin env is missing or invalid
  seedEvents();
  seedRetreats();
  seedBots();
  seedAdmin();
}

// Used by the server on boot. An empty database gets the full seed. A database that
// already has events still gets the admin account in production, so a failed first
// boot cannot leave the app running with nobody able to sign in.
function ensureRuntimeSeed() {
  if (isDatabaseEmpty()) {
    console.log('Database is empty — seeding events, retreats, bots, and admin');
    seedAll();
    return;
  }
  if (process.env.NODE_ENV === 'production') seedAdmin();
}

if (require.main === module) {
  seedAll();
  console.log('done');
}

module.exports = { seedAll, isDatabaseEmpty, ensureRuntimeSeed };
