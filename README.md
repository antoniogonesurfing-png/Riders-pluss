# Riders Plus (test version)

Community app by **Ride With Us Retreats** (Fuerteventura · ridewithusretreats.com · info@ridewithusretreats.com).
Canary Islands events, Ride With Us retreats, "Find your rider" swipe matching with chat, Sponsor a Grom, and an admin panel.
Mobile-first, works on desktop. This is a testing ground before the main launch: every page has a **Report a bug** button.

## Run it locally

Requirements: Node.js 20+.

```bash
npm install
npm run seed        # creates data/riders-plus.db, loads events, retreats, bots, admin
npm run build       # builds the front end into dist/
npm start           # http://localhost:4310  (API + app on one port)
```

Development with hot reload: `npm run dev` (API on :4310, Vite on http://localhost:5173 with an /api proxy).

Admin login: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before you seed. If you leave them unset on your own machine, the seed script creates `admin@riders-plus.local` and writes a random password to `ADMIN_CREDENTIALS.txt` (gitignored, never committed). Log in at `/login`, then open `/admin`.
Reset everything to the clean seed: `npm run seed:reset` (keeps `ADMIN_PASSWORD` when it is set, otherwise creates a new random password).

Tests:
- `npm test`: API tests for limits and validation on a throwaway database (port 4398).
- `python tests/e2e.py` (needs Playwright for Python and the server running on :4310): full browser test at 390 px, saves screenshots to `screenshots/`.

## Deploy on Render

Phone steps: [DEPLOY.md](DEPLOY.md). The Blueprint is `render.yaml`.

Render's **free** plan has no persistent disk, so the SQLite database and uploaded photos would be wiped on every redeploy or restart. Data only survives on a paid instance. The cheapest one is **Starter** (about $7/month; plan id `0.5c-512mb`) plus a small disk (1 GB, about $0.25/month). `render.yaml` requests that plan, a disk mounted at `/var/data`, and a start command that seeds if needed and then starts the server.

The server listens on `process.env.PORT` and binds `0.0.0.0`. Set `DATA_DIR` to the disk mount (the blueprint sets `/var/data`). The database file is `$DATA_DIR/riders-plus.db` and uploads are `$DATA_DIR/uploads`. `DB_PATH` (or `DB_FILE`) can point the file somewhere else. On an empty database the server also seeds itself at startup. In production the admin account comes only from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (8+ characters); the credentials file is not written. Changing `ADMIN_PASSWORD` and redeploying updates that admin's password. Leave the Stripe variables empty to keep test checkout.

| Variable | On Render | What |
| --- | --- | --- |
| `ADMIN_EMAIL` | required, secret | Admin login email |
| `ADMIN_PASSWORD` | required, secret | Admin password (8+ characters) |
| `DATA_DIR` | `/var/data` | Persistent directory for the database and uploads |
| `DB_PATH` | optional | Full path to the SQLite file |
| `DB_FILE` | optional | Alias of `DB_PATH` (the API tests use it) |
| `NODE_ENV` | `production` | Secure session cookies |
| `STRIPE_SECRET_KEY` | optional, secret | Empty keeps TEST MODE checkout |
| `STRIPE_WEBHOOK_SECRET` | optional, secret | Only needed before real payments |
| `PORT` | set by Render | Do not set this yourself |

## What's inside

| Path | What |
| --- | --- |
| `server/index.js` | Express API + serves the built app |
| `server/db.js` | SQLite schema (better-sqlite3) |
| `server/paths.js` | Database and upload paths (`DATA_DIR`, `DB_PATH`, `DB_FILE`) |
| `server/config.js` | **Membership tiers and limits, fees, sponsor amounts (one place)** |
| `server/payments.js` | TEST MODE checkout, Stripe-ready branch |
| `server/seed.js` | Seeds events, retreats, test bots, admin |
| `server/data/events.json` | 146 sourced Canary Islands events + 5 weekly markets |
| `server/data/retreats.js` | Ride With Us Retreats trips (from ridewithusretreats.com, 27 Oct 2026) |
| `server/data/bots.js` | 12 test bot profiles + scripted keyword replies |
| `server/data/groms.js` | 3 illustrated *example* grom cards (not real children) |
| `src/` | React front end (Vite, React Router) |

### Features
- **Explore**: "Would you like your event registered here or featured?" banner (mailto + Post an event), search by what + where (place filter matches place/island), quick tiles, featured events, Ride With Us highlights, next events in Fuerteventura, browse by island (only islands that have events).
- **Events**: month tabs Nov 2026 to Dec 2027 (with counts), category chips, island (Fuerteventura default, all Canaries, each island), free-only toggle, search, "Date to be confirmed" labels, weekly recurring markets, source links, RSVP with attendee count.
- **Post an event** (signed in): free or paid; paid needs a listing fee of at least €5, optional Featured boost (+€15); TEST MODE checkout (test card 4242 4242 4242 4242), then the listing goes to the admin approval queue. A paid featured boost becomes "Featured" when approved.
- **Retreats**: Ride With Us Retreats as a verified provider with 14 real offerings, detail pages, booking-request form saved to the DB (+ mailto).
- **Find your rider**: swipe cards (Up = like, Down = pass, Profile), drag or arrow keys, filters, mutual like = match = chat. 12 TEST BOT profiles (robot illustrations, "Test bot" badge, "(Bot)" in name) that always like you back, open with *"Hi guys, I'm a bot. I'm here so you can test the functionality of the app."* and reply with scripted keyword answers after a short typing delay.
- **Sponsor a Grom**: how it works, example cards labelled "Example profile, not a real person", guardian-only nomination form (required consent + guardian contact), sponsor CTA with test checkout.
- **Accounts**: email + password (bcrypt hashed), 18+ (date of birth checked), profile with sports, level, island, town, bio, photos; optional opt-in for future Riders Plus news.
- **Membership**: sign-up and matching are free. *Basic* (free) vs *Plus* (placeholder, not for sale). Basic limits (in `server/config.js`): 20 swipes/day, can't see who liked you (count only), sport filter only (level/island show a PLUS badge), max 3 photos, 1 free event post per month (paid listing fees still apply). Locked features open an "Upgrade coming soon" sheet with a "Notify me" opt-in saved to the DB. Admins can set a user to Plus for testing.
- **Admin** (`/admin`): stats incl. user count, tier limits table, event approval queue, all events with Featured toggle, grom nominations and sponsorships, retreat enquiries, feedback inbox (mark done), users and tiers.
- **Privacy** (GDPR), **Community guidelines** (incl. safeguarding for minors), **Terms**: controller Ride With Us Retreats + contact email; no placeholder brackets.

## Going live later

### Option A (simplest): keep this Node + SQLite server
Deploy to any Node host with a persistent disk (Render, Railway, Fly.io, a small VPS). For Render, follow [DEPLOY.md](DEPLOY.md). Set `NODE_ENV=production`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `DATA_DIR` to the persistent disk, then `npm install && npm run build` and `npm run seed && npm start`.

### Option B: Supabase + Vercel or Netlify
1. **Database**: create a Supabase project. The tables in `server/db.js` map 1:1 to Postgres (`INTEGER PRIMARY KEY AUTOINCREMENT` -> `bigint generated always as identity`, `TEXT` JSON columns -> `jsonb`, `datetime('now')` -> `now()`). Export seed data with `node server/seed.js` into SQLite, then copy rows with a small script or CSV import.
2. **Auth**: replace `/api/auth/*` and the `sessions` table with Supabase Auth (email + password). Keep the 18+ check and the news opt-in as profile fields.
3. **Data access**: either keep the Express routes as serverless functions (Vercel `api/` or Netlify Functions) using `@supabase/supabase-js` with the service key server-side, or move reads to the client with Row Level Security (users can only read their own matches/messages; admins via a role claim).
4. **Bots**: the scripted reply currently uses `setTimeout` in the server. On serverless, insert the reply in the same request after a short delay, or use a Supabase Edge Function / database trigger.
5. **Photos**: move `data/uploads` to Supabase Storage.
6. **Front end**: `npm run build` outputs static files in `dist/`; deploy to Vercel or Netlify with a SPA rewrite (`/* -> /index.html`).

### Payments (Stripe)
`server/payments.js` already builds a Stripe Checkout Session when `STRIPE_SECRET_KEY` is set (that branch is untested because no keys exist). Before charging real money: add the webhook handler at `/api/stripe/webhook` with signature verification (`STRIPE_WEBHOOK_SECRET`) that calls `markPaid()` on `checkout.session.completed`, test with Stripe test keys, then switch to live keys. Plus subscriptions would use Stripe Billing later.

### Needed accounts / keys to go live
- Hosting (Render/Railway/VPS, or Vercel/Netlify) and a domain/subdomain (HTTPS)
- Supabase project (if Option B)
- Stripe account (business verification, test + live keys, webhook secret)
- Transactional email (e.g. Resend/Postmark) for password resets, enquiry/nomination notifications (not built yet)
- Legal review of Privacy/Terms; add company legal details (NIF/address) when ready

## Notes
- Retreat details and images come from ridewithusretreats.com as published on 27 Oct 2026. Images are linked from that site, not copied. Unpublished details are left out or shown as "Ask for dates".
- Event data comes from public sources (links on each event). "Date to be confirmed" = annual event whose new date isn't out yet.
- Test bots are fictional and clearly labelled; example grom cards are illustrations, not real children.
