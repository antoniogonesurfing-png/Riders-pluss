import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Avatar from '../components/Avatar.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { PlusBadge } from '../components/PlusSheet.jsx';
import { api, eventDate } from '../api.js';
import { useApp } from '../ctx.js';

const STATUS = { awaiting_payment: ['warn', 'Awaiting test payment'], pending: ['warn', 'In review'], approved: ['success', 'Live'], rejected: ['outline', 'Not approved'] };

export default function Profile() {
  const { me, setMe, usage, setUsage, config, toast, openPlus } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState(null);
  const [mine, setMine] = useState(null);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  useEffect(() => {
    if (!me) return;
    setF({ name: me.name, sports: me.sports.map((s) => s[0]), level: me.level || 'Beginner', island: me.island || 'Fuerteventura', town: me.town || '', bio: me.bio || '', marketingOptIn: me.marketing_opt_in });
    api('/events/mine').then(setMine).catch(() => {});
  }, [me]);
  if (!me) return <NeedLogin what="create your profile" next="/you" />;
  if (!f) return null;
  const tier = config.tiers[me.tier] || config.tiers.basic;
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleSport = (s) => setF({ ...f, sports: f.sports.includes(s) ? f.sports.filter((x) => x !== s) : [...f.sports, s] });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api('/me', { method: 'PUT', body: f }); setMe(r.user); setUsage(r.usage); toast('Profile saved'); } catch (x) { setErr(x.message); }
  };
  const addPhoto = () => { if (me.photos.length >= tier.maxProfilePhotos) return openPlus('photos'); fileRef.current?.click(); };
  const onFile = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try { const r = await api('/me/photos', { method: 'POST', body: { dataUrl: reader.result } }); setMe({ ...me, photos: r.photos }); } catch (x) { if (x.data?.locked) openPlus('photos'); else toast(x.message); }
    };
    reader.readAsDataURL(file);
  };
  const delPhoto = async (i) => { const r = await api(`/me/photos/${i}`, { method: 'DELETE' }); setMe({ ...me, photos: r.photos }); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setMe(null); setUsage(null); nav('/'); };

  return (
    <div className="page-narrow stack">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <Avatar user={me} size={72} />
        <div style={{ minWidth: 0 }}><h1 style={{ margin: 0 }}>{me.name}</h1><div className="muted small">{me.email}</div></div>
      </div>

      <div className="card stack" data-testid="membership-card">
        <div className="row between"><div><div className="eyebrow">Membership</div><h3 style={{ margin: 0 }}>{tier.label} · {tier.price}</h3></div>
          {me.tier !== 'plus' && <button className="btn outline sm" onClick={() => openPlus('general')} data-testid="upgrade-btn"><PlusBadge /> Upgrade coming soon</button>}</div>
        <div className="grid two small">
          <div>Swipes today: <b>{usage?.swipesLeft == null ? 'unlimited' : `${usage.swipesLeft} of ${tier.dailySwipeLimit} left`}</b></div>
          <div>Free event posts: <b>{usage?.freePostsLeft == null ? 'unlimited' : `${usage.freePostsLeft} of ${tier.freeEventPostsPerMonth} left this month`}</b></div>
          <div>Profile photos: <b>{me.photos.length} / {tier.maxProfilePhotos}</b></div>
          <div>See who liked you: <b>{tier.canSeeWhoLikedYou ? 'yes' : 'Plus only'}</b></div>
        </div>
      </div>

      <div className="card stack">
        <div className="row between"><h3 style={{ margin: 0 }}>Photos</h3><span className="xs muted">{me.photos.length}/{tier.maxProfilePhotos}{me.photos.length >= tier.maxProfilePhotos && me.tier !== 'plus' ? ' · more with ' : ''}{me.photos.length >= tier.maxProfilePhotos && me.tier !== 'plus' && <PlusBadge />}</span></div>
        <div className="photos">
          {me.photos.map((p, i) => <div className="ph" key={p}><img src={p} alt={`Profile photo ${i + 1}`} /><button onClick={() => delPhoto(i)} aria-label="Remove photo">×</button></div>)}
          <button className="ph" onClick={addPhoto} style={{ cursor: 'pointer' }} aria-label="Add photo" data-testid="add-photo">{me.photos.length >= tier.maxProfilePhotos ? <Icon name="lock" /> : <Icon name="plus" />}</button>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} data-testid="photo-input" />
        <p className="xs muted" style={{ margin: 0 }}>Use your own photos only. No photos of children (see guidelines).</p>
      </div>

      <form className="card stack" onSubmit={save} data-testid="profile-form">
        <h3 style={{ margin: 0 }}>Profile</h3>
        <div className="form-grid two">
          <label className="field"><span>Name</span><input className="input" value={f.name} onChange={up('name')} /></label>
          <label className="field"><span>Town / spot</span><input className="input" value={f.town} onChange={up('town')} placeholder="e.g. Lajares" /></label>
          <label className="field"><span>Island</span><select className="input" value={f.island} onChange={up('island')}>{config.islands.map((i) => <option key={i}>{i}</option>)}</select></label>
          <label className="field"><span>Level</span><select className="input" value={f.level} onChange={up('level')}>{config.levels.map((i) => <option key={i}>{i}</option>)}</select></label>
        </div>
        <div className="field"><span className="label">Sports</span><div className="chips" style={{ flexWrap: 'wrap' }}>{config.sports.map((s) => <button type="button" key={s} className={`chip ${f.sports.includes(s) ? 'active' : ''}`} onClick={() => toggleSport(s)}>{s}</button>)}</div></div>
        <label className="field"><span>Bio</span><textarea className="input" value={f.bio} onChange={up('bio')} maxLength={500} /></label>
        <label className="check"><input type="checkbox" checked={f.marketingOptIn} onChange={up('marketingOptIn')} /><span className="small">Ride With Us Retreats may email me about future Riders Plus news (optional).</span></label>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" type="submit">Save profile</button>
      </form>

      <div className="card stack">
        <div className="row between"><h3 style={{ margin: 0 }}>My events</h3><Link className="link small" to="/events/new">Post an event</Link></div>
        {!mine ? <p className="muted small">Loading…</p> : mine.posted.length === 0 ? <p className="muted small" style={{ margin: 0 }}>You haven't posted any events yet.</p>
          : mine.posted.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="row between" style={{ textDecoration: 'none', flexWrap: 'nowrap' }} data-testid="my-event"><span style={{ minWidth: 0 }}><b>{e.title}</b><br /><span className="xs muted">{eventDate(e)}</span></span><span className={`pill ${STATUS[e.status][0]}`}>{STATUS[e.status][1]}{e.featured ? ' · Featured' : ''}</span></Link>)}
        {mine?.going?.length > 0 && <><h3 style={{ margin: '8px 0 0' }}>Going</h3>{mine.going.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="link small">{e.title} · {eventDate(e)}</Link>)}</>}
      </div>

      <div className="row">
        <Link className="btn outline" to="/messages"><Icon name="message" size={16} /> Messages</Link>
        {me.is_admin && <Link className="btn dark" to="/admin"><Icon name="lock" size={16} /> Admin panel</Link>}
        <button className="btn ghost" onClick={logout}><Icon name="logout" size={16} /> Log out</button>
      </div>
      <p className="xs muted">Want your data or account deleted? Email <a className="link" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.</p>
    </div>
  );
}
