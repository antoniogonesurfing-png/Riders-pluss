export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) { const err = new Error(data.error || `Request failed (${res.status})`); err.status = res.status; err.data = data; throw err; }
  return data;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MSHORT = MONTHS.map((m) => m.slice(0, 3));
export const monthLabel = (k, short) => { const [y, m] = k.split('-'); return `${(short ? MSHORT : MONTHS)[+m - 1]} ${short ? y.slice(2) : y}`; };
export function eventDate(e) {
  if (e.date_status === 'recurring') return e.schedule;
  if (e.date_status === 'tbc') return monthLabel(e.start_date.slice(0, 7));
  const f = (d) => { const [y, m, dd] = d.split('-'); return `${+dd} ${MSHORT[+m - 1]}`; };
  const y = e.start_date.slice(0, 4);
  const range = e.end_date && e.end_date !== e.start_date ? `${f(e.start_date)} – ${f(e.end_date)}` : f(e.start_date);
  return `${range} ${y}${e.start_time ? ` · ${e.start_time}` : ''}`;
}
export function eventPrice(e) {
  if (e.is_free || e.price_status === 'free') return 'Free';
  if (e.price_eur) return `€${Number(e.price_eur).toFixed(e.price_eur % 1 ? 2 : 0)}`;
  if (e.price_status === 'paid') return 'Paid entry';
  return 'Check price with organiser';
}
export const euro = (cents) => `€${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
