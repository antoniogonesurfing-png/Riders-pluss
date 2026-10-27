import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sheet from './Sheet.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function FeedbackSheet({ onClose }) {
  const { me } = useApp();
  const loc = useLocation();
  const [kind, setKind] = useState('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/feedback', { method: 'POST', body: { kind, message, email, page: loc.pathname + loc.search } }); setDone(true); } catch (x) { setErr(x.message); }
  };
  return (
    <Sheet title="Report a bug / suggest a feature" onClose={onClose}>
      {done ? (
        <div className="stack"><div className="notice success" data-testid="feedback-done"><b>Thank you!</b> Your note is in our inbox. This test version of Riders Plus gets better with every report.</div>
          <button className="btn outline block" onClick={onClose}>Close</button></div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted small">Riders Plus is in testing before the main launch. Tell us what broke or what you'd love to see. Page: <code>{loc.pathname}</code></p>
          <div className="seg" role="radiogroup" aria-label="Type">
            {[['bug', 'Bug'], ['feature', 'Feature idea'], ['other', 'Other']].map(([k, l]) => <button type="button" key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)} aria-pressed={kind === k}>{l}</button>)}
          </div>
          <label className="field"><span>What happened, or what's your idea?</span><textarea className="input" name="message" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={5} /></label>
          {!me && <label className="field"><span>Email (optional, if you'd like a reply)</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
          {err && <div className="error">{err}</div>}
          <button className="btn primary block" type="submit">Send</button>
        </form>
      )}
    </Sheet>
  );
}
