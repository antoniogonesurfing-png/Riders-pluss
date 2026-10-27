import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

function useNext() { const [sp] = useSearchParams(); const n = sp.get('next'); return n && n.startsWith('/') ? n : '/'; }

export function Login() {
  const { setMe, setUsage } = useApp();
  const nav = useNavigate(); const next = useNext();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api('/auth/login', { method: 'POST', body: f }); setMe(r.user); setUsage(r.usage); nav(next === '/' && r.user.is_admin ? '/admin' : next); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="page-narrow" style={{ maxWidth: 440 }}>
      <h1>Welcome back</h1>
      <form className="card stack" onSubmit={submit} data-testid="login-form">
        <label className="field"><span>Email</span><input className="input" type="email" name="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
        <label className="field"><span>Password</span><input className="input" type="password" name="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></label>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn primary block" type="submit">Log in</button>
        <p className="small muted" style={{ margin: 0 }}>New here? <Link className="link" to={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>Join free</Link></p>
      </form>
    </div>
  );
}

export function Signup() {
  const { setMe, setUsage, config } = useApp();
  const nav = useNavigate(); const next = useNext();
  const [f, setF] = useState({ name: '', email: '', password: '', birthdate: '', island: 'Fuerteventura', sports: [], level: 'Beginner', bio: '', acceptTerms: false, marketingOptIn: false });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleSport = (s) => setF({ ...f, sports: f.sports.includes(s) ? f.sports.filter((x) => x !== s) : [...f.sports, s] });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await api('/auth/signup', { method: 'POST', body: f }); setMe(r.user); setUsage(r.usage); nav(next === '/' ? '/riders' : next); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="page-narrow">
      <h1>Join Riders Plus</h1>
      <p className="muted">Free to join, free to match. Surfers, kiters, riders, runners and sailors around the Canary Islands.</p>
      <form className="card stack" onSubmit={submit} data-testid="signup-form">
        <div className="form-grid two">
          <label className="field"><span>Name</span><input className="input" name="name" autoComplete="name" value={f.name} onChange={up('name')} required /></label>
          <label className="field"><span>Email</span><input className="input" type="email" name="email" autoComplete="email" value={f.email} onChange={up('email')} required /></label>
          <label className="field"><span>Password (8+ characters)</span><input className="input" type="password" name="password" autoComplete="new-password" minLength={8} value={f.password} onChange={up('password')} required /></label>
          <label className="field"><span>Date of birth (18+)</span><input className="input" type="date" name="birthdate" value={f.birthdate} onChange={up('birthdate')} required max={new Date().toISOString().slice(0, 10)} /></label>
          <label className="field"><span>Home island</span><select className="input" name="island" value={f.island} onChange={up('island')}>{config.islands.map((i) => <option key={i}>{i}</option>)}</select></label>
          <label className="field"><span>Your level</span><select className="input" name="level" value={f.level} onChange={up('level')}>{config.levels.map((i) => <option key={i}>{i}</option>)}</select></label>
        </div>
        <div className="field"><span className="label">Sports</span><div className="chips" style={{ flexWrap: 'wrap' }}>{config.sports.map((s) => <button type="button" key={s} className={`chip ${f.sports.includes(s) ? 'active' : ''}`} onClick={() => toggleSport(s)} aria-pressed={f.sports.includes(s)}>{s}</button>)}</div></div>
        <label className="field"><span>Short bio (optional)</span><textarea className="input" name="bio" value={f.bio} onChange={up('bio')} maxLength={500} style={{ minHeight: 80 }} /></label>
        <label className="check"><input type="checkbox" name="acceptTerms" checked={f.acceptTerms} onChange={up('acceptTerms')} required /><span className="small">I'm 18 or over and I accept the <Link className="link" to="/guidelines">community guidelines</Link>, <Link className="link" to="/terms">terms</Link> and <Link className="link" to="/privacy">privacy policy</Link>.</span></label>
        <label className="check"><input type="checkbox" name="marketingOptIn" checked={f.marketingOptIn} onChange={up('marketingOptIn')} /><span className="small">Optional: Ride With Us Retreats may email me about future Riders Plus news and launches. I can opt out any time.</span></label>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn primary block" disabled={busy} type="submit">Create free account</button>
        <p className="small muted" style={{ margin: 0 }}>Already riding with us? <Link className="link" to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
