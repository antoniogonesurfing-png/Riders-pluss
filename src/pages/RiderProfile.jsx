import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { RobotArt, PersonArt } from '../components/Avatar.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function RiderProfile() {
  const { id } = useParams();
  const { me } = useApp();
  const [u, setU] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (me) api(`/riders/${id}`).then((r) => setU(r.rider)).catch((e) => setErr(e.message)); }, [id, me]);
  if (!me) return <NeedLogin what="see rider profiles" />;
  if (err) return <div className="card empty">{err}</div>;
  if (!u) return <p className="muted">Loading…</p>;
  return (
    <div className="page-narrow stack">
      <Link to="/riders" className="link row" style={{ gap: 6 }}><Icon name="arrowLeft" size={16} /> Find your rider</Link>
      <div className="card media-card">
        <div className="media" style={{ aspectRatio: '1/1', background: u.avatar_color }}>{u.photos?.[0] ? <img src={u.photos[0]} alt={u.name} /> : u.is_bot ? <RobotArt color={u.avatar_color} seed={u.name} sport={u.sports?.[0]?.[0]} /> : <PersonArt color={u.avatar_color} seed={u.name} />}
          {u.is_bot && <div className="badges"><span className="pill bot" data-testid="bot-badge">🤖 TEST BOT</span></div>}</div>
        <div className="body">
          <h1 style={{ margin: 0 }}>{u.name}</h1>
          <div className="muted">{[u.town, u.island].filter(Boolean).join(', ')}{u.age ? ` · ${u.age}` : ''}</div>
          {u.is_bot && <div className="notice small">This is a <b>test bot</b>, not a real person. It's here so you can test matching and chat. It always likes you back and replies with simple scripted messages.</div>}
          <div className="row" style={{ gap: 6 }}>{u.sports.map(([s, l]) => <span key={s} className="pill">{s} · {l}</span>)}</div>
          {u.bio && <p style={{ margin: 0 }}>{u.bio}</p>}
          {u.photos?.length > 1 && <div className="photos">{u.photos.slice(1).map((p) => <div className="ph" key={p}><img src={p} alt="" /></div>)}</div>}
        </div>
      </div>
    </div>
  );
}
