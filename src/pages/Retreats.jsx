import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { RetreatCard } from '../components/Cards.jsx';
import { api } from '../api.js';

export default function Retreats() {
  const [list, setList] = useState(null);
  const [region, setRegion] = useState('All');
  useEffect(() => { api('/retreats').then((r) => setList(r.retreats)).catch(() => setList([])); }, []);
  const shown = (list || []).filter((r) => region === 'All' || r.region === region || (region === 'Sailing' && r.kind === 'Sailing'));
  return (
    <div>
      <div className="eyebrow">Trips & retreats</div>
      <h1>Retreats</h1>
      <p className="muted">Multi-day trips and experiences from verified hosts. Every booking is a request: the provider confirms availability and the final price by email before any payment.</p>
      <Link to="/providers/ride-with-us-retreats" className="card card-link row" style={{ flexWrap: 'nowrap', marginTop: 12 }}>
        <span className="ic" style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="wave" /></span>
        <div style={{ minWidth: 0 }}><b>Ride With Us Retreats</b> <span className="verified"><Icon name="shield" size={14} /> Verified provider</span><div className="small muted">Fuerteventura · surf coaching & adventures worldwide</div></div>
      </Link>
      <div className="chips" style={{ margin: '18px 0 12px' }}>
        {['All', 'Canary Islands', 'Worldwide', 'Sailing'].map((r) => <button key={r} className={`chip ${region === r ? 'active' : ''}`} onClick={() => setRegion(r)}>{r}</button>)}
      </div>
      {!list ? <p className="muted">Loading…</p> : <div className="grid three">{shown.map((r) => <RetreatCard key={r.slug} r={r} />)}</div>}
      <p className="xs muted" style={{ marginTop: 16 }}>Riders Plus is a networking platform. Trips are run by the independent provider named on each listing. Details and photos come from the provider's own website.</p>
    </div>
  );
}
