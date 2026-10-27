// API tests for membership limits and server-side validation. Uses a throwaway database and port.
// Run: npm test
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-test-'));
const env = { ...process.env, DB_FILE: path.join(tmp, 'test.db'), PORT: '4398', ADMIN_CREDENTIALS_FILE: path.join(tmp, 'admin.txt'), ADMIN_PASSWORD: 'admin-test-pass' };
const BASE = 'http://localhost:4398/api';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? `  [${extra}]` : ''}`); };

function client() {
  let cookie = '';
  return async (p, method = 'GET', body) => {
    const r = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    return { status: r.status, data: await r.json().catch(() => ({})) };
  };
}
const signup = (c, n, extra = {}) => c('/auth/signup', 'POST', { name: `User ${n}`, email: `u${n}@example.com`, password: 'password123', birthdate: '1992-03-03', acceptTerms: true, sports: ['Surf'], ...extra });

(async () => {
  execFileSync('node', [path.join(__dirname, '..', 'server', 'seed.js'), '--reset'], { env, stdio: 'ignore' });
  const srv = spawn('node', [path.join(__dirname, '..', 'server', 'index.js')], { env, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1200));
  try {
    const kid = client();
    ok('under-18 sign-up rejected', (await signup(kid, 'kid', { birthdate: '2012-01-01' })).status === 400);
    const noTerms = client();
    ok('sign-up without accepting terms rejected', (await signup(noTerms, 'nt', { acceptTerms: false })).status === 400);

    const a = client();
    const s = await signup(a, 'main');
    ok('sign-up is free and returns Basic tier', s.status === 200 && s.data.usage.tier === 'basic' && s.data.usage.swipesLeft === 20);
    const pw = await a('/me');
    ok('password never returned', !JSON.stringify(pw.data).includes('password'));

    // extra riders so there are more than 20 people to swipe
    for (let i = 0; i < 12; i++) await signup(client(), `extra${i}`);
    const riders = (await a('/riders')).data.riders;
    ok('enough riders to test the limit', riders.length >= 21, `${riders.length}`);
    let last;
    for (let i = 0; i < 20; i++) last = await a(`/riders/${riders[i].id}/swipe`, 'POST', { direction: 'down' });
    ok('20 swipes allowed', last.status === 200 && last.data.usage.swipesLeft === 0);
    const over = await a(`/riders/${riders[20].id}/swipe`, 'POST', { direction: 'up' });
    ok('21st swipe blocked on Basic (429 + locked)', over.status === 429 && over.data.locked === 'swipes');

    const lvl = await a('/riders?level=Advanced&island=Lanzarote');
    ok('level/island filters ignored for Basic', JSON.stringify(lvl.data.ignoredFilters) === '["level","island"]');
    ok('Basic cannot see who liked them', lvl.data.likedYou.users === null);

    // liked-you count: another user likes main
    const b = client(); await signup(b, 'liker');
    const me = (await a('/me')).data.user;
    await b(`/riders/${me.id}/swipe`, 'POST', { direction: 'up' });
    ok('liked-you count visible on Basic', (await a('/riders')).data.likedYou.count === 1);

    // photos
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    let pr; for (let i = 0; i < 3; i++) pr = await a('/me/photos', 'POST', { dataUrl: png });
    ok('3 photos allowed', pr.status === 200 && pr.data.photos.length === 3);
    const p4 = await a('/me/photos', 'POST', { dataUrl: png });
    ok('4th photo blocked on Basic', p4.status === 403 && p4.data.locked === 'photos');

    // events
    const ev = { title: 'Free beach clean', category: 'Community', date: '2026-12-05', time: '10:00', place: 'Corralejo', island: 'Fuerteventura', description: 'Bring gloves and a bag.' };
    ok('1st free event post allowed', (await a('/events', 'POST', { ...ev, isFree: true })).status === 200);
    const e2 = await a('/events', 'POST', { ...ev, title: 'Second free', isFree: true });
    ok('2nd free event this month blocked on Basic', e2.status === 403 && e2.data.locked === 'event_posts');
    const low = await a('/events', 'POST', { ...ev, title: 'Paid low fee', isFree: false, price: 10, listingFee: 4 });
    ok('paid event with fee < €5 rejected', low.status === 400 && /at least €5/.test(low.data.error));
    const paid = await a('/events', 'POST', { ...ev, title: 'Paid ok', isFree: false, price: 10, listingFee: 5, featuredBoost: true });
    ok('paid event still allowed after free quota (fee applies)', paid.status === 200 && paid.data.status === 'awaiting_payment' && paid.data.checkoutUrl);
    const bad = await a(`/payments/${paid.data.paymentId}/test-pay`, 'POST', { card: '4000000000000002' });
    ok('test checkout only accepts the 4242 test card', bad.status === 400);
    const good = await a(`/payments/${paid.data.paymentId}/test-pay`, 'POST', { card: '4242 4242 4242 4242' });
    ok('test payment total = fee + boost (€20)', good.data.payment.amount_cents === 2000 && good.data.payment.status === 'paid');
    ok('event not public before approval', (await client()(`/events/${paid.data.eventId}`)).status === 404);

    // admin
    const ad = client();
    await ad('/auth/login', 'POST', { email: 'admin@riders-plus.local', password: 'admin-test-pass' });
    ok('non-admin blocked from admin API', (await a('/admin/overview')).status === 403);
    const ov = await ad('/admin/overview');
    ok('admin overview exposes tier config', ov.data.config.tiers.basic.dailySwipeLimit === 20 && ov.data.users >= 14);
    await ad(`/admin/events/${paid.data.eventId}/status`, 'POST', { status: 'approved' });
    const pub = await client()(`/events/${paid.data.eventId}`);
    ok('approved boosted event is public and featured', pub.status === 200 && pub.data.event.featured === true);

    // plus via admin (test) lifts limits
    await ad(`/admin/users/${me.id}/tier`, 'POST', { tier: 'plus' });
    const plusSwipe = await a(`/riders/${riders[20].id}/swipe`, 'POST', { direction: 'up' });
    ok('Plus (set by admin) lifts swipe limit', plusSwipe.status === 200 && plusSwipe.data.usage.swipesLeft === null);
    ok('Plus sees who liked them', Array.isArray((await a('/riders')).data.likedYou.users));
    ok('plus notify saved', (await a('/plus/notify', 'POST', { feature: 'swipes' })).status === 200 && (await ad('/admin/overview')).data.plusWaitlist === 1);

    // bot chat
    const c = client(); await signup(c, 'chatter');
    const bots = (await c('/riders')).data.riders.filter((r) => r.is_bot);
    ok('12 test bots, all named (Bot)', bots.length === 12 && bots.every((x) => x.name.endsWith('(Bot)')));
    const m = await c(`/riders/${bots[0].id}/swipe`, 'POST', { direction: 'up' });
    ok('bot always likes back', !!m.data.match);
    const msgs = await c(`/matches/${m.data.match.id}/messages`);
    ok('bot disclaimer is first message', msgs.data.messages[0].body === "Hi guys, I'm a bot. I'm here so you can test the functionality of the app.");
    await c(`/matches/${m.data.match.id}/messages`, 'POST', { body: 'what gear do you use?' });
    ok('typing flag while bot replies', (await c(`/matches/${m.data.match.id}/messages`)).data.typing === true);
    await new Promise((r) => setTimeout(r, 2600));
    const after = (await c(`/matches/${m.data.match.id}/messages`)).data.messages;
    ok('bot replied about gear', after.length === 3 && /ride|rent/i.test(after[2].body), after[2]?.body);
    ok('other users cannot read the chat', (await a(`/matches/${m.data.match.id}/messages`)).status === 404);

    const g = await client()('/groms/nominate', 'POST', { guardianName: 'G', guardianEmail: 'g@example.com', relationship: 'Parent', gromFirstName: 'T', gromAge: 12, guardianIsAdult: true, guardianConsent: false });
    ok('grom nomination needs guardian consent', g.status === 400);
    const g2 = await client()('/groms/nominate', 'POST', { guardianName: 'G', guardianEmail: 'g@example.com', relationship: 'Parent', gromFirstName: 'T', gromAge: 19, guardianIsAdult: true, guardianConsent: true });
    ok('grom age must be 5–17', g2.status === 400);
    ok('feedback works without login', (await client()('/feedback', 'POST', { kind: 'bug', message: 'API test bug', page: '/x' })).status === 200);
  } catch (e) { fail++; console.error(e); } finally { srv.kill(); }
  console.log(`\n${pass}/${pass + fail} API checks passed`);
  process.exit(fail ? 1 : 0);
})();
