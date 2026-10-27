import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { PersonArt, sportEmoji } from '../components/Avatar.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

export default function Groms() {
  const { me, config } = useApp();
  const nav = useNavigate();
  const [ex, setEx] = useState([]);
  const blank = { guardianName: '', guardianEmail: '', guardianPhone: '', relationship: 'Parent', gromFirstName: '', gromAge: '', island: 'Fuerteventura', sport: 'Surf', story: '', needs: '', guardianIsAdult: false, guardianConsent: false };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [amount, setAmount] = useState(config.gromSponsorAmountsEur[1]);
  const [sErr, setSErr] = useState('');
  useEffect(() => { api('/groms/examples').then((r) => setEx(r.examples)).catch(() => {}); }, []);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const nominate = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/groms/nominate', { method: 'POST', body: f }); setSent(true); setF(blank); } catch (x) { setErr(x.message); }
  };
  const sponsor = async () => {
    setSErr('');
    if (!me) return nav('/login?next=/groms');
    try { const r = await api('/groms/sponsor', { method: 'POST', body: { amount } }); nav(r.checkoutUrl); } catch (x) { setSErr(x.message); }
  };
  return (
    <div className="stack">
      <div><div className="eyebrow">Community</div><h1>Sponsor a Grom</h1>
        <p className="muted">Help young riders in the Canary Islands get on the water: gear, coaching and travel to youth events. Run by Ride With Us Retreats.</p></div>

      <div className="grid three">
        {[['1', 'A guardian nominates', 'A parent or legal guardian tells us about a young rider (5–17) and what would help.'], ['2', 'We check & agree', 'We contact the guardian, confirm consent and agree what can be shared. Nothing is published without it.'], ['3', 'Sponsors chip in', 'Sponsors back the Grom fund. Support goes to gear, coaching and event travel, coordinated with the guardian.']].map(([n, t, d]) => (
          <div className="card" key={n}><span className="pill primary">Step {n}</span><h3 style={{ marginTop: 10 }}>{t}</h3><p className="small muted" style={{ margin: 0 }}>{d}</p></div>
        ))}
      </div>

      <section className="section">
        <h2>What a grom profile could look like</h2>
        <p className="small muted">These are illustrations to show the format. They are not real children.</p>
        <div className="grid three">
          {ex.map((g) => (
            <div className="card media-card" key={g.id} data-testid="grom-example">
              <div className="media" style={{ aspectRatio: '16/11' }}><PersonArt color={g.color} seed={g.name} kid /><div className="badges"><span className="pill warn">{g.label}</span></div></div>
              <div className="body"><h3 style={{ margin: 0 }}>{g.name} {sportEmoji(g.sport)}</h3><div className="xs muted">{g.sport} · age {g.age} · {g.island}</div><p className="small" style={{ margin: 0 }}>{g.story}</p><div className="xs"><b>Needs:</b> {g.needs}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section grid two-lg" style={{ alignItems: 'start' }}>
        <div className="card stack" id="sponsor">
          <h2 style={{ margin: 0 }}>Become a sponsor</h2>
          <p className="muted small">Back the Sponsor a Grom fund. <b>Test mode:</b> no real money is taken.</p>
          <div className="chips">{config.gromSponsorAmountsEur.map((a) => <button key={a} className={`chip ${amount === a ? 'active' : ''}`} onClick={() => setAmount(a)}>€{a}</button>)}</div>
          {sErr && <div className="error">{sErr}</div>}
          <button className="btn primary block" onClick={sponsor} data-testid="sponsor-btn"><Icon name="gift" size={18} /> Sponsor €{amount} (test)</button>
          <p className="xs muted">Businesses wanting to sponsor gear or a season: <a className="link" href={`mailto:${config.contactEmail}?subject=Sponsor%20a%20Grom`}>{config.contactEmail}</a></p>
        </div>

        <div className="card" id="nominate">
          <h2>Nominate a grom</h2>
          <p className="small muted">For parents and legal guardians only. We store this privately and only use it to contact you about the programme.</p>
          {sent ? <div className="notice success stack" data-testid="nomination-sent"><div><b>Thank you!</b> We'll contact the guardian by email before anything happens.</div><button className="btn outline sm" onClick={() => setSent(false)}>Nominate another</button></div> : (
            <form className="stack" onSubmit={nominate} data-testid="grom-form">
              <div className="form-grid two">
                <label className="field"><span>Guardian name</span><input className="input" name="guardianName" value={f.guardianName} onChange={up('guardianName')} required /></label>
                <label className="field"><span>Relationship</span><select className="input" name="relationship" value={f.relationship} onChange={up('relationship')}><option>Parent</option><option>Legal guardian</option></select></label>
                <label className="field"><span>Guardian email</span><input className="input" type="email" name="guardianEmail" value={f.guardianEmail} onChange={up('guardianEmail')} required /></label>
                <label className="field"><span>Guardian phone (optional)</span><input className="input" name="guardianPhone" value={f.guardianPhone} onChange={up('guardianPhone')} /></label>
                <label className="field"><span>Young rider's first name</span><input className="input" name="gromFirstName" value={f.gromFirstName} onChange={up('gromFirstName')} required /></label>
                <label className="field"><span>Age</span><input className="input" type="number" min="5" max="17" name="gromAge" value={f.gromAge} onChange={up('gromAge')} required /></label>
                <label className="field"><span>Island</span><select className="input" name="island" value={f.island} onChange={up('island')}>{config.islands.map((i) => <option key={i}>{i}</option>)}</select></label>
                <label className="field"><span>Sport</span><select className="input" name="sport" value={f.sport} onChange={up('sport')}>{config.sports.map((i) => <option key={i}>{i}</option>)}</select></label>
              </div>
              <label className="field"><span>Their story (no photos, school or address please)</span><textarea className="input" name="story" value={f.story} onChange={up('story')} /></label>
              <label className="field"><span>What would help?</span><input className="input" name="needs" value={f.needs} onChange={up('needs')} placeholder="e.g. wetsuit, coaching, travel to an event" /></label>
              <label className="check"><input type="checkbox" name="guardianIsAdult" checked={f.guardianIsAdult} onChange={up('guardianIsAdult')} /><span className="small">I am the parent or legal guardian of this young rider and I am 18 or over.</span></label>
              <label className="check"><input type="checkbox" name="guardianConsent" checked={f.guardianConsent} onChange={up('guardianConsent')} required /><span className="small"><b>Guardian consent (required):</b> I consent to Ride With Us Retreats storing these details to contact me about Sponsor a Grom. Nothing about my child is published without my separate written consent. I can withdraw at any time. See <Link className="link" to="/privacy">privacy</Link> and <Link className="link" to="/guidelines">safeguarding</Link>.</span></label>
              {err && <div className="error" role="alert">{err}</div>}
              <button className="btn primary block" type="submit">Send nomination</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
