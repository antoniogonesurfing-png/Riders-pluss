// Illustrated avatars generated as SVG. Bots are drawn as robots so nobody mistakes them for real people.
const SPORT_EMOJI = { Surf: '🏄', Kitesurf: '🪁', Windsurf: '⛵', 'Wing foil': '🪽', Cycling: '🚴', Running: '🏃', Yoga: '🧘', Sailing: '⛵', SUP: '🛶', Hiking: '🥾', Climbing: '🧗', Skate: '🛹' };
export const sportEmoji = (s) => SPORT_EMOJI[s] || '🌊';

function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

export function RobotArt({ color = '#e0703a', seed = 'bot', sport }) {
  const h = hash(seed);
  const eye = h % 3; const mouth = (h >> 2) % 3; const ant = (h >> 4) % 2;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Illustrated robot avatar (test bot)">
      <defs><linearGradient id={`g${h}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".95" /><stop offset="1" stopColor={color} stopOpacity=".6" /></linearGradient></defs>
      <rect width="200" height="200" fill={`url(#g${h})`} />
      <circle cx="160" cy="40" r="26" fill="#fff" opacity=".14" /><circle cx="30" cy="170" r="40" fill="#fff" opacity=".1" />
      {ant ? <><line x1="100" y1="44" x2="100" y2="22" stroke="#2b2b3a" strokeWidth="5" /><circle cx="100" cy="18" r="8" fill="#ffd166" /></>
        : <><line x1="78" y1="46" x2="66" y2="24" stroke="#2b2b3a" strokeWidth="5" /><line x1="122" y1="46" x2="134" y2="24" stroke="#2b2b3a" strokeWidth="5" /><circle cx="66" cy="22" r="6" fill="#ffd166" /><circle cx="134" cy="22" r="6" fill="#ffd166" /></>}
      <rect x="44" y="44" width="112" height="96" rx="28" fill="#f4f1ea" stroke="#2b2b3a" strokeWidth="5" />
      <rect x="34" y="78" width="12" height="28" rx="5" fill="#2b2b3a" /><rect x="154" y="78" width="12" height="28" rx="5" fill="#2b2b3a" />
      <rect x="58" y="62" width="84" height="48" rx="16" fill="#2b2b3a" />
      {eye === 0 && <><circle cx="82" cy="86" r="9" fill="#8ff0c0" /><circle cx="118" cy="86" r="9" fill="#8ff0c0" /></>}
      {eye === 1 && <><rect x="72" y="80" width="20" height="10" rx="5" fill="#8ff0c0" /><rect x="108" y="80" width="20" height="10" rx="5" fill="#8ff0c0" /></>}
      {eye === 2 && <><path d="M72 90q10-12 20 0" stroke="#8ff0c0" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M108 90q10-12 20 0" stroke="#8ff0c0" strokeWidth="5" fill="none" strokeLinecap="round" /></>}
      {mouth === 0 && <path d="M80 122q20 14 40 0" stroke="#2b2b3a" strokeWidth="5" fill="none" strokeLinecap="round" />}
      {mouth === 1 && <rect x="80" y="117" width="40" height="10" rx="5" fill="#2b2b3a" />}
      {mouth === 2 && <><circle cx="86" cy="122" r="4" fill="#2b2b3a" /><circle cx="100" cy="122" r="4" fill="#2b2b3a" /><circle cx="114" cy="122" r="4" fill="#2b2b3a" /></>}
      <rect x="70" y="140" width="60" height="40" rx="12" fill="#f4f1ea" stroke="#2b2b3a" strokeWidth="5" />
      <text x="100" y="168" textAnchor="middle" fontSize="22">{sportEmoji(sport)}</text>
    </svg>
  );
}

export function PersonArt({ color = '#e0703a', seed = 'x', initials = '', kid = false }) {
  const h = hash(seed);
  const skins = ['#f2d3b3', '#e5b48f', '#c98e66', '#9c6644', '#7a4b2e'];
  const hairs = ['#2b1d14', '#6b4226', '#c58a3d', '#1d1d1d', '#8a3b1d'];
  const skin = skins[h % skins.length]; const hair = hairs[(h >> 3) % hairs.length]; const style = (h >> 6) % 3;
  const r = kid ? 34 : 38;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Illustrated avatar">
      <rect width="200" height="200" fill={color} opacity=".9" />
      <circle cx="100" cy="230" r="90" fill="#fff" opacity=".85" />
      <circle cx="100" cy={kid ? 96 : 90} r={r} fill={skin} />
      {style === 0 && <path d={`M${100 - r} ${kid ? 92 : 86}q${r} -${r * 1.6} ${r * 2} 0q-${r * .4} -${r * .5} -${r} -${r * .45}q-${r * .6} 0 -${r} ${r * .45}z`} fill={hair} />}
      {style === 1 && <path d={`M${100 - r - 4} ${kid ? 100 : 94}q0 -${r * 1.4} ${r + 4} -${r * 1.2}q${r + 4} -${r * .2} ${r + 4} ${r * 1.2}q-8 -${r * .6} -${r + 4} -${r * .7}q-${r - 4} 0 -${r + 4} ${r * .7}z`} fill={hair} />}
      {style === 2 && <rect x={100 - r - 2} y={(kid ? 96 : 90) - r - 4} width={r * 2 + 4} height={r * .8} rx={r * .4} fill={hair} />}
      <circle cx="86" cy={kid ? 98 : 92} r="4" fill="#2b2b3a" /><circle cx="114" cy={kid ? 98 : 92} r="4" fill="#2b2b3a" />
      <path d={`M88 ${kid ? 112 : 106}q12 9 24 0`} stroke="#2b2b3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      {initials && !kid && <text x="100" y="182" textAnchor="middle" fontSize="22" fontWeight="700" fill="#2b2b3a" fontFamily="sans-serif">{initials}</text>}
    </svg>
  );
}

export default function Avatar({ user, size = 44 }) {
  if (!user) return null;
  const photo = user.photos?.[0];
  const initials = (user.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      {user.is_bot ? <RobotArt color={user.avatar_color} seed={user.name} sport={user.sports?.[0]?.[0]} />
        : photo ? <img src={photo} alt={`${user.name}'s photo`} />
          : <PersonArt color={user.avatar_color || '#e0703a'} seed={user.name} initials={initials} />}
    </span>
  );
}
