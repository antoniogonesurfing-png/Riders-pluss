import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { RetreatCard } from '../components/Cards.jsx';
import { api } from '../api.js';

export default function Provider() {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/providers/${slug}`).then(setD).catch((e) => setErr(e.message)); }, [slug]);
  if (err) return <div className="card empty">{err}</div>;
  if (!d) return <p className="muted">Loading…</p>;
  const p = d.provider;
  return (
    <div className="stack">
      <div className="cover" style={{ aspectRatio: '21/8' }}>{p.image && <img src={p.image} alt="Guest riding a clean turquoise wave in Fuerteventura" />}</div>
      <div>
        <div className="eyebrow">Retreat provider</div>
        <h1 style={{ marginBottom: 4 }}>{p.name}</h1>
        {p.verified && <span className="verified"><Icon name="shield" size={16} /> Verified provider</span>}
        <p className="muted" style={{ marginTop: 8 }}>{p.tagline} · {p.location}</p>
        <p>{p.about}</p>
        <div className="row"><a className="btn primary" href={`mailto:${p.email}`}><Icon name="mail" size={16} /> {p.email}</a><a className="btn outline" href={p.website} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Website</a></div>
      </div>
      <h2 style={{ marginTop: 10 }}>All trips & experiences ({d.retreats.length})</h2>
      <div className="grid three">{d.retreats.map((r) => <RetreatCard key={r.slug} r={{ ...r, provider_name: p.name }} />)}</div>
    </div>
  );
}
