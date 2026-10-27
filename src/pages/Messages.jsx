import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function Messages() {
  const { me } = useApp();
  const [list, setList] = useState(null);
  useEffect(() => { if (me) api('/matches').then((r) => setList(r.matches)).catch(() => setList([])); }, [me]);
  if (!me) return <NeedLogin what="see your messages" next="/messages" />;
  return (
    <div className="page-narrow stack">
      <h1>Messages</h1>
      {!list ? <p className="muted">Loading…</p> : list.length === 0 ? (
        <div className="card empty stack"><p>No matches yet. Swipe up on a rider. Test bots always like you back.</p><Link className="btn primary" to="/riders">Find your rider</Link></div>
      ) : list.map((m) => (
        <Link key={m.id} to={`/messages/${m.id}`} className="card card-link row" style={{ flexWrap: 'nowrap' }} data-testid="match-row">
          <Avatar user={m.with} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="row" style={{ gap: 6 }}><b>{m.with.name}</b>{m.with.is_bot && <span className="pill bot">TEST BOT</span>}</div>
            <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.last ? m.last.body : 'Say hi 👋'}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
