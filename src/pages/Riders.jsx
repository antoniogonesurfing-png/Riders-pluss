import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Avatar, { RobotArt, PersonArt } from '../components/Avatar.jsx';
import Sheet from '../components/Sheet.jsx';
import { PlusBadge } from '../components/PlusSheet.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

function CardArt({ u }) {
  if (u.photos?.[0]) return <img src={u.photos[0]} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return u.is_bot ? <RobotArt color={u.avatar_color} seed={u.name} sport={u.sports?.[0]?.[0]} /> : <PersonArt color={u.avatar_color} seed={u.name} />;
}

export default function Riders() {
  const { me, config, openPlus, setUsage } = useApp();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [filters, setFilters] = useState({ sport: 'All', level: 'All', island: 'All' });
  const [showFilters, setShowFilters] = useState(false);
  const [match, setMatch] = useState(null);
  const [anim, setAnim] = useState(null);
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const tier = config.tiers[me?.tier] || config.tiers.basic;

  const load = useCallback(() => {
    const p = new URLSearchParams(filters);
    api(`/riders?${p}`).then((r) => { setData(r); setUsage(r.usage); setErr(''); }).catch((e) => setErr(e.message));
  }, [filters, setUsage]);
  useEffect(() => { if (me) load(); }, [me, load]);

  const current = data?.riders?.[0];
  const swipe = useCallback(async (direction) => {
    if (!current || anim) return;
    setAnim(direction);
    try {
      const r = await api(`/riders/${current.id}/swipe`, { method: 'POST', body: { direction } });
      setUsage(r.usage);
      await new Promise((res) => setTimeout(res, 220));
      setData((d) => ({ ...d, riders: d.riders.slice(1), usage: r.usage }));
      if (r.match) setMatch(r.match);
    } catch (x) {
      if (x.data?.locked) openPlus(x.data.locked); else setErr(x.message);
      if (x.data?.usage) setUsage(x.data.usage);
    } finally { setAnim(null); setDrag(0); }
  }, [current, anim, openPlus, setUsage]);

  useEffect(() => {
    const k = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowUp') { e.preventDefault(); swipe('up'); } if (e.key === 'ArrowDown') { e.preventDefault(); swipe('down'); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [swipe]);

  if (!me) return <NeedLogin what="find your rider" next="/riders" />;
  const usage = data?.usage;
  const onDown = (e) => { if (e.target.closest('button')) return; start.current = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => { if (start.current != null) setDrag(e.clientY - start.current); };
  const onUp = () => { if (start.current == null) return; const d = drag; start.current = null; if (d < -90) swipe('up'); else if (d > 90) swipe('down'); else setDrag(0); };
  const transform = anim === 'up' ? 'translateY(-120%) rotate(-4deg)' : anim === 'down' ? 'translateY(120%) rotate(4deg)' : drag ? `translateY(${drag}px) rotate(${drag / 40}deg)` : 'none';
  const lockedFilter = (k) => !tier.filters.includes(k);
  const activeCount = ['sport', 'level', 'island'].filter((k) => filters[k] !== 'All').length;

  return (
    <div className="swipe-wrap">
      <div className="row between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div><div className="eyebrow">Explore</div><h1 style={{ margin: 0 }}>Find your rider</h1></div>
        <button className="btn outline sm" onClick={() => setShowFilters(true)} data-testid="filters-btn">Filters{activeCount ? ` (${activeCount})` : ''}</button>
      </div>
      <p className="muted small" style={{ margin: '4px 0 10px' }}>Swipe up to like. Swipe down to pass. A mutual like is a connection, not a date.</p>

      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="counter" data-testid="swipes-left"><Icon name="heart" size={14} /> {usage?.swipesLeft == null ? 'Unlimited likes' : `${usage.swipesLeft} of ${usage.limits.dailySwipeLimit} swipes left today`}</span>
        <button className="chip" onClick={() => (tier.canSeeWhoLikedYou ? null : openPlus('likedYou'))} data-testid="liked-you">
          <Icon name="sparkles" size={14} /> {data?.likedYou?.count || 0} liked you {!tier.canSeeWhoLikedYou && <PlusBadge />}
        </button>
      </div>
      {tier.canSeeWhoLikedYou && data?.likedYou?.users?.length > 0 && <div className="row" style={{ marginBottom: 10 }}>{data.likedYou.users.map((u) => <Link key={u.id} to={`/riders/${u.id}`}><Avatar user={u} size={36} /></Link>)}</div>}

      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
      {!data ? <p className="muted">Loading riders…</p> : !current ? (
        <div className="card empty stack">
          <h3>You've seen everyone for these filters</h3>
          <p>New riders join all the time. Check your matches or change filters.</p>
          <div className="row" style={{ justifyContent: 'center' }}><Link className="btn primary" to="/messages">Messages</Link><button className="btn outline" onClick={() => setFilters({ sport: 'All', level: 'All', island: 'All' })}>Clear filters</button></div>
        </div>
      ) : (
        <>
          <div className="swipe-card" style={{ transform, opacity: anim ? 0 : 1, background: current.avatar_color }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} data-testid="swipe-card">
            <div className="art"><CardArt u={current} /></div>
            {current.is_bot && <span className="pill bot bot-ribbon" data-testid="bot-badge">🤖 TEST BOT</span>}
            <span className="swipe-stamp up" style={{ opacity: drag < -30 ? Math.min(1, -drag / 120) : 0 }}>UP</span>
            <span className="swipe-stamp down" style={{ opacity: drag > 30 ? Math.min(1, drag / 120) : 0 }}>DOWN</span>
            <div className="overlay">
              <div className="xs" style={{ letterSpacing: '.08em', opacity: .8, fontWeight: 600 }}>{current.is_bot ? 'TEST BOT · NOT A REAL PERSON' : `${current.age ? `${current.age} YEARS` : 'RIDER'}`}</div>
              <h2 data-testid="card-name">{current.name}</h2>
              <div className="small" style={{ opacity: .9 }}>{[current.town, current.island].filter(Boolean).join(', ')}</div>
              <div className="tags">{current.sports.map(([s, l]) => <span className="pill" key={s}>{s} · {l}</span>)}</div>
              <div className="swipe-actions">
                <button className="btn down" onClick={() => swipe('down')} data-testid="btn-down">Down</button>
                <button className="btn profile" onClick={() => nav(`/riders/${current.id}`)} data-testid="btn-profile">Profile</button>
                <button className="btn up" onClick={() => swipe('up')} data-testid="btn-up">Up</button>
              </div>
            </div>
          </div>
          <p className="xs muted" style={{ textAlign: 'center', marginTop: 10 }}>Tip: drag the card, or use the ↑ / ↓ keys. {data.riders.length} rider{data.riders.length === 1 ? '' : 's'} in your stack.</p>
        </>
      )}

      {showFilters && (
        <Sheet title="Filters" onClose={() => setShowFilters(false)}>
          <div className="stack">
            <label className="field"><span>Sport</span>
              <select className="input" value={filters.sport} onChange={(e) => setFilters({ ...filters, sport: e.target.value })} data-testid="filter-sport"><option value="All">All sports</option>{config.sports.map((s) => <option key={s}>{s}</option>)}</select></label>
            {['level', 'island'].map((k) => (
              <label className="field" key={k}><span className="lockable">{k === 'level' ? 'Level' : 'Island'} {lockedFilter(k) && <PlusBadge />}</span>
                {lockedFilter(k) ? <button type="button" className="input" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--muted-fg)' }} onClick={() => openPlus(k)} data-testid={`filter-${k}-locked`}><Icon name="lock" size={14} /> Any {k} · unlock with Plus</button>
                  : <select className="input" value={filters[k]} onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}><option value="All">Any {k}</option>{(k === 'level' ? config.levels : config.islands).map((s) => <option key={s}>{s}</option>)}</select>}
              </label>
            ))}
            <button className="btn primary block" onClick={() => setShowFilters(false)}>Show riders</button>
          </div>
        </Sheet>
      )}

      {match && (
        <Sheet title="It's a match!" onClose={() => setMatch(null)}>
          <div className="match-pop stack" data-testid="match-sheet">
            <div className="pair"><Avatar user={me} size={84} /><Avatar user={match.with} size={84} /></div>
            <p>You and <b>{match.with.name}</b> liked each other.{match.with.is_bot ? ' This is a test bot, so it always likes you back.' : ''}</p>
            <button className="btn primary block" onClick={() => nav(`/messages/${match.id}`)} data-testid="open-chat">Open chat</button>
            <button className="btn ghost block" onClick={() => setMatch(null)}>Keep swiping</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
