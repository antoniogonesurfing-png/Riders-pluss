import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sheet from './Sheet.jsx';
import Icon from './Icons.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

const REASONS = {
  swipes: 'You have used your daily likes on Basic.',
  likedYou: 'Seeing who liked you before you match is a Plus feature.',
  level: 'Filtering riders by level is a Plus feature.',
  island: 'Filtering riders by island is a Plus feature.',
  photos: 'Basic profiles can have up to 3 photos.',
  event_posts: 'Basic includes 1 free event post per month.',
  general: 'Plus will unlock extra features as Riders Plus grows.',
};

export default function PlusSheet({ feature, onClose }) {
  const { me, usage, setUsage, config } = useApp();
  const [busy, setBusy] = useState(false);
  const basic = config.tiers.basic;
  const notify = async () => {
    setBusy(true);
    try { const r = await api('/plus/notify', { method: 'POST', body: { feature } }); setUsage(r.usage); } finally { setBusy(false); }
  };
  return (
    <Sheet title="Plus: upgrade coming soon" onClose={onClose} label="Upgrade coming soon">
      <p className="muted">{REASONS[feature] || REASONS.general} Sign-up and matching stay free. Plus is not on sale yet, so there is nothing to pay.</p>
      <div className="grid two">
        <div className="card flat"><div className="eyebrow">Basic · Free</div>
          <ul className="list small">
            <li>{basic.dailySwipeLimit} likes or passes per day</li>
            <li>Filter riders by sport</li>
            <li>Up to {basic.maxProfilePhotos} profile photos</li>
            <li>{basic.freeEventPostsPerMonth} free event post per month</li>
            <li>Matching and chat</li>
          </ul></div>
        <div className="card flat" style={{ borderColor: 'var(--primary)' }}><div className="eyebrow"><span className="pill plus">PLUS</span> Coming soon</div>
          <ul className="plus-list small" style={{ margin: 0 }}>
            {config.plusFeatures.map((f) => <li key={f}><Icon name="check" size={16} /> {f}</li>)}
          </ul></div>
      </div>
      <div style={{ marginTop: 16 }}>
        {!me ? <Link className="btn primary block" to="/signup" onClick={onClose}>Join free to get notified</Link>
          : usage?.onPlusWaitlist ? <div className="notice success" data-testid="plus-on-list"><b>You're on the list.</b> We'll let you know when Plus launches.</div>
            : <button className="btn primary block" onClick={notify} disabled={busy} data-testid="plus-notify">Notify me when Plus launches</button>}
        <p className="xs muted" style={{ marginTop: 8 }}>We only use this to tell you about Plus. You can ask us to remove you any time at {config.contactEmail}.</p>
      </div>
    </Sheet>
  );
}

export function PlusBadge() { return <span className="pill plus" title="Plus feature">PLUS</span>; }
