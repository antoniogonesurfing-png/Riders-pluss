import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import Avatar from '../components/Avatar.jsx';
import { NeedLogin } from '../components/Cards.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function Chat() {
  const { id } = useParams();
  const { me, openFeedback } = useApp();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [text, setText] = useState('');
  const body = useRef(null);
  useEffect(() => {
    if (!me) return undefined;
    let alive = true;
    const load = () => api(`/matches/${id}/messages`).then((r) => alive && setD(r)).catch((e) => alive && setErr(e.message));
    load();
    const t = setInterval(load, 1500);
    return () => { alive = false; clearInterval(t); };
  }, [id, me]);
  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [d?.messages?.length, d?.typing]);
  if (!me) return <NeedLogin what="chat" />;
  if (err) return <div className="card empty">{err}</div>;
  if (!d) return <p className="muted">Loading chat…</p>;
  const other = d.match.with;
  const send = async (e) => {
    e.preventDefault();
    const b = text.trim(); if (!b) return;
    setText('');
    setD((x) => ({ ...x, messages: [...x.messages, { id: `tmp${Date.now()}`, sender_id: me.id, body: b, created_at: new Date().toISOString() }], typing: other.is_bot }));
    await api(`/matches/${id}/messages`, { method: 'POST', body: { body: b } });
  };
  const time = (s) => { const dt = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`); return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  return (
    <div className="chat">
      <div className="chat-head">
        <Link to="/messages" className="icon-btn" aria-label="Back to messages"><Icon name="arrowLeft" /></Link>
        <Avatar user={other} size={44} />
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 6 }}><b>{other.name}</b>{other.is_bot && <span className="pill bot">TEST BOT</span>}</div>
          <Link to={`/riders/${other.id}`} className="xs link">View profile</Link>
        </div>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={openFeedback} aria-label="Report a bug or suggest a feature" data-testid="feedback-chat"><Icon name="bug" size={18} /></button>
      </div>
      <div className="chat-body" ref={body} data-testid="chat-body">
        {other.is_bot && <div className="notice xs" style={{ alignSelf: 'center', textAlign: 'center' }}>You're chatting with a test bot. Replies are scripted, not a real person.</div>}
        {d.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender_id === me.id ? 'me' : 'them'}`} data-testid={m.sender_id === me.id ? 'msg-me' : 'msg-them'}>
            {m.body}<time>{time(m.created_at)}</time>
          </div>
        ))}
        {d.typing && <div className="typing" aria-label={`${other.name} is typing`} data-testid="typing"><i /><i /><i /></div>}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={other.is_bot ? 'Ask about spots, gear, conditions…' : 'Write a message'} aria-label="Message" data-testid="chat-input" />
        <button className="btn primary" type="submit" data-testid="chat-send">Send</button>
      </form>
    </div>
  );
}
