import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons.jsx';
import { EventCard, RetreatCard } from '../components/Cards.jsx';
import { api } from '../api.js';
import { useApp } from '../ctx.js';

const HERO = 'https://www.ridewithusretreats.com/__l5e/assets-v1/ca008902-dbb9-47eb-802d-1f6ec964543a/DS43001.jpg';

export default function Home() {
  const { config } = useApp();
  const [h, setH] = useState(null);
  const [q, setQ] = useState('');
  const [where, setWhere] = useState('');
  const nav = useNavigate();
  useEffect(() => { api('/highlights').then(setH).catch(() => {}); }, []);
  const search = (e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(q)}&where=${encodeURIComponent(where)}`); };
  const mail = `mailto:${config.contactEmail}?subject=${encodeURIComponent('Riders Plus: register or feature my event')}`;
  return (
    <div>
      <div className="banner" data-testid="event-banner">
        <p>Would you like your event registered here or featured? Get in touch.</p>
        <div className="row">
          <a className="btn outline sm" href={mail}><Icon name="mail" size={16} /> Get in touch</a>
          <Link className="btn primary sm" to="/events/new"><Icon name="plus" size={16} /> Post an event</Link>
        </div>
      </div>

      <section className="hero" style={{ '--hero': `url(${HERO})` }}>
        <span className="pill primary" style={{ alignSelf: 'flex-start', letterSpacing: '.08em' }}>RIDE WITH US</span>
        <h1 style={{ marginTop: 10 }}>Find your crew. Find your event.</h1>
        <p>Canary Islands events, Ride With Us retreats, and riders to share a session with. Starting in Fuerteventura.</p>
        <form className="searchbox" onSubmit={search} role="search">
          <label className="row" style={{ gap: 6, flexWrap: 'nowrap', paddingLeft: 10 }}><Icon name="search" /><span className="sr-only">What</span><input className="input" placeholder="What? surf, music, sailing…" value={q} onChange={(e) => setQ(e.target.value)} name="q" /></label>
          <label className="row" style={{ gap: 6, flexWrap: 'nowrap', paddingLeft: 10 }}><Icon name="pin" /><span className="sr-only">Where</span><input className="input" placeholder="Where? Corralejo, Lanzarote…" value={where} onChange={(e) => setWhere(e.target.value)} name="where" /></label>
          <button className="btn primary" type="submit">Search</button>
        </form>
      </section>

      <section className="section">
        <div className="tiles">
          <Link to="/events" className="tile"><span className="ic"><Icon name="calendar" /></span><div><h3>Events</h3><p>Fiestas, music, markets and sport across the islands</p></div></Link>
          <Link to="/retreats" className="tile"><span className="ic"><Icon name="tent" /></span><div><h3>Retreats</h3><p>Ride With Us trips: Fuerteventura to the Mentawais</p></div></Link>
          <Link to="/riders" className="tile"><span className="ic"><Icon name="users" /></span><div><h3>Find your rider</h3><p>Swipe to meet people who ride what you ride</p></div></Link>
          <Link to="/groms" className="tile hot"><span className="ic"><Icon name="heart" /></span><div><h3>Sponsor a Grom</h3><p>Help young local riders get on the water</p></div></Link>
        </div>
      </section>

      {h?.featured?.length > 0 && (
        <section className="section">
          <div className="section-head"><div><div className="eyebrow">Featured</div><h2>Featured events</h2></div><Link to="/events" className="link">All events</Link></div>
          <div className="grid two">{h.featured.map((e) => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}

      {h?.retreats?.length > 0 && (
        <section className="section">
          <div className="section-head"><div><div className="eyebrow">Highlights · Verified provider</div><h2>Ride With Us retreats</h2></div><Link to="/retreats" className="link">See all</Link></div>
          <div className="hscroll">{h.retreats.map((r) => <RetreatCard key={r.slug} r={r} compact />)}</div>
        </section>
      )}

      {h?.upcoming?.length > 0 && (
        <section className="section">
          <div className="section-head"><div><div className="eyebrow">Coming up in Fuerteventura</div><h2>Next on the island</h2></div><Link to="/events" className="link">Calendar</Link></div>
          <div className="grid two">{h.upcoming.map((e) => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}

      {h?.islands?.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Browse by island</h2></div>
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {h.islands.map((i) => <Link key={i.island} className="chip" to={`/events?island=${encodeURIComponent(i.island)}&month=all`}>{i.island} <span className="count">{i.c}</span></Link>)}
          </div>
        </section>
      )}

      <section className="section card" style={{ background: 'var(--secondary)', borderColor: 'transparent' }}>
        <div className="grid two-lg" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Find your rider</div>
            <h2>Swipe up to ride together</h2>
            <p className="muted">Up to like, down to pass. A mutual like opens a chat. It's a connection, not a date. Test it now with our clearly labelled test bots.</p>
            <Link className="btn primary" to="/riders">Start swiping</Link>
          </div>
          <ul className="list muted small">
            <li>Free to join, free to match</li>
            <li>18+ only for crew matching</li>
            <li>Meet in public, tell someone where you're going</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
